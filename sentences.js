// ============================================================
// SENTENCE BANKS — curated for keyboard-reach pedagogy
//
// All sentences are lowercase, no punctuation (typed character-for-
// character). Within each tier, entries are ordered lighter→heavier
// reach-density so subset sampling gives beginners the easier lines.
//
// Easy   — 8-12 words, lighter reach-density
// Medium — 12-20 words, moderate reach-density
// Hard   — 20-30 words, heavy reach-density
// ============================================================

const SENTENCE_BANKS = {

  // ----------------------------------------------------------
  // EASY — 22 sentences, 8-12 words, front 12 = levels 1-3
  // ----------------------------------------------------------
  easy: [
    // 8-9 words (first 12 — used at levels 1-3)
    "quality work requires careful coordination between your fingers",
    "quick work helps your typing speed improve over time",
    "power through every problem you face when typing quickly",
    "write back when you know which version works right",
    "people who practice typing often improve quite quickly",
    "practice typing every day and your overall speed will grow",
    "try your best to be quick and quite accurate",
    "your fingers improve quickly when you push to reach",
    "write exactly what you see without worrying about speed",
    "working through problems quickly builds your overall keyboard skill",
    "every keyboard exercise should push your fingers quite a bit further",
    "quite a few words require your fingers to move very far",
    // 10-12 words (levels 4-5 lean toward these)
    "move your fingers quickly across every row of the keyboard",
    "require yourself to type without looking down at your keyboard",
    "improve your typing by working through quite difficult word patterns",
    "you will type quite well after practicing with focus every week",
    "write down your progress and quite often review your results",
    "fix every mistake before you move forward to the next word",
    "people often improve their typing through quite simple focused practice",
    "good work requires focus and quite a bit of daily practice",
    "know where your fingers should travel for every letter you type",
    "power users improve their keyboard reach through quite regular practice",
  ],

  // ----------------------------------------------------------
  // MEDIUM — 20 sentences, 12-20 words, front 10 = levels 1-3
  // ----------------------------------------------------------
  medium: [
    // 12-14 words (first 10 — used at levels 1-3)
    "quick review of your previous project requires quite careful work before moving forward",
    "write back whenever you figure out exactly which version works properly across browsers",
    "your keyboard requires wider finger movement when typing complex words quite carefully",
    "execute the previous workflow correctly and verify every output value you encounter",
    "power users always optimize their keyboard performance by recognizing which movements require practice",
    "type quickly without worrying too much about every mistake because accuracy improves naturally",
    "maximum performance often requires you to push beyond your previous limits while maintaining accuracy",
    "complex projects require very precise coordination between multiple teams working toward a common objective",
    "the browser correctly retrieved your request but the network connection timed out before completing",
    "working through problems methodically requires patience persistence proper planning and quite a bit of practice",
    // 15-20 words (levels 4-5 lean toward these)
    "whether quality work requires more precise coordination between your fingers is quite often overlooked",
    "require yourself to practice typing beyond your comfortable zone by working through trickier combinations",
    "knowing where your fingers travel across the keyboard improves your overall typing speed quite noticeably",
    "improve your current approach by reviewing every problem carefully before you execute any permanent changes",
    "question every previous assumption before you execute permanent changes across your entire working system today",
    "between every project update and quarterly review your workflow requires quite a bit of coordinated organization",
    "quality software requires proper documentation version control and thorough review before every public release",
    "people working remotely quite often overlook important security requirements between network updates and software patches",
    "your previous keyboard workout covered quite a variety of combinations requiring wider and more difficult finger movement",
    "expect quite rapid improvement in your typing accuracy once you practice reaching toward outer keyboard zones",
  ],

  // ----------------------------------------------------------
  // HARD — 20 sentences, 20-30 words, front 10 = levels 1-3
  // ----------------------------------------------------------
  hard: [
    // 20-24 words (first 10 — used at levels 1-3)
    "quick review of your previous project requires quite careful work before moving forward with any major system or workflow changes",
    "write back whenever you figure out exactly which browser version works properly across every environment without compromising your security requirements",
    "your keyboard requires quite wider finger movement when typing complex words that combine top row bottom row and outer keys frequently",
    "execute the previous workflow correctly verify every output value then report whatever problems you encounter before requesting final approval from your manager",
    "power users always optimize their keyboard performance by quickly recognizing which finger movements require extra practice and then repeating those movements",
    "type quickly without worrying too much about every mistake because your accuracy quite naturally improves over time with focused deliberate practice",
    "maximum performance often requires you to push beyond your previous typing limits while quite carefully maintaining accuracy throughout every single word you encounter",
    "complex projects often require very precise coordination between multiple teams working toward a common quarterly objective with proper review at every checkpoint",
    "question every previous assumption before you execute permanent changes across your entire working system because incorrect modifications quickly propagate through multiple dependencies",
    "quality software development requires proper documentation version control clear communication and quite thorough review before every public release to minimize unexpected problems",
    // 25-30 words (levels 4-5 lean toward these)
    "people working remotely quite often overlook important security requirements between network updates and software patches which can quite quickly expose critical system vulnerabilities",
    "whether you believe it or not quality work usually requires more precise coordination between your fingers your eyes and your entire working memory at all times",
    "require yourself to practice typing beyond your comfortable zone by working through trickier combinations of letters that span across every single row of your keyboard",
    "knowing where your fingers travel quite noticeably improves your overall typing speed and accuracy within just a few weeks of focused and deliberate daily practice",
    "improve your current approach by carefully reviewing every problem before you execute any permanent overwrites or modifications to your existing workflow and project structure",
    "between every project update and quarterly review your workflow requires quite a bit of coordinated organization careful documentation and thorough verification of every expected output",
    "the browser correctly retrieved your previous request but the network connection timed out before completing the transfer because your maximum retry configuration limit was exceeded",
    "your previous keyboard workout covered quite a variety of letter combinations that required wider and more uncomfortable finger movement well beyond the standard home row position",
    "working through problems methodically requires patience persistence proper planning quite a bit of focused practice and excellent coordination between your fingers and your entire working memory",
    "expect quite rapid improvement in your typing accuracy and overall keyboard speed once you become quite comfortable reaching toward outer zones and corner keys on every single row",
  ],
};

// Front-slice split per difficulty (levels 1-3 draw from front portion only)
const SENTENCE_BANK_SPLIT = {
  easy:   12,
  medium: 10,
  hard:   10,
};
