export interface PieItem {
  name: string;
  value: number;
  isOther?: boolean;
  emphasisType?: "key" | "outlier";
}
export interface SmartPieChartProps {
  dataSource: PieItem[];
  height?: number;
}
