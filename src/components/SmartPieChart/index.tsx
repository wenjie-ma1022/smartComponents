import React from 'react';
import { PieChart } from '@sto/sto-charts';
import type { SmartPieChartProps } from './index.d';

export default function SmartPieChart(props: SmartPieChartProps) {
  const { dataSource, mapConfig, ...restProps } = props;
  return <PieChart dataSource={dataSource} mapConfig={mapConfig} {...restProps} />;
}
