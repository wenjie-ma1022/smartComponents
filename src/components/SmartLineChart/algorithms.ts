/**
 * 自动双轴判断 + 自动左右 Y 轴推荐
 * 输出LineChart 的 mapConfig
 */

import type {
  Stats,
  Metrics,
  Vectors,
  AssignResult,
  DataSourceItem,
  SmartLineChartConfig,
} from "./algorithms.d";
import { kMeansPlusPlus } from "@/utils/algorithmsLab/k_means++";

// --------------- 算法经验值，可能需要优化 ---------------
const MAX_GAP: number = 10; // 最大差距倍数

// --------------- 工具函数：统计(最大值，最小值，中位数) -----------------------------
function getStats(arr: number[]): Stats {
  const sorted = [...arr].sort((a, b) => a - b);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
  };
}

// --------------- 自动判断是否需要双轴图 -----------------------
function shouldUseDualAxis(metrics: Metrics): boolean {
  const keys = Object.keys(metrics);

  //   指标数量小于2，不需要双轴图
  if (keys.length < 2) return false;

  const allNumber = keys.every((k) =>
    metrics[k].values.every((v) => typeof v === "number")
  );

  //   指标值不是数字，不需要双轴图
  if (!allNumber) return false;

  //   数值类型判断（比例，绝对值）
  const types = keys.map((name) => {
    const { min, max } = metrics[name].stats;
    return min >= -1 && max <= 1 ? "ratio" : "absolute";
  });

  const hasRatio = types.includes("ratio");
  const hasAbs = types.includes("absolute");
  if (hasRatio && hasAbs) return true;

  const maxVals = keys.map((k) => metrics[k].stats.max);
  const gap = Math.max(...maxVals) / Math.min(...maxVals);

  return gap > MAX_GAP;
}

// ---------------- 自动分配左右轴 ----------------------------
function assignLeftRight(metrics: Metrics): AssignResult {
  const vectors: Vectors = {};

  Object.keys(metrics).forEach((k) => {
    const { min, max, median } = metrics[k].stats;
    vectors[k] = [min, max, median];
  });

  function medianOfGroup(g: string[]): number {
    return g.reduce((s, key) => s + metrics[key].stats.median, 0) / g.length;
  }

  // k-means++ 聚类算法，k = 2
  const [left, right] = kMeansPlusPlus(vectors, 2).sort(
    (a, b) => medianOfGroup(b) - medianOfGroup(a)
  );

  return { left, right };
}

// ----------------- 核心：生成 LineChart mapConfig -----------------
export function buildSmartLineChartConfig(
  dataSource: DataSourceItem[],
  xAxisField?: string
): SmartLineChartConfig {
  if (!dataSource?.length) return { isDual: false };

  const metricKeys = Object.keys(dataSource[0]).filter((k) => k !== xAxisField);

  // 构造指标统计
  const metrics: Metrics = {};
  metricKeys.forEach((key) => {
    const values = dataSource.map((d) => d[key]);
    metrics[key] = {
      values,
      stats: getStats(values),
    };
  });

  const needDual = shouldUseDualAxis(metrics);

  // ----------- 单轴情况 -----------------
  if (!needDual) {
    return { isDual: false };
  }

  // ----------- 双轴 + 自动分配左右 ----------------
  const { left, right } = assignLeftRight(metrics);

  return {
    isDual: true,
    category: { left, right },
  };
}
