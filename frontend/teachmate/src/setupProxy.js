const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/betyg',
    createProxyMiddleware({
      target: `${process.env.REACT_APP_BACKEND_URL}`,
      changeOrigin: true,
    })
  );
  // Add more proxies as needed for other API endpoints
};
