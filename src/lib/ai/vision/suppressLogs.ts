/* MediaPipe / TensorFlow-Lite WASM print benign INFO lines through
   console.error (Emscripten routes stderr there). Next.js's dev error
   overlay then surfaces them as "Console Error" even though nothing is
   wrong. This filter drops ONLY those known-benign lines and passes
   every real error through untouched. Installed once, client-only. */

let installed = false;

const BENIGN = [
  "Created TensorFlow Lite XNNPACK delegate",
  "INFO: Created TensorFlow Lite",
  "XNNPACK delegate",
  "GL version",
  "Using WebGL",
  "TensorFlow Lite",
];

function isBenign(args: unknown[]): boolean {
  const first = args[0];
  return typeof first === "string" && BENIGN.some((n) => first.includes(n));
}

export function installVisionLogFilter(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (isBenign(args)) return;
    origError(...args);
  };

  const origWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (isBenign(args)) return;
    origWarn(...args);
  };
}
