/**
 * Unsupported Media Type middleware
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const unsupportedMediaTypeHandler = (req, res, next) => {
  const err = new Error('Unsupported Media Type');
  err.status = 415;
  err.type = 'unsupported.media.type';
  next(err);
};
