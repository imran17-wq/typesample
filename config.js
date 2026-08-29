// ============================================================
// CONFIG — difficulty/level settings for both modes + localStorage
// ============================================================

// ---- Word Rush ------------------------------------------------
const WORD_RUSH_CONFIG = {
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
      { maxWords: 4, fallSpeed: 175, spawnInterval: 2200, wordSubset: 0.30 },
      { maxWords: 4, fallSpeed: 200, spawnInterval: 1900, wordSubset: 0.45 },
      { maxWords: 5, fallSpeed: 228, spawnInterval: 1650, wordSubset: 0.60 },
      { maxWords: 5, fallSpeed: 258, spawnInterval: 1400, wordSubset: 0.78 },
      { maxWords: 6, fallSpeed: 290, spawnInterval: 1200, wordSubset: 1.00 },
    ],
  },
};

// ---- Sentence Rush --------------------------------------------
const SENTENCE_RUSH_CONFIG = {
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
const LS_KEYS = {
  wordRush:     { easy: "ts_wr_easy",   medium: "ts_wr_medium",   hard: "ts_wr_hard"   },
  sentenceRush: { easy: "ts_sr_easy",   medium: "ts_sr_medium",   hard: "ts_sr_hard"   },
};

function getBest(mode, difficulty) {
  return parseInt(localStorage.getItem(LS_KEYS[mode][difficulty]) || "0", 10);
}

function saveBest(mode, difficulty, score) {
  localStorage.setItem(LS_KEYS[mode][difficulty], String(score));
}
