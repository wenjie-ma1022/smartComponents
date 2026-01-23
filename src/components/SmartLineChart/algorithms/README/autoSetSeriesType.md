# 图表类型智能推荐算法（autoSetSeriesType）技术文档

## 一、算法概述

### 1.1 背景与目标

在数据可视化场景中，开发面临一个常见问题：**面对一组数据，应该使用柱状图（Bar Chart）还是折线图（Line Chart）来展示？**

传统方案依赖开发手动选择，存在以下痛点：

- 需要具备一定的数据可视化专业知识
- 选择不当会降低数据表达效果
- 增加开发操作成本

`autoSetSeriesType` 算法的目标是：**基于数据特征自动推荐最合适的图表类型**，实现"数据驱动的智能决策"。

### 1.2 核心决策逻辑

算法采用 **四步决策框架**：

| 步骤   | 决策内容       | 核心思想                               |
| ------ | -------------- | -------------------------------------- |
| Step 1 | 数据点数量判断 | 点少用柱状图，点多用折线图（避免拥挤） |
| Step 2 | X 轴语义判断   | 连续型数据（时间/有序数值）适合折线图  |
| Step 3 | 趋势投票分析   | 对所有 Y 轴数据进行线性回归分析        |
| Step 4 | 综合决策       | 基于趋势投票比例确定最终类型           |

### 1.3 决策流程图

```
输入数据 → [Step1: 点数判断] → [Step2: X轴语义] → [Step3: 趋势分析] → [Step4: 综合决策] → 输出 bar/line
```

---

## 二、算法配置参数

算法提供了 **7 个可调参数**，统一管理便于后续调优：

| 参数名                  | 默认值 | 说明                         |
| ----------------------- | ------ | ---------------------------- |
| `TREND_R2_THRESHOLD`    | 0.6    | 趋势判断的 R² 拟合优度阈值   |
| `TREND_SLOPE_FACTOR`    | 0.01   | 斜率占值域比例的最小阈值     |
| `MAX_POINTS_FOR_BAR`    | 80     | 总点数超过此值直接使用折线图 |
| `POINT_COUNT_FOR_BONUS` | 12     | 数据点超过此值时降低趋势阈值 |
| `POINT_BONUS`           | -0.2   | 点数多时的阈值调整量         |
| `BASE_TREND_THRESHOLD`  | 0.5    | 趋势投票的基础阈值（50%）    |
| `MIN_VALID_RATIO`       | 0.5    | Y 轴有效数据的最小占比       |

---

## 三、核心技术实现（四步决策详解）

### Step 1：数据点数量判断

**目标**：通过数据点数量快速做出初步判断，避免不必要的复杂计算。

**决策规则**：

| 条件         | 结果   | 原因                     |
| ------------ | ------ | ------------------------ |
| 数据量 < 3   | → bar  | 数据太少，无法分析趋势   |
| X 轴点数 < 4 | → bar  | 点数太少，柱状图更直观   |
| 总点数 > 80  | → line | 点数过多，柱状图会很拥挤 |
| 其他情况     | → 继续 | 进入下一步判断           |

**核心代码**：

```typescript
// 边界保护
if (!Array.isArray(dataSource) || dataSource.length < 3) {
  return "bar";
}

// 点数太少，直接使用柱状图
if (xAxisValues.length < 4) {
  return "bar";
}

// 点数过多，柱状图会很拥挤，直接使用折线图
const totalPoints = xAxisValues.length * seriesNames.length;
if (totalPoints > MAX_POINTS_FOR_BAR) {
  return "line";
}
```

**设计理念**：渐进式决策，先用简单规则快速过滤，提高算法效率。

---

### Step 2：X 轴语义判断

**目标**：判断 X 轴是否具有「连续语义」，这是决定使用折线图的重要依据。

**判断逻辑**：

```
X轴连续 = 日期类型 OR 有序数值类型
```

- **连续型 X 轴** → 适合折线图（展示趋势变化）
- **分类型 X 轴** → 适合柱状图（展示对比关系）

#### 2.1 日期类型识别

支持 **10 种** 常见日期格式：

