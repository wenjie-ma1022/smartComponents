import React from "react";
import SmartPieChart from "@/components/SmartPieChart";
import { mockData } from "./SmartPieChartDemo/const";

const SmartPieChartDemo: React.FC = () => {
  return <SmartPieChart dataSource={mockData} />;
};

export default SmartPieChartDemo;
