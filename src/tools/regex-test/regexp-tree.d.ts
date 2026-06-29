declare module "regexp-tree" {
  // regexp-tree ships no types and is CommonJS; we only use parse().
  const rt: { parse(source: string): any };
  export default rt;
}
