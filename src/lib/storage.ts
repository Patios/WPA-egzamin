import type { OptionId } from "@/data/questions";

export type QuestionProgress = {
  correct: number;
  wrong: number;
  last: "correct" | "wrong";
};

export type ProgressMap = Record<number, QuestionProgress>;

export type ExamAnswer = {
  questionId: number;
  chosen: OptionId;
};

export type ExamResult = {
  id: string;
  finishedAt: string;
  correct: number;
  total: number;
  passed: boolean;
  answers: ExamAnswer[];
};

export type ActiveExam = {
  questionIds: number[];
  answers: Partial<Record<number, OptionId>>;
  index: number;
  status: "running" | "done";
  recorded: boolean;
  finishedAt?: string;
};

const PROGRESS_KEY = "wpa-progress-v1";
const EXAMS_KEY = "wpa-exams-v1";
const ACTIVE_KEY = "wpa-active-exam-v1";

function readJson<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  return readJson<ProgressMap>(localStorage, PROGRESS_KEY, {});
}

export function recordAnswer(progress: ProgressMap, id: number, correct: boolean): ProgressMap {
  const previous = progress[id] ?? { correct: 0, wrong: 0, last: "wrong" as const };
  const next: ProgressMap = {
    ...progress,
    [id]: {
      correct: previous.correct + (correct ? 1 : 0),
      wrong: previous.wrong + (correct ? 0 : 1),
      last: correct ? "correct" : "wrong",
    },
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  return next;
}

export function loadExams(): ExamResult[] {
  if (typeof window === "undefined") return [];
  const exams = readJson<ExamResult[]>(localStorage, EXAMS_KEY, []);
  return Array.isArray(exams) ? exams : [];
}

export function saveExam(result: ExamResult): void {
  const exams = loadExams();
  localStorage.setItem(EXAMS_KEY, JSON.stringify([result, ...exams].slice(0, 20)));
}

export function clearStoredProgress(): void {
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(EXAMS_KEY);
  sessionStorage.removeItem(ACTIVE_KEY);
}

export function loadActiveExam(): ActiveExam | null {
  if (typeof window === "undefined") return null;
  const exam = readJson<ActiveExam | null>(sessionStorage, ACTIVE_KEY, null);
  if (!exam || !Array.isArray(exam.questionIds) || exam.questionIds.length === 0) return null;
  return exam;
}

export function saveActiveExam(exam: ActiveExam): void {
  sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(exam));
}

export function clearActiveExam(): void {
  sessionStorage.removeItem(ACTIVE_KEY);
}
