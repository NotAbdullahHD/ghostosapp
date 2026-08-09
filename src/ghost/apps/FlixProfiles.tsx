import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Pencil, Plus, Trash2 } from "lucide-react";
import {
  PROFILE_AVATARS, createProfile, type FlixProfile,
} from "../profiles";

/**
 * GhostFlix "Who's watching?" — profile selection, creation and management.
 * Uses the shared GhostOS Obsidian language: glass panels, ice accent, no
 * per-app colour schemes.
 */
export function ProfileGate({
  profiles, onSelect, onSave,
}: {
  profiles: FlixProfile[];
  onSelect: (p: FlixProfile) => void;
  onSave: (list: FlixProfile[]) => void;
}) {
  const [managing, setManaging] = useState(false);
  const [editing, setEditing] = useState<FlixProfile | null>(null);
  const [creating, setCreating] = useState(profiles.length === 0);

  const upsert = (p: FlixProfile) => {
    const exists = profiles.some((x) => x.id === p.id);
    onSave(exists ? profiles.map((x) => (x.id === p.id ? p : x)) : [...profiles, p]);
  };

  const remove = (id: string) => {
    const next = profiles.filter((p) => p.id !== id);
    onSave(next);
    if (next.length === 0) { setManaging(false); setCreating(true); }
  };

  if (creating || editing) {
    return (
      <ProfileEditor
        initial={editing}
        onCancel={() => {
          setCreating(false);
          setEditing(null);
          if (profiles.length === 0) setCreating(true);
        }}
        onDone={(p) => { upsert(p); setCreating(false); setEditing(null); }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Who's watching?</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Pick a profile to continue on GhostFlix.</p>

      <div className="mt-10 flex flex-wrap items-start justify-center gap-6">
        {profiles.map((p) => (
          <div key={p.id} className="flex w-24 flex-col items-center gap-2">
            <button
              onClick={() => (managing ? setEditing(p) : onSelect(p))}
              className="group relative flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-secondary text-4xl transition hover:border-[var(--ice)]/50 hover:bg-accent"
            >
              <span>{p.avatar}</span>
              {managing && (
                <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/70 opacity-0 transition group-hover:opacity-100">
                  <Pencil className="h-5 w-5 text-foreground" />
                </span>
              )}
            </button>
            <div className="flex items-center gap-1.5">
              <span className="max-w-[6rem] truncate text-sm text-foreground/80">{p.name}</span>
              {p.kids && (
                <span className="rounded px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-[var(--ice)] ring-1 ring-[var(--ice)]/30">KIDS</span>
              )}
            </div>
            {managing && (
              <button
                onClick={() => remove(p.id)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            )}
          </div>
        ))}

        <div className="flex w-24 flex-col items-center gap-2">
          <button
            onClick={() => setCreating(true)}
            className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-border text-muted-foreground transition hover:border-[var(--ice)]/50 hover:text-foreground"
          >
            <Plus className="h-7 w-7" />
          </button>
          <span className="text-sm text-foreground/60">Add profile</span>
        </div>
      </div>

      <button
        onClick={() => setManaging((m) => !m)}
        className="mt-12 rounded-lg border border-border px-4 py-2 text-xs tracking-wide text-muted-foreground transition hover:bg-secondary hover:text-foreground"
      >
        {managing ? "Done" : "Manage profiles"}
      </button>
    </div>
  );
}

function ProfileEditor({
  initial, onDone, onCancel,
}: {
  initial: FlixProfile | null;
  onDone: (p: FlixProfile) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name ?? "");
  const [avatar, setAvatar] = useState(initial?.avatar ?? PROFILE_AVATARS[0]);
  const [kids, setKids] = useState(initial?.kids ?? false);

  const steps = ["Name", "Avatar", "Kids Mode"];
  const canNext = step !== 0 || name.trim().length > 0;

  const finish = () => {
    if (initial) onDone({ ...initial, name: name.trim().slice(0, 24) || "Guest", avatar, kids });
    else onDone(createProfile(name, avatar, kids));
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background px-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {initial ? "Edit profile" : "Create profile"}
          </h2>
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-[var(--ice)]" : "bg-secondary"}`}
              />
            ))}
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Step {step + 1} of 3 · {steps[step]}</p>

        <div className="mt-6 min-h-[160px]">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="name" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                <label className="text-xs text-muted-foreground">Profile name</label>
                <input
                  autoFocus value={name} maxLength={24}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && canNext) setStep(1); }}
                  placeholder="e.g. Alex"
                  className="mt-2 w-full rounded-xl border border-input bg-secondary px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--ice)]/50"
                />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="avatar" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                <label className="text-xs text-muted-foreground">Choose an avatar</label>
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {PROFILE_AVATARS.map((a) => (
                    <button
                      key={a} onClick={() => setAvatar(a)}
                      className={`flex h-12 items-center justify-center rounded-xl border text-2xl transition ${
                        avatar === a
                          ? "border-[var(--ice)]/60 bg-accent"
                          : "border-border bg-secondary hover:bg-accent"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="kids" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                <button
                  onClick={() => setKids((k) => !k)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary px-4 py-3 text-left"
                >
                  <span>
                    <span className="block text-sm text-foreground">Kids Mode</span>
                    <span className="block text-xs text-muted-foreground">Limits GhostFlix to family-friendly titles.</span>
                  </span>
                  <span className={`relative h-6 w-11 rounded-full transition ${kids ? "bg-[var(--ice)]" : "bg-white/10"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${kids ? "left-[22px]" : "left-0.5"}`} />
                  </span>
                </button>
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3">
                  <span className="text-3xl">{avatar}</span>
                  <div>
                    <div className="text-sm text-foreground">{name.trim() || "Guest"}</div>
                    <div className="text-xs text-muted-foreground">{kids ? "Kids profile" : "Standard profile"}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => (step === 0 ? onCancel() : setStep((s) => s - 1))}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < 2 ? (
            <button
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Check className="h-3.5 w-3.5" /> {initial ? "Save" : "Create"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
