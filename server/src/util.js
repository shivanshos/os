// Express 4 does not forward rejected promises to the error handler.
export const wrap = (handler) => (req, res, next) => handler(req, res, next).catch(next)
