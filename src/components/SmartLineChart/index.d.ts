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

/**
 * 系列类型配置
 */
export interface SeriesTypeConfig {
  /** 指定系列类型，优先级最高 */
  [key: string]: "line" | "bar";
  /** 左轴系列类型 */
  leftSeriesType?: "line" | "bar";
  /** 右轴系列类型 */
  rightSeriesType?: "line" | "bar";
  /** 指定所有系列类型，优先级最低 */
  seriesType?: "line" | "bar";
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
}

/**
 * SmartLineChart 组件
 */
export declare const SmartLineChart: React.FC<SmartLineChartProps>;
