import React from "react";
import {
  IProps as LineChartProps,
  MapConfigType,
  YAxisType,
} from "@sto/sto-charts/es/line-chart/interface";

/**
 * 数据源项接口
 * 支持任意字段，值可以是字符串、数字、日期或其他类型
 */
export interface DataSourceItem {
  /** 动态字段：包括 X轴字段和其他指标字段 */
  [key: string]: string | number | Date | any;
}

/**
 * X轴配置
 */
export interface XAxisConfig {
  /** X轴名称 */
  name?: string;
  /** X轴格式化字符串 */
  format?: string;
}

/**
 * Y轴格式化配置
 */
export interface YAxisConfig {
  leftConfig?: YAxisType;
  rightConfig?: YAxisType;
}

export type SmartLineSeriesType = "bar" | "line";

/**
 * 系列类型配置
 */
export interface SeriesTypeConfig {
  /** 指定系列类型，优先级最高 */
  [key: string]: SmartLineSeriesType;
  /** 左轴系列类型 */
  leftSeriesType?: SmartLineSeriesType;
  /** 右轴系列类型 */
  rightSeriesType?: SmartLineSeriesType;
  /** 指定所有系列类型，优先级最低 */
  seriesType?: SmartLineSeriesType;
}

/**
 * 异常值/关键值自动检测配置
 */
export interface AutoDetectConfig {
  /** 是否检测 IQR 离群值 */
  checkOutliers?: boolean;
  /** 是否检测全局最大/最小值 */
  checkMaxMin?: boolean;
  /** 是否检测突增/突降 */
  checkSharpChange?: boolean;
  /** 是否检测趋势偏离（仅折线图有效） */
  checkTrendDeviation?: boolean;
  /** IQR 系数，默认 1.5 */
  iqrMultiplier?: number;
  /** 趋势偏离标准差倍数，默认 2.5 */
  trendSigma?: number;
  /** 突变检测标准差倍数，默认 3.0 */
  sharpChangeSigma?: number;
  /** 线性拟合度阈值，低于此值不检测趋势异常，默认 0.4 */
  minR2ForTrend?: number;
  /** 是否打印调试日志，默认 false */
  debug?: boolean;
}

/**
 * SmartLineChart 组件属性
 */
export interface SmartLineChartProps extends Omit<LineChartProps, "mapConfig"> {
  /** 图表配置 */
  mapConfig?: MapConfigType;
  /** 图表高度，透传 LineChartProps.height */
  height?: number;
  /** 图表宽度，透传 LineChartProps.width */
  width?: number;
  /** 数据源 */
  dataSource: DataSourceItem[];
  /** X轴字段名，默认为 'date' */
  xAxisField: string;
  /** X轴配置 */
  xAxisConfig?: XAxisConfig;
  /** Y轴格式化配置 */
  yAxisConfig?: YAxisConfig;
  /** 指定各字段的图表类型（'line' | 'bar'） */
  seriesTypes?: SeriesTypeConfig;
  /** 指定各字段的名称 */
  seriesNameMap?: { [key: string]: string };
  /** 是否自动判断使用 bar/line，默认 true */
  autoSeriesType?: boolean;
  /** 自动检测配置 */
  autoHighlightConfig?: AutoDetectConfig;
}

/**
 * SmartLineChart 组件
 */
export declare const SmartLineChart: React.FC<SmartLineChartProps>;

export interface SeriesConfig {
  seriesTypes: SeriesTypeConfig | undefined;
  autoSeriesType: boolean;
  seriesNameMap: { [key: string]: string } | undefined;
  field: string;
  defaultType: SmartLineSeriesType;
  autoTypeStr: SmartLineSeriesType | undefined;
  yAxisIndex?: number;
}
