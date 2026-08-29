// ============================================================
// ANALYTICS & HISTORY ENGINE
// Handles stats calculations, run history (localStorage),
// weak-key / finger analysis, and adaptive recommendations.
// ============================================================

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AnalyticsEngine = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {

  const LS_HISTORY_KEY = "ts_run_history";
  const MAX_HISTORY_LEN = 10;

  const FINGER_NAMES = {
    0: "Left Pinky",
    1: "Left Ring",
    2: "Left Middle",
    3: "Left Index",
    4: "Right Index",
    5: "Right Middle",
    6: "Right Ring",
    7: "Right Pinky"
  };

  /**
   * Calculate active elapsed gameplay time in seconds (excluding paused duration).
   */
  function getActiveElapsedTime(state) {
    if (!state || !state.startTime) return 0.5;
    const now = state.ended
      ? (state.endTime || performance.now())
      : (state.isPaused ? state.pauseStartTime : performance.now());
    const totalMs = now - state.startTime - (state.totalPausedDuration || 0);
    return Math.max(0.5, totalMs / 1000); // minimum 0.5s to prevent divide-by-zero
  }

  /**
   * WPM = correctly typed characters / 5 / active elapsed minutes
   */
  function computeWPM(state) {
    const mins = getActiveElapsedTime(state) / 60;
    if (mins <= 0) return 0;
    return Math.round((state.correctKeys / 5) / mins);
  }

  /**
   * Raw WPM = total characters typed / 5 / active elapsed minutes
   */
  function computeRawWPM(state) {
    const mins = getActiveElapsedTime(state) / 60;
    if (mins <= 0) return 0;
    return Math.round((state.totalKeys / 5) / mins);
  }

  /**
   * Accuracy = (correctKeys / totalKeys) * 100
   */
  function computeAccuracy(state) {
    if (!state || state.totalKeys === 0) return 100;
    return Math.round((state.correctKeys / state.totalKeys) * 100);
  }

  /**
   * Extract top 3 weak keys based on error rate (mistakes / attempts).
   * Operates on targetKeyStats (or keyStats) to preserve weak-key practice.
   * Requires a minimum attempt count per key (default 5).
   */
  function getWeakKeys(state, minAttempts = 5) {
    if (!state) return [];
    const statsSource = state.targetKeyStats || state.keyStats;
    if (!statsSource) return [];
    const results = [];
    for (const key in statsSource) {
      const stats = statsSource[key];
      if (stats && stats.attempts >= minAttempts) {
        const errorRate = stats.mistakes / stats.attempts;
        if (errorRate > 0) {
          results.push({
            key,
            attempts: stats.attempts,
            mistakes: stats.mistakes,
            errorRate: Math.round(errorRate * 1000) / 1000,
            errorPercent: Math.round(errorRate * 100)
          });
        }
      }
    }
    results.sort((a, b) => b.errorRate - a.errorRate || b.attempts - a.attempts);
    return results.slice(0, 3);
  }

  /**
   * Extract finger-specific performance analysis using existing KeyboardEngine finger map.
   * Requires a minimum attempt count per finger (default 5).
   */
  function getFingerAnalysis(state, minAttempts = 5) {
    if (!state || !state.fingerStats) return [];
    const results = [];
    for (let f = 0; f <= 7; f++) {
      const stats = state.fingerStats[f];
      if (stats && stats.attempts >= minAttempts) {
        const errorRate = stats.mistakes / stats.attempts;
        results.push({
          fingerId: f,
          name: FINGER_NAMES[f] || `Finger ${f}`,
          attempts: stats.attempts,
          mistakes: stats.mistakes,
          errorRate: Math.round(errorRate * 1000) / 1000,
          errorPercent: Math.round(errorRate * 100)
        });
      }
    }
    return results;
  }

  /**
   * Recommend next run difficulty based on conservative performance thresholds.
   * Prioritizes accuracy over speed and requires a minimum sample of 50 total keystrokes.
   */
  function getRecommendedDifficulty(stats) {
    const totalKeys = typeof stats.totalKeys === "number" ? stats.totalKeys : 0;
    const acc = typeof stats.accuracy === "number" ? stats.accuracy : 100;
    const wpm = typeof stats.wpm === "number" ? stats.wpm : 0;

    // Minimum sample requirement: 50 keystrokes
    if (totalKeys < 50) {
      return "medium"; // baseline default for small sample
    }

    if (acc < 88) {
      return "easy";
    } else if (acc >= 96) {
      return wpm >= 45 ? "hard" : "medium";
    } else {
      return wpm >= 60 ? "hard" : "medium";
    }
  }

  const VALID_MODES = new Set(["wordRush", "sentenceRush"]);
  const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard", "adaptive"]);

  /**
   * Safely load and validate run history from localStorage.
   */
  function loadRunHistory() {
    try {
      if (typeof localStorage === "undefined") return [];
      const raw = localStorage.getItem(LS_HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const valid = parsed.filter(item => {
        return (
          item &&
          typeof item === "object" &&
          typeof item.mode === "string" && VALID_MODES.has(item.mode) &&
          typeof item.difficulty === "string" && VALID_DIFFICULTIES.has(item.difficulty) &&
          typeof item.wpm === "number" && isFinite(item.wpm) && item.wpm >= 0 &&
          typeof item.accuracy === "number" && isFinite(item.accuracy) && item.accuracy >= 0 && item.accuracy <= 100 &&
          typeof item.score === "number" && isFinite(item.score) && item.score >= 0
        );
      });

      return valid.slice(0, MAX_HISTORY_LEN);
    } catch (e) {
      return [];
    }
  }

  /**
   * Safely save a completed run record to localStorage history.
   */
  function saveRunHistory(runData) {
    try {
      if (typeof localStorage === "undefined") return;
      if (!runData || typeof runData !== "object") return;

      const record = {
        timestamp: runData.timestamp || Date.now(),
        dateStr: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        mode: String(runData.mode || "wordRush"),
        difficulty: String(runData.difficulty || "easy"),
        wpm: Math.max(0, Math.round(runData.wpm || 0)),
        rawWPM: Math.max(0, Math.round(runData.rawWPM || 0)),
        accuracy: Math.min(100, Math.max(0, Math.round(runData.accuracy || 0))),
        mistakes: Math.max(0, Math.round(runData.mistakes || 0)),
        score: Math.max(0, Math.round(runData.score || 0)),
        combo: Math.max(0, Math.round(runData.combo || 0)),
        level: Math.max(1, Math.round(runData.level || 1)),
        duration: Math.max(0, Math.round(runData.duration || 0))
      };

      const history = loadRunHistory();
      history.unshift(record);
      const trimmed = history.slice(0, MAX_HISTORY_LEN);
      localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {
      // Ignore localStorage restrictions
    }
  }

  /**
   * Compute aggregate performance summary across recent runs.
   */
  function getAggregateStats() {
    const history = loadRunHistory();
    if (history.length === 0) {
      return {
        count: 0,
        bestWPM: 0,
        avgWPM: 0,
        bestAccuracy: 0,
        avgAccuracy: 0
      };
    }

    let maxWPM = 0, sumWPM = 0;
    let maxAcc = 0, sumAcc = 0;

    history.forEach(run => {
      if (run.wpm > maxWPM) maxWPM = run.wpm;
      sumWPM += run.wpm;
      if (run.accuracy > maxAcc) maxAcc = run.accuracy;
      sumAcc += run.accuracy;
    });

    return {
      count: history.length,
      bestWPM: maxWPM,
      avgWPM: Math.round(sumWPM / history.length),
      bestAccuracy: maxAcc,
      avgAccuracy: Math.round(sumAcc / history.length)
    };
  }

  const LS_ADAPTIVE_KEY = "ts_adaptive_recommendation";
  const VALID_ADAPTIVE_DIFFS = new Set(["easy", "medium", "hard"]);

  /**
   * Safely load and validate persistent adaptive recommendation.
   */
  function getAdaptiveRecommendation() {
    try {
      if (typeof localStorage === "undefined") return "medium";
      const raw = localStorage.getItem(LS_ADAPTIVE_KEY);
      if (raw && VALID_ADAPTIVE_DIFFS.has(raw)) {
        return raw;
      }
      return "medium";
    } catch (e) {
      return "medium";
    }
  }

  /**
   * Safely save persistent adaptive recommendation.
   */
  function saveAdaptiveRecommendation(diff) {
    try {
      if (typeof localStorage === "undefined") return;
      if (diff && VALID_ADAPTIVE_DIFFS.has(diff)) {
        localStorage.setItem(LS_ADAPTIVE_KEY, diff);
      }
    } catch (e) {
      // Ignore localStorage restrictions
    }
  }

  return {
    getActiveElapsedTime,
    computeWPM,
    computeRawWPM,
    computeAccuracy,
    getWeakKeys,
    getFingerAnalysis,
    getRecommendedDifficulty,
    getAdaptiveRecommendation,
    saveAdaptiveRecommendation,
    loadRunHistory,
    saveRunHistory,
    getAggregateStats
  };
});
