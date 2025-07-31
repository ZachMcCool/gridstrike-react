import React, { useState, useEffect } from 'react';
import CardComponent from '../components/CardComponent.jsx';
import CardEditModal from '../components/CardEditModal.jsx';
import { CardModel } from '../models/CardModel.js';
import { cardService } from '../services/cardService.js';
import { aiService } from '../services/aiService.js';
import './Library.css';

/**
 * Library Page - Main page for viewing and editing cards
 * Equivalent to the Blazor Library page
 */
const Library = () => {
  const [cards, setCards] = useState([]);
  const [selectedFactions, setSelectedFactions] = useState(new Set());
  const [selectedTypes, setSelectedTypes] = useState(new Set());
  const [sortBy, setSortBy] = useState('Name');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [cardBeingEdited, setCardBeingEdited] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);

  const allFactions = ['Red', 'Green', 'Black', 'White', 'Blue', 'Colorless'];
  const allTypes = ['Unit', 'Spell', 'Equipment', 'Terrain'];

  // Load cards on component mount
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    // debugger
    try {
      setIsLoading(true);
      // Change from getAll() to getAllAsync()
      const loadedCards = await cardService.getAllAsync();
      setCards(loadedCards);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openNewCardModal = () => {
    setCardBeingEdited(new CardModel());
    setShowEditModal(true);
  };

  const openEditModal = (card) => {
    setCardBeingEdited(card);
    setShowEditModal(true);
  };

  const saveEditedCard = async (updatedCard) => {
    try {
      const isNew = !updatedCard.id || updatedCard.id === '' || !cards.some(c => c.id === updatedCard.id);

      if (isNew) {
        // Generate new ID for new cards
        updatedCard.id = crypto.randomUUID();
        
        // Save to database - Change from create() to createAsync()
        const savedCard = await cardService.createAsync(updatedCard);
        
        // Add to local state
        setCards(prev => [...prev, savedCard]);
      } else {
        // Update existing card - Change from update() to updateAsync()
        const savedCard = await cardService.updateAsync(updatedCard.id, updatedCard);
        
        // Update in local state
        setCards(prev => prev.map(c => c.id === updatedCard.id ? savedCard : c));
      }

      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to save card:', error);
      // Could show a toast notification here
    }
  };

  const deleteCard = async (card) => {
    if (!window.confirm(`Are you sure you want to delete "${card.cardName}"?`)) {
      return;
    }

    try {
      // Remove from database - Change from delete() to deleteAsync()
      await cardService.deleteAsync(card.id);
      
      // Remove from local state
      setCards(prev => prev.filter(c => c.id !== card.id));
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  const exportCards = () => {
    const json = JSON.stringify(cards, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cards.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const downloadAllCards = async () => {
    // This would need to be implemented with a library like html2canvas
    // For now, just show an alert
    alert('Download all cards feature would require implementing image capture of all cards');
  };

  const importCards = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setIsImporting(true);
        const jsonData = JSON.parse(e.target.result);
        
        // Handle both array format and object with cards array
        const cardsArray = Array.isArray(jsonData) ? jsonData : jsonData.cards || [];
        
        if (!Array.isArray(cardsArray) || cardsArray.length === 0) {
          alert('Invalid JSON format. Expected an array of cards or an object with a "cards" property.');
          return;
        }
        
        // Map the JSON format to our CardModel format
        const mappedCards = cardsArray.map(card => mapJsonToCardModel(card));
        
        const result = await cardService.bulkImportAsync(mappedCards);
        
        // Show results
        const message = `Import completed!\n✅ Success: ${result.success} cards\n❌ Failed: ${result.failed} cards`;
        if (result.errors.length > 0) {
          console.error('Import errors:', result.errors);
        }
        alert(message);
        
        // Reload cards to show imported ones
        await loadCards();
        
      } catch (error) {
        console.error('Failed to import cards:', error);
        alert('Failed to import cards. Please check the JSON format and try again.');
      } finally {
        setIsImporting(false);
        // Reset file input
        event.target.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  // Map your JSON format to our CardModel format
  const mapJsonToCardModel = (jsonCard) => {
    // Map weapons - handle the different field names
    const mappedWeapons = (jsonCard.Weapons || jsonCard.weapons || []).map(weapon => ({
      name: weapon.Name || weapon.name || "",
      type: weapon.Type || weapon.type || "Melee",
      attackBonus: weapon.AttackBonus || weapon.attackBonus || 0,
      range: weapon.Range || weapon.range || "",
      damage: weapon.Damage || weapon.damage || "",
      keywords: weapon.Keywords || weapon.keywords || "",
    }));

    // Map abilities - handle the different field names
    const mappedAbilities = (jsonCard.Abilities || jsonCard.abilities || []).map(ability => ({
      title: ability.Title || ability.title || "",
      description: ability.Description || ability.description || "",
      cost: ability.Cost || ability.cost || 0,
      passive: ability.Passive || ability.passive || false,
    }));

    // Map keywords - handle if they're objects or strings
    const mappedKeywords = (jsonCard.Keywords || jsonCard.keywords || []).map(keyword => {
      if (typeof keyword === 'string') {
        return keyword;
      } else if (typeof keyword === 'object' && keyword.name) {
        return keyword.name;
      }
      return '';
    }).filter(k => k); // Remove empty strings

    return {
      // Don't include the original Id, let Firestore generate a new one
      cardName: jsonCard.CardName || jsonCard.cardName || "",
      cardType: jsonCard.CardType || jsonCard.cardType || "Unit",
      faction: jsonCard.Faction || jsonCard.faction || "",
      rarity: jsonCard.Rarity || jsonCard.rarity || "Common",
      size: jsonCard.Size || jsonCard.size || "",
      type: jsonCard.Type || jsonCard.type || "",
      token: jsonCard.Token || jsonCard.token || false,
      keywords: mappedKeywords,
      
      // Unit stats - map HP to hp, AC to ac, etc.
      hp: jsonCard.HP || jsonCard.hp || 0,
      ac: jsonCard.AC || jsonCard.ac || 0,
      move: jsonCard.Move || jsonCard.move || 0,
      weapons: mappedWeapons,
      abilities: mappedAbilities,
      
      // Spell properties
      spellType: jsonCard.SpellType || jsonCard.spellType || "",
      energyCost: jsonCard.EnergyCost || jsonCard.energyCost || 0,
      range: jsonCard.Range || jsonCard.range || "",
      effect: jsonCard.Effect || jsonCard.effect || "",
      
      // Terrain properties
      auraType: jsonCard.AuraType || jsonCard.auraType || "",
      losBlocking: jsonCard.LosBlocking || jsonCard.losBlocking || false,
    };
  };

  const handleImportClick = () => {
    // Trigger file input click
    document.getElementById('card-import-input').click();
  };

  const toggleFaction = (faction) => {
    setSelectedFactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(faction)) {
        newSet.delete(faction);
      } else {
        newSet.add(faction);
      }
      return newSet;
    });
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const getRarityOrder = (rarity) => {
    switch (rarity) {
      case 'Common': return 0;
      case 'Rare': return 1;
      case 'Legendary': return 2;
      default: return 3;
    }
  };

  const filteredCards = React.useMemo(() => {
    let filtered = cards
      .filter(c => selectedFactions.size === 0 || selectedFactions.has(c.faction))
      .filter(c => selectedTypes.size === 0 || selectedTypes.has(c.cardType))
      .filter(c => !searchTerm || c.cardName.toLowerCase().includes(searchTerm.toLowerCase()));

    switch (sortBy) {
      case 'Type':
        return filtered.sort((a, b) => {
          if (a.cardType !== b.cardType) return a.cardType.localeCompare(b.cardType);
          if (a.energyCost !== b.energyCost) return a.energyCost - b.energyCost;
          return getRarityOrder(a.rarity) - getRarityOrder(b.rarity);
        });
      
      case 'EnergyCost':
        return filtered.sort((a, b) => {
          if (a.energyCost !== b.energyCost) return a.energyCost - b.energyCost;
          return getRarityOrder(a.rarity) - getRarityOrder(b.rarity);
        });
      
      default: // Name
        return filtered.sort((a, b) => {
          if (a.cardName !== b.cardName) return a.cardName.localeCompare(b.cardName);
          if (a.energyCost !== b.energyCost) return a.energyCost - b.energyCost;
          return getRarityOrder(a.rarity) - getRarityOrder(b.rarity);
        });
    }
  }, [cards, selectedFactions, selectedTypes, searchTerm, sortBy]);

  if (isLoading) {
    return <div className="loading">Loading cards...</div>;
  }

  return (
    <div className="library-page">
      <div className="page-header">
        <h3>GridStrike Card Library</h3>
        
        <div className="header-controls">
          <button 
            onClick={openNewCardModal} 
            className="btn btn-primary"
          >
            <i className="fas fa-plus"></i> Add New Card
          </button>
          
          <button 
            onClick={() => setShowAiSettings(!showAiSettings)} 
            className="btn btn-secondary"
            title="AI Settings"
          >
            <i className="fas fa-robot"></i> AI Settings
          </button>
        </div>
      </div>

      {showAiSettings && (
        <div className="ai-settings-panel">
          <h4><i className="fas fa-robot"></i> AI Configuration</h4>
          <div className="ai-settings">
            <label>
              <input
                type="checkbox"
                checked={aiService.useAssistant}
                onChange={(e) => aiService.setUseAssistant(e.target.checked)}
              />
              Use OpenAI Assistant (Recommended - 90% cheaper!)
            </label>
            <p className="ai-info">
              <i className="fas fa-info-circle"></i>
              {aiService.useAssistant 
                ? "Using OpenAI Assistant: ~100 tokens per request (~$0.00002)"
                : "Using Direct Completions: ~1200 tokens per request (~$0.0002)"
              }
            </p>
            {aiService.useAssistant && aiService.assistantId && (
              <p className="ai-status">
                <i className="fas fa-check-circle"></i>
                Assistant initialized with game rules and card library
              </p>
            )}
          </div>
        </div>
      )}

      <div className="filters">
        <fieldset>
          <legend>Factions</legend>
          {allFactions.map(faction => (
            <label key={faction}>
              <input
                type="checkbox"
                checked={selectedFactions.has(faction)}
                onChange={() => toggleFaction(faction)}
              />
              {faction}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Card Types</legend>
          {allTypes.map(type => (
            <label key={type}>
              <input
                type="checkbox"
                checked={selectedTypes.has(type)}
                onChange={() => toggleType(type)}
              />
              {type}
            </label>
          ))}
        </fieldset>

        <label>
          Sort by:
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="Name">Name</option>
            <option value="Type">Type</option>
            <option value="EnergyCost">Energy Cost</option>
          </select>
        </label>

        <label>
          Search:
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cards..."
          />
        </label>
      </div>

      <div className="action-buttons">
        <button 
          className="btn btn-info" 
          onClick={handleImportClick}
          disabled={isImporting}
        >
          {isImporting ? <><i className="fas fa-upload"></i> Importing...</> : <><i className="fas fa-file-import"></i> Import Cards</>}
        </button>
        <button className="btn btn-primary" onClick={downloadAllCards}>
          <i className="fas fa-download"></i> Download All Cards
        </button>
        <button className="btn btn-primary" onClick={exportCards}>
          <i className="fas fa-file-export"></i> Export Cards
        </button>
        <input
          id="card-import-input"
          type="file"
          accept=".json"
          onChange={importCards}
          style={{ display: 'none' }}
        />
      </div>

      <div className="card-gallery">
        {filteredCards.map(card => (
          <div key={card.id} className="card-wrapper">
            <CardComponent 
              card={card}
              onEdit={() => openEditModal(card)}
              onDelete={() => deleteCard(card)}
            />
          </div>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="no-cards">
          No cards match your filters.
        </div>
      )}

      <CardEditModal
        isOpen={showEditModal}
        cardToEdit={cardBeingEdited}
        onSubmit={saveEditedCard}
        onClose={() => setShowEditModal(false)}
        allFactions={allFactions}
        allTypes={allTypes}
      />
    </div>
  );
};

export default Library;
