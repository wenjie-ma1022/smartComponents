/**
 * SmartLineChart 智能折线/柱状图组件
 *
 * 功能：
 * 1. 自动判断是否需要双轴图，以及左右轴分配数据(数据特征 + k-means聚类算法)
 * 2. 自动选用 bar/line，或者手动指定图表类型  TODO:后续可以根据左右轴数据分别推荐
 * 3. 支持自定义 X 轴字段
 * 4. 支持自定义左右 Y 轴名称、格式化
 */

import React from "react";
import type {
  MapConfigType,
  SeriesType,
} from "@sto/sto-charts/es/line-chart/interface";
import { LineChart } from "@sto/sto-charts";
import { buildSmartLineChartConfig, autoSetSeriesType } from "./algorithms";
import type { SmartLineChartProps } from "./index.d";
import {
  createSeriesConfig,
  buildXAxisConfig,
  buildYAxisConfig,
} from "./utils";

const SmartLineChart: React.FC<SmartLineChartProps> = (props) => {
  const {
    dataSource, // 数据源
    mapConfig,
    xAxisField = mapConfig?.xAxis?.field, // X轴字段
    xAxisConfig, // X轴配置
    yAxisConfig, // Y轴配置
    seriesTypes, // 指定各字段的图表类型
    seriesNameMap, // 指定各字段的名称
    autoSeriesType = !seriesTypes, // 如果传入了 seriesTypes，使用手动模式；否则使用自动模式
    ...restProps // 其他属性
  } = props;

  // 生成智能配置
  const smartMapConfig = React.useMemo<MapConfigType | undefined>(() => {
    if (!xAxisField) {
      console.error("xAxisField is required in mapConfig or props");
      return undefined;
    }
    if (!dataSource?.length) return undefined;

    const result = buildSmartLineChartConfig(dataSource, xAxisField);
    const metricKeys = Object.keys(dataSource[0]).filter(
      (k) => k !== xAxisField
    );

    // 自动判断图表类型
    const autoTypeStr = autoSeriesType
      ? autoSetSeriesType(dataSource, xAxisField)
      : undefined;

    let series: SeriesType[];

    // 单轴情况
    if (!result.isDual) {
      series = metricKeys.map((k) =>
        createSeriesConfig({
          seriesTypes,
          autoSeriesType,
          seriesNameMap,
          field: k,
          defaultType: "bar",
          autoTypeStr,
        })
      );
    } else {
      // 双轴情况
      if (!result.category) return undefined;
      const { left, right } = result.category;

      const leftSeries = left.map((k) =>
        createSeriesConfig({
          seriesTypes,
          autoSeriesType,
          seriesNameMap,
          field: k,
          defaultType: "bar",
          autoTypeStr,
          yAxisIndex: 0,
        })
      );
      const rightSeries = right.map((k) =>
        createSeriesConfig({
          seriesTypes,
          autoSeriesType,
          seriesNameMap,
          field: k,
          defaultType: "line",
          autoTypeStr,
          yAxisIndex: 1,
        })
      );
      series = [...leftSeries, ...rightSeries];
    }

    return {
      ...(mapConfig || {}),
      xAxis: buildXAxisConfig(mapConfig, xAxisField, xAxisConfig),
      yAxis: buildYAxisConfig(yAxisConfig, result.isDual),
      series,
    };
  }, [
    dataSource,
    autoSeriesType,
    mapConfig,
    xAxisField,
    xAxisConfig,
    yAxisConfig,
    seriesTypes,
    seriesNameMap,
  ]);

  return (
    <LineChart
      dataSource={dataSource}
      mapConfig={smartMapConfig}
      {...restProps}
    />
  );
};

export default SmartLineChart;