| 格式类型          | 示例               |
| ----------------- | ------------------ |
| YYYY.MM.DD        | 2024.01.15         |
| YYYY-MM-DD        | 2024-01-15         |
| YYYY/MM/DD        | 2024/01/15         |
| YYYY 年 M 月 D 日 | 2024 年 1 月 15 日 |
| MM-DD / MM.DD     | 01-15 / 01.15      |

**核心代码**：

```typescript
// 日期格式正则匹配
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
  /^\d{4}年\d{1,2}月\d{1,2}日/, // YYYY年M月D日
  // ... 更多格式
];

function isDate(value: any): boolean {
  if (typeof value === "string") {
    const looksLikeDate = DATE_PATTERNS.some((p) => p.test(value));
    return looksLikeDate && !isNaN(Date.parse(value));
  }
  return false;
}
```

#### 2.2 有序数值识别

识别递增或递减的数值序列，如：`202401, 202402, 202403`

**核心代码**：

```typescript
function isOrdinalNumeric(values: any[]): boolean {
  let isAscending = true;
  let isDescending = true;

  for (let i = 1; i < cleanValues.length; i++) {
    if (cleanValues[i] < cleanValues[i - 1]) isAscending = false;
    if (cleanValues[i] > cleanValues[i - 1]) isDescending = false;
    if (!isAscending && !isDescending) return false;
  }

  return isAscending || isDescending;
}
```

#### 2.3 综合判断

```typescript
const isDateValues = xAxisValues.every((v) => isDate(v));
const isOrdinal = isOrdinalNumeric(xAxisValues);
const isContinuousX = isDateValues || isOrdinal;

// X 轴非连续（纯分类） → bar
if (!isContinuousX) {
  return "bar";
}
```

---

### Step 3：趋势投票分析（核心算法）

**目标**：对所有 Y 轴数据系列进行线性回归分析，判断是否存在明显趋势。

**核心思想**：如果大部分 Y 轴数据都呈现趋势性，则更适合用折线图展示。

#### 3.1 整体流程

```
提取Y轴数据 → 数据清洗 → 异常值过滤 → 线性回归 → 置信度评估 → 趋势投票
```

#### 3.2 Y 轴数据提取

从数据源中提取所有有效的 Y 轴系列：

```typescript
// 规则：除 xAxisField 外，值为 number 且有效占比 > 50% 的字段
const values = dataSource
  .map((row) => row[key])
  .filter((v) => typeof v === "number" && !Number.isNaN(v));

if (values.length > dataSource.length * 0.5) {
  seriesMap[key] = values;
}
```

#### 3.3 线性回归分析

使用 **简单线性回归（Ordinary Least Squares）** 分析数据趋势，计算两个关键指标：

**指标一：斜率（slope）**

反映数据变化的方向和幅度：

- slope > 0：数据呈上升趋势
- slope < 0：数据呈下降趋势
- slope ≈ 0：数据基本平稳

```typescript
// 斜率公式：slope = Σ(xi - x̄)(yi - ȳ) / Σ(xi - x̄)²
const xMean = (n - 1) / 2; // 索引均值
const yMean = values.reduce((a, b) => a + b, 0) / n;

for (let i = 0; i < n; i++) {
  sumXX += (i - xMean) ** 2;
  sumXY += (i - xMean) * (values[i] - yMean);
}

const slope = sumXY / sumXX;
```

**指标二：R² 拟合优度**

反映线性趋势的显著程度（取值 0~1）：

- R² → 1：数据高度线性，趋势非常明显
- R² → 0：数据离散，无明显线性趋势

```typescript
// R² = 1 - 残差平方和 / 总平方和
for (let i = 0; i < n; i++) {
  const yHat = slope * (i - xMean) + yMean; // 预测值
  ssTot += (values[i] - yMean) ** 2; // 总平方和
  ssRes += (values[i] - yHat) ** 2; // 残差平方和
}

const r2 = 1 - ssRes / ssTot;
```

**图示说明**：

```
R² 高（≈0.8）              R² 低（≈0.2）
    •                          •    •
   •                        •    •
  •     趋势明显               •  •   无明显趋势
 •                          •      •
•                              •
```

