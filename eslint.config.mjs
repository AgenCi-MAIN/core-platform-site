import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated build output and prior deployment packages. These are bundled
    // artifacts, not source, and linting them reports rule violations from
    // vendored library code that we neither wrote nor can fix.
    "dist/**",
    ".openai/**",
    ".wrangler/**",
    // The a2a-canvas swarm package has its own toolchain and is excluded here
    // the same way `services` is excluded from the root tsconfig.
    "services/a2a-canvas/**",
  ]),
]);

export default eslintConfig;
