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
import SmartLineChart from "@/components/SmartLineChart";

function Demo() {
  const dataSource = [
    { date: "2024-01", sales: 1000, profit: 200 },
    { date: "2024-02", sales: 1500, profit: 300 },
    { date: "2024-03", sales: 1200, profit: 250 },
  ];

  return <SmartLineChart dataSource={dataSource} xAxisField="date" />;
}
```

### 自定义 Y 轴配置

```tsx
import SmartLineChart from "@/components/SmartLineChart";

function Demo() {
  const dataSource = [
    { date: "2024-01", sales: 1000, ctr: 0.12 },
    { date: "2024-02", sales: 1500, ctr: 0.15 },
    { date: "2024-03", sales: 1200, ctr: 0.13 },
  ];

  return (
    <SmartLineChart
      dataSource={dataSource}
      xAxisField="date"
      yAxisConfig={{
        leftName: "销售额",
        rightName: "点击率",
        leftFormat: "¥",
        rightFormat: "%",
        leftRetain: 0,
        rightRetain: 2,
      }}
    />
  );
}
```

### 智能类型选择示例

```tsx
import SmartLineChart from "@/components/SmartLineChart";

function Demo() {
  // 趋势明显的数据 → 自动选择折线图
  const trendData = [
    { month: "2024-01", sales: 1000, profit: 150 },
    { month: "2024-02", sales: 1200, profit: 180 },
    { month: "2024-03", sales: 1400, profit: 210 },
    { month: "2024-04", sales: 1600, profit: 240 },
    { month: "2024-05", sales: 1800, profit: 270 },
  ];

  // 分类数据 → 自动选择柱状图
  const categoryData = [
    { category: "A类", count: 100 },
    { category: "B类", count: 150 },
    { category: "C类", count: 120 },
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
import SmartLineChart from "@/components/SmartLineChart";

function Demo() {
  const dataSource = [
    { date: "2024-01", uv: 1000, pv: 5000, ctr: 0.12 },
    { date: "2024-02", uv: 1500, pv: 6000, ctr: 0.15 },
    { date: "2024-03", uv: 1200, pv: 5500, ctr: 0.13 },
  ];

  return (
    <SmartLineChart
      dataSource={dataSource}
      xAxisField="date"
      seriesTypes={{
        uv: "bar",
        pv: "bar",
        ctr: "line",
      }}
      autoSeriesType={false}
    />
  );
}
```

### 完整配置示例

```tsx
import SmartLineChart from "@/components/SmartLineChart";

function Demo() {
  const dataSource = [
    { date: "2024-01", uv: 1000, pv: 5000, ctr: 0.12, cvr: 0.03 },
    { date: "2024-02", uv: 1500, pv: 6000, ctr: 0.15, cvr: 0.04 },
    { date: "2024-03", uv: 1200, pv: 5500, ctr: 0.13, cvr: 0.035 },
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
        leftName: "访问量",
        rightName: "转化率",
        rightFormat: "%",
        rightRetain: 2,
      }}
      seriesTypes={{
        uv: "bar",
        pv: "bar",
        ctr: "line",
        cvr: "line",
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
  [field: string]: "line" | "bar";
}
```

## 算法说明

### 双轴判断逻辑

组件会自动分析数据特征，判断是否需要使用双轴图：

1. **数值类型判断**：区分比例数据（-1 到 1 之间）和绝对值数据
2. **数值差距判断**：
   - 当存在比例数据和绝对值数据混合时，使用双轴
   - 当所有指标的最大值差距超过 10 倍时，建议使用双轴
   - 包含除零保护，正确处理负值和零值数据
3. **K-means 聚类**：使用 K-means++ 算法（k=2）将指标分为两组，分别映射到左右轴

### 图表类型自动选择

当 `autoSeriesType` 为 `true` 时，组件会通过智能算法自动判断使用柱状图（bar）还是折线图（line）：

#### 决策流程

1. **X 轴连续性判断**

   - 时间格式数据（如 "2024-01-01", "01/02", "2024.01.02" 等）
   - 有序数值数据（如 1, 5, 7, 14）
   - 非连续数据（如分类字段）直接使用柱状图

2. **总点数检查**

   - 当图表总点数（X 轴数据行数 × Y 轴字段数量）超过 80 时，直接使用折线图
   - 避免柱状图过于拥挤

3. **趋势分析**

   - 对每个 Y 轴字段进行鲁棒线性回归分析
   - 自动检测和过滤异常值（IQR 方法）
   - 计算趋势强度（R² 值）、变化幅度（斜率）和置信度
   - 综合数据质量、趋势强度、拟合优度和异常值影响进行评估
   - 根据置信度动态调整趋势判断阈值

4. **趋势投票**
   - 统计具有趋势的字段占比
   - 超过 50% 的字段具有趋势时，使用折线图
   - 当数据点数 ≥ 12 时，阈值降低至 30%（更倾向于使用折线图）

#### 算法特点

- **智能趋势识别**：通过线性回归判断数据是否有明显的上升/下降趋势
- **多字段投票**：综合考虑所有 Y 轴字段的趋势特征
- **点数适配**：数据点数多时更倾向于折线图，减少视觉干扰
- **健壮性**：自动过滤无效数据，处理边界情况

### 算法调优

组件内置了可配置的算法阈值，您可以通过修改 `algorithms.ts` 文件顶部的常量来调整算法行为：

```typescript
// 双轴判断相关
const MAX_GAP = 10; // 数值差距倍数阈值

// 图表类型自动选择相关
const TREND_R2_THRESHOLD = 0.6; // 趋势强度阈值（R²）
const TREND_SLOPE_FACTOR = 0.01; // 斜率相对阈值系数
const MAX_POINTS_FOR_BAR = 80; // 最大柱状图点数
const POINT_COUNT_FOR_BONUS = 12; // 点数奖励触发阈值
const POINT_BONUS = -0.2; // 点数多时的阈值调整
const BASE_TREND_THRESHOLD = 0.5; // 基础趋势投票阈值
const MIN_VALID_RATIO = 0.5; // Y轴字段有效数据占比
```

## 注意事项

1. 数据源 `dataSource` 必须是对象数组格式
2. X 轴字段和指标字段的值应该是数字、字符串或日期类型
3. 如果手动指定 `seriesTypes`，则 `autoSeriesType` 会默认设置为 `false`
4. 组件会自动处理空数据和无效数据情况，不会报错
5. 算法阈值可根据业务场景调整，建议在开发环境中测试不同配置的效果
