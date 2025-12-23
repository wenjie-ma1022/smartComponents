# SmartLineChart 智能折线图组件

基于 `@sto/sto-charts` 的 LineChart 封装的智能折线图组件，自动处理双轴判断、左右轴分配等逻辑。

## 功能特性

✅ 自动判断是否需要双轴图  
✅ 支持自定义 X 轴字段  
✅ 支持自定义左右 Y 轴名称  
✅ 支持 Y 轴字段格式化  
✅ 自动选用 bar/line，或者手动指定图表类型

## 使用示例

### 基础用法

```tsx
import SmartLineChart from '@/components/SmartLineChart';

function Demo() {
  const dataSource = [
    { date: '2024-01', sales: 1000, profit: 200 },
    { date: '2024-02', sales: 1500, profit: 300 },
    { date: '2024-03', sales: 1200, profit: 250 },
  ];

  return <SmartLineChart dataSource={dataSource} xAxisField="date" />;
}
```

### 自定义 Y 轴配置

```tsx
import SmartLineChart from '@/components/SmartLineChart';

function Demo() {
  const dataSource = [
    { date: '2024-01', sales: 1000, ctr: 0.12 },
    { date: '2024-02', sales: 1500, ctr: 0.15 },
    { date: '2024-03', sales: 1200, ctr: 0.13 },
  ];

  return (
    <SmartLineChart
      dataSource={dataSource}
      xAxisField="date"
      yAxisConfig={{
        leftName: '销售额',
        rightName: '点击率',
        leftFormat: '¥',
        rightFormat: '%',
        leftRetain: 0,
        rightRetain: 2,
      }}
    />
  );
}
```

### 手动指定图表类型

```tsx
import SmartLineChart from '@/components/SmartLineChart';

function Demo() {
  const dataSource = [
    { date: '2024-01', uv: 1000, pv: 5000, ctr: 0.12 },
    { date: '2024-02', uv: 1500, pv: 6000, ctr: 0.15 },
    { date: '2024-03', uv: 1200, pv: 5500, ctr: 0.13 },
  ];

  return (
    <SmartLineChart
      dataSource={dataSource}
      xAxisField="date"
      seriesTypes={{
        uv: 'bar',
        pv: 'bar',
        ctr: 'line',
      }}
      autoSeriesType={false}
    />
  );
}
```

### 完整配置示例

```tsx
import SmartLineChart from '@/components/SmartLineChart';

function Demo() {
  const dataSource = [
    { date: '2024-01', uv: 1000, pv: 5000, ctr: 0.12, cvr: 0.03 },
    { date: '2024-02', uv: 1500, pv: 6000, ctr: 0.15, cvr: 0.04 },
    { date: '2024-03', uv: 1200, pv: 5500, ctr: 0.13, cvr: 0.035 },
  ];

  return (
    <SmartLineChart
      dataSource={dataSource}
      xAxisField="date"
      height={400}
      hideCheckbox
      tooltipTheme="dark"
      showLabelValue={false}
      yAxisConfig={{
        leftName: '访问量',
        rightName: '转化率',
        rightFormat: '%',
        rightRetain: 2,
      }}
      seriesTypes={{
        uv: 'bar',
        pv: 'bar',
        ctr: 'line',
        cvr: 'line',
      }}
    />
  );
}
```

## API 属性

| 属性           | 类型                | 默认值   | 说明                          |
| -------------- | ------------------- | -------- | ----------------------------- |
| dataSource     | `DataSourceItem[]`  | -        | **必填** 数据源数组           |
| xAxisField     | `string`            | `'date'` | X 轴字段名                    |
| yAxisConfig    | `YAxisFormatConfig` | -        | Y 轴格式化配置                |
| seriesTypes    | `SeriesTypeConfig`  | -        | 指定各字段的图表类型          |
| autoSeriesType | `boolean`           | `true`   | 是否自动判断使用 bar/line     |
| ...restProps   | `LineChartProps`    | -        | 其他 LineChart 组件支持的属性 |

### YAxisFormatConfig

```typescript
interface YAxisFormatConfig {
  leftName?: string; // 左Y轴名称
  rightName?: string; // 右Y轴名称
  leftFormat?: string; // 左Y轴格式化字符串（如 '%', '¥'）
  rightFormat?: string; // 右Y轴格式化字符串
  leftRetain?: number; // 左Y轴保留小数位数
  rightRetain?: number; // 右Y轴保留小数位数
}
```

### SeriesTypeConfig

```typescript
interface SeriesTypeConfig {
  [field: string]: 'line' | 'bar' | 'scatter';
}
```

## 算法说明

### 双轴判断逻辑

组件会自动分析数据特征，判断是否需要使用双轴图：

1. **数值类型判断**：区分比例数据（-1 到 1 之间）和绝对值数据
2. **数值差距判断**：当不同指标的最大值差距超过 10 倍时，建议使用双轴
3. **K-means 聚类**：使用 K-means 算法（k=2）将指标分为两组，分别映射到左右轴

### 图表类型自动选择

当 `autoSeriesType` 为 `true` 时：

- 比例数据（-1 到 1 之间）：使用折线图
- 小数值数据（最大值 < 100）：使用折线图
- 其他情况：使用柱状图

## 注意事项

1. 数据源 `dataSource` 必须是对象数组格式
2. X 轴字段和指标字段的值应该是数字、字符串或日期类型
3. 如果手动指定 `seriesTypes`，建议同时设置 `autoSeriesType={false}`
4. 组件会自动处理空数据情况，不会报错
