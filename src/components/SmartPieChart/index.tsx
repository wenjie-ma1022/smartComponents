import React, { useMemo } from 'react';
import { PieChart } from '@sto/sto-charts';
import type { SmartPieChartProps } from './index.d';
import {
  generateLegend,
  generateColors,
  generateLabel,
  generateSmartPieOption,
} from './algorithms';

const SmartPieChart: React.FC<SmartPieChartProps> = ({ dataSource, height = 300 }) => {
  const config = useMemo(() => {
    const { feature, pieType, merged, marked } = generateSmartPieOption(dataSource);
    debugger;

    return {
      legend: generateLegend(feature.count),
      series: [
        {
          type: 'pie',
          radius: pieType === 'cycle' ? ['40%', '70%'] : '70%',
          data: marked,
          color: generateColors(marked),
          label: generateLabel(feature.count),
          emphasis: {
            scale: true,
            scaleSize: 6,
          },
        },
      ],
    };
  }, [dataSource]);

  return (
    <></> // <PieChart
    //   dataSource={data}
    //   mapConfig={option}
    //   style={{ height }}
    //   notMerge
    //   lazyUpdate
    // />
  );
};

export default SmartPieChart;
export type { SmartPieChartProps, PieItem } from './index.d';
