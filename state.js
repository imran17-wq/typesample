// ============================================================
// STATE — game state factories and effect-object creators
// ============================================================

// ---- Top-level game state ------------------------------------

function initGameState(mode, difficulty) {
  /** Shared fields for both modes */
  const base = {
    mode,                     // "wordRush" | "sentenceRush"
    difficulty,               // "easy" | "medium" | "hard"
    level:          0,        // 0-indexed (display as 1-5)
    score:          0,
    bestScore:      getBest(mode, difficulty),
    combo:          0,
    longestCombo:   0,
    totalKeys:      0,        // every keystroke (correct + wrong)
    correctKeys:    0,        // only correctly-matched characters
    startTime:      performance.now(),
    lastLevelUpScore: 0,
    particles:      [],
    lasers:         [],
    missFlashes:    [],
    levelUpCallout: null,
    ended:          false,
  };

  if (mode === "wordRush") {
    return Object.assign(base, {
      wordsCleared:  0,
      words:         [],
      nextWordId:    0,
      activeWordId:  null,
      lastSpawnTime: 0,
    });
  } else {
    return Object.assign(base, {
      linesCleared: 0,
      activeLine:   null,   // only one line falling at a time
      nextLineId:   0,
    });
  }
}

// ---- Word Rush — word objects ---------------------------------

/**
 * @param {number} id
 * @param {string} text
 * @param {number} x      left edge in logical px
 * @param {number} y      top edge in logical px
 * @param {number} fallSpeed  px/s
 * @param {number} w      block width
 * @param {number} h      block height
 */
function createWord(id, text, x, y, fallSpeed, w, h) {
  return {
    id, text,
    typed: 0,           // correctly typed chars so far
    x, y, fallSpeed, w, h,
    alive:       true,
    fizzle:      false, // true when missed (reached bottom)
    fizzleAlpha: 1,
  };
}

// ---- Sentence Rush — line objects ----------------------------

/**
 * @param {number}   id
 * @param {string[]} words       array of plain-text words (no punctuation)
 * @param {{x,y,w}[]} wordLayouts  positions relative to strip top-left
 * @param {number}   x    left edge of strip in logical px
 * @param {number}   y    top edge of strip in logical px
 * @param {number}   fallSpeed  px/s
 * @param {number}   w    strip width
 * @param {number}   h    strip height
 */
function createLine(id, words, wordLayouts, x, y, fallSpeed, w, h) {
  return {
    id,
    words,                // string[] — each word individually
    wordLayouts,          // {x, y, w}[] — one entry per word
    wordIdx:      0,      // index of word currently being typed
    charProgress: 0,      // chars correctly typed of current word
    x, y, fallSpeed, w, h,
    alive:       true,
    fizzle:      false,
    fizzleAlpha: 1,
  };
}

// ---- Shared effect objects -----------------------------------

function createParticle(x, y, color) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 60 + Math.random() * 120;
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    alpha:  1,
    radius: 2 + Math.random() * 3,
    color,
    decay:  0.018 + Math.random() * 0.012,
  };
}

function spawnBurst(state, cx, cy, count = 18) {
  const colors = ["#7DF9FF", "#B0F8C4", "#FFFB8C", "#FF9FFF"];
  for (let i = 0; i < count; i++) {
    state.particles.push(createParticle(cx, cy, colors[i % colors.length]));
  }
}

function createLaser(x2, y2) {
  // x1/y1 are filled by the renderer once the barrel tip is known
  return { x1: 0, y1: 0, x2, y2, alpha: 1, decay: 0.06, needsOrigin: true };
}

function createMissFlash(x, y, w, h, text) {
  return { x, y, w, h, text, alpha: 1, decay: 0.022 };
}

function createLevelUpCallout(level) {
  return { text: `LEVEL ${level}`, alpha: 1, y: 0, decay: 0.012 };
}
