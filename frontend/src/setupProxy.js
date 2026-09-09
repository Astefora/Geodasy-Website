/**
 * setupProxy.js — CRA dev-server proxy configuration
 *
 * The simple "proxy" key in package.json strips Cookie headers, which breaks
 * the Remember Me feature (the backend never sees the rememberToken cookie).
 * This file uses http-proxy-middleware directly so we can set
 * `changeOrigin: true` and preserve credentials end-to-end.
 *
 * CRA picks this file up automatically — no changes to package.json needed.
 */
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:5002",
      changeOrigin: true,
      // Forward cookies from browser → backend and Set-Cookie from backend → browser
      onProxyReq(proxyReq, req) {
        if (req.headers.cookie) {
          proxyReq.setHeader("cookie", req.headers.cookie);
        }
      },
    }),
  );
};
