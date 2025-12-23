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

// --------------- 算法配置参数 ---------------
const MAX_ITERATIONS: number = 100; // 最大迭代次数
const CONVERGENCE_THRESHOLD: number = 0.001; // 收敛阈值

// --------------- 工具函数：计算两个点之间的欧几里得距离 --------------------------
function dist(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
}

// --------------- 工具函数：计算簇的中心点（平均值） --------------------------
function mean(groupKeys: string[], vectors: Vectors): number[] {
  if (groupKeys.length === 0) {
    return [];
  }
  const arr = groupKeys.map((k) => vectors[k]);
  return arr[0].map((_, i) => arr.reduce((sum, v) => sum + v[i], 0) / arr.length);
}

// --------------- K-means++ 初始化：辅助函数 --------------------------
/**
 * 计算每个点到最近中心点的距离
 */
function computeMinDistances(
  vec: number[][],
  centers: number[][],
): { distances: number[]; sum: number } {
  const distances: number[] = [];
  let sum = 0;

  for (let i = 0; i < vec.length; i++) {
    let minDist = Infinity;
    for (const center of centers) {
      const d = dist(vec[i], center);
      if (d < minDist) {
        minDist = d;
      }
    }
    distances.push(minDist);
    sum += minDist;
  }

  return { distances, sum };
}

/**
 * 使用加权概率选择下一个中心点
 */
function selectNextCenter(
  vec: number[][],
  distances: number[],
  sumDistances: number,
  centers: number[][],
): number[] {
  if (sumDistances === 0) {
    const availableIndices = vec
      .map((_, idx) => idx)
      .filter((idx) => !centers.some((center) => dist(vec[idx], center) === 0));
    const idx =
      availableIndices.length > 0
        ? availableIndices[Math.floor(Math.random() * availableIndices.length)]
        : Math.floor(Math.random() * vec.length);
    return [...vec[idx]];
  }

  const random = Math.random() * sumDistances;
  let cumulative = 0;
  let selectedIndex = 0;

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
 * @param vectors 向量集合
 * @param k 聚类数量
 * @returns 初始中心点数组
 */
function initializeCenters(vectors: Vectors, k: number): number[][] {
  const keys = Object.keys(vectors);
  const vec = keys.map((key) => vectors[key]);
  const n = vec.length;

  if (n === 0 || k <= 0) {
    return [];
  }

  const centers: number[][] = [];

  // 1. 随机选择第一个中心点
  const firstIndex = Math.floor(Math.random() * n);
  centers.push([...vec[firstIndex]]);

  // 2. 选择剩余的 k-1 个中心点
  for (let c = 1; c < k; c++) {
    const { distances, sum } = computeMinDistances(vec, centers);
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
  clusterCount: number,
): string[][] {
  const clusters: string[][] = Array.from({ length: clusterCount }, () => []);

  for (let idx = 0; idx < vec.length; idx++) {
    const v = vec[idx];
    let minDist = Infinity;
    let clusterIndex = 0;

    for (let c = 0; c < clusterCount; c++) {
      const d = dist(v, centers[c]);
      if (d < minDist) {
        minDist = d;
        clusterIndex = c;
      }
    }

    clusters[clusterIndex].push(keys[idx]);
  }

  return clusters;
}

/**
 * 更新簇的中心点
 */
function updateCenters(clusters: string[][], vectors: Vectors, oldCenters: number[][]): number[][] {
  return clusters.map((cluster, idx) =>
    cluster.length > 0 ? mean(cluster, vectors) : oldCenters[idx],
  );
}

/**
 * 检查中心点是否收敛
 */
function hasConverged(newCenters: number[][], oldCenters: number[][]): boolean {
  for (let c = 0; c < newCenters.length; c++) {
    if (dist(newCenters[c], oldCenters[c]) > CONVERGENCE_THRESHOLD) {
      return false;
    }
  }
  return true;
}

/**
 * K-means++ 聚类算法
 * @param vectors 向量集合
 * @param k 聚类数量（默认为2）
 * @returns 聚类结果
 */
export function kMeansPlusPlus(vectors: Vectors, k: number = 2): string[][] {
  const keys = Object.keys(vectors);
  const vec = keys.map((key) => vectors[key]);
  const n = vec.length;

  if (n === 0) {
    return [];
  }

  const clusterCount = Math.min(k, n);
  let centers: number[][] = initializeCenters(vectors, clusterCount);
  let iter = 0;
  let changed = true;
  let clusters: string[][] = [];

  while (changed && iter < MAX_ITERATIONS) {
    iter++;
    clusters = assignPointsToClusters(keys, vec, centers, clusterCount);
    const newCenters = updateCenters(clusters, vectors, centers);
    changed = !hasConverged(newCenters, centers);
    centers = newCenters;
  }

  // eslint-disable-next-line no-console
  console.log(`K-means++ 迭代次数: ${iter}, 聚类数量: ${clusterCount}`);
  // eslint-disable-next-line no-console
  console.log('分组情况:', clusters);

  return clusters;
}
