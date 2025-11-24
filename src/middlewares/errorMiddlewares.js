// GLOBAL 404 HANDLER (for routes not found)
export function notFound(req, res, next) {
  const error = new Error("Page not found");
  error.status = 404;
  next(error);
}

// GLOBAL ERROR HANDLER (for all errors)
export function errorHandler(err, req, res, next) {
  console.error("❌ ERROR:", err.message);

  const status = err.status || 500;

  // ADMIN SIDE ERRORS
  if (req.originalUrl.startsWith("/admin")) {
    if (status === 404) {
      return res
        .status(404)
        .render("admin/404", { pageTitle: `${status} Error` });
    }
    return res
      .status(500)
      .render("admin/error", {
        pageTitle: `${status} Error`,
        message: err.message,
      });
  }

  // USER SIDE ERRORS
  if (status === 404) {
    return res.status(404).render("user/404", { pageTitle: `${status} Error` });
  }

  return res
    .status(500)
    .render("user/error", {
      pageTitle: `${status} Error`,
      message: err.message,
    });
}
