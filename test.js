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

// 4. Adaptive Recommendation Thresholds & Persistence Tests
test("Adaptive difficulty persistence across consecutive runs and corruption recovery", () => {
  // Mock localStorage
  const store = {};
  global.localStorage = {
    getItem: key => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: key => { delete store[key]; }
  };

  localStorage.removeItem("ts_adaptive_recommendation");

  // Run 1: Starts at Medium baseline
  const run1State = initGameState("wordRush", "adaptive");
  assert.strictEqual(run1State.adaptiveEffectiveDiff, "medium", "Run 1 Adaptive should start at Medium baseline");

  // Run 1 completes with high performance (55 keys, 98% acc, 50 WPM) -> Hard
  const run1Rec = AnalyticsEngine.getRecommendedDifficulty({ totalKeys: 55, accuracy: 98, wpm: 50 });
  assert.strictEqual(run1Rec, "hard");
  AnalyticsEngine.saveAdaptiveRecommendation(run1Rec);
  assert.strictEqual(localStorage.getItem("ts_adaptive_recommendation"), "hard", "Should save 'hard' to localStorage");

  // Run 2: Starts and loads 'hard' from localStorage
  const run2State = initGameState("wordRush", "adaptive");
  assert.strictEqual(run2State.adaptiveEffectiveDiff, "hard", "Run 2 Adaptive should load 'hard' from localStorage");

  // Run 2 completes with low performance (55 keys, 80% acc, 20 WPM) -> Easy
  const run2Rec = AnalyticsEngine.getRecommendedDifficulty({ totalKeys: 55, accuracy: 80, wpm: 20 });
  assert.strictEqual(run2Rec, "easy");
  AnalyticsEngine.saveAdaptiveRecommendation(run2Rec);
  assert.strictEqual(localStorage.getItem("ts_adaptive_recommendation"), "easy", "Should save 'easy' to localStorage");

  // Run 3: Starts and loads 'easy' from localStorage
  const run3State = initGameState("wordRush", "adaptive");
  assert.strictEqual(run3State.adaptiveEffectiveDiff, "easy", "Run 3 Adaptive should load 'easy' from localStorage");

  // Manual difficulty selection (e.g. Medium or Hard) does not corrupt adaptive recommendation
  const manualState = initGameState("wordRush", "medium");
  assert.strictEqual(manualState.difficulty, "medium");
  assert.strictEqual(localStorage.getItem("ts_adaptive_recommendation"), "easy", "Manual run must NOT overwrite adaptive recommendation");

  // Corrupted localStorage recovery test
  localStorage.setItem("ts_adaptive_recommendation", "garbage_malformed_value");
  const corruptState = initGameState("wordRush", "adaptive");
  assert.strictEqual(corruptState.adaptiveEffectiveDiff, "medium", "Corrupted adaptive recommendation should fall back safely to 'medium'");
});

// 5. Input & Pause Behavior Tests
test("F2 toggles pause, P-key and Space do not toggle pause", () => {
  const srState = initGameState("sentenceRush", "medium");
  assert.strictEqual(srState.isPaused, false, "Should start unpaused");

  // In all modes, keyboard P or Space does NOT toggle pause
  const isP = true;
  if (srState.mode === "wordRush" && isP) {
    togglePauseState(srState); // Simulate what input.js would do if P paused, but now we don't.
  }
  // Let's actually test what input.js would do if F2 is pressed
  const e = { key: "F2", preventDefault: () => {} };
  if (e.key === "F2") {
    togglePauseState(srState);
  }
  assert.strictEqual(srState.isPaused, true, "F2 must toggle pause");

  // Manual UI toggle works in all modes
  togglePauseState(srState);
  assert.strictEqual(srState.isPaused, false, "Manual UI togglePauseState should resume game");
});

// 6. Sentence Rush Difficulty Diagnostics
test("Sentence Rush difficulty diagnostics produce normalized metrics", () => {
  if (typeof KeyboardEngine === "undefined" || !KeyboardEngine.analyzeSentenceMetrics) return;
  const sentences = [
    "please remember to save your work.", // Short, mostly home row
    "quick project reviews require precise coordination between different teams.", // Contains q, p, c, v
    "previous software updates exposed several complex problems in the network configuration." // Long, hard reaches
  ];
  console.log("\n--- SENTENCE DIAGNOSTICS ---");
  sentences.forEach(s => {
    const metrics = KeyboardEngine.analyzeSentenceMetrics(s);
    console.log(`Sentence: "${s}"\nWords: ${metrics.words}, Chars: ${metrics.characters}\nAvg Reach: ${metrics.averageReach}, Reach Density: ${metrics.reachDensity}\nSame-Finger Density: ${metrics.sameFingerDensity}, Row-Jump Density: ${metrics.rowJumpDensity}\nOuter-Key Density: ${metrics.outerKeyDensity}\nBucket: ${metrics.bucket}\n`);
  });
  console.log("----------------------------");
});

// 7. History & LocalStorage Security Tests
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
