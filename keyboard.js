// ============================================================
// KEYBOARD ENGINE — QWERTY reach scoring & difficulty engine
// ============================================================

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.KeyboardEngine = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {

  // 1. QWERTY Key Coordinates (relative physical grid)
  // Row 0: Top, Row 1: Home, Row 2: Bottom
  const KEY_COORDS = {
    // Top Row (y = 0)
    q: { x: 0.00, y: 0 }, w: { x: 1.00, y: 0 }, e: { x: 2.00, y: 0 }, r: { x: 3.00, y: 0 }, t: { x: 4.00, y: 0 },
    y: { x: 5.00, y: 0 }, u: { x: 6.00, y: 0 }, i: { x: 7.00, y: 0 }, o: { x: 8.00, y: 0 }, p: { x: 9.00, y: 0 },
    // Home Row (y = 1)
    a: { x: 0.25, y: 1 }, s: { x: 1.25, y: 1 }, d: { x: 2.25, y: 1 }, f: { x: 3.25, y: 1 }, g: { x: 4.25, y: 1 },
    h: { x: 5.25, y: 1 }, j: { x: 6.25, y: 1 }, k: { x: 7.25, y: 1 }, l: { x: 8.25, y: 1 },
    // Bottom Row (y = 2)
    z: { x: 0.75, y: 2 }, x: { x: 1.75, y: 2 }, c: { x: 2.75, y: 2 }, v: { x: 3.75, y: 2 }, b: { x: 4.75, y: 2 },
    n: { x: 5.75, y: 2 }, m: { x: 6.75, y: 2 },
  };

  // 2. QWERTY Finger Mapping
  // 0: LP (Left Pinky): Q A Z
  // 1: LR (Left Ring): W S X
  // 2: LM (Left Middle): E D C
  // 3: LI (Left Index): R F V T G B
  // 4: RI (Right Index): Y H N U J M
  // 5: RM (Right Middle): I K
  // 6: RR (Right Ring): O L
  // 7: RP (Right Pinky): P
  const FINGER_MAP = {
    q: 0, a: 0, z: 0,
    w: 1, s: 1, x: 1,
    e: 2, d: 2, c: 2,
    r: 3, f: 3, v: 3, t: 3, g: 3, b: 3,
    y: 4, h: 4, n: 4, u: 4, j: 4, m: 4,
    i: 5, k: 5,
    o: 6, l: 6,
    p: 7
  };

  // Outer / corner key set
  const OUTER_KEYS = new Set(['q', 'z', 'p', 'x', 'c', 'v', 'm', 'w']);

  /**
   * Calculate physical reach difficulty score for a single word or sentence string.
   * Higher score = physically more difficult keyboard reach/movement.
   * @param {string} text
   * @returns {number}
   */
  function calculateReachScore(text) {
    const chars = text.toLowerCase().replace(/[^a-z]/g, "");
    if (chars.length <= 1) return 1.0;

    let totalReach = 0;
    let outerCount = 0;

    for (let i = 0; i < chars.length; i++) {
      const ch1 = chars[i];
      if (OUTER_KEYS.has(ch1)) outerCount++;

      if (i > 0) {
        const ch0 = chars[i - 1];
        const pos0 = KEY_COORDS[ch0];
        const pos1 = KEY_COORDS[ch1];

        if (pos0 && pos1) {
          const f0 = FINGER_MAP[ch0];
          const f1 = FINGER_MAP[ch1];
          const hand0 = f0 <= 3 ? "L" : "R";
          const hand1 = f1 <= 3 ? "L" : "R";

          let transitionScore = 0;

          if (hand0 !== hand1) {
            // Hand alternation is comfortable for touch typing
            transitionScore = 0.3;
          } else {
            // Same hand movement — physical reach distance matters!
            const dx = pos1.x - pos0.x;
            const dy = pos1.y - pos0.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            transitionScore = dist * 1.2;

            // Same finger stretch penalty (e.g., e -> d, r -> f, c -> e)
            if (f0 !== undefined && f0 === f1 && ch0 !== ch1) {
              transitionScore += 2.0;
            }

            // 2-row jump penalty (e.g. top <-> bottom on same hand)
            const rowDiff = Math.abs(dy);
            if (rowDiff === 2) {
              transitionScore += 1.5;
            }
          }

          totalReach += transitionScore;
        }
      }
    }

    const avgReachPerChar = totalReach / (chars.length - 1);
    const outerRatio = outerCount / chars.length;

    const rawReachScore = avgReachPerChar + (outerRatio * 1.8);
    return Math.round(rawReachScore * 100) / 100;
  }

  /**
   * Categorize reach scores into difficulty buckets:
   * Easy: reachScore < 1.25
   * Medium: 1.25 <= reachScore < 2.10
   * Hard: reachScore >= 2.10
   * @param {number} reachScore
   * @returns {"easy" | "medium" | "hard"}
   */
  function getDifficultyBucket(reachScore) {
    if (reachScore < 1.25) return "easy";
    if (reachScore < 2.10) return "medium";
    return "hard";
  }

  /**
   * Calculate selection weight combining reach score and naturalness.
   * High naturalness (common words) yields significantly higher selection probability.
   * @param {string} word
   * @param {number} naturalness
   * @returns {number}
   */
  function getSelectionWeight(word, naturalness) {
    const reachScore = calculateReachScore(word);
    const nat = typeof naturalness === "number" ? naturalness : 0.9;
    const weight = Math.pow(nat, 3.0) * (0.5 + reachScore / 2.0);
    return Math.round(weight * 10000) / 10000;
  }

  /**
   * Diagnostic helper to inspect word scores, naturalness, weights, and buckets
   * @param {(string|{word:string, naturalness:number})[]} [words]
   */
  function diagnose(words) {
    const defaultList = [
      { word: "the", naturalness: 1.0 },
      { word: "quick", naturalness: 0.95 },
      { word: "project", naturalness: 0.95 },
      { word: "previous", naturalness: 0.95 },
      { word: "keyboard", naturalness: 0.95 },
      { word: "question", naturalness: 0.95 },
      { word: "maximum", naturalness: 0.90 },
      { word: "zephyr", naturalness: 0.20 },
      { word: "quixotic", naturalness: 0.15 },
      { word: "zoological", naturalness: 0.15 }
    ];
    const list = words || defaultList;

    return list.map(item => {
      const w = typeof item === "string" ? item : item.word;
      const nat = typeof item === "object" && typeof item.naturalness === "number"
        ? item.naturalness
        : 0.9;
      const reachScore = calculateReachScore(w);
      const bucket = getDifficultyBucket(reachScore);
      const selectionWeight = getSelectionWeight(w, nat);
      return { word: w, reachScore, naturalness: nat, selectionWeight, bucket };
    });
  }

  /**
   * Analyze normalized reach metrics for a complete sentence.
   * @param {string} text 
   * @returns {object}
   */
  function analyzeSentenceMetrics(text) {
    const chars = text.toLowerCase().replace(/[^a-z]/g, "");
    const wordsCount = text.split(" ").filter(w => w.length > 0).length;
    if (chars.length <= 1) {
      return { words: wordsCount, characters: text.length, averageReach: 1.0, reachDensity: 1.0, sameFingerDensity: 0, rowJumpDensity: 0, outerKeyDensity: 0, bucket: "easy" };
    }

    let totalReach = 0;
    let outerCount = 0;
    let sameFingerCount = 0;
    let rowJumpCount = 0;

    for (let i = 0; i < chars.length; i++) {
      const ch1 = chars[i];
      if (OUTER_KEYS.has(ch1)) outerCount++;

      if (i > 0) {
        const ch0 = chars[i - 1];
        const pos0 = KEY_COORDS[ch0];
        const pos1 = KEY_COORDS[ch1];

        if (pos0 && pos1) {
          const f0 = FINGER_MAP[ch0];
          const f1 = FINGER_MAP[ch1];
          const hand0 = f0 <= 3 ? "L" : "R";
          const hand1 = f1 <= 3 ? "L" : "R";

          if (hand0 !== hand1) {
            totalReach += 0.3;
          } else {
            const dx = pos1.x - pos0.x;
            const dy = pos1.y - pos0.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            let transitionScore = dist * 1.2;

            if (f0 !== undefined && f0 === f1 && ch0 !== ch1) {
              transitionScore += 2.0;
              sameFingerCount++;
            }

            const rowDiff = Math.abs(dy);
            if (rowDiff === 2) {
              transitionScore += 1.5;
              rowJumpCount++;
            }
            totalReach += transitionScore;
          }
        }
      }
    }

    const len = chars.length;
    const transitions = len - 1;
    const averageReach = totalReach / transitions;
    const reachDensity = totalReach / text.length; // per actual string char
    const sameFingerDensity = sameFingerCount / transitions;
    const rowJumpDensity = rowJumpCount / transitions;
    const outerKeyDensity = outerCount / len;

    // Sentence-level bucket classification based on normalized density and reach
    // (Sentence difficulty must not use the same raw score thresholds as individual words)
    let bucket = "easy";
    if (averageReach > 1.35 || sameFingerDensity > 0.08 || rowJumpDensity > 0.05) {
      bucket = "medium";
    }
    if (averageReach > 1.6 || sameFingerDensity > 0.13 || rowJumpDensity > 0.08 || outerKeyDensity > 0.25) {
      bucket = "hard";
    }

    return {
      words: wordsCount,
      characters: text.length,
      averageReach: Math.round(averageReach * 100) / 100,
      reachDensity: Math.round(reachDensity * 100) / 100,
      sameFingerDensity: Math.round(sameFingerDensity * 100) / 100,
      rowJumpDensity: Math.round(rowJumpDensity * 100) / 100,
      outerKeyDensity: Math.round(outerKeyDensity * 100) / 100,
      bucket
    };
  }

  return {
    KEY_COORDS,
    FINGER_MAP,
    OUTER_KEYS,
    calculateReachScore,
    getDifficultyBucket,
    getSelectionWeight,
    diagnose,
    analyzeSentenceMetrics
  };
});
