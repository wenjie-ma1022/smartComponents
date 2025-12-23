export default {
  state: {
    // --------  用户信息相关 start --------
    userId: null,
    nickName: null,
    categoryCode: null,
    companyCode: null,
    companyName: null,
    // 对应角色对应的组织code
    organizationCode: null,
    organizationName: null,
    parentName: null,
    parentCode: null,
    // 用户角色 总部|省区|转运中心
    userType: null,
    isAdmin: null,
    isCenter: null,
    isProvince: null,
    isSite: null,
    // --------  用户信息相关 end --------
    // --------  权限/路由相关 start --------
    // 路由权限
    routerList: [],
    // 按钮权限
    menuList: [],
    // --------  权限相关 end --------
    // --------  导航相关 start --------
    // 导航树
    navTree: [],
    complete: false,
    // -------- 导航相关 end --------
    // 是否是鲁班嵌入系统，其他页面不需要使用这个参数
    isEmbed: false,
    // 消息中心显隐状态
    messageVisible: false,
  },

  // 定义改变该模型状态的纯函数
  reducers: {
    update(prevState, payload) {
      return {
        ...prevState,
        ...payload,
      };
    },
  },
};
