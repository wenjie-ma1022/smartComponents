import type {
  Stats,
  Metrics,
  Vectors,
  AssignResult,
  DataSourceItem,
  SmartLineChartConfig,
  SeriesType,
} from "./algorithms.d";
import { kMeansPlusPlus } from "@/utils/algorithmsLab/k_means++";

/******************************************************
 * 自动双轴判断 + 自动左右 Y 轴推荐算法
 * 输出：是否开启双轴，以及左右分组
 ******************************************************/

// --------------- 算法经验值配置（统一管理，便于调优） ---------------
const MAX_GAP = 10; // 双轴判断：最大差距倍数
const TREND_R2_THRESHOLD = 0.6; // 趋势判断：R² 阈值
const TREND_SLOPE_FACTOR = 0.01; // 趋势判断：斜率占值域比例阈值
const MAX_POINTS_FOR_BAR = 80; // 点数阈值：超过此值直接用折线
const POINT_COUNT_FOR_BONUS = 12; // 点数阈值：超过此值降低趋势阈值
const POINT_BONUS = -0.2; // 点数多时的阈值调整量
const BASE_TREND_THRESHOLD = 0.5; // 趋势投票基础阈值
const MIN_VALID_RATIO = 0.5; // Y series 有效数据占比阈值

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

/******************************************************
 * 自动推荐 series 类型（bar / line）
 *
 * 决策思路：
 * 1. 判断 X 轴是否具备连续语义（时间 / 有序）
 * 2. 点数多 → 折线优先（你原有经验）
 * 3. 对所有 Y series 做趋势分析
 * 4. 通过「趋势投票比例」决定最终类型
 ******************************************************/

/**
 * 判断一个值是否可以视为日期
 * 支持 Date 实例 / 可被 Date.parse 解析的字符串
 */
export function isDate(value: any): boolean {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return true;
  }

  if (typeof value === "string") {
    // 常见日期格式的正则校验，避免把 "2024" 或 "123" 误判为日期
    const datePatterns = [
      /^\d{4}\.\d{2}\.\d{2}/, // YYYY.MM.DD
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
      /^\d{4}年\d{1,2}月\d{1,2}日/, // YYYY年M月D日

      /^\d{2}\.\d{2}\.\d{4}/, // MM.DD.YYYY
      /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
      /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY

      /^\d{2}\.\d{2}$/, // MM.DD (如 01.02)
      /^\d{2}-\d{2}$/, // MM-DD (如 01-02)
      /^\d{2}\/\d{2}$/, // MM/DD (如 01/02)
      /^\d{1,2}月\d{1,2}日/, // M月D日
    ];
    const looksLikeDate = datePatterns.some((p) => p.test(value));
    return looksLikeDate && !isNaN(Date.parse(value));
  }

  return false;
}

/**
 * 判断 X 轴是否为「有序数值型」
 * 例如：1,5,7,14 / 202401,202404
 */
function isOrdinalNumeric(values: any[]): boolean {
  // 空数组或单元素不视为有序数值
  if (!values || values.length < 2) {
    return false;
  }

  if (!values.every((v) => typeof v === "number")) {
    return false;
  }

  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) {
      return false;
    }
  }

  return true;
}

/**
 * 趋势特征提取（单一 Y series）
 * 使用简单线性回归判断是否存在趋势
 */

function calcLinearTrend(values: number[]) {
  const n = values.length;

  if (n < 3) {
    return { slope: 0, r2: 0 };
  }

  // 使用索引作为 X（时间 / 顺序代理）
  const x = Array.from({ length: n }, (_, i) => i);

  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (values[i] - yMean);
    denominator += (x[i] - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;

  let ssTot = 0;
  let ssRes = 0;

  for (let i = 0; i < n; i++) {
    const yHat = slope * (x[i] - xMean) + yMean;
    ssTot += (values[i] - yMean) ** 2;
    ssRes += (values[i] - yHat) ** 2;
  }

  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, r2 };
}

/**
 * 提取所有 Y series
 * 规则：除 xAxisField 外，值为 number 的字段
 */

