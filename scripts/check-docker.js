/* eslint-disable no-unused-vars */
import { exec } from 'child_process';
import { platform } from 'os';
import readline from 'readline';
import { promisify } from 'util';
import { installDocker } from './install-docker.js';

const execAsync = promisify(exec);

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function promptForInstall() {
  const rl = createInterface();

  try {
    const answer = await new Promise(resolve => {
      rl.question('\x1b[33mWould you like to install Docker now? (y/N): \x1b[0m', resolve);
    });

    return answer.toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}

async function startDockerDaemon() {
  const os = platform();

  if (os === 'darwin') {
    try {
      console.info('\x1b[34mℹ Attempting to start Docker...\x1b[0m');
      await execAsync('open -a Docker');

      // Wait for Docker to start (max 30 seconds)
      for (let i = 0; i < 30; i++) {
        try {
          await execAsync('docker info');
          console.info('\x1b[32m✓ Docker started successfully\x1b[0m');
          return true;
        } catch {
          // Wait 1 second before trying again
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      throw new Error('Timeout waiting for Docker to start');
    } catch (error) {
      console.error('\x1b[31m✗ Failed to start Docker:\x1b[0m', error.message);
      return false;
    }
  } else {
    console.info('\x1b[33m! Automatic Docker startup is only supported on macOS\x1b[0m');
    console.info('\x1b[34mℹ Please start Docker manually and try again\x1b[0m');
    return false;
  }
}

async function checkDocker() {
  try {
    // Check Docker version
    await execAsync('docker --version');
    console.info('\x1b[32m✓ Docker is installed\x1b[0m');

    // Check Docker Compose using new syntax
    try {
      await execAsync('docker compose version');
      console.info('\x1b[32m✓ Docker Compose (V2) is installed\x1b[0m');
    } catch (error) {
      // Try legacy command as fallback
      try {
        await execAsync('docker-compose version');
        console.info('\x1b[33m! Using legacy Docker Compose (V1)\x1b[0m');
        console.info('\x1b[34mℹ Consider upgrading to Docker Compose V2\x1b[0m');
      } catch {
        throw new Error('Docker Compose is not installed');
      }
    }

    // Check if Docker daemon is running
    try {
      await execAsync('docker info');
      console.info('\x1b[32m✓ Docker daemon is running\x1b[0m');
      return true;
    } catch {
      console.info('\x1b[33m! Docker daemon is not running\x1b[0m');
      if (await startDockerDaemon()) {
        return true;
      } else {
        console.error('\x1b[31m✗ Docker check failed:\x1b[0m');
        console.error(
          '\x1b[33mDocker daemon is not running. Please start Docker and try again.\x1b[0m',
        );
        return false;
      }
    }
  } catch (error) {
    console.error('\x1b[31m✗ Docker check failed:\x1b[0m');

    if (error.message.includes('command not found')) {
      console.error('\x1b[33mDocker is not installed.\x1b[0m');

      if (await promptForInstall()) {
        await installDocker();
        // Recheck after installation
        return checkDocker();
      }
    } else {
      console.error('\x1b[33m', error.message, '\x1b[0m');
    }

    return false;
  }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDocker().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

export { checkDocker };
