/**
 * 测试数据：用于测试 buildSmartLineChartConfig 方法的各种情况
 */

// ============= 单轴情况 =============

// 情况1：只有一个指标 → 单轴
export const mockSingleMetric = [
  { date: '2024-01-01', revenue: 100 },
  { date: '2024-01-02', revenue: 120 },
  { date: '2024-01-03', revenue: 95 },
];

// 情况2：多个指标都是比例数据(-1到1) → 单轴
export const mockRatioData = [
  { date: '2024-01-01', rate1: 0.8, rate2: 0.6, rate3: 0.9 },
  { date: '2024-01-02', rate1: 0.7, rate2: 0.8, rate3: 0.5 },
  { date: '2024-01-03', rate1: 0.9, rate2: 0.7, rate3: 0.8 },
];

// 情况3：多个绝对值指标，数值差距不大(<10倍) → 单轴
export const mockAbsoluteDataSmallGap = [
  { date: '2024-01-01', sales: 100, profit: 20, cost: 80 },
  { date: '2024-01-02', sales: 120, profit: 25, cost: 95 },
  { date: '2024-01-03', sales: 95, profit: 18, cost: 77 },
];

// ============= 双轴情况 =============

// 情况4：混合比例和绝对值数据 → 双轴
export const mockMixedData = [
  { date: '2024-01-01', rate: 20.85, revenue: 1000, profit: 150 },
  { date: '2024-01-02', rate: 50.92, revenue: 1200, profit: 180 },
  { date: '2024-01-03', rate: 30.78, revenue: 950, profit: 140 },
];

// 情况5：都是绝对值数据，但数值差距很大(>10倍) → 双轴
export const mockAbsoluteDataLargeGap = [
  { date: '2024-01-01', smallValue: 2, largeValue: 500, mediumValue: 50 },
  { date: '2024-01-02', smallValue: 3, largeValue: 600, mediumValue: 45 },
  { date: '2024-01-03', smallValue: 1.5, largeValue: 450, mediumValue: 55 },
];

