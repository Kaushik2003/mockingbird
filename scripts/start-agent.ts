import { exec } from 'child_process'

console.log('Starting treasury agent...')

// Check if wallet exists
import { existsSync, readFileSync } from 'fs';

console.log('Starting treasury agent...');

// Check if PRIVATE_KEY exists in .env
if (!existsSync('.env') || !readFileSync('.env', 'utf8').includes('PRIVATE_KEY=')) {
  console.error('PRIVATE_KEY not found in .env. Please run:');
  console.error('npx ts-node scripts/generate-wallet.ts');
  console.error('Then add the PRIVATE_KEY to your .env file');
  process.exit(1);
}

// Start main monitoring loop
exec('npx ts-node src/main.ts', (error) => {
    if (error) {
      console.error(`Agent failed: ${error.message}`)
      return
    }
  })
})