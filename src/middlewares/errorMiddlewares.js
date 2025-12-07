// STATIC FILE 404 HANDLER (before global 404)
export function staticFile404(req, res, next) {
  if (
    req.originalUrl.startsWith("/uploads") ||
    req.originalUrl.startsWith("/images") ||
    req.originalUrl.startsWith("/css") ||
    req.originalUrl.startsWith("/js")
  ) {
    console.log(`${req.path} is missing`);
    return res.status(404).send("File missing"); // or send default image
  }
  next();
}

export function notFound(req, res, next) {
  const error = new Error("Page not found");
  error.status = 404;
  next(error);
}


export function errorHandler(err, req, res, next) {
  console.error("❌ ERROR:", err);

  const status = err.status || 500;

  if (req.originalUrl.startsWith("/admin")) {
    if (status === 404) {
      return res
        .status(404)
        .render("admin/404", { pageTitle: `${status} Error` });
    }
    return res.status(500).render("admin/error", {
      pageTitle: `${status} Error`,
      message: err.message,
    });
  }

  if (status === 404) {
    return res.status(404).render("user/404", { pageTitle: `${status} Error` });
  }

  return res.status(500).render("user/error", {
    pageTitle: `${status} Error`,
    message: err.message,
  });
}
