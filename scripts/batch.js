#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import { generateKit } from '../server/src/services/pipeline.js';

interface BatchInput {
  id: string;
  jd: string;
  company_url: string;
  days: number;
}

interface BatchOutput {
  [key: string]: {
    status: 'ok' | 'failed';
    kit?: any;
    error?: string;
  };
}

async function runBatch(inputPath: string, outputPath: string): Promise<void> {
  console.log(`Reading input from: ${inputPath}`);
  
  // Read input file
  const inputData = fs.readFileSync(inputPath, 'utf-8');
  const cases: BatchInput[] = JSON.parse(inputData);
  
  console.log(`Processing ${cases.length} cases...`);
  
  const results: BatchOutput = {};
  const startTime = Date.now();
  
  for (const testCase of cases) {
    console.log(`Processing case ${testCase.id}...`);
    
    try {
      const kit = await generateKit({
        jd: testCase.jd,
        company_url: testCase.company_url,
        days: testCase.days,
      });
      
      results[testCase.id] = {
        status: 'ok',
        kit
      };
      
      console.log(`Case ${testCase.id} completed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Case ${testCase.id} failed: ${errorMessage}`);
      
      results[testCase.id] = {
        status: 'failed',
        error: errorMessage
      };
    }
  }
  
  const duration = (Date.now() - startTime) / 1000;
  console.log(`Batch processing completed in ${duration.toFixed(2)} seconds`);
  
  // Write output file
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Results written to: ${outputPath}`);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node batch.js <input-file> <output-file>');
  process.exit(1);
}

const [inputFile, outputFile] = args;

// Run batch processing
runBatch(inputFile, outputFile)
  .then(() => {
    console.log('Batch processing completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Batch processing failed:', error);
    process.exit(1);
  });
