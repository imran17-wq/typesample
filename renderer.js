// ============================================================
// RENDERER — all Canvas 2D drawing + text measurement helpers
//
// measureWord()          — used by Word Rush spawner
// computeSentenceLayout()— used by Sentence Rush spawner
// render()               — main entry point, called every rAF tick
// ============================================================

// ---- Fonts ---------------------------------------------------
const FONT_WORD    = "bold 17px 'Courier New', Courier, monospace";
const FONT_SENT    = "15px 'Courier New', Courier, monospace";
const FONT_HUD     = "600 13px 'Inter', 'Segoe UI', system-ui, sans-serif";
const FONT_CALLOUT = "bold 36px 'Inter', 'Segoe UI', system-ui, sans-serif";

// ---- Layout --------------------------------------------------
const WORD_PAD_X  = 14;  // inside word block, horizontal
const WORD_PAD_Y  = 8;   // inside word block, vertical
const SENT_PAD_X  = 16;  // inside sentence strip, horizontal
const SENT_PAD_Y  = 10;  // inside sentence strip, vertical
const SENT_LINE_H = 26;  // line height within a wrapped sentence
const BLOCK_R     = 6;   // rounded-rect corner radius
const FLOOR_OFF   = 88;  // pixels from canvas bottom where words die

// ---- Colour palette ------------------------------------------
const C = {
  bg:           "#0d1117",
  grid:         "#111827",
  floor:        "#1e2d44",
  // Word Rush blocks
  wBlockBg:     "#1a2035",
  wBlockBd:     "#3a4a6b",
  wBlockBgA:    "#1e304a",  // active (locked)
  wBlockBdA:    "#5a9fff",  // active border
  // Sentence strip
  sBg:          "#141e32",
  sBd:          "#2a3d5c",
  sBdA:         "#4a8eff",  // active border
  // Text states
  tTyped:       "#5affb0",  // chars already typed correctly
  tActive:      "#ffffff",  // remaining chars on active target
  tUntyped:     "#8daed4",  // not yet reached
  tDone:        "#4ad494",  // completed words within sentence line
  tMiss:        "#ff6666",  // miss flash text
  // Effects
  laser:        "#5affb0",
  missBg:       "#3d0a0a",
  missBd:       "#ff4444",
  // HUD
  hudLbl:       "#5a7aab",
  hudVal:       "#daeaf8",
  hudCombo:     "#ffe66d",
  callout:      "#ffe66d",
  // Gun
  gunBody:      "#3a5a8f",
  gunBarrel:    "#7aaae0",
};

// ---- Hidden measurement canvas --------------------------------
let _mc = null;
function _getMC() {
  if (!_mc) _mc = document.createElement("canvas").getContext("2d");
  return _mc;
}

/**
 * Measure the bounding box of a word block.
 * @param   {string} text
 * @returns {{w:number, h:number}}
 */
function measureWord(text) {
  const ctx = _getMC();
  ctx.font  = FONT_WORD;
  return {
    w: Math.ceil(ctx.measureText(text).width + WORD_PAD_X * 2),
    h: Math.ceil(17 + WORD_PAD_Y * 2),   // fixed line-height for Courier 17px
  };
}

/**
 * Pre-compute the layout for a sentence strip so word positions are
 * known at spawn time and reused every frame without re-measuring.
 *
 * @param   {string[]} words     array of words (no punctuation)
 * @param   {number}   canvasW   logical canvas width
 * @returns {{ w:number, h:number, wordLayouts:{x,y,w}[] }}
 */
function computeSentenceLayout(words, canvasW) {
  const ctx    = _getMC();
  ctx.font     = FONT_SENT;
  const stripW = canvasW - 40;   // 20px margin each side
  const spaceW = ctx.measureText(" ").width;
  const layouts = [];
  let cx = SENT_PAD_X, cy = SENT_PAD_Y;

  for (const word of words) {
    const ww = ctx.measureText(word).width;
    if (cx + ww > stripW - SENT_PAD_X && cx > SENT_PAD_X) {
      // Wrap to next line
      cx  = SENT_PAD_X;
      cy += SENT_LINE_H;
    }
    layouts.push({ x: cx, y: cy, w: ww });
    cx += ww + spaceW;
  }

  return {
    w:           stripW,
    h:           cy + SENT_LINE_H + SENT_PAD_Y,
    wordLayouts: layouts,
  };
}

