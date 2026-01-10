/* ============================================================
 * 智能图表：单 Y 轴异常值 / 关键值检测（优化版）
 * ============================================================
 */
import type { AutoDetectConfig, SmartLineSeriesType } from "../index.d";

export interface HighlightPoint {
  index: number; // 数据点索引（xAxis index）
  value: number; // 数据原始值
  type: "outlier" | "trendDeviation" | "keyPoint";
  reason: string; // 标注原因（Explainable）
}

/** 检测配置项 */
export interface DetectionOptions {
  iqrMultiplier?: number; // IQR 系数，默认 1.5
  trendSigma?: number; // 趋势偏离标准差倍数，默认 2.5
  sharpChangeSigma?: number; // 突变检测标准差倍数，默认 2
  minSamplesForIqr?: number; // IQR 最小样本量，默认 5
  minSamplesForTrend?: number; // 趋势检测最小样本量，默认 6
  minSamplesForSharpChange?: number; // 突变检测最小样本量，默认 3
}

const DEFAULT_OPTIONS: Required<DetectionOptions> = {
  iqrMultiplier: 1.5,
  trendSigma: 2.5,
  sharpChangeSigma: 2,
  minSamplesForIqr: 5,
  minSamplesForTrend: 6,
  minSamplesForSharpChange: 3,
};

/** ========================
 * 基础统计工具函数
 * ======================== */

/** 均值（处理空数组） */
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** 标准差（处理空数组） */
function std(arr: number[], mu: number): number {
  if (arr.length === 0) return 0;
  const variance =
    arr.reduce((s, v) => s + Math.pow(v - mu, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/** 安全的最大/最小值查找（避免栈溢出） */
function findMinMax(values: number[]): {
  min: number;
  max: number;
  minIdx: number;
  maxIdx: number;
} {
  let min = values[0];
  let max = values[0];
  let minIdx = 0;
  let maxIdx = 0;

  for (let i = 1; i < values.length; i++) {
    if (values[i] < min) {
      min = values[i];
      minIdx = i;
    }
    if (values[i] > max) {
      max = values[i];
      maxIdx = i;
    }
  }

  return { min, max, minIdx, maxIdx };
}

/** 分位数（数组需已排序） */
function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

/** ========================
 * ① IQR 统计异常（鲁棒）
 * ======================== */

function detectIqrOutliers(
  values: number[],
  opts: Required<DetectionOptions>
): HighlightPoint[] {
  if (values.length < opts.minSamplesForIqr) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;

  if (iqr === 0) return [];

  const lower = q1 - opts.iqrMultiplier * iqr;
  const upper = q3 + opts.iqrMultiplier * iqr;

  return values
    .map((v, index) =>
      v < lower || v > upper
        ? {
            index,
            value: v,
            type: "outlier" as const,
            reason: "IQR 统计离群值",
          }
        : null
    )
    .filter(Boolean) as HighlightPoint[];
}

/** ========================
 * ② 趋势残差异常（仅 Line）
 * ======================== */

function linearRegression(values: number[]) {
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);

  let num = 0;
  let den = 0;

  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += Math.pow(i - xMean, 2);
  }

  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  return { slope, intercept };
}

function detectTrendDeviation(
  values: number[],
  opts: Required<DetectionOptions>
): HighlightPoint[] {
  if (values.length < opts.minSamplesForTrend) return [];

  const { slope, intercept } = linearRegression(values);

  const residuals = values.map((v, i) => v - (slope * i + intercept));

  const mu = mean(residuals);
  const sigma = std(residuals, mu);

  if (sigma === 0) return [];

  return residuals
    .map((r, index) =>
      Math.abs(r - mu) > opts.trendSigma * sigma
        ? {
            index,
            value: values[index],
            type: "trendDeviation" as const,
            reason: "明显偏离整体趋势",
          }
        : null
    )
    .filter(Boolean) as HighlightPoint[];
}

/** ========================
 * ③ 关键点检测（非异常）
 * ======================== */

/** 全局最大 / 最小（优化：单次遍历，只标记首个极值点） */
function detectGlobalExtrema(values: number[]): HighlightPoint[] {
  if (values.length === 0) return [];

  const { min, max, minIdx, maxIdx } = findMinMax(values);
  const result: HighlightPoint[] = [];

  result.push({
    index: maxIdx,
    value: max,
    type: "keyPoint" as const,
    reason: "全局最大值",
  });

  // 如果最大最小是同一个点，不重复添加
  if (minIdx !== maxIdx) {
    result.push({
      index: minIdx,
      value: min,
      type: "keyPoint" as const,
      reason: "全局最小值",
    });
  }

  return result;
}

/** 突增 / 突降（变化率异常） */
function detectSharpChange(
  values: number[],
  opts: Required<DetectionOptions>
): HighlightPoint[] {
  if (values.length < opts.minSamplesForSharpChange) return [];

  const diffs = values.slice(1).map((v, i) => v - values[i]);
  const mu = mean(diffs);
  const sigma = std(diffs, mu);

  if (sigma === 0) return [];

  return diffs
    .map((d, i) =>
      Math.abs(d - mu) > opts.sharpChangeSigma * sigma
        ? {
            index: i + 1,
            value: values[i + 1],
            type: "keyPoint" as const,
            reason: d > 0 ? "突增" : "突降",
          }
        : null
    )
    .filter(Boolean) as HighlightPoint[];
}

/** ========================
 * 对外入口（单 Y 轴，带去重）
 * ======================== */

// 类型优先级：outlier > trendDeviation > keyPoint
const TYPE_PRIORITY: Record<HighlightPoint["type"], number> = {
  outlier: 3,
  trendDeviation: 2,
  keyPoint: 1,
};

function autoDetectOutliersAndKeys(
  values: number[],
  chartType: SmartLineSeriesType,
  detectConfig?: AutoDetectConfig
): HighlightPoint[] {
  if (!detectConfig) return [];

  const { checkOutliers, checkMaxMin, checkSharpChange, checkTrendDeviation } =
    detectConfig || {};
  const opts = DEFAULT_OPTIONS;

  // 使用 Map 按索引去重，保留优先级最高的标记
  const resultMap = new Map<number, HighlightPoint>();

  const addPoint = (point: HighlightPoint) => {
    const existing = resultMap.get(point.index);
    if (!existing || TYPE_PRIORITY[point.type] > TYPE_PRIORITY[existing.type]) {
      resultMap.set(point.index, point);
    }
  };

  // 依次检测并去重
  // 检测离群值
  if (checkOutliers) {
    detectIqrOutliers(values, opts).forEach(addPoint);
  }
  // 检测最大最小值
  if (checkMaxMin) {
    detectGlobalExtrema(values).forEach(addPoint);
  }
  // 检测突变
  if (checkSharpChange) {
    detectSharpChange(values, opts).forEach(addPoint);
  }
  // 检测趋势偏离
  if (checkTrendDeviation && chartType === "line") {
    detectTrendDeviation(values, opts).forEach(addPoint);
  }

  // 按索引排序返回
  return Array.from(resultMap.values()).sort((a, b) => a.index - b.index);
}

export default autoDetectOutliersAndKeys;
export { DEFAULT_OPTIONS };
