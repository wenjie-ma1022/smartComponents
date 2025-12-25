import { lazy } from "react";
import Layout from "./layouts/BasicLayout";
import { flatRouters, createMenu } from "@/utils/router";

const Home = lazy(() => import(/* webpackChunkName: "Home" */ "./pages/Home"));

const SmartLineChartDemo = lazy(
  () =>
    import(
      /* webpackChunkName: "SmartLineChartDemo" */ "./pages/SmartLineChartDemo"
    )
);

const SmartPieChartDemo = lazy(
  () =>
    import(
      /* webpackChunkName: "SmartPieChartDemo" */ "./pages/SmartPieChartDemo"
    )
);

// 模板首页
const home = {
  title: "首页",
  path: "/home",
  component: Home,
};

// 模板介绍
const item = {
  title: "模板介绍",
  component: Home,
  children: [
    {
      title: "SmartLineChart demo",
      path: "/smart-line-chart-demo",
      component: SmartLineChartDemo,
    },
    {
      title: "SmartPieChart demo",
      path: "/smart-pie-chart-demo",
      component: SmartPieChartDemo,
    },
  ],
};

export function getMenus() {
  return createMenu([home, item]);
}
export default [
  {
    path: "/",
    component: Layout,
    children: [...flatRouters(home), ...flatRouters(item)],
  },
];
