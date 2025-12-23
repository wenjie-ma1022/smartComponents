import numeral from 'numeral';

/**
 * down a file from url
 * @param {string} url url
 */
export function download(url = '') {
  const a = document.createElement('a');
  a.href = url;
  a.download = url.substr(url.lastIndexOf('/') + 1);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * 格式化数字
 * @param {string|number} v value
 * @param {string|function} f
 */
export function format(v, f) {
  if (typeof v === 'undefined' || v === null || v === '') {
    return '-';
  }
  // 大小限制 1e-6，此处为实际测试后 numeral 的限制
  if ((v > 0 && v < 1e-6) || (v < 0 && v > -1e-6)) v = 0;
  if (typeof f === 'function') {
    return f(v);
  } else if (typeof f === 'string') {
    return numeral(v).format(f);
  }
  return v;
}

/**
 * copy a object with bisic data.
 * @return target object
 */
export function cloneSimpleObject(obj) {
  let out = obj;
  if (typeof obj === 'object') {
    out = JSON.parse(JSON.stringify(obj));
  }
  return out;
}

/**
 * debounce
 * @param {*} fn
 * @param {*} ms
 */
export function debounce(fn, ms) {
  let timeout = null;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout((...args) => {
      fn.apply(this, args);
    }, ms);
  };
}

/**
 * 计算通用表单组件  TransportCenter  需要占多少格
 */
export function getFormProSpans(showProvince, showProvinceOnly, isAdmin, isProvince) {
  const isShowProvince = (isAdmin || isProvince) && showProvince;
  let count = 0;
  if (isShowProvince) count++;
  if (!showProvinceOnly) count++;
  return count;
}
