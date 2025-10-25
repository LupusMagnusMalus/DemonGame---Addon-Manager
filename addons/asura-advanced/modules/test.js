/**
 * Performs scroll actions on progress tracks by finding unlocked tracks and scrolling to appropriate level cards.
 * Iterates through all available tracks and performs scroll operations for each unlocked track
 * that contains 'Locked' or 'Claim' elements.
 * 
 * @returns {Object} An object containing the processing results from all tracks with full chaining functionality
 * 
 * Available Methods:
 * 
 * String Conversion:
 * - toString() - Returns the final message when converted to string
 * 
 * Logging Methods (Chainable):
 * - log() - Logs the final message to console
 * - logAll() - Logs detailed results for all tracks with visual indicators
 * - logSummary() - Logs a brief summary of the processing results
 * - logSuccessful() - Logs only tracks where scroll actions were successfully performed
 * - logFailed() - Logs only tracks where scroll actions failed or were skipped
 * 
 * Getter Methods (End Chaining):
 * - hasTracks() - Returns whether any progress tracks were found
 * - tracksCounter() - Returns the total number of tracks found and processed
 * - tracksUnlocked() - Returns the number of unlocked tracks
 * - tracksLocked() - Returns the number of locked tracks
 * - getSuccessCount() - Returns the number of successful scroll actions
 * - getResults() - Returns all track results
 * - getSuccessfulResults() - Returns only successful track results
 * - getFailedResults() - Returns only failed track results
 * - getTrackStats() - Returns detailed track statistics object
 * - allUnlockedSuccessful() - Checks if all unlocked tracks were successfully processed
 * 
 * Conditional Methods (Chainable):
 * - ifSuccessful(callback) - Executes callback if at least one scroll action was successful
 * - ifFailed(callback) - Executes callback if no scroll actions were successful
 * - ifFound(callback) - Executes callback if progress tracks were found
 * - ifNotFound(callback) - Executes callback if no progress tracks were found
 * - ifHasTracks(callback) - Executes callback if progress tracks were found
 * - ifNoTracks(callback) - Executes callback if no progress tracks were found
 * - ifAllUnlockedSuccessful(callback) - Executes callback if all unlocked tracks were successful
 * - ifSomeUnlockedFailed(callback) - Executes callback if some unlocked tracks failed
 * 
 * @example
 * // Simple usage with getter methods
 * const result = ProgressTrackScrollAction();
 * console.log(`Found ${result.tracksCounter()} tracks, ${result.tracksUnlocked()} unlocked`);
 * 
 * @example
 * // Method chaining with conditional processing
 * ProgressTrackScrollAction()
 *   .ifHasTracks(r => r.logSummary())
 *   .ifAllUnlockedSuccessful(r => console.log('Perfect!'))
 *   .log();
 */
