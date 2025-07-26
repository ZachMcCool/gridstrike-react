import { DeckModel } from "../models/DeckModel.js";
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

/**
 * Deck service using Firebase Firestore
 * Direct connection to Firestore database
 */
export class DeckService {
  constructor() {
    this.collectionName = import.meta.env.VITE_COLLECTION_DECKS || "decks";
    this.decksRef = collection(db, this.collectionName);
    logger.info(
      "DeckService initialized with Firestore collection:",
      this.collectionName
    );
  }

  /**
   * Get all decks from Firestore
   */
  async getAllAsync() {
    try {
      logger.debug("Fetching all decks from Firestore");
      const querySnapshot = await getDocs(this.decksRef);

      const decks = [];
      querySnapshot.forEach((doc) => {
        decks.push(DeckModel.fromJSON({ id: doc.id, ...doc.data() }));
      });

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
      const deckDoc = doc(db, this.collectionName, id);
      const docSnap = await getDoc(deckDoc);

      if (docSnap.exists()) {
        return DeckModel.fromJSON({ id: docSnap.id, ...docSnap.data() });
      } else {
        return null;
      }
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

      // Remove id field if present, Firestore will generate one
      const { id, ...dataToAdd } = deckData;

      const docRef = await addDoc(this.decksRef, dataToAdd);

      const createdDeck = DeckModel.fromJSON({ id: docRef.id, ...dataToAdd });
      logger.info(`Successfully created deck: ${createdDeck.name}`);
      return createdDeck;
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

      // Remove id field from data to update
      const { id: deckId, ...dataToUpdate } = deckData;

      const deckDoc = doc(db, this.collectionName, id);
      await updateDoc(deckDoc, dataToUpdate);

      const updated = DeckModel.fromJSON({ id, ...dataToUpdate });
      logger.info(`Successfully updated deck: ${updated.name}`);
      return updated;
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
      const deckDoc = doc(db, this.collectionName, id);
      await deleteDoc(deckDoc);

      logger.info(`Successfully deleted deck ${id}`);
      return true;
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
      const q = query(this.decksRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      const decks = [];
      querySnapshot.forEach((doc) => {
        decks.push(DeckModel.fromJSON({ id: doc.id, ...doc.data() }));
      });

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

      // Get all decks and filter client-side (Firestore doesn't support case-insensitive contains)
      const querySnapshot = await getDocs(this.decksRef);

      const decks = [];
      const searchLower = searchTerm.toLowerCase();

      querySnapshot.forEach((doc) => {
        const deckData = doc.data();
        if (
          deckData.name &&
          deckData.name.toLowerCase().includes(searchLower)
        ) {
          decks.push(DeckModel.fromJSON({ id: doc.id, ...deckData }));
        }
      });

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
      const q = query(this.decksRef, where("faction", "==", faction));
      const querySnapshot = await getDocs(q);

      const decks = [];
      querySnapshot.forEach((doc) => {
        decks.push(DeckModel.fromJSON({ id: doc.id, ...doc.data() }));
      });

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
      logger.debug("Searching decks with filters:", filters);

      let q = query(this.decksRef);

      // Apply Firestore-supported filters
      if (filters.faction) {
        q = query(q, where("faction", "==", filters.faction));
      }

      if (filters.userId) {
        q = query(q, where("userId", "==", filters.userId));
      }

      const querySnapshot = await getDocs(q);

      let decks = [];
      querySnapshot.forEach((doc) => {
        decks.push(DeckModel.fromJSON({ id: doc.id, ...doc.data() }));
      });

      // Client-side filtering for name (case-insensitive contains)
      if (filters.name) {
        const searchLower = filters.name.toLowerCase();
        decks = decks.filter(
          (deck) => deck.name && deck.name.toLowerCase().includes(searchLower)
        );
      }

      logger.info(`Found ${decks.length} decks matching filters`);
      return decks;
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
