/**
 * SmartLineChart 智能折线/柱状图组件
 *
 * 功能：
 * 1. 自动判断是否需要双轴图，以及左右轴分配数据(数据特征 + k-means聚类算法)
 * 2. 自动选用 bar/line，或者手动指定图表类型，可以根据左右轴数据分别推荐
 * 3. 支持自定义 X 轴字段
 * 4. 支持自定义左右 Y 轴名称、格式化
 */

import React, { useMemo, useEffect } from 'react';
import type { MapConfigType, SeriesType } from '@sto/sto-charts/es/line-chart/interface';
import { LineChart, use } from '@sto/sto-charts';
import { MarkPointComponent } from '@sto/sto-charts/components';

import { autoAssignDualAxis } from './algorithms/index';
import type { SmartLineChartProps } from './index.d';
import {
  buildXAxisConfig,
  buildYAxisConfig,
  DEFAULT_HIGHLIGHT_CONFIG,
  generateSingleAxisSeries,
  generateDualAxisSeries,
  validateProps,
} from './utils';

use([MarkPointComponent]);

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
    autoHighlightConfig = DEFAULT_HIGHLIGHT_CONFIG, // 是否自动检测异常值/关键值
    ...restProps // 其他属性
  } = props;

  // Props 校验
  useEffect(() => {
    validateProps(xAxisField, dataSource);
  }, [xAxisField, dataSource]);

  // 生成图表配置
  const smartMapConfig = useMemo<MapConfigType | undefined>(() => {
    // 早期返回：必填参数校验
    if (!xAxisField || !dataSource?.length) return undefined;

    try {
      const yAxisKeys = Object.keys(dataSource[0]).filter((k) => k !== xAxisField);

      if (!yAxisKeys.length) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('SmartLineChart: No Y-axis fields found in dataSource.');
        }
        return undefined;
      }

      const yAxisData = yAxisKeys.reduce((acc, key) => {
        acc[key] = dataSource.map((d) => d[key]);
        return acc;
      }, {});

      // 双轴推荐和聚类结果
      const result = autoAssignDualAxis(yAxisKeys, yAxisData);

      let series: SeriesType[];

      // 单轴情况
      if (!result.isDual) {
        series = generateSingleAxisSeries({
          yAxisKeys,
          yAxisData,
          dataSource,
          xAxisField,
          seriesTypes,
          autoSeriesType,
          seriesNameMap,
          autoHighlightConfig,
        });
      } else {
        // 双轴情况
        if (!result.category) return undefined;
        const { left, right } = result.category;

        series = generateDualAxisSeries({
          left,
          right,
          yAxisData,
          dataSource,
          xAxisField,
          seriesTypes,
          autoSeriesType,
          seriesNameMap,
          autoHighlightConfig,
        });
      }

      return {
        ...(mapConfig || {}),
        xAxis: buildXAxisConfig(mapConfig, xAxisField, xAxisConfig),
        yAxis: buildYAxisConfig(yAxisConfig, result.isDual),
        series,
      };
    } catch (error) {
      // 错误边界：捕获算法执行异常，降级为空配置
      if (process.env.NODE_ENV === 'development') {
        console.error('[SmartLineChart] Error generating chart config:', error);
      }
      return undefined;
    }
  }, [
    dataSource,
    autoSeriesType,
    mapConfig,
    xAxisField,
    xAxisConfig,
    yAxisConfig,
    seriesTypes,
    seriesNameMap,
    autoHighlightConfig,
  ]);

  // 错误降级：如果配置生成失败，返回空状态提示
  if (!smartMapConfig && xAxisField && dataSource?.length) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          图表配置生成失败，请检查数据格式或查看控制台错误信息
        </div>
      );
    }
    return null;
  }

  return <LineChart dataSource={dataSource} mapConfig={smartMapConfig} {...restProps} />;
};

export default SmartLineChart;
export type { SmartLineChartProps } from './index.d';
