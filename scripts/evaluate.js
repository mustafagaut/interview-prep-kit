const fs = require('fs');
const path = require('path');
const args = require('minimist')(process.argv.slice(2));

const inputFile = args.input;
const outputFile = args.output;

if (!inputFile || !outputFile) {
  console.error('Usage: npm run evaluate -- --input <cases.json> --output <kits.json>');
  process.exit(1);
}

async function runBatch() {
  const rawData = fs.readFileSync(path.resolve(inputFile), 'utf-8');
  const cases = JSON.parse(rawData);
  if (!Array.isArray(cases)) throw new Error('Input must be an array of evaluation cases');

  const results = [];

  for (const item of cases) {
    try {
      // Execute retrieval + LLM pipeline
      // Replace with actual pipeline service invocation
      const kitData = await processCasePipeline(item);
      results.push({
        id: item.id,
        status: 'ok',
        kit: kitData,
        error: null,
      });
    } catch (err) {
      results.push({
        id: item.id,
        status: 'failed',
        kit: null,
        error: {
          code: 'PROCESSING_ERROR',
          message: err.message || 'Pipeline processing failed',
        },
      });
    }
  }

  const outputPayload = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    kits: results,
  };

  fs.writeFileSync(path.resolve(outputFile), JSON.stringify(outputPayload, null, 2));
  console.log(`Successfully output ${results.length} cases to ${outputFile}`);
}

async function processCasePipeline(item) {
  if (!item || typeof item !== 'object' || typeof item.jd !== 'string' || !item.jd.trim()) {
    throw new Error('Each case requires a non-empty jd');
  }
  if (typeof item.company_url !== 'string' || !item.company_url.trim()) {
    throw new Error('Each case requires company_url');
  }

  const { generateKit } = await import('../server/src/services/pipeline.ts');
  return generateKit({
    jd: item.jd,
    company_url: item.company_url,
    days: Number.isFinite(Number(item.days)) ? Number(item.days) : 1,
    company: item.company,
    role: item.role,
    location: item.location,
  });
}

runBatch();