function ProgressTrackScrollAction() {
  // Find all cards that contain a track-head element
  const cardsWithTrackHead = document.querySelectorAll('.card:has(.track-head)');
  let data = {
    progressTracksFound: false,
    trackResults: [],
    totalTracksProcessed: 0,
    successfulScrolls: 0
  };

  // Process each card with a track-head (multiple tracks possible)
  for (let cardIndex = 0; cardIndex < cardsWithTrackHead.length; cardIndex++) {
    const card = cardsWithTrackHead[cardIndex];
    
    // Extract track name from the track-head element
    const trackNameElement = card.querySelector('.track-head .track-name');
    const trackName = trackNameElement ? trackNameElement.textContent.trim() : `Track ${cardIndex + 1}`;

    // Mark that we found at least one progress track
    data.progressTracksFound = true;
    data.totalTracksProcessed++;

    // Initialize result object for this track
    const trackResult = {
      trackName: trackName,
      isUnlocked: false,
      scrollPerformed: false,
      scrolledToIndex: null,
      foundAtIndex: null,
      message: ''
    };

    // Check if this track is unlocked by looking for 'Unlocked' text in track-cost elements
    const trackCosts = card.querySelectorAll('.track-head .track-cost');
    let unlockedFound = false;

    // Search through all track-cost elements to find 'Unlocked' status
    for (const trackCost of trackCosts) {
      if (trackCost.textContent.trim() === 'Unlocked') {
        unlockedFound = true;
        break;
      }
    }

    trackResult.isUnlocked = unlockedFound;

    // Only process unlocked tracks (each track is processed independently)
    if (unlockedFound) {
      // Find the scrollable container within this specific track card
      const bpScrollElement = card.querySelector('.bp-scroll');
      
      if (bpScrollElement) {
        // Get all level cards within this track's scroll container
        const levelCards = bpScrollElement.querySelectorAll('.level-card');
        let foundElement = null;
        let foundIndex = -1;

        // Search for the first 'Locked' or 'Claim' element within this track
        for (let i = 0; i < levelCards.length; i++) {
          const levelCard = levelCards[i];
          const claimArea = levelCard.querySelector('.claim-area');
          const text = claimArea ? claimArea.textContent.trim() : '';

          // Stop when we find 'Locked' or 'Claim' in this track
          if (text === 'Locked' || text === 'Claim') {
            foundElement = levelCard;
            foundIndex = i;
            break;
          }
        }

        // If we found a 'Locked' or 'Claim' element, perform scroll operation for this track
        if (foundElement) {
          trackResult.foundAtIndex = foundIndex;
          let targetElement = foundElement;
          let targetIndex = foundIndex;

          // If there's a previous element, scroll to it instead (one before the locked/claim)
          if (foundIndex > 0) {
            targetElement = levelCards[foundIndex - 1];
            targetIndex = foundIndex - 1;
          }

          // Calculate scroll position to center the target element within this track
          const bpScrollRect = bpScrollElement.getBoundingClientRect();
          const targetElementRect = targetElement.getBoundingClientRect();
          const scrollLeftPosition = targetElementRect.left - bpScrollRect.left + bpScrollElement.scrollLeft;

          // Perform smooth scroll to the calculated position for this track
          bpScrollElement.scrollTo({ left: scrollLeftPosition, behavior: 'smooth' });

          // Record successful operation for this track
          trackResult.scrollPerformed = true;
          trackResult.scrolledToIndex = targetIndex;
          trackResult.message = `Scrolled to level-card #${foundIndex + 1}`;
          data.successfulScrolls++;
          console.log(`For Track '${trackName}': ${trackResult.message}`);

        } else {
          // No 'Locked' or 'Claim' element found in this specific track
          trackResult.message = `No 'Locked' or 'Claim' Card found`;
          console.log(`For Track '${trackName}': ${trackResult.message}`);
        }
      } else {
        // No scroll container found within this specific track card
        trackResult.message = `No .bp-scroll element found within`;
        console.log(`For Track '${trackName}': ${trackResult.message}`);
      }
    } else {
      // This specific track is not unlocked, skip processing
      trackResult.message = `Track not unlocked`;
      console.log(`For Track '${trackName}': ${trackResult.message}`);
    }

    // Add this track's result to the results array
    data.trackResults.push(trackResult);

    // Continue processing next track (no break - process all tracks)
  }

  // Log summary if no progress tracks were found at all
  if (!data.progressTracksFound) {
    console.log('No Progress Tracks found');
  }

  // Add final completion message with summary
  data.finalMessage = `Processing complete. Processed ${data.totalTracksProcessed} tracks, ${data.successfulScrolls} successful scrolls.`;
  console.log(data.finalMessage);

  // === STRING CONVERSION ===

  /**
   * Returns the final message when object is converted to string
   * @returns {string} The final processing message
   * @example
   * const result = ProgressTrackScrollAction();
   * console.log(result.toString());
   */
  data.toString = function() {
    return this.finalMessage;
  };

  // === BASIC LOGGING METHODS (Chainable) ===

  /**
   * Logs the final message to console
   * @returns {Object} This object for method chaining
   * @example
   * ProgressTrackScrollAction().logSummary().log();
   */
  data.log = function() {
    console.log(this.finalMessage);
    return this;
  };

  /**
   * Logs detailed results for all tracks with visual indicators
   * @returns {Object} This object for method chaining
   * @example
   * ProgressTrackScrollAction().logAll();
   */
  data.logAll = function() {
    console.log('=== Progress Tracks Scroll Action - Detailed Results ===');
    
    if (!this.progressTracksFound) {
      console.log('No Progress Tracks found on the page.');
      return this;
    }

    this.trackResults.forEach((track, index) => {
      console.log(`\n${index + 1}. Track: "${track.trackName}"`);
      console.log(`   Status: ${track.isUnlocked ? '✓ Unlocked' : '✗ Locked'}`);
      console.log(`   Message: ${track.message}`);
      
      if (track.scrollPerformed) {
        console.log(`   Scroll Action: ✓ Performed`);
        console.log(`   Found 'Locked'/'Claim' at index: ${track.foundAtIndex}`);
        console.log(`   Scrolled to index: ${track.scrolledToIndex}`);
      } else if (track.isUnlocked) {
        console.log(`   Scroll Action: ✗ Not performed`);
      } else {
        console.log(`   Scroll Action: - Skipped (track locked)`);
      }
    });

    console.log(`\n=== Summary ===`);
    console.log(`Total tracks processed: ${this.totalTracksProcessed}`);
    console.log(`Successful scroll actions: ${this.successfulScrolls}`);
    console.log(`Success rate: ${this.totalTracksProcessed > 0 ? Math.round((this.successfulScrolls / this.totalTracksProcessed) * 100) : 0}%`);
    
    return this;
  };

  /**
   * Logs a brief summary of the processing results
   * @returns {Object} This object for method chaining
   * @example
   * ProgressTrackScrollAction().logSummary();
   */
  data.logSummary = function() {
    const successRate = this.totalTracksProcessed > 0 ? 
      Math.round((this.successfulScrolls / this.totalTracksProcessed) * 100) : 0;
    
    console.log(`📊 Summary: ${this.successfulScrolls}/${this.totalTracksProcessed} tracks scrolled successfully (${successRate}%)`);
    return this;
  };

  /**
   * Logs only the tracks where scroll actions were successfully performed
   * @returns {Object} This object for method chaining
   * @example
   * ProgressTrackScrollAction().logSuccessful();
   */
  data.logSuccessful = function() {
    const successfulTracks = this.trackResults.filter(track => track.scrollPerformed);
    
    if (successfulTracks.length === 0) {
      console.log('🚫 No successful scroll actions performed');
      return this;
    }

    console.log('✅ === Successful Scroll Actions ===');
    successfulTracks.forEach((track, index) => {
      console.log(`${index + 1}. ✓ ${track.trackName}: ${track.message}`);
      console.log(`   └─ Scrolled to index: ${track.scrolledToIndex} (found at: ${track.foundAtIndex})`);
    });
    
    return this;
  };

  /**
   * Logs only the tracks where scroll actions failed or were skipped
   * @returns {Object} This object for method chaining
   * @example
   * ProgressTrackScrollAction().logFailed();
   */
  data.logFailed = function() {
    const failedTracks = this.trackResults.filter(track => !track.scrollPerformed);
    
    if (failedTracks.length === 0) {
      console.log('🎉 All tracks were processed successfully!');
      return this;
    }

    console.log('❌ === Failed/Skipped Actions ===');
    failedTracks.forEach((track, index) => {
      const icon = track.isUnlocked ? '✗' : '🔒';
      console.log(`${index + 1}. ${icon} ${track.trackName}: ${track.message}`);
    });
    
    return this;
  };

  // === GETTER METHODS (End Chaining) ===

  /**
   * Returns whether any progress tracks were found on the page
   * @returns {boolean} True if progress tracks were found, false otherwise
   * @example
   * const result = ProgressTrackScrollAction();
   * if (result.hasTracks()) console.log('Progress tracks are available');
   */
  data.hasTracks = function() {
    return this.progressTracksFound;
  };

  /**
   * Returns the total number of tracks found and processed
   * @returns {number} Total number of tracks processed
   * @example
   * const result = ProgressTrackScrollAction();
   * console.log(`Found ${result.tracksCounter()} tracks total`);
   */
  data.tracksCounter = function() {
    return this.totalTracksProcessed;
  };

  /**
   * Returns the number of unlocked tracks
   * @returns {number} Number of unlocked tracks
   * @example
   * const result = ProgressTrackScrollAction();
   * console.log(`${result.tracksUnlocked()} tracks are unlocked`);
   */
  data.tracksUnlocked = function() {
    return this.trackResults.filter(track => track.isUnlocked).length;
  };

  /**
   * Returns the number of locked tracks
   * @returns {number} Number of locked tracks
   * @example
   * const result = ProgressTrackScrollAction();
   * console.log(`${result.tracksLocked()} tracks are still locked`);
   */
  data.tracksLocked = function() {
    return this.trackResults.filter(track => !track.isUnlocked).length;
  };

  /**
   * Returns the number of successful scroll actions
   * @returns {number} Number of successful scroll actions
   * @example
   * const result = ProgressTrackScrollAction();
   * console.log(`${result.getSuccessCount()} tracks were scrolled successfully`);
   */
  data.getSuccessCount = function() {
    return this.successfulScrolls;
  };

  /**
   * Returns all track results
   * @returns {Array<Object>} Array of all track results
   * @example
   * const result = ProgressTrackScrollAction();
   * const allTracks = result.getResults();
   */
  data.getResults = function() {
    return this.trackResults;
  };

  /**
   * Returns only successful track results
   * @returns {Array<Object>} Array of successful track results
   * @example
   * const result = ProgressTrackScrollAction();
   * const successful = result.getSuccessfulResults();
   */
  data.getSuccessfulResults = function() {
    return this.trackResults.filter(track => track.scrollPerformed);
  };

  /**
   * Returns only failed track results
   * @returns {Array<Object>} Array of failed track results
   * @example
   * const result = ProgressTrackScrollAction();
   * const failed = result.getFailedResults();
   */
  data.getFailedResults = function() {
    return this.trackResults.filter(track => !track.scrollPerformed);
  };

  /**
   * Returns detailed track statistics
   * @returns {Object} Object containing all track statistics with properties: total, unlocked, locked, successful, failed, hasAnyTracks, successRate
   * @example
   * const stats = ProgressTrackScrollAction().getTrackStats();
   * console.log(`Success rate: ${stats.successRate}%`);
   */
  data.getTrackStats = function() {
    const unlocked = this.tracksUnlocked();
    return {
      total: this.tracksCounter(),
      unlocked: unlocked,
      locked: this.tracksLocked(),
      successful: this.successfulScrolls,
      failed: unlocked - this.successfulScrolls,
      hasAnyTracks: this.hasTracks(),
      successRate: unlocked > 0 ? Math.round((this.successfulScrolls / unlocked) * 100) : 0
    };
  };

  /**
   * Checks if all unlocked tracks were successfully processed
   * @returns {boolean} True if all unlocked tracks were successfully scrolled
   * @example
   * const result = ProgressTrackScrollAction();
   * if (result.allUnlockedSuccessful()) console.log('Perfect score!');
   */
  data.allUnlockedSuccessful = function() {
    const unlocked = this.tracksUnlocked();
    return unlocked > 0 && this.successfulScrolls === unlocked;
  };

  // === CONDITIONAL METHODS (Continue Chaining) ===

  /**
   * Executes a callback function only if at least one scroll action was successful
   * @param {Function} callback - Function to execute, receives this object as parameter
   * @returns {Object} This object for method chaining
   * @example
   * ProgressTrackScrollAction().ifSuccessful(result => result.logSuccessful());
   */
  data.ifSuccessful = function(callback) {
    if (this.successfulScrolls > 0 && typeof callback === 'function') {
      callback(this);
    }
    return this;
  };

  /**
   * Executes a callback function only if no scroll actions were successful
   * @param {Function} callback - Function to execute, receives this object as parameter
   * @returns {Object} This object for method chaining
   * @example
   * ProgressTrackScrollAction().ifFailed(result => result.logFailed());
   */
  data.ifFailed = function(callback) {
    if (this.successfulScrolls === 0 && typeof callback === 'function') {
      callback(this);
    }
    return this;
  };

  /**
   * Executes a callback function only if progress tracks were found
   * @param {Function} callback - Function to execute, receives this object as parameter
   * @returns {Object} This object for method chaining
   * @example
   * ProgressTrackScrollAction().ifFound(result => console.log(`Found ${result.tracksCounter()} tracks`));
   */
  data.ifFound = function(callback) {
    if (this.progressTracksFound && typeof callback === 'function') {
      callback(this);
    }
    return this;
  };

  /**
   * Executes a callback function only if no progress tracks were found
   * @param {Function} callback - Function to execute, receives this object as parameter
   * @returns {Object} This object for method chaining
   * @example
   * ProgressTrackScrollAction().ifNotFound(result => console.log('No progress tracks found'));
   */
  data.ifNotFound = function(callback) {
    if (!this.progressTracksFound && typeof callback === 'function') {
      callback(this);
    }
    return this;
  };

  /**
   * Executes a callback function only if progress tracks were found
   * @param {Function} callback - Function to execute, receives this object as parameter
   * @returns {Object} This object for method chaining
   * @example
   * ProgressTrackScrollAction().ifHasTracks(result => result.logSummary());
   */
  data.ifHasTracks = function(callback) {
    if (this.hasTracks() && typeof callback === 'function') {
      callback(this);
    }
    return this;
  };

  /**
   * Executes a callback function only if no progress tracks were found  
   * @param {Function} callback - Function to execute, receives this object as parameter
   * @returns {Object} This object for method chaining
   * @example
   * ProgressTrackScrollAction().ifNoTracks(result => console.log('No tracks available'));
   */
  data.ifNoTracks = function(callback) {
    if (!this.hasTracks() && typeof callback === 'function') {
      callback(this);
    }
    return this;
  };

  /**
   * Executes a callback function only if all unlocked tracks were successfully processed
   * @param {Function} callback - Function to execute, receives this object as parameter
   * @returns {Object} This object for method chaining
   * @example
   * ProgressTrackScrollAction().ifAllUnlockedSuccessful(result => console.log('Perfect score!'));
   */
  data.ifAllUnlockedSuccessful = function(callback) {
    if (this.allUnlockedSuccessful() && typeof callback === 'function') {
      callback(this);
    }
    return this;
  };

  /**
   * Executes a callback function only if some unlocked tracks failed to be processed
   * @param {Function} callback - Function to execute, receives this object as parameter
   * @returns {Object} This object for method chaining
   * @example
   * ProgressTrackScrollAction().ifSomeUnlockedFailed(result => result.logFailed());
   */
  data.ifSomeUnlockedFailed = function(callback) {
    const unlocked = this.tracksUnlocked();
    if (unlocked > 0 && this.successfulScrolls < unlocked && typeof callback === 'function') {
      callback(this);
    }
    return this;
  };

  return data;
}

