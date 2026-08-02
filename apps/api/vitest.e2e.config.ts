import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// Vitest transforma TS con esbuild por defecto, que no emite metadata de
// decoradores (emitDecoratorMetadata). NestJS depende de esa metadata para
// inyección de dependencias, así que las pruebas e2e necesitan SWC.
export default defineConfig({
  test: {
    include: ["test/**/*.e2e-spec.ts"],
    setupFiles: ["./test/load-test-env.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: "es2022",
      },
    }),
  ],
});
