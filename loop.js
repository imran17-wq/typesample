// ============================================================
// GAME LOOP — requestAnimationFrame tick with frame-rate independence
// Dispatches to mode-specific update, then calls render.
// ============================================================

let _loopHandle = null;
let _lastTime   = 0;

/**
 * Start the rAF loop and return a stop() function.
 * @param {object}   state
 * @param {HTMLCanvasElement} canvas
 * @param {Function} onRunEnd
 * @param {Function} getW   returns current logical canvas width
 * @param {Function} getH   returns current logical canvas height
 */
function startLoop(state, canvas, onRunEnd, getW, getH) {
  const ctx         = canvas.getContext("2d");
  const detachInput = attachInputHandler(state, onRunEnd);
  _lastTime = performance.now();

  function handleVisibilityChange() {
    if (!document.hidden) {
      _lastTime = performance.now(); // Reset timing baseline on tab return
    }
  }
  document.addEventListener("visibilitychange", handleVisibilityChange);

  function tick(now) {
    if (state.ended) {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      detachInput();
      return;
    }

    // Pause physics updates while tab is hidden
    if (document.hidden) {
      _lastTime = now;
      _loopHandle = requestAnimationFrame(tick);
      return;
    }

    const dt = Math.min((now - _lastTime) / 1000, 0.1); // cap at 100 ms max delta
    _lastTime = now;

    const W = getW(), H = getH();
    _update(state, dt, now, W, H);
    render(ctx, state, W, H);

    _loopHandle = requestAnimationFrame(tick);
  }

  _loopHandle = requestAnimationFrame(tick);
  return function stop() {
    if (_loopHandle) cancelAnimationFrame(_loopHandle);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    detachInput();
  };
}

// ==============================================================
// UPDATE
// ==============================================================
function _update(state, dt, now, W, H) {
  const floorY = H - FLOOR_OFF;  // FLOOR_OFF is defined in renderer.js

  if (state.mode === "wordRush") {
    _updateWordRush(state, dt, now, W, H, floorY);
  } else {
    _updateSentenceRush(state, dt, now, W, H, floorY);
  }

  _animateEffects(state, dt);
}

// ---- Word Rush update ----------------------------------------
function _updateWordRush(state, dt, now, W, H, floorY) {
  // Spawn
  trySpawnWord(state, now, W, H);

  // Move words + check floor
  for (const word of state.words) {
    if (!word.alive) continue;
    word.y += word.fallSpeed * dt;
    if (word.y + word.h >= floorY) {
      missWord(state, word);
    }
  }

  // Frame-rate independent animation updates for words (fizzle + error flash)
  for (const word of state.words) {
    if (word.fizzle) word.fizzleAlpha -= 1.8 * dt;
    if (word.errorFlashTimer > 0) {
      word.errorFlashTimer = Math.max(0, word.errorFlashTimer - dt);
    }
  }

  // Prune: keep alive words and still-fizzling words
  state.words = state.words.filter(w => w.alive || (w.fizzle && w.fizzleAlpha > 0));
}

// ---- Sentence Rush update ------------------------------------
function _updateSentenceRush(state, dt, now, W, H, floorY) {
  // Spawn if the slot is empty
  if (!state.activeLine) {
    trySpawnLine(state, W, H);
    return;
  }

  const line = state.activeLine;

  if (line.alive) {
    // Falling
    line.y += line.fallSpeed * dt;
    if (line.errorFlashTimer > 0) {
      line.errorFlashTimer = Math.max(0, line.errorFlashTimer - dt);
    }
    if (line.y + line.h >= floorY) {
      missLine(state, line);
    }
  } else if (line.fizzle) {
    // Frame-rate independent fizzle animation
    line.fizzleAlpha -= 1.8 * dt;
    if (line.fizzleAlpha <= 0) {
      state.activeLine = null;
    }
  }
}

// ---- Shared effect animations (frame-rate independent via dt) ---
function _animateEffects(state, dt) {
  // Particles
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 120 * dt;  // mild gravity
    p.alpha -= (p.decay * 60) * dt;
  }
  state.particles = state.particles.filter(p => p.alpha > 0);

  // Lasers
  for (const l of state.lasers) {
    l.alpha -= (l.decay * 60) * dt;
  }
  state.lasers = state.lasers.filter(l => l.alpha > 0);

  // Miss flashes (drift upward and fade)
  for (const f of state.missFlashes) {
    f.y     -= 28 * dt;
    f.alpha -= (f.decay * 60) * dt;
  }
  state.missFlashes = state.missFlashes.filter(f => f.alpha > 0);

  // Level-up callout (float upward and fade)
  if (state.levelUpCallout) {
    const c = state.levelUpCallout;
    c.y     -= 30 * dt;
    c.alpha -= (c.decay * 60) * dt;
    if (c.alpha <= 0) state.levelUpCallout = null;
  }
}