#### 3.4 异常值处理（IQR 方法）

**问题**：极端值会严重干扰线性回归结果，导致误判。

**解决方案**：采用 **四分位距法（IQR）** 自动识别并过滤异常值。

**步骤一：计算分位数**

使用线性插值法精确计算 Q1 和 Q3：

```typescript
const getQuantile = (sorted: number[], q: number): number => {
  const pos = (sorted.length - 1) * q;
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);

  if (lower === upper) return sorted[lower];
  // 线性插值
  return sorted[lower] * (upper - pos) + sorted[upper] * (pos - lower);
};

const q1 = getQuantile(sortedValues, 0.25); // 25% 分位数
const q3 = getQuantile(sortedValues, 0.75); // 75% 分位数
```

**步骤二：计算有效范围**

```typescript
const iqr = q3 - q1; // 四分位距

// 经典 1.5 倍 IQR 规则
const lowerBound = q1 - 1.5 * iqr;
const upperBound = q3 + 1.5 * iqr;

// 过滤异常值
const filteredValues = values.filter((v) => v >= lowerBound && v <= upperBound);
```

**图示说明**：

```
数据分布：[1, 2, 3, 4, 5, 6, 7, 8, 100]  ← 100 是异常值

Q1 = 2.5, Q3 = 7.5, IQR = 5
有效范围 = [2.5 - 7.5, 7.5 + 7.5] = [-5, 15]

过滤后：[1, 2, 3, 4, 5, 6, 7, 8]  ← 100 被移除
```

#### 3.5 置信度评估

**目的**：评估趋势分析结果的可信程度，用于动态调整判断标准。

综合 **四个因子** 加权计算：

| 因子       | 权重 | 计算方式                     | 参数说明                                                    | 说明                   |
| ---------- | ---- | ---------------------------- | ----------------------------------------------------------- | ---------------------- |
| 数据质量   | 30%  | `finalN / n`                 | `finalN`：过滤后有效数据量；`n`：原始数据量                 | 有效数据占比越高越可信 |
| 趋势强度   | 30%  | `min(1, abs(slope) / range)` | `slope`：回归斜率；`range`：数据值域（最大值 - 最小值）     | 斜率相对值域越大越可信 |
| 拟合优度   | 30%  | `r2`                         | `r2`：R² 决定系数，衡量线性拟合程度                         | R² 越高越可信          |
| 异常值影响 | 10%  | `filteredN / cleanN`         | `filteredN`：IQR 过滤后数据量；`cleanN`：去除无效值后数据量 | 异常值越少越可信       |

```typescript
const confidence =
  dataQuality * 0.3 + // 数据质量因子
  trendStrength * 0.3 + // 趋势强度因子
  r2 * 0.3 + // 拟合优度因子
  outlierImpact * 0.1; // 异常值影响因子
```

**置信度作用**：决定使用严格还是宽松的趋势判断标准。

#### 3.6 双层阈值机制

**设计思想**：根据置信度动态选择判断标准，提高算法的适应性。

| 判断标准     | R² 阈值 | 斜率阈值        | 适用场景     |
| ------------ | ------- | --------------- | ------------ |
| 强趋势标准   | ≥ 0.6   | ≥ 0.01 × range  | 置信度 > 0.7 |
| 中等趋势标准 | ≥ 0.48  | ≥ 0.008 × range | 置信度 ≤ 0.7 |

```typescript
const hasStrongTrend = r2 >= 0.6 && Math.abs(slope) >= 0.01 * range;

const hasModerateTrend = r2 >= 0.48 && Math.abs(slope) >= 0.008 * range;

// 置信度高 → 用严格标准；置信度低 → 用宽松标准
const hasTrend = confidence > 0.7 ? hasStrongTrend : hasModerateTrend;
```

**为什么需要双层阈值？**

- 数据质量好时（置信度高）：用严格标准，避免误判
- 数据质量差时（置信度低）：用宽松标准，增加容错

#### 3.7 投票机制

**核心逻辑**：遍历所有 Y 轴系列，统计具有趋势的系列占比。

