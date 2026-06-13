class BaseController {
  sendSuccess(res, data, status = 200) {
    return res.status(status).json(data);
  }

  sendError(res, message, status = 500) {
    return res.status(status).json({ message });
  }

  handleServerError(res, error, message = 'Server error') {
    const errorMessage = error?.message || message;
    return res.status(500).json({ message: errorMessage });
  }

  notFound(res, message = 'Resource not found') {
    return res.status(404).json({ message });
  }
}

module.exports = BaseController;
