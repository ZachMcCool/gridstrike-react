import React from 'react';
import './Rules.css';

const Rules = () => {
  const gridstrikeKeywords = [
    { name: "Haste", effect: "Unit may act on the turn it is summoned, but only with 1 action." },
    { name: "Flurry", effect: "Unit may Strike twice with the same weapon during one activation." },
    { name: "Gunslinger", effect: "Unit may Strike once with each of its ranged weapons." },
    { name: "Weapon Master", effect: "Unit may Strike once with each of its melee weapons." },
    { name: "Slow", effect: "Unit only has 1 action per activation." },
    { name: "Immovable", effect: "Cannot be displaced by push, pull, or teleport effects." }
  ];

  const gridstrikeConditions = [
    { name: "Burn", effect: "Takes X damage at the end of its activation, then reduce Burn by 1." },
    { name: "Regenerate", effect: "Heals Xd3 HP at the end of your turn." },
    { name: "Stunned", effect: "Unit has 1 fewer action this round. Resolved when activated or at end of round." }
  ];

  return (
    <div className="rules-container">
      <div className="rules-header">
        <h1>GridStrike: Living Rulebook (v0.3)</h1>
        <p><strong>Last updated:</strong> June 2025</p>
      </div>

      <section className="rules-section">
        <h2>Overview</h2>
        <p>
          GridStrike is a tactical card-and-miniature game played on a grid. Players summon units, cast spells, 
          and maneuver their armies to achieve victory. Each player leads their forces with a powerful Commander, 
          which determines deck identity and strategy. Each player also controls an Obelisk—a powerful terrain 
          card acting as both their base and life total.
        </p>
        <p><strong>Default Victory Condition:</strong> Destroy the enemy Obelisk.</p>
      </section>

      <section className="rules-section">
        <h2>Components</h2>
        <ul>
          <li>1 Commander per player (Legendary unit, chosen from deck at game start)</li>
          <li>1 Obelisk per player (chosen from outside the 40-card deck)</li>
          <li>40-card main deck (Units, Spells, Terrain, Equipment)</li>
          <li>Shared battlefield grid (24×24 squares recommended)</li>
          <li>Colored d6s or d3s to track conditions</li>
          <li>Energy trackers or counters</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Deck Construction</h2>
        <ul>
          <li>40 cards per deck (Commander is part of the deck)</li>
          <li>Obelisks are selected outside the deck and can vary by game</li>
          <li>1 copy of Legendary cards</li>
          <li>2 copies of Rares</li>
          <li>3 copies of Commons</li>
          <li>Decks must follow the color identity of the selected Commander (e.g., red Commander = red + colorless)</li>
          <li><em>Note: Multicolor support may be added in future updates.</em></li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Game Start</h2>
        <ul>
          <li>Each player draws a 5-card opening hand</li>
          <li>Each player selects an Obelisk and a Commander to reveal</li>
          <li>Commander's cost must be less than or equal to the Obelisk's cost</li>
          <li>Each player gains Energy equal to their Obelisk's cost</li>
          <li>Each player must summon their selected Commander during Turn 0</li>
          <li>Leftover Energy may be used to cast other cards (e.g., equipment or units)</li>
          <li>Player with the lower-cost Commander chooses who goes first (if tied, roll off)</li>
          <li>Place Commander adjacent to Obelisk</li>
          <li>First player does not draw on Round 1; second player does</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Turn Structure</h2>
        <ul>
          <li>Gain Energy equal to the current round number</li>
          <li>Add Energy from battlefield effects</li>
          <li>Draw 1 card (except first player on Round 1)</li>
          <li>Activate units and cast spells</li>
          <li>End of Round: unactivated but activatable units resolve conditions</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Energy & Actions</h2>
        <ul>
          <li>Energy is used to summon, cast, equip, or place terrain</li>
          <li>Units have 2 Actions per activation (unless affected by conditions)</li>
          <li>Actions include: Move, Strike, Use Ability</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Units & Activations</h2>
        <ul>
          <li>1 activation per round per unit</li>
          <li>Each activation = 2 actions</li>
          <li>Can only Strike once unless it has <code>Flurry</code></li>
          <li>Can Move twice</li>
          <li>
            <strong>Summoning:</strong>
            <ul>
              <li>Free: adjacent to Obelisk</li>
              <li>1 action: adjacent to a Legendary</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Spells</h2>
        <ul>
          <li><strong>Sorcery</strong> – Your turn only</li>
          <li><strong>Instant</strong> – Any time</li>
          <li>Cast from Commander or Obelisk</li>
          <li>Always hit (no save rolls)</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Equipment</h2>
        <ul>
          <li>Attach to units on the field</li>
          <li>Provide passive/active bonuses</li>
          <li>Grant keywords</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Terrain</h2>
        <ul>
          <li>Cast like units/spells</li>
          <li>Faction-specific or colorless</li>
          <li>
            <strong>Obelisks:</strong>
            <ul>
              <li>AC ~12</li>
              <li>HP = life total</li>
              <li>Attack: +6 to hit, 1d12 dmg, range 3</li>
              <li>Passive based on color (e.g., Red = Haste)</li>
              <li><strong>Cannot be healed unless stated</strong></li>
              <li><strong>Destroy = lose the game</strong></li>
            </ul>
          </li>
          <li>
            <strong>Features:</strong>
            <ul>
              <li>Passable/Impassable</li>
              <li>Blocks LoS or not</li>
              <li>Interactivity (e.g., capture)</li>
              <li>Default AC = 10</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Conditions</h2>
        <ul>
          <li>Numeric effects (e.g., Burn 2, Regenerate 3, Stunned)</li>
          <li>Max stack of 3 per condition</li>
          <li>Tracked with dice (e.g., d6 or d3)</li>
          <li>When a unit activates: resolve all conditions at end of activation, then reduce each by 1</li>
          <li>At end of round, only unactivated but activatable units resolve conditions</li>
          <li>Units that cannot activate this round (e.g., newly summoned without Haste) do not resolve conditions yet</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Line of Sight & Cover</h2>
        <ul>
          <li>Allies do not block LoS</li>
          <li>Terrain may block LoS</li>
          <li>Cover system under development – terrain-based only</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Graveyard & Exile</h2>
        <ul>
          <li>Destroyed units → Graveyard</li>
          <li>Legendary cards go to the Graveyard like other units</li>
          <li>Commanders may be redirected to the Command Zone instead of the Graveyard</li>
          <li>Re-summon Commanders by paying original Energy cost +2 per prior return</li>
          <li><strong>Exile:</strong> for removed-from-game effects</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Card Management</h2>
        <ul>
          <li>Draw 1 card at the start of your turn (except first player on Round 1)</li>
          <li>No discarding unless stated by an effect</li>
          <li>No current penalty for running out of cards</li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>Keywords</h2>
        <ul>
          {gridstrikeKeywords.map((keyword, index) => (
            <li key={index}>
              <strong>{keyword.name}</strong> - {keyword.effect}
            </li>
          ))}
        </ul>
      </section>

      <section className="rules-section">
        <h2>Conditions</h2>
        <ul>
          {gridstrikeConditions.map((condition, index) => (
            <li key={index}>
              <strong>{condition.name}</strong> - {condition.effect}
            </li>
          ))}
        </ul>
      </section>

      <section className="rules-section">
        <h2>Planned Features</h2>
        <ul>
          <li>More factions & color identities</li>
          <li>Terrain-based cover system</li>
          <li>Living rulebook updates</li>
        </ul>
      </section>
    </div>
  );
};

export default Rules;
