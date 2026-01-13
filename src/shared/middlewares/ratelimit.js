import rateLimit from "express-rate-limit";


export const limiter = rateLimit({
  windowMs:  1 * 60 * 1000, // 1 minute 

  max:  1000, // relaxed in development

  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers

  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
