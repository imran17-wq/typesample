// ============================================================
// WORD BANKS — curated for typing pedagogy
//
// Easy:   home-row biased, high-frequency, alternating-hand
// Medium: moderate reaches, some pinky / top-row usage
// Hard:   pinky-heavy, corner keys, bottom-row + row-jump stress
//
// Within each array, entries are ordered easiest→hardest so that
// subset sampling (levels 1-3 = front, levels 4-5 = full) works.
// ============================================================

const WORD_BANKS = {

  // ----------------------------------------------------------
  // EASY — 60 words, mostly home-row, very high frequency
  // ----------------------------------------------------------
  easy: [
    // Core (levels 1-3 draw from here — front 40)
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
    "her", "was", "one", "our", "day", "get", "has", "him", "new", "now",
    "old", "see", "way", "who", "did", "let", "put", "say", "she", "too",
    "use", "run", "fun", "sun", "cat", "dog", "red", "bed", "big", "sit",
    // Extended (levels 4-5 pull from the full 60)
    "hot", "top", "map", "hat", "bad", "sad", "ask", "air", "fit", "fly",
    "got", "leg", "log", "mad", "net", "pen", "pot", "rat", "row", "web",
  ],

  // ----------------------------------------------------------
  // MEDIUM — 72 words, moderate reaches, pinky + top-row mix
  // ----------------------------------------------------------
  medium: [
    // Moderate reach (levels 1-3 draw from front 37)
    "quick", "quiet", "quite", "queen", "pixel", "jumbo", "extra", "exact",
    "lucky", "pizza", "zebra", "world", "happy", "water", "light", "music",
    "plant", "window", "purple", "orange", "yellow", "pencil", "wallet",
    "bottle", "camera", "pocket", "mixer", "garden", "market", "forest",
    "boxer", "gravy", "input", "jelly", "judge", "kayak", "label",
    // Harder half (levels 4-5 lean toward these)
    "major", "motor", "mouth", "novel", "photo", "pilot", "power", "quest",
    "radio", "rocky", "scene", "scope", "seven", "shake", "sharp", "shoot",
    "sight", "skill", "small", "squad", "tower", "write", "yield", "young",
    "brave", "crisp", "curve", "cycle", "draft", "drive", "entry", "event",
    "field", "focus", "force", "frame", "globe", "grace", "grain", "group",
    "guide", "pride", "print", "proof", "prose", "purse", "reply", "risky",
    "rough", "round", "route", "royal", "troop", "truck", "virus", "whole",
    "buyer", "civic", "exist", "flute", "groan", "grove", "query", "scope",
  ],

  // ----------------------------------------------------------
  // HARD — 65 words, stresses pinky, corner keys, row-jumps
  // ----------------------------------------------------------
  hard: [
    // Moderate-hard (levels 1-3 draw from front 31)
    "zealous", "quartz", "jukebox", "oxygen", "puzzle", "mixture", "squeeze",
    "zigzag", "paradox", "jackpot", "question", "maximize", "exposure",
    "jeopardy", "zephyr", "quandary", "waxy", "jazzy", "fuzzy", "quickly",
    "exactly", "example", "examine", "extreme", "exhaust", "complex",
    "qualify", "quantity", "quarterly", "joyful", "likewise",
    // Expert tier (levels 4-5 lean toward these)
    "luxury", "buzzword", "amazing", "freezing", "waltz", "zombie",
    "grizzly", "sizzle", "dazzle", "drizzle", "exquisite", "execute",
    "explode", "explore", "exercise", "oxidize", "minimize", "vaporize",
    "euphoric", "quirky", "quiver", "fizzing", "buzzing", "puzzling",
    "perplexed", "explicit", "external", "exciting", "expected",
    "quizzed", "waxwork", "quixotic", "exuberant", "zoological",
  ],
};

// Front-slice split per difficulty (levels 1-3 use only the front portion)
const WORD_BANK_SPLIT = {
  easy:   40,
  medium: 37,
  hard:   31,
};
