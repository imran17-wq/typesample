// ============================================================
// WORD BANKS — Real-World English Words with Keyboard Reach Scoring
// Depends on: keyboard.js (KeyboardEngine)
// ============================================================

const RAW_WORD_LIST = [
  // High Naturalness / High Frequency Common Words
  { word: "the", naturalness: 1.0 }, { word: "and", naturalness: 1.0 }, { word: "for", naturalness: 1.0 },
  { word: "are", naturalness: 1.0 }, { word: "but", naturalness: 1.0 }, { word: "not", naturalness: 1.0 },
  { word: "you", naturalness: 1.0 }, { word: "all", naturalness: 1.0 }, { word: "can", naturalness: 1.0 },
  { word: "had", naturalness: 1.0 }, { word: "her", naturalness: 1.0 }, { word: "was", naturalness: 1.0 },
  { word: "one", naturalness: 1.0 }, { word: "our", naturalness: 1.0 }, { word: "day", naturalness: 1.0 },
  { word: "get", naturalness: 1.0 }, { word: "has", naturalness: 1.0 }, { word: "him", naturalness: 1.0 },
  { word: "new", naturalness: 1.0 }, { word: "now", naturalness: 1.0 }, { word: "old", naturalness: 1.0 },
  { word: "see", naturalness: 1.0 }, { word: "way", naturalness: 1.0 }, { word: "who", naturalness: 1.0 },
  { word: "did", naturalness: 1.0 }, { word: "let", naturalness: 1.0 }, { word: "put", naturalness: 1.0 },
  { word: "say", naturalness: 1.0 }, { word: "she", naturalness: 1.0 }, { word: "too", naturalness: 1.0 },
  { word: "use", naturalness: 1.0 }, { word: "run", naturalness: 1.0 }, { word: "fun", naturalness: 1.0 },
  { word: "sun", naturalness: 1.0 }, { word: "cat", naturalness: 1.0 }, { word: "dog", naturalness: 1.0 },
  { word: "red", naturalness: 1.0 }, { word: "bed", naturalness: 1.0 }, { word: "big", naturalness: 1.0 },
  { word: "sit", naturalness: 1.0 }, { word: "hot", naturalness: 1.0 }, { word: "top", naturalness: 1.0 },
  { word: "map", naturalness: 1.0 }, { word: "hat", naturalness: 1.0 }, { word: "bad", naturalness: 1.0 },
  { word: "sad", naturalness: 1.0 }, { word: "ask", naturalness: 1.0 }, { word: "air", naturalness: 1.0 },
  { word: "fit", naturalness: 1.0 }, { word: "fly", naturalness: 1.0 }, { word: "got", naturalness: 1.0 },
  { word: "leg", naturalness: 1.0 }, { word: "log", naturalness: 1.0 }, { word: "mad", naturalness: 1.0 },
  { word: "net", naturalness: 1.0 }, { word: "pen", naturalness: 1.0 }, { word: "pot", naturalness: 1.0 },
  { word: "rat", naturalness: 1.0 }, { word: "row", naturalness: 1.0 }, { word: "web", naturalness: 1.0 },

  // Medium / Practical Everyday & Work Vocabulary
  { word: "world", naturalness: 0.95 }, { word: "happy", naturalness: 0.95 }, { word: "water", naturalness: 0.95 },
  { word: "light", naturalness: 0.95 }, { word: "music", naturalness: 0.95 }, { word: "plant", naturalness: 0.95 },
  { word: "window", naturalness: 0.95 }, { word: "purple", naturalness: 0.95 }, { word: "orange", naturalness: 0.95 },
  { word: "yellow", naturalness: 0.95 }, { word: "pencil", naturalness: 0.95 }, { word: "wallet", naturalness: 0.95 },
  { word: "bottle", naturalness: 0.95 }, { word: "camera", naturalness: 0.95 }, { word: "pocket", naturalness: 0.95 },
  { word: "garden", naturalness: 0.95 }, { word: "market", naturalness: 0.95 }, { word: "forest", naturalness: 0.95 },
  { word: "input", naturalness: 0.95 }, { word: "label", naturalness: 0.95 }, { word: "major", naturalness: 0.95 },
  { word: "motor", naturalness: 0.95 }, { word: "mouth", naturalness: 0.95 }, { word: "novel", naturalness: 0.95 },
  { word: "photo", naturalness: 0.95 }, { word: "pilot", naturalness: 0.95 }, { word: "power", naturalness: 0.95 },
  { word: "radio", naturalness: 0.95 }, { word: "rocky", naturalness: 0.95 }, { word: "scene", naturalness: 0.95 },
  { word: "scope", naturalness: 0.95 }, { word: "seven", naturalness: 0.95 }, { word: "shake", naturalness: 0.95 },
  { word: "sharp", naturalness: 0.95 }, { word: "shoot", naturalness: 0.95 }, { word: "sight", naturalness: 0.95 },
  { word: "skill", naturalness: 0.95 }, { word: "small", naturalness: 0.95 }, { word: "tower", naturalness: 0.95 },
  { word: "write", naturalness: 0.95 }, { word: "yield", naturalness: 0.95 }, { word: "young", naturalness: 0.95 },
  { word: "brave", naturalness: 0.95 }, { word: "crisp", naturalness: 0.95 }, { word: "curve", naturalness: 0.95 },
  { word: "cycle", naturalness: 0.95 }, { word: "draft", naturalness: 0.95 }, { word: "drive", naturalness: 0.95 },
  { word: "entry", naturalness: 0.95 }, { word: "event", naturalness: 0.95 }, { word: "field", naturalness: 0.95 },
  { word: "focus", naturalness: 0.95 }, { word: "force", naturalness: 0.95 }, { word: "frame", naturalness: 0.95 },
  { word: "globe", naturalness: 0.95 }, { word: "grace", naturalness: 0.95 }, { word: "grain", naturalness: 0.95 },
  { word: "group", naturalness: 0.95 }, { word: "guide", naturalness: 0.95 }, { word: "print", naturalness: 0.95 },
  { word: "proof", naturalness: 0.95 }, { word: "prose", naturalness: 0.95 }, { word: "round", naturalness: 0.95 },
  { word: "route", naturalness: 0.95 }, { word: "royal", naturalness: 0.95 }, { word: "truck", naturalness: 0.95 },
  { word: "virus", naturalness: 0.95 }, { word: "whole", naturalness: 0.95 },

  // Hard / Reach-Intensive Common Professional & System Words
  { word: "quick", naturalness: 0.90 }, { word: "project", naturalness: 0.90 }, { word: "previous", naturalness: 0.90 },
  { word: "review", naturalness: 0.90 }, { word: "requires", naturalness: 0.90 }, { word: "careful", naturalness: 0.90 },
  { word: "verification", naturalness: 0.90 }, { word: "maximum", naturalness: 0.90 }, { word: "performance", naturalness: 0.90 },
  { word: "workflow", naturalness: 0.90 }, { word: "environment", naturalness: 0.90 }, { word: "across", naturalness: 0.90 },
  { word: "system", naturalness: 0.90 }, { word: "browser", naturalness: 0.90 }, { word: "software", naturalness: 0.90 },
  { word: "function", naturalness: 0.90 }, { word: "execute", naturalness: 0.90 }, { word: "forward", naturalness: 0.90 },
  { word: "different", naturalness: 0.90 }, { word: "movement", naturalness: 0.90 }, { word: "keyboard", naturalness: 0.90 },
  { word: "building", naturalness: 0.90 }, { word: "development", naturalness: 0.90 }, { word: "quality", naturalness: 0.90 },
  { word: "service", naturalness: 0.90 }, { word: "updates", naturalness: 0.90 }, { word: "security", naturalness: 0.90 },
  { word: "complex", naturalness: 0.90 }, { word: "qualify", naturalness: 0.85 }, { word: "quantity", naturalness: 0.85 },
  { word: "quarterly", naturalness: 0.85 }, { word: "exposure", naturalness: 0.85 }, { word: "question", naturalness: 0.90 },
  { word: "examine", naturalness: 0.85 }, { word: "extreme", naturalness: 0.85 }, { word: "exhaust", naturalness: 0.85 },
  { word: "expected", naturalness: 0.90 }, { word: "practice", naturalness: 0.90 }, { word: "coordination", naturalness: 0.85 },
  { word: "exactly", naturalness: 0.90 }, { word: "example", naturalness: 0.90 }, { word: "likewise", naturalness: 0.80 },
  { word: "amazing", naturalness: 0.85 }, { word: "explore", naturalness: 0.90 }, { word: "exercise", naturalness: 0.90 },
  { word: "minimize", naturalness: 0.85 }, { word: "explicit", naturalness: 0.85 }, { word: "external", naturalness: 0.85 },
  { word: "exciting", naturalness: 0.85 }
];

