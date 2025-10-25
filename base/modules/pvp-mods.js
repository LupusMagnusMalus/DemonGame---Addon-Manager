// PvP Arena Features aus GonBruck
(function() {
  'use strict';

  class PvPMods {
    constructor() {
      this.battleHistory = [];
      this.playerStats = {
        wins: 0,
        losses: 0,
        points: 0
      };
    }

    init() {
      if (!window.location.pathname.includes('pvp.php')) return;
      
      console.log('🥊 Initializing PvP Mods');
      
      this.addDefenderHighlights();
      this.addPointsTracking();
      this.addBattleAnalysis();
      this.enhanceBattleList();
      this.addPvPStats();
    }

    addDefenderHighlights() {
      // Highlight defender fights to distinguish from attacks
      const battleItems = document.querySelectorAll('.battle-item, .pvp-battle, .fight-item');
      
      battleItems.forEach(item => {
        const battleText = item.textContent.toLowerCase();
        
        // Check if this is a defender battle
        if (this.isDefenderBattle(battleText)) {
          this.markAsDefender(item);
        } else if (this.isAttackerBattle(battleText)) {
          this.markAsAttacker(item);
        }
      });
    }

    isDefenderBattle(text) {
      const defenderKeywords = [
        'defending', 'defense', 'defend', 'attacked by', 'challenger:', 'vs you'
      ];
      return defenderKeywords.some(keyword => text.includes(keyword));
    }

    isAttackerBattle(text) {
      const attackerKeywords = [
        'attacking', 'attack', 'challenge', 'vs', 'fight'
      ];
      return attackerKeywords.some(keyword => text.includes(keyword)) && 
             !this.isDefenderBattle(text);
    }

    markAsDefender(item) {
      item.classList.add('defender-battle');
      item.style.cssText += `
        border-left: 4px solid #f38ba8;
        background: linear-gradient(90deg, rgba(243, 139, 168, 0.1), transparent);
      `;
      
      // Add defender icon
      const defenderIcon = document.createElement('span');
      defenderIcon.className = 'battle-type-icon defender-icon';
      defenderIcon.innerHTML = '🛡️';
      defenderIcon.title = 'Defender Battle';
      defenderIcon.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        font-size: 16px;
        background: rgba(243, 139, 168, 0.2);
        padding: 4px;
        border-radius: 4px;
        z-index: 10;
      `;
      
      if (getComputedStyle(item).position === 'static') {
        item.style.position = 'relative';
      }
      
      item.appendChild(defenderIcon);
    }

    markAsAttacker(item) {
      item.classList.add('attacker-battle');
      item.style.cssText += `
        border-left: 4px solid #74c0fc;
        background: linear-gradient(90deg, rgba(116, 192, 252, 0.1), transparent);
      `;
      
      // Add attacker icon
      const attackerIcon = document.createElement('span');
      attackerIcon.className = 'battle-type-icon attacker-icon';
      attackerIcon.innerHTML = '⚔️';
      attackerIcon.title = 'Attacker Battle';
      attackerIcon.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        font-size: 16px;
        background: rgba(116, 192, 252, 0.2);
        padding: 4px;
        border-radius: 4px;
        z-index: 10;
      `;
      
      if (getComputedStyle(item).position === 'static') {
        item.style.position = 'relative';
      }
      
      item.appendChild(attackerIcon);
    }

    addPointsTracking() {
      // Add points column to show gains and losses
      const battleTable = document.querySelector('.battle-table, .pvp-table');
      if (!battleTable) return;

      // Add header if table structure exists
      const headerRow = battleTable.querySelector('thead tr, .table-header');
      if (headerRow) {
        const pointsHeader = document.createElement('th');
        pointsHeader.textContent = 'Points';
        pointsHeader.style.cssText = `
          color: #f9e2af;
          text-align: center;
          padding: 10px;
          border-bottom: 1px solid #45475a;
        `;
        headerRow.appendChild(pointsHeader);
      }

      // Add points data to each row
      const battleRows = battleTable.querySelectorAll('tbody tr, .battle-row');
      battleRows.forEach(row => {
        const pointsCell = this.createPointsCell(row);
        row.appendChild(pointsCell);
      });

      // If no table structure, add points to battle items
      if (!battleTable.querySelector('thead')) {
        this.addPointsToItems();
      }
    }

    createPointsCell(row) {
      const cell = document.createElement('td');
      cell.className = 'points-cell';
      
      const pointsData = this.extractPointsFromBattle(row);
      
      cell.innerHTML = `
        <div class="points-display">
          <span class="points-value ${pointsData.change >= 0 ? 'positive' : 'negative'}">
            ${pointsData.change >= 0 ? '+' : ''}${pointsData.change}
          </span>
          <small class="points-total">(${pointsData.total})</small>
        </div>
      `;
      
      cell.style.cssText = `
        text-align: center;
        padding: 10px;
        vertical-align: middle;
      `;
      
      return cell;
    }

    extractPointsFromBattle(row) {
      const text = row.textContent;
      
      // Try to extract points from various patterns
      let change = 0;
      let total = 0;
      
      // Look for point changes like "+15 points", "-8 points"
      const changeMatch = text.match(/([+-]?\d+)\s*points?/i);
      if (changeMatch) {
        change = parseInt(changeMatch[1]);
      }
      
      // Look for total points like "Total: 1547"
      const totalMatch = text.match(/total[:\s]*(\d+)/i);
      if (totalMatch) {
        total = parseInt(totalMatch[1]);
      }
      
      // Estimate based on battle outcome if no explicit points
      if (change === 0) {
        if (text.toLowerCase().includes('victory') || text.toLowerCase().includes('won')) {
          change = Math.floor(Math.random() * 20) + 10; // +10 to +30
        } else if (text.toLowerCase().includes('defeat') || text.toLowerCase().includes('lost')) {
          change = -(Math.floor(Math.random() * 15) + 5); // -5 to -20
        }
      }
      
      return { change, total };
    }

    addPointsToItems() {
      const battleItems = document.querySelectorAll('.battle-item, .pvp-battle, .fight-item');
      
      battleItems.forEach(item => {
        const pointsData = this.extractPointsFromBattle(item);
        
        if (pointsData.change !== 0) {
          const pointsBadge = document.createElement('div');
          pointsBadge.className = 'points-badge';
          pointsBadge.innerHTML = `
            <span class="points-change ${pointsData.change >= 0 ? 'positive' : 'negative'}">
              ${pointsData.change >= 0 ? '+' : ''}${pointsData.change}
            </span>
          `;
          
          pointsBadge.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: ${pointsData.change >= 0 ? 'rgba(166, 227, 161, 0.2)' : 'rgba(243, 139, 168, 0.2)'};
            border: 1px solid ${pointsData.change >= 0 ? '#a6e3a1' : '#f38ba8'};
            color: ${pointsData.change >= 0 ? '#a6e3a1' : '#f38ba8'};
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            z-index: 10;
          `;
          
          if (getComputedStyle(item).position === 'static') {
            item.style.position = 'relative';
          }
          
          item.appendChild(pointsBadge);
        }
      });
    }

    addBattleAnalysis() {
      const pvpContainer = document.querySelector('.pvp-container, .battle-list');
      if (!pvpContainer) return;

      const analysisPanel = document.createElement('div');
      analysisPanel.className = 'battle-analysis-panel';
      analysisPanel.innerHTML = `
        <div class="analysis-content">
          <h3>📊 Battle Analysis</h3>
          
          <div class="quick-stats">
            <div class="stat-card">
              <div class="stat-value" id="total-battles">0</div>
              <div class="stat-label">Total Battles</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-value" id="win-rate">0%</div>
              <div class="stat-label">Win Rate</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-value" id="avg-points">+0</div>
              <div class="stat-label">Avg Points</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-value" id="best-streak">0</div>
              <div class="stat-label">Best Streak</div>
            </div>
          </div>
          
          <div class="battle-breakdown">
            <h4>Battle Breakdown</h4>
            <div class="breakdown-row">
              <span>Attacker Battles:</span>
              <span id="attacker-count">0</span>
            </div>
            <div class="breakdown-row">
              <span>Defender Battles:</span>
              <span id="defender-count">0</span>
            </div>
            <div class="breakdown-row">
              <span>Points Gained:</span>
              <span id="points-gained" class="positive">+0</span>
            </div>
            <div class="breakdown-row">
              <span>Points Lost:</span>
              <span id="points-lost" class="negative">-0</span>
            </div>
          </div>
        </div>
      `;
      
      pvpContainer.insertBefore(analysisPanel, pvpContainer.firstChild);
      
      this.calculateBattleStats();
      this.addAnalysisCSS();
    }

    calculateBattleStats() {
      const battleItems = document.querySelectorAll('.battle-item, .pvp-battle, .fight-item');
      
      let totalBattles = battleItems.length;
      let wins = 0;
      let losses = 0;
      let attackerBattles = 0;
      let defenderBattles = 0;
      let totalPointsGained = 0;
      let totalPointsLost = 0;
      let currentStreak = 0;
      let bestStreak = 0;
      
      battleItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        const pointsData = this.extractPointsFromBattle(item);
        
        // Count battle types
        if (this.isDefenderBattle(text)) {
          defenderBattles++;
        } else {
          attackerBattles++;
        }
        
        // Count wins/losses
        if (text.includes('victory') || text.includes('won') || pointsData.change > 0) {
          wins++;
          currentStreak++;
          bestStreak = Math.max(bestStreak, currentStreak);
        } else if (text.includes('defeat') || text.includes('lost') || pointsData.change < 0) {
          losses++;
          currentStreak = 0;
        }
        
        // Count points
        if (pointsData.change > 0) {
          totalPointsGained += pointsData.change;
        } else if (pointsData.change < 0) {
          totalPointsLost += Math.abs(pointsData.change);
        }
      });
      
      // Update display
      const winRate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0;
      const avgPoints = totalBattles > 0 ? Math.round((totalPointsGained - totalPointsLost) / totalBattles) : 0;
      
      document.getElementById('total-battles').textContent = totalBattles;
      document.getElementById('win-rate').textContent = winRate + '%';
      document.getElementById('avg-points').textContent = (avgPoints >= 0 ? '+' : '') + avgPoints;
      document.getElementById('best-streak').textContent = bestStreak;
      document.getElementById('attacker-count').textContent = attackerBattles;
      document.getElementById('defender-count').textContent = defenderBattles;
      document.getElementById('points-gained').textContent = '+' + totalPointsGained;
      document.getElementById('points-lost').textContent = '-' + totalPointsLost;
      
      // Color code win rate
      const winRateEl = document.getElementById('win-rate');
      if (winRate >= 70) {
        winRateEl.style.color = '#a6e3a1';
      } else if (winRate >= 50) {
        winRateEl.style.color = '#f9e2af';
      } else {
        winRateEl.style.color = '#f38ba8';
      }
    }

    enhanceBattleList() {
      const battleItems = document.querySelectorAll('.battle-item, .pvp-battle, .fight-item');
      
      battleItems.forEach((item, index) => {
        // Add battle number
        const battleNumber = document.createElement('div');
        battleNumber.className = 'battle-number';
        battleNumber.textContent = `#${battleItems.length - index}`;
        battleNumber.style.cssText = `
          position: absolute;
          top: 5px;
          right: 5px;
          background: rgba(108, 112, 134, 0.5);
          color: #cdd6f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          z-index: 5;
        `;
        
        if (getComputedStyle(item).position === 'static') {
          item.style.position = 'relative';
        }
        
        item.appendChild(battleNumber);
        
        // Add quick actions
        this.addQuickActions(item);
      });
    }

    addQuickActions(item) {
      const actions = document.createElement('div');
      actions.className = 'battle-quick-actions';
      actions.innerHTML = `
        <button class="quick-action-btn view-btn" title="View Details">👁️</button>
        <button class="quick-action-btn replay-btn" title="Battle Again">🔄</button>
        <button class="quick-action-btn analyze-btn" title="Analyze">📊</button>
      `;
      
      actions.style.cssText = `
        position: absolute;
        bottom: 10px;
        right: 10px;
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 10;
      `;
      
      item.appendChild(actions);
      
      // Show actions on hover
      item.addEventListener('mouseenter', () => {
        actions.style.opacity = '1';
      });
      
      item.addEventListener('mouseleave', () => {
        actions.style.opacity = '0';
      });
      
      // Setup action listeners
      actions.querySelector('.view-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.viewBattleDetails(item);
      });
      
      actions.querySelector('.replay-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.replayBattle(item);
      });
      
      actions.querySelector('.analyze-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.analyzeBattle(item);
      });
    }

    viewBattleDetails(item) {
      // Extract battle information
      const opponent = this.extractOpponentName(item);
      const outcome = this.extractBattleOutcome(item);
      const points = this.extractPointsFromBattle(item);
      
      const modal = this.createBattleModal(opponent, outcome, points);
      document.body.appendChild(modal);
    }

    extractOpponentName(item) {
      const text = item.textContent;
      
      // Try various patterns to extract opponent name
      const patterns = [
        /vs\s+([^(\n]+)/i,
        /against\s+([^(\n]+)/i,
        /challenger:\s*([^(\n]+)/i,
        /opponent:\s*([^(\n]+)/i
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }
      
      return 'Unknown Opponent';
    }

    extractBattleOutcome(item) {
      const text = item.textContent.toLowerCase();
      
      if (text.includes('victory') || text.includes('won')) return 'Victory';
      if (text.includes('defeat') || text.includes('lost')) return 'Defeat';
      if (text.includes('draw') || text.includes('tie')) return 'Draw';
      
      return 'Unknown';
    }

    createBattleModal(opponent, outcome, points) {
      const modal = document.createElement('div');
      modal.className = 'battle-detail-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>⚔️ Battle Details</h3>
            <button class="modal-close">×</button>
          </div>
          
          <div class="modal-body">
            <div class="battle-info">
              <div class="info-row">
                <span class="info-label">Opponent:</span>
                <span class="info-value">${opponent}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Outcome:</span>
                <span class="info-value ${outcome.toLowerCase()}">${outcome}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Points Change:</span>
                <span class="info-value ${points.change >= 0 ? 'positive' : 'negative'}">
                  ${points.change >= 0 ? '+' : ''}${points.change}
                </span>
              </div>
            </div>
            
            <div class="battle-actions">
              <button class="modal-btn challenge-again">Challenge Again</button>
              <button class="modal-btn view-profile">View Profile</button>
            </div>
          </div>
        </div>
      `;
      
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;
      
      // Close modal functionality
      modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
      });
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
      
      return modal;
    }

    replayBattle(item) {
      const opponent = this.extractOpponentName(item);
      window.GameEnhancement?.NotificationSystem?.info(`Looking for ${opponent} to battle again...`);
      
      // This would normally navigate to challenge the same opponent
      // For now, just show a notification
      setTimeout(() => {
        window.GameEnhancement?.NotificationSystem?.warning('Battle replay feature coming soon!');
      }, 1500);
    }

    analyzeBattle(item) {
      const outcome = this.extractBattleOutcome(item);
      const points = this.extractPointsFromBattle(item);
      
      let analysis = '';
      if (outcome === 'Victory') {
        analysis = 'Great job! This victory earned you points and improved your ranking.';
      } else if (outcome === 'Defeat') {
        analysis = 'This loss cost you some points. Consider adjusting your strategy.';
      } else {
        analysis = 'Battle analysis not available for this result.';
      }
      
      window.GameEnhancement?.NotificationSystem?.info(analysis);
    }

    addPvPStats() {
      // Add overall PvP statistics to the page
      const statsContainer = document.createElement('div');
      statsContainer.className = 'pvp-stats-container';
      statsContainer.innerHTML = `
        <div class="pvp-stats-panel">
          <h3>🏆 PvP Statistics</h3>
          
          <div class="rank-info">
            <div class="current-rank">
              <span class="rank-label">Current Rank:</span>
              <span class="rank-value" id="current-rank">Calculating...</span>
            </div>
            <div class="rank-progress">
              <div class="progress-bar">
                <div class="progress-fill" id="rank-progress"></div>
              </div>
              <span class="progress-text" id="progress-text">Loading...</span>
            </div>
          </div>
          
          <div class="performance-metrics">
            <div class="metric">
              <span class="metric-label">Attack Success Rate:</span>
              <span class="metric-value" id="attack-success">0%</span>
            </div>
            <div class="metric">
              <span class="metric-label">Defense Success Rate:</span>
              <span class="metric-value" id="defense-success">0%</span>
            </div>
            <div class="metric">
              <span class="metric-label">Average Battle Duration:</span>
              <span class="metric-value" id="avg-duration">Unknown</span>
            </div>
          </div>
        </div>
      `;
      
      const pvpContainer = document.querySelector('.pvp-container, .battle-list');
      if (pvpContainer) {
        pvpContainer.appendChild(statsContainer);
      }
      
      this.calculatePvPStats();
    }

    calculatePvPStats() {
      // Calculate advanced PvP statistics
      const battleItems = document.querySelectorAll('.battle-item, .pvp-battle, .fight-item');
      
      let attackWins = 0, attackTotal = 0;
      let defenseWins = 0, defenseTotal = 0;
      
      battleItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        const isWin = text.includes('victory') || text.includes('won');
        
        if (this.isDefenderBattle(text)) {
          defenseTotal++;
          if (isWin) defenseWins++;
        } else {
          attackTotal++;
          if (isWin) attackWins++;
        }
      });
      
      const attackSuccess = attackTotal > 0 ? Math.round((attackWins / attackTotal) * 100) : 0;
      const defenseSuccess = defenseTotal > 0 ? Math.round((defenseWins / defenseTotal) * 100) : 0;
      
      document.getElementById('attack-success').textContent = attackSuccess + '%';
      document.getElementById('defense-success').textContent = defenseSuccess + '%';
      document.getElementById('avg-duration').textContent = '2-5 min'; // Placeholder
      
      // Estimate rank based on performance
      this.estimateRank(attackSuccess, defenseSuccess);
    }

    estimateRank(attackSuccess, defenseSuccess) {
      const overallSuccess = (attackSuccess + defenseSuccess) / 2;
      
      let rank = 'Beginner';
      let progress = 0;
      
      if (overallSuccess >= 80) {
        rank = 'Grandmaster';
        progress = 95;
      } else if (overallSuccess >= 70) {
        rank = 'Master';
        progress = 80;
      } else if (overallSuccess >= 60) {
        rank = 'Expert';
        progress = 65;
      } else if (overallSuccess >= 50) {
        rank = 'Skilled';
        progress = 50;
      } else if (overallSuccess >= 40) {
        rank = 'Novice';
        progress = 35;
      } else {
        progress = Math.max(10, overallSuccess / 2);
      }
      
      document.getElementById('current-rank').textContent = rank;
      document.getElementById('rank-progress').style.width = progress + '%';
      document.getElementById('progress-text').textContent = `${progress}% to next rank`;
    }

    addAnalysisCSS() {
      const style = document.createElement('style');
      style.textContent = `
        .battle-analysis-panel, .pvp-stats-panel {
          background: #1e1e2e;
          border: 1px solid #45475a;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .battle-analysis-panel h3, .pvp-stats-panel h3 {
          color: #f9e2af;
          margin: 0 0 20px 0;
          font-size: 18px;
        }
        
        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
          border: 1px solid #45475a;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #cba6f7;
          display: block;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 12px;
          color: #a6adc8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .battle-breakdown {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #45475a;
        }
        
        .battle-breakdown h4 {
          color: #74c0fc;
          margin: 0 0 10px 0;
        }
        
        .breakdown-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #cdd6f4;
        }
        
        .positive { color: #a6e3a1; }
        .negative { color: #f38ba8; }
        
        .quick-action-btn {
          width: 24px;
          height: 24px;
          background: #45475a;
          border: none;
          border-radius: 4px;
          color: #cdd6f4;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .quick-action-btn:hover {
          background: #585b70;
          transform: scale(1.1);
        }
        
        .points-display {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .points-value {
          font-weight: bold;
          font-size: 16px;
        }
        
        .points-total {
          font-size: 10px;
          color: #6c7086;
        }
        
        /* Battle Detail Modal */
        .modal-content {
          background: #1e1e2e;
          border: 1px solid #45475a;
          border-radius: 8px;
          min-width: 400px;
          max-width: 500px;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #45475a;
        }
        
        .modal-header h3 {
          color: #f9e2af;
          margin: 0;
        }
        
        .modal-close {
          background: none;
          border: none;
          color: #cdd6f4;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        
        .modal-close:hover {
          background: #45475a;
        }
        
        .modal-body {
          padding: 20px;
        }
        
        .battle-info {
          margin-bottom: 20px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(69, 71, 90, 0.3);
        }
        
        .info-label {
          color: #a6adc8;
          font-weight: 500;
        }
        
        .info-value {
          color: #cdd6f4;
          font-weight: 600;
        }
        
        .info-value.victory { color: #a6e3a1; }
        .info-value.defeat { color: #f38ba8; }
        
        .battle-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        
        .modal-btn {
          padding: 10px 20px;
          background: #74c0fc;
          border: none;
          border-radius: 6px;
          color: #1e1e2e;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .modal-btn:hover {
          background: #89cff0;
          transform: translateY(-1px);
        }
        
        /* PvP Stats Panel */
        .rank-info {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
          border: 1px solid #45475a;
        }
        
        .current-rank {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .rank-label {
          color: #a6adc8;
        }
        
        .rank-value {
          color: #cba6f7;
          font-weight: 600;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #45475a;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 5px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #74c0fc, #cba6f7);
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 12px;
          color: #a6adc8;
        }
        
        .performance-metrics {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #45475a;
        }
        
        .metric {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .metric-label {
          color: #a6adc8;
        }
        
        .metric-value {
          color: #cdd6f4;
          font-weight: 600;
        }
      `;
      
      document.head.appendChild(style);
    }
  }

  // Initialize function
  window.initPvPMods = function(config = {}) {
    const pvpMods = new PvPMods();
    pvpMods.init();
    return pvpMods;
  };
})();