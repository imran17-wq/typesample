// ============================================================
// INPUT HANDLER — keyboard capture for both modes
//
// Word Rush:     targeting logic (lowest matching word, lock-on)
// Sentence Rush: left-to-right word-by-word through a single line
// ============================================================

function togglePauseState(state) {
  if (!state || state.ended) return;
  state.isPaused = !state.isPaused;
  if (state.isPaused) {
    state.pauseStartTime = performance.now();
  } else {
    state.totalPausedDuration += (performance.now() - state.pauseStartTime);
    state.pauseStartTime = 0;
  }
}

function attachInputHandler(state, onRunEnd) {
  function handleKey(e) {
    if (state.ended) return;

    // Escape → end run
    if (e.key === "Escape") {
      e.preventDefault();
      onRunEnd();
      return;
    }

    // Keyboard Pause toggling:
    // F2 toggles pause in all modes.
    // P and Space are normal typing characters and MUST NOT trigger pause.
    if (e.key === "F2") {
      e.preventDefault();
      togglePauseState(state);
      return;
    }

    // When paused: ignore all typing input and do NOT count keys or mistakes
    if (state.isPaused) return;

    // Ignore non-printable and modified keys
    if (e.key.length !== 1) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    state.totalKeys++;

    if (state.mode === "wordRush") {
      _handleWordRushKey(state, e.key);
    } else {
      _handleSentenceRushKey(state, e.key);
    }
  }

  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}

/**
 * Track target key, pressed key, and finger attempts/mistakes for detailed analytics
 */
function _trackKeystroke(state, targetChar, pressedChar, isCorrect) {
  // 1. Target Key statistics (required character for weak-key practice)
  if (targetChar) {
    const tLower = targetChar.toLowerCase();
    if (state.targetKeyStats && state.targetKeyStats[tLower]) {
      state.targetKeyStats[tLower].attempts++;
      if (!isCorrect) {
        state.targetKeyStats[tLower].mistakes++;
      }
    } else if (state.keyStats && state.keyStats[tLower]) {
      state.keyStats[tLower].attempts++;
      if (!isCorrect) {
        state.keyStats[tLower].mistakes++;
      }
    }

    // Finger mapping based on target key
    if (typeof KeyboardEngine !== "undefined" && KeyboardEngine.FINGER_MAP) {
      const fingerId = KeyboardEngine.FINGER_MAP[tLower];
      if (fingerId !== undefined && state.fingerStats && state.fingerStats[fingerId]) {
        state.fingerStats[fingerId].attempts++;
        if (!isCorrect) {
          state.fingerStats[fingerId].mistakes++;
        }
      }
    }
  }

  // 2. Pressed Key statistics (actual key pressed on mistakes)
  if (pressedChar) {
    const pLower = pressedChar.toLowerCase();
    if (state.pressedKeyStats && state.pressedKeyStats[pLower]) {
      state.pressedKeyStats[pLower].attempts++;
      if (!isCorrect) {
        state.pressedKeyStats[pLower].mistakes++;
      }
    }
  }
}

// ==============================================================
// WORD RUSH INPUT
// ==============================================================
function _handleWordRushKey(state, ch) {
  // --- Already locked onto a word ---
  if (state.activeWordId !== null) {
    const word = state.words.find(w => w.id === state.activeWordId && w.alive);

    if (!word) {
      // Target disappeared — unlock and fall through to re-target
      state.activeWordId = null;
    } else {
      const expected = word.text[word.typed];
      if (ch === expected) {
        // Correct keystroke
        _trackKeystroke(state, expected, ch, true);
        state.correctKeys++;
        word.typed++;
        if (word.typed === word.text.length) {
          completeWord(state, word);
        }
      } else {
        // Wrong key while locked onto target
        _trackKeystroke(state, expected, ch, false);
        state.mistakes++;
        word.errorFlashTimer = 0.25;
        word.typed = 0;
      }
      return;
    }
  }

  // --- No active target — find lowest word whose first char matches ---
  let best = null, bestY = -Infinity;
  for (const word of state.words) {
    if (!word.alive || word.fizzle) continue;
    if (word.text[0] === ch && word.y > bestY) {
      bestY = word.y; best = word;
    }
  }

  if (best) {
    _trackKeystroke(state, ch, ch, true);
    state.correctKeys++;
    best.typed       = 1;
    state.activeWordId = best.id;
    if (best.typed === best.text.length) {
      completeWord(state, best);
    }
  } else {
    // Pressed key did not match first char of any falling word
    _trackKeystroke(state, null, ch, false);
    state.mistakes++;
  }
}

