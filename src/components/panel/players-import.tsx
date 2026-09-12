import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Download, Loader2, Upload, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { importPlayers } from "@/lib/players-import.functions";
import {
  downloadTemplate,
  parseWorkbook,
  validateRows,
  INITIAL_PASSWORD,
  type ImportRow,
} from "@/lib/players-import";
import { usePlayers } from "@/lib/queries";

export function PlayersImport() {
  const qc = useQueryClient();
  const { data: players = [] } = usePlayers();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    failed: { fullName: string; reason: string }[];
  } | null>(null);

  async function revalidate(next: ImportRow[]) {
    const { data: profiles } = await supabase.from("profiles").select("username");
    const activeJerseys = new Map<number, string>();
    for (const p of players)
      if (p.active && p.jersey_number != null) activeJerseys.set(p.jersey_number, p.full_name);
    return validateRows(next, {
      usernames: (profiles ?? []).map((p) => p.username),
      activeJerseys,
      playerNames: players.map((p) => p.full_name),
    });
  }

  async function onFile(file: File) {
    setReading(true);
    setResult(null);
    try {
      const parsed = await parseWorkbook(file);
      if (parsed.length === 0) {
        toast.error("El archivo no tiene jugadores capturados.");
        return;
      }
      setRows(await revalidate(parsed));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo leer el archivo");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function setUsername(key: string, username: string) {
    const next = (rows ?? []).map((r) => (r.key === key ? { ...r, username } : r));
    setRows(await revalidate(next));
  }

  const ok = (rows ?? []).filter((r) => r.errors.length === 0);
  const withWarnings = ok.filter((r) => r.warnings.length > 0);
  const withErrors = (rows ?? []).filter((r) => r.errors.length > 0);

  async function confirmImport() {
    setBusy(true);
    try {
      const res = await importPlayers({
        data: {
          rows: ok.map((r) => ({
            fullName: r.fullName,
            shirtName: r.shirtName,
            jersey: r.jersey as number,
            position: r.position,
            username: r.username,
          })),
        },
      });
      setResult(res);
      setRows(null);
      setConfirming(false);
      qc.invalidateQueries({ queryKey: ["players"] });
      if (res.failed.length === 0) toast.success(`${res.created} jugadores importados`);
      else toast.error(`${res.failed.length} jugadores no pudieron crearse`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falló la importación");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => downloadTemplate()}>
          <Download className="mr-2 h-4 w-4" /> Descargar plantilla Excel
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={reading}>
          {reading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Importar jugadores
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
          }}
        />
      </div>

      {result && (
        <div className="rounded-lg border border-border bg-secondary p-4 text-sm">
          <p className="font-bold">
            {result.failed.length === 0 ? "Importación completada" : "Importación con incidencias"}
          </p>
          <p className="mt-1 text-muted-foreground">
            {result.created} jugadores creados · {result.created} accesos Vikingos creados ·{" "}
            {result.created} fotografías pendientes
          </p>
          {result.failed.length > 0 && (
            <ul className="mt-2 space-y-1 text-destructive">
              {result.failed.map((f, i) => (
                <li key={i}>
                  {f.fullName}: {f.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog open={!!rows} onOpenChange={(v) => !v && setRows(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vista previa de importación</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Stat label="Detectados" value={rows?.length ?? 0} />
            <Stat label="Correctos" value={ok.length - withWarnings.length} />
            <Stat label="Con advertencias" value={withWarnings.length} />
            <Stat label="Con errores" value={withErrors.length} />
          </div>

          <ul className="space-y-2">
            {(rows ?? []).map((r) => (
              <li key={r.key} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-start gap-2">
                  {r.errors.length > 0 ? (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  ) : r.warnings.length > 0 ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{r.fullName || `Fila ${r.line} sin nombre`}</p>
                    <p className="text-xs text-muted-foreground">
                      Camiseta: {r.shirtName || "—"} · Dorsal: {r.jersey ?? "—"} · Posición:{" "}
                      {r.position || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Usuario: {r.username || "—"} · Contraseña inicial: {INITIAL_PASSWORD} · Foto:
                      Pendiente
                    </p>
                    {r.errors.map((e) => (
                      <p key={e} className="mt-1 text-xs font-semibold text-destructive">
                        {e}
                      </p>
                    ))}
                    {r.warnings.map((w) => (
                      <p key={w} className="mt-1 text-xs text-amber-600">
                        {w}
                      </p>
                    ))}
                    <div className="mt-2">
                      <label className="text-xs text-muted-foreground">Usuario de acceso</label>
                      <Input
                        className="mt-1 h-9"
                        value={r.username}
                        onChange={(e) => void setUsername(r.key, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {confirming ? (
            <div className="space-y-2 rounded-lg bg-secondary p-3 text-sm">
              <p className="font-semibold">
                Se crearán {ok.length} jugadores y {ok.length} accesos Vikingos.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setConfirming(false)} disabled={busy}>
                  Cancelar
                </Button>
                <Button onClick={confirmImport} disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar importación
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="w-full"
              disabled={ok.length === 0 || withErrors.length > 0}
              onClick={() => setConfirming(true)}
            >
              Importar jugadores
            </Button>
          )}
          {withErrors.length > 0 && (
            <p className="text-xs text-destructive">
              Corrige las filas con errores antes de continuar.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-secondary px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-extrabold">{value}</p>
    </div>
  );
}
