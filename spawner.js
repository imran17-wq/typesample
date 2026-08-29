// ============================================================
// SPAWNER — word / sentence spawning with Weighted Reach Engine & Anti-Repetition
// Depends on:  renderer.js (measureWord, computeSentenceLayout)
//              state.js    (createWord, createLine)
//              words.js / sentences.js / config.js
// ============================================================

// Anti-repetition history queues
const RECENT_WORDS_LIMIT = 12;
const RECENT_SENTENCES_LIMIT = 5;

const _recentWords = [];
const _recentSentences = [];

/**
 * Perform weighted random selection from candidate pool based on selectionWeight,
 * while respecting anti-repetition history and applying a modest weak-key bonus.
 */
function _selectWeightedNonRepeating(pool, history, limit, weakKeys = []) {
  if (!pool || pool.length === 0) return "";
  if (pool.length === 1) return typeof pool[0] === "string" ? pool[0] : pool[0].word;

  // Filter candidates to exclude recent history
  const available = pool.filter(item => {
    const w = typeof item === "string" ? item : item.word;
    return !history.includes(w);
  });

  // Fallback if anti-repetition leaves fewer than 2 candidates
  const candidatePool = available.length >= 2 ? available : pool;

  // Calculate weights for candidates
  let totalWeight = 0;
  const weights = candidatePool.map(item => {
    const wStr = typeof item === "string" ? item : item.word;
    let weight = 1.0;
    if (typeof getWordMetadata === "function") {
      const meta = getWordMetadata(wStr);
      if (meta && typeof meta.selectionWeight === "number") {
        weight = meta.selectionWeight;
      }
    }

    // Modest weak-key bonus (capped at 1.35x max) layered on top of naturalness & reach score
    if (weakKeys && weakKeys.length > 0) {
      const lowerWord = wStr.toLowerCase();
      let hasWeakKey = false;
      for (const k of weakKeys) {
        if (lowerWord.includes(k)) {
          hasWeakKey = true;
          break;
        }
      }
      if (hasWeakKey) {
        weight *= 1.35;
      }
    }

    totalWeight += weight;
    return weight;
  });

  let picked = "";
  if (totalWeight <= 0) {
    const item = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    picked = typeof item === "string" ? item : item.word;
  } else {
    let r = Math.random() * totalWeight;
    for (let i = 0; i < candidatePool.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        const item = candidatePool[i];
        picked = typeof item === "string" ? item : item.word;
        break;
      }
    }
    if (!picked) {
      const last = candidatePool[candidatePool.length - 1];
      picked = typeof last === "string" ? last : last.word;
    }
  }

  history.push(picked);
  if (history.length > limit) {
    history.shift();
  }

  return picked;
}

// ==============================================================
// WORD RUSH
// ==============================================================

function _pickWord(difficulty, levelIndex, state) {
  let activeDiff = difficulty;
  if (difficulty === "adaptive" || (state && state.isAdaptive)) {
    activeDiff = (state && state.adaptiveEffectiveDiff) ? state.adaptiveEffectiveDiff : "medium";
  }

  const cfg = WORD_RUSH_CONFIG[activeDiff] || WORD_RUSH_CONFIG.easy;
  let key = cfg.wordBankKey;
  let bank = WORD_BANKS[key];

  // Gracefully fall back to closest available difficulty if bank is empty
  if (!bank || bank.length === 0) {
    const fallbacks = {
      hard: ["medium", "easy"],
      medium: ["hard", "easy"],
      easy: ["medium", "hard"]
    };
    for (const altKey of (fallbacks[activeDiff] || ["easy"])) {
      if (WORD_BANKS[altKey] && WORD_BANKS[altKey].length > 0) {
        bank = WORD_BANKS[altKey];
        key = altKey;
        break;
      }
    }
  }

  if (!bank || bank.length === 0) return "type";

  const levelCfg = cfg.levels[levelIndex] || cfg.levels[0];
  const subset = levelCfg.wordSubset;
  const split = WORD_BANK_SPLIT[key] || 10;

  // Level progression subset sampling
  const cutoff = subset < 1.0 ? Math.min(Math.floor(bank.length * subset), split) : bank.length;
  const pool = bank.slice(0, Math.max(1, cutoff));

  // Extract weak keys if present in state analytics
  let weakKeys = [];
  if (state && typeof AnalyticsEngine !== "undefined") {
    const weakList = AnalyticsEngine.getWeakKeys(state, 4);
    weakKeys = weakList.map(w => w.key);
  }

  return _selectWeightedNonRepeating(pool, _recentWords, RECENT_WORDS_LIMIT, weakKeys);
}

