const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/betyg',
    createProxyMiddleware({
      target: `http://${process.env.BASE_URL}:8000`,
      changeOrigin: true,
    })
  );
  // Add more proxies as needed for other API endpoints
};
