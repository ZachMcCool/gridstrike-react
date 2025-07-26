import { CardModel } from "../models/CardModel.js";
import { logger } from "../config/appConfig.js";

/**
 * Card service using MongoDB Atlas Data API
 * Direct connection to MongoDB without backend API
 */
export class CardService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_MONGODB_DATA_API_URL;
    this.apiKey = import.meta.env.VITE_MONGODB_API_KEY;
    this.dataSource = import.meta.env.VITE_MONGODB_DATA_SOURCE || "Cluster0";
    this.database = import.meta.env.VITE_DB_NAME || "GridStrikeDb";
    this.collection = import.meta.env.VITE_COLLECTION_CARDS || "Cards";
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
   * Get all cards from MongoDB
   */
  async getAllAsync() {
    try {
      logger.debug("Fetching all cards from MongoDB");
      const result = await this.makeRequest("find", {
        filter: {}, // Empty filter = get all
      });

      const cards = result.documents.map((doc) => CardModel.fromJSON(doc));
      logger.info(`Successfully fetched ${cards.length} cards`);
      return cards;
    } catch (error) {
      logger.error("Error fetching all cards", error);
      throw error;
    }
  }

  /**
   * Get one card by ID
   */
  async getByIdAsync(id) {
    try {
      const result = await this.makeRequest("findOne", {
        filter: { _id: { $oid: id } },
      });

      return result.document ? CardModel.fromJSON(result.document) : null;
    } catch (error) {
      logger.error(`Error fetching card ${id}`, error);
      throw error;
    }
  }

  /**
   * Create a new card
   */
  async createAsync(card) {
    try {
      const cardData = card instanceof CardModel ? card.toJSON() : card;

      const result = await this.makeRequest("insertOne", {
        document: cardData,
      });

      // Return the created card with the new _id
      const createdCard = { ...cardData, id: result.insertedId };
      return CardModel.fromJSON(createdCard);
    } catch (error) {
      logger.error("Error creating card:", error);
      throw error;
    }
  }

  /**
   * Update an existing card
   */
  async updateAsync(id, updatedCard) {
    try {
      const cardData =
        updatedCard instanceof CardModel ? updatedCard.toJSON() : updatedCard;

      const result = await this.makeRequest("updateOne", {
        filter: { _id: { $oid: id } },
        update: { $set: cardData },
      });

      if (result.matchedCount === 0) {
        throw new Error(`Card with id ${id} not found`);
      }

      return CardModel.fromJSON({ ...cardData, id });
    } catch (error) {
      logger.error(`Error updating card ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a card
   */
  async deleteAsync(id) {
    try {
      const result = await this.makeRequest("deleteOne", {
        filter: { _id: { $oid: id } },
      });

      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting card ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search cards by filters
   */
  async searchAsync(filters = {}) {
    try {
      const mongoFilter = {};

      // Convert React filters to MongoDB filter format
      if (filters.faction) mongoFilter.faction = filters.faction;
      if (filters.cardType) mongoFilter.cardType = filters.cardType;
      if (filters.rarity) mongoFilter.rarity = filters.rarity;
      if (filters.cardName) {
        mongoFilter.cardName = { $regex: filters.cardName, $options: "i" };
      }

      const result = await this.makeRequest("find", {
        filter: mongoFilter,
      });

      return result.documents.map((doc) => CardModel.fromJSON(doc));
    } catch (error) {
      logger.error("Error searching cards:", error);
      throw error;
    }
  }
}

// Create a default instance
export const cardService = new CardService();
export default cardService;
