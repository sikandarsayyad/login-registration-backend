function sendSuccess(res, message, data = null) {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
}

function sendError(res, message, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
