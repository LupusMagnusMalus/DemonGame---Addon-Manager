// PvP Rank-based Navigation by Lupus
(function() {
  'use strict';

  class RankDetection {
    constructor() {
      this.currentRank = null;
      this.rankThresholds = {
        'Beginner': { min: 1, max: 100 },
        'Novice': { min: 101, max: 500 },
        'Warrior': { min: 501, max: 1000 },
        'Expert': { min: 1001, max: 2000 },
        'Master': { min: 2001, max: 5000 },
        'Grandmaster': { min: 5001, max: 10000 }
      };
    }

    init() {
      console.log('🏆 Initializing Rank Detection');
      
      this.detectPlayerRank();
      this.updatePvPLinks();
      this.setupRankObserver();
    }

    detectPlayerRank() {
      // Try to find rank information in various places
      const rankSources = [
        () => this.getRankFromTopbar(),
        () => this.getRankFromProfile(),
        () => this.getRankFromPvPPage(),
        () => this.getRankFromLocalStorage()
      ];

      for (const source of rankSources) {
        const rank = source();
        if (rank) {
          this.currentRank = rank;
          console.log(`🏆 Detected player rank: ${rank.name} (${rank.points} points)`);
          break;
        }
      }

      if (!this.currentRank) {
        console.log('🏆 Could not detect player rank, using default');
        this.currentRank = { name: 'Beginner', points: 50 };
      }

      // Save to localStorage for future use
      localStorage.setItem('playerRank', JSON.stringify(this.currentRank));
    }

    getRankFromTopbar() {
      const topbar = document.querySelector('.game-topbar, .topbar');
      if (!topbar) return null;

      // Look for rank indicators
      const rankPattern = /Rank:\s*(\w+)|(\w+)\s*Rank|(\d+)\s*RP/i;
      const match = topbar.textContent.match(rankPattern);
      
      if (match) {
        const rankName = match[1] || match[2];
        const points = match[3] ? parseInt(match[3]) : this.estimatePointsFromRank(rankName);
        
        return {
          name: rankName || this.getRankNameFromPoints(points),
          points: points || 100
        };
      }

      return null;
    }

    getRankFromProfile() {
      // Check if we're on a profile page
      const profileRank = document.querySelector('.profile-rank, .player-rank');
      if (!profileRank) return null;

      const rankText = profileRank.textContent;
      const pointsMatch = rankText.match(/(\d+)/);
      const nameMatch = rankText.match(/(\w+)\s*Rank/i);

      if (pointsMatch || nameMatch) {
        const points = pointsMatch ? parseInt(pointsMatch[1]) : 100;
        const name = nameMatch ? nameMatch[1] : this.getRankNameFromPoints(points);
        
        return { name, points };
      }

      return null;
    }

    getRankFromPvPPage() {
      // Check if we're on PvP page and can extract rank
      if (!window.location.pathname.includes('pvp.php')) return null;

      const rankElements = document.querySelectorAll('.rank, .player-info');
      for (const element of rankElements) {
        const text = element.textContent;
        const match = text.match(/(\d+)\s*points?|Rank:\s*(\w+)/i);
        
        if (match) {
          const points = match[1] ? parseInt(match[1]) : 100;
          const name = match[2] || this.getRankNameFromPoints(points);
          return { name, points };
        }
      }

      return null;
    }

    getRankFromLocalStorage() {
      const saved = localStorage.getItem('playerRank');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved rank data');
        }
      }
      return null;
    }

    getRankNameFromPoints(points) {
      for (const [name, threshold] of Object.entries(this.rankThresholds)) {
        if (points >= threshold.min && points <= threshold.max) {
          return name;
        }
      }
      return points > 10000 ? 'Grandmaster' : 'Beginner';
    }

    estimatePointsFromRank(rankName) {
      const threshold = this.rankThresholds[rankName];
      return threshold ? Math.floor((threshold.min + threshold.max) / 2) : 100;
    }

    updatePvPLinks() {
      const pvpLinks = document.querySelectorAll('a[href*="pvp.php"]');
      
      pvpLinks.forEach(link => {
        const baseUrl = 'pvp.php';
        let targetUrl = baseUrl;

        // Determine appropriate PvP section based on rank
        if (this.currentRank.points < 500) {
          targetUrl = `${baseUrl}?section=beginner`;
        } else if (this.currentRank.points < 2000) {
          targetUrl = `${baseUrl}?section=intermediate`;
        } else {
          targetUrl = `${baseUrl}?section=advanced`;
        }

        // Update the link
        link.href = targetUrl;
        
        // Add rank indicator to link text
        if (!link.textContent.includes(this.currentRank.name)) {
          const originalText = link.textContent;
          link.innerHTML = `
            ${link.innerHTML}
            <span class="rank-indicator" style="
              font-size: 11px; 
              color: #f9e2af; 
              margin-left: 5px;
            ">(${this.currentRank.name})</span>
          `;
        }
      });
    }

    setupRankObserver() {
      // Watch for rank changes during gameplay
      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const target = mutation.target;
            if (target.textContent && target.textContent.match(/rank|points/i)) {
              shouldUpdate = true;
            }
          }
        });

        if (shouldUpdate) {
          // Debounced rank detection
          clearTimeout(this.rankUpdateTimeout);
          this.rankUpdateTimeout = setTimeout(() => {
            this.detectPlayerRank();
            this.updatePvPLinks();
          }, 1000);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });

      this.observer = observer;
    }

    // Level-based rank estimation (backup method)
    estimateRankFromLevel(level) {
      if (level < 10) return { name: 'Beginner', points: level * 10 };
      if (level < 25) return { name: 'Novice', points: 100 + (level - 10) * 25 };
      if (level < 50) return { name: 'Warrior', points: 500 + (level - 25) * 20 };
      if (level < 75) return { name: 'Expert', points: 1000 + (level - 50) * 40 };
      if (level < 100) return { name: 'Master', points: 2000 + (level - 75) * 120 };
      return { name: 'Grandmaster', points: 5000 + (level - 100) * 50 };
    }

    getCurrentRank() {
      return this.currentRank;
    }

    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      }
      if (this.rankUpdateTimeout) {
        clearTimeout(this.rankUpdateTimeout);
      }
    }
  }

  // Initialize function
  window.initRankDetection = function(config = {}) {
    const rankDetection = new RankDetection();
    rankDetection.init();
    return rankDetection;
  };
})();