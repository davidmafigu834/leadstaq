/**
 * Fire a promise without blocking the caller. Errors are logged, never thrown.
 * On Vercel, uses `waitUntil` so the serverless invocation stays alive until the task finishes.
 */
export function background(taskName: string, task: () => Promise<void>): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@vercel/functions") as { waitUntil?: (p: Promise<unknown>) => void };
    if (typeof mod.waitUntil === "function") {
      mod.waitUntil(
        task().catch((err: unknown) => {
          console.error(
            JSON.stringify({
              ts: new Date().toISOString(),
              event: "background.task.failed",
              taskName,
              error: err instanceof Error ? err.message : String(err),
              stack: err instanceof Error ? err.stack : undefined,
            })
          );
        })
      );
      return;
    }
  } catch {
    /* @vercel/functions not installed or not on Vercel */
  }

  void task().catch((err: unknown) => {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: "background.task.failed",
        taskName,
        error: err instanceof Error ? err.message : String(err),
      })
    );
  });
}
