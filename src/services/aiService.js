import OpenAI from "openai";
import { cardService } from "./cardService.js";

class AIService {
  constructor() {
    this.openai = null;
    this.isConfigured = false;
    this.useContext = true;
    this.maxContextCards = 8;
    this.gameRules = this.getGridStrikeRules();
    this.init();
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
- Flurry: Strike twice with same weapon
- Gunslinger: Strike once with each ranged weapon
- Weapon Master: Strike once with each melee weapon
- Slow: Only 1 action per activation
- Immovable: Cannot be displaced

CONDITIONS (numeric, max 3 stacks):
- Burn X: Take X damage at end of activation
- Regenerate X: Heal Xd3 HP at end of turn
- Stunned X: 1 fewer action this round

COMBAT:
- Attack roll + weapon bonus vs AC
- Damage in dice format (1d4, 1d6, 2d6, etc.)
- Spells always hit (no saves)

SUMMONING:
- Free adjacent to Obelisk
- 1 action adjacent to Legendary unit`;
  }

  init() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
      this.isConfigured = true;
    }
  }

  setContextConfig(useContext = true, maxCards = 8) {
    this.useContext = useContext;
    this.maxContextCards = maxCards;
    console.log(
      `AI Context: ${
        useContext ? `Enabled (max ${maxCards} cards)` : "Disabled"
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
    if (!this.isConfigured) {
      throw new Error(
        "OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file."
      );
    }

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

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a ${cardType} card: ${prompt}` },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const response = completion.choices[0].message.content;
      console.log("Raw AI response:", response); // Debug logging

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
          try {
            return JSON.parse(jsonStr);
          } catch (parseError) {
            console.error("Failed to parse extracted JSON:", parseError);
            console.error("Extracted JSON string was:", jsonStr);
            throw new Error(
              "AI response contained malformed JSON: " + parseError.message
            );
          }
        } else {
          console.error("No JSON object found in response:", response);
          throw new Error("AI response did not contain valid JSON");
        }
      }
    } catch (error) {
      console.error("AI card generation failed:", error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  async generateField(fieldName, currentCard, context = "") {
    if (!this.isConfigured) throw new Error("OpenAI API key not configured");

    const libraryContext = await this.getCardLibraryContext(
      currentCard.cardType || "Unit",
      5
    );
    const rulesSection = this.getGameRulesContext();

    const systemPrompt = `You are helping design a GridStrike card...\n\n${rulesSection}CURRENT CARD: ${JSON.stringify(
      currentCard,
      null,
      2
    )}\n\nSIMILAR CARDS:\n${JSON.stringify(
      libraryContext,
      null,
      2
    )}\n\nGenerate only the ${fieldName} value.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Improve the ${fieldName} for this card. ${context}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      return completion.choices[0].message.content.trim().replace(/"/g, "");
    } catch (error) {
      console.error("AI field generation failed:", error);
      throw new Error(`AI field generation failed: ${error.message}`);
    }
  }

  /**
   * Generate a specific field for a weapon
   */
  async generateWeaponField(fieldName, currentWeapon, currentCard) {
    if (!this.isConfigured) {
      throw new Error("OpenAI API key not configured");
    }

    const rulesSection = this.getGameRulesContext();

    const systemPrompt = `You are helping design a weapon for a GridStrike card. Generate ONLY the new value for the specified weapon field.

${rulesSection}

WEAPON FORMATTING RULES:
- Damage MUST be in dice format: "1d4", "1d6", "2d6", "1d8+2", etc. NEVER just numbers
- Attack bonus format: "+1", "+2", "+3", etc.
- Keywords are lowercase with numbers: "piercing", "burn 1", "poison 2"

CURRENT WEAPON: ${JSON.stringify(currentWeapon, null, 2)}
FULL CARD CONTEXT: ${JSON.stringify(currentCard, null, 2)}

Generate only the ${fieldName} value for this weapon.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generate the ${fieldName} for this weapon.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 50,
      });

      return completion.choices[0].message.content.trim().replace(/"/g, "");
    } catch (error) {
      console.error("AI weapon field generation failed:", error);
      throw new Error(`AI weapon field generation failed: ${error.message}`);
    }
  }

  /**
   * Generate a specific field for an ability
   */
  async generateAbilityField(fieldName, currentAbility, currentCard) {
    if (!this.isConfigured) {
      throw new Error("OpenAI API key not configured");
    }

    const rulesSection = this.getGameRulesContext();

    const systemPrompt = `You are helping design an ability for a GridStrike card. Generate ONLY the new value for the specified ability field.

${rulesSection}

ABILITY FORMATTING RULES:
- Cost should be action point numbers like "0", "1", "2" (never more than 2)
- Title should be short and descriptive
- Description should explain the effect clearly and include proper formatting for damage/effects

CURRENT ABILITY: ${JSON.stringify(currentAbility, null, 2)}
FULL CARD CONTEXT: ${JSON.stringify(currentCard, null, 2)}

Generate only the ${fieldName} value for this ability.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generate the ${fieldName} for this ability.`,
          },
        ],
        temperature: 0.7,
        max_tokens: fieldName === "description" ? 150 : 50,
      });

      return completion.choices[0].message.content.trim().replace(/"/g, "");
    } catch (error) {
      console.error("AI ability field generation failed:", error);
      throw new Error(`AI ability field generation failed: ${error.message}`);
    }
  }

  async generateWeapon(currentCard) {
    if (!this.isConfigured) return null;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Generate a weapon for this GridStrike card.\n\nIMPORTANT: Damage MUST use dice format. Status effects MUST include numbers.\nReturn only JSON. Example: {"name":"Slash","type":"Melee","attackBonus":2,"damage":"1d6","keywords":"none","range":"melee"}`,
          },
          { role: "user", content: `Card: ${JSON.stringify(currentCard)}` },
        ],
        temperature: 0.8,
        max_tokens: 200,
      });

      const response = completion.choices[0].message.content;
      console.log("Raw AI weapon response:", response); // Debug logging

      try {
        return JSON.parse(response.trim());
      } catch (e) {
        console.log("Direct weapon JSON parse failed, trying extraction..."); // Debug logging
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
          console.log("Extracted weapon JSON string:", jsonStr); // Debug logging
          try {
            return JSON.parse(jsonStr);
          } catch (parseError) {
            console.error("Failed to parse extracted weapon JSON:", parseError);
            console.error("Extracted weapon JSON string was:", jsonStr);
            return null;
          }
        } else {
          console.error("No JSON object found in weapon response:", response);
          return null;
        }
      }
    } catch (error) {
      console.error("AI weapon generation failed:", error);
      return null;
    }
  }

  async generateAbility(currentCard) {
    if (!this.isConfigured) return null;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Generate an ability for this GridStrike card.\n\nIMPORTANT: Damage MUST use dice format. Status effects MUST include numbers.\nReturn only JSON. Example: {"title":"Blaze","description":"Deal 1d6 fire damage and apply burn 1.","passive":false,"cost":1}`,
          },
          { role: "user", content: `Card: ${JSON.stringify(currentCard)}` },
        ],
        temperature: 0.8,
        max_tokens: 200,
      });

      const response = completion.choices[0].message.content;
      console.log("Raw AI ability response:", response); // Debug logging

      try {
        return JSON.parse(response.trim());
      } catch (e) {
        console.log("Direct ability JSON parse failed, trying extraction..."); // Debug logging
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
          console.log("Extracted ability JSON string:", jsonStr); // Debug logging
          try {
            return JSON.parse(jsonStr);
          } catch (parseError) {
            console.error(
              "Failed to parse extracted ability JSON:",
              parseError
            );
            console.error("Extracted ability JSON string was:", jsonStr);
            return null;
          }
        } else {
          console.error("No JSON object found in ability response:", response);
          return null;
        }
      }
    } catch (error) {
      console.error("AI ability generation failed:", error);
      return null;
    }
  }

  async generateEnergyCost(currentCard) {
    if (!this.isConfigured) return null;

    const rulesSection = this.getGameRulesContext();

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Analyze this GridStrike card and suggest a balanced energy cost.\n\n${rulesSection}Return ONLY a single number (1-10).`,
          },
          {
            role: "user",
            content: `Card: ${JSON.stringify(currentCard, null, 2)}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 50,
      });

      const response = completion.choices[0].message.content.trim();
      const cost = parseInt(response);
      return isNaN(cost) ? null : Math.max(1, Math.min(10, cost));
    } catch (error) {
      console.error("AI energy cost generation failed:", error);
      return null;
    }
  }

  async generateAbilityDescription(currentDescription, currentCard) {
    if (!this.isConfigured) return null;

    const rulesSection = this.getGameRulesContext();

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Improve this ability description to be clear and consistent with GridStrike.\n\n${rulesSection}Return ONLY the improved description text.`,
          },
          {
            role: "user",
            content: `Current description: \"${currentDescription}\"\nCard context: ${JSON.stringify(
              currentCard,
              null,
              2
            )}`,
          },
        ],
        temperature: 0.6,
        max_tokens: 150,
      });

      return completion.choices[0].message.content.trim().replace(/"/g, "");
    } catch (error) {
      console.error("AI description improvement failed:", error);
      return null;
    }
  }
}

export const aiService = new AIService();