```typescript
let trendSeriesCount = 0;
let validSeriesCount = 0;

seriesNames.forEach((name) => {
  const values = ySeriesMap[name];
  if (values.length < 3) return; // 数据太少跳过

  validSeriesCount += 1;

  const { slope, r2, confidence, range } = calcLinearTrend(values);

  // 根据置信度选择判断标准
  const hasStrongTrend = r2 >= 0.6 && Math.abs(slope) >= 0.01 * range;
  const hasModerateTrend = r2 >= 0.48 && Math.abs(slope) >= 0.008 * range;
  const hasTrend = confidence > 0.7 ? hasStrongTrend : hasModerateTrend;

  if (hasTrend) trendSeriesCount += 1;
});

// 计算趋势投票比例
const trendRatio = trendSeriesCount / validSeriesCount;
```

**示例**：

```
假设有 4 个 Y 轴系列：销售额、利润、成本、用户数

分析结果：
- 销售额：R²=0.75, slope=120 → 有趋势 ✓
- 利润：R²=0.68, slope=45 → 有趋势 ✓
- 成本：R²=0.32, slope=10 → 无趋势 ✗
- 用户数：R²=0.81, slope=500 → 有趋势 ✓

趋势投票比例 = 3/4 = 0.75（75% 的系列有趋势）
```

---

### Step 4：综合决策

**目标**：基于趋势投票比例和动态阈值，做出最终决策。

#### 4.1 动态阈值调整

**问题**：固定阈值无法适应不同场景。

**解决方案**：引入 **点数奖励机制**，根据数据点数量动态调整阈值。

| 数据点数 | 点数奖励 | 最终阈值 | 说明                         |
| -------- | -------- | -------- | ---------------------------- |
| ≥ 12     | -0.2     | 0.3      | 点多时降低阈值，更倾向折线图 |
| < 12     | 0        | 0.5      | 点少时保持原有标准           |

```typescript
const pointBonus = dataSource.length >= 12 ? -0.2 : 0;
const threshold = 0.5 + pointBonus;
```

**设计理念**：

- 数据点多时：即使趋势不是特别明显，折线图也比柱状图更清晰（柱子太密会拥挤）
- 数据点少时：需要更明确的趋势才使用折线图，否则柱状图对比更直观

#### 4.2 最终决策逻辑

```typescript
// 趋势投票比例 vs 动态阈值
if (trendRatio >= threshold) {
  return "line"; // 大部分系列有趋势 → 折线图
}

return "bar"; // 趋势不明显 → 柱状图
```

**决策矩阵**：

| 趋势比例 | 点数 < 12（阈值 0.5） | 点数 ≥ 12（阈值 0.3） |
| -------- | --------------------- | --------------------- |
| 0.75     | line ✓                | line ✓                |
| 0.50     | line ✓                | line ✓                |
| 0.40     | bar                   | line ✓                |
| 0.25     | bar                   | bar                   |

#### 4.3 决策示例

**示例 1**：月度销售数据（12 个月，1 个 Y 轴）

```
输入：[{month: "2024-01", sales: 100}, {month: "2024-02", sales: 120}, ...]

Step 1: 点数 = 12，不触发快速判断
Step 2: X 轴为日期，isContinuousX = true
Step 3: sales 系列 R² = 0.72, slope = 15 → 有趋势，trendRatio = 1.0
Step 4: 点数 ≥ 12，阈值 = 0.3，1.0 ≥ 0.3 → line

结果：推荐折线图
```

**示例 2**：产品销量对比（5 个产品）

```
输入：[{product: "A", sales: 100}, {product: "B", sales: 200}, ...]

Step 1: 点数 = 5，不触发快速判断
Step 2: X 轴为分类数据，isContinuousX = false → bar

结果：推荐柱状图（在 Step 2 直接返回）
```

---

## 四、完整决策流程图

