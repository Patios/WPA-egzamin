"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { OptionList } from "@/components/option-list";
import {
  questionById,
  questions,
  shuffle,
  topics,
  type OptionId,
  type Question,
} from "@/data/questions";
import { countLabel } from "@/lib/plural";
import { loadProgress, recordAnswer, type ProgressMap } from "@/lib/storage";

type Scope = "all" | "unseen" | "wrong";

function parseScope(value: string | null): Scope {
  if (value === "bledy" || value === "wrong") return "wrong";
  if (value === "nowe" || value === "unseen") return "unseen";
  return "all";
}

export function NaukaClient() {
  const params = useSearchParams();
  const initialTopic = params.get("temat") ?? "all";
  const initialScope = parseScope(params.get("zakres"));

  const [progress, setProgress] = useState<ProgressMap>({});
  const [ready, setReady] = useState(false);
  const [topic, setTopic] = useState(topics.includes(initialTopic) ? initialTopic : "all");
  const [scope, setScope] = useState<Scope>(initialScope);
  const [order, setOrder] = useState<"random" | "pool">("random");
  const [queue, setQueue] = useState<number[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<OptionId | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionAnswered, setSessionAnswered] = useState(0);
  const lock = useRef(false);

  useEffect(() => {
    setProgress(loadProgress());
    setReady(true);
  }, []);

  const pool = useMemo(() => {
    return questions.filter((question) => {
      if (topic !== "all" && question.topic !== topic) return false;
      const state = progress[question.id];
      if (scope === "unseen") return !state;
      if (scope === "wrong") return state?.last === "wrong";
      return true;
    });
  }, [progress, scope, topic]);

  const current: Question | undefined = queue ? questionById.get(queue[index]) : undefined;
  const finished = queue !== null && index >= queue.length;

  function start(nextPool = pool) {
    const ids = (order === "random" ? shuffle(nextPool) : nextPool).map((question) => question.id);
    setQueue(ids);
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setSessionCorrect(0);
    setSessionAnswered(0);
  }

  function choose(option: OptionId) {
    if (!current || revealed || lock.current) return;
    lock.current = true;
    const correct = option === current.answer;
    setSelected(option);
    setRevealed(true);
    setSessionAnswered((count) => count + 1);
    if (correct) setSessionCorrect((count) => count + 1);
    setProgress(recordAnswer(progress, current.id, correct));
  }

  function goNext() {
    lock.current = false;
    setIndex((value) => value + 1);
    setSelected(null);
    setRevealed(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }
      const key = event.key.toLowerCase();
      const option = key === "1" ? "a" : key === "2" ? "b" : key === "3" ? "c" : key;
      if (!revealed && (option === "a" || option === "b" || option === "c")) {
        choose(option);
      }
      if (revealed && (event.key === "Enter" || event.key === "ArrowRight")) {
        goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!ready) return <p className="text-muted">Wczytywanie pytań…</p>;

  if (!queue) {
    return (
      <div>
        <p className="text-sm font-semibold tracking-[0.14em] text-gold uppercase">Nauka</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight">Odpowiedź od razu</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          Po zaznaczeniu odpowiedzi widać klucz i podstawę prawną. Pula w tym ustawieniu:{" "}
          {countLabel(pool.length, "pytanie", "pytania", "pytań")}.
        </p>

        <div className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-muted">Temat</span>
            <select
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-card px-3 py-3"
            >
              <option value="all">Cała pula</option>
              {topics.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-sm font-semibold text-muted">Zakres</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["all", "Wszystkie"],
                  ["unseen", "Jeszcze nieruszone"],
                  ["wrong", "Ostatnio błędne"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-xl border px-3 py-3 ${
                    scope === value ? "border-forest bg-raised" : "border-line bg-card"
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value={value}
                    checked={scope === value}
                    onChange={() => setScope(value)}
                    className="mr-2 accent-forest"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-muted">Kolejność</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["random", "Losowa"],
                  ["pool", "Jak w puli"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-xl border px-3 py-3 ${
                    order === value ? "border-forest bg-raised" : "border-line bg-card"
                  }`}
                >
                  <input
                    type="radio"
                    name="order"
                    value={value}
                    checked={order === value}
                    onChange={() => setOrder(value)}
                    className="mr-2 accent-forest"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <button
          type="button"
          disabled={pool.length === 0}
          onClick={() => start()}
          className="mt-8 rounded-full bg-forest px-6 py-3 font-semibold text-paper hover:bg-forest-bright disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pool.length === 0 ? "Brak pytań w tym zakresie" : `Zacznij · ${pool.length}`}
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div>
        <p className="text-sm font-semibold tracking-[0.14em] text-gold uppercase">Koniec zestawu</p>
        <h1 className="mt-2 font-serif text-4xl">
          {sessionCorrect}/{sessionAnswered}
        </h1>
        <p className="mt-4 text-lg text-muted">
          Poprawnych odpowiedzi w tej sesji: {sessionCorrect}.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => start(pool)}
            className="rounded-full bg-forest px-6 py-3 font-semibold text-paper hover:bg-forest-bright"
          >
            Jeszcze raz
          </button>
          <button
            type="button"
            onClick={() => setQueue(null)}
            className="rounded-full border border-forest px-6 py-3 font-semibold text-forest"
          >
            Zmień zakres
          </button>
          <Link
            href="/egzamin"
            className="inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold text-muted"
          >
            Przejdź do egzaminu
          </Link>
        </div>
      </div>
    );
  }

  if (!current) return null;
  const correct = selected === current.answer;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <p className="text-sm font-semibold tracking-[0.14em] text-gold uppercase">
          {index + 1} / {queue.length}
        </p>
        <p className="text-sm text-muted">{current.topic}</p>
      </div>
      <h1 className="mt-4 font-serif text-3xl leading-snug">{current.text}</h1>
      <div className="mt-6">
        <OptionList
          question={current}
          selected={selected}
          revealed={revealed}
          onSelect={choose}
        />
      </div>

      {revealed && (
        <div className={`mt-5 rounded-2xl px-4 py-4 ${correct ? "bg-moss" : "bg-fail-soft"}`}>
          <p className="font-semibold">{correct ? "Dobrze." : "To nie ta odpowiedź."}</p>
          {current.citation && <p className="mt-1 text-sm text-muted">{current.citation}</p>}
          <button
            type="button"
            onClick={goNext}
            className="mt-4 rounded-full bg-forest px-5 py-2.5 font-semibold text-paper hover:bg-forest-bright"
          >
            {index + 1 === queue.length ? "Zobacz podsumowanie" : "Następne pytanie"}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setQueue(null)}
        className="mt-8 text-sm text-muted underline-offset-2 hover:text-ink hover:underline"
      >
        Zakończ zestaw
      </button>
    </div>
  );
}
