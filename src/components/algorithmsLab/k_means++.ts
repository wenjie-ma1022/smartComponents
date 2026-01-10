/**
 * K-means++ 算法实验室
 * 实现标准的 k-means++ 算法，兼容 SmartLineChart 功能
 */

/**
 * 向量集合接口（用于 K-means 聚类）
 */
export interface Vectors {
  [key: string]: number[];
}

/**
 * K-means++ 算法配置选项
 */
export interface KMeansOptions {
  /** 最大迭代次数，默认 100 */
  maxIterations?: number;
  /** 收敛阈值，默认 0.001 */
  convergenceThreshold?: number;
  /** 是否输出调试信息，默认 false */
  debug?: boolean;
  /** 初始化重试次数（取最优），默认 10 */
  initRetries?: number;
}

// --------------- 默认配置参数 ---------------
const DEFAULT_MAX_ITERATIONS = 100;
const DEFAULT_CONVERGENCE_THRESHOLD = 0.001;
const DEFAULT_INIT_RETRIES = 10; // 初始化重试次数
const EPSILON = 1e-10; // 浮点数比较阈值

// --------------- 工具函数：计算两个点之间的欧几里得距离平方 --------------------------
/**
 * 计算两个向量之间的欧几里得距离平方（避免 sqrt 开销）
 * 用于距离比较和 k-means++ 概率计算
 */
