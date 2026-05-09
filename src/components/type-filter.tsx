import { CONTENT_TYPES, type ContentType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value: ContentType | "all";
  onChange: (v: ContentType | "all") => void;
}

export function TypeFilter({ value, onChange }: Props) {
  const items: { value: ContentType | "all"; label: string; emoji?: string }[] = [
    { value: "all", label: "All", emoji: "✨" },
    ...CONTENT_TYPES.map((c) => ({ value: c.value, label: c.label, emoji: c.emoji })),
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = value === it.value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              active
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-foreground/80 border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            <span>{it.emoji}</span> {it.label}
          </button>
        );
      })}
    </div>
  );
}
