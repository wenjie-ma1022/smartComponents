/*******************************************************
 * 单 Y 轴异常值 / 关键值检测算法
 *******************************************************
 */

import type { AutoDetectConfig, SmartLineSeriesType } from "../index.d";

export interface HighlightPoint {
  index: number;
  value: number;
  type: "outlier" | "trendDeviation" | "keyPoint";
  reason: string;
}

export interface DetectionOptions {
  iqrMultiplier?: number;
  trendSigma?: number;
  sharpChangeSigma?: number;
  minSamplesForIqr?: number;
  minSamplesForTrend?: number;
  minSamplesForSharpChange?: number;
  minR2ForTrend?: number; // [新增] 线性拟合度阈值，低于此值不检测趋势异常
  debug?: boolean; // [新增] 是否打印调试日志
}

/** 算法检测配置项（支持自定义阈值） */
const DEFAULT_OPTIONS: Required<DetectionOptions> = {
  iqrMultiplier: 1.5,
  trendSigma: 2.5,
  sharpChangeSigma: 3.0,
  minSamplesForIqr: 5,
  minSamplesForTrend: 6,
  minSamplesForSharpChange: 3,
  minR2ForTrend: 0.4, // 默认：如果拟合度小于 0.4，认为不具备线性趋势
  debug: false,
};

/** ========================
 * 基础统计工具函数
 * ======================== */

