"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { OptionList } from "@/components/option-list";
import {
  EXAM_SIZE,
  MAX_MISTAKES,
  questionById,
  questions,
  shuffle,
  type OptionId,
} from "@/data/questions";
import { countLabel } from "@/lib/plural";
import {
  clearActiveExam,
  loadActiveExam,
  loadProgress,
  recordAnswer,
  saveActiveExam,
  saveExam,
  type ActiveExam,
} from "@/lib/storage";

function createExam(reveal: "end" | "immediate"): ActiveExam {
  return {
    questionIds: shuffle(questions).slice(0, EXAM_SIZE).map((question) => question.id),
    answers: {},
    index: 0,
    status: "running",
    recorded: false,
    reveal,
  };
}

function isImmediate(exam: ActiveExam): boolean {
  return exam.reveal === "immediate";
}

export default function ExamPage() {
  const [exam, setExam] = useState<ActiveExam | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setExam(loadActiveExam());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !exam) return;
    saveActiveExam(exam);
  }, [exam, ready]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [exam?.index, exam?.status]);

  const current = exam ? questionById.get(exam.questionIds[exam.index]) : undefined;
  const answeredCount = exam
    ? exam.questionIds.filter((id) => exam.answers[id]).length
    : 0;

  const score = useMemo(() => {
    if (!exam) return null;
    const correct = exam.questionIds.filter((id) => {
      const question = questionById.get(id);
      return question && exam.answers[id] === question.answer;
    }).length;
    return {
      correct,
      mistakes: exam.questionIds.length - correct,
      passed: exam.questionIds.length - correct <= MAX_MISTAKES,
    };
  }, [exam]);

  function update(next: ActiveExam) {
    setExam(next);
  }

  function finish(currentExam: ActiveExam) {
    const finished: ActiveExam = {
      ...currentExam,
      status: "done",
      finishedAt: new Date().toISOString(),
      recorded: true,
    };
    if (!currentExam.recorded) {
      const correct = finished.questionIds.filter((id) => {
        const question = questionById.get(id);
        return question && finished.answers[id] === question.answer;
      }).length;
      let progress = loadProgress();
      for (const id of finished.questionIds) {
        const question = questionById.get(id);
        const chosen = finished.answers[id];
        if (!question || !chosen) continue;
        progress = recordAnswer(progress, id, chosen === question.answer);
      }
      saveExam({
        id: finished.finishedAt ?? new Date().toISOString(),
        finishedAt: finished.finishedAt ?? new Date().toISOString(),
        correct,
        total: finished.questionIds.length,
        passed: finished.questionIds.length - correct <= MAX_MISTAKES,
        answers: finished.questionIds.flatMap((id) => {
          const chosen = finished.answers[id];
          return chosen ? [{ questionId: id, chosen }] : [];
        }),
      });
    }
    update(finished);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }
      setExam((currentExam) => {
        if (!currentExam || currentExam.status !== "running") return currentExam;
        const questionId = currentExam.questionIds[currentExam.index];
        const key = event.key.toLowerCase();
        const option = key === "1" ? "a" : key === "2" ? "b" : key === "3" ? "c" : key;
        if (option === "a" || option === "b" || option === "c") {
          if (isImmediate(currentExam) && currentExam.answers[questionId]) return currentExam;
          return { ...currentExam, answers: { ...currentExam.answers, [questionId]: option } };
        }
        if (event.key === "ArrowRight" && currentExam.index < currentExam.questionIds.length - 1) {
          return { ...currentExam, index: currentExam.index + 1 };
        }
        if (event.key === "ArrowLeft" && currentExam.index > 0) {
          return { ...currentExam, index: currentExam.index - 1 };
        }
        return currentExam;
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!ready) {
    return <p className="text-muted">Wczytywanie egzaminu…</p>;
  }

  if (!exam) {
    return (
      <div>
        <p className="text-sm font-semibold tracking-[0.14em] text-gold uppercase">Egzamin próbny</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight">20 pytań, dwa błędy</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          Zestaw jest losowany z całej puli {questions.length} pytań. Zaliczenie to co najmniej{" "}
          {EXAM_SIZE - MAX_MISTAKES} poprawnych odpowiedzi.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-2xl border border-line bg-card px-5 py-5 text-left hover:border-forest"
            onClick={() => update(createExam("end"))}
          >
            <span className="block font-semibold">Jak na egzaminie</span>
            <span className="mt-2 block text-sm leading-relaxed text-muted">
              Odpowiedź można zmienić. Klucz pojawia się po oddaniu całego arkusza.
            </span>
          </button>
          <button
            type="button"
            className="rounded-2xl border border-line bg-card px-5 py-5 text-left hover:border-forest"
            onClick={() => update(createExam("immediate"))}
          >
            <span className="block font-semibold">Z odpowiedzią od razu</span>
            <span className="mt-2 block text-sm leading-relaxed text-muted">
              Po zaznaczeniu widać poprawną odpowiedź. Tej odpowiedzi nie da się już zmienić.
            </span>
          </button>
        </div>
        <ul className="mt-6 space-y-2 text-base leading-relaxed text-muted">
          <li>Klawisze A, B, C albo 1, 2, 3 zaznaczają odpowiedź.</li>
          <li>Niedokończony egzamin zostaje w tej karcie przeglądarki.</li>
        </ul>
      </div>
    );
  }

  if (exam.status === "done" && score) {
    const wrong = exam.questionIds.filter((id) => {
      const question = questionById.get(id);
      return question && exam.answers[id] !== question.answer;
    });
    return (
      <div>
        <p className="text-sm font-semibold tracking-[0.14em] text-gold uppercase">Wynik</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight">
          {score.passed ? "Zaliczone" : "Niezaliczone"}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          {score.correct} z {exam.questionIds.length} poprawnych.{" "}
          {score.passed
            ? `Mieścisz się w limicie ${MAX_MISTAKES} błędów.`
            : `Limit to ${MAX_MISTAKES} błędy. Tym razem: ${countLabel(score.mistakes, "błąd", "błędy", "błędów")}.`}
        </p>
        <p className={`mt-6 font-serif text-6xl ${score.passed ? "text-forest-bright" : "text-fail"}`}>
          {score.correct}/{exam.questionIds.length}
        </p>

        {wrong.length > 0 && (
          <section className="mt-10 space-y-8">
            <h2 className="font-serif text-2xl">Do poprawy</h2>
            {wrong.map((id) => {
              const question = questionById.get(id);
              if (!question) return null;
              return (
                <article key={id} className="border-t border-line pt-6">
                  <p className="text-sm text-muted">
                    Pytanie {question.id}
                    {question.topic ? ` · ${question.topic}` : ""}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl leading-snug">{question.text}</h3>
                  <div className="mt-4">
                    <OptionList
                      question={question}
                      selected={exam.answers[id] ?? null}
                      revealed
                    />
                  </div>
                  {question.citation && (
                    <p className="mt-3 text-sm text-muted">{question.citation}</p>
                  )}
                </article>
              );
            })}
          </section>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="rounded-full bg-forest px-6 py-3 font-semibold text-paper hover:bg-forest-bright"
            onClick={() => {
              clearActiveExam();
              update(createExam(exam.reveal === "immediate" ? "immediate" : "end"));
            }}
          >
            Nowy egzamin
          </button>
          <button
            type="button"
            className="rounded-full border border-line px-6 py-3 font-semibold"
            onClick={() => {
              clearActiveExam();
              setExam(null);
            }}
          >
            Inny tryb
          </button>
          {wrong.length > 0 && (
            <Link
              href="/nauka?zakres=bledy"
              className="inline-flex items-center justify-center rounded-full border border-forest px-6 py-3 font-semibold text-forest"
            >
              Powtórz błędne
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!current) return null;

  const atEnd = exam.index === exam.questionIds.length - 1;
  const complete = answeredCount === exam.questionIds.length;
  const immediate = isImmediate(exam);
  const chosen = exam.answers[current.id] ?? null;
  const revealed = immediate && chosen !== null;
  const mistakesSoFar = exam.questionIds.filter((id) => {
    const question = questionById.get(id);
    const answer = exam.answers[id];
    return question && answer && answer !== question.answer;
  }).length;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <p className="text-sm font-semibold tracking-[0.14em] text-gold uppercase">
          Pytanie {exam.index + 1} z {exam.questionIds.length}
        </p>
        <p className="text-sm text-muted">
          {immediate
            ? `${countLabel(mistakesSoFar, "błąd", "błędy", "błędów")} · ${answeredCount}/${exam.questionIds.length}`
            : `Zaznaczone ${answeredCount}/${exam.questionIds.length}`}
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full bg-forest"
          style={{ width: `${(answeredCount / exam.questionIds.length) * 100}%` }}
        />
      </div>

      <h1 className="mt-6 font-serif text-3xl leading-snug">{current.text}</h1>
      <div className="mt-6">
        <OptionList
          question={current}
          selected={chosen}
          revealed={revealed}
          onSelect={
            revealed
              ? undefined
              : (option: OptionId) =>
                  update({ ...exam, answers: { ...exam.answers, [current.id]: option } })
          }
        />
      </div>
      {revealed && (
        <div className={`mt-5 rounded-2xl px-4 py-4 ${chosen === current.answer ? "bg-moss" : "bg-fail-soft"}`}>
          <p className="font-semibold">{chosen === current.answer ? "Dobrze." : "To nie ta odpowiedź."}</p>
          {current.citation && <p className="mt-1 text-sm text-muted">{current.citation}</p>}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {exam.questionIds.map((id, index) => {
          const active = index === exam.index;
          const answer = exam.answers[id];
          const question = questionById.get(id);
          const marked = Boolean(answer);
          const right = immediate && marked && question && answer === question.answer;
          const wrong = immediate && marked && question && answer !== question.answer;
          return (
            <button
              key={id}
              type="button"
              aria-label={`Pytanie ${index + 1}`}
              onClick={() => update({ ...exam, index })}
              className={`h-9 w-9 rounded-full text-sm font-semibold ${
                active
                  ? "bg-forest text-paper"
                  : right
                    ? "bg-moss text-forest"
                    : wrong
                      ? "bg-fail-soft text-fail"
                      : marked
                        ? "bg-moss text-forest"
                        : "border border-line bg-card text-muted"
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={exam.index === 0}
          onClick={() => update({ ...exam, index: exam.index - 1 })}
          className="rounded-full border border-line px-5 py-2.5 font-semibold disabled:opacity-40"
        >
          Wstecz
        </button>
        {atEnd ? (
          <button
            type="button"
            disabled={!complete}
            onClick={() => finish(exam)}
            className="rounded-full bg-forest px-5 py-2.5 font-semibold text-paper hover:bg-forest-bright disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sprawdź egzamin
          </button>
        ) : (
          <button
            type="button"
            onClick={() => update({ ...exam, index: exam.index + 1 })}
            className="rounded-full bg-forest px-5 py-2.5 font-semibold text-paper hover:bg-forest-bright"
          >
            Dalej
          </button>
        )}
        {complete && !atEnd && (
          <button
            type="button"
            onClick={() => finish(exam)}
            className="rounded-full px-5 py-2.5 font-semibold text-forest"
          >
            Sprawdź teraz
          </button>
        )}
      </div>
      {!complete && (
        <p className="mt-3 text-sm text-muted">
          Zostało {countLabel(exam.questionIds.length - answeredCount, "pytanie bez odpowiedzi", "pytania bez odpowiedzi", "pytań bez odpowiedzi")}.
        </p>
      )}
      <button
        type="button"
        className="mt-8 text-sm text-muted underline-offset-2 hover:text-ink hover:underline"
        onClick={() => {
          if (window.confirm("Przerwać ten zestaw i wylosować później nowy?")) {
            clearActiveExam();
            setExam(null);
          }
        }}
      >
        Przerwij egzamin
      </button>
    </div>
  );
}
