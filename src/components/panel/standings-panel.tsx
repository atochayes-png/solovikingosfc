import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmButton, Field, PanelCard } from "@/components/panel/common";
import { supabase } from "@/integrations/supabase/client";
import { TIEBREAKERS, useStandings, type StandingTeam } from "@/lib/standings";

const NUMS = ["pj", "g", "e", "p", "gf", "gc", "pts", "manual_order"] as const;
type NumKey = (typeof NUMS)[number];
const LABEL: Record<NumKey, string> = { pj: "PJ", g: "G", e: "E", p: "P", gf: "GF", gc: "GC", pts: "PTS", manual_order: "Orden" };

function TeamRow({ team, onSaved }: { team: StandingTeam; onSaved: () => void }) {
  const [f, setF] = useState(team);
  const [busy, setBusy] = useState(false);
  useEffect(() => setF(team), [team]);

  async function save() {
    if (!f.name.trim()) return toast.error("El nombre no puede quedar vacío");
    if (NUMS.some((k) => !Number.isInteger(f[k]) || (k !== "pts" && f[k] < 0)))
      return toast.error("Revisa los números: deben ser enteros");
    setBusy(true);
    if (f.is_vikingos && !team.is_vikingos) {
      await supabase.from("standings_teams").update({ is_vikingos: false }).neq("id", team.id).eq("is_vikingos", true);
    }
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = f;
    const { error } = await supabase.from("standings_teams").update({ ...rest, name: f.name.trim() }).eq("id", team.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${f.name} guardado`);
    onSaved();
  }

  async function remove() {
    const { error } = await supabase.from("standings_teams").delete().eq("id", team.id);
    if (error) return toast.error(error.message);
    toast.success("Equipo eliminado");
    onSaved();
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background p-3">
      <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Nombre del equipo" />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {NUMS.map((k) => (
          <label key={k} className="space-y-1 text-center">
            <span className="eyebrow block text-[9px] text-muted-foreground">{LABEL[k]}</span>
            <Input
              type="number"
              inputMode="numeric"
              className="px-1 text-center"
              value={Number.isNaN(f[k]) ? "" : f[k]}
              onChange={(e) => setF({ ...f, [k]: e.target.value === "" ? NaN : Number(e.target.value) })}
            />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <Checkbox checked={f.is_vikingos} onCheckedChange={(v) => setF({ ...f, is_vikingos: v === true })} />
          Es VIKINGOS FC
        </label>
        <div className="flex gap-2">
          <ConfirmButton title={`¿Eliminar ${team.name}?`} onConfirm={remove} variant="outline" size="icon" aria-label="Eliminar">
            <Trash2 className="h-4 w-4" />
          </ConfirmButton>
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StandingsPanel() {
  const qc = useQueryClient();
  const { data } = useStandings();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [ppw, setPpw] = useState(3);
  const [tb, setTb] = useState<string[]>([]);
  const [savingCfg, setSavingCfg] = useState(false);

  useEffect(() => {
    if (!data) return;
    setPpw(data.settings.points_per_win);
    setTb(data.settings.tiebreakers);
  }, [data]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["standings"] });

  async function add() {
    if (!name.trim()) return toast.error("Escribe el nombre del equipo");
    setAdding(true);
    const { error } = await supabase.from("standings_teams").insert({ name: name.trim() });
    setAdding(false);
    if (error) return toast.error(error.message);
    setName("");
    toast.success("Equipo registrado");
    refresh();
  }

  async function saveCfg() {
    if (!Number.isInteger(ppw) || ppw < 0) return toast.error("Puntos por victoria inválidos");
    setSavingCfg(true);
    const { error } = await supabase.from("standings_settings").upsert({ id: true, points_per_win: ppw, tiebreakers: tb });
    setSavingCfg(false);
    if (error) return toast.error(error.message);
    toast.success("Reglas de la tabla guardadas");
    refresh();
  }

  const move = (i: number, d: number) => {
    const n = [...tb];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    setTb(n);
  };

  return (
    <div className="space-y-4">
      <PanelCard title="Reglas de la liga">
        <div className="space-y-4">
          <Field label="Puntos por victoria">
            <Input type="number" inputMode="numeric" className="w-28" value={Number.isNaN(ppw) ? "" : ppw} onChange={(e) => setPpw(e.target.value === "" ? NaN : Number(e.target.value))} />
          </Field>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Criterios de desempate (en orden, según el reglamento)</p>
            {tb.length === 0 && <p className="text-sm text-muted-foreground">Sin criterios: a igualdad de puntos se ordena alfabéticamente.</p>}
            {tb.map((k, i) => (
              <div key={k} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                <span className="w-5 font-bold">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{TIEBREAKERS.find((t) => t.key === k)?.label ?? k}</span>
                <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir"><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" disabled={i === tb.length - 1} onClick={() => move(i, 1)} aria-label="Bajar"><ArrowDown className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setTb(tb.filter((x) => x !== k))} aria-label="Quitar"><X className="h-4 w-4" /></Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {TIEBREAKERS.filter((t) => !tb.includes(t.key)).map((t) => (
                <Button key={t.key} size="sm" variant="outline" onClick={() => setTb([...tb, t.key])}>
                  <Plus className="h-3.5 w-3.5" /> {t.label}
                </Button>
              ))}
            </div>
          </div>
          <Button onClick={saveCfg} disabled={savingCfg} className="w-full sm:w-auto">
            {savingCfg && <Loader2 className="h-4 w-4 animate-spin" />} Guardar reglas
          </Button>
        </div>
      </PanelCard>

      <PanelCard title="Equipos y clasificación oficial">
        <div className="space-y-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Input placeholder="Nombre del equipo" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            <Button onClick={add} disabled={adding}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Agregar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Captura los datos oficiales de la liga. Los puntos no se calculan automáticamente. «Orden» solo se usa si el desempate manual está activo (menor número va primero).</p>
          {(data?.teams ?? []).length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay equipos registrados.</p>}
          {(data?.teams ?? []).map((t) => <TeamRow key={t.id} team={t} onSaved={refresh} />)}
        </div>
      </PanelCard>
    </div>
  );
}
