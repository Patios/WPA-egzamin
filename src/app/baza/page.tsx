"use client";

import { useMemo, useState } from "react";
import { OptionList } from "@/components/option-list";
import { questions, topics, type OptionId } from "@/data/questions";

export default function BazaPage() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [hideAnswers, setHideAnswers] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [picks, setPicks] = useState<Partial<Record<number, OptionId>>>({});

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pl");
    return questions.filter((question) => {
      if (topic !== "all" && question.topic !== topic) return false;
      if (!needle) return true;
      const haystack = [
        String(question.id),
        question.text,
        question.topic,
        question.citation ?? "",
        ...question.options.map((option) => option.text),
      ]
        .join(" ")
        .toLocaleLowerCase("pl");
      return haystack.includes(needle);
    });
  }, [query, topic]);

  return (
    <div>
      <p className="text-sm font-semibold tracking-[0.14em] text-gold uppercase">Baza</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight">Wszystkie {questions.length} pytań</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        Pełna pula z kluczem. Przy ukrytych odpowiedziach odsłaniasz pytanie dopiero po kliknięciu.
      </p>

      <div className="mt-6 space-y-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Szukaj po treści, numerze albo przepisie"
          className="w-full rounded-xl border border-line bg-card px-4 py-3"
          type="search"
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="w-full rounded-xl border border-line bg-card px-3 py-3 sm:flex-1"
          >
            <option value="all">Wszystkie tematy</option>
            {topics.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-3">
            <input
              type="checkbox"
              checked={hideAnswers}
              onChange={(event) => {
                setHideAnswers(event.target.checked);
                setOpenId(null);
                setPicks({});
              }}
              className="accent-forest"
            />
            Ukryj odpowiedzi
          </label>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted">
        Wyniki: {filtered.length}
      </p>

      <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-muted">Nic nie pasuje do tego filtra.</p>
        )}
        {filtered.map((question) => {
          const expanded = openId === question.id;
          const picked = picks[question.id] ?? null;
          const selfTest = hideAnswers;
          const revealed = expanded && (!selfTest || picked !== null);
          return (
            <article key={question.id} className="px-4 py-4">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setOpenId(openId === question.id ? null : question.id)}
                aria-expanded={expanded}
              >
                <p className="text-sm text-muted">
                  {question.id}. {question.topic}
                </p>
                <h2 className="mt-1 font-serif text-xl leading-snug">{question.text}</h2>
              </button>
              {expanded && (
                <div className="mt-4">
                  <OptionList
                    question={question}
                    selected={selfTest ? picked : question.answer}
                    revealed={revealed}
                    onSelect={
                      selfTest && !picked
                        ? (option: OptionId) =>
                            setPicks((current) => ({ ...current, [question.id]: option }))
                        : undefined
                    }
                  />
                  {revealed && question.citation && (
                    <p className="mt-3 text-sm text-muted">{question.citation}</p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
