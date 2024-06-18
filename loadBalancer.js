const http = require('http');
const httpProxy = require('http-proxy');

const routes = ['/', '/api', '/health'];
const servers = [
    { host: 'localhost', port: 3001, routes: {}, responseTime: Infinity },
    { host: 'localhost', port: 3002, routes: {}, responseTime: Infinity },
    { host: 'localhost', port: 3003, routes: {}, responseTime: Infinity }
];

const proxy = httpProxy.createProxyServer();
let currentIndex = 0;

function initializeServerRoutes(server) {
    routes.forEach(route => {
        server.routes[route] = { healthy: true };
    });
}

servers.forEach(initializeServerRoutes);

function getNextServer(route) {
    const healthyServers = servers.filter(server => server.routes[route]?.healthy);
    if (healthyServers.length === 0) {
        return null; // No healthy servers available for this route
    }

    // Sort servers by response time, prioritizing faster servers
    healthyServers.sort((a, b) => a.responseTime - b.responseTime);

    // Round-robin among the healthy servers
    const server = healthyServers[currentIndex % healthyServers.length];
    currentIndex = (currentIndex + 1) % healthyServers.length;
    return server;
}

function checkServerRouteHealth(server, route) {
    const startTime = Date.now();
    return new Promise((resolve) => {
        const req = http.request({ host: server.host, port: server.port, path: route, method: 'HEAD' }, (res) => {
            const responseTime = Date.now() - startTime;
            server.routes[route].healthy = res.statusCode >= 200 && res.statusCode < 300;
            server.responseTime = server.routes[route].healthy ? responseTime : Infinity;
            resolve();
        });
        req.on('error', (err) => {
            server.routes[route].healthy = false;
            server.responseTime = Infinity;
            console.error(`Error checking health of ${route} on server ${server.host}:${server.port} - ${err.message}`);
            resolve();
        });
        req.end();
    }).then(() => {
        if (!server.routes[route].healthy) {
            console.error(`Route ${route} on server ${server.host}:${server.port} is down`);
        } else {
            console.log(`Route ${route} on server ${server.host}:${server.port} is healthy with response time ${server.responseTime}ms`);
        }
    });
}

function checkServerHealth(server) {
    return Promise.all(routes.map(route => checkServerRouteHealth(server, route)));
}

// Periodically checking the health of servers
setInterval(() => {
    servers.forEach(server => checkServerHealth(server));
}, 5000);

const server = http.createServer((req, res) => {
    const route = new URL(req.url, `http://${req.headers.host}`).pathname;
    const target = getNextServer(route);
    if (target) {
        console.log(`Proxying request to: ${target.host}:${target.port}${route}`);
        proxy.web(req, res, { target: `http://${target.host}:${target.port}${route}` }, (err) => {
            console.error(`Error proxying request to ${target.host}:${target.port}${route} - ${err.message}`);
            res.statusCode = 502;
            res.end('Bad Gateway');
        });
    } else {
        res.statusCode = 503;
        res.end('Service Unavailable');
    }
});

server.listen(3000, () => {
    console.log('Load balancer listening on port 3000');
});
