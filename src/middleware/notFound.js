/**
 * 404 Not Found middleware
 * @param {import('express').Request} _req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export const notFoundHandler = (_req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
  });
};
