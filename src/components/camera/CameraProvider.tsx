"use client";

/* ============================================================
   Persistent camera + vision engine.

   The <video>/<canvas> live in ONE fixed "dock" for the whole app,
   so AI monitoring keeps running while the student opens Notes,
   Tasks or Review. On pages that render a <CameraSlot/>, the dock
   snaps exactly over that slot; everywhere else it shrinks into a
   small floating preview.
   ============================================================ */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Loader2, Maximize2, RefreshCw } from "lucide-react";
import { useCamera, type CameraStatus } from "@/hooks/useCamera";
import { useVisionEngine, type LiveVision } from "@/hooks/useVisionEngine";
import { cn } from "@/lib/utils";

interface CameraContextValue {
  status: CameraStatus;
  error: string | null;
  active: boolean;
  live: LiveVision;
  start: () => Promise<void>;
  stop: () => void;
  recalibrate: () => void;
}

const CameraCtx = createContext<CameraContextValue | null>(null);

export function useCameraControl(): CameraContextValue {
  const ctx = useContext(CameraCtx);
  if (!ctx) throw new Error("useCameraControl must be used within <CameraProvider>");
  return ctx;
}

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const { status, error, videoRef, start, stop } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const active = status === "active";
  const live = useVisionEngine(videoRef, canvasRef, active, retryKey);

  const value: CameraContextValue = {
    status,
    error,
    active,
    live,
    start,
    stop,
    recalibrate: () => setRetryKey((k) => k + 1),
  };

  return (
    <CameraCtx.Provider value={value}>
      {children}
      <CameraDock videoRef={videoRef} canvasRef={canvasRef} live={live} active={active} onRetry={value.recalibrate} />
    </CameraCtx.Provider>
  );
}

/* ------------------------------- Dock -------------------------------- */

function CameraDock({
  videoRef,
  canvasRef,
  live,
  active,
  onRetry,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  live: LiveVision;
  active: boolean;
  onRetry: () => void;
}) {
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [docked, setDocked] = useState(false);
  const dockedRef = useRef(false);
  const pathname = usePathname();

  // Track the slot every frame (cheap: one querySelector + one rect).
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = dockRef.current;
      if (!el) return;
      const slot = document.querySelector<HTMLElement>("[data-camera-slot]");
      const isDocked = !!slot;
      if (isDocked !== dockedRef.current) {
        dockedRef.current = isDocked;
        setDocked(isDocked);
      }
      if (slot) {
        const r = slot.getBoundingClientRect();
        el.style.top = `${r.top}px`;
        el.style.left = `${r.left}px`;
        el.style.width = `${r.width}px`;
        el.style.height = `${r.height}px`;
        el.style.right = "";
        el.style.bottom = "";
      } else {
        const mobile = window.innerWidth < 1024;
        const w = mobile ? 132 : 232;
        el.style.width = `${w}px`;
        el.style.height = `${Math.round(w * 0.75)}px`;
        el.style.top = "";
        el.style.left = "";
        el.style.right = mobile ? "12px" : "20px";
        el.style.bottom = mobile ? "84px" : "20px";
      }
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const showMini = active && !docked;
  const hidden = !active;

  return (
    <div
      ref={dockRef}
      aria-hidden={hidden}
      className={cn(
        "fixed z-20 overflow-hidden bg-black",
        docked ? "rounded-2xl" : "rounded-2xl border border-white/15 shadow-2xl shadow-black/60",
        hidden && "pointer-events-none invisible",
      )}
      style={{ top: -9999, left: -9999, width: 1, height: 1 }}
    >
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className={cn("pointer-events-none absolute inset-0 h-full w-full object-cover", showMini && "opacity-0")} />

      {/* status pill */}
      {active && (
        <div className={cn("pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-0.5 font-semibold text-white backdrop-blur", showMini ? "text-[9px]" : "text-[11px]")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", live.status === "error" ? "bg-amber-300" : live.calibrating ? "bg-cyan-300" : live.status === "running" ? "animate-pulse bg-rose-400" : "bg-amber-300")} />
          {live.status === "error" ? "AI offline" : live.status === "loading" ? "Loading AI" : live.calibrating ? `Calibrating ${live.calibrationProgress}%` : "AI live"}
        </div>
      )}

      {/* docked overlays */}
      {docked && active && live.status === "running" && live.calibrating && (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-4">
          <div className="max-w-sm rounded-xl bg-black/70 px-4 py-3 text-center text-xs text-cyan-50 backdrop-blur">
            <p className="font-semibold">Calibrating to your face</p>
            <p className="mt-1 text-cyan-100/75">Sit normally, look at the screen and keep your eyes open for 3 seconds.</p>
            <div className="mx-auto mt-2 h-1.5 w-44 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${live.calibrationProgress}%` }} />
            </div>
          </div>
        </div>
      )}
      {docked && active && live.status === "loading" && (
        <div className="absolute inset-0 grid place-items-center bg-black/50 text-sm text-slate-200">
          <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading AI models (first time only)…</span>
        </div>
      )}
      {docked && active && live.status === "error" && (
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-2 bg-black/75 px-3 py-2 text-xs text-amber-200">
          {live.error}
          <button onClick={onRetry} className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-slate-100">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* mini preview controls */}
      {showMini && pathname !== "/focus" && (
        <Link href="/focus" className="absolute inset-0 flex items-end justify-end p-1.5" aria-label="Open focus session">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-black/60 text-white"><Maximize2 size={12} /></span>
        </Link>
      )}
    </div>
  );
}
