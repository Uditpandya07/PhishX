/**
 * Central configuration & environment validation for PhishX frontend.
 *
 * NEXT_PUBLIC_API_URL must be set in your deployment environment (e.g. Vercel).
 * Example: https://your-render-service.onrender.com
 */

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function isValidUrl(val) {
  if (!val || val === "undefined" || val === "null" || val === "") return false;
  return val.startsWith("http://") || val.startsWith("https://");
}

export const API_URL = isValidUrl(rawApiUrl) ? rawApiUrl.replace(/\/$/, "") : null;

export const isConfigured = Boolean(API_URL);
