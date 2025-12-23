// 404错误页面

import React, { PureComponent } from 'react';

import './index.scss';

export default class Page404 extends PureComponent {
  render() {
    return (
      <div className="container-404">
        <div className="container-404-imgbox">
          <img
            src="https://assets.sto.cn/ued-projects/static-assets/0.0.6/state-not-found.png"
            alt="404 not found"
          />
        </div>
      </div>
    );
  }
}
