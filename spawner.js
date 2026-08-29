// ============================================================
// SPAWNER — word / sentence spawning for both modes
// Depends on:  renderer.js (measureWord, computeSentenceLayout)
//              state.js    (createWord, createLine)
//              words.js / sentences.js / config.js
// ============================================================

// ==============================================================
// WORD RUSH
// ==============================================================

function _pickWord(difficulty, levelIndex) {
  const cfg    = WORD_RUSH_CONFIG[difficulty];
  const bank   = WORD_BANKS[cfg.wordBankKey];
  const subset = cfg.levels[levelIndex].wordSubset;
  const split  = WORD_BANK_SPLIT[cfg.wordBankKey];

  // subset < 1.0 → bias toward the front (easier) portion of the bank
  const cutoff = subset < 1.0 ? Math.min(Math.floor(bank.length * subset), split) : bank.length;
  const pool   = bank.slice(0, cutoff);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Attempt to spawn a new word if slot and timer conditions are met.
 * @param {object} state
 * @param {number} now        performance.now()
 * @param {number} canvasW    logical width
 * @param {number} canvasH    logical height (unused but kept for symmetry)
 */
function trySpawnWord(state, now, canvasW, canvasH) {
  if (state.ended) return;
  const cfg      = WORD_RUSH_CONFIG[state.difficulty];
  const levelCfg = cfg.levels[state.level];

  const aliveCount = state.words.filter(w => w.alive).length;
  if (aliveCount >= levelCfg.maxWords)                        return;
  if (now - state.lastSpawnTime < levelCfg.spawnInterval)     return;

  state.lastSpawnTime = now;

  const text = _pickWord(state.difficulty, state.level);
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

function _pickSentence(difficulty, levelIndex) {
  const cfg    = SENTENCE_RUSH_CONFIG[difficulty];
  const bank   = SENTENCE_BANKS[cfg.sentenceBankKey];
  const subset = cfg.levels[levelIndex].sentenceSubset;
  const split  = SENTENCE_BANK_SPLIT[cfg.sentenceBankKey];

  const cutoff = subset < 1.0 ? Math.min(Math.floor(bank.length * subset), split) : bank.length;
  const pool   = bank.slice(0, cutoff);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Spawn the next sentence line if there is none currently active.
 * Called every update tick — immediately spawns when slot is free.
 * @param {object} state
 * @param {number} canvasW   logical width
 * @param {number} canvasH   (unused)
 */
function trySpawnLine(state, canvasW, canvasH) {
  if (state.ended)             return;
  if (state.activeLine !== null) return;

  const cfg      = SENTENCE_RUSH_CONFIG[state.difficulty];
  const levelCfg = cfg.levels[state.level];

  const text   = _pickSentence(state.difficulty, state.level);
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
