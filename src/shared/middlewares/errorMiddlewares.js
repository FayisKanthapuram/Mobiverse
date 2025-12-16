// STATIC FILE 404 HANDLER (before global 404)
export function staticFile404(req, res, next) {
  // Handle missing static assets only
  if (req.method === "GET" && /^\/(uploads|images|css|js)\//.test(req.path)) {
    console.log(`🧱 Missing static file: ${req.path}`);
    return res.status(404).send("File missing");
  }
  next();
}

// GLOBAL 404 HANDLER (for routes)
export function notFound(req, res, next) {
  const error = new Error("Page not found");
  error.status = 404;
  next(error);
}

// GLOBAL ERROR HANDLER
export function errorHandler(err, req, res, next) {
  
  const status = err.status || 500;
  if(status>=500){
    console.error("❌ ERROR:", err);
  }
  /* ----------------------------------------------------
     🔥 AJAX / API REQUESTS (Axios, Fetch, XHR)
  ---------------------------------------------------- */
  if (req.xhr || req.headers.accept?.includes("json")) {
    return res.status(status).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : err.message || "Internal server error",
    });
  }

  /* ----------------------------------------------------
     🛠 ADMIN ROUTES
  ---------------------------------------------------- */
  if (req.originalUrl.startsWith("/admin")) {
    if (status === 404) {
      return res.status(404).render("admin/error/404", {
        pageTitle: "404 Error",
      });
    }

    return res.status(status).render("admin/error/error", {
      pageTitle: `${status} Error`,
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : err.message,
    });
  }

  /* ----------------------------------------------------
     👤 USER ROUTES
  ---------------------------------------------------- */
  if (status === 404) {
    return res.status(404).render("user/error/404", {
      pageTitle: "404 Error",
    });
  }

  return res.status(status).render("user/error/error", {
    pageTitle: `${status} Error`,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
}
