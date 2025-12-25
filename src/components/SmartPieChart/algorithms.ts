import type { PieFeature } from "./algorithms.d";
import type { PieItem } from "./index.d";

export function extractFeature(data: PieItem[]): PieFeature {
  const values: number[] = [];
  let total = 0;
  let max = -Infinity;
  let min = Infinity;

  // 单次遍历：统计基础指标
  for (const { value } of data) {
    if (value <= 0) continue;
    values.push(value);
    total += value;
    if (value > max) max = value;
    if (value < min) min = value;
  }

  const count = values.length;
  const mean = total / count;

  // 排序一次即可（后面多处复用）
  const sortedAsc = [...values].sort((a, b) => a - b);
  const sortedDesc = [...sortedAsc].reverse();

  const median =
    count % 2 === 0
      ? (sortedAsc[count / 2 - 1] + sortedAsc[count / 2]) / 2
      : sortedAsc[Math.floor(count / 2)];

  // 方差 / 标准差
  let variance = 0;
  for (const v of values) {
    variance += (v - mean) ** 2;
  }
  variance /= count;

  // Gini 系数（n 通常很小，允许 O(n²)）
  let giniSum = 0;
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      giniSum += Math.abs(values[i] - values[j]);
    }
  }
  const gini = giniSum / (2 * count * count * mean);

  // —— 重点值（Key Item）判定 ——
  const maxRatio = max / total;
  const secondMax = sortedDesc[1] ?? 0;

  const hasKeyItem =
    maxRatio >= 0.4 || (secondMax > 0 && max / secondMax >= 1.8);

  return {
    total,
    count,
    max,
    min,
    mean,
    median,
    std: Math.sqrt(variance),
    maxRatio,
    gini,
    hasKeyItem,
  };
}

export function decidePieType(feature: PieFeature): "pie" | "cycle" {
  if (feature.hasKeyItem) {
    return "pie";
  }

  let score = 0;
  if (feature.count > 5) score++;
  if (feature.maxRatio < 0.5) score++;
  if (feature.gini < 0.4) score++;

  return score >= 2 ? "cycle" : "pie";
}

export function smartMergeOthers(data: PieItem[]): PieItem[] {
  if (data.length <= 6) return data;

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, i) => s + i.value, 0);

  let acc = 0;
  let cutIndex = -1;

  for (let i = 0; i < sorted.length; i++) {
    acc += sorted[i].value / total;
    if (acc >= 0.8 || i >= 5) {
      cutIndex = i;
      break;
    }
  }

  if (cutIndex === -1 || cutIndex === sorted.length - 1) {
    return data;
  }

  const otherSum = sorted.slice(cutIndex + 1).reduce((s, i) => s + i.value, 0);

  return [
    ...sorted.slice(0, cutIndex + 1),
    { name: "其他", value: otherSum, isOther: true },
  ];
}

export function markSpecialItems(
  data: PieItem[],
  feature: PieFeature
): PieItem[] {
  const values = data.map((d) => d.value).sort((a, b) => a - b);
  const q1 = values[Math.floor(values.length * 0.25)];
  const q3 = values[Math.floor(values.length * 0.75)];
  const iqr = q3 - q1;

  return data.map((item) => {
    if (item.value > q3 + 1.5 * iqr) {
      return { ...item, emphasisType: "outlier" };
    }
    if (item.value / feature.total >= 0.4) {
      return { ...item, emphasisType: "key" };
    }
    return item;
  });
}

export function generateColors(data: PieItem[]) {
  return data.map((item, idx) => {
    if (item.isOther) return "#D9D9D9";
    if (item.emphasisType === "outlier") return "#FF4D4F";
    const hue = (idx * 360) / data.length;
    return `hsl(${hue},70%,55%)`;
  });
}

export function generateLabel(count: number) {
  return {
    show: true,
    position: count > 6 ? "outside" : "inside",
    formatter: ({ name, percent }: any) =>
      percent < 5 ? "" : `${name} ${percent}%`,
  };
}

export function generateLegend(count: number) {
  return {
    orient: count > 8 ? "vertical" : "horizontal",
    bottom: count > 8 ? "center" : 0,
  };
}

export function generateSmartPieOption(rawData: PieItem[]) {
  const feature = extractFeature(rawData);
  const pieType = decidePieType(feature);
  const merged = smartMergeOthers(rawData);
  const marked = markSpecialItems(merged, feature);

  return {
    feature,
    pieType,
    merged,
    marked,
  };
}
