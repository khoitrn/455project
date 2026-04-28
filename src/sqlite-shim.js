// Vite can't resolve 'node:sqlite' (bare 'sqlite' is not in builtinModules on Node 24).
// createRequire produces a real CJS require that Vite never rewrites, so the
// built-in loads fine at runtime without any static-analysis issues.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const { DatabaseSync } = require('node:sqlite');
