import { kMeansPlusPlus } from "@/components/algorithmsLab/k_means++";
import type {
  Stats,
  Metrics,
  Vectors,
  AssignResult,
  DataSourceItem,
  SmartLineChartConfig,
} from "./index.d";

// --------------- 算法经验值配置（统一管理，便于调优） ---------------
const MAX_GAP = 10; // 双轴判断：最大差距倍数

/******************************************************
 * 自动双轴判断 + 自动左右 Y 轴推荐算法
 * 输出：是否开启双轴，以及左右分组
 ******************************************************/

// --------------- 工具函数：统计(最大值，最小值，中位数) -----------------------------
function getStats(arr: number[]): Stats {
  // 空数组保护
  if (!arr || arr.length === 0) {
    return { min: 0, max: 0, median: 0 };
  }

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
  const maxVal = Math.max(...maxVals);
  const minVal = Math.min(...maxVals);

  // 除零保护：最小值为 0 或负数时，使用绝对值差异判断
  if (minVal <= 0) {
    // 如果最大值和最小值的绝对差距很大，也需要双轴
    return Math.abs(maxVal - minVal) > Math.abs(minVal) * MAX_GAP;
  }

  const gap = maxVal / minVal;
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

// ----------------- 核心：是否需要双轴，以及左右轴分配数据  -----------------
function autoAssignDualAxis(
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

// 导出算法
export default autoAssignDualAxis;
