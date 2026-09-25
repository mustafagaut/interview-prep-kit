import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export interface CrawlResult {
  pagesUsed: string[];
  content: string;
  searchContent: string;
  searchSources: string[];
}

const USER_AGENT = 'PrepKitBot/1.0';
const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB max content size
const ALLOWED_CONTENT_TYPES = ['text/html', 'text/plain', 'application/xhtml+xml', 'text/xml'];

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Reject private and loopback addresses
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.') ||
        hostname.startsWith('0.') ||
        hostname.startsWith('127.') ||
        hostname.startsWith('169.254.')) {
      return false;
    }
    
    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

function isAllowedContentType(contentType?: string): boolean {
  if (!contentType) return false;
  const normalized = contentType.toLowerCase();
  return ALLOWED_CONTENT_TYPES.some(allowed => normalized.includes(allowed));
}

async function fetchWithRetry(url: string, timeout: number, attempts = 3): Promise<{ data: string; contentType?: string }> {
  if (!isValidUrl(url)) {
    throw new Error(`Invalid or restricted URL: ${url}`);
  }
  
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await axios.get<string>(url, {
        timeout,
        headers: { 'User-Agent': USER_AGENT },
        validateStatus: status => status >= 200 && status < 400,
        maxContentLength: MAX_CONTENT_SIZE,
        responseType: 'text',
      });
      
      const rawContentType = response.headers['content-type'];
      const contentType = String(rawContentType ?? '');
      if (!isAllowedContentType(contentType || '')) {
        throw new Error(`Content type not allowed: ${contentType}`);
      }
      
      return { data: response.data, contentType };
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        const delay = Math.min(250 * 2 ** attempt, 5000); // Cap at 5 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Unable to fetch ${url}`);
}

async function isAllowedByRobots(targetUrl: URL): Promise<boolean> {
  try {
    const robotsUrl = new URL('/robots.txt', targetUrl.origin).toString();
    const response = await fetchWithRetry(robotsUrl, 3000, 2);
    let applies = false;
    for (const rawLine of response.data.split(/\r?\n/)) {
      const line = rawLine.split('#')[0]?.trim();
      if (!line) continue;
      const [directive, value = ''] = line.split(':', 2).map(part => part.trim().toLowerCase());
      if (directive === 'user-agent') applies = value === '*' || value === USER_AGENT.toLowerCase();
      if (applies && directive === 'disallow' && value && targetUrl.pathname.startsWith(value)) return false;
    }
  } catch {
    // A missing robots file does not prevent a public page from being fetched.
  }
  return true;
}

function extractText(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript, template, svg').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

export async function crawlCompanySite(targetUrl: string): Promise<CrawlResult> {
  const pagesUsed: string[] = [];
  let combinedContent = '';
  let searchContent = '';
  const searchSources: string[] = [];
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return { pagesUsed, content: 'Invalid company URL.', searchContent, searchSources };
  }
  
  if (!isValidUrl(targetUrl)) {
    return { pagesUsed, content: 'Invalid or restricted company URL.', searchContent, searchSources };
  }

  try {
    // 1. Validate and clean target URL
    // 2. Fetch main landing page
    if (!(await isAllowedByRobots(parsedUrl))) throw new Error('Crawl disallowed by robots.txt');

    const response = await fetchWithRetry(targetUrl, 8000);
    pagesUsed.push(targetUrl);

    const $ = cheerio.load(response.data);
    combinedContent += extractText(response.data).slice(0, 3000);

    // 3. Extract and rank high-value links (e.g., /careers, /jobs, /about, /engineering)
    const candidates: { url: string; score: number }[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      try {
        const absoluteUrl = new URL(href, targetUrl).toString();
        const lowerHref = href.toLowerCase();
        let score = 0;

        if (lowerHref.includes('career') || lowerHref.includes('job')) score += 10;
        if (lowerHref.includes('about') || lowerHref.includes('team')) score += 5;
        if (lowerHref.includes('culture') || lowerHref.includes('engineering')) score += 5;

        if (score > 0 && absoluteUrl.startsWith(parsedUrl.origin)) {
          candidates.push({ url: absoluteUrl, score });
        }
      } catch {
        // Skip invalid links
      }
    });

    // 4. Crawl top candidate link if found
    candidates.sort((a, b) => b.score - a.score);
    const topCandidate = candidates[0];
    if (topCandidate && topCandidate.url !== targetUrl && await isAllowedByRobots(new URL(topCandidate.url))) {
      try {
        const subRes = await fetchWithRetry(topCandidate.url, 5000);
        pagesUsed.push(topCandidate.url);
        combinedContent += ` ${extractText(subRes.data).slice(0, 3000)}`;
      } catch {
        // Skip link failure without breaking the run
      }
    }
  } catch (err: any) {
    // Record unreachable site gracefully
    console.warn(`Crawl warning for ${targetUrl}: ${err.message}`);
  }

  try {
    const companyName = parsedUrl.hostname.replace(/^www\./, '');
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${companyName} interview process culture`)}`;
    const response = await fetchWithRetry(searchUrl, 5000, 2);
    const $ = cheerio.load(response.data);
    $('.result__snippet, .result__title').each((_, element) => {
      const text = $(element).text().replace(/\s+/g, ' ').trim();
      if (text) searchContent += `${text} `;
    });
    $('.result__a').slice(0, 5).each((_, element) => {
      const href = $(element).attr('href');
      if (href && /^https?:\/\//i.test(href)) searchSources.push(href);
    });
  } catch {
    // Public search is supplementary and must not fail kit generation.
  }

  return {
    pagesUsed,
    content: combinedContent.trim() || 'No public site information retrieved.',
    searchContent: searchContent.trim(),
    searchSources,
  };
}