"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, Sparkles, Send, X } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

type Msg = { role: "user" | "assistant"; content: string };

export function AIChat() {
  const pathname = usePathname();
  const { dict, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: dict.chat.greeting },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: dict.chat.greeting }]);
  }, [dict.chat.greeting, locale]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [open, messages, loading]);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed right-4 bottom-[5.5rem] z-50 flex items-center gap-2 rounded-full bg-header px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-bg-deep md:right-6"
        aria-label={open ? "Close" : "AI Chat"}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            <span className="hidden sm:inline">Chat IA</span>
          </>
        )}
      </button>

      {open && (
        <div className="fixed right-4 bottom-[9.5rem] z-50 flex h-[min(520px,65vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-sand-line md:right-6">
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
              onClick={() => setOpen(false)}
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
    </>
  );
}
