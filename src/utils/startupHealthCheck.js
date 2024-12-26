import http from 'http';

const checkHealth = (retries = 30, interval = 1000) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      attempts++;

      const req = http.get('http://localhost:3000/health/ready', res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.info('\x1b[34mHealth check response:\x1b[0m', response);

            if (res.statusCode === 200) {
              console.info('\x1b[32m✓ Service is healthy and ready\x1b[0m');
              resolve(true);
            } else {
              console.info(`\x1b[33m! Service responded with status ${res.statusCode}\x1b[0m`);
              retry();
            }
          } catch (error) {
            console.error('\x1b[31mFailed to parse health check response:\x1b[0m', error);
            retry();
          }
        });
      });

      req.on('error', () => {
        console.info(`\x1b[33m! Health check attempt ${attempts}/${retries} failed\x1b[0m`);
        retry();
      });

      req.end();
    };

    const retry = () => {
      if (attempts >= retries) {
        console.error(
          '\x1b[31m✗ Service failed to become healthy within the timeout period\x1b[0m',
        );
        reject(new Error('Health check timeout'));
        return;
      }
      setTimeout(check, interval);
    };

    check();
  });
};

export const waitForHealthy = async (label = 'Service') => {
  console.info(`\x1b[34mℹ Waiting for ${label} to become healthy...\x1b[0m`);
  console.info('\x1b[34mℹ Current NODE_ENV:\x1b[0m', process.env.NODE_ENV);

  try {
    await checkHealth();
    return true;
  } catch (error) {
    console.error('\x1b[31m✗ Health check failed:\x1b[0m', error.message);
    return false;
  }
};

export default waitForHealthy;
