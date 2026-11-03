/**
 * 分类图标：线性 SVG（24×24，stroke 继承 currentColor）。
 * 仅被 state.js（校验）与 shortcuts.js（渲染）引用，无其他依赖。
 */

export const GROUP_ICONS = {
  star: {
    name: '星标',
    paths: '<path d="M12 3.2l2.62 5.4 5.95.86-4.3 4.2 1.02 5.93L12 16.8l-5.29 2.79 1.02-5.93-4.3-4.2 5.95-.86z"/>',
  },
  grid: {
    name: '宫格',
    paths: '<rect x="4" y="4" width="6.6" height="6.6" rx="1.6"/><rect x="13.4" y="4" width="6.6" height="6.6" rx="1.6"/><rect x="4" y="13.4" width="6.6" height="6.6" rx="1.6"/><rect x="13.4" y="13.4" width="6.6" height="6.6" rx="1.6"/>',
  },
  compass: {
    name: '指南针',
    paths: '<circle cx="12" cy="12" r="8.8"/><path d="M15.6 8.4l-1.9 5.3-5.3 1.9 1.9-5.3z"/>',
  },
  code: {
    name: '代码',
    paths: '<path d="M9 8.2L4.8 12 9 15.8"/><path d="M15 8.2L19.2 12 15 15.8"/>',
  },
  pen: {
    name: '画笔',
    paths: '<path d="M13.2 5.4l5.4 5.4L8.4 21H3v-5.4z"/><path d="M11.2 7.4l5.4 5.4"/>',
  },
  message: {
    name: '对话',
    paths: '<path d="M21 14.6a2 2 0 0 1-2 2H7.6L3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  },
  play: {
    name: '播放',
    paths: '<circle cx="12" cy="12" r="8.8"/><path d="M10.2 9v6l5-3z"/>',
  },
  newspaper: {
    name: '资讯',
    paths: '<rect x="4" y="4" width="16" height="16" rx="2.2"/><path d="M8 8.4h8M8 12h8M8 15.6h4.6"/>',
  },
  briefcase: {
    name: '工作',
    paths: '<rect x="3.4" y="7.6" width="17.2" height="12" rx="2"/><path d="M9.2 7.6V6a2 2 0 0 1 2-2h1.6a2 2 0 0 1 2 2v1.6"/><path d="M3.4 12.6h17.2"/>',
  },
  book: {
    name: '书本',
    paths: '<path d="M4.4 19.2A2.4 2.4 0 0 1 6.8 16.8H19.6"/><path d="M6.8 2.8H19.6v18.4H6.8a2.4 2.4 0 0 1-2.4-2.4V5.2a2.4 2.4 0 0 1 2.4-2.4z"/>',
  },
  bag: {
    name: '购物袋',
    paths: '<path d="M6.2 8.2h11.6l1 11.2a1.8 1.8 0 0 1-1.8 2H7a1.8 1.8 0 0 1-1.8-2z"/><path d="M9.2 8.2V6.4a2.8 2.8 0 0 1 5.6 0v1.8"/>',
  },
  heart: {
    name: '喜欢',
    paths: '<path d="M12 20.2s-7.2-4.4-9-8.8a4.7 4.7 0 0 1 9-2.2 4.7 4.7 0 0 1 9 2.2c-1.8 4.4-9 8.8-9 8.8z"/>',
  },
};

export const DEFAULT_GROUP_ICON = 'grid';

/** 应用级图标（不进入分类图标选择器）：待办 / 主题三态 / 设置 */
export const APP_ICONS = {
  todos: {
    paths: '<rect x="4" y="4.4" width="15.2" height="15.2" rx="3.2"/><path d="M8.6 12.2l2.4 2.4 4.6-4.9"/>',
  },
  sun: {
    paths: '<circle cx="12" cy="12" r="4.1"/><path d="M12 3.2v1.9M12 18.9v1.9M3.2 12h1.9M18.9 12h1.9M5.8 5.8l1.3 1.3M16.9 16.9l1.3 1.3M18.2 5.8l-1.3 1.3M7.1 16.9l-1.3 1.3"/>',
  },
  moon: {
    paths: '<path d="M20 13.8A8.4 8.4 0 0 1 10.2 4 8.4 8.4 0 1 0 20 13.8z"/>',
  },
  auto: {
    paths: '<circle cx="12" cy="12" r="8.8"/><path d="M12 3.2a8.8 8.8 0 0 1 0 17.6z" fill="currentColor" stroke="none"/>',
  },
  settings: {
    paths: '<circle cx="12" cy="12" r="3.1"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/>',
  },
  addSquare: {
    viewBox: '0 0 612 612',
    filled: true,
    paths: '<path d="M535.5 0h-459C34.253 0 0 34.253 0 76.5v459C0 577.747 34.253 612 76.5 612h459c42.247 0 76.5-34.253 76.5-76.5v-459C612 34.253 577.747 0 535.5 0zM420.75 325.125h-95.625v95.625c0 10.557-8.568 19.125-19.125 19.125-10.557 0-19.125-8.568-19.125-19.125v-95.625H191.25c-10.557 0-19.125-8.568-19.125-19.125 0-10.557 8.568-19.125 19.125-19.125h95.625V191.25c0-10.557 8.568-19.125 19.125-19.125 10.557 0 19.125 8.568 19.125 19.125v95.625h95.625c10.557 0 19.125 8.568 19.125 19.125 0 10.557-8.568 19.125-19.125 19.125z"/>',
  },
};

/** 判断图标 id 是否合法。 */
export function isValidGroupIcon(id) {
  return typeof id === 'string' && Boolean(GROUP_ICONS[id]);
}

/** 生成内联 SVG 字符串；非法 id 回退为宫格。 */
export function iconSvg(id) {
  const icon = GROUP_ICONS[id] || GROUP_ICONS[DEFAULT_GROUP_ICON];
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon.paths}</svg>`;
}

/** 生成应用级图标 SVG；非法 id 返回空串。 */
export function appIconSvg(id) {
  const icon = APP_ICONS[id];
  if (!icon) return '';
  const viewBox = icon.viewBox || '0 0 24 24';
  const paint = icon.filled
    ? 'fill="currentColor" stroke="none"'
    : 'fill="none" stroke="currentColor" stroke-width="1.7"';
  return `<svg viewBox="${viewBox}" ${paint} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon.paths}</svg>`;
}