ProgressTrackScrollAction().logAll();

/* === BEISPIELE ZUR VERWENDUNG VON ProgressTrackScrollAction() ===
// 1. Einfache Statistiken abfragen
const result = ProgressTrackScrollAction();
console.log(`Tracks found: ${result.hasTracks()}`);
console.log(`Total: ${result.tracksCounter()}, Unlocked: ${result.tracksUnlocked()}, Locked: ${result.tracksLocked()}`);

// 2. Vollständige Statistiken
const stats = result.getTrackStats();
console.log('Complete Stats:', stats);
Output: {
  total: 5, unlocked: 3, locked: 2, successful: 2, failed: 1, 
  hasAnyTracks: true, successRate: 67
}

// 3. Erweiterte bedingte Verarbeitung
ProgressTrackScrollAction()
  .ifHasTracks(r => {
    console.log(`📊 Found ${r.tracksCounter()} tracks (${r.tracksUnlocked()} unlocked, ${r.tracksLocked()} locked)`);
  })
  .ifAllUnlockedSuccessful(r => {
    console.log('🏆 Perfect! All unlocked tracks processed successfully!');
  })
  .ifSomeUnlockedFailed(r => {
    console.log('⚠️ Some unlocked tracks had issues:');
    r.logFailed();
  })
  .ifNoTracks(r => {
    console.log('ℹ️ No progress tracks found on this page');
  });

// 4. Dashboard-Style Ausgabe
ProgressTrackScrollAction()
  .ifHasTracks(r => {
    const stats = r.getTrackStats();
    console.log(`
🎯 Progress Tracks Dashboard:
   📊 Total Found: ${stats.total}
   🔓 Unlocked: ${stats.unlocked} 
   🔒 Locked: ${stats.locked}
   ✅ Scrolled: ${stats.successful}
   ❌ Failed: ${stats.failed}
   📈 Success Rate: ${stats.successRate}%
    `);
  })
  .logSummary();

// 5. Intelligente Fehlerbehandlung
ProgressTrackScrollAction()
  .ifHasTracks(r => {
    if (r.allUnlockedSuccessful()) {
      console.log('🎉 Perfect execution!');
    } else if (r.tracksUnlocked() === 0) {
      console.log('🔒 All tracks are locked - unlock some to enable scrolling');
    } else {
      console.log('📊 Mixed results - check details:');
      r.logAll();
    }
  })
  .ifNoTracks(r => {
    console.log('🔍 No progress tracks detected on this page');
  });
*/

