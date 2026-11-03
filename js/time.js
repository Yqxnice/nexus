/**
 * 数字时钟 + 中文日期。
 */

import { $ } from './utils.js';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const pad = (value) => String(value).padStart(2, '0');

export function initClock(root = document) {
  const hourMinuteElement = $('#clock-hm', root);
  const secondElement = $('#clock-sec', root);
  const dateElement = $('#clock-date', root);

  if (!hourMinuteElement || !secondElement || !dateElement) return;

  let timer = null;

  const tick = () => {
    const now = new Date();
    hourMinuteElement.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    secondElement.textContent = pad(now.getSeconds());
    dateElement.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${WEEKDAYS[now.getDay()]}`;
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  const start = () => {
    stop();
    tick();
    timer = window.setInterval(tick, 1000);
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  window.addEventListener('pagehide', stop);
  start();
}
