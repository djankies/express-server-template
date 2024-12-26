import { existsSync } from 'fs';
import { copyFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');

async function setupEnv() {
  const source = join(rootDir, '.env.example');
  const target = join(rootDir, '.env');

  try {
    // Check if .env already exists
    if (existsSync(target)) {
      console.info('\x1b[33m%s\x1b[0m', '.env file already exists. Skipping...');
      return;
    }

    // Copy .env.example to .env
    await copyFile(source, target);
    console.info('\x1b[32m%s\x1b[0m', '.env file created successfully!');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error creating .env file:', error.message);
    process.exit(1);
  }
}

setupEnv();
