import { exec } from 'child_process';

// Wait for Vitest UI to start
setTimeout(() => {
  // Open browser based on platform
  const command =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';

  // Open Vitest UI in browser
  exec(`${command} http://localhost:51204/__vitest__/`);
}, 2000); // Wait 2 seconds for server to start
