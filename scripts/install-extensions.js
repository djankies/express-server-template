/* eslint-disable no-unused-vars */
import { exec } from 'child_process';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

async function checkVSCodeCLI() {
  try {
    const { stdout } = await execAsync('code --version');
    console.info('\x1b[32m✓ VS Code CLI found:', stdout.split('\n')[0], '\x1b[0m');
    return true;
  } catch (error) {
    console.info('\x1b[33m! VS Code CLI is not installed\x1b[0m');
    console.info('\x1b[34mℹ Please install the VS Code CLI by:\x1b[0m');
    console.info('\x1b[34m1. Open VS Code\x1b[0m');
    console.info('\x1b[34m2. Press CMD+SHIFT+P (Mac) or CTRL+SHIFT+P (Windows/Linux)\x1b[0m');
    console.info('\x1b[34m3. Type "Shell Command: Install \'code\' command in PATH"\x1b[0m');
    console.info('\x1b[34m4. Run this script again with: npm run setup:extensions\x1b[0m');
    return false;
  }
}

async function isExtensionInstalled(extension) {
  try {
    const { stdout } = await execAsync('code --list-extensions');
    const installedExtensions = stdout.split('\n').map(ext => ext.toLowerCase().trim());
    const isInstalled = installedExtensions.includes(extension.toLowerCase());

    if (isInstalled) {
      console.info(`\x1b[32m✓ ${extension} is already installed\x1b[0m`);
    }

    return isInstalled;
  } catch (error) {
    console.info(`\x1b[33m! Could not check if ${extension} is installed: ${error.message}\x1b[0m`);
    return false;
  }
}

async function installExtension(extension) {
  console.info(`\x1b[34mProcessing ${extension}...\x1b[0m`);

  try {
    // Check if already installed
    if (await isExtensionInstalled(extension)) {
      return true;
    }

    // Install the extension
    console.info(`\x1b[34mInstalling ${extension}...\x1b[0m`);
    var { stderr } = await execAsync(`code --install-extension ${extension} --force`);

    // Verify installation
    if (await isExtensionInstalled(extension)) {
      return true;
    } else {
      throw new Error('Installation verification failed');
    }
  } catch (error) {
    console.error(`\x1b[31m✗ Failed to install ${extension}:\x1b[0m`, error.message);
    if (stderr) console.error('\x1b[31mError output:\x1b[0m', stderr);
    return false;
  }
}

async function installExtensions() {
  try {
    console.info('\x1b[34m🔧 Installing VS Code extensions...\x1b[0m');

    // Check if VS Code CLI is available
    if (!(await checkVSCodeCLI())) {
      return;
    }

    // Read extensions.json
    const extensionsPath = join(rootDir, '.vscode', 'extensions.json');
    const extensionsFile = await readFile(extensionsPath, 'utf8');
    const { recommendations } = JSON.parse(extensionsFile);

    if (!recommendations || !recommendations.length) {
      console.info('\x1b[33m! No extensions found in .vscode/extensions.json\x1b[0m');
      return;
    }

    console.info(`\x1b[34mFound ${recommendations.length} extensions to process...\x1b[0m`);

    // Install each extension
    const results = await Promise.all(
      recommendations.map(extension => installExtension(extension)),
    );

    const successCount = results.filter(Boolean).length;
    const failCount = results.length - successCount;

    console.info('\n\x1b[34mInstallation Summary:\x1b[0m');
    console.info(`\x1b[32m✓ Successfully installed/verified: ${successCount}\x1b[0m`);
    if (failCount > 0) {
      console.info(`\x1b[31m✗ Failed installations: ${failCount}\x1b[0m`);
    }

    if (successCount === results.length) {
      console.info(
        '\x1b[32m✨ All VS Code extensions were installed/verified successfully!\x1b[0m',
      );
    } else {
      console.info(
        '\x1b[33m! Some extensions failed to install. You may need to install them manually.\x1b[0m',
      );
    }
  } catch (error) {
    console.error('\x1b[31m✗ Extension installation failed:\x1b[0m', error.message);
    throw error;
  }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  installExtensions().catch(() => process.exit(1));
}

export { installExtensions };
