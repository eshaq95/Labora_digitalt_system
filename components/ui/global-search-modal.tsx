import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SearchItem = {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon?: string;
  section: "Varer" | "Bestillinger" | "Leverandører" | "Lager";
};

type SearchResponse = {
  items: SearchItem[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSearch: (q: string) => Promise<SearchResponse>;
  onNavigate: (href: string) => void;
};

export default function GlobalSearchModal({ open, onClose, onSearch, onNavigate }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Basic debouncer
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setItems([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await onSearch(q.trim());
        setItems(res.items);
      } catch (e) {
        setError("Kunne ikke søke nå. Prøv igjen.");
      } finally {
        setLoading(false);
        setActiveIndex(0);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, onSearch, open]);

  // Autofocus when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQ("");
      setItems([]);
      setError(null);
      setLoading(false);
      setActiveIndex(0);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Recent search handling
  const recentsKey = "ld_recent_searches";
  const recents = useMemo<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(recentsKey) || "[]");
    } catch {
      return [];
    }
  }, [open]);

  const addRecent = (term: string) => {
    try {
      const next = [term, ...recents.filter((r) => r !== term)].slice(0, 6);
      localStorage.setItem(recentsKey, JSON.stringify(next));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Group by section
  const grouped = useMemo(() => {
    const map: Record<string, SearchItem[]> = {};
    for (const it of items) {
      map[it.section] = map[it.section] || [];
      map[it.section].push(it);
    }
    return map;
  }, [items]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (items[activeIndex]) {
        addRecent(q);
        onNavigate(items[activeIndex].href);
        onClose();
      }
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50"
        aria-modal="true"
        role="dialog"
        onKeyDown={handleKeyDown}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="absolute left-1/2 top-24 w-[min(720px,92vw)] -translate-x-1/2 rounded-2xl bg-white dark:bg-slate-800 shadow-xl ring-1 ring-black/10 dark:ring-white/10"
        >
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-lg">🔍</div>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Søk i varer, bestillinger, leverandører …"
              className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-gray-900 dark:text-gray-100"
            />
            <kbd className="rounded bg-slate-100 dark:bg-slate-700 px-2 py-1 text-[11px] text-slate-500 dark:text-slate-400">
              ESC
            </kbd>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {/* Empty state: quick actions + recents */}
            {!q && (
              <div className="p-2">
                <SectionTitle>Hurtigvalg</SectionTitle>
                <QuickLinks onNavigate={onNavigate} onClose={onClose} />
                {recents.length > 0 && (
                  <>
                    <SectionTitle className="mt-4">Siste søk</SectionTitle>
                    <div className="flex flex-wrap gap-2">
                      {recents.map((r) => (
                        <button
                          key={r}
                          className="rounded-full border border-gray-200 dark:border-slate-600 px-2.5 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
                          onClick={() => setQ(r)}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Loading */}
            {q && loading && (
              <ul className="p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <li key={i} className="animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700 h-10 my-2" />
                ))}
              </ul>
            )}

            {/* Error */}
            {q && !loading && error && (
              <div className="p-4 text-sm text-red-600 dark:text-red-400">{error}</div>
            )}

            {/* No results */}
            {q && !loading && !error && items.length === 0 && (
              <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
                Ingen treff for "{q}".
              </div>
            )}

            {/* Results */}
            {q && !loading && !error && items.length > 0 && (
              <div className="pb-2">
                {(["Varer", "Bestillinger", "Leverandører", "Lager"] as const).map((sec) => {
                  const rows = grouped[sec] || [];
                  if (!rows.length) return null;
                  return (
                    <div key={sec} className="p-2">
                      <SectionTitle>{sec}</SectionTitle>
                      <ul className="mt-1">
                        {rows.map((it) => {
                          const globalIndex = items.findIndex((x) => x.id === it.id);
                          const active = globalIndex === activeIndex;
                          return (
                            <li key={it.id}>
                              <button
                                className={
                                  "w-full text-left px-3 py-2 rounded-lg border mb-1 transition-colors " +
                                  (active
                                    ? "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                                    : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-700")
                                }
                                onMouseEnter={() => setActiveIndex(globalIndex)}
                                onClick={() => {
                                  addRecent(q);
                                  onNavigate(it.href);
                                  onClose();
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-5 text-slate-500 dark:text-slate-400">
                                    {it.icon ?? "•"}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {it.label}
                                    </div>
                                    {it.sublabel && (
                                      <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {it.sublabel}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-400 dark:text-slate-500">
                                    {it.section}
                                  </div>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SectionTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-2 pb-1 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 ${className}`}
    >
      {children}
    </div>
  );
}

function QuickLinks({
  onNavigate,
  onClose,
}: {
  onNavigate: (href: string) => void;
  onClose: () => void;
}) {
  const links = [
    { label: "Alle varer", href: "/items", icon: "📦" },
    { label: "Bestillinger", href: "/orders", icon: "🧾" },
    { label: "Leverandører", href: "/suppliers", icon: "🚚" },
    { label: "Lagerstatus", href: "/inventory", icon: "📊" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {links.map((l) => (
        <button
          key={l.href}
          className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-600 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
          onClick={() => {
            onNavigate(l.href);
            onClose();
          }}
        >
          <span>{l.icon}</span>
          <span className="text-sm">{l.label}</span>
        </button>
      ))}
    </div>
  );
}
