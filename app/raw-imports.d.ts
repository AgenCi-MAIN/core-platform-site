/**
 * Vite `?raw` imports — the file's text as a string, bundled at build time.
 * Used by app/portal/commission/route.ts to carry the commission schedule
 * document inside the worker bundle (see the comment there for why).
 */
declare module "*.html?raw" {
  const text: string;
  export default text;
}
