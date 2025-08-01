import { getFunctions, httpsCallable } from "firebase/functions";
import { cardService } from "./cardService.js";

class AIService {
  constructor() {
    this.functions = getFunctions();
    this.isConfigured = true; // Always configured when using Firebase Functions
    this.useContext = true;
    this.maxContextCards = 8;
    this.gameRules = this.getGridStrikeRules();
  }

  // Call Firebase Function for AI generation
  async callAIFunction(functionName, data) {
    try {
      const callable = httpsCallable(this.functions, functionName);
      const result = await callable(data);
      return result.data;
    } catch (error) {
      console.error(`Firebase Function ${functionName} error:`, error);
      throw new Error(`AI service unavailable: ${error.message}`);
    }
  }

  getGridStrikeRules() {
    return `GRIDSTRIKE GAME RULES:

CORE MECHANICS:
- Tactical card game on 24x24 grid
- Goal: Destroy enemy Obelisk
- 40-card decks + Commander + Obelisk
- Energy system: gain energy = round number
- Units have HP, AC, Move stats
- 2 actions per activation: Move, Strike, Use Ability

CRITICAL ACTION POINT RULES:
- Units have exactly 2 action points per activation
- Abilities cost 0, 1, or 2 action points MAX
- 0 AP abilities MUST be passive (passive: true)
- Active abilities cost 1 or 2 AP only
- No abilities should cost 3+ AP (impossible to use)

ENERGY COSTS (balanced by power level):
- Commons: 1-4 energy typical
- Rares: 3-6 energy typical  
- Legendaries: 5-8+ energy typical
- Higher stats/abilities = higher cost

CARD TYPES:
- Units: HP/AC/Move stats, weapons, abilities
- Spells: Instant (any time) or Sorcery (your turn only)
- Equipment: Attach to units for bonuses
- Terrain: Battlefield modifications

FACTIONS & RARITY:
- Red (aggressive), Blue (control), Green (nature), White (order), Black (dark), Colorless (neutral)
- Commons (3 copies max), Rares (2 copies), Legendaries (1 copy)

KEYWORDS:
- Haste: Act on summon turn with 1 action
- Flurry: Strike twice with same weapon`;
  }

  setContextUsage(enabled) {
    this.useContext = enabled;
    console.log(
      `AI Context usage ${enabled ? "enabled" : "disabled"}. ${
        enabled
          ? `Will include up to ${this.maxContextCards} similar cards for reference.`
          : "Will generate cards without existing card context."
      }`
    );
  }

  getContextConfig() {
    return {
      useContext: this.useContext,
      maxContextCards: this.maxContextCards,
      estimatedTokensPerRequest: this.useContext
        ? this.maxContextCards * 50
        : 0,
    };
  }

  async getCardLibraryContext(cardType = "Unit", maxCards = 10) {
    try {
      const cards = await cardService.getAllAsync();
      const relevantCards = cards.filter((card) => card.cardType === cardType);
      const otherCards = cards.filter((card) => card.cardType !== cardType);
      const selectedCards = [
        ...relevantCards.slice(0, Math.min(maxCards - 2, relevantCards.length)),
        ...otherCards.slice(0, Math.max(2, maxCards - relevantCards.length)),
      ].slice(0, maxCards);

      return selectedCards.map((card) => ({
        name: card.cardName,
        type: card.cardType,
        faction: card.faction,
        cost: card.energyCost,
        rarity: card.rarity,
        ...(card.cardType === "Unit" && {
          hp: card.hp,
          ac: card.ac,
          move: card.move,
        }),
      }));
    } catch (error) {
      console.warn("Could not fetch card library for AI context:", error);
      return [];
    }
  }

  setGameRules(rulesText) {
    this.gameRules = rulesText;
    console.log("Game rules updated for AI context");
  }

  getGameRulesContext() {
    return this.gameRules ? `GAME RULES DOCUMENT:\n${this.gameRules}\n` : "";
  }

