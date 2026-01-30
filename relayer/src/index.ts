// ============================================================================
// SybilShield Relayer - Entry Point
// ============================================================================
// Application entry point that starts the Express server
// ============================================================================

import { createApp } from './server.js';
import config, { validateConfig } from './config.js';
import { logger } from './utils/logger.js';

// ============================================================================
// Startup Banner
// ============================================================================

const printBanner = () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                    ║
║   ███████╗██╗   ██╗██████╗ ██╗██╗     ███████╗██╗  ██╗██╗███████╗ ║
║   ██╔════╝╚██╗ ██╔╝██╔══██╗██║██║     ██╔════╝██║  ██║██║██╔════╝ ║
║   ███████╗ ╚████╔╝ ██████╔╝██║██║     ███████╗███████║██║█████╗   ║
║   ╚════██║  ╚██╔╝  ██╔══██╗██║██║     ╚════██║██╔══██║██║██╔══╝   ║
║   ███████║   ██║   ██████╔╝██║███████╗███████║██║  ██║██║███████╗ ║
║   ╚══════╝   ╚═╝   ╚═════╝ ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝╚══════╝ ║
║                                                                    ║
║              Off-Chain Relayer for Badge Verification              ║
║                       "One Person, One Vote"                       ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
`);
};

// ============================================================================
// Main Function
// ============================================================================

const main = async () => {
  // Print banner
  printBanner();

  // Validate configuration
  logger.info('🔧 Validating configuration...');
  validateConfig();
  
  logger.info(`📝 Environment: ${config.server.nodeEnv}`);
  logger.info(`🎭 Demo Mode: ${config.demoMode ? 'ENABLED' : 'DISABLED'}`);
  
  if (config.demoMode) {
    logger.warn('⚠️  Demo mode is enabled - using mock verification providers');
  }

  // Create Express app
  const app = createApp();

  // Start server
  const server = app.listen(config.server.port, () => {
    logger.info(`🚀 Server started on port ${config.server.port}`);
    logger.info(`📡 Aleo RPC: ${config.aleo.rpcUrl}`);
    logger.info(`🔗 Health check: http://localhost:${config.server.port}/health`);
    logger.info('');
    logger.info('📋 Available endpoints:');
    logger.info(`   POST /verify/proof-of-humanity`);
    logger.info(`   POST /verify/worldcoin`);
    logger.info(`   GET  /verify/status/:verification_id`);
    logger.info(`   POST /badge/request-issuance`);
    logger.info(`   GET  /badge/status/:address`);
    logger.info(`   GET  /health`);
    logger.info('');
    logger.info('✅ Ready to accept connections');
  });

  // ========================================================================
  // Graceful Shutdown
  // ========================================================================
  
  const shutdown = async (signal: string) => {
    logger.info(`\n📴 ${signal} received. Shutting down gracefully...`);
    
    server.close(() => {
      logger.info('👋 HTTP server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
  });
};

// ============================================================================
// Run Application
// ============================================================================

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
