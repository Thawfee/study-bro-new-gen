/* ============================================================
   Recall Check — turns the student's own notes into a quick
   multiple-choice question. Runs fully offline (no LLM / API),
   so it works at an expo with bad Wi-Fi.

   Strategies, in order of preference:
     1. "qa"     — explicit `Q: … / A: …` pairs written in a note
     2. "cloze"  — fill-in-the-blank on a key term from a note
     3. "topic"  — "which topic does this describe?" across notes
     4. "warmup" — mental-arithmetic brain wake-up (always available)
   ============================================================ */

import type { Note } from "@/types/notes";
import type { QuizQuestion } from "@/types/coach";

const STOP = new Set(
  (
    "about above after again against also because been before being below between both but " +
    "can cannot could does doing down during each from further have having here into itself just " +
    "more most much must only other over same should since some such than that their them then " +
    "there these they this those through under until very were what when where which while who " +
    "whom why will with would your yours you the and for are not too big small slow fast make " +
    "made using used uses use like each every many any all one two three four five first second"
  ).split(" "),
);

type Rng = () => number;

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function hashId(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `q_${(h >>> 0).toString(36)}`;
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Split text into sentence-ish chunks (also splits numbered checklists). */
function sentences(body: string): string[] {
  return body
    .split(/(?<=[.!?])\s+|\n+|\s(?=\d+\.\s)/)
    .map(clean)
    .filter((s) => s.length >= 18 && s.split(" ").length >= 4 && !/^[QA]\s*[:.)-]/i.test(s));
}

function words(text: string): string[] {
  return text.match(/[A-Za-z][A-Za-z0-9+#\-]*/g) ?? [];
}

function isKeyword(w: string, banned: Set<string>): boolean {
  const lw = w.toLowerCase();
  return lw.length >= 5 && !STOP.has(lw) && !banned.has(lw) && !/^\d+$/.test(w);
}

/** Score a word as a "key term": longer + technical-looking is better. */
function termScore(w: string): number {
  let score = w.length;
  if (/[A-Z]/.test(w.slice(1)) || /[+#\-]/.test(w)) score += 3; // camelCase / C++ / multi-part
  if (/(tion|ment|ance|ence|ity|ism|ics|ogy|ure|ing|ness)$/i.test(w)) score += 2; // concept nouns
  if (/ly$/i.test(w)) score -= 4; // adverbs make weak blanks
  return score;
}

function titleWords(title: string): Set<string> {
  return new Set(words(title).map((w) => w.toLowerCase()));
}

function keywordPool(notes: Note[]): string[] {
  const pool = new Map<string, string>();
  for (const n of notes) {
    const banned = titleWords(n.title);
    for (const w of words(n.body)) {
      if (isKeyword(w, banned)) pool.set(w.toLowerCase(), w);
    }
  }
  return [...pool.values()];
}

/* ------------------------------ Strategies ----------------------------- */

export interface QAPair { q: string; a: string; note: Note }

/** Card id for a Q/A pair — shared by Recall Check and the Review deck. */
export function cardId(question: string): string {
  return hashId(`qa:${question}`);
}

export function qaPairs(notes: Note[]): QAPair[] {
  const out: QAPair[] = [];
  for (const note of notes) {
    const lines = note.body.split(/\n+/).map(clean);
    for (let i = 0; i < lines.length; i++) {
      const qm = lines[i].match(/^Q\s*[:.)-]\s*(.+)$/i);
      if (!qm) continue;
      const next = lines[i + 1] ?? "";
      const am = next.match(/^A\s*[:.)-]\s*(.+)$/i);
      if (am) out.push({ q: qm[1], a: am[1], note });
    }
  }
  return out;
}

function fromQA(notes: Note[], rng: Rng, prefer: Set<string>): QuizQuestion | null {
  const pairs = qaPairs(notes);
  if (!pairs.length) return null;
  // Prefer flashcards that are due for review (spaced repetition).
  const due = pairs.filter((p) => prefer.has(cardId(p.q)));
  const pool = due.length ? due : pairs;
  const pick = pool[Math.floor(rng() * pool.length)];
  const otherAnswers = shuffle(
    pairs.filter((p) => p.a.toLowerCase() !== pick.a.toLowerCase()).map((p) => p.a),
    rng,
  );
  const distractors = [...new Set(otherAnswers)].slice(0, 3);
  if (distractors.length < 2) return null;
  const options = shuffle([pick.a, ...distractors], rng);
  return {
    id: cardId(pick.q),
    kind: "qa",
    prompt: pick.q,
    options,
    answerIndex: options.indexOf(pick.a),
    explanation: `From your note “${pick.note.title}”: ${pick.a}`,
    sourceTitle: pick.note.title,
  };
}

function fromCloze(notes: Note[], rng: Rng): QuizQuestion | null {
  const pool = keywordPool(notes);
  const candidates: { note: Note; sentence: string; term: string }[] = [];
  for (const note of notes) {
    const banned = titleWords(note.title);
    for (const sentence of sentences(note.body)) {
      if (/^Q\s*[:.)-]|^A\s*[:.)-]/i.test(sentence)) continue;
      const terms = words(sentence).filter((w) => isKeyword(w, banned));
      if (!terms.length) continue;
      const best = [...terms].sort((a, b) => termScore(b) - termScore(a))[0];
      candidates.push({ note, sentence, term: best });
    }
  }
  if (!candidates.length) return null;
  const pick = candidates[Math.floor(rng() * candidates.length)];

  const termLower = pick.term.toLowerCase();
  const distractors = shuffle(
    pool.filter((w) => w.toLowerCase() !== termLower && !pick.sentence.toLowerCase().includes(w.toLowerCase())),
    rng,
  )
    // prefer words of similar length so the answer doesn't stand out
    .sort((a, b) => Math.abs(a.length - pick.term.length) - Math.abs(b.length - pick.term.length))
    .slice(0, 3);
  if (distractors.length < 2) return null;

  const blanked = pick.sentence.replace(new RegExp(`\\b${escapeRe(pick.term)}\\b`), "_____");
  const options = shuffle([pick.term, ...distractors], rng);
  return {
    id: hashId(`cloze:${pick.sentence}:${pick.term}`),
    kind: "cloze",
    prompt: `Fill the blank (from “${pick.note.title}”):\n${blanked}`,
    options,
    answerIndex: options.indexOf(pick.term),
    explanation: `Full line: ${pick.sentence}`,
    sourceTitle: pick.note.title,
  };
}

