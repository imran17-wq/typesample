// ============================================================
// SENTENCE BANKS — Curated Natural English Sentences
// Depends on: keyboard.js (KeyboardEngine.analyzeSentenceMetrics)
// ============================================================

const RAW_SENTENCES = [
  // Everyday
  "Please remember to save your work before closing the application.",
  "The weather changed suddenly, so everyone decided to leave earlier than expected.",
  "Can you send me the latest document when you have a moment?",
  "I am looking forward to our meeting next week.",
  "Don't forget to check your email for the new guidelines.",
  "It is always a good idea to double check your numbers.",
  "She asked if there was any extra coffee left in the break room.",
  "He walked to the store because his car was in the shop.",
  "Make sure to turn off the lights when you leave the office.",
  "They decided to order pizza for lunch instead of making sandwiches.",
  "The dog chased the squirrel all the way across the park.",
  "I think we have enough time to finish this before dinner.",

  // Technology
  "The browser stopped responding after the network connection was interrupted.",
  "Previous software updates exposed several complex problems in the network configuration.",
  "Quality software requires careful planning, clear communication, and thorough testing.",
  "The database server needs to be restarted after the configuration changes are applied.",
  "Please verify that the encryption key is correctly formatted.",
  "We must optimize the frontend code to reduce the overall page load time.",
  "The new API endpoint will return user data in standard JSON format.",
  "Deploying the latest build to production takes about five minutes.",
  "Always keep backups of your most important files on an external drive.",
  "The system administrator is currently updating the firewalls.",
  "You should clear your browser cache if the website is not loading properly.",
  "Machine learning models require a massive amount of training data.",
  
  // Work
  "The team reviewed the project requirements before beginning the next phase.",
  "When you start a new project, take a moment to review the details carefully.",
  "Quick project reviews require precise coordination between different teams.",
  "The quarterly financial report is due by the end of the day.",
  "Please schedule a meeting with the client to discuss the contract terms.",
  "We need to hire three new developers to meet our project deadlines.",
  "The marketing campaign was a huge success and brought in many new customers.",
  "Let's focus on completing the most urgent tasks first.",
  "Her presentation was very clear and answered all of our questions.",
  "I have attached the updated spreadsheet for your review.",
  "The manager praised the team for their hard work and dedication.",
  "We are currently evaluating several different vendors for the new software.",

  // Learning / Typing
  "Regular practice helps you become more comfortable with difficult keyboard movements.",
  "The quick brown fox jumps over the lazy dog.",
  "Typing speed increases naturally when you focus on accuracy first.",
  "Keep your hands in the correct home row position for the best results.",
  "Don't look down at your fingers while you are typing.",
  "It takes time to build muscle memory for the outer keys.",
  "A good typist rarely needs to correct mistakes.",
  "Take short breaks to rest your hands and prevent fatigue.",
  "Try to maintain a steady rhythm rather than rushing through the words.",
  "Every mistake is an opportunity to learn and improve your skills.",
  "Focus on hitting the correct keys rather than typing as fast as possible.",
  "With enough practice, your fingers will instinctively know where to go."
];

// Process sentence metrics and construct SENTENCE_BANKS
var SENTENCE_BANKS = { easy: [], medium: [], hard: [] };

if (typeof KeyboardEngine !== "undefined" && typeof KeyboardEngine.analyzeSentenceMetrics === "function") {
  RAW_SENTENCES.forEach(text => {
    const metrics = KeyboardEngine.analyzeSentenceMetrics(text);
    if (metrics.bucket === "easy") SENTENCE_BANKS.easy.push(text);
    else if (metrics.bucket === "medium") SENTENCE_BANKS.medium.push(text);
    else SENTENCE_BANKS.hard.push(text);
  });

  // Sort within buckets by averageReach (easier to harder)
  SENTENCE_BANKS.easy.sort((a, b) => KeyboardEngine.analyzeSentenceMetrics(a).averageReach - KeyboardEngine.analyzeSentenceMetrics(b).averageReach);
  SENTENCE_BANKS.medium.sort((a, b) => KeyboardEngine.analyzeSentenceMetrics(a).averageReach - KeyboardEngine.analyzeSentenceMetrics(b).averageReach);
  SENTENCE_BANKS.hard.sort((a, b) => KeyboardEngine.analyzeSentenceMetrics(a).averageReach - KeyboardEngine.analyzeSentenceMetrics(b).averageReach);
} else {
  // Fallback if KeyboardEngine is missing
  SENTENCE_BANKS.easy = RAW_SENTENCES.slice(0, 10);
  SENTENCE_BANKS.medium = RAW_SENTENCES.slice(10, 20);
  SENTENCE_BANKS.hard = RAW_SENTENCES.slice(20);
}

var SENTENCE_BANK_SPLIT = {
  easy: SENTENCE_BANKS.easy.length,
  medium: SENTENCE_BANKS.medium.length,
  hard: SENTENCE_BANKS.hard.length,
};
