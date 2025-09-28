let worker: Worker | null = null;
const listeners = new Map<string, (msg:any)=>void>();

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./worker/cadWorker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e) => {
    const { id } = e.data || {};
    const cb = listeners.get(id);
    if (cb) cb(e.data);
  };
  return worker;
}

export async function runJob<T=any>(cmd: any, opts: { timeoutMs?: number } = {}) : Promise<T> {
  const w = ensureWorker();
  const id = crypto.randomUUID();
  const msg = new Promise<any>((resolve) => listeners.set(id, resolve));
  w.postMessage({ id, ...cmd });
  const res = await Promise.race([
    msg,
    new Promise((_, rej) => setTimeout(() => rej(new Error("Worker timeout")), opts.timeoutMs ?? 6000))
  ]);
  listeners.delete(id);
  if (!res?.ok) throw new Error(res?.error || "Kernel error");
  return res.result as T;
}