// ==============================================================
// MAIN RENDER ENTRY
// ==============================================================
function render(ctx, state, W, H, fps = 60) {
  // 1. Background + grid
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  _drawGrid(ctx, W, H);

  // 2. Floor separator line
  const floorY = H - FLOOR_OFF;
  ctx.save();
  ctx.strokeStyle = C.floor; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(W, floorY); ctx.stroke();
  ctx.restore();

  // 3. Gun position (always bottom-centre)
  const gunX = W / 2, gunY = H - 12;

  // 4. Compute aim angle
  let aimAngle = -Math.PI / 2;   // default: straight up
  if (state.mode === "wordRush") {
    const locked = state.activeWordId !== null
      ? state.words.find(w => w.id === state.activeWordId)
      : null;
    if (locked && locked.alive) {
      aimAngle = Math.atan2(locked.y + locked.h / 2 - gunY, locked.x + locked.w / 2 - gunX);
    }
  } else {
    const line = state.activeLine;
    if (line && line.alive) {
      aimAngle = Math.atan2(line.y + line.h / 2 - gunY, line.x + line.w / 2 - gunX);
    }
  }

  // 5. Barrel tip (laser origin)
  const BARREL_REACH = 22 + 44 / 2;   // GUN_BARREL_LEN + GUN_H/2
  const btX = gunX + Math.cos(aimAngle) * BARREL_REACH;
  const btY = gunY + Math.sin(aimAngle) * BARREL_REACH;

  // 6. Assign laser origins on the frame they're first drawn
  for (const l of state.lasers) {
    if (l.needsOrigin) { l.x1 = btX; l.y1 = btY; l.needsOrigin = false; }
  }

  // 7. Draw effects (behind content)
  _drawLasers(ctx, state.lasers);
  _drawMissFlashes(ctx, state.missFlashes);

  // 8. Draw mode-specific game content
  if (state.mode === "wordRush") {
    _drawWordRushContent(ctx, state);
  } else {
    _drawSentenceRushContent(ctx, state);
  }

  // 9. Particles (over content)
  _drawParticles(ctx, state.particles);

  // 10. Gun silhouette
  _drawGun(ctx, gunX, gunY, aimAngle);

  // 11. HUD
  _drawHUD(ctx, state, W, H);

  // 12. Level-up callout
  if (state.levelUpCallout) _drawCallout(ctx, state.levelUpCallout, W, H);

  // 13. Paused Overlay
  if (state.isPaused) {
    _drawPauseOverlay(ctx, state, W, H);
  }

  // 14. Dev Debug Overlay
  if (state.isDebug) {
    _drawDebugOverlay(ctx, state, W, H, fps);
  }
}

function _drawPauseOverlay(ctx, state, W, H) {
  ctx.save();
  ctx.fillStyle = "rgba(13, 17, 23, 0.75)";
  ctx.fillRect(0, 0, W, H);

  const boxW = 320, boxH = 140;
  const boxX = (W - boxW) / 2, boxY = (H - boxH) / 2;

  ctx.fillStyle = "rgba(22, 31, 48, 0.95)";
  _roundRect(ctx, boxX, boxY, boxW, boxH, 12);
  ctx.fill();

  ctx.strokeStyle = "#4a8eff";
  ctx.lineWidth = 2;
  _roundRect(ctx, boxX, boxY, boxW, boxH, 12);
  ctx.stroke();

  ctx.font = "bold 28px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f0f8ff";
  ctx.fillText("PAUSED", W / 2, boxY + 45);

  const resumeHint = state.mode === "wordRush"
    ? "Press P or Space to resume"
    : "Press P to resume";

  ctx.font = "14px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#8daed4";
  ctx.fillText(resumeHint, W / 2, boxY + 95);

  ctx.restore();
}

