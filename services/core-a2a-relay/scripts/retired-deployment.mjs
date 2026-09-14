console.error(
  "Deployment blocked: this directory is a historical CORE relay snapshot. " +
  "Use https://github.com/AgenCi-MAIN/masterswitch/tree/main/services/core-a2a-relay " +
  "and its release procedure. For historical local emulation, run npm run dev."
);
process.exitCode = 1;
