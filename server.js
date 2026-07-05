const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware - Security
app.use(helmet());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware - Logging
const morganFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
const morganStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);
app.use(morgan(morganFormat, { stream: morganStream }));
app.use(morgan(morganFormat));

// Middleware - Compression
app.use(compression());

// Middleware - Parsing
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cookieParser());

// Middleware - Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware - Request logging helper
app.use((req, res, next) => {
  res.locals.siteName = process.env.SITE_NAME || 'ReviewHub';
  res.locals.siteUrl = process.env.SITE_URL || 'http://localhost:3000';
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// Routes
const indexRoutes = require('./routes/index');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

app.use('/', indexRoutes);
app.use('/review', reviewRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin
Sitemap: ${process.env.SITE_URL || 'http://localhost:3000'}/sitemap.xml
`);
});

// Sitemap
app.get('/sitemap.xml', (req, res) => {
  const db = require('./db');
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
  const reviews = db.getReviews();
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/submit</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  
  reviews.forEach(review => {
    sitemap += `
  <url>
    <loc>${baseUrl}/review/${review.id}</loc>
    <lastmod>${new Date(review.updatedAt || review.createdAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });
  
  sitemap += `
</urlset>`;
  
  res.type('application/xml');
  res.send(sitemap);
});

// 404 Error handler
app.use((req, res) => {
  res.status(404).render('error/404', {
    title: 'Page Not Found'
  });
});

// 500 Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Log error to file
  const errorLog = path.join(logsDir, 'error.log');
  const errorMessage = `[${new Date().toISOString()}] ${err.message}\n${err.stack}\n---\n`;
  fs.appendFileSync(errorLog, errorMessage);
  
  res.status(500).render('error/500', {
    title: 'Server Error',
    error: NODE_ENV === 'development' ? err : {}
  });
});

// Create automatic backup
function createDailyBackup() {
  const db = require('./db');
  
  try {
    db.createBackup();
    console.log('✓ Daily backup created');
  } catch (error) {
    console.error('Error creating backup:', error);
  }
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     ${process.env.SITE_NAME || 'ReviewHub'} - Review Website      ║
╚════════════════════════════════════════╝

✓ Server running on port ${PORT}
✓ Environment: ${NODE_ENV}
✓ Site URL: ${process.env.SITE_URL || `http://localhost:${PORT}`}
✓ Admin Panel: ${process.env.SITE_URL || `http://localhost:${PORT}`}/admin

${NODE_ENV === 'development' ? '⚠ Development mode - Check your configuration\n' : ''}
`);

  // Create daily backup at startup and every 24 hours
  createDailyBackup();
  setInterval(createDailyBackup, 24 * 60 * 60 * 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  const errorLog = path.join(logsDir, 'error.log');
  const errorMessage = `[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${error.message}\n${error.stack}\n---\n`;
  fs.appendFileSync(errorLog, errorMessage);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  const errorLog = path.join(logsDir, 'error.log');
  const errorMessage = `[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason}\n---\n`;
  fs.appendFileSync(errorLog, errorMessage);
});

module.exports = app;