function _drawDebugOverlay(ctx, state, W, H, fps) {
  ctx.save();
  ctx.font = "11px 'Courier New', monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const activeWord = state.activeWordId !== null && state.words
    ? state.words.find(w => w.id === state.activeWordId)
    : null;
  const targetText = activeWord ? activeWord.text : "none";
  const activeCount = state.mode === "wordRush"
    ? state.words.filter(w => w.alive).length
    : (state.activeLine ? 1 : 0);

  const effectiveDiff = state.isAdaptive ? (state.adaptiveEffectiveDiff || "medium") : state.difficulty;

  const lines = [
    `FPS: ${fps}`,
    `Active Items: ${activeCount}`,
    `Target: ${targetText}`,
    `Mode: ${state.mode}`,
    `Difficulty: ${state.difficulty}${state.isAdaptive ? ` (${effectiveDiff})` : ""}`,
    `Level: ${state.level + 1}`
  ];

  const pad = 10, lineHeight = 16;
  const boxW = 190, boxH = lines.length * lineHeight + 14;
  const boxX = W - boxW - 14, boxY = H - boxH - 14;

  ctx.fillStyle = "rgba(13, 17, 23, 0.88)";
  _roundRect(ctx, boxX, boxY, boxW, boxH, 6);
  ctx.fill();
  ctx.strokeStyle = "#5affb0";
  ctx.lineWidth = 1;
  _roundRect(ctx, boxX, boxY, boxW, boxH, 6);
  ctx.stroke();

  ctx.fillStyle = "#5affb0";
  lines.forEach((line, i) => {
    ctx.fillText(line, boxX + pad, boxY + pad + i * lineHeight);
  });

  ctx.restore();
}

// ==============================================================
// WORD RUSH CONTENT
// ==============================================================
function _drawWordRushContent(ctx, state) {
  for (const word of state.words) {
    if (!word.alive && !word.fizzle) continue;
    _drawWordBlock(ctx, word, word.id === state.activeWordId);
  }
}

function _drawWordBlock(ctx, word, isActive) {
  let { x, y, w, h, text, typed, fizzle, fizzleAlpha, errorFlashTimer } = word;
  ctx.save();
  if (fizzle) ctx.globalAlpha = fizzleAlpha;

  // Frame-rate independent horizontal shake on error
  let shakeX = 0;
  if (errorFlashTimer > 0) {
    const intensity = Math.min(1, errorFlashTimer / 0.25);
    shakeX = Math.sin(errorFlashTimer * 50) * 4 * intensity;
  }
  x += shakeX;

  // Subtle glow on active target
  if (isActive && !fizzle) {
    ctx.shadowColor = "#5a9fff";
    ctx.shadowBlur = 10;
  }

  // Background
  if (errorFlashTimer > 0) {
    ctx.fillStyle = "#3d1015"; // subtle red error tint
  } else {
    ctx.fillStyle = isActive ? C.wBlockBgA : C.wBlockBg;
  }
  _roundRect(ctx, x, y, w, h, BLOCK_R); ctx.fill();

  // Reset shadow for crisp border and text rendering
  ctx.shadowBlur = 0;

  // Border
  if (errorFlashTimer > 0) {
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth   = 2;
  } else if (isActive) {
    ctx.strokeStyle = C.wBlockBdA;
    ctx.lineWidth   = 2;
  } else {
    ctx.strokeStyle = C.wBlockBd;
    ctx.lineWidth   = 1;
  }
  _roundRect(ctx, x, y, w, h, BLOCK_R); ctx.stroke();

  // Progress Bar Accent Line on active target
  if (isActive && !fizzle && text.length > 0) {
    const progressRatio = Math.min(1, typed / text.length);
    if (progressRatio > 0) {
      ctx.fillStyle = C.tTyped;
      const barH = 3;
      const barY = y + h - barH - 2;
      const barW = (w - 8) * progressRatio;
      _roundRect(ctx, x + 4, barY, barW, barH, 1.5);
      ctx.fill();
    }
  }

  // Text
  ctx.font = FONT_WORD; ctx.textBaseline = "middle";
  const tx = x + WORD_PAD_X, ty = y + h / 2;
  const typedStr   = text.slice(0, typed);
  const untypedStr = text.slice(typed);

  if (typedStr) {
    ctx.fillStyle = C.tTyped;
    ctx.fillText(typedStr, tx, ty);
  }
  ctx.fillStyle = isActive ? C.tActive : C.tUntyped;
  ctx.fillText(untypedStr, tx + ctx.measureText(typedStr).width, ty);

  ctx.restore();
}

// ==============================================================
// SENTENCE RUSH CONTENT
// ==============================================================
function _drawSentenceRushContent(ctx, state) {
  const line = state.activeLine;
  if (!line) return;
  if (!line.alive && !line.fizzle) return;
  _drawLineBlock(ctx, line);
}

