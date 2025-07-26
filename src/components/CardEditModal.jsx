import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CardModel, Weapon, Ability } from '../models/CardModel.js';
import CardComponent from './CardComponent.jsx';
import './CardEditModal.css';

/**
 * CardEditModal - Modal for creating and editing cards
 * Equivalent to the Blazor CardEditModal component
 */
const CardEditModal = ({
  isOpen,
  onSubmit,
  onClose,
  allFactions = [],
  allTypes = [],
  cardToEdit = null
}) => {
  const [editableCard, setEditableCard] = useState(new CardModel());
  const [errors, setErrors] = useState({});

  // Initialize card when modal opens or cardToEdit changes
  useEffect(() => {
    if (cardToEdit) {
      // Create a deep copy of the card to edit
      setEditableCard(CardModel.fromJSON(cardToEdit.toJSON()));
    } else {
      // Create new card with empty faction (no default)
      const newCard = new CardModel();
      newCard.faction = ''; // Ensure no default faction
      setEditableCard(newCard);
    }
    setErrors({});
  }, [cardToEdit, isOpen]);

  const validateCard = () => {
    const newErrors = {};
    
    if (!editableCard.cardName.trim()) {
      newErrors.cardName = 'Card name is required';
    }
    
    if (!editableCard.faction) {
      newErrors.faction = 'Faction must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleSubmit = () => {
    if (validateCard() && onSubmit) {
      onSubmit(editableCard);
    }
  };

  const handleInputChange = (field, value) => {
    setEditableCard(prev => {
      const newCard = CardModel.fromJSON(prev.toJSON());
      newCard[field] = value;
      return newCard;
    });
  };

  const handleKeywordsChange = (value) => {
    const keywords = value
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    handleInputChange('keywords', keywords);
  };

  const addWeapon = () => {
    setEditableCard(prev => {
      const newCard = CardModel.fromJSON(prev.toJSON());
      newCard.weapons.push(new Weapon());
      return newCard;
    });
  };

  const removeWeapon = (index) => {
    setEditableCard(prev => {
      const newCard = CardModel.fromJSON(prev.toJSON());
      newCard.weapons.splice(index, 1);
      return newCard;
    });
  };

  const updateWeapon = (index, field, value) => {
    setEditableCard(prev => {
      const newCard = CardModel.fromJSON(prev.toJSON());
      newCard.weapons[index][field] = value;
      return newCard;
    });
  };

  const addAbility = () => {
    setEditableCard(prev => {
      const newCard = CardModel.fromJSON(prev.toJSON());
      newCard.abilities.push(new Ability());
      return newCard;
    });
  };

  const removeAbility = (index) => {
    setEditableCard(prev => {
      const newCard = CardModel.fromJSON(prev.toJSON());
      newCard.abilities.splice(index, 1);
      return newCard;
    });
  };

  const updateAbility = (index, field, value) => {
    setEditableCard(prev => {
      const newCard = CardModel.fromJSON(prev.toJSON());
      newCard.abilities[index][field] = value;
      return newCard;
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-body">
          <div className="form-grid">
            {/* Basic Information */}
            <div className="form-section">
              <h4>Basic Information</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Card Name *</label>
                  <input 
                    type="text" 
                    value={editableCard.cardName}
                    onChange={(e) => handleInputChange('cardName', e.target.value)}
                    style={errors.cardName ? {borderColor: '#dc3545'} : {}}
                  />
                  {errors.cardName && <span style={{color: '#dc3545', fontSize: '0.8rem'}}>{errors.cardName}</span>}
                </div>
                
                <div className="form-group">
                  <label>Energy Cost</label>
                  <input 
                    type="number" 
                    value={editableCard.energyCost}
                    onChange={(e) => handleInputChange('energyCost', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Faction *</label>
                  <select 
                    value={editableCard.faction}
                    onChange={(e) => handleInputChange('faction', e.target.value)}
                    style={errors.faction ? {borderColor: '#dc3545'} : {}}
                  >
                    <option value="">Choose a faction...</option>
                    {allFactions.map(faction => (
                      <option key={faction} value={faction}>{faction}</option>
                    ))}
                  </select>
                  {errors.faction && <span style={{color: '#dc3545', fontSize: '0.8rem'}}>{errors.faction}</span>}
                </div>

                <div className="form-group">
                  <label>Card Type</label>
                  <select 
                    value={editableCard.cardType} 
                    onChange={(e) => handleInputChange('cardType', e.target.value)}
                  >
                    {allTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rarity</label>
                  <select 
                    value={editableCard.rarity}
                    onChange={(e) => handleInputChange('rarity', e.target.value)}
                  >
                    <option value="Common">Common</option>
                    <option value="Rare">Rare</option>
                    <option value="Legendary">Legendary</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Size</label>
                  <input 
                    type="text" 
                    value={editableCard.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    placeholder="e.g., Medium, Large"
                  />
                </div>
              </div>

              {editableCard.cardType === "Unit" && (
                <div className="form-row single">
                  <div className="form-group">
                    <label>Type</label>
                    <input 
                      type="text" 
                      value={editableCard.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      placeholder="e.g., Beast, Humanoid"
                    />
                  </div>
                </div>
              )}

              <div className="form-row single">                  <div className="form-group">
                    <label>Keywords</label>
                    <input 
                      type="text" 
                      value={(editableCard.keywords || []).join(', ')}
                      onChange={(e) => handleKeywordsChange(e.target.value)}
                      placeholder="Enter keywords separated by commas"
                    />
                  </div>
              </div>

              {(editableCard.cardType === "Unit" || editableCard.cardType === "Terrain") && (
                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="token-checkbox"
                    checked={editableCard.token}
                    onChange={(e) => handleInputChange('token', e.target.checked)}
                  />
                  <label htmlFor="token-checkbox">Token</label>
                </div>
              )}
            </div>

            {/* Unit Stats */}
            {editableCard.cardType === "Unit" && (
              <div className="form-section">
                <h4>Unit Stats</h4>
                <div className="form-row three">
                  <div className="form-group">
                    <label>HP</label>
                    <input 
                      type="number" 
                      value={editableCard.hp}
                      onChange={(e) => handleInputChange('hp', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label>AC</label>
                    <input 
                      type="number" 
                      value={editableCard.ac}
                      onChange={(e) => handleInputChange('ac', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Move</label>
                    <input 
                      type="number" 
                      value={editableCard.move}
                      onChange={(e) => handleInputChange('move', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Spell/Equipment Details */}
            {(editableCard.cardType === "Spell" || editableCard.cardType === "Equipment") && (
              <div className="form-section">
                <h4>{editableCard.cardType === "Equipment" ? "Equipment Details" : "Spell Details"}</h4>
                {editableCard.cardType === "Spell" && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Spell Type</label>
                      <select 
                        value={editableCard.spellType}
                        onChange={(e) => handleInputChange('spellType', e.target.value)}
                      >
                        <option value="Instant">Instant</option>
                        <option value="Sorcery">Sorcery</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Range</label>
                      <input 
                        type="text" 
                        value={editableCard.range}
                        onChange={(e) => handleInputChange('range', e.target.value)}
                        placeholder="e.g., 6, Self, Touch"
                      />
                    </div>
                  </div>
                )}
                <div className="form-row single">
                  <div className="form-group">
                    <label>Effect</label>
                    <textarea 
                      value={editableCard.effect}
                      onChange={(e) => handleInputChange('effect', e.target.value)}
                      placeholder={`Describe the ${editableCard.cardType.toLowerCase()}'s effect...`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Terrain Details */}
            {editableCard.cardType === "Terrain" && (
              <div className="form-section">
                <h4>Terrain Details</h4>
                <div className="form-row single">
                  <div className="form-group">
                    <label>Aura Type</label>
                    <input 
                      type="text" 
                      value={editableCard.auraType}
                      onChange={(e) => handleInputChange('auraType', e.target.value)}
                      placeholder="e.g., Healing Aura, Damage Aura"
                    />
                  </div>
                </div>
                <div className="form-row single">
                  <div className="form-group">
                    <label>Effect</label>
                    <textarea 
                      value={editableCard.effect}
                      onChange={(e) => handleInputChange('effect', e.target.value)}
                      placeholder="Describe the terrain's effect..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Weapons */}
            {(editableCard.cardType === "Unit" || editableCard.cardType === "Terrain") && (
              <div className="form-section">
                <h4>Weapons</h4>
                <div className="nested-items">
                  {editableCard.weapons.map((weapon, index) => (
                    <div key={index} className="nested-item">
                      <div className="nested-item-header">
                        <h5 className="nested-item-title">Weapon {index + 1}</h5>
                        <button 
                          type="button" 
                          className="remove-button"
                          onClick={() => removeWeapon(index)}
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="nested-form-row">
                        <div className="form-group">
                          <label>Name</label>
                          <input 
                            placeholder="Weapon name" 
                            value={weapon.name}
                            onChange={(e) => updateWeapon(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Type</label>
                          <select 
                            value={weapon.type}
                            onChange={(e) => updateWeapon(index, 'type', e.target.value)}
                          >
                            <option value="Melee">Melee</option>
                            <option value="Ranged">Ranged</option>
                          </select>
                        </div>
                      </div>

                      <div className="nested-form-row">
                        {weapon.type === "Ranged" && (
                          <div className="form-group">
                            <label>Range</label>
                            <input 
                              placeholder="Range" 
                              value={weapon.range}
                              onChange={(e) => updateWeapon(index, 'range', e.target.value)}
                            />
                          </div>
                        )}
                        <div className="form-group">
                          <label>Attack Bonus</label>
                          <input 
                            placeholder="Bonus" 
                            type="number" 
                            value={weapon.attackBonus}
                            onChange={(e) => updateWeapon(index, 'attackBonus', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Damage</label>
                          <input 
                            placeholder="e.g., 1d6+2" 
                            value={weapon.damage}
                            onChange={(e) => updateWeapon(index, 'damage', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="nested-form-row single">
                        <div className="form-group">
                          <label>Keywords</label>
                          <input 
                            placeholder="Weapon keywords" 
                            value={weapon.keywords}
                            onChange={(e) => updateWeapon(index, 'keywords', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="add-button" onClick={addWeapon}>Add Weapon</button>
              </div>
            )}

            {/* Abilities */}
            {(editableCard.cardType === "Unit" || editableCard.cardType === "Terrain") && (
              <div className="form-section">
                <h4>Abilities</h4>
                <div className="nested-items">
                  {editableCard.abilities.map((ability, index) => (
                    <div key={index} className="nested-item">
                      <div className="nested-item-header">
                        <h5 className="nested-item-title">Ability {index + 1}</h5>
                        <button 
                          type="button" 
                          className="remove-button"
                          onClick={() => removeAbility(index)}
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="nested-form-row">
                        <div className="form-group">
                          <label>Title</label>
                          <input 
                            placeholder="Ability title" 
                            value={ability.title}
                            onChange={(e) => updateAbility(index, 'title', e.target.value)}
                          />
                        </div>
                        {!ability.passive && (
                          <div className="form-group">
                            <label>Cost (AP)</label>
                            <input 
                              type="number" 
                              value={ability.cost || ''}
                              onChange={(e) => updateAbility(index, 'cost', parseInt(e.target.value) || null)}
                              placeholder="Action points"
                            />
                          </div>
                        )}
                      </div>

                      <div className="checkbox-group">
                        <input 
                          type="checkbox" 
                          id={`passive-${index}`}
                          checked={ability.passive}
                          onChange={(e) => updateAbility(index, 'passive', e.target.checked)}
                        />
                        <label htmlFor={`passive-${index}`}>Passive Ability</label>
                      </div>

                      <div className="nested-form-row single">
                        <div className="form-group">
                          <label>Description</label>
                          <textarea 
                            placeholder="Ability description" 
                            value={ability.description}
                            onChange={(e) => updateAbility(index, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="add-button" onClick={addAbility}>Add Ability</button>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-save" onClick={handleSubmit}>Save Card</button>
          <button className="btn btn-cancel" onClick={handleClose}>Cancel</button>
        </div>

        <div className="preview-section">
          <CardComponent card={editableCard} isPreview={true} />
        </div>
      </div>
    </div>
  );
};

CardEditModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  allFactions: PropTypes.arrayOf(PropTypes.string),
  allTypes: PropTypes.arrayOf(PropTypes.string),
  cardToEdit: PropTypes.instanceOf(CardModel)
};

export default CardEditModal;
