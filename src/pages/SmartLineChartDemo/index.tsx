import React, { useMemo, useState } from "react";
import { CnPage, CnCheckboxGroup } from "@sto/cn-ui";
import { mockComplexData } from "./const";
import SmartLineChart from "@/components/SmartLineChart";

const SmartLineChartMockDataDemo: React.FC = () => {
  const [selectedFields, setSelectedFields] = useState(["uv", "pv"]);

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
    <CnPage title="SmartLineChart Mock Data Demo" hasGutter>
      <div style={{ marginBottom: 24 }}>
        <h3>智能双轴图表演示</h3>
        <p>使用完整的业务数据集展示SmartLineChart的智能双轴功能</p>
        <p>
          数据包含：用户访问量(UV)、页面浏览量(PV)、点击率(CTR)、转化率(CVR)、投资回报率(ROI)
        </p>
        <p>系统会自动判断哪些指标适合左轴，哪些适合右轴</p>
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

      <SmartLineChart
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
      />

      <div style={{ marginTop: 32, marginBottom: 16 }}>
        <h4>配置说明：</h4>
        <ul>
          <li>
            <strong>X轴：</strong>日期字段，格式化为MM-DD显示
          </li>
          <li>
            <strong>左Y轴：</strong>绝对数值（UV、PV），使用整数格式
          </li>
          <li>
            <strong>右Y轴：</strong>比例数值（CTR、CVR、ROI），使用百分比格式
          </li>
          <li>
            <strong>自动类型判断：</strong>
            开启，根据数据特征自动选择柱状图或折线图
          </li>
          <li>
            <strong>智能双轴：</strong>系统自动判断是否需要双轴，以及数据分配
          </li>
        </ul>
      </div>
    </CnPage>
  );
};

export default SmartLineChartMockDataDemo;
