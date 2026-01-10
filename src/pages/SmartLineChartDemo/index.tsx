import React, { useMemo, useState } from "react";
import { CnPage, CnCheckboxGroup } from "@sto/cn-ui";
import { mockComplexData } from "./const";
import SmartLineChart from "@/components/SmartLineChart";

const SmartLineChartMockDataDemo: React.FC = () => {
  const [selectedFields, setSelectedFields] = useState(["uv"]);

  const dataSource = useMemo(() => {
    const newDataSource = mockComplexData.map((item) => {
      const newItem = {};
      selectedFields.forEach((field) => {
        newItem[field] = item[field];
      });
      return {
        date: item.date,
        ...newItem,
      };
    });
    return newDataSource;
  }, [selectedFields]);

  return (
    <CnPage hasGutter>
      <div style={{ marginBottom: 24 }}>
        <h3>SmartLineChart Mock Data Demo</h3>
        <p>
          数据包含：用户访问量(UV)、页面浏览量(PV)、点击率(CTR)、转化率(CVR)、投资回报率(ROI)
        </p>
      </div>
      <CnCheckboxGroup
        onChange={(value) => {
          setSelectedFields(value ?? []);
        }}
        value={selectedFields}
        dataSource={[
          { label: "uv", value: "uv" },
          { label: "pv", value: "pv" },
          { label: "ctr", value: "ctr" },
          { label: "cvr", value: "cvr" },
          { label: "roi", value: "roi" },
        ]}
        style={{ width: 400 }}
      />
      {/* 最小配置示例 */}
      <SmartLineChart dataSource={dataSource} xAxisField="date" height={500} />
      {/* 完整配置示例 */}
      {/* <SmartLineChart
        dataSource={dataSource}
        xAxisField="date"
        height={500}
        hideCheckbox
        tooltipTheme="dark"
        showLabelValue={false}
        xAxisConfig={{
          name: "日期",
          format: "date:MM-DD",
        }}
        yAxisConfig={{
          leftConfig: {
            name: "访问量/浏览量",
            type: "value",
            format: "number-w:0",
          },
          rightConfig: {
            name: "转化率/回报率(%)",
            type: "value",
            retain: 2,
            format: "percent:2",
          },
        }}
        seriesNameMap={{
          uv: "用户访问量",
          pv: "页面浏览量",
          ctr: "点击率",
          cvr: "转化率",
          roi: "投资回报率",
        }}
      /> */}
    </CnPage>
  );
};

export default SmartLineChartMockDataDemo;
