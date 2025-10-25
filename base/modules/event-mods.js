// Event Page Features aus GonBruck
(function() {
  'use strict';

  class EventMods {
    constructor() {
      this.events = [];
      this.leaderboards = [];
    }

    init() {
      if (!window.location.pathname.includes('event.php')) return;
      
      console.log('🎪 Initializing Event Mods');
      
      this.extractEventData();
      this.createSideBySideLeaderboards();
      this.addEventTracking();
      this.enhanceEventDisplay();
      this.addEventNotifications();
    }

    extractEventData() {
      // Extract current events
      const eventElements = document.querySelectorAll('.event-item, .event-card, .current-event');
      
      eventElements.forEach(element => {
        const eventData = this.extractSingleEventData(element);
        this.events.push(eventData);
      });

      // Extract leaderboards
      const leaderboardElements = document.querySelectorAll('.leaderboard, .rankings, .top-players');
      
      leaderboardElements.forEach(element => {
        const leaderboardData = this.extractLeaderboardData(element);
        this.leaderboards.push(leaderboardData);
      });

      console.log(`Found ${this.events.length} events and ${this.leaderboards.length} leaderboards`);
    }

    extractSingleEventData(element) {
      const title = element.querySelector('.event-title, h3, h4')?.textContent.trim() || 'Unknown Event';
      const description = element.querySelector('.event-description, .description')?.textContent.trim() || '';
      const timeLeft = element.querySelector('.time-left, .remaining, .countdown')?.textContent.trim() || '';
      const reward = element.querySelector('.event-reward, .reward, .prize')?.textContent.trim() || '';
      const progress = element.querySelector('.event-progress, .progress')?.textContent.trim() || '';

      return {
        element,
        title,
        description,
        timeLeft,
        reward,
        progress
      };
    }

    extractLeaderboardData(element) {
      const title = element.querySelector('.leaderboard-title, h3, h4')?.textContent.trim() || 'Leaderboard';
      const entries = [];
      
      const entryElements = element.querySelectorAll('.leaderboard-entry, .ranking-item, .player-rank');
      entryElements.forEach((entry, index) => {
        const playerName = entry.querySelector('.player-name, .name')?.textContent.trim() || `Player ${index + 1}`;
        const score = entry.querySelector('.score, .points')?.textContent.trim() || '0';
        const rank = entry.querySelector('.rank, .position')?.textContent.trim() || (index + 1).toString();
        
        entries.push({ rank, playerName, score });
      });

      return {
        element,
        title,
        entries
      };
    }

    createSideBySideLeaderboards() {
      if (this.leaderboards.length < 2) return;

      const eventContainer = document.querySelector('.event-container, .events, .main-content');
      if (!eventContainer) return;

      const leaderboardContainer = document.createElement('div');
      leaderboardContainer.className = 'side-by-side-leaderboards';
      leaderboardContainer.innerHTML = `
        <div class="leaderboard-wrapper">
          <h3>📊 Event Leaderboards</h3>
          <div class="leaderboards-grid">
            ${this.generateLeaderboardHTML()}
          </div>
        </div>
      `;

      // Hide original leaderboards
      this.leaderboards.forEach(lb => {
        lb.element.style.display = 'none';
      });

      eventContainer.appendChild(leaderboardContainer);
      this.addLeaderboardCSS();
    }

    generateLeaderboardHTML() {
      return this.leaderboards.map(leaderboard => `
        <div class="enhanced-leaderboard">
          <div class="leaderboard-header">
            <h4>${leaderboard.title}</h4>
            <span class="entry-count">${leaderboard.entries.length} players</span>
          </div>
          
          <div class="leaderboard-entries">
            ${leaderboard.entries.slice(0, 10).map(entry => `
              <div class="leaderboard-entry rank-${entry.rank}">
                <div class="rank-badge">#${entry.rank}</div>
                <div class="player-info">
                  <span class="player-name">${entry.playerName}</span>
                  <span class="player-score">${this.formatScore(entry.score)}</span>
                </div>
                <div class="rank-medal">${this.getRankMedal(parseInt(entry.rank))}</div>
              </div>
            `).join('')}
          </div>
          
          ${leaderboard.entries.length > 10 ? `
            <div class="show-more">
              <button class="show-more-btn" data-leaderboard="${leaderboard.title}">
                Show ${leaderboard.entries.length - 10} more...
              </button>
            </div>
          ` : ''}
        </div>
      `).join('');
    }

    formatScore(score) {
      const numericScore = parseInt(score.replace(/[^\d]/g, ''));
      if (isNaN(numericScore)) return score;
      
      return numericScore.toLocaleString();
    }

    getRankMedal(rank) {
      switch (rank) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return rank <= 10 ? '🏆' : '';
      }
    }

    addEventTracking() {
      const trackingPanel = document.createElement('div');
      trackingPanel.className = 'event-tracking-panel';
      trackingPanel.innerHTML = `
        <div class="tracking-content">
          <h3>⏰ Event Tracker</h3>
          
          <div class="active-events">
            <h4>Active Events</h4>
            <div class="events-list">
              ${this.generateEventTrackingHTML()}
            </div>
          </div>
          
          <div class="event-notifications">
            <h4>🔔 Notifications</h4>
            <div class="notification-settings">
              <label class="notification-option">
                <input type="checkbox" id="notify-event-start" checked>
                <span>Notify when events start</span>
              </label>
              <label class="notification-option">
                <input type="checkbox" id="notify-event-end" checked>
                <span>Notify before events end</span>
              </label>
              <label class="notification-option">
                <input type="checkbox" id="notify-leaderboard-change">
                <span>Notify on leaderboard changes</span>
              </label>
            </div>
          </div>
          
          <div class="event-stats">
            <h4>📈 Your Stats</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Events Participated:</span>
                <span class="stat-value" id="events-participated">-</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Best Rank:</span>
                <span class="stat-value" id="best-rank">-</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total Rewards:</span>
                <span class="stat-value" id="total-rewards">-</span>
              </div>
            </div>
          </div>
        </div>
      `;

      const eventContainer = document.querySelector('.event-container, .events, .main-content');
      if (eventContainer) {
        eventContainer.appendChild(trackingPanel);
      }

      this.setupEventTracking();
    }

    generateEventTrackingHTML() {
      if (this.events.length === 0) {
        return '<div class="no-events">No active events found</div>';
      }

      return this.events.map(event => `
        <div class="tracked-event">
          <div class="event-header">
            <h5>${event.title}</h5>
            <span class="event-status ${this.getEventStatus(event.timeLeft)}">${event.timeLeft || 'Active'}</span>
          </div>
          
          <div class="event-details">
            ${event.description ? `<p class="event-desc">${event.description}</p>` : ''}
            ${event.reward ? `<div class="event-reward">🎁 ${event.reward}</div>` : ''}
            ${event.progress ? `<div class="event-progress">📊 ${event.progress}</div>` : ''}
          </div>
          
          <div class="event-actions">
            <button class="event-action-btn join-btn">Join Event</button>
            <button class="event-action-btn track-btn">Track Progress</button>
          </div>
        </div>
      `).join('');
    }

    getEventStatus(timeLeft) {
      if (!timeLeft) return 'active';
      
      const lowerTime = timeLeft.toLowerCase();
      if (lowerTime.includes('hour') || lowerTime.includes('minute')) {
        return 'ending-soon';
      }
      if (lowerTime.includes('day')) {
        return 'active';
      }
      if (lowerTime.includes('ended') || lowerTime.includes('finished')) {
        return 'ended';
      }
      
      return 'active';
    }

    setupEventTracking() {
      // Setup notification toggles
      document.querySelectorAll('.notification-option input').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          this.saveNotificationPreferences();
        });
      });

      // Setup event action buttons
      document.querySelectorAll('.join-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const eventElement = e.target.closest('.tracked-event');
          const eventTitle = eventElement.querySelector('h5').textContent;
          this.joinEvent(eventTitle);
        });
      });

      document.querySelectorAll('.track-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const eventElement = e.target.closest('.tracked-event');
          const eventTitle = eventElement.querySelector('h5').textContent;
          this.trackEventProgress(eventTitle);
        });
      });

      // Setup show more buttons for leaderboards
      document.querySelectorAll('.show-more-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const leaderboardTitle = e.target.dataset.leaderboard;
          this.showMoreLeaderboardEntries(leaderboardTitle);
        });
      });

      // Load stored stats
      this.loadEventStats();
    }

    saveNotificationPreferences() {
      const preferences = {
        eventStart: document.getElementById('notify-event-start')?.checked || false,
        eventEnd: document.getElementById('notify-event-end')?.checked || false,
        leaderboardChange: document.getElementById('notify-leaderboard-change')?.checked || false
      };

      localStorage.setItem('event-notification-preferences', JSON.stringify(preferences));
    }

    joinEvent(eventTitle) {
      window.GameEnhancement?.NotificationSystem?.info(`Joining event: ${eventTitle}...`);
      
      // Simulate event joining
      setTimeout(() => {
        window.GameEnhancement?.NotificationSystem?.success(`Successfully joined ${eventTitle}!`);
        this.updateEventStats('participated');
      }, 1500);
    }

    trackEventProgress(eventTitle) {
      window.GameEnhancement?.NotificationSystem?.info(`Tracking progress for: ${eventTitle}`);
      
      // This would open a detailed progress tracking modal
      this.showEventProgressModal(eventTitle);
    }

    showEventProgressModal(eventTitle) {
      const modal = document.createElement('div');
      modal.className = 'event-progress-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>📊 ${eventTitle} Progress</h3>
            <button class="modal-close">×</button>
          </div>
          
          <div class="modal-body">
            <div class="progress-overview">
              <div class="progress-stat">
                <span class="stat-label">Current Rank:</span>
                <span class="stat-value">Loading...</span>
              </div>
              <div class="progress-stat">
                <span class="stat-label">Points:</span>
                <span class="stat-value">Loading...</span>
              </div>
              <div class="progress-stat">
                <span class="stat-label">Time Remaining:</span>
                <span class="stat-value">Loading...</span>
              </div>
            </div>
            
            <div class="progress-chart">
              <h4>Progress Over Time</h4>
              <div class="chart-placeholder">
                📈 Progress chart would be displayed here
              </div>
            </div>
            
            <div class="progress-actions">
              <button class="modal-btn primary">View Full Leaderboard</button>
              <button class="modal-btn secondary">Set Rank Goal</button>
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

      modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });

      document.body.appendChild(modal);
    }

    showMoreLeaderboardEntries(leaderboardTitle) {
      const leaderboard = this.leaderboards.find(lb => lb.title === leaderboardTitle);
      if (!leaderboard) return;

      const entriesContainer = document.querySelector(`[data-leaderboard="${leaderboardTitle}"]`)
        ?.closest('.enhanced-leaderboard')
        ?.querySelector('.leaderboard-entries');

      if (entriesContainer) {
        const additionalEntries = leaderboard.entries.slice(10).map(entry => `
          <div class="leaderboard-entry rank-${entry.rank}">
            <div class="rank-badge">#${entry.rank}</div>
            <div class="player-info">
              <span class="player-name">${entry.playerName}</span>
              <span class="player-score">${this.formatScore(entry.score)}</span>
            </div>
            <div class="rank-medal">${this.getRankMedal(parseInt(entry.rank))}</div>
          </div>
        `).join('');

        entriesContainer.innerHTML += additionalEntries;
        
        // Hide the show more button
        const showMoreContainer = document.querySelector(`[data-leaderboard="${leaderboardTitle}"]`)
          ?.closest('.enhanced-leaderboard')
          ?.querySelector('.show-more');
        if (showMoreContainer) {
          showMoreContainer.style.display = 'none';
        }
      }
    }

    enhanceEventDisplay() {
      // Add countdown timers for events
      this.addCountdownTimers();
      
      // Add event type indicators
      this.addEventTypeIndicators();
      
      // Add participation status
      this.addParticipationStatus();
    }

    addCountdownTimers() {
      this.events.forEach(event => {
        if (event.timeLeft && event.element) {
          const timer = this.createCountdownTimer(event.timeLeft);
          
          const timerContainer = document.createElement('div');
          timerContainer.className = 'event-countdown';
          timerContainer.appendChild(timer);
          
          event.element.appendChild(timerContainer);
        }
      });
    }

    createCountdownTimer(timeLeft) {
      const timer = document.createElement('div');
      timer.className = 'countdown-timer';
      timer.innerHTML = `
        <div class="timer-label">Time Remaining:</div>
        <div class="timer-value">${timeLeft}</div>
      `;
      
      // Here you could add actual countdown functionality
      // For now, just display the static time
      
      return timer;
    }

    addEventTypeIndicators() {
      this.events.forEach(event => {
        const type = this.determineEventType(event);
        const indicator = document.createElement('div');
        indicator.className = `event-type-indicator ${type}`;
        indicator.textContent = this.getEventTypeLabel(type);
        
        event.element.appendChild(indicator);
      });
    }

    determineEventType(event) {
      const title = event.title.toLowerCase();
      const description = event.description.toLowerCase();
      
      if (title.includes('pvp') || title.includes('battle')) return 'pvp';
      if (title.includes('raid') || title.includes('boss')) return 'raid';
      if (title.includes('collect') || description.includes('gather')) return 'collection';
      if (title.includes('race') || title.includes('speed')) return 'race';
      
      return 'general';
    }

    getEventTypeLabel(type) {
      switch (type) {
        case 'pvp': return '⚔️ PvP';
        case 'raid': return '🐉 Raid';
        case 'collection': return '📦 Collection';
        case 'race': return '🏃 Race';
        default: return '🎯 Event';
      }
    }

    addParticipationStatus() {
      // Check if player is participating in events (simplified check)
      this.events.forEach(event => {
        const isParticipating = this.checkParticipationStatus(event);
        
        const status = document.createElement('div');
        status.className = `participation-status ${isParticipating ? 'participating' : 'not-participating'}`;
        status.innerHTML = `
          <span class="status-icon">${isParticipating ? '✅' : '❌'}</span>
          <span class="status-text">${isParticipating ? 'Participating' : 'Not Participating'}</span>
        `;
        
        event.element.appendChild(status);
      });
    }

    checkParticipationStatus(event) {
      // Simplified check - in real implementation, this would check actual participation
      return event.progress && event.progress !== '0' && event.progress !== '';
    }

    addEventNotifications() {
      // Load notification preferences
      const preferences = this.loadNotificationPreferences();
      
      // Setup notification checking
      if (preferences.eventEnd) {
        this.checkEndingSoonEvents();
      }
      
      if (preferences.leaderboardChange) {
        this.setupLeaderboardMonitoring();
      }
    }

    loadNotificationPreferences() {
      try {
        const saved = localStorage.getItem('event-notification-preferences');
        return saved ? JSON.parse(saved) : {
          eventStart: true,
          eventEnd: true,
          leaderboardChange: false
        };
      } catch (error) {
        return {
          eventStart: true,
          eventEnd: true,
          leaderboardChange: false
        };
      }
    }

    checkEndingSoonEvents() {
      this.events.forEach(event => {
        if (this.getEventStatus(event.timeLeft) === 'ending-soon') {
          this.showEventNotification(`⏰ ${event.title} ending soon!`, 'warning');
        }
      });
    }

    setupLeaderboardMonitoring() {
      // Check for leaderboard changes every 5 minutes
      setInterval(() => {
        this.checkLeaderboardChanges();
      }, 5 * 60 * 1000);
    }

    checkLeaderboardChanges() {
      // This would compare current leaderboards with stored previous state
      // For now, just a placeholder
      console.log('Checking for leaderboard changes...');
    }

    showEventNotification(message, type = 'info') {
      window.GameEnhancement?.NotificationSystem?.[type](message);
    }

    updateEventStats(action) {
      const stats = this.loadEventStats();
      
      switch (action) {
        case 'participated':
          stats.participated = (stats.participated || 0) + 1;
          break;
        case 'rank_achieved':
          // Would update best rank if better
          break;
        case 'reward_earned':
          stats.totalRewards = (stats.totalRewards || 0) + 1;
          break;
      }
      
      this.saveEventStats(stats);
      this.displayEventStats(stats);
    }

    loadEventStats() {
      try {
        const saved = localStorage.getItem('event-stats');
        return saved ? JSON.parse(saved) : {
          participated: 0,
          bestRank: null,
          totalRewards: 0
        };
      } catch (error) {
        return {
          participated: 0,
          bestRank: null,
          totalRewards: 0
        };
      }
    }

    saveEventStats(stats) {
      localStorage.setItem('event-stats', JSON.stringify(stats));
    }

    displayEventStats(stats) {
      document.getElementById('events-participated').textContent = stats.participated || 0;
      document.getElementById('best-rank').textContent = stats.bestRank || 'N/A';
      document.getElementById('total-rewards').textContent = stats.totalRewards || 0;
    }

    addLeaderboardCSS() {
      const style = document.createElement('style');
      style.textContent = `
        .side-by-side-leaderboards {
          background: #1e1e2e;
          border: 1px solid #45475a;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .leaderboard-wrapper h3 {
          color: #f9e2af;
          margin: 0 0 20px 0;
          font-size: 18px;
        }
        
        .leaderboards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .enhanced-leaderboard {
          background: #313244;
          border: 1px solid #45475a;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .leaderboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #1e1e2e;
          border-bottom: 1px solid #45475a;
        }
        
        .leaderboard-header h4 {
          color: #cba6f7;
          margin: 0;
          font-size: 16px;
        }
        
        .entry-count {
          color: #a6adc8;
          font-size: 12px;
        }
        
        .leaderboard-entries {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .leaderboard-entry {
          display: flex;
          align-items: center;
          padding: 12px 15px;
          border-bottom: 1px solid rgba(69, 71, 90, 0.3);
          transition: background 0.2s ease;
        }
        
        .leaderboard-entry:hover {
          background: rgba(203, 166, 247, 0.05);
        }
        
        .leaderboard-entry.rank-1 {
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), transparent);
        }
        
        .leaderboard-entry.rank-2 {
          background: linear-gradient(90deg, rgba(192, 192, 192, 0.1), transparent);
        }
        
        .leaderboard-entry.rank-3 {
          background: linear-gradient(90deg, rgba(205, 127, 50, 0.1), transparent);
        }
        
        .rank-badge {
          background: #45475a;
          color: #cdd6f4;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          min-width: 35px;
          text-align: center;
          margin-right: 12px;
        }
        
        .rank-1 .rank-badge {
          background: #f9e2af;
          color: #1e1e2e;
        }
        
        .rank-2 .rank-badge {
          background: #a6adc8;
          color: #1e1e2e;
        }
        
        .rank-3 .rank-badge {
          background: #fab387;
          color: #1e1e2e;
        }
        
        .player-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .player-name {
          color: #cdd6f4;
          font-weight: 500;
          font-size: 14px;
        }
        
        .player-score {
          color: #a6adc8;
          font-size: 12px;
        }
        
        .rank-medal {
          font-size: 18px;
          margin-left: 8px;
        }
        
        .show-more {
          padding: 10px 15px;
          text-align: center;
          border-top: 1px solid #45475a;
        }
        
        .show-more-btn {
          background: none;
          border: none;
          color: #74c0fc;
          cursor: pointer;
          font-size: 12px;
          text-decoration: underline;
        }
        
        .show-more-btn:hover {
          color: #89cff0;
        }
        
        /* Event Tracking Panel */
        .event-tracking-panel {
          background: #1e1e2e;
          border: 1px solid #45475a;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .event-tracking-panel h3, .event-tracking-panel h4 {
          color: #f9e2af;
          margin: 0 0 15px 0;
        }
        
        .event-tracking-panel h4 {
          color: #74c0fc;
          font-size: 16px;
        }
        
        .events-list {
          margin-bottom: 20px;
        }
        
        .tracked-event {
          background: #313244;
          border: 1px solid #45475a;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 12px;
        }
        
        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .event-header h5 {
          color: #cdd6f4;
          margin: 0;
          font-size: 15px;
        }
        
        .event-status {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .event-status.active {
          background: rgba(166, 227, 161, 0.2);
          color: #a6e3a1;
        }
        
        .event-status.ending-soon {
          background: rgba(249, 226, 175, 0.2);
          color: #f9e2af;
        }
        
        .event-status.ended {
          background: rgba(243, 139, 168, 0.2);
          color: #f38ba8;
        }
        
        .event-desc {
          color: #a6adc8;
          font-size: 13px;
          margin: 0 0 8px 0;
        }
        
        .event-reward, .event-progress {
          color: #cdd6f4;
          font-size: 12px;
          margin-bottom: 6px;
        }
        
        .event-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        
        .event-action-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .join-btn {
          background: #a6e3a1;
          color: #1e1e2e;
        }
        
        .join-btn:hover {
          background: #94e2d5;
        }
        
        .track-btn {
          background: #74c0fc;
          color: #1e1e2e;
        }
        
        .track-btn:hover {
          background: #89cff0;
        }
        
        .notification-settings {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #45475a;
          margin-bottom: 20px;
        }
        
        .notification-option {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #cdd6f4;
          cursor: pointer;
        }
        
        .notification-option input[type="checkbox"] {
          accent-color: #cba6f7;
        }
        
        .event-stats {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #45475a;
        }
        
        .stats-grid {
          display: grid;
          gap: 8px;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          color: #cdd6f4;
          font-size: 13px;
        }
        
        .stat-label {
          color: #a6adc8;
        }
        
        .stat-value {
          font-weight: 600;
        }
        
        .no-events {
          color: #6c7086;
          text-align: center;
          padding: 20px;
          font-style: italic;
        }
        
        /* Event Enhancements */
        .event-countdown {
          background: rgba(116, 192, 252, 0.1);
          border: 1px solid rgba(116, 192, 252, 0.3);
          border-radius: 4px;
          padding: 8px;
          margin-top: 10px;
        }
        
        .timer-label {
          color: #74c0fc;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .timer-value {
          color: #cdd6f4;
          font-size: 14px;
          font-weight: 600;
        }
        
        .event-type-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          z-index: 10;
        }
        
        .event-type-indicator.pvp {
          background: rgba(243, 139, 168, 0.2);
          color: #f38ba8;
        }
        
        .event-type-indicator.raid {
          background: rgba(203, 166, 247, 0.2);
          color: #cba6f7;
        }
        
        .event-type-indicator.collection {
          background: rgba(166, 227, 161, 0.2);
          color: #a6e3a1;
        }
        
        .event-type-indicator.race {
          background: rgba(249, 226, 175, 0.2);
          color: #f9e2af;
        }
        
        .event-type-indicator.general {
          background: rgba(116, 192, 252, 0.2);
          color: #74c0fc;
        }
        
        .participation-status {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 12px;
        }
        
        .participation-status.participating {
          color: #a6e3a1;
        }
        
        .participation-status.not-participating {
          color: #f38ba8;
        }
        
        /* Event Progress Modal */
        .event-progress-modal .modal-content {
          background: #1e1e2e;
          border: 1px solid #45475a;
          border-radius: 8px;
          min-width: 500px;
          max-width: 600px;
        }
        
        .event-progress-modal .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #45475a;
        }
        
        .event-progress-modal .modal-header h3 {
          color: #f9e2af;
          margin: 0;
        }
        
        .event-progress-modal .modal-close {
          background: none;
          border: none;
          color: #cdd6f4;
          font-size: 24px;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        
        .event-progress-modal .modal-close:hover {
          background: #45475a;
        }
        
        .event-progress-modal .modal-body {
          padding: 20px;
        }
        
        .progress-overview {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .progress-stat {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
        }
        
        .progress-chart {
          background: #313244;
          padding: 20px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .progress-chart h4 {
          color: #74c0fc;
          margin: 0 0 15px 0;
        }
        
        .chart-placeholder {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1e1e2e;
          border-radius: 4px;
          color: #6c7086;
          font-style: italic;
        }
        
        .progress-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        
        .modal-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .modal-btn.primary {
          background: #74c0fc;
          color: #1e1e2e;
        }
        
        .modal-btn.primary:hover {
          background: #89cff0;
        }
        
        .modal-btn.secondary {
          background: #45475a;
          color: #cdd6f4;
        }
        
        .modal-btn.secondary:hover {
          background: #585b70;
        }
      `;
      
      document.head.appendChild(style);
    }
  }

  // Initialize function
  window.initEventMods = function(config = {}) {
    const eventMods = new EventMods();
    eventMods.init();
    return eventMods;
  };
})();