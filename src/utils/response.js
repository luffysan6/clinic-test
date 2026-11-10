'use strict';

// Sends a standardised success response
const ok = (res, data, message, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

module.exports = { ok };
