/**
 * 通用工具：DOM 查询、URL 处理、唯一 ID、打开链接。
 */

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function uid(prefix = 'item') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 规范化用户输入的网址，只允许 http / https。
 * 未写协议时自动补 https://。
 */
export function normalizeUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw);
  const candidate = hasScheme ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

/** 粗略判断输入更像网址还是搜索词，用于搜索框直达。 */
export function isProbablyUrl(value) {
  const text = String(value ?? '').trim();
  if (!text || /\s/.test(text)) return false;
  if (/^https?:\/\//i.test(text)) return true;
  return /^(localhost|[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z][a-z0-9-]*)(:\d+)?(\/.*)?$/i.test(text);
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

export function initialOf(title) {
  const chars = Array.from(String(title ?? '').trim());
  return chars[0] ? chars[0].toUpperCase() : '?';
}

/** 根据字符串稳定映射到一个配色序号。 */
export function colorIndex(key, count = 6) {
  let hash = 0;
  for (const char of String(key)) {
    hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  }
  return hash % count;
}

export function openUrl(url, mode = 'new') {
  if (mode === 'current') {
    window.location.assign(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
