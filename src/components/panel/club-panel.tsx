import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, PanelCard } from "@/components/panel/common";
import { supabase } from "@/integrations/supabase/client";
import { useClub, useSeasons } from "@/lib/queries";

export function ClubPanel() {
  const qc = useQueryClient();
  const { data: club } = useClub();
  const { data: seasons = [] } = useSeasons();

  const [history, setHistory] = useState("");
  const [identity, setIdentity] = useState("");
  const [venue, setVenue] = useState("");
  const [sponsors, setSponsors] = useState("");
  const [league, setLeague] = useState("");
  const [city, setCity] = useState("");
  const [newSeason, setNewSeason] = useState("");

  useEffect(() => {
    if (!club) return;
    setHistory(club.history ?? "");
    setIdentity(club.identity ?? "");
    setVenue(club.venue_info ?? "");
    setSponsors(club.sponsors ?? "");
    setLeague(club.league ?? "");
    setCity(club.city ?? "");
  }, [club]);

  async function save() {
    const { error } = await supabase
      .from("club_settings")
      .update({
        history: history.trim() || null,
        identity: identity.trim() || null,
        venue_info: venue.trim() || null,
        sponsors: sponsors.trim() || null,
        league: league.trim(),
        city: city.trim(),
      })
      .eq("id", true);
    if (error) { toast.error(error.message); return; }
    toast.success("Información del club actualizada");
    qc.invalidateQueries({ queryKey: ["club"] });
  }

  async function addSeason() {
    if (!newSeason.trim()) return;
    const { error } = await supabase
      .from("seasons")
      .insert({ name: newSeason.trim(), is_current: seasons.length === 0 });
    if (error) { toast.error(error.message); return; }
    setNewSeason("");
    qc.invalidateQueries({ queryKey: ["seasons"] });
  }

  async function setCurrent(id: string) {
    await supabase.from("seasons").update({ is_current: false }).neq("id", id);
    const { error } = await supabase.from("seasons").update({ is_current: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["seasons"] });
  }

  async function removeSeason(id: string) {
    const { error } = await supabase.from("seasons").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["seasons"] });
  }

  return (
    <>
      <PanelCard title="El Club">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Liga">
            <Input value={league} onChange={(e) => setLeague(e.target.value)} />
          </Field>
          <Field label="Ciudad">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
        </div>
        <Field label="Historia">
          <Textarea rows={5} value={history} onChange={(e) => setHistory(e.target.value)} />
        </Field>
        <Field label="Identidad y valores">
          <Textarea rows={4} value={identity} onChange={(e) => setIdentity(e.target.value)} />
        </Field>
        <Field label="Sede y cancha">
          <Textarea rows={3} value={venue} onChange={(e) => setVenue(e.target.value)} />
        </Field>
        <Field label="Patrocinadores y apoyos">
          <Textarea rows={3} value={sponsors} onChange={(e) => setSponsors(e.target.value)} />
        </Field>
        <Button className="w-full" onClick={save}>
          Guardar información
        </Button>
      </PanelCard>

      <PanelCard title="Temporadas">
        <div className="flex gap-2">
          <Input
            placeholder="Ej. Temporada 2026"
            value={newSeason}
            onChange={(e) => setNewSeason(e.target.value)}
          />
          <Button onClick={addSeason}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {seasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay temporadas creadas.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {seasons.map((s) => (
              <li key={s.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="flex-1 font-semibold">{s.name}</span>
                {s.is_current ? (
                  <span className="eyebrow text-accent-foreground">Actual</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setCurrent(s.id)}>
                    Marcar actual
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => removeSeason(s.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </>
  );
}
