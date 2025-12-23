import React from 'react';

export default (props) => {
  return (
    <>
      <h1>child-Layout</h1>
      <div>{props.children}</div>
    </>
  );
};
