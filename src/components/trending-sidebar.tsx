import { Flame } from "lucide-react";

interface Props {
  tags: { tag: string; count: number }[];
  onTagClick?: (t: string) => void;
}

export function TrendingSidebar({ tags, onTagClick }: Props) {
  return (
    <aside className="glow-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-4 w-4 text-primary" />
        <h3 className="font-display text-base font-semibold">Trending tags</h3>
      </div>
      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tags will appear as the community shares more.</p>
      ) : (
        <ul className="space-y-1.5">
          {tags.map((t) => (
            <li key={t.tag}>
              <button
                onClick={() => onTagClick?.(t.tag)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition hover:bg-accent/40"
              >
                <span className="font-medium text-foreground/80">#{t.tag}</span>
                <span className="text-xs text-muted-foreground">{t.count}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
