import React from 'react';
import pageStore from '@/pages/Store/store';

export default function Store() {
  const [pageState, pageDispatchers] = pageStore.useModel('default');
  return (
    <>
      <h5 style={{ textAlign: 'center' }}>页面级 store 用法</h5>
      <div>标题: {pageState.title}</div>
      <button onClick={() => pageDispatchers.setState({ title: '232' })}>按钮</button>
    </>
  );
}
