"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleX,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
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
import { ToolShell } from "../../components/tools/tool-shell";
import { meta } from "./meta";

const STORAGE_KEY = "toolbox.apiBase";
const DEFAULT_BASE = "/api";
const ADMIN_TOKEN_KEY = "toolbox.adminToken";
const CUSTOM_MODEL = "__custom__";

type TestState = "idle" | "loading" | "ok" | "fail";

export default function SystemSettingsUi() {
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
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
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
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              onClick={testConnection}
              disabled={testing === "loading"}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {testing === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              {testing === "ok" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {testing === "fail" && <CircleX className="h-4 w-4 text-red-500" />}
              测试连接
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={save}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              保存并刷新
            </button>
            <button
              onClick={() => setApiBase(DEFAULT_BASE)}
              className="text-xs text-slate-500 hover:underline"
            >
              恢复默认
            </button>
            {saved && <span className="text-xs text-green-600">✓ 已保存</span>}
          </div>
        </Section>

        <Section title="本地数据" desc="清理浏览器中保存的历史记录、收藏与最近使用">
          <button
            onClick={() => {
              if (confirm("确认清空全部转换历史？")) clearHistory();
            }}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            清空转换历史
          </button>
        </Section>
      </div>
    </ToolShell>
  );
}

function LLMSection() {
  const [providers, setProviders] = useState<ProviderSpec[]>([]);
  const [current, setCurrent] = useState<LLMSettingsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminExpanded, setAdminExpanded] = useState(false);

  const [pickedProvider, setPickedProvider] = useState<string>("");
  const [pickedModel, setPickedModel] = useState<string>("");
  const [customModel, setCustomModel] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [adminToken, setAdminToken] = useState<string>(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? ""
      : "",
  );

  const [busy, setBusy] = useState<"idle" | "saving" | "testing" | "clearing">("idle");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([fetchProviders(), fetchLLMSettings()])
      .then(([cat, cur]) => {
        setProviders(cat);
        setCurrent(cur);
        const initialProvider = cur.provider ?? cat[0]?.id ?? "";
        setPickedProvider(initialProvider);
        const spec = cat.find((p) => p.id === initialProvider);
        const initialModel = cur.model ?? spec?.default_model ?? "";
        if (spec && !spec.models.includes(initialModel) && initialModel) {
          setPickedModel(CUSTOM_MODEL);
          setCustomModel(initialModel);
        } else {
          setPickedModel(initialModel);
        }
      })
      .catch((e) => setFeedback({ kind: "err", text: `加载失败：${e.message}` }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const spec = providers.find((p) => p.id === pickedProvider);
    if (!spec) return;
    setPickedModel(spec.default_model);
    setCustomModel("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedProvider]);

  const spec = providers.find((p) => p.id === pickedProvider);
  const effectiveModel = pickedModel === CUSTOM_MODEL ? customModel : pickedModel;

  function saveAdminToken(val: string) {
    setAdminToken(val);
    sessionStorage.setItem(ADMIN_TOKEN_KEY, val);
  }

  async function handleTest() {
    if (!apiKey.trim()) {
      setFeedback({ kind: "err", text: "请先填入 API Key" });
      return;
    }
    setBusy("testing");
    setFeedback(null);
    try {
      const r = await testLLMSettings(
        { provider: pickedProvider, model: effectiveModel, api_key: apiKey.trim() },
        adminToken.trim() || undefined,
      );
      setFeedback({ kind: r.ok ? "ok" : "err", text: r.ok ? `✓ ${r.message}` : `✗ ${r.message}` });
    } catch (e) {
      setFeedback({ kind: "err", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy("idle");
    }
  }

  async function handleSave() {
    if (!effectiveModel.trim()) {
      setFeedback({ kind: "err", text: "请选择或输入模型名称" });
      return;
    }
    if (!apiKey.trim()) {
      setFeedback({ kind: "err", text: "请填入 API Key" });
      return;
    }
    setBusy("saving");
    setFeedback(null);
    try {
      const updated = await saveLLMSettings(
        { provider: pickedProvider, model: effectiveModel, api_key: apiKey.trim() },
        adminToken.trim() || undefined,
      );
      setCurrent(updated);
      setApiKey("");
      setFeedback({ kind: "ok", text: "✓ 已保存，PDF→MD 将走云端 LLM" });
    } catch (e) {
      setFeedback({ kind: "err", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy("idle");
    }
  }

  async function handleClear() {
    if (!confirm("确认删除已保存的 LLM 配置？删除后 PDF→MD 回退到本地 Docling。")) return;
    setBusy("clearing");
    try {
      await clearLLMSettings(adminToken.trim() || undefined);
      const cur = await fetchLLMSettings();
      setCurrent(cur);
      setApiKey("");
      setFeedback({ kind: "ok", text: "✓ 已清除" });
    } catch (e) {
      setFeedback({ kind: "err", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy("idle");
    }
  }

  return (
    <Section
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" /> AI 模型 (Vision LLM)
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
          {/* 当前状态 — 所有用户可见 */}
          <div className={`rounded-lg border px-3 py-2.5 text-xs ${
            current?.has_key
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200"
              : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          }`}>
            {current?.has_key && current.provider && current.model ? (
              <>
                <span className="font-medium">已配置：</span>
                {providers.find((p) => p.id === current.provider)?.label} ·{" "}
                <code className="font-mono">{current.model}</code>
              </>
            ) : (
              "未配置 · PDF→Markdown 使用本地 Docling（质量较低）"
            )}
          </div>

          {/* 管理员配置 — 折叠区 */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setAdminExpanded((v) => !v); setFeedback(null); }}
              className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> 管理员配置
              </span>
              {adminExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>

            {adminExpanded && (
              <div className="space-y-4 border-t border-slate-200 px-3 pb-4 pt-3 dark:border-slate-700">
                {/* 管理员令牌 */}
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <KeyRound className="h-3 w-3" /> 管理员令牌
                  </label>
                  <input
                    type="password"
                    value={adminToken}
                    onChange={(e) => saveAdminToken(e.target.value)}
                    placeholder="服务器 TOOLBOX_ADMIN_TOKEN 的值"
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">本次会话结束前不需重填</p>
                </div>

                {/* Provider 选择 */}
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

                {/* 模型选择：下拉 + 自定义输入 */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    模型
                  </label>
                  <select
                    value={pickedModel}
                    onChange={(e) => {
                      setPickedModel(e.target.value);
                      if (e.target.value !== CUSTOM_MODEL) setCustomModel("");
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {spec?.models.map((m) => (
                      <option key={m} value={m}>
                        {m}{m === spec.default_model ? " · 推荐" : ""}
                      </option>
                    ))}
                    <option value={CUSTOM_MODEL}>其他（自定义输入）...</option>
                  </select>
                  {pickedModel === CUSTOM_MODEL && (
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="输入任意模型名，如 gpt-4-turbo"
                      className="mt-2 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 font-mono text-sm dark:border-blue-700 dark:bg-slate-900 dark:text-slate-100"
                      autoFocus
                    />
                  )}
                  <p className="mt-1 text-[11px] text-slate-400">厂商新模型可选「自定义输入」，无需等待更新</p>
                </div>

                {/* API Key */}
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <KeyRound className="h-3 w-3" /> API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={current?.has_key ? `已保存（${current.key_preview}）— 留空则保留现有 Key` : "粘贴你的 API Key，如 sk-..."}
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Key 仅保存在服务器本地，不上传第三方
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSave}
                    disabled={busy !== "idle" || !apiKey.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                  >
                    {busy === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    保存
                  </button>
                  <button
                    onClick={handleTest}
                    disabled={busy !== "idle" || !apiKey.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {busy === "testing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    测试连接
                  </button>
                  {current?.has_key && (
                    <button
                      onClick={handleClear}
                      disabled={busy !== "idle"}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-40 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      清除配置
                    </button>
                  )}
                </div>

                {feedback && (
                  <div className={`rounded-lg px-3 py-2 text-sm ${
                    feedback.kind === "ok"
                      ? "border border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200"
                      : "border border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
                  }`}>
                    {feedback.text}
                  </div>
                )}
              </div>
            )}
          </div>
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
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
