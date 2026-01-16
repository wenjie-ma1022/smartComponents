/******************************************************
 * 自动推荐 series 类型（bar / line）
 *
 * 决策思路：
 * 1. 判断 X 轴是否具备连续语义（时间 / 有序）
 * 2. 点数多 → 折线优先（你原有经验）
 * 3. 对所有 Y series 做趋势分析
 * 4. 通过「趋势投票比例」决定最终类型
 ******************************************************/

import type { DataSourceItem } from "./index.d";
import type { SmartLineSeriesType } from "../index.d";

// --------------- 算法经验值配置（统一管理，便于调优） ---------------
const TREND_R2_THRESHOLD = 0.6; // 趋势判断：R² 阈值
const TREND_SLOPE_FACTOR = 0.01; // 趋势判断：斜率占值域比例阈值
const MAX_POINTS_FOR_BAR = 80; // 点数阈值：超过此值直接用折线
const POINT_COUNT_FOR_BONUS = 12; // 点数阈值：超过此值降低趋势阈值
const POINT_BONUS = -0.2; // 点数多时的阈值调整量
const BASE_TREND_THRESHOLD = 0.5; // 趋势投票基础阈值
const MIN_VALID_RATIO = 0.5; // Y series 有效数据占比阈值

// 日期格式正则（提取为常量，避免重复创建）
const DATE_PATTERNS = [
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

/**
 * 判断一个值是否可以视为日期
 * 支持 Date 实例 / 可被 Date.parse 解析的字符串
 */
function isDate(value: any): boolean {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return true;
  }

  if (typeof value === "string") {
    // 使用预定义的正则常量，避免每次调用时重复创建
    const looksLikeDate = DATE_PATTERNS.some((p) => p.test(value));
    return looksLikeDate && !isNaN(Date.parse(value));
  }

  return false;
}

/**
 * 判断 X 轴是否为「有序数值型」
 * 支持递增序列：1,5,7,14 / 202401,202404
 * 支持递减序列：14,7,5,1 / 202404,202401
 */
function isOrdinalNumeric(values: any[]): boolean {
  if (!values || values.length < 2) return false;

  // 过滤无效值
  const cleanValues = values.filter((v) => Number.isFinite(v));
  if (cleanValues.length < 2) return false;

  let isAscending = true;
  let isDescending = true;

  for (let i = 1; i < cleanValues.length; i++) {
    if (cleanValues[i] < cleanValues[i - 1]) isAscending = false;
    if (cleanValues[i] > cleanValues[i - 1]) isDescending = false;
    // 如果既不是递增也不是递减，提前退出
    if (!isAscending && !isDescending) return false;
  }

  return isAscending || isDescending;
}

/**
 * 线性趋势分析
 * 异常值检测、数据预处理、统计稳定性，使用简单线性回归判断是否存在趋势
 * @returns slope, r2, confidence, range（过滤后数据的值域范围）
 */
function calcLinearTrend(values: number[]) {
  const n = values.length;

  // 边界检查
  if (n < 3) {
    return { slope: 0, r2: 0, confidence: 0, range: 0 };
  }

  // 数据预处理：移除无效值
  const cleanValues = values.filter(
    (v) => Number.isFinite(v) && !Number.isNaN(v)
  );
  const cleanN = cleanValues.length;
  if (cleanN < 3) {
    return { slope: 0, r2: 0, confidence: 0, range: 0 };
  }

  // 异常值检测和过滤（IQR方法 - 优化分位数计算）
  const sortedValues = [...cleanValues].sort((a, b) => a - b);

  // 使用线性插值法计算分位数
  const getQuantile = (sorted: number[], q: number): number => {
    const pos = (sorted.length - 1) * q;
    const lower = Math.floor(pos);
    const upper = Math.ceil(pos);

    if (lower === upper) return sorted[lower];
    return sorted[lower] * (upper - pos) + sorted[upper] * (pos - lower);
  };

  const q1 = getQuantile(sortedValues, 0.25);
  const q3 = getQuantile(sortedValues, 0.75);
  // IQR 值域范围
  const iqr = q3 - q1;

  // IQR 为 0 时跳过异常值过滤（所有值相近或数据太少）
  let finalValues: number[];
  // 异常值影响因子
  let outlierImpact = 1;

  if (iqr > 0) {
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const filteredValues = cleanValues.filter(
      (v) => v >= lowerBound && v <= upperBound
    );
    outlierImpact = filteredValues.length / cleanN;
    finalValues = filteredValues.length >= 3 ? filteredValues : cleanValues;
  } else {
    finalValues = cleanValues;
  }

  // 过滤后数据长度
  const finalN = finalValues.length;
  const minY = Math.min(...finalValues);
  const maxY = Math.max(...finalValues);

  // 如果过滤后数据太少，返回保守估计
  if (finalN < Math.max(3, n * 0.6)) {
    return { slope: 0, r2: 0, confidence: 0, range: 0 };
  }

  const xMean = (finalN - 1) / 2; // 索引均值: (0 + 1 + ... + n-1) / n = (n-1)/2
  const yMean = finalValues.reduce((a, b) => a + b, 0) / finalN;

  // 两遍算法：提高数值稳定性
  let sumXX = 0;
  let sumXY = 0;
  let ssTot = 0;
  let ssRes = 0;

  for (let i = 0; i < finalN; i++) {
    const xDev = i - xMean;
    const yDev = finalValues[i] - yMean;
    sumXX += xDev * xDev;
    sumXY += xDev * yDev;
  }

  // 处理分母为0的情况
  if (sumXX === 0) {
    return { slope: 0, r2: 0, confidence: 0, range: 0 };
  }

  // 线性回归直线的斜率
  const slope = sumXY / sumXX;

  // R² 拟合优度计算
  for (let i = 0; i < finalN; i++) {
    const yHat = slope * (i - xMean) + yMean; // 预测值
    const residual = finalValues[i] - yHat; // 残差
    ssTot += (finalValues[i] - yMean) ** 2; // 总平方和
    ssRes += residual * residual; // 残差平方和
  }

  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  // 置信度评估（基于数据质量和趋势强度）
  // 1. 数据质量因子
  const dataQuality = finalN / n;

  // 返回过滤后数据的值域范围，用于外部趋势判断
  const range = maxY - minY || 1;
  // 2. 趋势强度因子
  const trendStrength = Math.min(1, Math.abs(slope) / range);
  // 3. 拟合优度因子
  const fitQuality = r2;

  // 加权计算置信度
  const confidence = Math.max(
    0,
    Math.min(
      1,
      dataQuality * 0.3 +
        trendStrength * 0.3 +
        fitQuality * 0.3 +
        outlierImpact * 0.1
    )
  );

  return {
    slope: Number.isFinite(slope) ? slope : 0,
    r2: Number.isFinite(r2) ? r2 : 0,
    confidence: Number.isFinite(confidence) ? confidence : 0,
    range,
  };
}

