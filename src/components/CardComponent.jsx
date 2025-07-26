import React from 'react';
import PropTypes from 'prop-types';
import { CardModel } from '../models/CardModel.js';
import './CardComponent.css';

/**
 * CardComponent - Displays a GridStrike card with all details
 * Equivalent to the Blazor CardComponent
 */
const CardComponent = ({ 
  card, 
  onEdit, 
  onDelete, 
  onExport,
  isPreview = false 
}) => {
  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(card);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(card);
  };

  const handleExport = (e) => {
    e.stopPropagation();
    if (onExport) {
      const elementId = card.cardName.replace(/\s+/g, '').toLowerCase();
      const safeName = card.cardName.replace(/[<>:"/\\|?*]/g, '');
      onExport(elementId, safeName);
    }
  };

  const cardId = card.cardName.replace(/\s+/g, '').toLowerCase();
  const cardClasses = `gridstrike-card ${card.faction} ${card.cardType.toLowerCase()}-card`;

  return (
    <div className="card-container">
      <div className={cardClasses} id={cardId}>
        {/* Energy Cost - only show if not a token */}
        {!card.token && (
          <div className="gridstrike-card-cost">{card.energyCost}</div>
        )}

        {/* Header */}
        <div className="gridstrike-card-header">
          <h2>{card.cardName}</h2>
          {card.token && <p><span>Token</span></p>}
          <p>
            <span>
              {card.faction}
              {card.type && ` - ${card.type}`}
            </span>
          </p>
          {card.size && (
            <p><span>Size: {card.size}</span></p>
          )}
        </div>

        {/* Unit Stats */}
        {card.cardType === "Unit" && (
          <>
            <div className="gridstrike-card-stats">
              <span>❤ {card.hp}</span>
              <span>🛡️ {card.ac}</span>
              <span>🏃 {card.move}</span>
            </div>

            {card.keywords && card.keywords.length > 0 && (
              <div className="gridstrike-card-keywords">
                {card.keywords.map((keyword, index) => (
                  <span key={index} className="tag">{keyword}</span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Equipment Stats */}
        {card.cardType === "Equipment" && (
          <div className="gridstrike-card-stats">
            <span>Type: {card.spellType}</span>
            <span>Range: {card.range}</span>
          </div>
        )}

        {/* Spell Stats */}
        {card.cardType === "Spell" && (
          <div className="gridstrike-card-section">
            <h4>Type & Range</h4>
            <p><strong>{card.spellType}</strong> | Range: {card.range}</p>
          </div>
        )}

        {/* Terrain Stats */}
        {card.cardType === "Terrain" && (
          <div className="gridstrike-card-stats">
            {card.isDestructible && (
              <>
                <span>❤ {card.hp}</span>
                {card.ac > 0 && <span>🛡️ {card.ac}</span>}
              </>
            )}
          </div>
        )}

        {/* Weapons */}
        {(card.cardType === "Unit" || card.cardType === "Terrain") && 
         card.weapons && card.weapons.length > 0 && (
          <div className="gridstrike-card-section">
            <h4>Weapons</h4>
            {card.weapons.map((weapon, index) => (
              <p key={index}>
                <strong>{weapon.name}</strong> - [{weapon.type}
                {weapon.type === "Ranged" && weapon.range && ` ${weapon.range}`}] 
                +{weapon.attackBonus} to hit, {weapon.damage}
                {weapon.keywords && <span> ({weapon.keywords})</span>}
              </p>
            ))}
          </div>
        )}

        {/* Abilities */}
        {card.abilities && card.abilities.length > 0 && (
          <div className="gridstrike-card-section">
            <h4>
              {card.cardType === "Terrain" && card.auraType 
                ? card.auraType 
                : "Abilities"}
            </h4>
            {card.abilities.map((ability, index) => (
              <p key={index}>
                <strong>
                  {ability.title} {ability.passive 
                    ? "(Passive)" 
                    : `(${ability.cost} AP)`}:
                </strong> {ability.description}
              </p>
            ))}
          </div>
        )}

        {/* Effect */}
        {card.effect && (
          <div className="gridstrike-card-section">
            <h4>Effect</h4>
            <p>{card.effect}</p>
          </div>
        )}

        {/* Footer */}
        <div className="gridstrike-card-footer">
          <span>{card.rarity} {card.cardType}</span>
        </div>
      </div>

      {/* Controls */}
      {!isPreview && (
        <div className="gridstrike-card-controls">
          <button 
            className="edit-button" 
            onClick={handleEdit}
            title="Edit Card"
          >
            ✎
          </button>
          <button 
            className="download-button" 
            onClick={handleExport}
            title="Export Card"
            data-cardname={card.cardName}
          >
            📥
          </button>
          <button 
            className="delete-button" 
            onClick={handleDelete}
            title="Delete Card"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
};

CardComponent.propTypes = {
  card: PropTypes.instanceOf(CardModel).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onExport: PropTypes.func,
  isPreview: PropTypes.bool
};

CardComponent.defaultProps = {
  onEdit: null,
  onDelete: null,
  onExport: null,
  isPreview: false
};

export default CardComponent;
