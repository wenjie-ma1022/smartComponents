/**
 * K-means++ 算法实验室
 * 实现标准的 k-means++ 算法，兼容 SmartLineChart 功能
 */

/**
 * 向量集合接口（用于 K-means 聚类）
 */
interface Vectors {
  [key: string]: number[];
}

/**
 * K-means++ 算法配置选项
 */
interface KMeansOptions {
  /** 最大迭代次数，默认 100 */
  maxIterations?: number;
  /** 收敛阈值，默认 0.001 */
  convergenceThreshold?: number;
  /** 是否输出调试信息，默认 false */
  debug?: boolean;
}

// --------------- 默认配置参数 ---------------
const DEFAULT_MAX_ITERATIONS = 100;
const DEFAULT_CONVERGENCE_THRESHOLD = 0.001;
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
 * 仅在需要实际距离值时使用（如收敛判断）
 */
function dist(a: number[], b: number[]): number {
  return Math.sqrt(distSquared(a, b));
}

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
 * 计算每个点到最近中心点的距离平方
 * 标准 k-means++ 使用 D(x)² 作为概率权重
 */
function computeMinDistancesSquared(
  vec: number[][],
  centers: number[][]
): { distances: number[]; sum: number } {
  const distances: number[] = [];
  let sum = 0;

  for (let i = 0; i < vec.length; i++) {
    let minDistSq = Infinity;
    for (const center of centers) {
      const d = distSquared(vec[i], center);
      if (d < minDistSq) {
        minDistSq = d;
      }
    }
    distances.push(minDistSq);
    sum += minDistSq;
  }

  return { distances, sum };
}

/**
 * 使用 D(x)² 加权概率选择下一个中心点
 * 标准 k-means++ 核心：概率与距离平方成正比
 */
function selectNextCenter(
  vec: number[][],
  distances: number[],
  sumDistances: number,
  centers: number[][]
): number[] {
  // 边界情况：所有点都是已选中心点（距离和为0）
  if (sumDistances < EPSILON) {
    // 选择一个未被选中的点
    const availableIndices = vec
      .map((_, idx) => idx)
      .filter(
        (idx) =>
          !centers.some((center) => distSquared(vec[idx], center) < EPSILON)
      );

    const idx =
      availableIndices.length > 0
        ? availableIndices[Math.floor(Math.random() * availableIndices.length)]
        : Math.floor(Math.random() * vec.length);

    return [...vec[idx]];
  }

  // 轮盘赌选择：概率与 D(x)² 成正比
  const random = Math.random() * sumDistances;
  let cumulative = 0;
  let selectedIndex = vec.length - 1; // 默认选最后一个（防止浮点误差）

  for (let i = 0; i < vec.length; i++) {
    cumulative += distances[i];
    if (cumulative >= random) {
      selectedIndex = i;
      break;
    }
  }

  return [...vec[selectedIndex]];
}

/**
 * K-means++ 初始化算法
 * @param vec 向量数组
 * @param k 聚类数量
 * @returns 初始中心点数组
 */
function initializeCenters(vec: number[][], k: number): number[][] {
  const n = vec.length;

  if (n === 0 || k <= 0) {
    return [];
  }

  // 如果 k >= n，每个点都是中心
  if (k >= n) {
    return vec.map((v) => [...v]);
  }

  const centers: number[][] = [];

  // 1. 随机选择第一个中心点
  const firstIndex = Math.floor(Math.random() * n);
  centers.push([...vec[firstIndex]]);

  // 2. 使用 D(x)² 加权概率选择剩余的 k-1 个中心点
  for (let c = 1; c < k; c++) {
    const { distances, sum } = computeMinDistancesSquared(vec, centers);
    const nextCenter = selectNextCenter(vec, distances, sum, centers);
    centers.push(nextCenter);
  }

  return centers;
}

// --------------- K-means++ 核心算法：辅助函数 --------------------------
/**
 * 将所有点分配到最近的簇
 */
function assignPointsToClusters(
  keys: string[],
  vec: number[][],
  centers: number[][],
  clusterCount: number
): string[][] {
  const clusters: string[][] = Array.from({ length: clusterCount }, () => []);

  for (let idx = 0; idx < vec.length; idx++) {
    const v = vec[idx];
    let minDistSq = Infinity;
    let clusterIndex = 0;

    for (let c = 0; c < clusterCount; c++) {
      const d = distSquared(v, centers[c]); // 使用距离平方比较
      if (d < minDistSq) {
        minDistSq = d;
        clusterIndex = c;
      }
    }

    clusters[clusterIndex].push(keys[idx]);
  }

  return clusters;
}

/**
 * 更新簇的中心点
 * 空簇处理：选择距离所有中心点最远的点作为新中心
 */
function updateCenters(
  clusters: string[][],
  vectors: Vectors,
  vec: number[][],
  keys: string[],
  oldCenters: number[][]
): number[][] {
  return clusters.map((cluster, idx) => {
    if (cluster.length > 0) {
      return computeCentroid(cluster, vectors);
    }

    // 空簇处理：选择距离所有现有中心最远的点
    let maxMinDist = -1;
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
 * 检查中心点是否收敛
 */
function hasConverged(
  newCenters: number[][],
  oldCenters: number[][],
  threshold: number
): boolean {
  for (let c = 0; c < newCenters.length; c++) {
    if (dist(newCenters[c], oldCenters[c]) > threshold) {
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

  // K-means++ 初始化
  let centers = initializeCenters(vec, clusterCount);
  let iter = 0;
  let converged = false;
  let clusters: string[][] = [];

  // 迭代优化
  while (!converged && iter < maxIterations) {
    iter++;

    // E步：分配点到最近的簇
    clusters = assignPointsToClusters(keys, vec, centers, clusterCount);

    // M步：更新中心点
    const newCenters = updateCenters(clusters, vectors, vec, keys, centers);

    // 检查收敛
    converged = hasConverged(newCenters, centers, convergenceThreshold);
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
 */
export function computeSilhouetteScore(
  vectors: Vectors,
  clusters: string[][]
): number {
  const keys = Object.keys(vectors);
  if (keys.length <= 1 || clusters.length <= 1) {
    return 0;
  }

  // 建立点到簇的映射
  const pointToCluster = new Map<string, number>();
  clusters.forEach((cluster, idx) => {
    cluster.forEach((key) => pointToCluster.set(key, idx));
  });

  let totalScore = 0;
  let count = 0;

  for (const key of keys) {
    const clusterIdx = pointToCluster.get(key)!;
    const cluster = clusters[clusterIdx];

    // 计算 a(i): 点到同簇其他点的平均距离
    let a = 0;
    if (cluster.length > 1) {
      for (const otherKey of cluster) {
        if (otherKey !== key) {
          a += dist(vectors[key], vectors[otherKey]);
        }
      }
      a /= cluster.length - 1;
    }

    // 计算 b(i): 点到最近其他簇的平均距离
    let b = Infinity;
    for (let c = 0; c < clusters.length; c++) {
      if (c !== clusterIdx && clusters[c].length > 0) {
        let avgDist = 0;
        for (const otherKey of clusters[c]) {
          avgDist += dist(vectors[key], vectors[otherKey]);
        }
        avgDist /= clusters[c].length;
        if (avgDist < b) {
          b = avgDist;
        }
      }
    }

    // 轮廓系数 s(i) = (b - a) / max(a, b)
    if (b !== Infinity) {
      const s = (b - a) / Math.max(a, b);
      totalScore += s;
      count++;
    }
  }

  return count > 0 ? totalScore / count : 0;
}
