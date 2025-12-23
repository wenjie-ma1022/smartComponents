import { matchPath } from 'ice';
import { uuid } from '@sto/sui-utils';
import routes from '@/routes';
/**
 * @function flatRouters
 * @description 打平路由
 * @param router {Object} 需要打平的路由
 * @return {Array}
 * @author 张福金 2023/5/16
 */
export function flatRouters(router) {
  const routers = [];

  function loop(list) {
    list.forEach((item) => {
      const { children = [], childrenFlat = true, title, ...rest } = item;
      const hasChild = childrenFlat ? {} : { children };
      if (children.length && childrenFlat) {
        loop(children);
      } else {
        routers.push({
          ...rest,
          ...hasChild,
          keepAlive: false,
          pageConfig: {
            title,
          },
        });
      }
    });
  }

  loop(Array.isArray(router) ? router : [router]);

  return routers;
}

/**
 * @function mapRouteToPath
 * @description 处理路由到动态路由
 * @param pathname {String}
 * @return {String}
 * @author 张福金 2023/5/16
 */
export const mapRouteToPath = (pathname) => {
  const [{ children }] = routes;

  // 判断访问的是否是正确的路由
  const find = children.find((el) => el.path === pathname);
  if (!find) {
    return find;
  }

  // 先判断是否是动态路由，不同路由可能重用同一个导航
  const dynamic = children.filter((el) => el.path.includes(':'));
  const dynamicResult = dynamic.find((el) => {
    const { path } = el;
    return !!matchPath(pathname, {
      path,
    });
  });
  if (dynamicResult) {
    return dynamicResult.path;
  }

  // 静态路由
  return pathname;
};

export function createMenu(router) {
  const menus = [];

  function loop(list, menu) {
    list.forEach((item) => {
      const { path, children = [], childrenFlat = true, title } = item;
      const paths = path
        ? {
            key: path,
            path,
          }
        : {
            key: uuid(),
          };

      const menuConfig = {
        text: title,
        ...paths,
      };

      if (children.length && childrenFlat) {
        menuConfig.children = [];
        menu.push(menuConfig);

        loop(children, menuConfig.children);
      } else {
        menu.push(menuConfig);
      }
    });
  }

  loop(router, menus);

  return menus;
}