function distSquared(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`向量维度不匹配: ${a.length} vs ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return sum;
}

/**
 * 计算两个向量之间的欧几里得距离
 * 导出供外部使用
 */
export function dist(a: number[], b: number[]): number {
  return Math.sqrt(distSquared(a, b));
}

/**
 * 导出距离平方函数供外部使用
 */
export { distSquared };

// --------------- 工具函数：计算簇的中心点（平均值） --------------------------
function computeCentroid(groupKeys: string[], vectors: Vectors): number[] {
  if (groupKeys.length === 0) {
    return [];
  }

  const dimension = vectors[groupKeys[0]].length;
  const centroid = new Array(dimension).fill(0);
  const count = groupKeys.length;

  for (const key of groupKeys) {
    const vec = vectors[key];
    for (let i = 0; i < dimension; i++) {
      centroid[i] += vec[i];
    }
  }

  for (let i = 0; i < dimension; i++) {
    centroid[i] /= count;
  }

  return centroid;
}

// --------------- K-means++ 初始化：辅助函数 --------------------------
/**
 * 计算每个点到最近中心点的距离平方（排除已选索引）
 * 返回距离数组和候选索引列表
 */
function computeMinDistancesWithExclusion(
  vec: number[][],
  centers: number[][],
  selectedIndices: Set<number>
): { distances: number[]; sum: number; candidateIndices: number[] } {
  const distances: number[] = new Array(vec.length).fill(0);
  const candidateIndices: number[] = [];
  let sum = 0;

  for (let i = 0; i < vec.length; i++) {
    // 跳过已选择的点
    if (selectedIndices.has(i)) {
      distances[i] = 0;
      continue;
    }

    let minDistSq = Infinity;
    for (const center of centers) {
      const d = distSquared(vec[i], center);
      if (d < minDistSq) {
        minDistSq = d;
      }
    }

    // 只有距离大于阈值的点才作为候选
    if (minDistSq > EPSILON) {
      distances[i] = minDistSq;
      sum += minDistSq;
      candidateIndices.push(i);
    } else {
      distances[i] = 0;
    }
  }

  return { distances, sum, candidateIndices };
}

/**
 * 使用 D(x)² 加权概率选择下一个中心点
 * 改进版：追踪已选索引，避免重复选择
 */
function selectNextCenterIndex(
  distances: number[],
  sumDistances: number,
  candidateIndices: number[]
): number {
  // 边界情况：没有有效候选点
  if (candidateIndices.length === 0 || sumDistances < EPSILON) {
    return -1;
  }

  // 轮盘赌选择：概率与 D(x)² 成正比
  const random = Math.random() * sumDistances;
  let cumulative = 0;

  for (const idx of candidateIndices) {
    cumulative += distances[idx];
    if (cumulative >= random) {
      return idx;
    }
  }

  // 防止浮点误差，返回最后一个候选
  return candidateIndices[candidateIndices.length - 1];
}

/**
 * 计算初始化质量（簇内距离平方和的负数，越大越好）
 */
function computeInitQuality(vec: number[][], centers: number[][]): number {
  let totalDistSq = 0;
  for (const v of vec) {
    let minDistSq = Infinity;
    for (const center of centers) {
      const d = distSquared(v, center);
      if (d < minDistSq) {
        minDistSq = d;
      }
    }
    totalDistSq += minDistSq;
  }
  // 返回负数，因为我们要最大化（即最小化距离和）
  return -totalDistSq;
}

/**
 * 单次 K-means++ 初始化
 * @param vec 向量数组
 * @param k 聚类数量
 * @returns 初始中心点数组和对应的索引
 */
function initializeCentersOnce(
  vec: number[][],
  k: number
): { centers: number[][]; indices: number[] } {
  const n = vec.length;

  if (n === 0 || k <= 0) {
    return { centers: [], indices: [] };
  }

  // 如果 k >= n，每个点都是中心
  if (k >= n) {
    return {
      centers: vec.map((v) => [...v]),
      indices: vec.map((_, i) => i),
    };
  }

  const centers: number[][] = [];
  const selectedIndices = new Set<number>();

  // 1. 随机选择第一个中心点
  const firstIndex = Math.floor(Math.random() * n);
  centers.push([...vec[firstIndex]]);
  selectedIndices.add(firstIndex);

  // 2. 使用 D(x)² 加权概率选择剩余的 k-1 个中心点
  for (let c = 1; c < k; c++) {
    const { distances, sum, candidateIndices } =
      computeMinDistancesWithExclusion(vec, centers, selectedIndices);

    const nextIndex = selectNextCenterIndex(distances, sum, candidateIndices);

    if (nextIndex === -1) {
      // 无法找到更多不同的中心点，提前终止
      break;
    }

    centers.push([...vec[nextIndex]]);
    selectedIndices.add(nextIndex);
  }

  return { centers, indices: Array.from(selectedIndices) };
}

/**
 * K-means++ 初始化算法（带重试机制）
 * 多次运行初始化，选择质量最好的一组中心点
 * @param vec 向量数组
 * @param k 聚类数量
 * @param retries 重试次数
 * @returns 最优初始中心点数组
 */
function initializeCenters(
  vec: number[][],
  k: number,
  retries: number = DEFAULT_INIT_RETRIES
): number[][] {
  const n = vec.length;

  if (n === 0 || k <= 0) {
    return [];
  }

  // 如果 k >= n，每个点都是中心，无需重试
  if (k >= n) {
    return vec.map((v) => [...v]);
  }

  // 小数据集时适当增加重试次数
  const actualRetries = n <= 10 ? Math.max(retries, 20) : retries;

  let bestCenters: number[][] = [];
  let bestQuality = -Infinity;

  for (let r = 0; r < actualRetries; r++) {
    const { centers } = initializeCentersOnce(vec, k);

    // 确保获得了足够的中心点
    if (centers.length < k) {
      continue;
    }

    const quality = computeInitQuality(vec, centers);

    if (quality > bestQuality) {
      bestQuality = quality;
      bestCenters = centers;
    }
  }

  // 如果所有重试都失败，退化到简单的均匀选择
  if (bestCenters.length === 0) {
    bestCenters = selectCentersUniformly(vec, k);
  }

  return bestCenters;
}

/**
 * 均匀选择中心点（退化方案）
 * 当 k-means++ 无法正常工作时使用
 */
function selectCentersUniformly(vec: number[][], k: number): number[][] {
  const n = vec.length;
  const step = n / k;
  const centers: number[][] = [];

  for (let i = 0; i < k; i++) {
    const idx = Math.min(Math.floor(i * step), n - 1);
    centers.push([...vec[idx]]);
  }

  return centers;
}

// --------------- K-means++ 核心算法：辅助函数 --------------------------
/**
 * 比较两个数组是否相等（用于早期终止检测）
 */
function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * 将所有点分配到最近的簇（带分配追踪）
 * 返回簇和分配数组，用于早期终止检测
 */
function assignPointsToClustersWithTracking(
  keys: string[],
  vec: number[][],
  centers: number[][],
  clusterCount: number
): { clusters: string[][]; assignment: number[] } {
  const clusters: string[][] = Array.from({ length: clusterCount }, () => []);
  const assignment: number[] = new Array(vec.length);

  for (let idx = 0; idx < vec.length; idx++) {
    const v = vec[idx];
    let minDistSq = Infinity;
    let clusterIndex = 0;

    for (let c = 0; c < clusterCount; c++) {
      const d = distSquared(v, centers[c]);
      if (d < minDistSq) {
        minDistSq = d;
        clusterIndex = c;
      }
    }

    clusters[clusterIndex].push(keys[idx]);
    assignment[idx] = clusterIndex;
  }

  return { clusters, assignment };
}

/**
 * 更新簇的中心点
 * 空簇处理：选择距离所有中心点最远的点作为新中心
 */
function updateCenters(
  clusters: string[][],
  vectors: Vectors,
  vec: number[][],
  oldCenters: number[][]
): number[][] {
  return clusters.map((cluster, idx) => {
    if (cluster.length > 0) {
      return computeCentroid(cluster, vectors);
    }

    // 空簇处理：选择距离所有现有中心最远的点
    let maxMinDist = -Infinity; // 修复：使用 -Infinity 而非 -1
    let farthestIndex = 0;

    for (let i = 0; i < vec.length; i++) {
      let minDistToCenter = Infinity;
      for (let c = 0; c < oldCenters.length; c++) {
        if (c !== idx) {
          const d = distSquared(vec[i], oldCenters[c]);
          if (d < minDistToCenter) {
            minDistToCenter = d;
          }
        }
      }
      if (minDistToCenter > maxMinDist) {
        maxMinDist = minDistToCenter;
        farthestIndex = i;
      }
    }

    return [...vec[farthestIndex]];
  });
}

/**
 * 检查中心点是否收敛（使用距离平方避免 sqrt）
 */
function hasConverged(
  newCenters: number[][],
  oldCenters: number[][],
  thresholdSquared: number
): boolean {
  for (let c = 0; c < newCenters.length; c++) {
    if (distSquared(newCenters[c], oldCenters[c]) > thresholdSquared) {
      return false;
    }
  }
  return true;
}

/**
 * K-means++ 聚类算法
 * @param vectors 向量集合
 * @param k 聚类数量（默认为2）
 * @param options 算法配置选项
 * @returns 聚类结果
 */
export function kMeansPlusPlus(
  vectors: Vectors,
  k: number = 2,
  options: KMeansOptions = {}
): string[][] {
  const {
    maxIterations = DEFAULT_MAX_ITERATIONS,
    convergenceThreshold = DEFAULT_CONVERGENCE_THRESHOLD,
    debug = false,
    initRetries = DEFAULT_INIT_RETRIES,
  } = options;

  const keys = Object.keys(vectors);
  const vec = keys.map((key) => vectors[key]);
  const n = vec.length;

  // 边界情况处理
  if (n === 0) {
    return [];
  }

  if (k <= 0) {
    return [];
  }

  // k 不能超过数据点数量
  const clusterCount = Math.min(k, n);

  // 特殊情况：k 等于数据点数量
  if (clusterCount === n) {
    return keys.map((key) => [key]);
  }

  // K-means++ 初始化（带重试机制）
  let centers = initializeCenters(vec, clusterCount, initRetries);
  let iter = 0;
  let converged = false;
  let clusters: string[][] = [];
  let prevAssignment: number[] = []; // 用于早期终止检测

  // 预计算阈值平方（避免每次迭代都计算）
  const thresholdSquared = convergenceThreshold * convergenceThreshold;

  // 迭代优化
  while (!converged && iter < maxIterations) {
    iter++;

    // E步：分配点到最近的簇
    const { clusters: newClusters, assignment } =
      assignPointsToClustersWithTracking(keys, vec, centers, clusterCount);
    clusters = newClusters;

    // 早期终止：如果分配没有变化，直接收敛
    if (iter > 1 && arraysEqual(assignment, prevAssignment)) {
      converged = true;
      break;
    }
    prevAssignment = assignment;

    // M步：更新中心点
    const newCenters = updateCenters(clusters, vectors, vec, centers);

    // 检查收敛（中心点移动距离）
    converged = hasConverged(newCenters, centers, thresholdSquared);
    centers = newCenters;
  }

  if (debug) {
    console.log(`K-means++ 迭代次数: ${iter}, 聚类数量: ${clusterCount}`);
    console.log("分组情况:", clusters);
  }

  return clusters;
}

/**
 * 计算聚类结果的轮廓系数（Silhouette Coefficient）
 * 用于评估聚类质量，范围 [-1, 1]，越大越好
 *
 * 性能优化：
 * - 大数据集（>1000点）自动采样计算
 * - 使用距离平方避免 sqrt（最后统一开方）
 *
 * @param vectors 向量集合
 * @param clusters 聚类结果
 * @param maxSamples 最大采样数量，默认 500
 */
export function computeSilhouetteScore(
  vectors: Vectors,
  clusters: string[][],
  maxSamples: number = 500
): number {
  const keys = Object.keys(vectors);
  const n = keys.length;

  if (n <= 1 || clusters.length <= 1) {
    return 0;
  }

  // 过滤空簇
  const nonEmptyClusters = clusters.filter((c) => c.length > 0);
  if (nonEmptyClusters.length <= 1) {
    return 0;
  }

  // 建立点到簇的映射
  const pointToCluster = new Map<string, number>();
  nonEmptyClusters.forEach((cluster, idx) => {
    cluster.forEach((key) => pointToCluster.set(key, idx));
  });

  // 大数据集采样
  let sampleKeys = keys;
  if (n > maxSamples) {
    sampleKeys = shuffleArray(keys).slice(0, maxSamples);
  }

  let totalScore = 0;
  let count = 0;

  for (const key of sampleKeys) {
    const clusterIdx = pointToCluster.get(key);
    if (clusterIdx === undefined) continue;

    const cluster = nonEmptyClusters[clusterIdx];
    const vec = vectors[key];

    // 计算 a(i): 点到同簇其他点的平均距离
    let a = 0;
    if (cluster.length > 1) {
      let sumDist = 0;
      for (const otherKey of cluster) {
        if (otherKey !== key) {
          sumDist += Math.sqrt(distSquared(vec, vectors[otherKey]));
        }
      }
      a = sumDist / (cluster.length - 1);
    }

    // 计算 b(i): 点到最近其他簇的平均距离
    let b = Infinity;
    for (let c = 0; c < nonEmptyClusters.length; c++) {
      if (c !== clusterIdx) {
        const otherCluster = nonEmptyClusters[c];
        let sumDist = 0;
        for (const otherKey of otherCluster) {
          sumDist += Math.sqrt(distSquared(vec, vectors[otherKey]));
        }
        const avgDist = sumDist / otherCluster.length;
        if (avgDist < b) {
          b = avgDist;
        }
      }
    }

    // 轮廓系数 s(i) = (b - a) / max(a, b)
    if (b !== Infinity && (a > 0 || b > 0)) {
      const s = (b - a) / Math.max(a, b);
      totalScore += s;
      count++;
    }
  }

  return count > 0 ? totalScore / count : 0;
}

/**
 * Fisher-Yates 洗牌算法
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
