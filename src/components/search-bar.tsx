import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search rituals, recipes, tips…"
        className="pl-10 h-11 rounded-full bg-card border-border/80 focus-visible:ring-primary"
      />
    </div>
  );
}
