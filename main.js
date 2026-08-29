// ============================================================
// MAIN — screen management and app orchestration
// ============================================================

// ---- DOM refs ------------------------------------------------
const startScreen   = document.getElementById("start-screen");
const playScreen    = document.getElementById("play-screen");
const summaryScreen = document.getElementById("summary-screen");
const canvas        = document.getElementById("game-canvas");
const endRunBtn     = document.getElementById("end-run-btn");
const controlHint   = document.getElementById("control-hint");

// ---- App state -----------------------------------------------
let logicalW = 0, logicalH = 0;
let currentMode       = "wordRush";
let currentDifficulty = "easy";
let activeState       = null;
let stopLoop          = null;

// ==============================================================
// SCREEN SWITCHER
// ==============================================================
function showScreen(id) {
  [startScreen, playScreen, summaryScreen].forEach(s =>
    s.classList.toggle("hidden", s.id !== id)
  );
}

// ==============================================================
// START SCREEN — mode + difficulty selection
// ==============================================================

// ---- Mode cards ----
document.querySelectorAll(".mode-card").forEach(card => {
  card.addEventListener("click", () => {
    currentMode = card.dataset.mode;
    document.querySelectorAll(".mode-card").forEach(c =>
      c.classList.toggle("selected", c.dataset.mode === currentMode)
    );
    _updateDiffCards();
    _updateControlHint();
  });
});

// ---- Difficulty cards ----
function _updateDiffCards() {
  document.querySelectorAll(".diff-card").forEach(card => {
    const d = card.dataset.diff;
    card.classList.toggle("selected", d === currentDifficulty);
    const bestEl = card.querySelector(".diff-best strong");
    if (bestEl) bestEl.textContent = getBest(currentMode, d).toLocaleString();
  });
}

document.querySelectorAll(".diff-card").forEach(card => {
  card.addEventListener("click", () => {
    currentDifficulty = card.dataset.diff;
    _updateDiffCards();
  });
});

// ---- Control hint updates per mode ----
function _updateControlHint() {
  if (currentMode === "wordRush") {
    controlHint.innerHTML =
      `Start typing the falling words — no click needed.&nbsp;
       Press <kbd>Esc</kbd> or <kbd>End Run</kbd> to finish a session.`;
  } else {
    controlHint.innerHTML =
      `Type each word left to right — wrong key resets the current word only.&nbsp;
       Press <kbd>Esc</kbd> or <kbd>End Run</kbd> to finish.`;
  }
}

document.getElementById("start-btn").addEventListener("click", startRun);

// ==============================================================
// DPI-AWARE CANVAS
// ==============================================================
function resizeCanvas() {
  const dpr  = window.devicePixelRatio || 1;
  logicalW   = canvas.clientWidth;
  logicalH   = canvas.clientHeight;
  canvas.width  = logicalW * dpr;
  canvas.height = logicalH * dpr;
  canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);

// ==============================================================
// RUN LIFECYCLE
// ==============================================================
function startRun() {
  showScreen("play-screen");
  requestAnimationFrame(() => {
    resizeCanvas();
    activeState = initGameState(currentMode, currentDifficulty);
    stopLoop    = startLoop(activeState, canvas, endRun, () => logicalW, () => logicalH);
  });
}

function endRun() {
  if (!activeState) return;
  activeState.ended = true;
  if (stopLoop) { stopLoop(); stopLoop = null; }
  _populateSummary(activeState);
  showScreen("summary-screen");
}

endRunBtn.addEventListener("click", endRun);

// ==============================================================
// SUMMARY SCREEN
// ==============================================================
function _populateSummary(state) {
  const wpm      = computeWPM(state);
  const acc      = computeAccuracy(state);
  const mLabel   = state.mode === "wordRush" ? "Word Rush" : "Sentence Rush";
  const diff     = state.difficulty[0].toUpperCase() + state.difficulty.slice(1);
  const best     = getBest(state.mode, state.difficulty);
  const cleared  = state.mode === "wordRush" ? state.wordsCleared : state.linesCleared;
  const clrLabel = state.mode === "wordRush" ? "Words Cleared" : "Lines Cleared";

  document.getElementById("sum-score").textContent        = state.score.toLocaleString();
  document.getElementById("sum-best").textContent         = best.toLocaleString();
  document.getElementById("sum-wpm").textContent          = wpm;
  document.getElementById("sum-acc").textContent          = acc + "%";
  document.getElementById("sum-cleared").textContent      = cleared;
  document.getElementById("sum-cleared-label").textContent = clrLabel;
  document.getElementById("sum-combo").textContent        = state.longestCombo;
  document.getElementById("sum-mistakes").textContent     = state.mistakes;
  document.getElementById("sum-level").textContent        = `${mLabel} — ${diff} — Lv ${state.level + 1}`;

  // "New best" callout when score matches the freshly saved best
  const isNewBest = state.score > 0 && state.score === best;
  document.getElementById("sum-new-best").classList.toggle("visible", isNewBest);
}

document.getElementById("btn-play-again").addEventListener("click", startRun);

document.getElementById("btn-change-mode").addEventListener("click", () => {
  _updateDiffCards();
  showScreen("start-screen");
});

// ==============================================================
// INIT
// ==============================================================
_updateDiffCards();
_updateControlHint();
showScreen("start-screen");
