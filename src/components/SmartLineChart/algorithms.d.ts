/**
 * 自动双轴判断 + 自动左右 Y 轴推荐算法的类型定义
 */

/**
 * 统计数据接口
 */
export interface Stats {
  /** 最小值 */
  min: number;
  /** 最大值 */
  max: number;
  /** 中位数 */
  median: number;
}

/**
 * 指标数据接口
 */
export interface Metric {
  /** 指标的所有数值 */
  values: number[];
  /** 指标的统计信息 */
  stats: Stats;
}

/**
 * 指标集合接口
 */
export interface Metrics {
  [key: string]: Metric;
}

/**
 * 左右轴分配结果
 */
export interface AssignResult {
  /** 分配到左轴的指标名称数组 */
  left: string[];
  /** 分配到右轴的指标名称数组 */
  right: string[];
}

/**
 * 向量集合接口（用于 K-means 聚类）
 */
export interface Vectors {
  [key: string]: number[];
}

/**
 * 数据源项接口
 * 支持任意字段，值可以是字符串、数字、日期或其他类型
 */
export interface DataSourceItem {
  /** 动态字段：包括 X轴字段和其他指标字段 */
  [key: string]: string | number | Date | any;
}

/**
 * 智能折线图配置结果
 */
export interface SmartLineChartConfig {
  /** 是否为双轴图 */
  isDual: boolean;
  /** 左右轴分配数据 */
  category?: AssignResult;
}
