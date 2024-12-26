import { exec, spawn } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);
const os = platform();

const INSTALL_GUIDES = {
  darwin: 'https://docs.docker.com/desktop/install/mac-install/',
  win32: 'https://docs.docker.com/desktop/install/windows-install/',
  linux: 'https://docs.docker.com/engine/install/',
};

const BREW_INSTALL_COMMAND = 'brew install --cask docker';
const APT_INSTALL_COMMANDS = [
  'sudo apt-get update',
  'sudo apt-get install -y docker.io docker-compose',
  'sudo systemctl start docker',
  'sudo systemctl enable docker',
  'sudo usermod -aG docker $USER',
];

function openBrowser(url) {
  const command =
    {
      darwin: 'open',
      win32: 'start',
      linux: 'xdg-open',
    }[os] || 'xdg-open';

  spawn(command, [url], { stdio: 'ignore' });
}

async function installDocker() {
  console.info('\x1b[34m🐳 Starting Docker installation process...\x1b[0m');

  try {
    switch (os) {
      case 'darwin':
        await handleMacInstall();
        break;
      case 'linux':
        await handleLinuxInstall();
        break;
      case 'win32':
        await handleWindowsInstall();
        break;
      default:
        console.error('\x1b[31mUnsupported operating system\x1b[0m');
        process.exit(1);
    }
  } catch (error) {
    console.error('\x1b[31mInstallation failed:\x1b[0m', error.message);
    console.info('\x1b[33mPlease try manual installation:\x1b[0m', INSTALL_GUIDES[os]);
    openBrowser(INSTALL_GUIDES[os]);
    process.exit(1);
  }
}

async function handleMacInstall() {
  try {
    // Check if Homebrew is installed
    await execAsync('which brew');
    console.info('\x1b[32m✓ Homebrew is installed\x1b[0m');

    // Install Docker using Homebrew
    console.info('\x1b[34mInstalling Docker using Homebrew...\x1b[0m');
    await execAsync(BREW_INSTALL_COMMAND);

    console.info('\x1b[32m✓ Docker Desktop has been installed!\x1b[0m');
    console.info('\x1b[34mPlease start Docker Desktop from your Applications folder\x1b[0m');
  } catch (error) {
    if (error.message.includes('which brew')) {
      console.info(
        '\x1b[33mHomebrew is not installed. Opening Docker Desktop download page...\x1b[0m',
      );
      openBrowser(INSTALL_GUIDES.darwin);
    } else {
      throw error;
    }
  }
}

async function handleLinuxInstall() {
  // Check if we're on a Debian-based system
  const isDebian = await execAsync('which apt-get').catch(() => false);

  if (isDebian) {
    console.info('\x1b[34mInstalling Docker on Debian/Ubuntu...\x1b[0m');
    for (const command of APT_INSTALL_COMMANDS) {
      console.info(`\x1b[34mExecuting: ${command}\x1b[0m`);
      await execAsync(command);
    }
    console.info('\x1b[32m✓ Docker has been installed!\x1b[0m');
    console.info(
      '\x1b[33mNote: You may need to log out and back in for group changes to take effect.\x1b[0m',
    );
  } else {
    console.info(
      '\x1b[33mAutomatic installation is only supported on Debian-based systems.\x1b[0m',
    );
    console.info('\x1b[33mOpening Docker installation guide...\x1b[0m');
    openBrowser(INSTALL_GUIDES.linux);
  }
}

async function handleWindowsInstall() {
  console.info('\x1b[34mOpening Docker Desktop download page for Windows...\x1b[0m');
  openBrowser(INSTALL_GUIDES.win32);
  console.info('\x1b[33mPlease follow the installation instructions on the website.\x1b[0m');
  console.info('\x1b[33mMake sure you have Windows Subsystem for Linux 2 (WSL2) installed.\x1b[0m');
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  installDocker();
}

export { installDocker };
