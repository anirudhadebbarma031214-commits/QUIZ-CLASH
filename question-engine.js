/* QUIZ CLASH — scalable question engine
 * Uses Open Trivia DB for real questions and creates reusable parameterized
 * question variants for supported arithmetic templates. This does NOT claim
 * to contain 100 million pre-written or verified unique questions.
 * Open Trivia DB content is CC BY-SA 4.0: https://opentdb.com/
 */
(function (root) {
  "use strict";
  const API = "https://opentdb.com/api.php";
  const CACHE_KEY = "quiz-clash-question-cache-v1";
  const seen = new Set();

  function decode(text) {
    const el = document.createElement("textarea");
    el.innerHTML = String(text ?? "");
    return el.value;
  }

  function normalize(item) {
    const answers = [...(item.incorrect_answers || []), item.correct_answer]
      .map(decode);
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }
    return {
      id: hash([item.category, item.question, item.correct_answer].join("|")),
      question: decode(item.question),
      answers,
      correctAnswer: decode(item.correct_answer),
      category: decode(item.category),
      difficulty: item.difficulty || "medium",
      source: "Open Trivia DB"
    };
  }

  function hash(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  async function fetchBatch(options = {}) {
    const params = new URLSearchParams({
      amount: String(Math.min(50, Math.max(1, Number(options.amount) || 20))),
      type: options.type || "multiple",
      encode: "url3986"
    });
    if (options.category) params.set("category", String(options.category));
    if (["easy", "medium", "hard"].includes(options.difficulty)) {
      params.set("difficulty", options.difficulty);
    }
    const response = await fetch(API + "?" + params.toString());
    if (!response.ok) throw new Error("Question service is temporarily unavailable.");
    const payload = await response.json();
    if (payload.response_code === 5) throw new Error("Question service rate limit. Please wait a few seconds.");
    if (payload.response_code !== 0 || !payload.results?.length) {
      throw new Error("No questions available for these filters. Try another category or difficulty.");
    }
    const unique = payload.results.map(normalize).filter(q => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
    return unique;
  }

  // Endless play means requesting more real questions in small batches,
  // not downloading millions of records to the player's device.
  async function* questionStream(options = {}) {
    while (true) {
      const batch = await fetchBatch({ ...options, amount: options.amount || 20 });
      if (!batch.length) {
        throw new Error("This session has used all new questions returned by the provider. Change filters to continue.");
      }
      for (const question of batch) yield question;
      await new Promise(resolve => setTimeout(resolve, 5200));
    }
  }

  function makeMathQuestion(difficulty = "easy") {
    const max = difficulty === "hard" ? 1000 : difficulty === "medium" ? 100 : 20;
    const a = 1 + Math.floor(Math.random() * max);
    const b = 1 + Math.floor(Math.random() * max);
    const operations = difficulty === "hard" ? ["+", "-", "*"] : ["+", "-"];
    const op = operations[Math.floor(Math.random() * operations.length)];
    const answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
    const options = new Set([answer]);
    while (options.size < 4) {
      const offset = 1 + Math.floor(Math.random() * Math.max(10, max));
      options.add(answer + (Math.random() < 0.5 ? -offset : offset));
    }
    const answers = [...options].map(String).sort(() => Math.random() - 0.5);
    return {
      id: "math-" + hash(a + op + b + ":" + Math.random()),
      question: "What is " + a + " " + op + " " + b + "?",
      answers,
      correctAnswer: String(answer),
      category: "Mathematics",
      difficulty,
      source: "Generated arithmetic template"
    };
  }

  const engine = { fetchBatch, questionStream, makeMathQuestion };
  if (typeof module !== "undefined" && module.exports) module.exports = engine;
  root.QuizClashQuestionEngine = engine;
})(typeof globalThis !== "undefined" ? globalThis : this);