  async generateCard(prompt, cardType = "Unit") {
    try {
      const libraryContext = this.useContext
        ? await this.getCardLibraryContext(cardType, this.maxContextCards)
        : [];
      const contextSection =
        libraryContext.length > 0
          ? `SIMILAR CARDS FOR BALANCE REFERENCE (${cardType}s prioritized):\n${JSON.stringify(
              libraryContext,
              null,
              2
            )}`
          : "No existing cards for reference - be creative but balanced.";
      const rulesSection = this.getGameRulesContext();

      const systemPrompt = `You are a card game designer for GridStrike, a tactical card game.

${rulesSection}

GAME CONTEXT:
- GridStrike is a tactical combat card game with Units, Spells, Equipment, and Terrain
- Units have stats: HP (health), AC (armor class), Move (movement speed)
- Energy Cost determines how expensive the card is to play
- Factions: Red (aggressive), Blue (control), Green (nature), White (order), Black (dark), Colorless (neutral)
- Rarities: Common, Rare, Legendary
- Keywords add special abilities (examples: Flying, Trample, First Strike, Defender)

IMPORTANT FORMATTING RULES:
- Damage MUST be in dice format: "1d4", "1d6", "2d6", "1d8+2", etc. NEVER just numbers like "2" or "3"
- Status effects MUST include numbers: "burn 1", "poison 2", "slow 3", NOT just "burn" or "poison"
- Action Point Rules: Units have 2 AP max per activation
- 0 AP abilities MUST be passive (passive: true)
- Active abilities cost 1 or 2 AP only (NEVER 3+)

${contextSection}

CARD STRUCTURE:
{
  "cardName": "string",
  "cardType": "Unit|Spell|Equipment|Terrain",
  "faction": "Red|Blue|Green|White|Black|Colorless",
  "energyCost": number,
  "rarity": "Common|Rare|Legendary",
  "size": "string (e.g., Medium, Large)",
  "keywords": ["array", "of", "strings"],
  "hp": number (Units only),
  "ac": number (Units only), 
  "move": number (Units only),
  "type": "string (e.g., Beast, Humanoid - Units only)",
  "weapons": [{"name": "string", "type": "Melee|Ranged", "attackBonus": number, "damage": "1d6 format", "keywords": "string", "range": "string"}],
  "abilities": [{"title": "string", "description": "string", "passive": boolean, "cost": number}],
  "effect": "string (Spells/Equipment/Terrain)",
  "spellType": "Instant|Sorcery (Spells only)",
  "range": "string (Spells only)",
  "auraType": "string (Terrain only)"
}

Return ONLY valid JSON. Do not include any explanatory text before or after the JSON.`;

      const fullPrompt = `${systemPrompt}\n\nCreate a ${cardType} card: ${prompt}`;

      // Call Firebase Function
      const result = await this.callAIFunction("generateCard", {
        prompt: fullPrompt,
        cardType,
        useAssistant: true,
      });

      if (!result.success) {
        throw new Error("AI generation failed");
      }

      const response = result.content;
      console.log("Raw AI response:", response); // Debug logging

      // Extract JSON from response
      try {
        return JSON.parse(response.trim());
      } catch (e) {
        console.log("Direct JSON parse failed, trying extraction..."); // Debug logging
        let braceCount = 0,
          jsonStart = -1,
          jsonEnd = -1;
        for (let i = 0; i < response.length; i++) {
          const char = response[i];
          if (char === "{") {
            if (braceCount === 0) jsonStart = i;
            braceCount++;
          } else if (char === "}") {
            braceCount--;
            if (braceCount === 0 && jsonStart !== -1) {
              jsonEnd = i;
              break;
            }
          }
        }
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = response.substring(jsonStart, jsonEnd + 1);
          console.log("Extracted JSON string:", jsonStr); // Debug logging
          return JSON.parse(jsonStr);
        }
        throw new Error("Could not extract valid JSON from AI response");
      }
    } catch (error) {
      console.error("Error generating card:", error);
      throw new Error(`Failed to generate card: ${error.message}`);
    }
  }

  async generateField(fieldName, currentCard, context = "") {
    try {
      const result = await this.callAIFunction("generateField", {
        fieldType: fieldName,
        currentValue: currentCard[fieldName] || "",
        cardContext: JSON.stringify(currentCard),
      });

      if (!result.success) {
        throw new Error("Field generation failed");
      }

      return result.content.trim();
    } catch (error) {
      console.error("Error generating field:", error);
      throw new Error(`Failed to generate ${fieldName}: ${error.message}`);
    }
  }

  async generateWeaponField(fieldName, currentWeapon, currentCard) {
    try {
      const context = `Card: ${currentCard.cardName} (${currentCard.cardType}), Weapon: ${currentWeapon.name}`;
      const result = await this.callAIFunction("generateField", {
        fieldType: `weapon ${fieldName}`,
        currentValue: currentWeapon[fieldName] || "",
        cardContext: context,
      });

      if (!result.success) {
        throw new Error("Weapon field generation failed");
      }

      return result.content.trim();
    } catch (error) {
      console.error("Error generating weapon field:", error);
      throw new Error(
        `Failed to generate weapon ${fieldName}: ${error.message}`
      );
    }
  }

  async generateAbilityField(fieldName, currentAbility, currentCard) {
    try {
      const context = `Card: ${currentCard.cardName} (${currentCard.cardType}), Ability: ${currentAbility.title}`;
      const result = await this.callAIFunction("generateField", {
        fieldType: `ability ${fieldName}`,
        currentValue: currentAbility[fieldName] || "",
        cardContext: context,
      });

      if (!result.success) {
        throw new Error("Ability field generation failed");
      }

      return result.content.trim();
    } catch (error) {
      console.error("Error generating ability field:", error);
      throw new Error(
        `Failed to generate ability ${fieldName}: ${error.message}`
      );
    }
  }

  async generateWeapon(currentCard) {
    try {
      const prompt = `Generate a weapon for ${currentCard.cardName} (${currentCard.cardType}, ${currentCard.faction} faction). Return JSON: {"name": "string", "type": "Melee|Ranged", "attackBonus": number, "damage": "1d6 format", "keywords": "string", "range": "string"}`;

      const result = await this.callAIFunction("generateCard", {
        prompt,
        cardType: "Weapon",
        useAssistant: false,
      });

      if (!result.success) {
        throw new Error("Weapon generation failed");
      }

      const response = result.content;
      console.log("Raw weapon response:", response);

      // Extract JSON from response
      try {
        return JSON.parse(response.trim());
      } catch (e) {
        let braceCount = 0,
          jsonStart = -1,
          jsonEnd = -1;
        for (let i = 0; i < response.length; i++) {
          const char = response[i];
          if (char === "{") {
            if (braceCount === 0) jsonStart = i;
            braceCount++;
          } else if (char === "}") {
            braceCount--;
            if (braceCount === 0 && jsonStart !== -1) {
              jsonEnd = i;
              break;
            }
          }
        }
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = response.substring(jsonStart, jsonEnd + 1);
          return JSON.parse(jsonStr);
        }
        throw new Error("Could not extract valid weapon JSON");
      }
    } catch (error) {
      console.error("Error generating weapon:", error);
      throw new Error(`Failed to generate weapon: ${error.message}`);
    }
  }

  async generateAbility(currentCard) {
    try {
      const prompt = `Generate an ability for ${currentCard.cardName} (${currentCard.cardType}, ${currentCard.faction} faction). Return JSON: {"title": "string", "description": "string", "passive": boolean, "cost": number}. Remember: 0 AP = passive:true, 1-2 AP = active abilities only.`;

      const result = await this.callAIFunction("generateCard", {
        prompt,
        cardType: "Ability",
        useAssistant: false,
      });

      if (!result.success) {
        throw new Error("Ability generation failed");
      }

      const response = result.content;
      console.log("Raw ability response:", response);

      // Extract JSON from response
      try {
        return JSON.parse(response.trim());
      } catch (e) {
        let braceCount = 0,
          jsonStart = -1,
          jsonEnd = -1;
        for (let i = 0; i < response.length; i++) {
          const char = response[i];
          if (char === "{") {
            if (braceCount === 0) jsonStart = i;
            braceCount++;
          } else if (char === "}") {
            braceCount--;
            if (braceCount === 0 && jsonStart !== -1) {
              jsonEnd = i;
              break;
            }
          }
        }
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = response.substring(jsonStart, jsonEnd + 1);
          return JSON.parse(jsonStr);
        }
        throw new Error("Could not extract valid ability JSON");
      }
    } catch (error) {
      console.error("Error generating ability:", error);
      throw new Error(`Failed to generate ability: ${error.message}`);
    }
  }

  async generateEnergyCost(currentCard) {
    try {
      const context = `Card: ${currentCard.cardName}, Type: ${currentCard.cardType}, Faction: ${currentCard.faction}, Rarity: ${currentCard.rarity}`;
      const result = await this.callAIFunction("generateField", {
        fieldType: "energy cost",
        currentValue: currentCard.energyCost || "",
        cardContext: context,
      });

      if (!result.success) {
        throw new Error("Energy cost generation failed");
      }

      const cost = parseInt(result.content.trim());
      return isNaN(cost) ? 1 : Math.max(1, Math.min(15, cost));
    } catch (error) {
      console.error("Error generating energy cost:", error);
      return 3; // Fallback to reasonable default
    }
  }

  async generateAbilityDescription(currentDescription, currentCard) {
    try {
      const context = `Card: ${currentCard.cardName} (${currentCard.cardType})`;
      const result = await this.callAIFunction("generateField", {
        fieldType: "ability description",
        currentValue: currentDescription,
        cardContext: context,
      });

      if (!result.success) {
        throw new Error("Description generation failed");
      }

      return result.content.trim();
    } catch (error) {
      console.error("Error generating description:", error);
      throw new Error(`Failed to generate description: ${error.message}`);
    }
  }
}

export const aiService = new AIService();
