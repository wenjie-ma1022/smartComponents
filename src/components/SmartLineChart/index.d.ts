import {
  IProps as LineChartProps,
  MapConfigType,
  YAxisType,
} from '@sto/sto-charts/es/line-chart/interface';
import { DataSourceItem } from './algorithms';

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
  [key: string]: 'line' | 'bar' | 'scatter';
  /** 左轴系列类型 */
  leftSeriesType?: 'line' | 'bar' | 'scatter';
  /** 右轴系列类型 */
  rightSeriesType?: 'line' | 'bar' | 'scatter';
}

/**
 * SmartLineChart 组件属性
 */
export interface SmartLineChartProps extends Omit<LineChartProps, 'mapConfig'> {
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
  /** 指定各字段的图表类型（'line' | 'bar' | 'scatter'） */
  seriesTypes?: SeriesTypeConfig;
  /** 指定各字段的名称 */
  seriesNameMap?: { [key: string]: string };
  /** 是否自动判断使用 bar/line，默认 true */
  autoSeriesType?: boolean;
}
