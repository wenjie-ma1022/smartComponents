import type { SeriesType, MapConfigType, YAxisType } from '@sto/sto-charts/es/line-chart/interface';
import type {
  SeriesConfig,
  SeriesTypeConfig,
  YAxisConfig,
  XAxisConfig,
  DataSourceItem,
  SmartLineSeriesType,
} from './index.d';
import type { HighlightPoint } from './algorithms/autoDetectOutliersAndKeys';

/** 高亮点样式配置 */
const HIGHLIGHT_STYLES = {
  // 离群值 - 红色警告
  outlier: {
    symbol: 'circle',
    symbolSize: 12,
    itemStyle: {
      color: '#ff4d4f',
      borderColor: '#fff',
      borderWidth: 2,
      shadowBlur: 4,
      shadowColor: 'rgba(255, 77, 79, 0.4)',
    },
    label: {
      color: '#ff4d4f',
      fontWeight: 'bold',
    },
  },
  // 趋势偏离 - 橙色警告
  trendDeviation: {
    symbol: 'diamond',
    symbolSize: 10,
    itemStyle: {
      color: '#fa8c16',
      borderColor: '#fff',
      borderWidth: 2,
      shadowBlur: 4,
      shadowColor: 'rgba(250, 140, 22, 0.4)',
    },
    label: {
      color: '#fa8c16',
      fontWeight: 'bold',
    },
  },
  // 关键点（最大/最小/突变）- 蓝色标记
  keyPoint: {
    symbol: 'pin',
    symbolSize: 14,
    itemStyle: {
      color: '#1890ff',
      borderColor: '#fff',
      borderWidth: 2,
      shadowBlur: 4,
      shadowColor: 'rgba(24, 144, 255, 0.4)',
    },
    label: {
      color: '#1890ff',
      fontWeight: 'bold',
    },
  },
};

/**
 * 根据 HighlightPoint 数组生成 ECharts markPoint 配置
 */
export function buildMarkPointConfig(
  highlightPoints: HighlightPoint[],
  dataSource: DataSourceItem[],
  xAxisField: string,
): any {
  if (!highlightPoints?.length) return undefined;

  const data = highlightPoints.map((point) => {
    const style = HIGHLIGHT_STYLES[point.type];
    const xValue = dataSource[point.index]?.[xAxisField];

    const markPointItem: any = {
      name: point.reason,
      coord: [xValue, point.value],
      value: point.value,
      ...style,
      label: {
        show: true,
        position: 'top',
        formatter: point.reason,
        fontSize: 10,
        padding: [2, 4],
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 2,
        ...style.label,
      },
    };

    return markPointItem;
  });

  return {
    animation: true,
    data,
  };
}

// 确定 series 的类型
function determineSeriesType(
  seriesTypes: SeriesTypeConfig | undefined,
  autoSeriesType: boolean,
  field: string,
  defaultType: SmartLineSeriesType,
  autoTypeStr: SmartLineSeriesType | undefined,
): SmartLineSeriesType {
  // 优先级：字段指定 > 分组指定 > 自动判断 > 默认值
  if (seriesTypes?.[field]) return seriesTypes[field];
  if (seriesTypes?.leftSeriesType && defaultType === 'bar') {
    return seriesTypes.leftSeriesType;
  }
  if (seriesTypes?.rightSeriesType && defaultType === 'line') {
    return seriesTypes.rightSeriesType;
  }
  if (autoSeriesType && autoTypeStr) return autoTypeStr;
  return defaultType;
}

// 获取过滤后的数据源
export const getFilteredDataSource = (
  dataSource: DataSourceItem[],
  xAxisField: string,
  fields: string[],
): DataSourceItem[] => {
  return dataSource.map((d) => {
    const filteredData: any = {
      [xAxisField]: d[xAxisField], // x轴字段必须保留
    };
    // 只保留属于左轴的字段
    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(d, field)) {
        filteredData[field] = d[field];
      }
    });
    return filteredData;
  });
};

/**
 *
 * @param params - 创建参数
 * @returns Series 配置对象
 */
export function createSeriesConfig(params: SeriesConfig): SeriesType & {
  type: SmartLineSeriesType;
} {
  const {
    seriesTypes,
    autoSeriesType,
    seriesNameMap,
    field,
    defaultType,
    autoTypeStr,
    yAxisIndex,
  } = params;

  const type = determineSeriesType(seriesTypes, autoSeriesType, field, defaultType, autoTypeStr);

  const config: any = {
    field,
    name: seriesNameMap?.[field] || field,
    type,
  };

  if (yAxisIndex !== undefined) config.yAxisIndex = yAxisIndex;
  if (type === 'line') config.smooth = true;

  return config;
}

/**
 * 构建 X 轴配置
 * @param mapConfig - 图表配置
 * @param xAxisField - X轴字段
 * @param xAxisConfig - X轴额外配置
 * @returns X轴配置对象
 */
export function buildXAxisConfig(
  mapConfig: MapConfigType | undefined,
  xAxisField: string,
  xAxisConfig: XAxisConfig | undefined,
) {
  return {
    ...(mapConfig?.xAxis || {}),
    field: xAxisField,
    ...xAxisConfig,
  };
}

/**
 * 构建 Y 轴配置
 * @param yAxisConfig - Y轴配置
 * @param isDual - 是否双轴
 * @returns Y轴配置数组
 */
export function buildYAxisConfig(
  yAxisConfig: YAxisConfig | undefined,
  isDual: boolean,
): YAxisType[] {
  const leftConfig: YAxisType = yAxisConfig?.leftConfig || {
    type: 'value',
    name: isDual ? '左Y轴' : 'Y轴',
  };

  if (!isDual) return [leftConfig];
  const rightConfig: YAxisType = yAxisConfig?.rightConfig || {
    type: 'value',
    name: '右Y轴',
  };
  return [leftConfig, rightConfig];
}
