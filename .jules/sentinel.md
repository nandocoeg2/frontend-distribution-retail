## 2025-05-24 - Exposed Access Tokens in Client-Side Console Logs
**Vulnerability:** The application was logging the user's `accessToken` and user object directly to the console via `console.log()` in multiple places (such as `useAuth.js` and `authService.js`).
**Learning:** This typically occurs during development for debugging but is accidentally left in production code. Since this is an Electron/React application, these logs can be accessed via developer tools or malicious scripts.
**Prevention:** Avoid logging sensitive information such as authentication tokens, passwords, and PII to the console. Implement environment-based logging configurations so debug logs are automatically suppressed in production builds.