function extractYSeries(
  dataSource: DataSourceItem[],
  xAxisField: string
): Record<string, number[]> {
  const firstRow = dataSource[0];
  const candidateKeys = Object.keys(firstRow).filter(
    (key) => key !== xAxisField
  );

  const seriesMap: Record<string, number[]> = {};

  candidateKeys.forEach((key) => {
    // 提取该字段的所有有效数值
    const values = dataSource
      .map((row) => row[key])
      .filter(
        (v) =>
          v !== null &&
          v !== undefined &&
          typeof v === "number" &&
          !Number.isNaN(v)
      ) as number[];

    // 只有当有效数值占比超过阈值时，才认为这是一个有效的 Y series
    if (values.length > dataSource.length * MIN_VALID_RATIO) {
      seriesMap[key] = values;
    }
  });

  return seriesMap;
}

/**
 * 核心函数：自动推荐 series 类型（bar / line）
 *
 * 决策思路：
 * 1. 判断 X 轴是否具备连续语义（时间 / 有序）
 * 2. 点数多 → 折线优先（你原有经验）
 * 3. 对所有 Y series 做趋势分析
 * 4. 通过「趋势投票比例」决定最终类型
 */

export function autoSetSeriesType(
  dataSource: DataSourceItem[],
  xAxisField: string
): SeriesType {
  // ---------- 边界保护 ----------
  if (!Array.isArray(dataSource) || dataSource.length < 3) {
    return "bar";
  }

  const xAxisValues = dataSource.map((d) => d[xAxisField]);

  // ---------- Step 1：X 轴语义判断 ----------
  const isDateValues = xAxisValues.every((v) => isDate(v));
  const isOrdinal = isOrdinalNumeric(xAxisValues);
  const isContinuousX = isDateValues || isOrdinal;

  // X 轴非连续（纯分类） → bar
  if (!isContinuousX) {
    return "bar";
  }

  // ---------- Step 2：提取所有 Y series ----------
  const ySeriesMap = extractYSeries(dataSource, xAxisField);
  const seriesNames = Object.keys(ySeriesMap);

  if (seriesNames.length === 0) {
    return "bar";
  }

  // 点数过多时柱状图会很拥挤，直接使用折线图
  const totalPoints = xAxisValues.length * seriesNames.length;
  if (totalPoints > MAX_POINTS_FOR_BAR) {
    return "line";
  }

  // ---------- Step 3：趋势投票 ----------
  let trendSeriesCount = 0;
  let validSeriesCount = 0; // 记录有效 series 数量，避免分母错误

  seriesNames.forEach((name) => {
    const values = ySeriesMap[name];
    if (values.length < 3) return;

    validSeriesCount += 1; // 只有有效的才计入分母

    const { slope, r2 } = calcLinearTrend(values);
    const maxY = Math.max(...values);
    const minY = Math.min(...values);
    const range = maxY - minY || 1; // 使用值域范围，避免负值数据导致阈值错误

    /**
     * 判断一个 series 是否「值得用折线」
     * - r2 高：整体趋势明显
     * - slope 有足够变化幅度（避免几乎水平的线）
     */
    const hasTrend =
      r2 >= TREND_R2_THRESHOLD && Math.abs(slope) >= TREND_SLOPE_FACTOR * range;
    if (hasTrend) {
      trendSeriesCount += 1;
    }
  });

  // 没有有效 series 可分析
  if (validSeriesCount === 0) {
    return "bar";
  }

  const trendRatio = trendSeriesCount / validSeriesCount;

  // ---------- Step 4：最终决策 ----------
  /**
   * 点数作为趋势阈值的调整因子：
   * - 点数多时，降低阈值，更倾向于折线图
   * - 点数少时，保持原有阈值
   * 这样既保留了「点多用折线」的直觉，又不会完全跳过趋势分析
   */
  const pointBonus =
    dataSource.length >= POINT_COUNT_FOR_BONUS ? POINT_BONUS : 0;
  const threshold = BASE_TREND_THRESHOLD + pointBonus;

  // 超过阈值的 series 具备趋势 → line
  if (trendRatio >= threshold) {
    return "line";
  }

  return "bar";
}
