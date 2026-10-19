import { displayOption, type OptionId, type Question } from "@/data/questions";

type OptionListProps = {
  question: Question;
  selected: OptionId | null;
  revealed: boolean;
  onSelect?: (id: OptionId) => void;
};

export function OptionList({ question, selected, revealed, onSelect }: OptionListProps) {
  return (
    <ul className="space-y-3">
      {question.options.map((option) => {
        const isSelected = selected === option.id;
        const isAnswer = question.answer === option.id;
        let tone = "border-line bg-card hover:border-forest/35";
        if (revealed && isAnswer) tone = "border-forest-bright bg-moss";
        else if (revealed && isSelected) tone = "border-fail bg-fail-soft";
        else if (revealed) tone = "border-line bg-card text-muted";
        else if (isSelected) tone = "border-forest bg-raised ring-1 ring-forest";

        const interactive = Boolean(onSelect) && !revealed;

        return (
          <li key={option.id}>
            <button
              type="button"
              disabled={!interactive}
              onClick={() => onSelect?.(option.id)}
              className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition disabled:cursor-default disabled:opacity-100 ${tone}`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold uppercase ${
                  revealed && isAnswer
                    ? "border-forest-bright text-forest-bright"
                    : revealed && isSelected
                      ? "border-fail text-fail"
                      : "border-current/20"
                }`}
              >
                {option.id}
              </span>
              <span className="font-serif text-lg leading-snug">{displayOption(option.text)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
