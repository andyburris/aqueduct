const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Allow all origins and headers
app.use(cors({
    origin: true, // Reflects the request origin
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'accept',
        'accept-language',
        'content-type',
        'content-language',
        'x-requested-with',
        'authorization',
        'cookie',
        'x-notion-active-user-header',  // Notion specific
        'origin',
        'cache-control',
        'pragma',
        'expires'
    ]}));

// Optional debugging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Extract target URL from the request path
app.use('/', (req, res, next) => {
    // Remove the leading slash to get the target URL
    const targetUrl = req.url.slice(1);
    if (!targetUrl) {
        return res.status(400).send('Target URL is required');
    }

    // Create proxy middleware dynamically based on target
    const proxy = createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        pathRewrite: {
            // Remove the target URL from the path
            [`^/${targetUrl}`]: '',
        },
        onProxyRes: (proxyRes, req, res) => {
            // Ensure CORS headers are present
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Headers', 
                'accept, accept-language, content-type, content-language, x-requested-with, authorization, cookie, x-notion-active-user-header, origin');
        }
    });

    return proxy(req, res, next);
});

const port = process.env.PORT || 8082;
app.listen(port, () => {
    console.log(`Generic CORS Proxy listening on port ${port}`);
});