// ============================================================
// CONFIG — difficulty/level settings for both modes + localStorage
// ============================================================

// ---- Word Rush ------------------------------------------------
var WORD_RUSH_CONFIG = {
  easy: {
    wordBankKey: "easy",
    levels: [
      { maxWords: 1, fallSpeed: 45,  spawnInterval: 4000, wordSubset: 0.50 },
      { maxWords: 1, fallSpeed: 52,  spawnInterval: 3600, wordSubset: 0.60 },
      { maxWords: 1, fallSpeed: 60,  spawnInterval: 3200, wordSubset: 0.75 },
      { maxWords: 1, fallSpeed: 68,  spawnInterval: 2900, wordSubset: 0.88 },
      { maxWords: 1, fallSpeed: 76,  spawnInterval: 2600, wordSubset: 1.00 },
    ],
  },
  medium: {
    wordBankKey: "medium",
    levels: [
      { maxWords: 2, fallSpeed: 90,  spawnInterval: 3000, wordSubset: 0.35 },
      { maxWords: 2, fallSpeed: 105, spawnInterval: 2700, wordSubset: 0.50 },
      { maxWords: 2, fallSpeed: 120, spawnInterval: 2400, wordSubset: 0.65 },
      { maxWords: 3, fallSpeed: 136, spawnInterval: 2100, wordSubset: 0.80 },
      { maxWords: 3, fallSpeed: 152, spawnInterval: 1800, wordSubset: 1.00 },
    ],
  },
  hard: {
    wordBankKey: "hard",
    levels: [
      { maxWords: 3, fallSpeed: 165, spawnInterval: 2400, wordSubset: 0.35 },
      { maxWords: 4, fallSpeed: 190, spawnInterval: 2000, wordSubset: 0.50 },
      { maxWords: 4, fallSpeed: 215, spawnInterval: 1750, wordSubset: 0.65 },
      { maxWords: 5, fallSpeed: 245, spawnInterval: 1500, wordSubset: 0.80 },
      { maxWords: 5, fallSpeed: 275, spawnInterval: 1300, wordSubset: 1.00 },
    ],
  },
};

// ---- Sentence Rush --------------------------------------------
var SENTENCE_RUSH_CONFIG = {
  easy: {
    sentenceBankKey: "easy",
    levels: [
      { fallSpeed: 35,  sentenceSubset: 0.45 },
      { fallSpeed: 41,  sentenceSubset: 0.55 },
      { fallSpeed: 47,  sentenceSubset: 0.70 },
      { fallSpeed: 54,  sentenceSubset: 0.85 },
      { fallSpeed: 62,  sentenceSubset: 1.00 },
    ],
  },
  medium: {
    sentenceBankKey: "medium",
    levels: [
      { fallSpeed: 62,  sentenceSubset: 0.40 },
      { fallSpeed: 74,  sentenceSubset: 0.55 },
      { fallSpeed: 88,  sentenceSubset: 0.70 },
      { fallSpeed: 103, sentenceSubset: 0.85 },
      { fallSpeed: 120, sentenceSubset: 1.00 },
    ],
  },
  hard: {
    sentenceBankKey: "hard",
    levels: [
      { fallSpeed: 118, sentenceSubset: 0.40 },
      { fallSpeed: 138, sentenceSubset: 0.55 },
      { fallSpeed: 160, sentenceSubset: 0.70 },
      { fallSpeed: 183, sentenceSubset: 0.85 },
      { fallSpeed: 210, sentenceSubset: 1.00 },
    ],
  },
};

// Points score needed to advance one level within a band
const LEVEL_UP_SCORE_THRESHOLD = 500;

// ---- localStorage  (6 keys: 2 modes × 3 difficulties) ---------
var LS_KEYS = {
  wordRush:     { easy: "ts_wr_easy",   medium: "ts_wr_medium",   hard: "ts_wr_hard"   },
  sentenceRush: { easy: "ts_sr_easy",   medium: "ts_sr_medium",   hard: "ts_sr_hard"   },
};

/**
 * Safely retrieve and validate stored best score.
 */
function getBest(mode, difficulty) {
  try {
    const key = LS_KEYS[mode]?.[difficulty];
    if (!key) return 0;
    if (typeof localStorage === "undefined") return 0;
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const val = parseInt(raw, 10);
    if (isNaN(val) || !isFinite(val) || val < 0 || val > 10000000) {
      return 0;
    }
    return val;
  } catch (e) {
    return 0;
  }
}

/**
 * Safely save best score if valid.
 */
function saveBest(mode, difficulty, score) {
  try {
    const val = parseInt(score, 10);
    if (isNaN(val) || !isFinite(val) || val < 0 || val > 10000000) {
      return;
    }
    const key = LS_KEYS[mode]?.[difficulty];
    if (key && typeof localStorage !== "undefined") {
      localStorage.setItem(key, String(val));
    }
  } catch (e) {
    // Ignore restricted localStorage environments
  }
}

if (typeof window !== "undefined") {
  window.WORD_RUSH_CONFIG = WORD_RUSH_CONFIG;
  window.SENTENCE_RUSH_CONFIG = SENTENCE_RUSH_CONFIG;
  window.LS_KEYS = LS_KEYS;
  window.getBest = getBest;
  window.saveBest = saveBest;
}

if (typeof global !== "undefined") {
  global.WORD_RUSH_CONFIG = WORD_RUSH_CONFIG;
  global.SENTENCE_RUSH_CONFIG = SENTENCE_RUSH_CONFIG;
  global.LS_KEYS = LS_KEYS;
  global.getBest = getBest;
  global.saveBest = saveBest;
}