function _drawLineBlock(ctx, line) {
  let { x, y, w, h, fizzle, fizzleAlpha, errorFlashTimer } = line;
  ctx.save();
  if (fizzle) ctx.globalAlpha = fizzleAlpha;

  // Frame-rate independent horizontal shake on error
  let shakeX = 0;
  if (errorFlashTimer > 0) {
    const intensity = Math.min(1, errorFlashTimer / 0.25);
    shakeX = Math.sin(errorFlashTimer * 50) * 4 * intensity;
  }
  x += shakeX;

  // Subtle glow on active sentence line
  if (line.alive && !fizzle) {
    ctx.shadowColor = "#4a8eff";
    ctx.shadowBlur = 8;
  }

  // Strip background
  if (errorFlashTimer > 0) {
    ctx.fillStyle = "#3d1015";
  } else {
    ctx.fillStyle = C.sBg;
  }
  _roundRect(ctx, x, y, w, h, BLOCK_R); ctx.fill();

  // Reset shadow for border & text rendering
  ctx.shadowBlur = 0;

  // Strip border
  if (errorFlashTimer > 0) {
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth   = 2;
  } else {
    ctx.strokeStyle = line.alive ? C.sBdA : C.sBd;
    ctx.lineWidth   = 1.5;
  }
  _roundRect(ctx, x, y, w, h, BLOCK_R); ctx.stroke();

  // Per-word colouring
  ctx.font = FONT_SENT; ctx.textBaseline = "middle";

  line.words.forEach((word, i) => {
    const lyt = line.wordLayouts[i];
    const wx  = x + lyt.x;
    const wy  = y + lyt.y + SENT_LINE_H / 2;

    if (i < line.wordIdx) {
      // Fully typed — done colour
      ctx.fillStyle = C.tDone;
      ctx.fillText(word, wx, wy);

    } else if (i === line.wordIdx) {
      // Currently active word — add subtle highlight box behind current target word
      if (line.alive && !fizzle) {
        const wordW = ctx.measureText(word).width;
        ctx.fillStyle = errorFlashTimer > 0 ? "rgba(255, 68, 68, 0.28)" : "rgba(74, 142, 255, 0.18)";
        _roundRect(ctx, wx - 3, wy - SENT_LINE_H / 2 + 2, wordW + 6, SENT_LINE_H - 4, 4);
        ctx.fill();
      }

      const typed    = word.slice(0, line.charProgress);
      const untyped  = word.slice(line.charProgress);
      if (typed) {
        ctx.fillStyle = C.tTyped;
        ctx.fillText(typed, wx, wy);
      }
      ctx.fillStyle = C.tActive;
      ctx.fillText(untyped, wx + ctx.measureText(typed).width, wy);

    } else {
      // Future words
      ctx.fillStyle = C.tUntyped;
      ctx.fillText(word, wx, wy);
    }
  });

  ctx.restore();
}

