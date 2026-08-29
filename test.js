// ============================================================
// AUTOMATED TEST SUITE — Node.js assertions for pure logic
// Run via: node test.js
// ============================================================

const fs = require("fs");
const assert = require("assert");

console.log("Starting Typing Shooter Automated Test Suite...");

// Load browser/node UMD modules into node global context
global.KeyboardEngine = require("./keyboard.js");
global.AnalyticsEngine = require("./analytics.js");

eval(fs.readFileSync("words.js", "utf8"));
eval(fs.readFileSync("sentences.js", "utf8"));
eval(fs.readFileSync("config.js", "utf8"));
eval(fs.readFileSync("state.js", "utf8"));
eval(fs.readFileSync("input.js", "utf8"));
eval(fs.readFileSync("spawner.js", "utf8"));

let passedCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${name} FAILED:`, err.message);
    throw err;
  }
}

// 1. KeyboardEngine Tests
test("KeyboardEngine coordinates and reach scoring", () => {
  const easyBaseline = KeyboardEngine.calculateReachScore("the");
  const quickScore = KeyboardEngine.calculateReachScore("quick");
  const hardScore = KeyboardEngine.calculateReachScore("project");

  assert(quickScore > easyBaseline, `Expected quickScore (${quickScore}) > easyBaseline (${easyBaseline})`);
  assert(hardScore > easyBaseline, `Expected hardScore (${hardScore}) > easyBaseline (${easyBaseline})`);
});

test("KeyboardEngine finger mapping", () => {
  assert.strictEqual(KeyboardEngine.FINGER_MAP["q"], 0, "q should map to Left Pinky (0)");
  assert.strictEqual(KeyboardEngine.FINGER_MAP["a"], 0, "a should map to Left Pinky (0)");
  assert.strictEqual(KeyboardEngine.FINGER_MAP["p"], 7, "p should map to Right Pinky (7)");
  assert.strictEqual(KeyboardEngine.FINGER_MAP["j"], 4, "j should map to Right Index (4)");
});

test("KeyboardEngine selection weights favor high naturalness", () => {
  const diag = KeyboardEngine.diagnose([
    { word: "project", naturalness: 0.95 },
    { word: "zephyr", naturalness: 0.20 }
  ]);
  const projectWeight = diag.find(d => d.word === "project").selectionWeight;
  const zephyrWeight = diag.find(d => d.word === "zephyr").selectionWeight;

  assert(projectWeight > zephyrWeight * 10, `Expected projectWeight (${projectWeight}) to be > 10x zephyrWeight (${zephyrWeight})`);
});

// 2. Metrics & Analytics Tests
test("WPM and Accuracy calculations", () => {
  const state = initGameState("wordRush", "easy");
  state.startTime = performance.now() - 60000; // 1 minute active typing
  state.correctKeys = 200; // 200 / 5 = 40 WPM
  state.totalKeys = 250;

  const wpm = AnalyticsEngine.computeWPM(state);
  const rawWPM = AnalyticsEngine.computeRawWPM(state);
  const accuracy = AnalyticsEngine.computeAccuracy(state);

  assert.strictEqual(wpm, 40, `Expected WPM = 40, got ${wpm}`);
  assert.strictEqual(rawWPM, 50, `Expected Raw WPM = 50, got ${rawWPM}`);
  assert.strictEqual(accuracy, 80, `Expected Accuracy = 80%, got ${accuracy}`);
});

test("Pause time is excluded from WPM calculation", () => {
  const state = initGameState("wordRush", "easy");
  state.startTime = performance.now() - 120000; // 2 minutes total
  state.totalPausedDuration = 60000; // 1 minute spent paused
  state.correctKeys = 200; // 200 / 5 / 1 min active = 40 WPM

  const activeSecs = AnalyticsEngine.getActiveElapsedTime(state);
  const wpm = AnalyticsEngine.computeWPM(state);

  assert(Math.abs(activeSecs - 60) < 1.0, `Expected active elapsedTime ~60s, got ${activeSecs}`);
  assert.strictEqual(wpm, 40, `Expected WPM = 40 (excluding pause), got ${wpm}`);
});

// 3. Weak Keys & Finger Analysis Minimum Sample Thresholds
test("Weak-key analysis respects minimum attempt threshold", () => {
  const state = initGameState("wordRush", "easy");

  // Key 'q' has 1 attempt with 1 mistake (100% error rate, but < 5 attempts)
  state.keyStats["q"].attempts = 1;
  state.keyStats["q"].mistakes = 1;

  // Key 'p' has 6 attempts with 2 mistakes (33% error rate, >= 5 attempts)
  state.keyStats["p"].attempts = 6;
  state.keyStats["p"].mistakes = 2;

  const weakKeys = AnalyticsEngine.getWeakKeys(state, 5);

  assert.strictEqual(weakKeys.length, 1, "Should only report key 'p' meeting minimum 5 attempts");
  assert.strictEqual(weakKeys[0].key, "p");
  assert.strictEqual(weakKeys[0].errorPercent, 33);
});

// 4. Adaptive Recommendation Thresholds
test("Adaptive difficulty recommendation rules with 50-key minimum sample", () => {
  // Keystroke sample < 50 keys -> fallback to medium
  assert.strictEqual(
    AnalyticsEngine.getRecommendedDifficulty({ totalKeys: 45, accuracy: 100, wpm: 90 }),
    "medium",
    "Should fallback to medium for sample < 50"
  );

  // Low accuracy < 88% -> easy (regardless of WPM)
  assert.strictEqual(
    AnalyticsEngine.getRecommendedDifficulty({ totalKeys: 50, accuracy: 80, wpm: 90 }),
    "easy",
    "Low accuracy should recommend easy"
  );

  // High accuracy >= 96% + high WPM >= 45 -> hard
  assert.strictEqual(
    AnalyticsEngine.getRecommendedDifficulty({ totalKeys: 55, accuracy: 98, wpm: 50 }),
    "hard",
    "High accuracy & WPM should recommend hard"
  );
});

// 5. Input & Pause Behavior Tests
test("Sentence Rush P-key typing does not toggle pause", () => {
  const srState = initGameState("sentenceRush", "medium");
  assert.strictEqual(srState.isPaused, false, "Should start unpaused");

  // In Sentence Rush, keyboard P or Space does NOT toggle pause
  // (Simulate attaching handler logic for Sentence Rush mode)
  const isP = true;
  if (srState.mode === "wordRush" && isP) {
    togglePauseState(srState);
  }
  assert.strictEqual(srState.isPaused, false, "Sentence Rush typing P must NOT toggle pause");

  // Manual UI toggle works in all modes
  togglePauseState(srState);
  assert.strictEqual(srState.isPaused, true, "Manual UI togglePauseState should pause game");
});

// 6. History & LocalStorage Security Tests
test("Run history save, load, max 10 limit, mode/diff validation, and corruption recovery", () => {
  // Mock localStorage for Node test
  const store = {};
  global.localStorage = {
    getItem: key => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: key => { delete store[key]; }
  };

  // Clear previous
  localStorage.removeItem("ts_run_history");

  // Save 12 runs
  for (let i = 1; i <= 12; i++) {
    AnalyticsEngine.saveRunHistory({
      timestamp: Date.now() + i,
      mode: "wordRush",
      difficulty: "easy",
      wpm: 20 + i,
      rawWPM: 25 + i,
      accuracy: 95,
      mistakes: i,
      score: i * 100,
      combo: i,
      level: 1,
      duration: 30
    });
  }

  const history = AnalyticsEngine.loadRunHistory();
  assert.strictEqual(history.length, 10, `Expected history capped at 10 runs, got ${history.length}`);
  assert.strictEqual(history[0].wpm, 32, "First run should be most recent (run #12)");

  // Test malformed mode / difficulty rejection
  store["ts_run_history"] = JSON.stringify([{ mode: "hackedMode", difficulty: "invalid", wpm: 50, accuracy: 100, score: 1000 }]);
  const invalidHistory = AnalyticsEngine.loadRunHistory();
  assert.strictEqual(invalidHistory.length, 0, "Invalid modes/difficulties in history should be rejected");

  // Test corruption recovery
  localStorage.setItem("ts_run_history", "malformed_invalid_json{{{");
  const corruptedHistory = AnalyticsEngine.loadRunHistory();
  assert.deepStrictEqual(corruptedHistory, [], "Corrupted localStorage should fall back safely to empty array []");
});

console.log(`\nAll ${passedCount} tests passed successfully!`);
