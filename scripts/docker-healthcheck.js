#!/usr/bin/env node

import http from 'http';

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health/live',
  timeout: 2000,
};

const request = http.request(options, res => {
  console.info(`Health check status: ${res.statusCode}`);

  // Consume response data to free up memory
  res.resume();

  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', err => {
  console.error('Health check failed:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('Health check timeout');
  request.destroy();
  process.exit(1);
});

request.end();