```
                    ┌─────────────────┐
                    │   输入数据源    │
                    └────────┬────────┘
                             │
               ┌─────────────▼─────────────┐
               │  Step 1: 数据点数量判断   │
               │  • 数据量 < 3 → bar       │
               │  • 点数 < 4 → bar         │
               │  • 总点数 > 80 → line     │
               └─────────────┬─────────────┘
                             │
               ┌─────────────▼─────────────┐
               │  Step 2: X轴语义判断      │
               │  • 日期类型？             │
               │  • 有序数值？             │
               │  • 非连续 → bar           │
               └─────────────┬─────────────┘
                             │
               ┌─────────────▼─────────────┐
               │  Step 3: 趋势投票分析     │
               │  • 线性回归计算 R²/slope  │
               │  • IQR 异常值过滤         │
               │  • 计算趋势投票比例       │
               └─────────────┬─────────────┘
                             │
               ┌─────────────▼─────────────┐
               │  Step 4: 综合决策         │
               │  • 动态阈值调整           │
               │  • 趋势比例 ≥ 阈值 → line │
               │  • 否则 → bar             │
               └─────────────┬─────────────┘
                             │
                    ┌────────▼────────┐
                    │  输出 bar/line  │
                    └─────────────────┘
```

---

## 五、算法优势与特点

### 5.1 技术优势

| 优势           | 说明                                     |
| -------------- | ---------------------------------------- |
| **数据驱动**   | 基于统计学方法，而非简单规则             |
| **异常值鲁棒** | IQR 方法自动过滤异常值，避免极端值干扰   |
| **多维度评估** | 综合考虑点数、X 轴语义、趋势强度、置信度 |
| **参数可调**   | 所有阈值集中管理，便于调优               |
| **边界保护**   | 完善的空值/异常数据处理                  |

### 5.2 设计亮点

1. **渐进式决策**：先做简单判断（点数），再做复杂分析（趋势），提高效率
2. **置信度机制**：根据数据质量动态调整判断严格程度
3. **投票机制**：多个 Y 轴系列共同决策，避免单一维度误判
4. **点数奖励**：兼顾"数据特征"和"视觉效果"两个维度

---

## 六、应用场景示例

| 场景                   | 推荐结果 | 决策路径                                 |
| ---------------------- | -------- | ---------------------------------------- |
| 月度销售额（12 个月）  | line     | Step2: 日期连续 → Step3: 趋势明显 → line |
| 产品分类销量对比       | bar      | Step2: X 轴为分类数据 → bar              |
| 100 个数据点的股票走势 | line     | Step1: 总点数 > 80 → line                |
| 5 个城市温度对比       | bar      | Step2: X 轴为分类数据 → bar              |
| 年度 KPI 完成率趋势    | line     | Step2: 有序数值 → Step3: 趋势明显 → line |

---

## 七、函数接口说明

### 主函数

```typescript
function autoSetSeriesType(
  dataSource: DataSourceItem[],
  xAxisField: string
): "bar" | "line";
```

| 参数       | 类型             | 说明           |
| ---------- | ---------------- | -------------- |
| dataSource | DataSourceItem[] | 数据源数组     |
| xAxisField | string           | X 轴字段名     |
| **返回值** | "bar" \| "line"  | 推荐的图表类型 |

### 内部辅助函数

| 函数名               | 功能                   |
| -------------------- | ---------------------- |
| `isDate()`           | 判断值是否为日期       |
| `isOrdinalNumeric()` | 判断数组是否为有序数值 |
| `calcLinearTrend()`  | 线性回归趋势分析       |
| `extractYSeries()`   | 提取所有 Y 轴数据系列  |

---

## 八、总结

`autoSetSeriesType` 算法通过 **四步渐进式决策**，实现了图表类型的智能推荐：

| 步骤   | 核心能力 | 技术手段                  |
| ------ | -------- | ------------------------- |
| Step 1 | 快速过滤 | 点数阈值判断              |
| Step 2 | 语义理解 | 日期/有序数值识别         |
| Step 3 | 趋势分析 | 线性回归 + IQR 异常值处理 |
| Step 4 | 智能决策 | 动态阈值 + 投票机制       |

**核心价值**：

1. **降低开发决策成本**：无需专业知识即可获得合理的图表推荐
2. **提升数据展示效果**：基于数据特征选择最适合的图表类型
3. **提高产品智能化程度**：体现"数据驱动"的产品设计理念

---

**文档版本**：v1.0  
**最后更新**：2026 年 1 月 16 日