export const mockComplexData = [
  {
    date: '2024-03-01',
    uv: 34695,
    pv: 42000,
    ctr: 0.11,
    cvr: 0.032,
    roi: 0.45,
  },
  {
    date: '2024-03-02',
    uv: 42300,
    pv: 53000,
    ctr: 0.13,
    cvr: 0.027,
    roi: 0.52,
  },
  {
    date: '2024-03-03',
    uv: 45472.5,
    pv: 61000,
    ctr: 0.15,
    cvr: 0.034,
    roi: 0.58,
  },
  {
    date: '2024-03-04',
    uv: 22050,
    pv: 30120,
    ctr: 0.084,
    cvr: 0.02,
    roi: 0.32,
  },
  {
    date: '2024-03-05',
    uv: 48375,
    pv: 71000,
    ctr: 0.17,
    cvr: 0.042,
    roi: 0.67,
  },

  {
    date: '2024-03-06',
    uv: 29812.5,
    pv: 35000,
    ctr: 0.1,
    cvr: 0.031,
    roi: 0.39,
  },
  {
    date: '2024-03-07',
    uv: 37440,
    pv: 49000,
    ctr: 0.14,
    cvr: 0.035,
    roi: 0.48,
  },
  {
    date: '2024-03-08',
    uv: 43920,
    pv: 65000,
    ctr: 0.16,
    cvr: 0.039,
    roi: 0.62,
  },
  {
    date: '2024-03-09',
    uv: 22275,
    pv: 30250,
    ctr: 0.082,
    cvr: 0.018,
    roi: 0.29,
  },
  {
    date: '2024-03-10',
    uv: 32850,
    pv: 43000,
    ctr: 0.12,
    cvr: 0.028,
    roi: 0.42,
  },

  {
    date: '2024-03-11',
    uv: 38700,
    pv: 52000,
    ctr: 0.14,
    cvr: 0.033,
    roi: 0.52,
  },
  {
    date: '2024-03-12',
    uv: 45900,
    pv: 69000,
    ctr: 0.17,
    cvr: 0.046,
    roi: 0.69,
  },
  {
    date: '2024-03-13',
    uv: 20475,
    pv: 28800,
    ctr: 0.079,
    cvr: 0.019,
    roi: 0.26,
  },
  {
    date: '2024-03-14',
    uv: 49050,
    pv: 74000,
    ctr: 0.19,
    cvr: 0.05,
    roi: 0.68,
  },
  {
    date: '2024-03-15',
    uv: 42525,
    pv: 61000,
    ctr: 0.16,
    cvr: 0.041,
    roi: 0.64,
  },

  {
    date: '2024-03-16',
    uv: 29025,
    pv: 35000,
    ctr: 0.11,
    cvr: 0.029,
    roi: 0.35,
  },
  {
    date: '2024-03-17',
    uv: 35550,
    pv: 46000,
    ctr: 0.13,
    cvr: 0.036,
    roi: 0.55,
  },
  {
    date: '2024-03-18',
    uv: 41400,
    pv: 57000,
    ctr: 0.15,
    cvr: 0.038,
    roi: 0.61,
  },
  {
    date: '2024-03-19',
    uv: 21825,
    pv: 30000,
    ctr: 0.09,
    cvr: 0.02,
    roi: 0.32,
  },
  {
    date: '2024-03-20',
    uv: 50625,
    pv: 77000,
    ctr: 0.2,
    cvr: 0.053,
    roi: 0.68,
  },

  {
    date: '2024-03-21',
    uv: 26550,
    pv: 33000,
    ctr: 0.1,
    cvr: 0.03,
    roi: 0.32,
  },
  {
    date: '2024-03-22',
    uv: 33750,
    pv: 47000,
    ctr: 0.14,
    cvr: 0.038,
    roi: 0.52,
  },
  {
    date: '2024-03-23',
    uv: 42975,
    pv: 64000,
    ctr: 0.16,
    cvr: 0.041,
    roi: 0.66,
  },
  {
    date: '2024-03-24',
    uv: 22950,
    pv: 29800,
    ctr: 0.089,
    cvr: 0.022,
    roi: 0.35,
  },
  {
    date: '2024-03-25',
    uv: 51525,
    pv: 82000,
    ctr: 0.21,
    cvr: 0.054,
    roi: 0.69,
  },

  {
    date: '2024-03-26',
    uv: 27225,
    pv: 34000,
    ctr: 0.11,
    cvr: 0.031,
    roi: 0.39,
  },
  {
    date: '2024-03-27',
    uv: 36675,
    pv: 48000,
    ctr: 0.13,
    cvr: 0.035,
    roi: 0.55,
  },
  {
    date: '2024-03-28',
    uv: 41850,
    pv: 56000,
    ctr: 0.15,
    cvr: 0.037,
    roi: 0.62,
  },
  {
    date: '2024-03-29',
    uv: 22050,
    pv: 30000,
    ctr: 0.09,
    cvr: 0.021,
    roi: 0.32,
  },
  {
    date: '2024-03-30',
    uv: 53550,
    pv: 89000,
    ctr: 0.22,
    cvr: 0.057,
    roi: 0.7,
  },
];

// 情况6：边界情况 - 数值差距正好是10倍 → 单轴（因为条件是 > 10）
export const mockBoundaryData = [
  { date: '2024-01-01', value1: 1, value2: 10 },
  { date: '2024-01-02', value1: 2, value2: 20 },
  { date: '2024-01-03', value1: 1.5, value2: 15 },
];

// 情况7：包含非数字数据 → 单轴
export const mockWithNonNumeric = [
  { date: '2024-01-01', numeric: 100, text: 'abc' },
  { date: '2024-01-02', numeric: 120, text: 'def' },
  { date: '2024-01-03', numeric: 95, text: 'ghi' },
];

// 情况8：空数据 → 返回空配置
export const mockEmptyData = [];

// ============= 导出所有测试数据 =============
export const allTestCases = {
  '单轴-单个指标': mockSingleMetric,
  '单轴-比例数据': mockRatioData,
  '单轴-绝对值小差距': mockAbsoluteDataSmallGap,
  '单轴-边界情况(10倍)': mockBoundaryData,
  '单轴-包含非数字': mockWithNonNumeric,
  '双轴-混合数据': mockMixedData,
  '双轴-绝对值大差距': mockAbsoluteDataLargeGap,
  '双轴-复杂数据': mockComplexData,
  空数据: mockEmptyData,
};
