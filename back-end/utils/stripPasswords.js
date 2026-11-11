/**
 * Removes any field named "password" from data before we send JSON.
 * Used as Express middleware so we don't forget on a new route.
 */

/**
 * Recursively clean one value (array, object, or primitive).
 */
function stripPasswordsFromValue(value) {
  if (Array.isArray(value)) {
    return value.map(stripPasswordsFromValue);
  }

  if (value !== null && typeof value === "object") {
    const cleaned = {};

    for (const key of Object.keys(value)) {
      if (key === "password") {
        continue;
      }
      cleaned[key] = stripPasswordsFromValue(value[key]);
    }

    return cleaned;
  }

  return value;
}

/**
 * Middleware: wrap res.json so every JSON response is cleaned.
 */
function stripPasswordsMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    return originalJson(stripPasswordsFromValue(body));
  };

  next();
}

module.exports = {
  stripPasswordsFromValue,
  stripPasswordsMiddleware,
};
