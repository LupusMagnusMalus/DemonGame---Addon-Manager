// Pet Page Features aus GonBruck
(function() {
  'use strict';

  class PetsMods {
    constructor() {
      this.totalPetDamage = 0;
      this.totalFoodRequired = 0;
      this.pets = [];
    }

    init() {
      if (!window.location.pathname.includes('pets.php')) return;
      
      console.log('🐾 Initializing Pets Mods');
      
      this.extractPetData();
      this.addTotalDamageDisplay();
      this.addFoodCalculations();
      this.addPetFiltering();
      this.enhancePetDisplay();
      this.addPetManagement();
    }

    extractPetData() {
      const petElements = document.querySelectorAll('.pet-item, .pet-card, .pet');
      
      petElements.forEach(pet => {
        const petData = this.extractSinglePetData(pet);
        this.pets.push(petData);
        this.totalPetDamage += petData.damage;
        this.totalFoodRequired += petData.foodCost;
      });
      
      console.log(`Extracted ${this.pets.length} pets, Total damage: ${this.totalPetDamage}`);
    }

    extractSinglePetData(petElement) {
      const name = petElement.querySelector('.pet-name, h3, h4')?.textContent.trim() || 'Unknown Pet';
      const level = parseInt(petElement.querySelector('.pet-level, .level')?.textContent.match(/\d+/)?.[0]) || 1;
      
      // Extract damage
      const damageText = petElement.querySelector('.pet-damage, .damage, .attack')?.textContent || '';
      const damage = parseInt(damageText.match(/\d+/)?.[0]) || 0;
      
      // Extract food cost
      const foodText = petElement.querySelector('.pet-food, .food-cost, .upkeep')?.textContent || '';
      const foodCost = parseInt(foodText.match(/\d+/)?.[0]) || 0;
      
      // Extract pet type
      const type = petElement.querySelector('.pet-type, .type')?.textContent.trim() || 'Unknown';
      
      return {
        element: petElement,
        name,
        level,
        damage,
        foodCost,
        type
      };
    }

    addTotalDamageDisplay() {
      const petContainer = document.querySelector('.pets-container, .pet-list');
      if (!petContainer) return;

      const summaryPanel = document.createElement('div');
      summaryPanel.className = 'pet-summary-panel';
      summaryPanel.innerHTML = `
        <div class="summary-content">
          <h3>🐾 Pet Summary</h3>
          
          <div class="summary-stats">
            <div class="summary-stat">
              <div class="stat-icon">🔢</div>
              <div class="stat-info">
                <span class="stat-value">${this.pets.length}</span>
                <span class="stat-label">Total Pets</span>
              </div>
            </div>
            
            <div class="summary-stat">
              <div class="stat-icon">⚔️</div>
              <div class="stat-info">
                <span class="stat-value">${this.totalPetDamage.toLocaleString()}</span>
                <span class="stat-label">Total Damage</span>
              </div>
            </div>
            
            <div class="summary-stat">
              <div class="stat-icon">🍖</div>
              <div class="stat-info">
                <span class="stat-value">${this.totalFoodRequired.toLocaleString()}</span>
                <span class="stat-label">Food/Day</span>
              </div>
            </div>
            
            <div class="summary-stat">
              <div class="stat-icon">📊</div>
              <div class="stat-info">
                <span class="stat-value">${this.calculateAverageDamage()}</span>
                <span class="stat-label">Avg Damage</span>
              </div>
            </div>
          </div>
          
          <div class="efficiency-metrics">
            <div class="efficiency-item">
              <span class="efficiency-label">Damage per Food:</span>
              <span class="efficiency-value">${this.calculateDamagePerFood()}</span>
            </div>
            <div class="efficiency-item">
              <span class="efficiency-label">Most Efficient Pet:</span>
              <span class="efficiency-value">${this.getMostEfficientPet()}</span>
            </div>
            <div class="efficiency-item">
              <span class="efficiency-label">Daily Food Cost:</span>
              <span class="efficiency-value">${this.totalFoodRequired.toLocaleString()} gold</span>
            </div>
          </div>
        </div>
      `;
      
      petContainer.parentNode.insertBefore(summaryPanel, petContainer);
      this.addSummaryCSS();
    }

    calculateAverageDamage() {
      if (this.pets.length === 0) return 0;
      return Math.round(this.totalPetDamage / this.pets.length);
    }

    calculateDamagePerFood() {
      if (this.totalFoodRequired === 0) return 'N/A';
      return (this.totalPetDamage / this.totalFoodRequired).toFixed(2);
    }

    getMostEfficientPet() {
      if (this.pets.length === 0) return 'None';
      
      let mostEfficient = this.pets[0];
      let bestRatio = 0;
      
      this.pets.forEach(pet => {
        if (pet.foodCost > 0) {
          const ratio = pet.damage / pet.foodCost;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            mostEfficient = pet;
          }
        }
      });
      
      return mostEfficient.name;
    }

    addFoodCalculations() {
      const calculatorPanel = document.createElement('div');
      calculatorPanel.className = 'food-calculator-panel';
      calculatorPanel.innerHTML = `
        <div class="calculator-content">
          <h3>🍖 Food Calculator</h3>
          
          <div class="calculator-grid">
            <div class="calc-section">
              <h4>Daily Requirements</h4>
              <div class="calc-row">
                <span>Food needed per day:</span>
                <span class="calc-value">${this.totalFoodRequired.toLocaleString()}</span>
              </div>
              <div class="calc-row">
                <span>Estimated cost (10g each):</span>
                <span class="calc-value">${(this.totalFoodRequired * 10).toLocaleString()} gold</span>
              </div>
            </div>
            
            <div class="calc-section">
              <h4>Time Periods</h4>
              <div class="calc-row">
                <span>Weekly cost:</span>
                <span class="calc-value">${(this.totalFoodRequired * 70).toLocaleString()} gold</span>
              </div>
              <div class="calc-row">
                <span>Monthly cost:</span>
                <span class="calc-value">${(this.totalFoodRequired * 300).toLocaleString()} gold</span>
              </div>
            </div>
            
            <div class="calc-section">
              <h4>Optimization</h4>
              <div class="calc-row">
                <span>Food efficiency:</span>
                <span class="calc-value">${this.calculateFoodEfficiency()}</span>
              </div>
              <div class="calc-row">
                <span>Recommended action:</span>
                <span class="calc-value">${this.getRecommendation()}</span>
              </div>
            </div>
          </div>
          
          <div class="food-planning">
            <h4>📅 Food Planning</h4>
            <div class="planning-controls">
              <label>Days to plan for:</label>
              <input type="number" id="planning-days" value="7" min="1" max="30">
              <button id="calculate-food" class="calc-btn">Calculate</button>
            </div>
            <div class="planning-result" id="planning-result">
              Select days and click calculate
            </div>
          </div>
        </div>
      `;
      
      const petContainer = document.querySelector('.pets-container, .pet-list');
      if (petContainer) {
        petContainer.parentNode.appendChild(calculatorPanel);
      }
      
      this.setupFoodCalculator();
    }

    calculateFoodEfficiency() {
      if (this.totalFoodRequired === 0) return 'Perfect (0 food)';
      if (this.totalPetDamage === 0) return 'Poor (0 damage)';
      
      const ratio = this.totalPetDamage / this.totalFoodRequired;
      
      if (ratio > 50) return 'Excellent';
      if (ratio > 25) return 'Good';
      if (ratio > 10) return 'Average';
      if (ratio > 5) return 'Poor';
      return 'Very Poor';
    }

    getRecommendation() {
      const ratio = this.totalFoodRequired > 0 ? this.totalPetDamage / this.totalFoodRequired : 0;
      
      if (ratio > 50) return 'Keep current pets';
      if (ratio > 25) return 'Consider upgrading';
      if (ratio > 10) return 'Focus on efficiency';
      return 'Review pet selection';
    }

    setupFoodCalculator() {
      const calculateBtn = document.getElementById('calculate-food');
      const planningDays = document.getElementById('planning-days');
      const planningResult = document.getElementById('planning-result');
      
      calculateBtn?.addEventListener('click', () => {
        const days = parseInt(planningDays.value) || 7;
        const totalFood = this.totalFoodRequired * days;
        const totalCost = totalFood * 10; // Assuming 10 gold per food
        
        planningResult.innerHTML = `
          <div class="result-summary">
            <strong>For ${days} days:</strong><br>
            Food needed: ${totalFood.toLocaleString()}<br>
            Estimated cost: ${totalCost.toLocaleString()} gold<br>
            Average per day: ${this.totalFoodRequired.toLocaleString()} food
          </div>
        `;
      });
    }

    addPetFiltering() {
      const petContainer = document.querySelector('.pets-container, .pet-list');
      if (!petContainer) return;

      const filterPanel = document.createElement('div');
      filterPanel.className = 'pet-filter-panel';
      filterPanel.innerHTML = `
        <div class="filter-controls">
          <div class="filter-group">
            <label>Filter by Type:</label>
            <select id="pet-type-filter">
              <option value="all">All Types</option>
              ${this.getUniqueTypes().map(type => `<option value="${type}">${type}</option>`).join('')}
            </select>
          </div>
          
          <div class="filter-group">
            <label>Sort by:</label>
            <select id="pet-sort">
              <option value="name">Name</option>
              <option value="damage">Damage</option>
              <option value="level">Level</option>
              <option value="efficiency">Efficiency</option>
              <option value="food-cost">Food Cost</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>View:</label>
            <button id="pet-list-view" class="view-btn active">📋 List</button>
            <button id="pet-grid-view" class="view-btn">⚏ Grid</button>
          </div>
        </div>
      `;
      
      petContainer.parentNode.insertBefore(filterPanel, petContainer);
      this.setupPetFiltering();
    }

    getUniqueTypes() {
      const types = [...new Set(this.pets.map(pet => pet.type))];
      return types.filter(type => type !== 'Unknown');
    }

    setupPetFiltering() {
      const typeFilter = document.getElementById('pet-type-filter');
      const sortSelect = document.getElementById('pet-sort');
      const listViewBtn = document.getElementById('pet-list-view');
      const gridViewBtn = document.getElementById('pet-grid-view');
      
      typeFilter?.addEventListener('change', () => this.applyFilters());
      sortSelect?.addEventListener('change', () => this.applySorting());
      
      listViewBtn?.addEventListener('click', () => this.switchView('list'));
      gridViewBtn?.addEventListener('click', () => this.switchView('grid'));
    }

    applyFilters() {
      const selectedType = document.getElementById('pet-type-filter')?.value;
      
      this.pets.forEach(pet => {
        const shouldShow = selectedType === 'all' || pet.type === selectedType;
        pet.element.style.display = shouldShow ? '' : 'none';
      });
    }

    applySorting() {
      const sortBy = document.getElementById('pet-sort')?.value;
      const container = document.querySelector('.pets-container, .pet-list');
      
      if (!container) return;
      
      const sortedPets = [...this.pets].sort((a, b) => {
        switch (sortBy) {
          case 'damage':
            return b.damage - a.damage;
          case 'level':
            return b.level - a.level;
          case 'efficiency':
            const effA = a.foodCost > 0 ? a.damage / a.foodCost : 0;
            const effB = b.foodCost > 0 ? b.damage / b.foodCost : 0;
            return effB - effA;
          case 'food-cost':
            return a.foodCost - b.foodCost;
          case 'name':
          default:
            return a.name.localeCompare(b.name);
        }
      });
      
      sortedPets.forEach(pet => {
        container.appendChild(pet.element);
      });
    }

    switchView(viewType) {
      const container = document.querySelector('.pets-container, .pet-list');
      const listBtn = document.getElementById('pet-list-view');
      const gridBtn = document.getElementById('pet-grid-view');
      
      listBtn?.classList.toggle('active', viewType === 'list');
      gridBtn?.classList.toggle('active', viewType === 'grid');
      
      container?.classList.toggle('grid-view', viewType === 'grid');
      container?.classList.toggle('list-view', viewType === 'list');
    }

    enhancePetDisplay() {
      this.pets.forEach(pet => {
        this.addPetEnhancements(pet);
      });
    }

    addPetEnhancements(pet) {
      // Add efficiency indicator
      const efficiency = pet.foodCost > 0 ? pet.damage / pet.foodCost : 0;
      const efficiencyIndicator = document.createElement('div');
      efficiencyIndicator.className = 'pet-efficiency';
      efficiencyIndicator.innerHTML = `
        <span class="efficiency-label">Efficiency:</span>
        <span class="efficiency-value ${this.getEfficiencyClass(efficiency)}">${efficiency.toFixed(2)}</span>
      `;
      
      pet.element.appendChild(efficiencyIndicator);
      
      // Add quick actions
      this.addPetActions(pet);
      
      // Add level progress bar if applicable
      this.addLevelProgress(pet);
    }

    getEfficiencyClass(efficiency) {
      if (efficiency > 50) return 'excellent';
      if (efficiency > 25) return 'good';
      if (efficiency > 10) return 'average';
      return 'poor';
    }

    addPetActions(pet) {
      const actions = document.createElement('div');
      actions.className = 'pet-actions';
      actions.innerHTML = `
        <button class="pet-action-btn feed-btn" title="Feed Pet">🍖</button>
        <button class="pet-action-btn train-btn" title="Train Pet">💪</button>
        <button class="pet-action-btn info-btn" title="Pet Info">ℹ️</button>
      `;
      
      pet.element.appendChild(actions);
      
      // Setup action listeners
      actions.querySelector('.feed-btn')?.addEventListener('click', () => this.feedPet(pet));
      actions.querySelector('.train-btn')?.addEventListener('click', () => this.trainPet(pet));
      actions.querySelector('.info-btn')?.addEventListener('click', () => this.showPetInfo(pet));
    }

    addLevelProgress(pet) {
      // Add a progress bar showing progress to next level
      const progressContainer = document.createElement('div');
      progressContainer.className = 'pet-level-progress';
      
      const currentXP = pet.level * 100; // Simplified XP calculation
      const nextLevelXP = (pet.level + 1) * 100;
      const progress = 75; // Simulated progress percentage
      
      progressContainer.innerHTML = `
        <div class="level-info">
          <span>Level ${pet.level}</span>
          <span>${progress}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      `;
      
      pet.element.appendChild(progressContainer);
    }

    feedPet(pet) {
      window.GameEnhancement?.NotificationSystem?.info(`Feeding ${pet.name}...`);
      
      // Simulate feeding
      setTimeout(() => {
        window.GameEnhancement?.NotificationSystem?.success(`${pet.name} has been fed!`);
      }, 1000);
    }

    trainPet(pet) {
      window.GameEnhancement?.NotificationSystem?.info(`Training ${pet.name}...`);
      
      // Simulate training
      setTimeout(() => {
        window.GameEnhancement?.NotificationSystem?.success(`${pet.name} training completed!`);
      }, 1500);
    }

    showPetInfo(pet) {
      const modal = this.createPetInfoModal(pet);
      document.body.appendChild(modal);
    }

    createPetInfoModal(pet) {
      const efficiency = pet.foodCost > 0 ? (pet.damage / pet.foodCost).toFixed(2) : 'N/A';
      
      const modal = document.createElement('div');
      modal.className = 'pet-info-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>🐾 ${pet.name}</h3>
            <button class="modal-close">×</button>
          </div>
          
          <div class="modal-body">
            <div class="pet-details">
              <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${pet.type}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Level:</span>
                <span class="detail-value">${pet.level}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Damage:</span>
                <span class="detail-value">${pet.damage.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Food Cost:</span>
                <span class="detail-value">${pet.foodCost.toLocaleString()}/day</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Efficiency:</span>
                <span class="detail-value ${this.getEfficiencyClass(parseFloat(efficiency))}">${efficiency}</span>
              </div>
            </div>
            
            <div class="pet-stats">
              <h4>Statistics</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">Daily Cost:</span>
                  <span class="stat-value">${(pet.foodCost * 10).toLocaleString()} gold</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Weekly Cost:</span>
                  <span class="stat-value">${(pet.foodCost * 70).toLocaleString()} gold</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Damage Contribution:</span>
                  <span class="stat-value">${((pet.damage / this.totalPetDamage) * 100).toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Food Contribution:</span>
                  <span class="stat-value">${((pet.foodCost / this.totalFoodRequired) * 100).toFixed(1)}%</span>
                </div>
              </div>
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
      
      return modal;
    }

    addPetManagement() {
      const managementPanel = document.createElement('div');
      managementPanel.className = 'pet-management-panel';
      managementPanel.innerHTML = `
        <div class="management-content">
          <h3>🎯 Pet Management</h3>
          
          <div class="management-actions">
            <button class="management-btn" id="feed-all-pets">🍖 Feed All Pets</button>
            <button class="management-btn" id="optimize-pets">⚡ Optimize Setup</button>
            <button class="management-btn" id="pet-report">📊 Generate Report</button>
            <button class="management-btn" id="export-pets">📤 Export Data</button>
          </div>
          
          <div class="management-tips">
            <h4>💡 Tips</h4>
            <ul>
              <li>Focus on pets with efficiency > 25 for best value</li>
              <li>Higher level pets generally have better efficiency</li>
              <li>Consider daily food costs when acquiring new pets</li>
              <li>Train pets regularly to improve their stats</li>
            </ul>
          </div>
        </div>
      `;
      
      const petContainer = document.querySelector('.pets-container, .pet-list');
      if (petContainer) {
        petContainer.parentNode.appendChild(managementPanel);
      }
      
      this.setupManagementActions();
    }

    setupManagementActions() {
      document.getElementById('feed-all-pets')?.addEventListener('click', () => {
        window.GameEnhancement?.NotificationSystem?.info('Feeding all pets...');
        setTimeout(() => {
          window.GameEnhancement?.NotificationSystem?.success('All pets have been fed!');
        }, 2000);
      });

      document.getElementById('optimize-pets')?.addEventListener('click', () => {
        this.optimizePetSetup();
      });

      document.getElementById('pet-report')?.addEventListener('click', () => {
        this.generatePetReport();
      });

      document.getElementById('export-pets')?.addEventListener('click', () => {
        this.exportPetData();
      });
    }

    optimizePetSetup() {
      const recommendations = [];
      
      this.pets.forEach(pet => {
        const efficiency = pet.foodCost > 0 ? pet.damage / pet.foodCost : 0;
        
        if (efficiency < 10) {
          recommendations.push(`Consider replacing ${pet.name} (low efficiency: ${efficiency.toFixed(2)})`);
        } else if (efficiency > 50) {
          recommendations.push(`Keep ${pet.name} (excellent efficiency: ${efficiency.toFixed(2)})`);
        }
      });

      if (recommendations.length === 0) {
        recommendations.push('Your pet setup is well optimized!');
      }

      const message = recommendations.slice(0, 3).join('\n');
      window.GameEnhancement?.NotificationSystem?.info(`Optimization tips:\n${message}`);
    }

    generatePetReport() {
      const report = {
        totalPets: this.pets.length,
        totalDamage: this.totalPetDamage,
        totalFoodCost: this.totalFoodRequired,
        efficiency: this.calculateDamagePerFood(),
        mostEfficientPet: this.getMostEfficientPet(),
        recommendations: this.getOptimizationRecommendations()
      };

      console.log('Pet Report:', report);
      window.GameEnhancement?.NotificationSystem?.success('Pet report generated! Check console for details.');
    }

    getOptimizationRecommendations() {
      const recommendations = [];
      
      if (this.totalPetDamage < 1000) {
        recommendations.push('Consider acquiring stronger pets to increase total damage');
      }
      
      if (this.totalFoodRequired > this.totalPetDamage * 0.1) {
        recommendations.push('Food costs are high relative to damage output');
      }
      
      if (this.pets.length < 5) {
        recommendations.push('You could benefit from having more pets');
      }
      
      return recommendations;
    }

    exportPetData() {
      const dataStr = JSON.stringify(this.pets.map(pet => ({
        name: pet.name,
        type: pet.type,
        level: pet.level,
        damage: pet.damage,
        foodCost: pet.foodCost,
        efficiency: pet.foodCost > 0 ? (pet.damage / pet.foodCost).toFixed(2) : 'N/A'
      })), null, 2);
      
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `pet-data-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      window.GameEnhancement?.NotificationSystem?.success('Pet data exported!');
    }

    addSummaryCSS() {
      const style = document.createElement('style');
      style.textContent = `
        .pet-summary-panel, .food-calculator-panel, .pet-filter-panel, .pet-management-panel {
          background: #1e1e2e;
          border: 1px solid #45475a;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .pet-summary-panel h3, .food-calculator-panel h3, .pet-management-panel h3 {
          color: #f9e2af;
          margin: 0 0 20px 0;
          font-size: 18px;
        }
        
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .summary-stat {
          display: flex;
          align-items: center;
          padding: 15px;
          background: #313244;
          border: 1px solid #45475a;
          border-radius: 6px;
          gap: 12px;
        }
        
        .stat-icon {
          font-size: 24px;
          width: 40px;
          text-align: center;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #cba6f7;
          display: block;
        }
        
        .stat-label {
          font-size: 12px;
          color: #a6adc8;
          text-transform: uppercase;
        }
        
        .efficiency-metrics {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #45475a;
        }
        
        .efficiency-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #cdd6f4;
        }
        
        .efficiency-label {
          color: #a6adc8;
        }
        
        .efficiency-value {
          font-weight: 600;
        }
        
        /* Calculator Styles */
        .calculator-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .calc-section {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #45475a;
        }
        
        .calc-section h4 {
          color: #74c0fc;
          margin: 0 0 10px 0;
          font-size: 14px;
        }
        
        .calc-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #cdd6f4;
          font-size: 13px;
        }
        
        .calc-value {
          font-weight: 600;
          color: #f9e2af;
        }
        
        .food-planning {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #45475a;
        }
        
        .food-planning h4 {
          color: #a6e3a1;
          margin: 0 0 10px 0;
        }
        
        .planning-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .planning-controls label {
          color: #cdd6f4;
          font-size: 13px;
        }
        
        .planning-controls input {
          width: 60px;
          padding: 4px 8px;
          background: #1e1e2e;
          border: 1px solid #45475a;
          border-radius: 4px;
          color: #cdd6f4;
        }
        
        .calc-btn {
          padding: 6px 12px;
          background: #a6e3a1;
          border: none;
          border-radius: 4px;
          color: #1e1e2e;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .calc-btn:hover {
          background: #94e2d5;
          transform: translateY(-1px);
        }
        
        .planning-result {
          background: #1e1e2e;
          padding: 10px;
          border-radius: 4px;
          color: #cdd6f4;
          font-size: 13px;
        }
        
        /* Filter Styles */
        .filter-controls {
          display: flex;
          gap: 20px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .filter-group label {
          color: #a6adc8;
          font-size: 13px;
          white-space: nowrap;
        }
        
        .filter-group select {
          padding: 6px 10px;
          background: #313244;
          border: 1px solid #45475a;
          border-radius: 4px;
          color: #cdd6f4;
        }
        
        .view-btn {
          padding: 6px 12px;
          background: #45475a;
          border: 1px solid #6c7086;
          border-radius: 4px;
          color: #cdd6f4;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .view-btn.active {
          background: #cba6f7;
          color: #1e1e2e;
          border-color: #cba6f7;
        }
        
        /* Pet Enhancement Styles */
        .pet-efficiency {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          padding: 6px 10px;
          background: rgba(69, 71, 90, 0.3);
          border-radius: 4px;
          font-size: 12px;
        }
        
        .efficiency-value.excellent { color: #a6e3a1; }
        .efficiency-value.good { color: #f9e2af; }
        .efficiency-value.average { color: #fab387; }
        .efficiency-value.poor { color: #f38ba8; }
        
        .pet-actions {
          display: flex;
          gap: 6px;
          margin-top: 10px;
          justify-content: center;
        }
        
        .pet-action-btn {
          width: 28px;
          height: 28px;
          background: #45475a;
          border: none;
          border-radius: 4px;
          color: #cdd6f4;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .pet-action-btn:hover {
          background: #585b70;
          transform: scale(1.1);
        }
        
        .pet-level-progress {
          margin-top: 10px;
        }
        
        .level-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 12px;
          color: #a6adc8;
        }
        
        .progress-bar {
          width: 100%;
          height: 6px;
          background: #45475a;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #a6e3a1, #94e2d5);
          transition: width 0.3s ease;
        }
        
        /* Management Panel */
        .management-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .management-btn {
          padding: 12px 16px;
          background: #74c0fc;
          border: none;
          border-radius: 6px;
          color: #1e1e2e;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .management-btn:hover {
          background: #89cff0;
          transform: translateY(-1px);
        }
        
        .management-tips {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #45475a;
        }
        
        .management-tips h4 {
          color: #f9e2af;
          margin: 0 0 10px 0;
        }
        
        .management-tips ul {
          margin: 0;
          padding-left: 20px;
          color: #a6adc8;
        }
        
        .management-tips li {
          margin-bottom: 6px;
          font-size: 13px;
        }
        
        /* Modal Styles */
        .pet-info-modal .modal-content {
          background: #1e1e2e;
          border: 1px solid #45475a;
          border-radius: 8px;
          min-width: 400px;
          max-width: 500px;
        }
        
        .pet-info-modal .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #45475a;
        }
        
        .pet-info-modal .modal-header h3 {
          color: #f9e2af;
          margin: 0;
        }
        
        .pet-info-modal .modal-close {
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
        
        .pet-info-modal .modal-close:hover {
          background: #45475a;
        }
        
        .pet-info-modal .modal-body {
          padding: 20px;
        }
        
        .pet-details, .pet-stats {
          margin-bottom: 20px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(69, 71, 90, 0.3);
        }
        
        .detail-label {
          color: #a6adc8;
          font-weight: 500;
        }
        
        .detail-value {
          color: #cdd6f4;
          font-weight: 600;
        }
        
        .pet-stats h4 {
          color: #74c0fc;
          margin: 0 0 10px 0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          padding: 8px;
          background: #313244;
          border-radius: 4px;
          text-align: center;
        }
        
        .stat-label {
          font-size: 11px;
          color: #a6adc8;
          margin-bottom: 4px;
        }
        
        .stat-value {
          font-size: 13px;
          font-weight: 600;
          color: #cdd6f4;
        }
        
        /* Grid and List Views */
        .pets-container.grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
        }
        
        .pets-container.list-view {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
      `;
      
      document.head.appendChild(style);
    }
  }

  // Initialize function
  window.initPetsMods = function(config = {}) {
    const petsMods = new PetsMods();
    petsMods.init();
    return petsMods;
  };
})();