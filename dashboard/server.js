const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression());

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoints can be added here for future real data integration
// app.get('/api/metrics', (req, res) => { ... });

// Catch-all route: serve the React app's index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║       Five-Lane Dashboard - Production Server              ║
╚════════════════════════════════════════════════════════════╝

✓ Server running on port ${PORT}
✓ Environment: ${process.env.NODE_ENV || 'production'}
✓ Dashboard URL: http://localhost:${PORT}
✓ Health check: http://localhost:${PORT}/health

Press Ctrl+C to stop the server
  `);
});

module.exports = app;
