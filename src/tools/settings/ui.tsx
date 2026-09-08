"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
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
  API_BASE_KEY,
  checkHealth,
  fetchProviders,
  testLLMSettings,
  type ProviderSpec,
} from "../../lib/api";
import {
  clearLLMConfig,
  loadLLMConfig,
  saveLLMConfig,
} from "../../lib/llm-config";
import { clearHistory } from "../../lib/history";
import { ToolShell } from "../../components/tools/tool-shell";
import { Button } from "../../components/tools/button";
import { TextField } from "../../components/tools/inputs";
import { Select } from "../../components/tools/select";
import { meta } from "./meta";

const DEFAULT_BASE = "/api";
const CUSTOM_MODEL = "__custom__";

type TestState = "idle" | "loading" | "ok" | "fail";

export default function SystemSettingsUi() {
  const [apiBase, setApiBase] = useState(
    () => typeof window === "undefined" ? DEFAULT_BASE : (localStorage.getItem(API_BASE_KEY) ?? DEFAULT_BASE),
  );
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState<TestState>("idle");

  async function testConnection() {
    setTesting("loading");
    // 输入为空时探测真实生效地址（用户设置 > 构建期 > 同源 /api）
    const target = apiBase.trim();
    const ok = target ? await probeHealth(target) : await checkHealth();
    setTesting(ok ? "ok" : "fail");
    setTimeout(() => setTesting("idle"), 3000);
  }

  async function probeHealth(base: string): Promise<boolean> {
    try {
      const res = await fetch(`${base}/health`, { cache: "no-store" });
      return res.ok;
    } catch {
      return false;
    }
  }

  function save() {
    const v = apiBase.trim();
    // 清空保存 = 移除覆盖，让构建期 NEXT_PUBLIC_API_BASE / 同源 /api 生效
    if (v && v !== DEFAULT_BASE) localStorage.setItem(API_BASE_KEY, v);
    else localStorage.removeItem(API_BASE_KEY);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <LLMSection />

        <Section title="后端连接" desc="配置 Toolbox HTTP API 地址">
          <label className="block text-xs font-medium text-muted-foreground">
            API Base URL
          </label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <TextField
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
              placeholder={DEFAULT_BASE}
              className="flex-1"
            />
            <Button variant="outline" onClick={testConnection} disabled={testing === "loading"}>
              {testing === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              {testing === "ok" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {testing === "fail" && <CircleX className="h-4 w-4 text-red-500" />}
              测试连接
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button onClick={save}>
              <Save className="h-4 w-4" />
              保存
            </Button>
            <button
              onClick={() => setApiBase(DEFAULT_BASE)}
              className="text-xs text-muted-foreground hover:underline"
            >
              恢复默认
            </button>
            {saved && <span className="text-xs text-green-700 dark:text-green-400">✓ 已保存</span>}
          </div>
        </Section>

        <Section title="本地数据" desc="清理浏览器中保存的历史记录">
          <button
            onClick={() => {
              if (confirm("确认清空全部转换历史？")) clearHistory();
            }}
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive hover:bg-destructive/20"
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
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [saved, setSaved] = useState(false);

  const [pickedProvider, setPickedProvider] = useState<string>("");
  const [pickedModel, setPickedModel] = useState<string>("");
  const [customModel, setCustomModel] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");

  const [busy, setBusy] = useState<"idle" | "testing">("idle");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Load provider catalog from server
  useEffect(() => {
    fetchProviders()
      .then((cat) => {
        setProviders(cat);
        // Pre-fill from localStorage if available
        const saved = loadLLMConfig();
        const initialProvider = saved?.provider ?? cat[0]?.id ?? "";
        setPickedProvider(initialProvider);
        const spec = cat.find((p) => p.id === initialProvider);
        const initialModel = saved?.model ?? spec?.default_model ?? "";
        if (spec && !spec.models.includes(initialModel) && initialModel) {
          setPickedModel(CUSTOM_MODEL);
          setCustomModel(initialModel);
        } else {
          setPickedModel(initialModel);
        }
        if (saved?.api_key) setApiKey(saved.api_key);
      })
      .catch(() => {/* catalog load failure is non-fatal */})
      .finally(() => setLoadingCatalog(false));
  }, []);

  function chooseProvider(id: string) {
    const next = providers.find((provider) => provider.id === id);
    setPickedProvider(id);
    setPickedModel(next?.default_model ?? "");
    setCustomModel("");
  }

  const spec = providers.find((p) => p.id === pickedProvider);
  const effectiveModel = pickedModel === CUSTOM_MODEL ? customModel : pickedModel;
  const currentConfig = loadLLMConfig();

  function handleSave() {
    if (!effectiveModel.trim()) {
      setFeedback({ kind: "err", text: "请选择或输入模型名称" });
      return;
    }
    if (!apiKey.trim()) {
      setFeedback({ kind: "err", text: "请填入 API Key" });
      return;
    }
    saveLLMConfig({ provider: pickedProvider, model: effectiveModel, api_key: apiKey.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setFeedback(null);
  }

  function handleClear() {
    if (!confirm("确认删除已保存的 AI 配置？")) return;
    clearLLMConfig();
    setApiKey("");
    setFeedback({ kind: "ok", text: "✓ 已清除" });
  }

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
        model: effectiveModel,
        api_key: apiKey.trim(),
      });
      setFeedback({ kind: r.ok ? "ok" : "err", text: r.ok ? `✓ ${r.message}` : `✗ ${r.message}` });
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
          <Sparkles className="h-4 w-4 text-brand" /> AI 模型 (Vision LLM)
        </span>
      }
      desc="配置后 PDF → Markdown 自动走云端视觉大模型，质量最高。不配置则使用本地 Docling。"
    >
      {/* 红色隐私提示 */}
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          <span className="font-medium">密钥仅保存在此浏览器中。</span>
          清除浏览器数据、切换浏览器或设备后需重新填写。密钥不会上传至服务器存储，仅在转换时随请求发送给所选大模型服务商。
        </span>
      </div>

      {loadingCatalog ? (
        <div className="rounded-lg bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
          加载中…
        </div>
      ) : (
        <div className="space-y-4">
          {currentConfig && (
            <div className="rounded-lg border border-green-600/30 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-400">
              <span className="font-medium">已保存：</span>
              {providers.find((p) => p.id === currentConfig.provider)?.label ?? currentConfig.provider} ·{" "}
              <code className="font-mono">{currentConfig.model}</code>
            </div>
          )}

          {/* Provider */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Provider
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => chooseProvider(p.id)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition ${
                    pickedProvider === p.id
                      ? "border-ring bg-accent ring-2 ring-ring/30"
                      : "border-border bg-background hover:border-ring"
                  }`}
                >
                  <div className="text-sm font-medium text-foreground">{p.label}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{p.models.length} 个模型</div>
                </button>
              ))}
            </div>
          </div>

          {spec && (
            <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              {spec.description}{" "}
              <a
                href={spec.api_docs}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-brand hover:underline"
              >
                获取 API Key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* 模型选择 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              模型
            </label>
            <Select
              value={pickedModel}
              onChange={(v) => {
                setPickedModel(v);
                if (v !== CUSTOM_MODEL) setCustomModel("");
              }}
              options={[
                ...(spec?.models ?? []).map((m) => ({
                  value: m,
                  label: m === spec?.default_model ? `${m} · 推荐` : m,
                })),
                { value: CUSTOM_MODEL, label: "其他（自定义输入）..." },
              ]}
            />
            {pickedModel === CUSTOM_MODEL && (
              <TextField
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="输入任意模型名，如 gpt-4-turbo"
                className="mt-2 border-brand/40 font-mono"
                autoFocus
              />
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">厂商新模型可选「自定义输入」，无需等待更新</p>
          </div>

          {/* API Key */}
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <KeyRound className="h-3 w-3" /> API Key
            </label>
            <TextField
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="粘贴你的 API Key，如 sk-..."
              autoComplete="off"
              className="font-mono"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4" />
              {saved ? "✓ 已保存" : "保存到浏览器"}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={busy !== "idle" || !apiKey.trim()}>
              {busy === "testing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              测试连接
            </Button>
            {currentConfig && (
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="h-4 w-4" />
                清除
              </button>
            )}
          </div>

          {feedback && (
            <div className={`rounded-lg px-3 py-2 text-sm ${
              feedback.kind === "ok"
                ? "border border-green-600/30 bg-green-500/10 text-green-700 dark:text-green-400"
                : "border border-destructive/30 bg-destructive/10 text-destructive"
            }`}>
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
    <section className="rounded-2xl border border-border bg-background p-4 sm:p-6">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
