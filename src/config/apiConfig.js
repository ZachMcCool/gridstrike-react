/**
 * API Configuration settings
 * Configuration for Firebase Firestore
 *
 * Note: This app now uses Firebase Firestore directly from the client.
 * The API endpoints below are kept for reference but are not actively used.
 */
export const apiConfig = {
  // Legacy API configuration (not used with Firestore)
  baseUrl: "not-used-with-firestore",

  // Legacy API endpoints (not used with Firestore)
  endpoints: {
    cards: "/cards",
    decks: "/decks",
    search: "/cards/search",
    seed: "/cards/seed",
  },

  // Firestore collections
  firestore: {
    collections: {
      cards: import.meta.env.VITE_COLLECTION_CARDS || "cards",
      decks: import.meta.env.VITE_COLLECTION_DECKS || "decks",
    },
  },

  // Request configuration (legacy, not used with Firestore)
  request: {
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
    headers: {
      "Content-Type": "application/json",
    },
  },
};

/**
 * Legacy helper functions (not used with Firestore)
 */
export const getApiUrl = (endpoint = "") => {
  return `not-used-with-firestore${endpoint}`;
};

/**
 * Legacy endpoint URL helper (not used with Firestore)
 */
export const getEndpointUrl = (endpointKey) => {
  const endpoint = apiConfig.endpoints[endpointKey];
  if (!endpoint) {
    throw new Error(`Unknown endpoint: ${endpointKey}`);
  }
  return getApiUrl(endpoint);
};

/**
 * Legacy fetch configuration (not used with Firestore)
 */
export const defaultFetchConfig = {
  headers: apiConfig.request.headers,
};

export default apiConfig;
