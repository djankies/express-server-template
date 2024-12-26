import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import os from 'os';
import healthService from '../../../services/healthService.js';

describe('HealthService', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01'));
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  describe('getSystemHealth', () => {
    it('should return system health metrics', () => {
      const health = healthService.getSystemHealth();

      expect(health).toHaveProperty('memory');
      expect(health).toHaveProperty('cpu');
      expect(health).toHaveProperty('system');
      expect(health).toHaveProperty('process');

      expect(health.memory).toHaveProperty('total');
      expect(health.memory).toHaveProperty('free');
      expect(health.memory).toHaveProperty('used');
      expect(health.memory).toHaveProperty('percentUsed');

      expect(health.cpu).toHaveProperty('cores');
      expect(health.cpu).toHaveProperty('model');
      expect(health.cpu).toHaveProperty('loadAvg');

      expect(health.system).toHaveProperty('platform');
      expect(health.system).toHaveProperty('arch');
      expect(health.system).toHaveProperty('version');
      expect(health.system).toHaveProperty('uptime');

      expect(health.process).toHaveProperty('pid');
      expect(health.process).toHaveProperty('memory');
      expect(health.process).toHaveProperty('uptime');
    });

    it('should calculate memory usage correctly', () => {
      vi.spyOn(os, 'totalmem').mockReturnValue(16000000000); // 16GB
      vi.spyOn(os, 'freemem').mockReturnValue(8000000000); // 8GB

      const health = healthService.getSystemHealth();

      expect(health.memory.total).toBe('14.90 GB');
      expect(health.memory.free).toBe('7.45 GB');
      expect(health.memory.used).toBe('7.45 GB');
      expect(health.memory.percentUsed).toBe(50);
    });

    it('should handle CPU information', () => {
      const mockCpus = [
        { model: 'Intel(R) Core(TM) i7', speed: 2800 },
        { model: 'Intel(R) Core(TM) i7', speed: 2800 },
      ];
      vi.spyOn(os, 'cpus').mockReturnValue(mockCpus);
      vi.spyOn(os, 'loadavg').mockReturnValue([2.5, 2.0, 1.5]);

      const health = healthService.getSystemHealth();

      expect(health.cpu.cores).toBe(2);
      expect(health.cpu.model).toBe('Intel(R) Core(TM) i7');
      expect(health.cpu.loadAvg).toEqual([2.5, 2.0, 1.5]);
    });
  });

  describe('getFullHealth', () => {
    it('should return full health status with version', async () => {
      const health = await healthService.getFullHealth();

      expect(health).toHaveProperty('status', 'ok');
      expect(health).toHaveProperty('version');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('memory');
      expect(health).toHaveProperty('cpu');
      expect(health).toHaveProperty('system');
      expect(health).toHaveProperty('process');
    });
  });

  describe('getLivenessCheck', () => {
    it('should return basic liveness status', async () => {
      const health = await healthService.getLivenessCheck();

      expect(health).toEqual({
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z',
      });
    });
  });

  describe('getReadinessCheck', () => {
    beforeEach(() => {
      vi.spyOn(os, 'cpus').mockReturnValue(Array(4).fill({ model: 'test' }));
    });

    it('should skip memory check in development', async () => {
      vi.spyOn(os, 'loadavg').mockReturnValue([2.0, 1.5, 1.0]); // Load below threshold

      const health = await healthService.getReadinessCheck();

      expect(health.status).toBe('ok');
      expect(health.checks).toHaveProperty('cpu');
      expect(health.checks).not.toHaveProperty('memory');
    });

    it('should include memory check in production', async () => {
      process.env.NODE_ENV = 'production';
      vi.spyOn(os, 'loadavg').mockReturnValue([2.0, 1.5, 1.0]); // Load below threshold
      vi.spyOn(os, 'totalmem').mockReturnValue(16000000000);
      vi.spyOn(os, 'freemem').mockReturnValue(8000000000);

      const health = await healthService.getReadinessCheck();

      expect(health.status).toBe('ok');
      expect(health.checks).toHaveProperty('cpu');
      expect(health.checks).toHaveProperty('memory');
    });

    it('should report degraded status when CPU load is high', async () => {
      vi.spyOn(os, 'loadavg').mockReturnValue([4.0, 3.5, 3.0]); // Load above threshold

      const health = await healthService.getReadinessCheck();

      expect(health.status).toBe('degraded');
      expect(health.details).toHaveProperty('cpu');
    });

    it('should report degraded status when memory usage is high in production', async () => {
      process.env.NODE_ENV = 'production';
      vi.spyOn(os, 'loadavg').mockReturnValue([2.0, 1.5, 1.0]);
      vi.spyOn(os, 'totalmem').mockReturnValue(16000000000);
      vi.spyOn(os, 'freemem').mockReturnValue(1000000000); // Very little free memory

      const health = await healthService.getReadinessCheck();

      expect(health.status).toBe('degraded');
      expect(health.details).toHaveProperty('memory');
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(os, 'loadavg').mockImplementation(() => {
        throw new Error('Test error');
      });

      const health = await healthService.getReadinessCheck();

      expect(health.status).toBe('error');
      expect(health.error).toBe('Test error');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(healthService.formatBytes(1024)).toBe('1.00 KB');
      expect(healthService.formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(healthService.formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(healthService.formatBytes(500)).toBe('500.00 B');
    });
  });

  describe('formatUptime', () => {
    it('should format uptime correctly', () => {
      expect(healthService.formatUptime(30)).toBe('30s');
      expect(healthService.formatUptime(65)).toBe('1m 5s');
      expect(healthService.formatUptime(3665)).toBe('1h 1m 5s');
      expect(healthService.formatUptime(90065)).toBe('1d 1h 1m 5s');
    });

    it('should handle zero uptime', () => {
      expect(healthService.formatUptime(0)).toBe('0s');
    });
  });
});
