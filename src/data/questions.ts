import raw from "./questions.json";

export type OptionId = "a" | "b" | "c";

export type Question = {
  id: number;
  text: string;
  citation: string | null;
  topic: string;
  options: { id: OptionId; text: string }[];
  answer: OptionId;
};

export const EXAM_SIZE = 20;
export const MAX_MISTAKES = 2;

const TOPIC_ORDER = [
  "Definicje broni i amunicji",
  "Pozwolenie i dokumenty",
  "Zakres pozwolenia",
  "Europejska karta broni",
  "Kiedy pozwolenie nie jest wymagane",
  "Wydanie i nabycie",
  "Rejestracja broni",
  "Nabycie amunicji",
  "Przesłanki i badania",
  "Odmowa pozwolenia",
  "Cofnięcie uprawnień",
  "Odebranie broni",
  "Zbycie broni",
  "Utrata uprawnień",
  "Depozyt",
  "Utrata broni",
  "Zmiana miejsca pobytu",
  "Użyczanie broni",
  "Świadectwo broni",
  "Dopuszczenie do posiadania",
  "Przechowywanie i noszenie",
  "Przewóz i wywóz",
  "Strzelnica",
  "Odpowiedzialność karna",
  "Kodeks karny",
];

export const questions = raw as Question[];

export const questionById = new Map(questions.map((question) => [question.id, question]));

export const topics = TOPIC_ORDER.filter((topic) =>
  questions.some((question) => question.topic === topic),
);

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function displayOption(text: string): string {
  return text.replace(/;\s*$/, "");
}
