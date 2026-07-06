import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Search, Calendar as CalIcon, Clock, MapPin } from "lucide-react";

type ViewMode = "month" | "week" | "day";

interface CalEvent {
  id: string;
  title: string;
  date: string; // ISO
  duration: string;
  color: string;
  location?: string;
}

const SAMPLE: CalEvent[] = [
  { id: "1", title: "Ghost sync standup", date: new Date().toISOString(), duration: "30m", color: "from-fuchsia-500 to-violet-600", location: "GhostChat" },
  { id: "2", title: "Design review · Control Center", date: new Date(Date.now() + 3600e3 * 3).toISOString(), duration: "1h", color: "from-cyan-500 to-blue-600", location: "Room 07" },
  { id: "3", title: "GhostFlix screening", date: new Date(Date.now() + 3600e3 * 26).toISOString(), duration: "2h", color: "from-rose-500 to-red-600" },
  { id: "4", title: "Deep work: Notes engine", date: new Date(Date.now() + 3600e3 * 50).toISOString(), duration: "3h", color: "from-emerald-500 to-teal-600" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_ABBR = ["S","M","T","W","T","F","S"];

export function CalendarApp() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [view, setView] = useState<ViewMode>("month");
  const [selected, setSelected] = useState<Date>(today);

  const monthGrid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startWeekday = first.getDay();
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(first);
      d.setDate(1 - startWeekday + i);
      days.push(d);
    }
    return days;
  }, [cursor]);

  const eventsFor = (d: Date) =>
    SAMPLE.filter((e) => {
      const ed = new Date(e.date);
      return ed.toDateString() === d.toDateString();
    });

  const upcoming = SAMPLE.slice().sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const nav = (delta: number) => {
    const c = new Date(cursor);
    if (view === "month") c.setMonth(c.getMonth() + delta);
    else if (view === "week") c.setDate(c.getDate() + delta * 7);
    else c.setDate(c.getDate() + delta);
    setCursor(c);
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-black via-rose-950/10 to-black text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 flex flex-col">
        <div className="p-4">
          <div className="text-[10px] tracking-[0.4em] text-rose-300/70 font-mono">GHOSTOS</div>
          <div className="text-xl font-bold mt-1">Calendar</div>
        </div>
        <div className="px-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10">
            <Search className="h-3 w-3 text-white/40" />
            <input placeholder="Search events" className="bg-transparent outline-none text-xs flex-1 placeholder:text-white/30" />
          </div>
        </div>

        {/* Mini calendar */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</div>
            <div className="flex gap-1">
              <button onClick={() => nav(-1)} className="h-6 w-6 rounded-md hover:bg-white/10 flex items-center justify-center"><ChevronLeft className="h-3 w-3" /></button>
              <button onClick={() => nav(1)} className="h-6 w-6 rounded-md hover:bg-white/10 flex items-center justify-center"><ChevronRight className="h-3 w-3" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[9px] font-mono text-white/40 mb-1">
            {DAY_ABBR.map((d, i) => <div key={i} className="text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthGrid.slice(0, 35).map((d) => {
              const isCur = d.getMonth() === cursor.getMonth();
              const isToday = d.toDateString() === today.toDateString();
              const isSel = d.toDateString() === selected.toDateString();
              const has = eventsFor(d).length > 0;
              return (
                <button key={d.toISOString()} onClick={() => setSelected(d)}
                  className={`h-7 text-[10px] rounded-md flex items-center justify-center relative transition ${
                    isSel ? "bg-rose-500 text-white" : isToday ? "ring-1 ring-rose-400 text-white" : isCur ? "text-white/80 hover:bg-white/10" : "text-white/25 hover:bg-white/5"
                  }`}>
                  {d.getDate()}
                  {has && !isSel && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-rose-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendars list */}
        <div className="px-4 mt-2 space-y-1">
          <div className="text-[10px] font-mono tracking-widest text-white/40 mb-2">CALENDARS</div>
          {[
            { c: "bg-fuchsia-400", l: "Personal" },
            { c: "bg-cyan-400", l: "Work" },
            { c: "bg-emerald-400", l: "Ghost Team" },
            { c: "bg-rose-400", l: "Events" },
          ].map((k) => (
            <div key={k.l} className="flex items-center gap-2 text-xs text-white/70 py-1">
              <div className={`h-2.5 w-2.5 rounded-sm ${k.c}`} />
              {k.l}
            </div>
          ))}
        </div>

        <div className="flex-1" />
        <div className="p-4">
          <button className="w-full flex items-center justify-center gap-2 rounded-xl gradient-neon py-2.5 text-sm font-bold shadow-lg shadow-fuchsia-500/30 hover:scale-[1.02] transition">
            <Plus className="h-4 w-4" /> New Event
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <CalIcon className="h-4 w-4 text-rose-300" />
            <div className="text-lg font-bold">
              {view === "month" && `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`}
              {view === "week" && `Week of ${cursor.toLocaleDateString()}`}
              {view === "day" && cursor.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div className="flex gap-1 ml-2">
              <button onClick={() => nav(-1)} className="h-7 w-7 rounded-md hover:bg-white/10 flex items-center justify-center"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), today.getDate())); setSelected(today); }}
                className="px-3 h-7 rounded-md text-xs font-mono text-white/70 hover:bg-white/10">TODAY</button>
              <button onClick={() => nav(1)} className="h-7 w-7 rounded-md hover:bg-white/10 flex items-center justify-center"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex rounded-full bg-white/5 ring-1 ring-white/10 p-1 text-[10px] font-mono">
            {(["month", "week", "day"] as ViewMode[]).map((m) => (
              <button key={m} onClick={() => setView(m)}
                className={`px-3 py-1 rounded-full tracking-widest uppercase transition ${view === m ? "bg-rose-500 text-white" : "text-white/60 hover:text-white"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex min-h-0">
          <div className="flex-1 min-w-0 overflow-auto scrollbar-hide p-4">
            <AnimatePresence mode="wait">
              {view === "month" && (
                <motion.div key="m" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="grid grid-cols-7 text-[10px] font-mono text-white/40 tracking-widest mb-2">
                    {["SUN","MON","TUE","WED","THU","FRI","SAT"].map((d) => <div key={d} className="px-2">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {monthGrid.map((d) => {
                      const isCur = d.getMonth() === cursor.getMonth();
                      const isToday = d.toDateString() === today.toDateString();
                      const evs = eventsFor(d);
                      return (
                        <button key={d.toISOString()} onClick={() => setSelected(d)}
                          className={`min-h-[86px] text-left rounded-lg p-2 ring-1 transition ${
                            isCur ? "ring-white/5 bg-white/[0.02] hover:bg-white/5" : "ring-transparent bg-transparent text-white/25"
                          }`}>
                          <div className={`text-xs font-bold mb-1 inline-flex items-center justify-center h-6 w-6 rounded-full ${isToday ? "bg-rose-500 text-white" : ""}`}>
                            {d.getDate()}
                          </div>
                          <div className="space-y-1">
                            {evs.slice(0, 2).map((e) => (
                              <div key={e.id} className={`text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r ${e.color} text-white truncate`}>
                                {e.title}
                              </div>
                            ))}
                            {evs.length > 2 && <div className="text-[10px] text-white/40">+{evs.length - 2} more</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
              {view === "week" && (
                <motion.div key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full flex flex-col">
                  <EmptyState label="Week view — schedule grid coming soon" />
                </motion.div>
              )}
              {view === "day" && (
                <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full flex flex-col">
                  <EmptyState label={`Nothing on ${cursor.toLocaleDateString([], { month: "long", day: "numeric" })}. Enjoy the quiet.`} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right sidebar: upcoming / today */}
          <div className="w-72 border-l border-white/5 p-4 overflow-y-auto scrollbar-hide">
            <div className="text-[10px] font-mono tracking-widest text-white/40 mb-2">TODAY · {today.toLocaleDateString([], { weekday: "long" }).toUpperCase()}</div>
            <div className="text-3xl font-bold">{today.getDate()} <span className="text-lg font-normal text-white/50">{MONTHS[today.getMonth()].slice(0, 3)}</span></div>
            <div className="mt-4 space-y-2">
              {eventsFor(today).length === 0 && (
                <div className="text-xs text-white/40 italic">No events today.</div>
              )}
              {eventsFor(today).map((e) => (
                <div key={e.id} className="rounded-xl p-3 ring-1 ring-white/10 bg-white/5">
                  <div className={`h-1 w-8 rounded-full mb-2 bg-gradient-to-r ${e.color}`} />
                  <div className="text-sm font-bold">{e.title}</div>
                  <div className="text-[10px] font-mono text-white/50 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>· {e.duration}</span>
                  </div>
                  {e.location && (
                    <div className="text-[10px] font-mono text-white/40 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" /> {e.location}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-[10px] font-mono tracking-widest text-white/40 mt-6 mb-2">UPCOMING</div>
            <div className="space-y-2">
              {upcoming.map((e) => (
                <div key={e.id} className="rounded-lg p-2.5 ring-1 ring-white/5 hover:bg-white/5 transition flex items-center gap-2">
                  <div className={`h-9 w-1 rounded-full bg-gradient-to-b ${e.color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate">{e.title}</div>
                    <div className="text-[10px] font-mono text-white/50">
                      {new Date(e.date).toLocaleDateString([], { month: "short", day: "numeric" })} · {new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
      <div className="h-16 w-16 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center mb-4">
        <CalIcon className="h-7 w-7 text-white/40" />
      </div>
      <div className="text-sm text-white/60">{label}</div>
      <button className="mt-4 px-4 py-2 rounded-full text-xs font-mono tracking-widest gradient-neon text-white hover:scale-105 transition">
        + ADD EVENT
      </button>
    </div>
  );
}