/** 计算均值 */
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** 计算样本标准差 (Sample Standard Deviation, N-1) */
function std(arr: number[], mu: number): number {
  if (arr.length <= 1) return 0;
  const variance =
    arr.reduce((s, v) => s + Math.pow(v - mu, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/** 计算分位数 (Linear Interpolation) */
function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

/** 线性回归，增加返回 R-Squared (R2) */
function linearRegression(values: number[]) {
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);

  let num = 0; // 协方差分子
  let den = 0; // x的方差分母

  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean;
    num += xDiff * (values[i] - yMean);
    den += xDiff * xDiff;
  }

  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  // 计算 R2 (决定系数) 0~1，越接近1线性越强
  // SS_tot: 总离差平方和
  // SS_res: 残差平方和
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yPred = slope * i + intercept;
    ssTot += Math.pow(values[i] - yMean, 2);
    ssRes += Math.pow(values[i] - yPred, 2);
  }

  // 避免 ssTot 为 0 (所有数据值相同)
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

/** ========================
 * 具体检测算法
 * ======================== */

/** ① IQR 统计异常（箱线图逻辑） */
function detectIqrOutliers(
  values: number[],
  opts: Required<DetectionOptions>
): HighlightPoint[] {
  if (values.length < opts.minSamplesForIqr) return [];

  // 拷贝并排序，避免修改原数组
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;

  // 数据完全一致时 IQR 为 0，忽略
  if (iqr === 0) return [];
  const lower = q1 - opts.iqrMultiplier * iqr;
  const upper = q3 + opts.iqrMultiplier * iqr;

  return values
    .map((v, index) => {
      if (v < lower || v > upper) {
        return {
          index,
          value: v,
          type: "outlier", // 离群值
          reason: v < lower ? "数值异常偏低" : "数值异常偏高",
        } as HighlightPoint;
      }
      return null;
    })
    .filter((v): v is HighlightPoint => v !== null);
}

/** ② 趋势残差异常（检测偏离线性回归线的点） */
function detectTrendDeviation(
  values: number[],
  opts: Required<DetectionOptions>
): HighlightPoint[] {
  if (values.length < opts.minSamplesForTrend) return [];

  const { slope, intercept, r2 } = linearRegression(values);

  // [优化] 如果数据根本不像一条直线，强行做趋势检测没有意义
  if (r2 < opts.minR2ForTrend) {
    if (opts.debug)
      console.log(`[Trend] R2 (${r2.toFixed(2)}) 低于阈值，跳过趋势检测`);
    return [];
  }

  const residuals = values.map((v, i) => v - (slope * i + intercept));
  const mu = mean(residuals);
  const sigma = std(residuals, mu);

  if (sigma === 0) return [];

  return residuals
    .map((r, index) => {
      // 使用 Z-Score 判定残差是否异常
      if (Math.abs(r - mu) > opts.trendSigma * sigma) {
        return {
          index,
          value: values[index],
          type: "trendDeviation", // 趋势偏离
          reason: "明显偏离整体趋势",
        } as HighlightPoint;
      }
      return null;
    })
    .filter((v): v is HighlightPoint => v !== null);
}

/** ③ 关键点：全局最大/最小值（支持并列极值） */
function detectGlobalExtrema(values: number[]): HighlightPoint[] {
  if (values.length === 0) return [];
  let min = values[0];
  let max = values[0];

  // 第一次遍历：找数值
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  // 特殊情况：直线（最大值等于最小值），通常只标记第一个或不标记
  // 这里选择只标记第一个点作为代表，避免全屏高亮
  if (min === max) {
    return [{ index: 0, value: max, type: "keyPoint", reason: "全量恒定值" }];
  }
  const result: HighlightPoint[] = [];

  // 第二次遍历：找索引（支持多个峰值）
  values.forEach((v, i) => {
    if (v === max) {
      result.push({
        index: i,
        value: v,
        type: "keyPoint", // 全局极值
        reason: "全局最大值",
      });
    } else if (v === min) {
      result.push({
        index: i,
        value: v,
        type: "keyPoint",
        reason: "全局最小值",
      });
    }
  });
  return result;
}

/** ④ 关键点：突增 / 突降（基于一阶差分） */
function detectSharpChange(
  values: number[],
  opts: Required<DetectionOptions>
): HighlightPoint[] {
  if (values.length < opts.minSamplesForSharpChange) return [];

  // 计算相邻点差值 diff[i] = v[i] - v[i-1]
  const diffs: number[] = [];
  for (let i = 1; i < values.length; i++) {
    diffs.push(values[i] - values[i - 1]);
  }
  const mu = mean(diffs);
  const sigma = std(diffs, mu);
  if (sigma === 0) return [];

  return diffs
    .map((d, i) => {
      // 这里的 i 对应的是 values 数组中的 i + 1
      const realIndex = i + 1;
      if (Math.abs(d - mu) > opts.sharpChangeSigma * sigma) {
        return {
          index: realIndex,
          value: values[realIndex],
          type: "keyPoint", // 突变检测
          reason: d > 0 ? "数据突增" : "数据突降",
        } as HighlightPoint;
      }
      return null;
    })
    .filter((v): v is HighlightPoint => v !== null);
}

/** ========================
 * 主入口函数
 * ======================== */

// 优先级定义：数值越大优先级越高
const TYPE_PRIORITY: Record<HighlightPoint["type"], number> = {
  outlier: 3,
  trendDeviation: 2,
  keyPoint: 1,
};

/**
 * 自动检测图表数据的异常值与关键点
 * @param values Y轴数据数组
 * @param chartType 图表类型，部分算法仅对 line 有效
 * @param detectConfig 配置项（开关 + 阈值参数）
 */
function autoDetectOutliersAndKeys(
  values: number[],
  chartType: SmartLineSeriesType,
  detectConfig?: AutoDetectConfig & Partial<DetectionOptions>
): HighlightPoint[] {
  if (!detectConfig || values.length === 0) return [];

  // 1. 合并配置
  const opts: Required<DetectionOptions> = {
    ...DEFAULT_OPTIONS,
    ...detectConfig,
  };

  // 2. 数据清洗与索引映射
  const validEntries = values
    .map((v, i) => ({ value: v, originalIndex: i }))
    .filter((e) => Number.isFinite(e.value));

  if (validEntries.length === 0) {
    if (opts.debug) console.warn("[AutoDetect] 数据全部无效，跳过");
    return [];
  }

  if (opts.debug && validEntries.length < values.length) {
    console.warn(
      `[AutoDetect] 过滤了 ${values.length - validEntries.length} 个无效点`
    );
  }

  const cleanValues = validEntries.map((e) => e.value);
  const toOriginalIndex = (cleanIndex: number) =>
    validEntries[cleanIndex].originalIndex;

  // 3. 结果容器
  const resultMap = new Map<number, HighlightPoint>();
  const addPoint = (point: HighlightPoint) => {
    const existing = resultMap.get(point.index);
    // 如果该点之前没有标记，或者新标记的优先级更高，则更新
    if (!existing || TYPE_PRIORITY[point.type] > TYPE_PRIORITY[existing.type]) {
      resultMap.set(point.index, point);
    }
  };

  // 4. 辅助函数：映射回原始索引
  const mapToOriginalIndex = (points: HighlightPoint[]): HighlightPoint[] =>
    points.map((p) => ({
      ...p,
      index: toOriginalIndex(p.index),
      value: values[toOriginalIndex(p.index)], // 确保拿到原始值
    }));

  const { checkOutliers, checkMaxMin, checkSharpChange, checkTrendDeviation } =
    detectConfig;

  // 5. 执行检测流程

  // （1） 离群值 (最高优先级)
  if (checkOutliers) {
    mapToOriginalIndex(detectIqrOutliers(cleanValues, opts)).forEach(addPoint);
  }

  // （2） 趋势偏离 (仅折线图有效)
  if (checkTrendDeviation && chartType === "line") {
    mapToOriginalIndex(detectTrendDeviation(cleanValues, opts)).forEach(
      addPoint
    );
  }

  // （3） 突变检测 (归类为 KeyPoint)
  if (checkSharpChange) {
    mapToOriginalIndex(detectSharpChange(cleanValues, opts)).forEach(addPoint);
  }

  // （4） 全局最大/最小值 (最低优先级)
  if (checkMaxMin) {
    mapToOriginalIndex(detectGlobalExtrema(cleanValues)).forEach(addPoint);
  }

  // === 返回结果 ===
  // 按索引排序，方便前端按顺序渲染
  return Array.from(resultMap.values()).sort((a, b) => a.index - b.index);
}

export default autoDetectOutliersAndKeys;
