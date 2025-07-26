/**
 * Application Configuration
 * Mirrors appsettings.json structure for frontend
 */
export const appConfig = {
  // Development/Debug settings (mirrors DetailedErrors from appsettings.json)
  detailedErrors:
    import.meta.env.DEV || import.meta.env.VITE_DETAILED_ERRORS === "true",

  // Logging configuration (mirrors appsettings.json Logging section)
  logging: {
    logLevel: {
      default: import.meta.env.VITE_LOG_LEVEL || "Information",
      api: import.meta.env.VITE_API_LOG_LEVEL || "Warning",
      "Microsoft.AspNetCore": "Warning", // Keep for reference
    },
  },

  // Firestore collection settings
  firestore: {
    collections: {
      cards: import.meta.env.VITE_COLLECTION_CARDS || "cards",
      decks: import.meta.env.VITE_COLLECTION_DECKS || "decks",
    },
  },
};

/**
 * Simple logger that respects configuration
 * Mirrors ASP.NET Core logging levels
 */
export const logger = {
  // Log levels (from lowest to highest priority)
  levels: {
    Trace: 0,
    Debug: 1,
    Information: 2,
    Warning: 3,
    Error: 4,
    Critical: 5,
    None: 6,
  },

  getCurrentLevel() {
    return (
      this.levels[appConfig.logging.logLevel.default] ||
      this.levels["Information"]
    );
  },

  shouldLog(level) {
    return this.levels[level] >= this.getCurrentLevel();
  },

  trace(message, ...args) {
    if (this.shouldLog("Trace")) {
      console.log(`[TRACE] ${message}`, ...args);
    }
  },

  debug(message, ...args) {
    if (this.shouldLog("Debug")) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  info(message, ...args) {
    if (this.shouldLog("Information")) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  warn(message, ...args) {
    if (this.shouldLog("Warning")) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error(message, error, ...args) {
    if (this.shouldLog("Error")) {
      if (appConfig.detailedErrors && error) {
        console.error(`[ERROR] ${message}`, error, ...args);
      } else {
        console.error(`[ERROR] ${message}`, ...args);
      }
    }
  },

  critical(message, error, ...args) {
    if (this.shouldLog("Critical")) {
      if (appConfig.detailedErrors && error) {
        console.error(`[CRITICAL] ${message}`, error, ...args);
      } else {
        console.error(`[CRITICAL] ${message}`, ...args);
      }
    }
  },
};

export default appConfig;