// Dynamically generate WORD_BANKS categorized by KeyboardEngine reach score
const PROCESSED_WORD_DATA = RAW_WORD_LIST.map(item => {
  const reachScore = typeof KeyboardEngine !== "undefined"
    ? KeyboardEngine.calculateReachScore(item.word)
    : 1.5;
  const bucket = typeof KeyboardEngine !== "undefined"
    ? KeyboardEngine.getDifficultyBucket(reachScore)
    : "easy";
  return {
    word: item.word,
    naturalness: item.naturalness,
    reachScore,
    bucket
  };
});

var WORD_BANKS = {
  easy: PROCESSED_WORD_DATA
    .filter(w => w.bucket === "easy")
    .sort((a, b) => b.naturalness - a.naturalness || a.reachScore - b.reachScore)
    .map(w => w.word),

  medium: PROCESSED_WORD_DATA
    .filter(w => w.bucket === "medium")
    .sort((a, b) => b.naturalness - a.naturalness || a.reachScore - b.reachScore)
    .map(w => w.word),

  hard: PROCESSED_WORD_DATA
    .filter(w => w.bucket === "hard")
    .sort((a, b) => b.naturalness - a.naturalness || b.reachScore - a.reachScore)
    .map(w => w.word)
};

// Front-slice split per difficulty for level progression
var WORD_BANK_SPLIT = {
  easy: Math.min(40, WORD_BANKS.easy.length),
  medium: Math.min(37, WORD_BANKS.medium.length),
  hard: Math.min(31, WORD_BANKS.hard.length),
};
