/**
 * Debug routes for health checks and diagnostics
 */

const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { apiLimiter } = require('../middleware/rateLimiter');
const { authMiddleware, roleMiddleware } = require('../utils/auth');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

// Rate limit all debug routes
router.use(apiLimiter);

/**
 * Health check endpoint
 * GET /debug/health
 */
router.get('/health', async (req, res) => {
  try {
    // Check OpenAI API key
    const openaiAvailable = !!process.env.OPENAI_API_KEY;
    
    // Check database connection
    const dbStatus = await supabase.checkHealth();
    
    // Check environment
    const environment = process.env.NODE_ENV || 'development';
    
    // Get package.json for version
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    res.json({
      status: 'healthy',
      version: packageJson.version,
      environment,
      dependencies: {
        openai: openaiAvailable ? 'available' : 'unavailable',
        database: dbStatus.healthy ? 'connected' : 'disconnected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check error:', { error: error.message });
    
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Debug configuration endpoint (admin only)
 * GET /debug/config
 */
router.get('/config', 
  authMiddleware(),
  roleMiddleware(['admin']),
  (req, res) => {
    try {
      // Filter only safe environment variables to expose
      const safeConfig = {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
        LOG_LEVEL: process.env.LOG_LEVEL,
        OPENAI_MODEL: process.env.OPENAI_MODEL,
        SESSION_EXPIRY_HOURS: process.env.SESSION_EXPIRY_HOURS,
        RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
        RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS
      };
      
      res.json({
        config: safeConfig,
        uptime: process.uptime()
      });
    } catch (error) {
      logger.error('Config debug error:', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Database connection check
 * GET /debug/database
 */
router.get('/database',
  authMiddleware(),
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const dbStatus = await supabase.checkHealth();
      
      if (!dbStatus.healthy) {
        return res.status(500).json({
          status: 'error',
          message: 'Database connection failed',
          error: dbStatus.error
        });
      }
      
      // Get table counts
      const tablesQuery = await supabase.from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      const tablePromises = tablesQuery.data.map(async (table) => {
        const { count, error } = await supabase
          .from(table.table_name)
          .select('*', { count: 'exact', head: true });
          
        return {
          table: table.table_name,
          count: count || 0,
          error: error ? error.message : null
        };
      });
      
      const tableStats = await Promise.all(tablePromises);
      
      res.json({
        status: 'connected',
        url: process.env.SUPABASE_URL,
        tables: tableStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Database debug error:', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
