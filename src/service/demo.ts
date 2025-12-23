import request from '@/request/index.js';
import SYSTEM_CODE from '@/constants/server';

const { ROAD } = SYSTEM_CODE;

// 根据用户名称或者用户编码模糊查询全网用户信息

export const queryUsers = async (params) => {
  return request({
    url: '/user/queryAllUsersForPage',
    server: ROAD,
    method: 'post',
    data: { ...params },
  });
};
