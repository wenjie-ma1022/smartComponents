import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { history } from 'ice';
import { isInIcestark } from '@ice/stark-app';
import { CnShell, CnIcon, Menu, CnTooltip } from '@sto/cn-ui';
import { getMenus } from '@/routes';
import store from '@/store';

const isInIceStark = isInIcestark();
const BasicLayout = ({ children, location }) => {
  const [activeKey, setActiveKey] = useState(location.pathname);

  const historyListener = (data) => {
    const { pathname } = data;
    setActiveKey(pathname);
  };

  const onItemClick = (data) => {
    const { path } = data;
    history.push(path);
  };

  useEffect(() => {
    if (!isInIceStark) {
      history.listen(historyListener);
    }
  }, []);

  if (isInIceStark) {
    return (
      <>
        <div id="toffee_root" />
        {children}
      </>
    );
  }
  return (
    <CnShell
      headerProps={{
        logoSrc:
          'https://imgcdn.sto.cn/4F246F19-5731-42-108x36-%E6%98%86%E4%BB%91-%E6%96%B0logo.svg',
        user: {
          staff_id: '102912',
          displayname: 'admin',
          img: 'https://imgcdn.sto.cn/D1040D64-9A68-49-45x42-%E7%9B%AE%E6%A0%87%E5%B0%8F%E6%97%B6%E4%BA%BA%E6%95%88%403x.png',
        },
        userSlot: (
          <Menu>
            <Menu.Item>退出登录</Menu.Item>
          </Menu>
        ),
      }}
      sideBarProps={{
        hideMenuItemIcon: true,
        selectedMenuKey: activeKey,
        onSelectMenuItem: onItemClick,
        menu: getMenus(),
      }}
    >
      {children}
    </CnShell>
  );
};
BasicLayout.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }),
};

export default BasicLayout;