function fromTopic(notes: Note[], rng: Rng): QuizQuestion | null {
  const usable = notes.filter((n) => sentences(n.body).length > 0);
  if (usable.length < 3) return null;
  const pick = usable[Math.floor(rng() * usable.length)];
  const banned = titleWords(pick.title);
  // Mask title words so the answer isn't given away.
  const line = sentences(pick.body)[0].replace(/[A-Za-z][A-Za-z0-9+#\-]*/g, (w) =>
    banned.has(w.toLowerCase()) && w.length > 2 ? "▢▢▢" : w,
  );
  const others = shuffle(notes.filter((n) => n.id !== pick.id).map((n) => n.title), rng);
  const distractors = [...new Set(others)].filter((t) => t !== pick.title).slice(0, 3);
  if (distractors.length < 2) return null;
  const options = shuffle([pick.title, ...distractors], rng);
  return {
    id: hashId(`topic:${pick.id}:${line}`),
    kind: "topic",
    prompt: `Which of your notes is this from?\n“${line}”`,
    options,
    answerIndex: options.indexOf(pick.title),
    explanation: `That line is from “${pick.title}”.`,
    sourceTitle: pick.title,
  };
}

function warmup(rng: Rng): QuizQuestion {
  const a = 6 + Math.floor(rng() * 14); // 6..19
  const b = 3 + Math.floor(rng() * 7); // 3..9
  const answer = a * b;
  const set = new Set<number>([answer]);
  const tweaks = shuffle([-b, b, -10, 10, -a, a, 1, -1, 2], rng);
  for (const t of tweaks) {
    if (set.size >= 4) break;
    if (answer + t > 0) set.add(answer + t);
  }
  const options = shuffle([...set].map(String), rng);
  return {
    id: hashId(`warmup:${a}x${b}`),
    kind: "warmup",
    prompt: `Brain wake-up: what is ${a} × ${b}?`,
    options,
    answerIndex: options.indexOf(String(answer)),
    explanation: `${a} × ${b} = ${answer}. Add notes (or Q:/A: lines) and Recall Check will quiz you on your own material instead.`,
    sourceTitle: null,
  };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build one recall question from the student's notes. `avoid` holds
 * recently-asked ids so the same question doesn't repeat back-to-back.
 */
export function generateQuiz(
  notes: Note[],
  avoid: string[] = [],
  rng: Rng = Math.random,
  preferIds: string[] = [],
): QuizQuestion {
  const avoidSet = new Set(avoid);
  const prefer = new Set(preferIds);
  const strategies = [
    (n: Note[], r: Rng) => fromQA(n, r, prefer),
    fromCloze,
    fromTopic,
  ];
  // Try note-based strategies a few times each, weighted to the preferred ones.
  for (let attempt = 0; attempt < 8; attempt++) {
    // Half the time keep the preferred order (own Q/A first), otherwise mix it up.
    const order = rng() < 0.5 ? strategies : shuffle(strategies, rng);
    for (const make of order) {
      const q = make(notes, rng);
      if (q && !avoidSet.has(q.id)) return q;
    }
  }
  return warmup(rng);
}
