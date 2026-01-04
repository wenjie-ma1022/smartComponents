import type {
  SeriesType,
  MapConfigType,
  YAxisType,
} from "@sto/sto-charts/es/line-chart/interface";
import type { SeriesTypeConfig, YAxisConfig, XAxisConfig } from "./index.d";
import type { DataSourceItem } from "./algorithms.d";

// 确定 series 的类型
function determineSeriesType(
  seriesTypes: SeriesTypeConfig | undefined,
  autoSeriesType: boolean,
  field: string,
  defaultType: string,
  autoTypeStr: string | undefined
): string {
  // 优先级：字段指定 > 分组指定 > 自动判断 > 默认值
  if (seriesTypes?.[field]) return seriesTypes[field];
  if (seriesTypes?.leftSeriesType && defaultType === "bar") {
    return seriesTypes.leftSeriesType;
  }
  if (seriesTypes?.rightSeriesType && defaultType === "line") {
    return seriesTypes.rightSeriesType;
  }
  if (autoSeriesType && autoTypeStr) return autoTypeStr;
  return defaultType;
}

// 获取过滤后的数据源
export const getFilteredDataSource = (
  dataSource: DataSourceItem[],
  xAxisField: string,
  fields: string[]
): DataSourceItem[] => {
  return dataSource.map((d) => {
    const filteredData: any = {
      [xAxisField]: d[xAxisField], // x轴字段必须保留
    };
    // 只保留属于左轴的字段
    fields.forEach((field) => {
      if (d.hasOwnProperty(field)) {
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
export function createSeriesConfig(params: {
  seriesTypes: SeriesTypeConfig | undefined;
  autoSeriesType: boolean;
  seriesNameMap: { [key: string]: string } | undefined;
  field: string;
  defaultType: string;
  autoTypeStr: string | undefined;
  yAxisIndex?: number;
}): SeriesType {
  const {
    seriesTypes,
    autoSeriesType,
    seriesNameMap,
    field,
    defaultType,
    autoTypeStr,
    yAxisIndex,
  } = params;

  const type = determineSeriesType(
    seriesTypes,
    autoSeriesType,
    field,
    defaultType,
    autoTypeStr
  );
  const config: any = {
    field,
    name: seriesNameMap?.[field] || field,
    type,
  };

  if (yAxisIndex !== undefined) config.yAxisIndex = yAxisIndex;
  if (type === "line") config.smooth = true;

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
  xAxisConfig: XAxisConfig | undefined
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
  isDual: boolean
): YAxisType[] {
  const leftConfig: YAxisType = yAxisConfig?.leftConfig || {
    type: "value",
    name: isDual ? "左Y轴" : "Y轴",
  };

  if (!isDual) return [leftConfig];
  const rightConfig: YAxisType = yAxisConfig?.rightConfig || {
    type: "value",
    name: "右Y轴",
  };
  return [leftConfig, rightConfig];
}
