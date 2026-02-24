# SmartLineChart 智能折线图组件

基于 `@sto/sto-charts` 的 LineChart 封装的智能折线图组件，自动处理双轴判断、左右轴分配等逻辑。

## 功能特性

✅ **智能双轴判断**：自动分析数据特征，判断是否需要双轴图  
✅ **智能图表类型选择**：基于趋势分析和异常值检测自动选择 bar/line  
✅ **自定义 X 轴字段**：灵活指定 X 轴数据字段  
✅ **自定义左右 Y 轴配置**：支持名称、格式化、小数位数等配置  
✅ **手动类型覆盖**：可手动指定各字段的图表类型

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
        leftConfig: {
          type: 'value',
          name: '销售额',
        },
        rightConfig: {
          type: 'value',
          name: '点击率',
        },
      }}
    />
  );
}
```

### 智能类型选择示例

```tsx
import SmartLineChart from '@/components/SmartLineChart';

function Demo() {
  // 趋势明显的数据 → 自动选择折线图
  const trendData = [
    { month: '2024-01', sales: 1000, profit: 150 },
    { month: '2024-02', sales: 1200, profit: 180 },
    { month: '2024-03', sales: 1400, profit: 210 },
    { month: '2024-04', sales: 1600, profit: 240 },
    { month: '2024-05', sales: 1800, profit: 270 },
  ];

  // 分类数据 → 自动选择柱状图
  const categoryData = [
    { category: 'A类', count: 100 },
    { category: 'B类', count: 150 },
    { category: 'C类', count: 120 },
  ];

  return (
    <div>
      {/* 趋势数据自动选择折线图 */}
      <SmartLineChart dataSource={trendData} xAxisField="month" />

      {/* 分类数据自动选择柱状图 */}
      <SmartLineChart dataSource={categoryData} xAxisField="category" />
    </div>
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
        leftConfig: {
          type: 'value',
          name: '访问量',
        },
        rightConfig: {
          type: 'value',
          name: '转化率',
        },
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

| 属性                | 类型                  | 默认值   | 说明                          |
| ------------------- | --------------------- | -------- | ----------------------------- |
| dataSource          | `DataSourceItem[]`    | -        | **必填** 数据源数组           |
| xAxisField          | `string`              | -        | **必填** X 轴字段名           |
| xAxisConfig         | `XAxisConfig`         | -        | X 轴配置                      |
| yAxisConfig         | `YAxisConfig`         | -        | Y 轴配置                      |
| seriesTypes         | `SeriesTypeConfig`    | -        | 指定各字段的图表类型          |
| seriesNameMap       | `Record<string, string>` | -     | 指定各字段的显示名称          |
| autoSeriesType      | `boolean`             | `true`   | 是否自动判断使用 bar/line     |
| autoHighlightConfig | `AutoDetectConfig`    | -        | 异常值/关键值自动检测配置     |
| ...restProps        | `LineChartProps`      | -        | 其他 LineChart 组件支持的属性 |

### XAxisConfig

```typescript
interface XAxisConfig {
  name?: string;   // X轴名称
  format?: string; // X轴格式化字符串
}
```

### YAxisConfig

```typescript
interface YAxisConfig {
  leftConfig?: YAxisType;  // 左Y轴配置（完整的 ECharts Y轴配置）
  rightConfig?: YAxisType; // 右Y轴配置（完整的 ECharts Y轴配置）
}

// YAxisType 示例
interface YAxisType {
  type?: 'value' | 'category' | 'time' | 'log';
  name?: string;           // Y轴名称
  nameLocation?: 'start' | 'middle' | 'end';
  min?: number | string;   // 最小值
  max?: number | string;   // 最大值
  axisLabel?: {
    formatter?: string | Function; // 标签格式化
  };
  // ...其他 ECharts Y轴配置
}
```

### SeriesTypeConfig

```typescript
interface SeriesTypeConfig {
  [field: string]: 'line' | 'bar';
}
```

## 智能算法体系

SmartLineChart 组件内置了三大智能算法，实现"零配置"的最优图表展示：

| 算法                      | 功能                         | 详细文档                                                     |
| ------------------------- | ---------------------------- | ------------------------------------------------------------ |
| autoSetSeriesType         | 自动选择图表类型（bar/line） | [查看详情](./algorithms/README/autoSetSeriesType.md)         |
| autoAssignDualAxis        | 自动双轴判断与左右轴分配     | [查看详情](./algorithms/README/autoAssignDualAxis.md)        |
| autoDetectOutliersAndKeys | 异常值/关键值自动检测与高亮  | [查看详情](./algorithms/README/autoDetectOutliersAndKeys.md) |

---

### 算法一：图表类型自动选择（autoSetSeriesType）

自动判断使用柱状图（bar）还是折线图（line），采用 **四步决策框架**：

| 步骤   | 决策内容       | 核心思想                               |
| ------ | -------------- | -------------------------------------- |
| Step 1 | 数据点数量判断 | 点少用柱状图，点多用折线图（避免拥挤） |
| Step 2 | X 轴语义判断   | 连续型数据（时间/有序数值）适合折线图  |
| Step 3 | 趋势投票分析   | 对所有 Y 轴数据进行线性回归分析        |
| Step 4 | 综合决策       | 基于趋势投票比例和动态阈值确定最终类型 |

**核心技术**：

- 支持 10 种日期格式自动识别
- IQR 四分位距法过滤异常值
- 线性回归计算 R² 拟合优度
- 置信度加权的双层阈值机制

---

### 算法二：双轴判断与左右轴分配（autoAssignDualAxis）

自动判断是否需要双轴图，并智能分配左右 Y 轴，采用 **两步决策框架**：

| 步骤   | 决策内容       | 核心思想                                  |
| ------ | -------------- | ----------------------------------------- |
| Step 1 | 双轴必要性判断 | 基于数值类型（比例/绝对值）和量级差异判断 |
| Step 2 | 左右轴分配     | 使用 K-Means++ 聚类算法智能分组           |

**判断规则**：

- 同时存在比例值（-1~1）和绝对值 → 需要双轴
- 指标最大值差距超过 6 倍 → 需要双轴
- 使用 min/max/median 三维特征向量进行聚类
- 中位数大的组分配到左轴（主轴）

---

### 算法三：异常值/关键值检测（autoDetectOutliersAndKeys）

自动检测并高亮数据中的异常值与关键点，提供 **四种检测能力**：

| 检测类型       | 标记类型         | 核心思想                            |
| -------------- | ---------------- | ----------------------------------- |
| IQR 离群值检测 | `outlier`        | 基于四分位距识别统计异常点          |
| 趋势偏离检测   | `trendDeviation` | 基于线性回归残差识别偏离趋势的点    |
| 全局极值检测   | `keyPoint`       | 识别全局最大值和最小值              |
| 突变检测       | `keyPoint`       | 基于一阶差分识别数据突增/突降的拐点 |

**特点**：

- 优先级机制：outlier > trendDeviation > keyPoint
- R² 门槛：避免无意义的趋势检测
- 支持并列极值标记

---

### 算法配置参数

组件内置了可配置的算法阈值，可通过修改对应算法文件顶部的常量来调整行为：

**autoSetSeriesType.ts**（图表类型选择）：

```typescript
const TREND_R2_THRESHOLD = 0.6; // 趋势判断的 R² 阈值
const TREND_SLOPE_FACTOR = 0.01; // 斜率占值域比例的最小阈值
const MAX_POINTS_FOR_BAR = 80; // 总点数超过此值直接用折线图
const POINT_COUNT_FOR_BONUS = 12; // 数据点超过此值时降低趋势阈值
const POINT_BONUS = -0.2; // 点数多时的阈值调整量
const BASE_TREND_THRESHOLD = 0.5; // 趋势投票基础阈值（50%）
const MIN_VALID_RATIO = 0.5; // Y 轴有效数据的最小占比
```

**autoAssignDualAxis.ts**（双轴判断）：

```typescript
const MAX_GAP = 6; // 双轴判断的最大差距倍数阈值
```

**autoDetectOutliersAndKeys.ts**（异常值检测）：

```typescript
const DEFAULT_OPTIONS = {
  iqrMultiplier: 1.5, // IQR 倍数
  trendSigma: 2.5, // 趋势残差 Z-Score 阈值
  sharpChangeSigma: 3.0, // 突变检测 Z-Score 阈值
  minSamplesForIqr: 5, // IQR 检测最小样本数
  minSamplesForTrend: 6, // 趋势检测最小样本数
  minSamplesForSharpChange: 3, // 突变检测最小样本数
  minR2ForTrend: 0.4, // 趋势检测 R² 阈值
};
```

## 注意事项

1. 数据源 `dataSource` 必须是对象数组格式
2. X 轴字段和指标字段的值应该是数字、字符串或日期类型
3. 如果手动指定 `seriesTypes`，则 `autoSeriesType` 会默认设置为 `false`
4. 组件会自动处理空数据和无效数据情况，不会报错
5. 算法阈值可根据业务场景调整，建议在开发环境中测试不同配置的效果
