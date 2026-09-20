await import('./run.mjs');
if(process.exitCode)process.exit(process.exitCode);
await import('./boundaries.mjs');
if(process.exitCode)process.exit(process.exitCode);
await import('./age-capacity.mjs');