// ---- Word Rush completion / miss ---------------------------

function completeWord(state, word) {
  word.alive         = false;
  state.activeWordId = null;
  state.wordsCleared++;
  state.combo++;
  if (state.combo > state.longestCombo) state.longestCombo = state.combo;

  const earned = word.text.length * 10 * Math.max(1, state.combo);
  state.score += earned;
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    saveBest(state.mode, state.difficulty, state.score);
  }

  _checkLevelUp(state);

  // Visual effects
  const cx = word.x + word.w / 2, cy = word.y + word.h / 2;
  spawnBurst(state, cx, cy);
  state.lasers.push(createLaser(cx, cy));
}

function missWord(state, word) {
  word.alive  = false;
  word.fizzle = true;
  if (state.activeWordId === word.id) state.activeWordId = null;
  state.combo = 0;
  state.missFlashes.push(createMissFlash(word.x, word.y, word.w, word.h, word.text));
}

// ==============================================================
// SENTENCE RUSH INPUT
// ==============================================================
function _handleSentenceRushKey(state, ch) {
  const line = state.activeLine;
  if (!line || !line.alive) {
    _trackKeystroke(state, null, ch, false);
    state.mistakes++;
    return;
  }

  const expected = line.text[line.charProgress];

  if (ch === expected) {
    _trackKeystroke(state, expected, ch, true);
    state.correctKeys++;
    line.charProgress++;

    // If we just typed a space (or reached the end), we finished a word
    if (expected === " ") {
      line.wordIdx++;
    }

    if (line.charProgress === line.text.length) {
      // All characters done — complete the line
      completeLine(state, line);
    }
  } else {
    // Wrong key — count mistake, flash error feedback, reset only current word's progress
    _trackKeystroke(state, expected, ch, false);
    state.mistakes++;
    line.errorFlashTimer = 0.25;

    let wordStart = 0;
    for (let i = 0; i < line.wordIdx; i++) {
      wordStart += line.words[i].length + 1; // +1 for the space
    }
    line.charProgress = wordStart;
  }
}

// ---- Sentence Rush completion / miss -----------------------

function completeLine(state, line) {
  line.alive  = false;
  line.fizzle = true;   // triggers fadeout animation
  state.linesCleared++;
  state.combo++;
  if (state.combo > state.longestCombo) state.longestCombo = state.combo;

  const earned = line.words.length * 10 * Math.max(1, state.combo);
  state.score += earned;
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    saveBest(state.mode, state.difficulty, state.score);
  }

  _checkLevelUp(state);

  // Visual feedback — larger burst for a full sentence
  const cx = line.x + line.w / 2, cy = line.y + line.h / 2;
  spawnBurst(state, cx, cy, 28);
  state.lasers.push(createLaser(cx, cy));
}

function missLine(state, line) {
  line.alive  = false;
  line.fizzle = true;
  state.combo = 0;

  // Compact miss flash showing the first few words only
  const preview = line.words.slice(0, 5).join(" ");
  const dims    = measureWord(preview);
  state.missFlashes.push(
    createMissFlash(line.x, line.y + (line.h - dims.h) / 2, dims.w + 12, dims.h, preview)
  );
}

// ==============================================================
// SHARED
// ==============================================================
function _checkLevelUp(state) {
  if (state.level >= 4) return;   // already at max (level 5)
  if (state.score - state.lastLevelUpScore >= LEVEL_UP_SCORE_THRESHOLD) {
    state.level++;
    state.lastLevelUpScore = state.score;
    state.levelUpCallout   = createLevelUpCallout(state.level + 1);
  }
}
