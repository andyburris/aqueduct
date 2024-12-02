var host = process.env.HOST || '0.0.0.0';
var port = process.env.PORT || 8082;

var cors_proxy = require('cors-anywhere');
cors_proxy.createServer({
    originWhitelist: ['https://localhost:3000'], // Replace with your frontend origin
    requireHeader: ['origin'],
    removeHeaders: [], // Don't remove any headers
    setHeaders: {
        'Access-Control-Allow-Credentials': 'true'
    },
    // Custom header handling function
    httpProxyOptions: {
        xfwd: false,
        secure: false,
        onProxyRes: (proxyRes, req, res) => {
            // Set the specific origin instead of *
            proxyRes.headers['access-control-allow-origin'] = req.headers.origin;
            proxyRes.headers['access-control-allow-credentials'] = 'true';
        }
    }
}).listen(port, host, function() {
    console.log('Running CORS Anywhere on ' + host + ':' + port);
});