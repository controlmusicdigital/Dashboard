"use client";

import { useEffect, useState } from "react";
import {
  ActivityEntry,
  TeamMember,
  TeamRole,
  getActivity,
  getCurrentUser,
  getTeam,
  inviteMember,
  markMemberActive,
  removeMember,
  setCurrentUser,
} from "@/lib/team";
import { MemorySummaryRow, forgetAll, getMemorySummary, keyLabel, scopeLabel } from "@/lib/memory";

const ROLE_LABEL: Record<TeamRole, string> = {
  admin: "Administrador",
  editor: "Editor",
  viewer: "Solo lectura",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.round(hr / 24);
  return `hace ${day} d`;
}

export function TeamPanel() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [currentUser, setCurrentUserState] = useState("Presidente");
  const [nameDraft, setNameDraft] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("editor");
  const [sent, setSent] = useState<string | null>(null);
  const [memory, setMemory] = useState<MemorySummaryRow[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable client-side, unavailable during SSR
    setTeam(getTeam());
    setActivity(getActivity());
    const user = getCurrentUser();
    setCurrentUserState(user);
    setNameDraft(user);
    setMemory(getMemorySummary());
  }, []);

  function handleForget() {
    forgetAll();
    setMemory(getMemorySummary());
  }

  function handleInvite() {
    if (!name.trim() || !email.trim()) return;
    inviteMember(name.trim(), email.trim(), role);
    setTeam(getTeam());
    setSent(name.trim());
    setName("");
    setEmail("");
    setRole("editor");
  }

  function handleActivate(id: string) {
    markMemberActive(id);
    setTeam(getTeam());
  }

  function handleRemove(id: string) {
    removeMember(id);
    setTeam(getTeam());
  }

  function saveCurrentUser() {
    if (!nameDraft.trim()) return;
    setCurrentUser(nameDraft.trim());
    setCurrentUserState(nameDraft.trim());
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Mi equipo
        </h2>
        <p className="mt-1 max-w-2xl text-xs" style={{ color: "var(--text-muted)" }}>
          Invita a gente de tu equipo a crear su perfil, y desde aqui ves lo que hace cada quien en el panel
          (conexiones, publicaciones, campanas activadas). Todo esto se guarda **solo en este navegador**
          (localStorage) — no hay cuentas de usuario ni correo real todavia. Para invitaciones por email de verdad y
          para ver la actividad de tu equipo desde cualquier dispositivo, hace falta un backend con autenticacion y
          base de datos compartida (el siguiente paso cuando quieran).
        </p>
      </div>

      <div className="panel-card flex flex-col gap-3 rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Quien eres en este navegador
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Tu nombre"
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
          />
          <button
            onClick={saveCurrentUser}
            className="rounded-xl px-3 py-2 text-xs font-semibold"
            style={{ backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }}
          >
            Guardar
          </button>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Las acciones que hagas en este navegador se registran como &quot;{currentUser}&quot;.
          </span>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
        <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Invitar miembro del equipo
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            type="email"
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            className="rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
          >
            <option value="admin">Administrador</option>
            <option value="editor">Editor</option>
            <option value="viewer">Solo lectura</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={!name.trim() || !email.trim()}
            className="rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-50"
            style={{ backgroundColor: "var(--seq-500)", color: "#fff" }}
          >
            Enviar invitacion
          </button>
        </div>
        {sent && (
          <p className="mt-2 text-xs" style={{ color: "var(--status-warning)" }}>
            Invitacion a {sent}
            {" "}guardada como &quot;invitado&quot; (simulada — todavia no se envia correo real).
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border-hairline)" }}>
        <div
          className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-3 px-4 py-2.5 text-xs font-medium"
          style={{ backgroundColor: "var(--surface-2)", color: "var(--text-muted)" }}
        >
          <span>Nombre</span>
          <span>Correo</span>
          <span>Rol</span>
          <span>Estado</span>
          <span></span>
        </div>
        <div style={{ backgroundColor: "var(--surface-1)" }}>
          {team.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              Todavia no has invitado a nadie.
            </div>
          ) : (
            team.map((m) => (
              <div key={m.id} className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-3 border-t px-4 py-3" style={{ borderColor: "var(--border-hairline)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                <span className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{m.email}</span>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{ROLE_LABEL[m.role]}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={
                    m.status === "activo"
                      ? { color: "var(--status-good)", border: "1px solid var(--status-good)" }
                      : { color: "var(--status-warning)", border: "1px solid var(--status-warning)" }
                  }
                >
                  {m.status === "activo" ? "Activo" : "Invitado"}
                </span>
                <span className="flex gap-2">
                  {m.status !== "activo" && (
                    <button onClick={() => handleActivate(m.id)} className="text-xs font-medium underline" style={{ color: "var(--text-muted)" }}>
                      Marcar activo
                    </button>
                  )}
                  <button onClick={() => handleRemove(m.id)} className="text-xs font-medium underline" style={{ color: "var(--status-critical)" }}>
                    Quitar
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Lo que hace mi equipo
        </h3>
        <div className="flex flex-col gap-2">
          {activity.length === 0 ? (
            <div className="rounded-2xl px-4 py-6 text-center text-xs" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)", color: "var(--text-muted)" }}>
              Sin actividad todavia. Conecta una red, publica un post o activa una campana y va a aparecer aqui.
            </div>
          ) : (
            activity.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-xs"
                style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
              >
                <span style={{ color: "var(--text-primary)" }}>
                  <b>{a.member}</b> {a.action} <span style={{ color: "var(--text-muted)" }}>· {a.entityName}</span>
                  {a.detail ? <span style={{ color: "var(--text-muted)" }}> — {a.detail}</span> : null}
                </span>
                <span className="flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                  {timeAgo(a.at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              Lo que ha aprendido el panel
            </h3>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Cada vez que generas contenido o difundes un mensaje, el panel recuerda que proveedor de IA y que
              plataformas usaste mas — y las deja preseleccionadas la proxima vez. Es conteo local en este
              navegador, no un modelo entrenado; se puede olvidar en cualquier momento.
            </p>
          </div>
          {memory.length > 0 && (
            <button
              onClick={handleForget}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{ border: "1px solid var(--status-critical)", color: "var(--status-critical)" }}
            >
              Olvidar todo
            </button>
          )}
        </div>
        {memory.length === 0 ? (
          <div className="rounded-2xl px-4 py-6 text-center text-xs" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)", color: "var(--text-muted)" }}>
            Todavia no hay patrones aprendidos. Genera contenido o manda una difusion y va a aparecer aqui.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {memory.slice(0, 12).map((row) => (
              <div
                key={`${row.scope}:${row.key}:${row.value}`}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-xs"
                style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
              >
                <span style={{ color: "var(--text-primary)" }}>
                  {scopeLabel(row.scope)} → {keyLabel(row.key)}: <b>{row.value}</b>
                </span>
                <span className="flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                  {row.count}×
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
