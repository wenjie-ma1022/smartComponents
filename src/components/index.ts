/**
 * 智能组件统一导出
 */

// SmartLineChart
export { default as SmartLineChart } from './SmartLineChart';
export type {
  SmartLineChartProps,
  DataSourceItem,
  XAxisConfig,
  YAxisConfig,
  SeriesTypeConfig,
  AutoDetectConfig,
  SmartLineSeriesType,
} from './SmartLineChart/index.d';

// SmartPieChart
export { default as SmartPieChart } from './SmartPieChart';
export type { SmartPieChartProps, PieItem } from './SmartPieChart/index.d';
