import { DeckModel } from "../models/DeckModel.js";
import { logger } from "../config/appConfig.js";

/**
 * Deck service using MongoDB Atlas Data API
 * Direct connection to MongoDB without backend API
 */
export class DeckService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_MONGODB_DATA_API_URL;
    this.apiKey = import.meta.env.VITE_MONGODB_API_KEY;
    this.dataSource = import.meta.env.VITE_MONGODB_DATA_SOURCE || "Cluster0";
    this.database = import.meta.env.VITE_DB_NAME || "GridStrikeDb";
    this.collection = import.meta.env.VITE_COLLECTION_DECKS || "Decks";
  }

  /**
   * Make MongoDB Data API request
   */
  async makeRequest(action, body = {}) {
    const response = await fetch(`${this.baseUrl}/action/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": this.apiKey,
      },
      body: JSON.stringify({
        dataSource: this.dataSource,
        database: this.database,
        collection: this.collection,
        ...body,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `MongoDB API Error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get all decks from MongoDB
   */
  async getAllAsync() {
    try {
      logger.debug("Fetching all decks from MongoDB");
      const result = await this.makeRequest("find", {
        filter: {}, // Empty filter = get all
      });

      const decks = result.documents.map((doc) => DeckModel.fromJSON(doc));
      logger.info(`Successfully fetched ${decks.length} decks`);
      return decks;
    } catch (error) {
      logger.error("Error fetching all decks", error);
      throw error;
    }
  }

  /**
   * Get one deck by ID
   */
  async getByIdAsync(id) {
    try {
      logger.debug(`Fetching deck ${id}`);
      const result = await this.makeRequest("findOne", {
        filter: { _id: { $oid: id } },
      });

      if (!result.document) {
        return null;
      }

      return DeckModel.fromJSON(result.document);
    } catch (error) {
      logger.error(`Error fetching deck ${id}`, error);
      throw error;
    }
  }

  /**
   * Create a new deck
   */
  async createAsync(deck) {
    try {
      logger.debug("Creating new deck");
      const deckData = deck instanceof DeckModel ? deck.toJSON() : deck;

      const result = await this.makeRequest("insertOne", {
        document: deckData,
      });

      // Return the created deck with the new _id
      const createdDeck = { ...deckData, id: result.insertedId };
      logger.info("Successfully created deck");
      return DeckModel.fromJSON(createdDeck);
    } catch (error) {
      logger.error("Error creating deck:", error);
      throw error;
    }
  }

  /**
   * Update an existing deck
   */
  async updateAsync(id, updatedDeck) {
    try {
      logger.debug(`Updating deck ${id}`);
      const deckData =
        updatedDeck instanceof DeckModel ? updatedDeck.toJSON() : updatedDeck;

      const result = await this.makeRequest("updateOne", {
        filter: { _id: { $oid: id } },
        update: { $set: deckData },
      });

      if (result.matchedCount === 0) {
        throw new Error(`Deck with id ${id} not found`);
      }

      logger.info(`Successfully updated deck ${id}`);
      return DeckModel.fromJSON({ ...deckData, id });
    } catch (error) {
      logger.error(`Error updating deck ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a deck
   */
  async deleteAsync(id) {
    try {
      logger.debug(`Deleting deck ${id}`);
      const result = await this.makeRequest("deleteOne", {
        filter: { _id: { $oid: id } },
      });

      logger.info(`Successfully deleted deck ${id}`);
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting deck ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get decks by user (if you have user authentication)
   */
  async getByUserAsync(userId) {
    try {
      logger.debug(`Fetching decks for user ${userId}`);
      const result = await this.makeRequest("find", {
        filter: { userId: userId }, // Assuming decks have a userId field
      });

      const decks = result.documents.map((doc) => DeckModel.fromJSON(doc));
      logger.info(
        `Successfully fetched ${decks.length} decks for user ${userId}`
      );
      return decks;
    } catch (error) {
      logger.error(`Error fetching decks for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Search decks by name or other criteria
   */
  async searchAsync(searchTerm) {
    try {
      logger.debug(`Searching decks with term: ${searchTerm}`);
      const result = await this.makeRequest("find", {
        filter: {
          name: { $regex: searchTerm, $options: "i" }, // Case-insensitive search
        },
      });

      const decks = result.documents.map((doc) => DeckModel.fromJSON(doc));
      logger.info(`Found ${decks.length} decks matching search term`);
      return decks;
    } catch (error) {
      logger.error("Error searching decks", error);
      throw error;
    }
  }

  /**
   * Search decks by faction
   */
  async getByFactionAsync(faction) {
    try {
      logger.debug(`Fetching decks for faction: ${faction}`);
      const result = await this.makeRequest("find", {
        filter: { faction: faction },
      });

      const decks = result.documents.map((doc) => DeckModel.fromJSON(doc));
      logger.info(`Successfully fetched ${decks.length} ${faction} decks`);
      return decks;
    } catch (error) {
      logger.error(`Error fetching decks for faction ${faction}`, error);
      throw error;
    }
  }

  /**
   * Advanced search with multiple filters
   */
  async searchWithFiltersAsync(filters = {}) {
    try {
      const mongoFilter = {};

      // Convert React filters to MongoDB filter format
      if (filters.faction) mongoFilter.faction = filters.faction;
      if (filters.name) {
        mongoFilter.name = { $regex: filters.name, $options: "i" };
      }
      if (filters.userId) mongoFilter.userId = filters.userId;

      const result = await this.makeRequest("find", {
        filter: mongoFilter,
      });

      return result.documents.map((doc) => DeckModel.fromJSON(doc));
    } catch (error) {
      logger.error("Error searching decks with filters:", error);
      throw error;
    }
  }
}

// Create a default instance for easy importing
export const deckService = new DeckService();

// Export for use in React components
export default deckService;
