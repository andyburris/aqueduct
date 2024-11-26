const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const ALLOWED_ORIGIN = 'https://localhost:3000';

// Configure cors middleware
app.use(cors({
    origin: ALLOWED_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['authorization', 'content-type', 'cookie', 'x-notion-active-user-header', 'api-key']
}));

// Debug middleware
app.use((req, res, next) => {
    console.log('\n=== Incoming Request ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Origin:', req.headers.origin);
    console.log('Headers:', req.headers);
    next();
});

// Create proxy middleware
const proxy = createProxyMiddleware({
    target: 'https://www.notion.so',
    changeOrigin: true,
    secure: false,
    onProxyReq: (proxyReq, req) => {
        console.log('\n=== Proxy Request ===');
        if (req.headers.cookie) {
            proxyReq.setHeader('Cookie', req.headers.cookie);
            console.log('Forwarded cookie:', req.headers.cookie);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log('\n=== Proxy Response ===');
        // Ensure CORS headers are present
        res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        console.log('Response headers set:', res.getHeaders());
    }
});

// Handle all routes with proxy
// app.use('/', proxy);

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

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(500).send('Proxy Error');
});

const port = process.env.PORT || 8082;
app.listen(port, () => {
    console.log(`CORS Proxy listening on port ${port}`);
});