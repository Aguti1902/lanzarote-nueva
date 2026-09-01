"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Share2,
  Sparkles,
  Send,
  X,
} from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type Msg = { role: "user" | "assistant"; content: string };
type Panel = "menu" | "chat" | "contact" | null;

export function FloatingHelp() {
  const pathname = usePathname();
  const { dict, locale, href } = useLocale();
  const [panel, setPanel] = useState<Panel>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: dict.chat.greeting },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: dict.chat.greeting }]);
  }, [dict.chat.greeting, locale]);

  useEffect(() => {
    if (panel === "chat") {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [panel, messages, loading]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setPanel((p) => (p === "menu" ? null : p));
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages: Msg[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: dict.chat.error },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function toggleFab() {
    setPanel((p) => {
      if (p === "chat" || p === "contact") return null;
      return p === "menu" ? null : "menu";
    });
  }

  const fabOpen = panel !== null;

  return (
    <div
      ref={rootRef}
      className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 md:right-6 md:bottom-6"
    >
      {panel === "chat" && (
        <div className="flex h-[min(520px,65vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-sand-line">
          <div className="flex items-center gap-3 bg-header px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ocean">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{dict.chat.title}</p>
              <p className="text-xs text-white/75">{dict.chat.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="rounded p-1.5 hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-sky-soft/50 px-3 py-3">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "rounded-br-md bg-ocean text-white"
                      : "rounded-bl-md bg-white text-ink ring-1 ring-sand-line"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-muted ring-1 ring-sand-line">
                  <Loader2 className="h-4 w-4 animate-spin text-ocean" />
                  {dict.chat.writing}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length < 3 && (
            <div className="flex flex-wrap gap-2 border-t border-sand-line bg-white px-3 py-2">
              {dict.chat.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full bg-sky-soft px-2.5 py-1 text-xs font-medium text-ocean-deep transition hover:bg-ocean/15"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            className="flex items-center gap-2 border-t border-sand-line bg-white p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={dict.chat.placeholder}
              className="min-w-0 flex-1 rounded border border-sand-line px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-ocean text-white transition hover:bg-ocean-deep disabled:opacity-50"
              aria-label={dict.common.send}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {panel === "contact" && (
        <div className="w-[300px] overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-sand-line">
          <div className="relative bg-header px-4 py-4 text-white">
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="absolute top-2 right-2 rounded p-1 hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white">
                <Image
                  src="/images/brand/logo-mark.png"
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="40px"
                />
              </div>
              <div>
                <p className="text-sm font-bold">{dict.contactWidget.title}</p>
                <p className="text-xs text-white/70">{dict.contactWidget.slug}</p>
              </div>
            </div>
          </div>
          <p className="px-4 py-3 text-sm text-ink-muted">
            {dict.contactWidget.help}
          </p>
          <ul className="grid grid-cols-2 gap-2 px-4 pb-4">
            <li>
              <a
                href="tel:+34646080585"
                className="flex flex-col items-center gap-1 rounded-md bg-sky-soft px-2 py-3 text-xs font-bold text-ink transition hover:bg-ocean hover:text-white"
              >
                <Phone className="h-4 w-4" />
                {dict.common.phone}
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/34646080585"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-md bg-sky-soft px-2 py-3 text-xs font-bold text-ink transition hover:bg-ocean hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
                {dict.contactWidget.whatsapp}
              </a>
            </li>
            <li>
              <a
                href="https://m.me/LanzaroteExperienceTours"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-md bg-sky-soft px-2 py-3 text-xs font-bold text-ink transition hover:bg-ocean hover:text-white"
              >
                <Share2 className="h-4 w-4" />
                {dict.contactWidget.facebook}
              </a>
            </li>
            <li>
              <Link
                href={href("/contacto")}
                onClick={() => setPanel(null)}
                className="flex flex-col items-center gap-1 rounded-md bg-sky-soft px-2 py-3 text-xs font-bold text-ink transition hover:bg-ocean hover:text-white"
              >
                <Mail className="h-4 w-4" />
                {dict.common.email}
              </Link>
            </li>
          </ul>
        </div>
      )}

      {panel === "menu" && (
        <div
          className="animate-fade-up w-[min(240px,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-sand-line"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => setPanel("chat")}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-bold text-ink transition hover:bg-sky-soft"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-header text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>{dict.helpFab.chatIa}</span>
          </button>
          <div className="h-px bg-sand-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => setPanel("contact")}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-bold text-ink transition hover:bg-sky-soft"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ocean text-white">
              <MessageCircle className="h-4 w-4" />
            </span>
            <span>{dict.contactWidget.questions}</span>
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={toggleFab}
        className="inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-ocean-deep"
        aria-expanded={fabOpen}
        aria-haspopup="menu"
        aria-label={fabOpen ? "Close" : dict.helpFab.label}
      >
        {fabOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <>
            <MessageCircle className="h-4 w-4" />
            <span>{dict.helpFab.label}</span>
          </>
        )}
      </button>
    </div>
  );
}
