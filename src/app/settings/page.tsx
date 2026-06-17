"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleX,
  ExternalLink,
  KeyRound,
  Loader2,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  checkHealth,
  clearLLMSettings,
  fetchLLMSettings,
  fetchProviders,
  saveLLMSettings,
  testLLMSettings,
  type LLMSettingsView,
  type ProviderSpec,
} from "../../lib/api";
import { clearHistory } from "../../lib/history";

const STORAGE_KEY = "toolbox.apiBase";
const DEFAULT_BASE = "http://127.0.0.1:8000";

type TestState = "idle" | "loading" | "ok" | "fail";

export default function SettingsPage() {
  const [apiBase, setApiBase] = useState("");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState<TestState>("idle");

  useEffect(() => {
    setApiBase(localStorage.getItem(STORAGE_KEY) ?? DEFAULT_BASE);
  }, []);

  async function testConnection() {
    setTesting("loading");
    const ok = await checkHealth();
    setTesting(ok ? "ok" : "fail");
    setTimeout(() => setTesting("idle"), 3000);
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, apiBase.trim() || DEFAULT_BASE);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setTimeout(() => location.reload(), 500);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <LLMSection />

      <Section title="后端连接" desc="配置 Toolbox HTTP API 地址">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
          API Base URL
        </label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder={DEFAULT_BASE}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900"
          />
          <button
            onClick={testConnection}
            disabled={testing === "loading"}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {testing === "loading" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {testing === "ok" && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            {testing === "fail" && <CircleX className="h-4 w-4 text-red-500" />}
            测试连接
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            保存并刷新
          </button>
          <button
            onClick={() => setApiBase(DEFAULT_BASE)}
            className="text-xs text-slate-500 hover:text-slate-700 hover:underline dark:hover:text-slate-300"
          >
            恢复默认
          </button>
          {saved && <span className="text-xs text-green-600">✓ 已保存</span>}
        </div>
      </Section>

      <Section title="本地数据" desc="清理浏览器中保存的历史记录">
        <button
          onClick={() => {
            if (confirm("确认清空全部转换历史？")) clearHistory();
          }}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
        >
          清空转换历史
        </button>
      </Section>

      <Section title="关于" desc="Toolbox v0.1.0">
        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <li>· 后端核心：Python + FastAPI + Typer</li>
          <li>· 引擎层：Vision-LLM · Docling · MarkItDown · Pandoc · LibreOffice</li>
          <li>· 路由：BFS 自动找最短转换路径</li>
          <li>· License：MIT（项目本体）</li>
        </ul>
      </Section>
    </div>
  );
}

// ============================================================
//                AI 模型 (Vision LLM) Section
// ============================================================

function LLMSection() {
  const [providers, setProviders] = useState<ProviderSpec[]>([]);
  const [current, setCurrent] = useState<LLMSettingsView | null>(null);
  const [loading, setLoading] = useState(true);

  const [pickedProvider, setPickedProvider] = useState<string>("");
  const [pickedModel, setPickedModel] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");

  const [busy, setBusy] = useState<"idle" | "saving" | "testing" | "clearing">(
    "idle",
  );
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  // Load catalog + current settings on mount.
  useEffect(() => {
    Promise.all([fetchProviders(), fetchLLMSettings()])
      .then(([cat, cur]) => {
        setProviders(cat);
        setCurrent(cur);
        const initialProvider = cur.provider ?? cat[0]?.id ?? "";
        setPickedProvider(initialProvider);
        const spec = cat.find((p) => p.id === initialProvider);
        setPickedModel(cur.model ?? spec?.default_model ?? "");
      })
      .catch((e) =>
        setFeedback({ kind: "err", text: `加载失败：${e.message}` }),
      )
      .finally(() => setLoading(false));
  }, []);

  // When provider changes, reset to that provider's default model.
  useEffect(() => {
    const spec = providers.find((p) => p.id === pickedProvider);
    if (!spec) return;
    if (!spec.models.includes(pickedModel)) {
      setPickedModel(spec.default_model);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedProvider]);

  const spec = providers.find((p) => p.id === pickedProvider);

  async function handleTest() {
    if (!apiKey.trim()) {
      setFeedback({ kind: "err", text: "请先填入 API Key" });
      return;
    }
    setBusy("testing");
    setFeedback(null);
    try {
      const r = await testLLMSettings({
        provider: pickedProvider,
        model: pickedModel,
        api_key: apiKey.trim(),
      });
      setFeedback({
        kind: r.ok ? "ok" : "err",
        text: r.ok ? `✓ ${r.message}` : `✗ ${r.message}`,
      });
    } catch (e) {
      setFeedback({
        kind: "err",
        text: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy("idle");
    }
  }

  async function handleSave() {
    if (!apiKey.trim()) {
      setFeedback({ kind: "err", text: "请填入 API Key" });
      return;
    }
    setBusy("saving");
    setFeedback(null);
    try {
      const updated = await saveLLMSettings({
        provider: pickedProvider,
        model: pickedModel,
        api_key: apiKey.trim(),
      });
      setCurrent(updated);
      setApiKey("");
      setFeedback({ kind: "ok", text: "✓ 已保存，PDF→MD 将走云端 LLM" });
    } catch (e) {
      setFeedback({
        kind: "err",
        text: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy("idle");
    }
  }

  async function handleClear() {
    if (!confirm("确认删除已保存的 LLM 配置？删除后 PDF→MD 回退到本地 Docling。"))
      return;
    setBusy("clearing");
    try {
      await clearLLMSettings();
      const cur = await fetchLLMSettings();
      setCurrent(cur);
      setApiKey("");
      setFeedback({ kind: "ok", text: "✓ 已清除" });
    } catch (e) {
      setFeedback({
        kind: "err",
        text: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy("idle");
    }
  }

  return (
    <Section
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          AI 模型 (Vision LLM)
        </span>
      }
      desc="配置后 PDF → Markdown 自动走云端视觉大模型，质量最高。不配置则回退到本地 Docling。"
    >
      {loading ? (
        <div className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500 dark:bg-slate-900">
          加载中…
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current status pill */}
          {current?.has_key && current.provider && current.model && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
              <span className="font-medium">当前已配置：</span>
              {providers.find((p) => p.id === current.provider)?.label} ·{" "}
              <code className="font-mono">{current.model}</code> · key{" "}
              <code className="font-mono">{current.key_preview}</code>
            </div>
          )}

          {/* Provider radio cards */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Provider
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPickedProvider(p.id)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition ${
                    pickedProvider === p.id
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-950/40 dark:ring-blue-900"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {p.label}
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {p.models.length} 个模型
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected provider description */}
          {spec && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              {spec.description}{" "}
              <a
                href={spec.api_docs}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                获取 API Key
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Model select */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              模型
            </label>
            <select
              value={pickedModel}
              onChange={(e) => setPickedModel(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {spec?.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                  {m === spec.default_model ? "（推荐）" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* API key */}
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              <KeyRound className="h-3 w-3" />
              API Key
              {current?.has_key && (
                <span className="ml-2 text-[10px] text-slate-400">
                  （留空表示保留现有 key）
                </span>
              )}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={current?.has_key ? "•••••• 已保存" : "sk-..."}
              autoComplete="off"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSave}
              disabled={busy !== "idle" || !apiKey.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
            >
              {busy === "saving" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              保存
            </button>
            <button
              onClick={handleTest}
              disabled={busy !== "idle" || !apiKey.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {busy === "testing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              测试连接
            </button>
            {current?.has_key && (
              <button
                onClick={handleClear}
                disabled={busy !== "idle"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
              >
                <Trash2 className="h-4 w-4" />
                清除配置
              </button>
            )}
          </div>

          {feedback && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                feedback.kind === "ok"
                  ? "border border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200"
                  : "border border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
              }`}
            >
              {feedback.text}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: React.ReactNode;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-950">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h2>
      {desc && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {desc}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
