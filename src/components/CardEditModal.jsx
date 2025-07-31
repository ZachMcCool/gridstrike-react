import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CardModel, Weapon, Ability } from '../models/CardModel.js';
import CardComponent from './CardComponent.jsx';
import { aiService } from '../services/aiService.js';
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
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingField, setGeneratingField] = useState(null);
  const [aiStatus, setAiStatus] = useState('');

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
    setAiPrompt('');
    setAiStatus('');
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

  // AI Generation Functions
  const generateFullCard = async () => {
    if (!aiPrompt.trim()) {
      setAiStatus('Please enter a prompt for the AI to generate a card');
      return;
    }

    setIsGenerating(true);
    setAiStatus('Generating card with AI...');

    try {
      const aiCard = await aiService.generateCard(aiPrompt, editableCard.cardType);
      
      // Update the editable card with AI generated data
      setEditableCard(CardModel.fromJSON(aiCard));
      setAiStatus('Card generated successfully! Review and edit as needed.');
    } catch (error) {
      setAiStatus(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateField = async (fieldName) => {
    // Handle special cases
    if (fieldName === 'energyCost') {
      return generateEnergyCost();
    }

    setGeneratingField(fieldName);
    setAiStatus(`Generating ${fieldName}...`);

    try {
      const newValue = await aiService.generateField(fieldName, editableCard);
      handleInputChange(fieldName, newValue);
      setAiStatus(`${fieldName} generated successfully!`);
    } catch (error) {
      setAiStatus(`Error generating ${fieldName}: ${error.message}`);
    } finally {
      setGeneratingField(null);
    }
  };

  const generateWeapon = async () => {
    setIsGenerating(true);
    setAiStatus('Generating weapon...');

    try {
      const weapon = await aiService.generateWeapon(editableCard);
      if (weapon) {
        setEditableCard(prev => {
          const newCard = CardModel.fromJSON(prev.toJSON());
          newCard.weapons.push(new Weapon(weapon));
          return newCard;
        });
        setAiStatus('Weapon generated successfully!');
      }
    } catch (error) {
      setAiStatus(`Error generating weapon: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAbility = async () => {
    setIsGenerating(true);
    setAiStatus('Generating ability...');

    try {
      const ability = await aiService.generateAbility(editableCard);
      if (ability) {
        setEditableCard(prev => {
          const newCard = CardModel.fromJSON(prev.toJSON());
          newCard.abilities.push(new Ability(ability));
          return newCard;
        });
        setAiStatus('Ability generated successfully!');
      }
    } catch (error) {
      setAiStatus(`Error generating ability: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate energy cost with AI
  const generateEnergyCost = async () => {
    setGeneratingField('energyCost');
    setAiStatus('Generating energy cost...');

    try {
      const cost = await aiService.generateEnergyCost(editableCard);
      if (cost !== null) {
        setEditableCard(prev => {
          const newCard = CardModel.fromJSON(prev.toJSON());
          newCard.energyCost = cost;
          return newCard;
        });
        setAiStatus(`Energy cost set to ${cost}`);
      }
    } catch (error) {
      setAiStatus(`Error generating energy cost: ${error.message}`);
    } finally {
      setGeneratingField(null);
    }
  };

  // Improve ability description with AI
  const improveAbilityDescription = async (abilityIndex) => {
    if (!editableCard.abilities[abilityIndex]) return;
    
    setGeneratingField(`ability-desc-${abilityIndex}`);
    setAiStatus('Improving ability description...');

    try {
      const currentDesc = editableCard.abilities[abilityIndex].description;
      const improvedDesc = await aiService.generateAbilityDescription(currentDesc, editableCard);
      
      if (improvedDesc) {
        setEditableCard(prev => {
          const newCard = CardModel.fromJSON(prev.toJSON());
          newCard.abilities[abilityIndex].description = improvedDesc;
          return newCard;
        });
        setAiStatus('Ability description improved!');
      }
    } catch (error) {
      setAiStatus(`Error improving description: ${error.message}`);
    } finally {
      setGeneratingField(null);
    }
  };

  // Generate individual weapon field
  const generateWeaponField = async (weaponIndex, fieldName) => {
    if (!editableCard.weapons[weaponIndex]) return;
    
    setGeneratingField(`weapon-${weaponIndex}-${fieldName}`);
    setAiStatus(`Generating weapon ${fieldName}...`);

    try {
      const currentWeapon = editableCard.weapons[weaponIndex];
      const newValue = await aiService.generateWeaponField(fieldName, currentWeapon, editableCard);
      
      if (newValue !== null) {
        updateWeapon(weaponIndex, fieldName, newValue);
        setAiStatus(`Weapon ${fieldName} generated successfully!`);
      }
    } catch (error) {
      setAiStatus(`Error generating weapon ${fieldName}: ${error.message}`);
    } finally {
      setGeneratingField(null);
    }
  };

  // Generate individual ability field
  const generateAbilityField = async (abilityIndex, fieldName) => {
    if (!editableCard.abilities[abilityIndex]) return;
    
    setGeneratingField(`ability-${abilityIndex}-${fieldName}`);
    setAiStatus(`Generating ability ${fieldName}...`);

    try {
      const currentAbility = editableCard.abilities[abilityIndex];
      const newValue = await aiService.generateAbilityField(fieldName, currentAbility, editableCard);
      
      if (newValue !== null) {
        updateAbility(abilityIndex, fieldName, newValue);
        
        // Handle cost/passive validation
        if (fieldName === 'cost') {
          // If setting cost to 0, automatically set passive to true
          if (newValue === 0) {
            updateAbility(abilityIndex, 'passive', true);
            setAiStatus(`Ability cost set to 0 and marked as passive!`);
          } else {
            setAiStatus(`Ability cost set to ${newValue} AP!`);
          }
        } else {
          setAiStatus(`Ability ${fieldName} generated successfully!`);
        }
      }
    } catch (error) {
      setAiStatus(`Error generating ability ${fieldName}: ${error.message}`);
    } finally {
      setGeneratingField(null);
    }
  };

  // Handle ability cost changes with validation
  const handleAbilityCostChange = (abilityIndex, cost) => {
    updateAbility(abilityIndex, 'cost', cost);
    
    // Enforce AP rules: 0 AP = passive, 1-2 AP = active
    if (cost === 0) {
      updateAbility(abilityIndex, 'passive', true);
    } else if (cost > 0 && editableCard.abilities[abilityIndex].passive) {
      // If changing from 0 to a positive cost, make it active
      updateAbility(abilityIndex, 'passive', false);
    }
    
    // Cap at 2 AP
    if (cost > 2) {
      updateAbility(abilityIndex, 'cost', 2);
    }
  };

  // Handle passive toggle with validation
  const handleAbilityPassiveChange = (abilityIndex, isPassive) => {
    updateAbility(abilityIndex, 'passive', isPassive);
    
    // Enforce AP rules: passive = 0 AP
    if (isPassive) {
      updateAbility(abilityIndex, 'cost', 0);
    } else if (editableCard.abilities[abilityIndex].cost === 0) {
      // If changing from passive to active, set cost to 1 AP
      updateAbility(abilityIndex, 'cost', 1);
    }
  };

  // Helper component for field with AI button
  const FieldWithAI = ({ children, fieldName, disabled = false }) => (
    <div className="field-with-ai">
      {React.cloneElement(children, {
        className: `${children.props.className || ''} input-with-ai`.trim()
      })}
      <button
        type="button"
        className="ai-field-button"
        onClick={() => generateField(fieldName)}
        disabled={disabled || generatingField === fieldName}
        title={`Generate ${fieldName} with AI`}
      >
        {generatingField === fieldName ? (
          <div className="ai-loading"></div>
        ) : (
          '✨'
        )}
      </button>
    </div>
  );

  // Helper component for individual field AI button
  const FieldAIButton = ({ fieldName, onClick, disabled = false, className = "" }) => (
    <button
      type="button"
      className={`ai-field-button ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={`Generate ${fieldName} with AI`}
    >
      {generatingField === fieldName ? (
        <div className="ai-loading"></div>
      ) : (
        '✨'
      )}
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-body">
          <div className="form-grid">
            {/* AI Generation Section */}
            <div className="ai-section">
              <h4>✨ AI Card Generation</h4>
              <div className="ai-prompt-group">
                <input
                  type="text"
                  className="ai-prompt-input"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the card you want AI to create (e.g., 'A fierce dragon warrior with fire abilities')"
                />
                <button
                  type="button"
                  className="ai-generate-button"
                  onClick={generateFullCard}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className="ai-loading"></div>
                      <span style={{marginLeft: '8px'}}>Generating...</span>
                    </>
                  ) : (
                    'Generate Card'
                  )}
                </button>
              </div>
              {aiStatus && <div className="ai-status">{aiStatus}</div>}
            </div>

            {/* Basic Information */}
            <div className="form-section">
              <h4>Basic Information</h4>
              
              <div className="form-row">
                <FieldWithAI fieldName="cardName">
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
                </FieldWithAI>
                
                <FieldWithAI fieldName="energyCost">
                  <div className="form-group">
                    <label>Energy Cost</label>
                    <input 
                      type="number" 
                      value={editableCard.energyCost}
                      onChange={(e) => handleInputChange('energyCost', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </FieldWithAI>
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

                <FieldWithAI fieldName="size">
                  <div className="form-group">
                    <label>Size</label>
                    <input 
                      type="text" 
                      value={editableCard.size}
                      onChange={(e) => handleInputChange('size', e.target.value)}
                      placeholder="e.g., Medium, Large"
                    />
                  </div>
                </FieldWithAI>
              </div>

              {editableCard.cardType === "Unit" && (
                <div className="form-row single">
                  <FieldWithAI fieldName="type">
                    <div className="form-group">
                      <label>Type</label>
                      <input 
                        type="text" 
                        value={editableCard.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        placeholder="e.g., Beast, Humanoid"
                      />
                    </div>
                  </FieldWithAI>
                </div>
              )}

              <div className="form-row single">
                <FieldWithAI fieldName="keywords">
                  <div className="form-group">
                    <label>Keywords</label>
                    <input 
                      type="text" 
                      value={(editableCard.keywords || []).join(', ')}
                      onChange={(e) => handleKeywordsChange(e.target.value)}
                      placeholder="Enter keywords separated by commas"
                    />
                  </div>
                </FieldWithAI>
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
                  <FieldWithAI fieldName="effect">
                    <div className="form-group">
                      <label>Effect</label>
                      <textarea 
                        value={editableCard.effect}
                        onChange={(e) => handleInputChange('effect', e.target.value)}
                        placeholder={`Describe the ${editableCard.cardType.toLowerCase()}'s effect...`}
                      />
                    </div>
                  </FieldWithAI>
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
                  <FieldWithAI fieldName="effect">
                    <div className="form-group">
                      <label>Effect</label>
                      <textarea 
                        value={editableCard.effect}
                        onChange={(e) => handleInputChange('effect', e.target.value)}
                        placeholder="Describe the terrain's effect..."
                      />
                    </div>
                  </FieldWithAI>
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
                          <div className="field-with-ai">
                            <input 
                              placeholder="Weapon name" 
                              value={weapon.name}
                              onChange={(e) => updateWeapon(index, 'name', e.target.value)}
                            />
                            <FieldAIButton 
                              fieldName={`weapon-${index}-name`}
                              onClick={() => generateWeaponField(index, 'name')}
                              disabled={generatingField === `weapon-${index}-name`}
                            />
                          </div>
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
                          <div className="field-with-ai">
                            <input 
                              placeholder="Bonus" 
                              type="number" 
                              value={weapon.attackBonus}
                              onChange={(e) => updateWeapon(index, 'attackBonus', parseInt(e.target.value) || 0)}
                            />
                            <FieldAIButton 
                              fieldName={`weapon-${index}-attackBonus`}
                              onClick={() => generateWeaponField(index, 'attackBonus')}
                              disabled={generatingField === `weapon-${index}-attackBonus`}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Damage</label>
                          <div className="field-with-ai">
                            <input 
                              placeholder="e.g., 1d6+2" 
                              value={weapon.damage}
                              onChange={(e) => updateWeapon(index, 'damage', e.target.value)}
                            />
                            <FieldAIButton 
                              fieldName={`weapon-${index}-damage`}
                              onClick={() => generateWeaponField(index, 'damage')}
                              disabled={generatingField === `weapon-${index}-damage`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="nested-form-row single">
                        <div className="form-group">
                          <label>Keywords</label>
                          <div className="field-with-ai">
                            <input 
                              placeholder="Weapon keywords" 
                              value={weapon.keywords}
                              onChange={(e) => updateWeapon(index, 'keywords', e.target.value)}
                            />
                            <FieldAIButton 
                              fieldName={`weapon-${index}-keywords`}
                              onClick={() => generateWeaponField(index, 'keywords')}
                              disabled={generatingField === `weapon-${index}-keywords`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="add-button" onClick={addWeapon}>Add Weapon</button>
                  <button 
                    type="button" 
                    className="ai-generate-button" 
                    onClick={generateWeapon}
                    disabled={isGenerating}
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                  >
                    {isGenerating ? <div className="ai-loading"></div> : '✨'} AI Weapon
                  </button>
                </div>
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
                          <div className="field-with-ai">
                            <input 
                              placeholder="Ability title" 
                              value={ability.title}
                              onChange={(e) => updateAbility(index, 'title', e.target.value)}
                            />
                            <FieldAIButton 
                              fieldName={`ability-${index}-title`}
                              onClick={() => generateAbilityField(index, 'title')}
                              disabled={generatingField === `ability-${index}-title`}
                            />
                          </div>
                        </div>
                        {!ability.passive && (
                          <div className="form-group">
                            <label>Cost (AP)</label>
                            <div className="field-with-ai">
                              <input 
                                type="number" 
                                value={ability.cost || ''}
                                onChange={(e) => handleAbilityCostChange(index, parseInt(e.target.value) || 0)}
                                placeholder="Action points"
                                min="0"
                                max="2"
                              />
                              <FieldAIButton 
                                fieldName={`ability-${index}-cost`}
                                onClick={() => generateAbilityField(index, 'cost')}
                                disabled={generatingField === `ability-${index}-cost`}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="checkbox-group">
                        <input 
                          type="checkbox" 
                          id={`passive-${index}`}
                          checked={ability.passive}
                          onChange={(e) => handleAbilityPassiveChange(index, e.target.checked)}
                        />
                        <label htmlFor={`passive-${index}`}>Passive Ability (0 AP)</label>
                      </div>

                      <div className="nested-form-row single">
                        <div className="form-group">
                          <label>Description</label>
                          <div className="field-with-ai">
                            <textarea 
                              placeholder="Ability description" 
                              value={ability.description}
                              onChange={(e) => updateAbility(index, 'description', e.target.value)}
                            />
                            <div className="description-ai-buttons">
                              <FieldAIButton 
                                fieldName={`ability-${index}-description`}
                                onClick={() => generateAbilityField(index, 'description')}
                                disabled={generatingField === `ability-${index}-description`}
                                className="generate"
                              />
                              {ability.description && (
                                <FieldAIButton 
                                  fieldName={`ability-desc-${index}`}
                                  onClick={() => improveAbilityDescription(index)}
                                  disabled={generatingField === `ability-desc-${index}`}
                                  className="improve"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="add-button" onClick={addAbility}>Add Ability</button>
                  <button 
                    type="button" 
                    className="ai-generate-button" 
                    onClick={generateAbility}
                    disabled={isGenerating}
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                  >
                    {isGenerating ? <div className="ai-loading"></div> : '✨'} AI Ability
                  </button>
                </div>
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
