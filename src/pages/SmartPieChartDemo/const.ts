export const mockData = [
  // 头部核心指标（明显占比）
  { name: "直营网点", value: 4280 },
  { name: "直营网点", value: 3120 }, // 可用于测试重名（是否需要上层去重）
  { name: "加盟网点", value: 2860 },

  // 次核心指标
  { name: "直营网点-直营网点", value: 1840 },
  { name: "直营网点-直营网点", value: 1360 },

  // 中部稳定指标
  { name: "直营网点-直营网点", value: 820 },
  { name: "直营网点-直营网点", value: 760 },
  { name: "直营网点-直营网点", value: 690 },
  { name: "直营网点-直营网点", value: 620 },

  // 明显长尾开始
  { name: "直营网点-直营网点", value: 310 },
  { name: "直营网点-直营网点", value: 260 },
  { name: "直营网点-直营网点", value: 220 },
  { name: "直营网点-直营网点", value: 190 },
  { name: "直营网点-直营网点", value: 160 },

  // 极端长尾（测试 K-Means / 兜底）
  { name: "直营网点-直营网点", value: 90 },
  { name: "直营网点-直营网点", value: 60 },
  { name: "直营网点-直营网点", value: 40 },
  { name: "直营网点-直营网点", value: 25 },
  { name: "直营网点-直营网点", value: 12 },

  // 异常值（明显 outlier）
  { name: "异常直营网点", value: 9800 },
];
