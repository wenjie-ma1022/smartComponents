import React from "react";
import { runApp } from "ice";
import { CnLoading } from "@sto/cn-ui";
// import AsgardAuth from '@sto/asgard-auth';
import ErrorBoundary from "@stofe/sui-patcher/es/error-boundary";
// import request from './request';
// import config from '@/config';
import "windi.css";
import "@sto/cn-ui/es/global";

// 注册 ECharts MarkPointComponent（sto-charts 未内置）
import * as echarts from "echarts/core";
import { MarkPointComponent } from "echarts/components";
// TODO: 后续让组件库支持
echarts.use([MarkPointComponent]);

const appConfig = {
  app: {
    // 可选，默认 ice-container，根节点 id
    rootId: "root",
    // 可选，默认 true，是否解析路由组件的查询参数
    parseSearchParams: true,
    ErrorBoundaryFallback: <ErrorBoundary />,
    mountNode: document.getElementById("root"),
    // getInitialData: async () => {
    //   try {
    //     const [, user] = await new AsgardAuth(request, {
    //       systemCode: config.systemCode,
    //     }).pcLogin(true);
    //     return {
    //       initialStates: {
    //         user: {
    //           ...user,
    //           complete: true,
    //         },
    //       },
    //     };
    //   } catch (error) {
    //     // 认证失败时返回默认用户状态，允许应用继续运行
    //     console.warn('Authentication failed, continuing with default user state:', error);
    //     return {
    //       initialStates: {
    //         user: {
    //           complete: true,
    //         },
    //       },
    //     };
    //   }
    // },
  },
  router: {
    type: "browser",
    fallback: <CnLoading fullScreen />,
  },
};
runApp(appConfig);