/**
 * 提取所有 Y series
 * 规则：除 xAxisField 外，值为 number 的字段
 */

function extractYSeries(
  dataSource: DataSourceItem[],
  xAxisField: string
): Record<string, number[]> {
  // 边界检查
  if (!dataSource || dataSource.length === 0) {
    return {};
  }

  const firstRow = dataSource[0];
  if (!firstRow) {
    return {};
  }

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

function autoSetSeriesType(
  dataSource: DataSourceItem[],
  xAxisField: string
): SmartLineSeriesType {
  // ---------- 边界保护 ----------
  if (!Array.isArray(dataSource) || dataSource.length < 3) {
    return "bar";
  }

  // ---------- Step 1：判断点数 ----------
  const xAxisValues = dataSource.map((d) => d[xAxisField]);

  // 点数太少，直接使用柱状图
  if (xAxisValues.length < 4) {
    return "bar";
  }

  const ySeriesMap = extractYSeries(dataSource, xAxisField);
  const seriesNames = Object.keys(ySeriesMap);

  // 没有 Y series，直接使用柱状图
  if (seriesNames.length === 0) {
    return "bar";
  }

  // 点数过多，柱状图会很拥挤，直接使用折线图
  const totalPoints = xAxisValues.length * seriesNames.length;
  if (totalPoints > MAX_POINTS_FOR_BAR) {
    return "line";
  }

  // ---------- Step 2：X 轴语义判断 ----------
  // 判断是否为日期类型
  const isDateValues = xAxisValues.every((v) => isDate(v));
  // 判断是否为有序数值类型
  const isOrdinal = isOrdinalNumeric(xAxisValues);
  // 是否为连续类型（日期或有序数值）
  const isContinuousX = isDateValues || isOrdinal;

  // X 轴非连续（纯分类） → bar
  if (!isContinuousX) {
    return "bar";
  }

  // ---------- Step 3：趋势投票 ----------
  let trendSeriesCount = 0;
  let validSeriesCount = 0; // 记录有效 series 数量，避免分母错误

  seriesNames.forEach((name) => {
    const values = ySeriesMap[name];
    if (values.length < 3) return;

    validSeriesCount += 1; // 只有有效的才计入分母

    // range 来自 calcLinearTrend，是基于过滤异常值后的数据计算的，保持一致性
    const { slope, r2, confidence, range } = calcLinearTrend(values);

    /**
     * 趋势判断（考虑置信度）
     * - r2 高：整体趋势明显
     * - slope 有足够变化幅度（避免几乎水平的线）
     * - confidence 高：数据质量和异常值影响小
     */
    const hasStrongTrend =
      r2 >= TREND_R2_THRESHOLD && Math.abs(slope) >= TREND_SLOPE_FACTOR * range;
    const hasModerateTrend =
      r2 >= TREND_R2_THRESHOLD * 0.8 &&
      Math.abs(slope) >= TREND_SLOPE_FACTOR * range * 0.8;

    // 根据置信度选择更严格或宽松的判断标准
    const hasTrend = confidence > 0.7 ? hasStrongTrend : hasModerateTrend;
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

export default autoSetSeriesType;
