import { AppError } from "../utils/app.error.js";
import { HttpStatus } from "../constants/statusCode.js";

/* ----------------------------------------------------
   🧱 STATIC FILE 404 HANDLER
   (no error logging – normal browser behavior)
---------------------------------------------------- */
export function staticFile404(req, res, next) {
  if (req.method === "GET" && /^\/(uploads|images|css|js)\//.test(req.path)) {
    return res.status(404).send("File not found");
  }
  next();
}

/* ----------------------------------------------------
   🚫 GLOBAL 404 HANDLER (routes only)
---------------------------------------------------- */
export function notFound(req, res, next) {
  next(new AppError("Page not found", HttpStatus.NOT_FOUND));
}

/* ----------------------------------------------------
   ❌ GLOBAL ERROR HANDLER
---------------------------------------------------- */
export function errorHandler(err, req, res, next) {
  const status = err.status || HttpStatus.INTERNAL_SERVER_ERROR;

  /* ----------------------------------------------------
     🔇 LOGGING STRATEGY (IMPORTANT)
     - Log ONLY real server bugs
     - Ignore normal 404 bot noise
  ---------------------------------------------------- */
  if (!err.isOperational && status >= 500) {
    console.error("🔥 INTERNAL ERROR:", err);
  }

  /* ----------------------------------------------------
     🔥 API / AJAX REQUESTS
  ---------------------------------------------------- */
  if (req.xhr || req.headers.accept?.includes("json")) {
    return res.status(status).json({
      success: false,
      message: err.isOperational
        ? err.message
        : process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
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
      message: err.isOperational
        ? err.message
        : process.env.NODE_ENV === "production"
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
    message: err.isOperational
      ? err.message
      : process.env.NODE_ENV === "production"
      ? "Something went wrong"
      : err.message,
  });
}
