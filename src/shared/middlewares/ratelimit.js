import rateLimit from "express-rate-limit";

const isProduction = process.env.NODE_ENV === "production";

export const limiter = rateLimit({
  windowMs: isProduction
    ? 15 * 60 * 1000 // 15 minutes (production)
    : 1 * 60 * 1000, // 1 minute (development)

  max: isProduction
    ? 300 // stricter in production
    : 1000, // relaxed in development

  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers

  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
