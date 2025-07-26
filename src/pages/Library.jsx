import React, { useState, useEffect } from 'react';
import CardComponent from '../components/CardComponent.jsx';
import CardEditModal from '../components/CardEditModal.jsx';
import { CardModel } from '../models/CardModel.js';
import { cardService } from '../services/cardService.js';
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

  const allFactions = ['Red', 'Green', 'Black', 'White', 'Blue', 'Colorless'];
  const allTypes = ['Unit', 'Spell', 'Equipment', 'Terrain'];

  // Load cards on component mount
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setIsLoading(true);
      const loadedCards = await cardService.getAll();
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
        
        // Save to database
        const savedCard = await cardService.create(updatedCard);
        
        // Add to local state
        setCards(prev => [...prev, savedCard]);
      } else {
        // Update existing card
        const savedCard = await cardService.update(updatedCard.id, updatedCard);
        
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
      // Remove from database
      await cardService.delete(card.id);
      
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
      <h3>Unit Cards</h3>

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
        <button className="btn btn-success" onClick={openNewCardModal}>
          + New Card
        </button>
        <button className="btn btn-primary" onClick={downloadAllCards}>
          Download All Cards
        </button>
        <button className="btn btn-primary" onClick={exportCards}>
          Export Cards
        </button>
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
