import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · The Glow Hub" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
      }
    });
  }, [user]);

  async function save() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName, bio }).eq("id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-semibold">Your profile</h1>
      <p className="text-sm text-muted-foreground mt-1">How others see you on The Glow Hub.</p>

      <div className="glow-card p-6 mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={user.email ?? ""} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dn">Display name</Label>
          <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Short bio</Label>
          <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A line or two about you and your self-care journey." />
        </div>
        <Button onClick={save} disabled={busy} className="rounded-full">{busy ? "Saving…" : "Save"}</Button>
      </div>
    </div>
  );
}
