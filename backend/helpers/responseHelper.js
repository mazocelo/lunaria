export function sendSuccess(res, data, meta = null, statusCode = 200) {
  const response = { success: true, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
}

export function sendCreated(res, data, meta = null) {
  return sendSuccess(res, data, meta, 201);
}

export function sendNoContent(res) {
  return res.status(204).send();
}

export function sendError(res, statusCode, code, message, details = null) {
  const response = { success: false, error: { code, message } };
  if (details) response.error.details = details;
  return res.status(statusCode).json(response);
}

export function sendPaginated(res, data, { page, limit, total }) {
  return sendSuccess(res, data, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit))
  });
}
