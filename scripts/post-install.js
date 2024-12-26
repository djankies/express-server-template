/* eslint-disable no-unused-vars */
import { exec, spawn } from 'child_process';
import { writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { installExtensions } from './install-extensions.js';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

async function setupHusky() {
  try {
    console.info('\x1b[34mInitializing Husky...\x1b[0m');

    // Initialize Husky
    await execAsync('npx husky init');

    // Create pre-commit hook with our desired contents
    const preCommitPath = join(rootDir, '.husky', 'pre-commit');
    const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm test
`;

    await writeFile(preCommitPath, preCommitContent, { mode: 0o755 });
    console.info('\x1b[32m✓ Husky initialized with pre-commit hook\x1b[0m');

    return true;
  } catch (error) {
    console.error('\x1b[31m✗ Husky setup failed:\x1b[0m', error.message);
    return false;
  }
}

async function checkDockerSoftly() {
  try {
    // Only check if Docker is installed, don't check if it's running
    await execAsync('docker --version');
    console.info('\x1b[32m✓ Docker is installed\x1b[0m');

    await execAsync('docker compose version');
    console.info('\x1b[32m✓ Docker Compose is installed\x1b[0m');

    // Try to check if Docker daemon is running, but don't fail if it isn't
    try {
      await execAsync('docker info');
      console.info('\x1b[32m✓ Docker daemon is running\x1b[0m');
    } catch (error) {
      console.info('\x1b[33m! Docker is installed but not running\x1b[0m');
      console.info('\x1b[34mℹ Start Docker when you want to use Docker-related features\x1b[0m');
    }

    return true;
  } catch (error) {
    if (error.message.includes('command not found')) {
      console.info('\x1b[33m! Docker is not installed\x1b[0m');
      console.info('\x1b[34mℹ You can install Docker later with: npm run docker:install\x1b[0m');
    }
    return false;
  }
}

async function runSetup() {
  // Skip post-install in Docker container
  if (process.env.SKIP_POST_INSTALL === 'true') {
    console.info('\x1b[34mℹ Skipping post-install setup in Docker container\x1b[0m');
    return;
  }

  console.info('\x1b[34m🚀 Running post-installation setup...\x1b[0m');

  try {
    // Step 1: Run environment setup
    console.info('\n\x1b[34m📝 Setting up environment...\x1b[0m');
    await runCommand('node', ['scripts/setup-env.js'], 'Environment setup');

    // Step 2: Setup Husky
    console.info('\n\x1b[34m🐶 Setting up Git hooks...\x1b[0m');
    await setupHusky();

    // Step 3: Check Docker installation (but don't fail if not present)
    console.info('\n\x1b[34m🐳 Checking Docker installation...\x1b[0m');
    await checkDockerSoftly();

    // Step 4: Install VS Code extensions
    console.info('\n\x1b[34m🔧 Setting up VS Code extensions...\x1b[0m');
    await installExtensions();

    console.info('\n\x1b[32m✨ Post-installation setup completed successfully!\x1b[0m');
    console.info('\x1b[34mYou can now start the development server with:\x1b[0m');
    console.info('\x1b[33mnpm run dev\x1b[0m');
    console.info('\x1b[34mor with Docker (after starting Docker):\x1b[0m');
    console.info('\x1b[33mnpm run docker:dev\x1b[0m\n');
  } catch (error) {
    console.error('\n\x1b[31m❌ Post-installation setup failed:\x1b[0m', error.message);
    throw error;
  }
}

function runCommand(command, args, label) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
    });

    proc.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${label} failed with code ${code}`));
      }
    });

    proc.on('error', err => {
      reject(new Error(`${label} failed: ${err.message}`));
    });
  });
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runSetup().catch(() => process.exit(1));
}

export { runSetup };
