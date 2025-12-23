// 无权限页面
import React, { PureComponent } from 'react';

export default class NoAccess extends PureComponent {
  render() {
    return (
      <div className="container-404">
        <div className="container-404-imgbox">
          <img
            src="https://assets.sto.cn/ued-projects/static-assets/0.0.6/state-no-access.png"
            alt="无数据权限"
          />
        </div>
      </div>
    );
  }
}
