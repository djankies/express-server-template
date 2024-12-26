import { describe, expect, it, vi } from 'vitest';
import { unsupportedMediaTypeHandler } from '../../../middleware/unsupportedMediaType.js';

describe('Unsupported Media Type Middleware', () => {
  it('should create an error with correct properties', () => {
    const req = {};
    const res = {};
    const next = vi.fn();

    unsupportedMediaTypeHandler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Unsupported Media Type');
    expect(error.status).toBe(415);
    expect(error.type).toBe('unsupported.media.type');
  });

  it('should pass error to next middleware', () => {
    const req = {};
    const res = {};
    const next = vi.fn();

    unsupportedMediaTypeHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
