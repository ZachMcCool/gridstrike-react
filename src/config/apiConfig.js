/**
 * API Configuration settings
 * Equivalent to MongoDbSettings.cs but for frontend API calls
 */
export const apiConfig = {
  // Base API URL - uses environment variables
  baseUrl:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV
      ? "http://localhost:5000/api"
      : "https://your-production-api.com/api"),

  // API endpoints
  endpoints: {
    cards: "/cards",
    decks: "/decks",
    // Add other endpoints as needed
    search: "/cards/search",
    seed: "/cards/seed",
  },

  // Database/Collection names (from environment or defaults)
  database: {
    name: import.meta.env.VITE_DB_NAME || "GridStrikeDb",
    collections: {
      cards: import.meta.env.VITE_COLLECTION_CARDS || "Cards",
      decks: import.meta.env.VITE_COLLECTION_DECKS || "Decks",
    },
  },

  // Request configuration
  request: {
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000, // 10 seconds
    headers: {
      "Content-Type": "application/json",
      // Add authentication headers here if needed
      // 'Authorization': 'Bearer token'
    },
  },
};

/**
 * Environment-specific configuration
 */
export const getApiUrl = (endpoint = "") => {
  return `${apiConfig.baseUrl}${endpoint}`;
};

/**
 * Get full endpoint URL
 */
export const getEndpointUrl = (endpointKey) => {
  const endpoint = apiConfig.endpoints[endpointKey];
  if (!endpoint) {
    throw new Error(`Unknown endpoint: ${endpointKey}`);
  }
  return getApiUrl(endpoint);
};

/**
 * Default fetch configuration
 */
export const defaultFetchConfig = {
  headers: apiConfig.request.headers,
  // Add other default config like credentials, mode, etc.
};

export default apiConfig;
