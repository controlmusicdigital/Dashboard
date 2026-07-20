"use client";

import { useMemo, useState } from "react";
import { Comment, COMMENT_PLATFORMS, getAllComments } from "@/lib/comments";
import { PLATFORM_META, PlatformIcon } from "@/lib/platforms";
import { PlatformId } from "@/lib/types";
import { artists } from "@/lib/artists";
import { label } from "@/lib/label";
import { logActivity } from "@/lib/team";

const ENTITIES = [...artists, label];

function timeAgo(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  return `hace ${Math.round(hr / 24)} d`;
}

export function CommentsInbox() {
  const allComments = useMemo(() => getAllComments(), []);
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<Set<PlatformId>>(new Set(COMMENT_PLATFORMS));
  const [search, setSearch] = useState("");
  const [repliedOverride, setRepliedOverride] = useState<Record<string, boolean>>({});
  const [openReply, setOpenReply] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const comments = allComments.filter((c) => {
    if (entityFilter !== "all" && c.entityId !== entityFilter) return false;
    if (!platformFilter.has(c.platform)) return false;
    if (search.trim() && !c.text.toLowerCase().includes(search.toLowerCase()) && !c.author.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  function togglePlatform(id: PlatformId) {
    setPlatformFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleReply(c: Comment) {
    if (!replyDraft.trim()) return;
    setRepliedOverride((prev) => ({ ...prev, [c.id]: true }));
    logActivity(`respondio un comentario en ${PLATFORM_META[c.platform].label}`, c.entityId, c.entityName, replyDraft.trim().slice(0, 60));
    setOpenReply(null);
    setReplyDraft("");
  }

  const unrepliedCount = comments.filter((c) => !(repliedOverride[c.id] ?? c.replied)).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Comentarios
        </h2>
        <p className="mt-1 max-w-2xl text-xs" style={{ color: "var(--text-muted)" }}>
          Todos los comentarios de Instagram, TikTok, Facebook, X y YouTube de cada artista y de El sello, en un
          solo lugar — con {unrepliedCount} sin responder segun los filtros de abajo. Datos de ejemplo hasta
          conectar cada cuenta real.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl p-4" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEntityFilter("all")}
            className="rounded-full px-3 py-1.5 text-xs font-semibold"
            style={
              entityFilter === "all"
                ? { backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }
                : { backgroundColor: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-hairline)" }
            }
          >
            Todos
          </button>
          {ENTITIES.map((e) => (
            <button
              key={e.id}
              onClick={() => setEntityFilter(e.id)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold"
              style={
                entityFilter === e.id
                  ? { backgroundColor: "var(--text-primary)", color: "var(--page-plane)" }
                  : { backgroundColor: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-hairline)" }
              }
            >
              {e.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {COMMENT_PLATFORMS.map((p) => {
            const on = platformFilter.has(p);
            return (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className="flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-xs font-medium"
                style={{
                  border: `1px solid ${on ? "var(--border-hairline)" : "var(--gridline)"}`,
                  backgroundColor: on ? "var(--surface-2)" : "transparent",
                  color: on ? "var(--text-primary)" : "var(--text-muted)",
                  opacity: on ? 1 : 0.6,
                }}
              >
                <PlatformIcon platform={p} />
                {PLATFORM_META[p].label}
              </button>
            );
          })}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por texto o usuario..."
          className="rounded-xl px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {comments.length === 0 ? (
          <div className="rounded-2xl px-4 py-8 text-center text-sm" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)", color: "var(--text-muted)" }}>
            No hay comentarios con estos filtros.
          </div>
        ) : (
          comments.map((c) => {
            const meta = PLATFORM_META[c.platform];
            const replied = repliedOverride[c.id] ?? c.replied;
            return (
              <div key={c.id} className="rounded-2xl p-4" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}>
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: `${meta.brandColor}2a`, color: meta.brandColor }}
                  >
                    {c.author.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        @{c.author}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                        <PlatformIcon platform={c.platform} />
                        {meta.label}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 font-medium"
                        style={{ backgroundColor: "var(--surface-2)", color: "var(--text-secondary)" }}
                      >
                        {c.entityName}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>{timeAgo(c.publishedAt)}</span>
                      {!replied && (
                        <span className="rounded-full px-2 py-0.5 font-semibold" style={{ color: "var(--status-warning)", border: "1px solid var(--status-warning)" }}>
                          Sin responder
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm" style={{ color: "var(--text-primary)" }}>
                      {c.text}
                    </p>
                    {openReply === c.id ? (
                      <div className="mt-2 flex gap-2">
                        <input
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          placeholder={`Responder a @${c.author}...`}
                          className="flex-1 rounded-xl px-3 py-1.5 text-xs outline-none"
                          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-primary)" }}
                        />
                        <button
                          onClick={() => handleReply(c)}
                          disabled={!replyDraft.trim()}
                          className="rounded-xl px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                          style={{ backgroundColor: "var(--seq-500)", color: "#fff" }}
                        >
                          Enviar
                        </button>
                        <button
                          onClick={() => {
                            setOpenReply(null);
                            setReplyDraft("");
                          }}
                          className="rounded-xl px-3 py-1.5 text-xs font-medium"
                          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)" }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setOpenReply(c.id)}
                        className="mt-2 text-xs font-semibold underline"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Responder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
