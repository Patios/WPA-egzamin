"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EXAM_SIZE, MAX_MISTAKES, questions, topics } from "@/data/questions";
import { countLabel } from "@/lib/plural";
import { clearStoredProgress, loadExams, loadProgress, type ExamResult, type ProgressMap } from "@/lib/storage";

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [exams, setExams] = useState<ExamResult[]>([]);

  useEffect(() => {
    setProgress(loadProgress());
    setExams(loadExams());
    setReady(true);
  }, []);

  const known = questions.filter((question) => progress[question.id]?.last === "correct").length;
  const missed = questions.filter((question) => progress[question.id]?.last === "wrong").length;
  const weakTopics = topics
    .map((topic) => {
      const inTopic = questions.filter((question) => question.topic === topic);
      const attempted = inTopic.filter((question) => progress[question.id]);
      const mastered = inTopic.filter((question) => progress[question.id]?.last === "correct");
      return { topic, total: inTopic.length, attempted: attempted.length, mastered: mastered.length };
    })
    .filter((topic) => topic.attempted > 0 && topic.mastered < topic.total)
    .sort(
      (left, right) => left.mastered / left.attempted - right.mastered / right.attempted,
    )
    .slice(0, 5);

  return (
    <div>
      <p className="text-sm font-semibold tracking-[0.14em] text-gold uppercase">
        Egzamin teoretyczny
      </p>
      <h1 className="mt-2 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl">
        Pozwolenie kolekcjonerskie na broń
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        Oficjalna pula Małopolskiej WPA: {questions.length} pytań. Na egzaminie losowanych jest{" "}
        {EXAM_SIZE}. Zaliczenie zostaje, dopóki błędów jest nie więcej niż {MAX_MISTAKES}.
      </p>

      <dl className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-5 py-5">
          <dt className="text-sm text-muted">Pytania na egzaminie</dt>
          <dd className="mt-1 font-serif text-4xl">{EXAM_SIZE}</dd>
        </div>
        <div className="px-5 py-5">
          <dt className="text-sm text-muted">Limit błędów</dt>
          <dd className="mt-1 font-serif text-4xl">{MAX_MISTAKES}</dd>
        </div>
        <div className="px-5 py-5">
          <dt className="text-sm text-muted">Próg zaliczenia</dt>
          <dd className="mt-1 font-serif text-4xl">{EXAM_SIZE - MAX_MISTAKES}/{EXAM_SIZE}</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/egzamin"
          className="inline-flex items-center justify-center rounded-full bg-forest px-6 py-3 text-center font-semibold text-paper hover:bg-forest-bright"
        >
          Rozwiąż egzamin próbny
        </Link>
        <Link
          href="/nauka"
          className="inline-flex items-center justify-center rounded-full border border-forest px-6 py-3 text-center font-semibold text-forest hover:bg-card"
        >
          Ucz się z podpowiedzią
        </Link>
        <Link
          href="/baza"
          className="inline-flex items-center justify-center rounded-full px-6 py-3 text-center font-semibold text-muted hover:text-ink"
        >
          Przeglądaj bazę
        </Link>
      </div>

      {ready && (known > 0 || missed > 0 || exams.length > 0) && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl">Twój postęp</h2>
          <p className="mt-2 text-muted">
            Ostatnio poprawnie: {known} z {questions.length}. Do powtórki:{" "}
            {countLabel(missed, "pytanie", "pytania", "pytań")}.
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-forest-bright"
              style={{ width: `${(known / questions.length) * 100}%` }}
            />
          </div>

          {exams.length > 0 && (
            <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
              {exams.slice(0, 5).map((exam) => {
                const mistakes = exam.total - exam.correct;
                return (
                  <li key={exam.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="font-semibold">
                        {exam.correct}/{exam.total}
                        <span className={exam.passed ? "text-forest-bright" : "text-fail"}>
                          {" "}
                          · {exam.passed ? "zaliczone" : "niezaliczone"}
                        </span>
                      </p>
                      <p className="text-sm text-muted">
                        {formatWhen(exam.finishedAt)} · {countLabel(mistakes, "błąd", "błędy", "błędów")}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {weakTopics.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
                Najsłabsze tematy
              </h3>
              <ul className="mt-3 space-y-2">
                {weakTopics.map((topic) => (
                  <li key={topic.topic}>
                    <Link
                      href={`/nauka?temat=${encodeURIComponent(topic.topic)}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3 hover:border-forest/40"
                    >
                      <span>{topic.topic}</span>
                      <span className="shrink-0 text-sm text-muted">
                        {topic.mastered}/{topic.attempted} sprawdzone
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            className="mt-6 text-sm text-muted underline-offset-2 hover:text-ink hover:underline"
            onClick={() => {
              if (window.confirm("Wyczyścić zapisane podejścia i postęp nauki na tym urządzeniu?")) {
                clearStoredProgress();
                setProgress({});
                setExams([]);
              }
            }}
          >
            Wyczyść postęp na tym urządzeniu
          </button>
        </section>
      )}
    </div>
  );
}
