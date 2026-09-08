"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { TextField } from "../../components/tools/inputs";
import { Select } from "../../components/tools/select";
import { meta } from "./meta";
import { ACTIVITY_FACTORS, bmi, bmiLabel, bmr, healthyWeightRange, type Activity, type Sex } from "./lib";

export default function HealthCalcUi() {
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("65");
  const [age, setAge] = useState("30");
  const [sex, setSex] = useState<Sex>("male");
  const [activity, setActivity] = useState<Activity>("medium");
  const numbers = useMemo(() => ({ height: Number(height), weight: Number(weight), age: Number(age) }), [height, weight, age]);
  const bmiValue = bmi(numbers.weight, numbers.height);
  const bmrValue = bmr(numbers.weight, numbers.height, numbers.age, sex);
  const range = healthyWeightRange(numbers.height);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <section className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2 lg:grid-cols-5">
          <ToolField label="身高（cm）"><TextField type="number" min="1" value={height} onChange={(e) => setHeight(e.target.value)} /></ToolField>
          <ToolField label="体重（kg）"><TextField type="number" min="1" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} /></ToolField>
          <ToolField label="年龄"><TextField type="number" min="1" value={age} onChange={(e) => setAge(e.target.value)} /></ToolField>
          <ToolField label="生理性别"><Select value={sex} onChange={(v) => setSex(v as Sex)} options={[{ value: "male", label: "男" }, { value: "female", label: "女" }]} /></ToolField>
          <ToolField label="活动量"><Select value={activity} onChange={(v) => setActivity(v as Activity)} options={Object.entries(ACTIVITY_FACTORS).map(([value, item]) => ({ value, label: item.label }))} /></ToolField>
        </section>

        {!bmiValue || !bmrValue || !range ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">请填写大于 0 的身高、体重和年龄。</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Result title="BMI" value={bmiValue.toFixed(1)} note={bmiLabel(bmiValue).label} tone={bmiLabel(bmiValue).tone} />
            <Result title="健康体重范围" value={`${range[0].toFixed(1)}–${range[1].toFixed(1)} kg`} note="按 BMI 18.5–23.9" />
            <Result title="基础代谢（BMR）" value={`${Math.round(bmrValue)} kcal`} note="静息状态每天所需能量" />
            <Result title="维持热量（TDEE）" value={`${Math.round(bmrValue * ACTIVITY_FACTORS[activity].factor)} kcal`} note="按活动量估算的每日热量" />
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>计算结果仅作健康管理参考，不构成医疗建议。孕期、未成年人、慢性病或特殊训练人群请咨询医生或营养师。</p>
        </div>
      </div>
    </ToolShell>
  );
}

function Result({ title, value, note, tone = "text-foreground" }: { title: string; value: string; note: string; tone?: string }) {
  return <div className="rounded-xl border border-border bg-background p-4"><div className="text-xs text-muted-foreground">{title}</div><div className={`mt-2 text-2xl font-semibold tabular-nums ${tone}`}>{value}</div><div className="mt-1 text-[11px] text-muted-foreground">{note}</div></div>;
}
