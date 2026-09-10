// Turbopack 将 `with { turbopackModuleType: "asset" }` 的导入处理为静态资源，
// 默认导出资源 URL（Worker 内 fetch 后传给 initSqlJs 的 wasmBinary）。
declare module "sql.js/dist/sql-wasm.wasm" {
  const wasmUrl: string;
  export default wasmUrl;
}