/**
 * Attempt to spawn a new word if slot and timer conditions are met.
 * @param {object} state
 * @param {number} now        performance.now()
 * @param {number} canvasW    logical width
 * @param {number} canvasH    logical height
 */
function trySpawnWord(state, now, canvasW, canvasH) {
  if (state.ended) return;

  const activeDiff = state.isAdaptive ? (state.adaptiveEffectiveDiff || "medium") : state.difficulty;
  const cfg      = WORD_RUSH_CONFIG[activeDiff] || WORD_RUSH_CONFIG.easy;
  const levelCfg = cfg.levels[state.level] || cfg.levels[0];

  const aliveCount = state.words.filter(w => w.alive).length;
  if (aliveCount >= levelCfg.maxWords)                    return;
  if (now - state.lastSpawnTime < levelCfg.spawnInterval) return;

  state.lastSpawnTime = now;

  const text = _pickWord(state.difficulty, state.level, state);
  const dims = measureWord(text);
  const minX = 8, maxX = canvasW - dims.w - 8;
  const x    = minX + Math.random() * Math.max(0, maxX - minX);

  state.words.push(
    createWord(state.nextWordId++, text, x, -dims.h, levelCfg.fallSpeed, dims.w, dims.h)
  );
}

// ==============================================================
// SENTENCE RUSH
// ==============================================================

function _pickSentence(difficulty, levelIndex, state) {
  let activeDiff = difficulty;
  if (difficulty === "adaptive" || (state && state.isAdaptive)) {
    activeDiff = (state && state.adaptiveEffectiveDiff) ? state.adaptiveEffectiveDiff : "medium";
  }

  const cfg = SENTENCE_RUSH_CONFIG[activeDiff] || SENTENCE_RUSH_CONFIG.easy;
  let key = cfg.sentenceBankKey;
  let bank = SENTENCE_BANKS[key];

  if (!bank || bank.length === 0) {
    const fallbacks = {
      hard: ["medium", "easy"],
      medium: ["hard", "easy"],
      easy: ["medium", "hard"]
    };
    for (const altKey of (fallbacks[activeDiff] || ["easy"])) {
      if (SENTENCE_BANKS[altKey] && SENTENCE_BANKS[altKey].length > 0) {
        bank = SENTENCE_BANKS[altKey];
        key = altKey;
        break;
      }
    }
  }

  if (!bank || bank.length === 0) return "practice typing every day";

  const levelCfg = cfg.levels[levelIndex] || cfg.levels[0];
  const subset = levelCfg.sentenceSubset;
  const split = SENTENCE_BANK_SPLIT[key] || 5;

  const cutoff = subset < 1.0 ? Math.min(Math.floor(bank.length * subset), split) : bank.length;
  const pool = bank.slice(0, Math.max(1, cutoff));

  return _selectWeightedNonRepeating(pool, _recentSentences, RECENT_SENTENCES_LIMIT);
}

/**
 * Spawn the next sentence line if there is none currently active.
 * @param {object} state
 * @param {number} canvasW   logical width
 * @param {number} canvasH
 */
function trySpawnLine(state, canvasW, canvasH) {
  if (state.ended)               return;
  if (state.activeLine !== null) return;

  const activeDiff = state.isAdaptive ? (state.adaptiveEffectiveDiff || "medium") : state.difficulty;
  const cfg      = SENTENCE_RUSH_CONFIG[activeDiff] || SENTENCE_RUSH_CONFIG.easy;
  const levelCfg = cfg.levels[state.level] || cfg.levels[0];

  const text   = _pickSentence(state.difficulty, state.level, state);
  const words  = text.split(" ");
  const layout = computeSentenceLayout(words, canvasW);

  // Strip is fixed at x=20 (left-aligned with 20px margin)
  const x = 20, y = -layout.h;

  state.activeLine = createLine(
    state.nextLineId++,
    words,
    layout.wordLayouts,
    x, y,
    levelCfg.fallSpeed,
    layout.w, layout.h
  );
}
