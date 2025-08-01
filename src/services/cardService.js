import { CardModel } from "../models/CardModel.js";
import { logger } from "../config/appConfig.js";
import { db } from "../config/firebase.js";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

// Import aiService for library syncing
let aiService = null;

// Lazy load aiService to avoid circular dependency
const getAiService = async () => {
  if (!aiService) {
    const { aiService: service } = await import("./aiService.js");
    aiService = service;
  }
  return aiService;
};

/**
 * Card service using Firebase Firestore
 * Direct connection to Firestore database
 */
export class CardService {
  constructor() {
    this.collectionName = import.meta.env.VITE_COLLECTION_CARDS || "cards";
    this.cardsRef = collection(db, this.collectionName);
    logger.info(
      "CardService initialized with Firestore collection:",
      this.collectionName
    );
  }

  /**
   * Get all cards from Firestore
   */
  async getAllAsync() {
    try {
      logger.debug("Fetching all cards from Firestore");
      const querySnapshot = await getDocs(this.cardsRef);

      const cards = [];
      querySnapshot.forEach((doc) => {
        cards.push(CardModel.fromJSON({ id: doc.id, ...doc.data() }));
      });

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
      logger.debug(`Fetching card ${id}`);
      const cardDoc = doc(db, this.collectionName, id);
      const docSnap = await getDoc(cardDoc);

      if (docSnap.exists()) {
        return CardModel.fromJSON({ id: docSnap.id, ...docSnap.data() });
      } else {
        return null;
      }
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
      logger.debug("Creating new card");
      const cardData = card instanceof CardModel ? card.toJSON() : card;

      // Remove id field if present, Firestore will generate one
      const { id, ...dataToAdd } = cardData;

      const docRef = await addDoc(this.cardsRef, dataToAdd);

      const createdCard = CardModel.fromJSON({ id: docRef.id, ...dataToAdd });
      logger.info(`Successfully created card: ${createdCard.cardName}`);

      // Sync AI library
      try {
        const ai = await getAiService();
        await ai.syncCardLibrary();
      } catch (error) {
        logger.warn("Failed to sync AI library after card creation:", error);
      }

      return createdCard;
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
      logger.debug(`Updating card ${id}`);
      const cardData =
        updatedCard instanceof CardModel ? updatedCard.toJSON() : updatedCard;

      // Remove id field from data to update
      const { id: cardId, ...dataToUpdate } = cardData;

      const cardDoc = doc(db, this.collectionName, id);
      await updateDoc(cardDoc, dataToUpdate);

      const updated = CardModel.fromJSON({ id, ...dataToUpdate });
      logger.info(`Successfully updated card: ${updated.cardName}`);

      // Sync AI library
      try {
        const ai = await getAiService();
        await ai.syncCardLibrary();
      } catch (error) {
        logger.warn("Failed to sync AI library after card update:", error);
      }

      return updated;
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
      logger.debug(`Deleting card ${id}`);
      const cardDoc = doc(db, this.collectionName, id);
      await deleteDoc(cardDoc);

      logger.info(`Successfully deleted card ${id}`);

      // Sync AI library
      try {
        const ai = await getAiService();
        await ai.syncCardLibrary();
      } catch (error) {
        logger.warn("Failed to sync AI library after card deletion:", error);
      }

      return true;
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
      logger.debug("Searching cards with filters:", filters);

      let q = query(this.cardsRef);

      // Apply filters
      if (filters.faction) {
        q = query(q, where("faction", "==", filters.faction));
      }

      if (filters.cardType) {
        q = query(q, where("cardType", "==", filters.cardType));
      }

      if (filters.rarity) {
        q = query(q, where("rarity", "==", filters.rarity));
      }

      // Add ordering
      q = query(q, orderBy("cardName"));

      const querySnapshot = await getDocs(q);

      let cards = [];
      querySnapshot.forEach((doc) => {
        cards.push(CardModel.fromJSON({ id: doc.id, ...doc.data() }));
      });

      // Client-side filtering for cardName (Firestore doesn't support case-insensitive regex)
      if (filters.cardName) {
        const searchTerm = filters.cardName.toLowerCase();
        cards = cards.filter((card) =>
          card.cardName.toLowerCase().includes(searchTerm)
        );
      }

      logger.info(`Found ${cards.length} cards matching filters`);
      return cards;
    } catch (error) {
      logger.error("Error searching cards:", error);
      throw error;
    }
  }

  /**
   * Bulk import cards from JSON data
   */
  async bulkImportAsync(cardsData) {
    try {
      logger.debug(`Starting bulk import of ${cardsData.length} cards`);

      const results = {
        success: 0,
        failed: 0,
        errors: [],
      };

      for (const cardData of cardsData) {
        try {
          // Convert to CardModel to ensure proper structure
          const card = CardModel.fromJSON(cardData);

          // Remove id field if present, let Firestore generate one
          const { id, ...dataToAdd } = card.toJSON();

          await addDoc(this.cardsRef, dataToAdd);
          results.success++;

          logger.debug(`Successfully imported card: ${card.cardName}`);
        } catch (error) {
          results.failed++;
          results.errors.push({
            cardName: cardData.cardName || "Unknown",
            error: error.message,
          });
          logger.error(`Failed to import card: ${cardData.cardName}`, error);
        }
      }

      logger.info(
        `Bulk import completed: ${results.success} success, ${results.failed} failed`
      );
      return results;
    } catch (error) {
      logger.error("Error during bulk import:", error);
      throw error;
    }
  }
}

// Create a default instance
export const cardService = new CardService();
export default cardService;
