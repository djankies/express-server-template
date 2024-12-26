/**
 * Method Not Allowed middleware
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const methodNotAllowedHandler = (req, res, next) => {
  if (!['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'].includes(req.method)) {
    const err = new Error('Method Not Allowed');
    err.status = 405;
    err.type = 'method.not.allowed';
    next(err);
  } else {
    next();
  }
};
