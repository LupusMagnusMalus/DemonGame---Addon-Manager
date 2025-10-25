// Stats Page Enhancements aus GonBruck
(function() {
  'use strict';

  class StatsMods {
    constructor() {
      this.playerStats = {
        attack: 0,
        defense: 0,
        stamina: 0,
        level: 0
      };
    }

    init() {
      if (!window.location.pathname.includes('stats.php')) return;
      
      console.log('📊 Initializing Stats Mods');
      
      this.extractPlayerStats();
      this.addDamageCalculations();
      this.addStatAllocationHelper();
      this.addStatComparison();
      this.enhanceStatDisplay();
    }

    extractPlayerStats() {
      // Extract stats from the stats page
      const statElements = document.querySelectorAll('.stat-value, .player-stat');
      
      statElements.forEach(element => {
        const text = element.textContent.toLowerCase();
        const value = parseInt(element.textContent.match(/\d+/)?.[0]) || 0;
        
        if (text.includes('attack')) {
          this.playerStats.attack = value;
        } else if (text.includes('defense') || text.includes('defence')) {
          this.playerStats.defense = value;
        } else if (text.includes('stamina')) {
          this.playerStats.stamina = value;
        } else if (text.includes('level')) {
          this.playerStats.level = value;
        }
      });

      // Also try to extract from stat headers or labels
      const headers = document.querySelectorAll('h3, h4, .stat-label');
      headers.forEach(header => {
        const headerText = header.textContent.toLowerCase();
        const nextElement = header.nextElementSibling;
        
        if (nextElement) {
          const value = parseInt(nextElement.textContent.match(/\d+/)?.[0]) || 0;
          
          if (headerText.includes('attack')) {
            this.playerStats.attack = value;
          } else if (headerText.includes('defense')) {
            this.playerStats.defense = value;
          } else if (headerText.includes('stamina')) {
            this.playerStats.stamina = value;
          }
        }
      });

      console.log('Player stats extracted:', this.playerStats);
    }

    addDamageCalculations() {
      const statsContainer = document.querySelector('.stats-container, .player-stats');
      if (!statsContainer) return;

      // Create damage calculation panel
      const damagePanel = document.createElement('div');
      damagePanel.className = 'damage-calculations-panel';
      damagePanel.innerHTML = this.getDamageCalculationsHTML();
      
      statsContainer.appendChild(damagePanel);
      
      this.calculateDamageVsDefense();
      this.addCalculationCSS();
    }

    getDamageCalculationsHTML() {
      return `
        <div class="calculation-panel">
          <h3>⚔️ Damage Calculations</h3>
          <p class="panel-description">Your attack damage against different defense levels</p>
          
          <div class="damage-grid">
            <div class="damage-scenario">
              <h4>vs 0 Defense</h4>
              <div class="damage-value" id="damage-vs-0">-</div>
              <p class="scenario-desc">Unarmored targets</p>
            </div>
            
            <div class="damage-scenario">
              <h4>vs 25 Defense</h4>
              <div class="damage-value" id="damage-vs-25">-</div>
              <p class="scenario-desc">Light armor</p>
            </div>
            
            <div class="damage-scenario">
              <h4>vs 50 Defense</h4>
              <div class="damage-value" id="damage-vs-50">-</div>
              <p class="scenario-desc">Medium armor</p>
            </div>
            
            <div class="damage-scenario">
              <h4>vs 100 Defense</h4>
              <div class="damage-value" id="damage-vs-100">-</div>
              <p class="scenario-desc">Heavy armor</p>
            </div>
          </div>
          
          <div class="damage-formula">
            <h4>📐 Damage Formula</h4>
            <p><code>Damage = max(1, Attack - Defense)</code></p>
            <p class="formula-note">Minimum damage is always 1</p>
          </div>
        </div>
      `;
    }

    calculateDamageVsDefense() {
      const defenseValues = [0, 25, 50, 100];
      
      defenseValues.forEach(defense => {
        const damage = Math.max(1, this.playerStats.attack - defense);
        const element = document.getElementById(`damage-vs-${defense}`);
        
        if (element) {
          element.textContent = damage.toLocaleString();
          
          // Color code damage values
          if (damage >= this.playerStats.attack * 0.8) {
            element.style.color = '#a6e3a1'; // High damage - green
          } else if (damage >= this.playerStats.attack * 0.5) {
            element.style.color = '#f9e2af'; // Medium damage - yellow
          } else if (damage > 1) {
            element.style.color = '#fab387'; // Low damage - orange
          } else {
            element.style.color = '#f38ba8'; // Minimum damage - red
          }
        }
      });
    }

    addStatAllocationHelper() {
      const statsContainer = document.querySelector('.stats-container, .player-stats');
      if (!statsContainer) return;

      const allocationHelper = document.createElement('div');
      allocationHelper.className = 'stat-allocation-helper';
      allocationHelper.innerHTML = `
        <div class="allocation-panel">
          <h3>🎯 Stat Allocation Helper</h3>
          <p class="panel-description">Plan your stat distribution</p>
          
          <div class="allocation-simulator">
            <div class="stat-input-group">
              <label>Attack Points:</label>
              <input type="number" id="sim-attack" value="${this.playerStats.attack}" min="0" max="999">
              <div class="stat-buttons">
                <button class="stat-btn" data-stat="attack" data-amount="1">+1</button>
                <button class="stat-btn" data-stat="attack" data-amount="5">+5</button>
                <button class="stat-btn" data-stat="attack" data-amount="10">+10</button>
              </div>
            </div>
            
            <div class="stat-input-group">
              <label>Defense Points:</label>
              <input type="number" id="sim-defense" value="${this.playerStats.defense}" min="0" max="999">
              <div class="stat-buttons">
                <button class="stat-btn" data-stat="defense" data-amount="1">+1</button>
                <button class="stat-btn" data-stat="defense" data-amount="5">+5</button>
                <button class="stat-btn" data-stat="defense" data-amount="10">+10</button>
              </div>
            </div>
            
            <div class="stat-input-group">
              <label>Stamina Points:</label>
              <input type="number" id="sim-stamina" value="${this.playerStats.stamina}" min="0" max="999">
              <div class="stat-buttons">
                <button class="stat-btn" data-stat="stamina" data-amount="1">+1</button>
                <button class="stat-btn" data-stat="stamina" data-amount="5">+5</button>
                <button class="stat-btn" data-stat="stamina" data-amount="10">+10</button>
              </div>
            </div>
            
            <div class="simulation-results">
              <h4>Simulation Results:</h4>
              <div class="sim-result">
                <span>Total Stats:</span>
                <span id="total-stats">-</span>
              </div>
              <div class="sim-result">
                <span>Damage vs 50 Def:</span>
                <span id="sim-damage">-</span>
              </div>
              <div class="sim-result">
                <span>Effective HP:</span>
                <span id="effective-hp">-</span>
              </div>
            </div>
            
            <div class="allocation-actions">
              <button id="reset-simulation" class="action-btn secondary">Reset</button>
              <button id="optimal-build" class="action-btn primary">Suggest Optimal</button>
            </div>
          </div>
        </div>
      `;
      
      statsContainer.appendChild(allocationHelper);
      this.setupAllocationHelper();
    }

    setupAllocationHelper() {
      // Setup stat button listeners
      document.querySelectorAll('.stat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const stat = btn.dataset.stat;
          const amount = parseInt(btn.dataset.amount);
          this.adjustSimulatedStat(stat, amount);
        });
      });

      // Setup input listeners
      ['sim-attack', 'sim-defense', 'sim-stamina'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
          input.addEventListener('input', () => {
            this.updateSimulation();
          });
        }
      });

      // Setup action buttons
      document.getElementById('reset-simulation')?.addEventListener('click', () => {
        this.resetSimulation();
      });

      document.getElementById('optimal-build')?.addEventListener('click', () => {
        this.suggestOptimalBuild();
      });

      // Initial simulation update
      this.updateSimulation();
    }

    adjustSimulatedStat(stat, amount) {
      const input = document.getElementById(`sim-${stat}`);
      if (input) {
        const currentValue = parseInt(input.value) || 0;
        input.value = Math.max(0, currentValue + amount);
        this.updateSimulation();
      }
    }

    updateSimulation() {
      const attack = parseInt(document.getElementById('sim-attack')?.value) || 0;
      const defense = parseInt(document.getElementById('sim-defense')?.value) || 0;
      const stamina = parseInt(document.getElementById('sim-stamina')?.value) || 0;
      
      const totalStats = attack + defense + stamina;
      const damageVs50 = Math.max(1, attack - 50);
      const effectiveHP = stamina + defense; // Simplified HP calculation
      
      document.getElementById('total-stats').textContent = totalStats.toLocaleString();
      document.getElementById('sim-damage').textContent = damageVs50.toLocaleString();
      document.getElementById('effective-hp').textContent = effectiveHP.toLocaleString();
    }

    resetSimulation() {
      document.getElementById('sim-attack').value = this.playerStats.attack;
      document.getElementById('sim-defense').value = this.playerStats.defense;
      document.getElementById('sim-stamina').value = this.playerStats.stamina;
      this.updateSimulation();
    }

    suggestOptimalBuild() {
      // Simple optimal build suggestion (balanced approach)
      const totalCurrentStats = this.playerStats.attack + this.playerStats.defense + this.playerStats.stamina;
      const availablePoints = Math.floor(totalCurrentStats * 1.2); // Assume 20% more points available
      
      // Balanced build: 50% attack, 30% defense, 20% stamina
      const suggestedAttack = Math.floor(availablePoints * 0.5);
      const suggestedDefense = Math.floor(availablePoints * 0.3);
      const suggestedStamina = Math.floor(availablePoints * 0.2);
      
      document.getElementById('sim-attack').value = suggestedAttack;
      document.getElementById('sim-defense').value = suggestedDefense;
      document.getElementById('sim-stamina').value = suggestedStamina;
      
      this.updateSimulation();
      
      window.GameEnhancement?.NotificationSystem?.info('Optimal balanced build suggested!');
    }

    addStatComparison() {
      const statsContainer = document.querySelector('.stats-container, .player-stats');
      if (!statsContainer) return;

      const comparisonPanel = document.createElement('div');
      comparisonPanel.className = 'stat-comparison-panel';
      comparisonPanel.innerHTML = `
        <div class="comparison-panel">
          <h3>📈 Stat Comparison</h3>
          <p class="panel-description">How your stats compare to typical player levels</p>
          
          <div class="comparison-charts">
            <div class="stat-comparison">
              <h4>Attack Distribution</h4>
              <div class="stat-bar">
                <div class="stat-bar-fill attack-bar" style="width: ${this.getStatPercentile('attack')}%"></div>
                <span class="stat-bar-label">${this.playerStats.attack} (${this.getStatRating('attack')})</span>
              </div>
            </div>
            
            <div class="stat-comparison">
              <h4>Defense Distribution</h4>
              <div class="stat-bar">
                <div class="stat-bar-fill defense-bar" style="width: ${this.getStatPercentile('defense')}%"></div>
                <span class="stat-bar-label">${this.playerStats.defense} (${this.getStatRating('defense')})</span>
              </div>
            </div>
            
            <div class="stat-comparison">
              <h4>Stamina Distribution</h4>
              <div class="stat-bar">
                <div class="stat-bar-fill stamina-bar" style="width: ${this.getStatPercentile('stamina')}%"></div>
                <span class="stat-bar-label">${this.playerStats.stamina} (${this.getStatRating('stamina')})</span>
              </div>
            </div>
          </div>
          
          <div class="build-analysis">
            <h4>🔍 Build Analysis</h4>
            <div class="build-type">
              <strong>Build Type:</strong> ${this.analyzeBuildType()}
            </div>
            <div class="build-recommendations">
              <strong>Recommendations:</strong>
              <ul>${this.getBuildRecommendations().map(rec => `<li>${rec}</li>`).join('')}</ul>
            </div>
          </div>
        </div>
      `;
      
      statsContainer.appendChild(comparisonPanel);
    }

    getStatPercentile(stat) {
      // Rough percentile calculation based on typical distributions
      const value = this.playerStats[stat];
      
      if (value < 50) return Math.min(90, value * 1.8);
      if (value < 100) return Math.min(95, 90 + (value - 50) * 0.1);
      return Math.min(100, 95 + (value - 100) * 0.05);
    }

    getStatRating(stat) {
      const value = this.playerStats[stat];
      
      if (value < 25) return 'Very Low';
      if (value < 50) return 'Low';
      if (value < 100) return 'Average';
      if (value < 200) return 'High';
      if (value < 350) return 'Very High';
      return 'Exceptional';
    }

    analyzeBuildType() {
      const { attack, defense, stamina } = this.playerStats;
      const total = attack + defense + stamina;
      
      if (total === 0) return 'No build detected';
      
      const attackRatio = attack / total;
      const defenseRatio = defense / total;
      const staminaRatio = stamina / total;
      
      if (attackRatio > 0.6) return 'Glass Cannon (High Attack)';
      if (defenseRatio > 0.5) return 'Tank (High Defense)';
      if (staminaRatio > 0.4) return 'Endurance (High Stamina)';
      if (Math.abs(attackRatio - defenseRatio) < 0.1 && Math.abs(attackRatio - staminaRatio) < 0.1) {
        return 'Balanced Build';
      }
      if (attackRatio > defenseRatio && attackRatio > staminaRatio) return 'Damage Dealer';
      if (defenseRatio > staminaRatio) return 'Defensive Build';
      
      return 'Hybrid Build';
    }

    getBuildRecommendations() {
      const { attack, defense, stamina } = this.playerStats;
      const recommendations = [];
      
      if (attack < 50) {
        recommendations.push('Consider increasing Attack for better damage output');
      }
      
      if (defense < 25) {
        recommendations.push('Low Defense makes you vulnerable - consider boosting it');
      }
      
      if (stamina < 30) {
        recommendations.push('More Stamina would improve survivability');
      }
      
      if (attack > defense * 3) {
        recommendations.push('Very glass cannon build - balance with more Defense');
      }
      
      if (defense > attack * 2) {
        recommendations.push('High defense but low damage - consider more Attack');
      }
      
      if (recommendations.length === 0) {
        recommendations.push('Well-balanced build! Consider specializing based on your playstyle');
      }
      
      return recommendations;
    }

    enhanceStatDisplay() {
      // Add visual enhancements to existing stat displays
      const statElements = document.querySelectorAll('.stat-value, .player-stat');
      
      statElements.forEach(element => {
        const value = parseInt(element.textContent.match(/\d+/)?.[0]) || 0;
        
        // Add stat tier indicators
        const tier = this.getStatTier(value);
        element.classList.add(`stat-tier-${tier.toLowerCase()}`);
        
        // Add hover tooltips
        element.title = `${tier} tier (${value} points)`;
        
        // Add visual effects
        if (value > 200) {
          element.style.textShadow = '0 0 8px rgba(168, 85, 247, 0.6)';
        }
      });
    }

    getStatTier(value) {
      if (value < 25) return 'Novice';
      if (value < 50) return 'Basic';
      if (value < 100) return 'Skilled';
      if (value < 200) return 'Expert';
      if (value < 350) return 'Master';
      return 'Legendary';
    }

    addCalculationCSS() {
      const style = document.createElement('style');
      style.textContent = `
        .calculation-panel, .allocation-panel, .comparison-panel {
          margin: 20px 0;
          padding: 20px;
          background: #1e1e2e;
          border: 1px solid #45475a;
          border-radius: 8px;
        }
        
        .calculation-panel h3, .allocation-panel h3, .comparison-panel h3 {
          color: #f9e2af;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        
        .panel-description {
          color: #a6adc8;
          font-size: 13px;
          margin-bottom: 20px;
        }
        
        .damage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .damage-scenario {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
          border: 1px solid #45475a;
        }
        
        .damage-scenario h4 {
          color: #cba6f7;
          margin: 0 0 10px 0;
          font-size: 14px;
        }
        
        .damage-value {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .scenario-desc {
          color: #6c7086;
          font-size: 11px;
          margin: 0;
        }
        
        .damage-formula {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #45475a;
        }
        
        .damage-formula h4 {
          color: #74c0fc;
          margin: 0 0 10px 0;
        }
        
        .damage-formula code {
          background: #1e1e2e;
          padding: 4px 8px;
          border-radius: 4px;
          color: #f9e2af;
          font-family: monospace;
        }
        
        .formula-note {
          color: #a6adc8;
          font-size: 12px;
          font-style: italic;
          margin: 5px 0 0 0;
        }
        
        /* Stat Allocation Helper Styles */
        .stat-input-group {
          margin-bottom: 15px;
          padding: 15px;
          background: #313244;
          border-radius: 6px;
          border: 1px solid #45475a;
        }
        
        .stat-input-group label {
          display: block;
          color: #f9e2af;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .stat-input-group input {
          width: 80px;
          padding: 6px 10px;
          background: #1e1e2e;
          border: 1px solid #45475a;
          border-radius: 4px;
          color: #cdd6f4;
          margin-right: 10px;
        }
        
        .stat-buttons {
          display: inline-flex;
          gap: 5px;
        }
        
        .stat-btn {
          padding: 4px 8px;
          background: #74c0fc;
          border: none;
          border-radius: 4px;
          color: #1e1e2e;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .stat-btn:hover {
          background: #89cff0;
          transform: translateY(-1px);
        }
        
        .simulation-results {
          background: #1e1e2e;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
        }
        
        .simulation-results h4 {
          color: #a6e3a1;
          margin: 0 0 10px 0;
        }
        
        .sim-result {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          color: #cdd6f4;
        }
        
        .allocation-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        
        .action-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-btn.primary {
          background: #a6e3a1;
          color: #1e1e2e;
        }
        
        .action-btn.secondary {
          background: #6c7086;
          color: #cdd6f4;
        }
        
        .action-btn:hover {
          transform: translateY(-1px);
        }
        
        /* Stat Comparison Styles */
        .comparison-charts {
          margin-bottom: 20px;
        }
        
        .stat-comparison {
          margin-bottom: 15px;
        }
        
        .stat-comparison h4 {
          color: #cba6f7;
          margin: 0 0 8px 0;
          font-size: 14px;
        }
        
        .stat-bar {
          position: relative;
          background: #313244;
          height: 24px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #45475a;
        }
        
        .stat-bar-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 12px;
        }
        
        .stat-bar-fill.attack-bar {
          background: linear-gradient(90deg, #f38ba8, #eba0ac);
        }
        
        .stat-bar-fill.defense-bar {
          background: linear-gradient(90deg, #74c0fc, #89b4fa);
        }
        
        .stat-bar-fill.stamina-bar {
          background: linear-gradient(90deg, #a6e3a1, #94e2d5);
        }
        
        .stat-bar-label {
          position: absolute;
          top: 50%;
          left: 10px;
          transform: translateY(-50%);
          color: #1e1e2e;
          font-size: 12px;
          font-weight: 600;
          text-shadow: 1px 1px 2px rgba(255,255,255,0.3);
        }
        
        .build-analysis {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #45475a;
        }
        
        .build-analysis h4 {
          color: #f9e2af;
          margin: 0 0 10px 0;
        }
        
        .build-type {
          color: #cdd6f4;
          margin-bottom: 10px;
        }
        
        .build-recommendations {
          color: #cdd6f4;
        }
        
        .build-recommendations ul {
          margin: 5px 0 0 20px;
          color: #a6adc8;
        }
        
        .build-recommendations li {
          margin-bottom: 3px;
          font-size: 13px;
        }
        
        /* Stat Tier Classes */
        .stat-tier-novice { color: #6c7086; }
        .stat-tier-basic { color: #cdd6f4; }
        .stat-tier-skilled { color: #74c0fc; }
        .stat-tier-expert { color: #a6e3a1; }
        .stat-tier-master { color: #f9e2af; }
        .stat-tier-legendary { color: #cba6f7; }
      `;
      
      document.head.appendChild(style);
    }
  }

  // Initialize function
  window.initStatsMods = function(config = {}) {
    const statsMods = new StatsMods();
    statsMods.init();
    return statsMods;
  };
})();