// ==============================================================
// SHARED EFFECTS
// ==============================================================
function _drawParticles(ctx, particles) {
  ctx.save();
  for (const p of particles) {
    if (p.alpha <= 0) continue;
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function _drawLasers(ctx, lasers) {
  ctx.save();
  ctx.lineWidth = 2;
  for (const l of lasers) {
    if (l.alpha <= 0) continue;
    ctx.globalAlpha = l.alpha;
    ctx.strokeStyle = C.laser;
    ctx.shadowColor = C.laser;
    ctx.shadowBlur  = 8;
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

function _drawMissFlashes(ctx, flashes) {
  ctx.save();
  for (const f of flashes) {
    if (f.alpha <= 0) continue;
    ctx.globalAlpha = f.alpha;
    ctx.fillStyle   = C.missBg;
    _roundRect(ctx, f.x, f.y, f.w, f.h, BLOCK_R); ctx.fill();
    ctx.strokeStyle = C.missBd; ctx.lineWidth = 1.5;
    _roundRect(ctx, f.x, f.y, f.w, f.h, BLOCK_R); ctx.stroke();
    ctx.fillStyle    = C.tMiss;
    ctx.font         = FONT_WORD;
    ctx.textBaseline = "middle";
    // Truncate long sentence flash text
    const txt = f.text.length > 42 ? f.text.slice(0, 42) + "…" : f.text;
    ctx.fillText(txt, f.x + WORD_PAD_X, f.y + f.h / 2);
  }
  ctx.restore();
}

// ==============================================================
// GUN SILHOUETTE
// ==============================================================
const GUN_W = 32, GUN_H = 44, GUN_BARREL_LEN = 22, GUN_BARREL_W = 6;

function _drawGun(ctx, bx, by, angle) {
  ctx.save();
  ctx.translate(bx, by);

  // Body (does not rotate)
  ctx.fillStyle = C.gunBody;
  ctx.fillRect(-10, -14, 7, 14);    // left leg
  ctx.fillRect(3,   -14, 7, 14);    // right leg
  ctx.fillRect(-12, -30, 24, 18);   // torso
  ctx.beginPath(); ctx.arc(0, -36, 9, 0, Math.PI * 2); ctx.fill(); // head

  // Barrel (rotates to aim)
  ctx.rotate(angle + Math.PI / 2);  // offset because 0° is →, we want ↑
  ctx.fillStyle = C.gunBarrel;
  ctx.fillRect(-GUN_BARREL_W / 2, -(GUN_H / 2 + GUN_BARREL_LEN), GUN_BARREL_W, GUN_BARREL_LEN);
  ctx.fillRect(-GUN_W / 2, -GUN_H / 2, GUN_W, GUN_H);

  ctx.restore();
}

// ==============================================================
// HUD OVERLAY
// ==============================================================
function _drawHUD(ctx, state, W, H) {
  const wpm    = _computeWPM(state);
  const acc    = _computeAccuracy(state);
  const diff   = state.difficulty[0].toUpperCase() + state.difficulty.slice(1);
  const mLabel = state.mode === "wordRush" ? "Word Rush" : "Sentence Rush";
  const lv     = state.level + 1;

  ctx.save();
  ctx.font = FONT_HUD; ctx.textBaseline = "top";
  const pad = 14, rowH = 20;

  // ---- Left panel: score / best / wpm / accuracy ----
  const leftRows = [
    ["Score",    state.score.toLocaleString()],
    ["Best",     state.bestScore.toLocaleString()],
    ["WPM",      String(wpm)],
    ["Accuracy", acc + "%"],
  ];
  const LP = { x: pad - 6, y: pad - 6, w: 212, h: leftRows.length * rowH + 10 };
  ctx.fillStyle = "rgba(13,17,23,0.80)";
  _roundRect(ctx, LP.x, LP.y, LP.w, LP.h, 6); ctx.fill();

  let ry = pad;
  for (const [lb, val] of leftRows) {
    ctx.fillStyle = C.hudLbl; ctx.textAlign = "left";  ctx.fillText(lb,  pad,         ry);
    ctx.fillStyle = C.hudVal; ctx.textAlign = "right"; ctx.fillText(val, pad + LP.w - 6, ry);
    ry += rowH;
  }

  // ---- Right panel: combo / mode / difficulty+level ----
  const rightRows = [
    ["Combo", state.combo > 0 ? `x${state.combo}` : "—"],
    ["Mode",  mLabel],
    ["Level", `${diff}  Lv ${lv}`],
  ];
  const rpW = 230, right = W - pad;
  ctx.fillStyle = "rgba(13,17,23,0.80)";
  _roundRect(ctx, right - rpW, pad - 6, rpW + 6, rightRows.length * rowH + 10, 6); ctx.fill();

  ry = pad;
  for (const [lb, val] of rightRows) {
    ctx.fillStyle = C.hudLbl; ctx.textAlign = "left";  ctx.fillText(lb,  right - rpW + 2, ry);
    ctx.fillStyle = lb === "Combo" && state.combo > 1 ? C.hudCombo : C.hudVal;
    ctx.textAlign = "right"; ctx.fillText(val, right, ry);
    ry += rowH;
  }

  ctx.restore();
}

// ==============================================================
// LEVEL-UP CALLOUT
// ==============================================================
function _drawCallout(ctx, callout, W, H) {
  if (callout.alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha  = callout.alpha;
  ctx.font         = FONT_CALLOUT;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle    = C.callout;
  ctx.shadowColor  = C.callout;
  ctx.shadowBlur   = 20;
  ctx.fillText(callout.text, W / 2, H / 2 - 40 + callout.y);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ==============================================================
// UTILITY
// ==============================================================
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x, y + r);      ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

function _drawGrid(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.restore();
}

function _computeWPM(state) {
  const mins = (performance.now() - state.startTime) / 60000;
  if (mins < 0.01) return 0;
  return Math.round((state.correctKeys / 5) / mins);
}

function _computeAccuracy(state) {
  if (state.totalKeys === 0) return 100;
  return Math.round((state.correctKeys / state.totalKeys) * 100);
}

// Expose stat helpers for the summary screen
function computeWPM(state) { return _computeWPM(state); }
function computeAccuracy(state) { return _computeAccuracy(state); }
