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

  // Initialize card when modal opens or cardToEdit changes
  useEffect(() => {
    if (cardToEdit) {
      // Create a deep copy of the card to edit
      setEditableCard(CardModel.fromJSON(cardToEdit.toJSON()));
    } else {
      setEditableCard(new CardModel());
    }
  }, [cardToEdit, isOpen]);

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleSubmit = () => {
    if (onSubmit) onSubmit(editableCard);
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
        <button className="close-button" onClick={handleClose}>×</button>
        
        <div className="modal-body">
          <div className="form-grid">
            <label>
              Card Type:
              <select 
                value={editableCard.cardType} 
                onChange={(e) => handleInputChange('cardType', e.target.value)}
              >
                {allTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            {(editableCard.cardType === "Unit" || editableCard.cardType === "Terrain") && (
              <label className="horizontal-input">
                <span>Token:</span>
                <input 
                  type="checkbox" 
                  checked={editableCard.token}
                  onChange={(e) => handleInputChange('token', e.target.checked)}
                />
              </label>
            )}

            <label>
              Card Name:
              <input 
                type="text" 
                value={editableCard.cardName}
                onChange={(e) => handleInputChange('cardName', e.target.value)}
              />
            </label>

            <label className="horizontal-input">
              <span>Energy Cost:</span>
              <input 
                type="number" 
                value={editableCard.energyCost}
                onChange={(e) => handleInputChange('energyCost', parseInt(e.target.value) || 0)}
              />
            </label>

            <label>
              Faction:
              <select 
                value={editableCard.faction}
                onChange={(e) => handleInputChange('faction', e.target.value)}
              >
                {allFactions.map(faction => (
                  <option key={faction} value={faction}>{faction}</option>
                ))}
              </select>
            </label>

            <label>
              Rarity:
              <select 
                value={editableCard.rarity}
                onChange={(e) => handleInputChange('rarity', e.target.value)}
              >
                <option value="Common">Common</option>
                <option value="Rare">Rare</option>
                <option value="Legendary">Legendary</option>
              </select>
            </label>

            {editableCard.cardType === "Unit" && (
              <label>
                Type (e.g., Beast):
                <input 
                  type="text" 
                  value={editableCard.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                />
              </label>
            )}

            <label>
              Size:
              <input 
                type="text" 
                value={editableCard.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
              />
            </label>

            <label>
              Keywords:
              <input 
                type="text" 
                value={editableCard.keywords.join(', ')}
                onChange={(e) => handleKeywordsChange(e.target.value)}
              />
            </label>
          </div>

          {editableCard.cardType === "Unit" && (
            <div className="section">
              <h4>Stats</h4>
              <label className="horizontal-input">
                HP: 
                <input 
                  type="number" 
                  value={editableCard.hp}
                  onChange={(e) => handleInputChange('hp', parseInt(e.target.value) || 0)}
                />
              </label>
              <label className="horizontal-input">
                AC: 
                <input 
                  type="number" 
                  value={editableCard.ac}
                  onChange={(e) => handleInputChange('ac', parseInt(e.target.value) || 0)}
                />
              </label>
              <label className="horizontal-input">
                Move: 
                <input 
                  type="number" 
                  value={editableCard.move}
                  onChange={(e) => handleInputChange('move', parseInt(e.target.value) || 0)}
                />
              </label>
            </div>
          )}

          {(editableCard.cardType === "Unit" || editableCard.cardType === "Terrain") && (
            <>
              <div className="section">
                <h4>Weapons</h4>
                <div className="weapon-ability-container">
                  {editableCard.weapons.map((weapon, index) => (
                    <div key={index} className="nested-form">
                      <button type="button" onClick={() => removeWeapon(index)}>X</button>
                      <input 
                        placeholder="Name" 
                        value={weapon.name}
                        onChange={(e) => updateWeapon(index, 'name', e.target.value)}
                      />
                      <select 
                        value={weapon.type}
                        onChange={(e) => updateWeapon(index, 'type', e.target.value)}
                      >
                        <option value="Melee">Melee</option>
                        <option value="Ranged">Ranged</option>
                      </select>
                      {weapon.type === "Ranged" && (
                        <label>
                          Range
                          <input 
                            placeholder="Range" 
                            value={weapon.range}
                            onChange={(e) => updateWeapon(index, 'range', e.target.value)}
                          />
                        </label>
                      )}
                      <label>
                        Attack Bonus
                        <input 
                          placeholder="Bonus" 
                          type="number" 
                          value={weapon.attackBonus}
                          onChange={(e) => updateWeapon(index, 'attackBonus', parseInt(e.target.value) || 0)}
                        />
                      </label>
                      <input 
                        placeholder="Damage" 
                        value={weapon.damage}
                        onChange={(e) => updateWeapon(index, 'damage', e.target.value)}
                      />
                      <input 
                        placeholder="Keywords" 
                        value={weapon.keywords}
                        onChange={(e) => updateWeapon(index, 'keywords', e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addWeapon}>Add Weapon</button>
              </div>

              <div className="section">
                <h4>Abilities</h4>
                <div className="weapon-ability-container">
                  {editableCard.abilities.map((ability, index) => (
                    <div key={index} className="nested-form">
                      <button type="button" onClick={() => removeAbility(index)}>X</button>
                      <input 
                        placeholder="Title" 
                        value={ability.title}
                        onChange={(e) => updateAbility(index, 'title', e.target.value)}
                      />
                      <label>
                        Passive
                        <input 
                          type="checkbox" 
                          checked={ability.passive}
                          onChange={(e) => updateAbility(index, 'passive', e.target.checked)}
                        />
                      </label>
                      {!ability.passive && (
                        <label>
                          Cost (AP)
                          <input 
                            type="number" 
                            value={ability.cost || ''}
                            onChange={(e) => updateAbility(index, 'cost', parseInt(e.target.value) || null)}
                          />
                        </label>
                      )}
                      <input 
                        placeholder="Description" 
                        value={ability.description}
                        onChange={(e) => updateAbility(index, 'description', e.target.value)}
                      />
                    </div>
                  ))}
                  <button type="button" onClick={addAbility}>Add Ability</button>
                </div>
              </div>
            </>
          )}

          {(editableCard.cardType === "Spell" || editableCard.cardType === "Equipment") && (
            <>
              <div className="section">
                <label>
                  Spell Type:
                  <select 
                    value={editableCard.spellType}
                    onChange={(e) => handleInputChange('spellType', e.target.value)}
                  >
                    <option value="Instant">Instant</option>
                    <option value="Sorcery">Sorcery</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </label>
                <label>
                  Range:
                  <input 
                    type="text" 
                    value={editableCard.range}
                    onChange={(e) => handleInputChange('range', e.target.value)}
                  />
                </label>
              </div>
              <div className="section">
                <label>
                  Effect:
                  <textarea 
                    value={editableCard.effect}
                    onChange={(e) => handleInputChange('effect', e.target.value)}
                  />
                </label>
              </div>
            </>
          )}

          {editableCard.cardType === "Terrain" && (
            <>
              <div className="section">
                <label>
                  Aura Type:
                  <input 
                    type="text" 
                    value={editableCard.auraType}
                    onChange={(e) => handleInputChange('auraType', e.target.value)}
                  />
                </label>
              </div>
              <div className="section">
                <label>
                  Effect:
                  <textarea 
                    value={editableCard.effect}
                    onChange={(e) => handleInputChange('effect', e.target.value)}
                  />
                </label>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={handleSubmit}>Save</button>
          <button className="cancel" onClick={handleClose}>Cancel</button>
        </div>

        <div className="preview-section">
          <h3>Live Preview</h3>
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
