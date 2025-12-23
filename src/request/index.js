// 1.注入插件
import requestPlus from '@sto/request-plus';
import { Message } from '@alifd/next';
// 2.引入src/toffee/config.js文件
import requestFile from './appConfig.json';

// eslint-disable-next-line complexity
const onFulfill = (req) => {
  // 单点登录鉴权
  if (req.config.url.indexOf('/sso/login/callback') !== -1) {
    return req.data.data;
  }
  if (req?.data?.respCode !== undefined) {
    // 兼容无面单 接口数据
    return req?.data;
  }
  if (req?.status !== 200 || !req?.data?.success) {
    // req?.data?.errors存在时候，业务逻辑中自行处理报错信息
    Message.error(req?.data?.errorMsg || req?.errorMsg || '');
    if (req?.data?.errors && req?.data?.errors.length) {
      return req?.data?.errors ? req?.data?.errors[0] : null;
    }
  }
  return req?.data || req?.data?.data;
};

// 3.配置工具选项
const options = {
  requestFile,
  beforeRequest: (req) => {
    if (req.method === 'get') {
      if (req.data) {
        req.params = req.data;
      }
    }
    return req;
  },
  onFulfill: (req) => {
    return onFulfill(req);
  },
};
// 4.初始化工具，并导出

const _requestPlus = requestPlus(options);

const request = (params) => {
  if (/server=mock/.test(window.location.search)) {
    return _requestPlus({
      ...params,
      withCredentials: false,
    });
  }
  return _requestPlus({
    ...params,
  });
};

export default request;
