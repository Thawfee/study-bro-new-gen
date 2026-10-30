/* ============================================================
   Sound engine — every alert sound is synthesised with WebAudio,
   so there are no audio/video files to ship or fail to load.

     chime("nudge")   soft two-note ping for non-blocking nudges
     chime("success") rising arpeggio for rewards / correct answers
     chime("alert")   firm triple beep when an intervention opens
     startAlarm(kind) repeating alarm until stopAlarm() is called
   ============================================================ */

type ChimeKind = "nudge" | "success" | "alert" | "break";

let ctx: AudioContext | null = null;
let master = { volume: 0.8, enabled: true };

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Browsers only allow audio after a user gesture — call this from any click. */
export function unlockAudio(): void {
  audio();
}

export function configureSound(opts: { volume: number; enabled: boolean }): void {
  master = { volume: Math.max(0, Math.min(1, opts.volume / 100)), enabled: opts.enabled };
}

function tone(c: AudioContext, freq: number, start: number, dur: number, gain: number, type: OscillatorType = "sine") {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const peak = Math.max(0.0001, gain * master.volume);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

export function chime(kind: ChimeKind): void {
  if (!master.enabled) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime + 0.01;
  switch (kind) {
    case "nudge":
      tone(c, 740, t, 0.18, 0.12);
      tone(c, 988, t + 0.12, 0.24, 0.1);
      break;
    case "success":
      [523, 659, 784, 1047].forEach((f, i) => tone(c, f, t + i * 0.08, 0.22, 0.1, "triangle"));
      break;
    case "alert":
      [880, 880, 1175].forEach((f, i) => tone(c, f, t + i * 0.16, 0.13, 0.22, "square"));
      break;
    case "break":
      [392, 523, 659].forEach((f, i) => tone(c, f, t + i * 0.22, 0.5, 0.09));
      break;
  }
}

let alarmTimer: ReturnType<typeof setInterval> | null = null;
let alarmStep = 0;

/** Escalating alarm: gets a little louder each cycle until stopped. */
export function startAlarm(kind: "wake" | "phone"): void {
  stopAlarm();
  alarmStep = 0;
  const cycle = () => {
    if (!master.enabled) return;
    const c = audio();
    if (!c) return;
    const t = c.currentTime + 0.01;
    const boost = Math.min(1.6, 0.7 + alarmStep * 0.15);
    if (kind === "wake") {
      [988, 1319, 988, 1319].forEach((f, i) => tone(c, f, t + i * 0.12, 0.1, 0.22 * boost, "square"));
    } else {
      [660, 523].forEach((f, i) => tone(c, f, t + i * 0.2, 0.18, 0.2 * boost, "sawtooth"));
    }
    alarmStep += 1;
  };
  cycle();
  alarmTimer = setInterval(cycle, kind === "wake" ? 1200 : 1800);
}

export function stopAlarm(): void {
  if (alarmTimer) clearInterval(alarmTimer);
  alarmTimer = null;
}

/** Desktop notification (used when the study tab is hidden). */
export function notify(title: string, body: string): void {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    new Notification(title, { body, icon: "/icon.svg", tag: "studybro" });
  } catch {
    /* not supported */
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "granted") return true;
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}
