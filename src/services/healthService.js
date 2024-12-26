import { readFile } from 'fs/promises';
import os from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..');

class HealthService {
  constructor() {
    this.startTime = Date.now();
    this.version = null;
    this.loadVersion();
  }

  async loadVersion() {
    try {
      const packageJson = await readFile(join(rootDir, 'package.json'), 'utf8');
      const { version } = JSON.parse(packageJson);
      this.version = version;
    } catch (error) {
      console.error('Failed to load version:', error);
      this.version = 'unknown';
    }
  }

  getSystemHealth() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      memory: {
        total: this.formatBytes(totalMemory),
        free: this.formatBytes(freeMemory),
        used: this.formatBytes(usedMemory),
        percentUsed: Math.round((usedMemory / totalMemory) * 100),
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        loadAvg: os.loadavg(),
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        version: process.version,
        uptime: this.formatUptime(process.uptime()),
      },
      process: {
        pid: process.pid,
        memory: this.formatBytes(process.memoryUsage().heapUsed),
        uptime: this.formatUptime((Date.now() - this.startTime) / 1000),
      },
    };
  }

  async getFullHealth() {
    const systemHealth = this.getSystemHealth();

    return {
      status: 'ok',
      version: this.version,
      timestamp: new Date().toISOString(),
      ...systemHealth,
    };
  }

  async getLivenessCheck() {
    // Basic check to verify the service is running
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadinessCheck() {
    // More comprehensive check to verify the service can handle requests
    try {
      const health = await this.getSystemHealth();

      // In development, only check CPU load as memory reporting may be unreliable
      const loadThreshold = os.cpus().length * (process.env.NODE_ENV === 'production' ? 0.8 : 0.9); // 80% in prod, 90% in dev

      const checks =
        process.env.NODE_ENV === 'production'
          ? {
              memory: health.memory.percentUsed < 90,
              cpu: health.cpu.loadAvg[0] < loadThreshold,
            }
          : {
              // Skip memory check in development
              cpu: health.cpu.loadAvg[0] < loadThreshold,
            };

      const isReady = Object.values(checks).every(Boolean);

      return {
        status: isReady ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        checks,
        details: isReady
          ? null
          : {
              ...(checks.memory !== undefined && { memory: `${health.memory.percentUsed}% used` }),
              cpu: `Load average: ${health.cpu.loadAvg[0].toFixed(2)}`,
            },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  }
}

export default new HealthService();
