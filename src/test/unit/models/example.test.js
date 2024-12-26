import { describe, it, expect } from 'vitest';
import { Example } from '../../../models/example.js';

describe('Example Model', () => {
  describe('constructor', () => {
    it('should create an instance with provided data', () => {
      const data = {
        id: 1,
        name: 'Test Example',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const example = new Example(data);

      expect(example.id).toBe(data.id);
      expect(example.name).toBe(data.name);
      expect(example.createdAt).toBe(data.createdAt);
      expect(example.updatedAt).toBe(data.updatedAt);
    });
  });

  describe('findById', () => {
    it('should return null for any ID (placeholder implementation)', async () => {
      const result = await Example.findById(1);
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should return the instance itself (placeholder implementation)', async () => {
      const example = new Example({
        id: 1,
        name: 'Test Example',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await example.save();
      expect(result).toBe(example);
    });
  });
});
