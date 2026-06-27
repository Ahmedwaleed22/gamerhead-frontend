// Minimal `process` for the browser IIFE. App modules (lib/api.ts, lib/gtag.ts)
// read process.env.* at module scope; without this they throw
// "ReferenceError: process is not defined" and abort the whole bundle.
// Imported FIRST in ds-entry.tsx so it evaluates before any app module (ESM
// evaluates imported modules in source order).
const g = globalThis as unknown as { process?: { env?: Record<string, string> } }
if (!g.process) g.process = { env: {} }
if (!g.process.env) g.process.env = {}
if (!g.process.env.NODE_ENV) g.process.env.NODE_ENV = 'production'

export {}
