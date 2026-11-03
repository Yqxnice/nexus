/**
 * 默认数据、状态校验与轻量 Store（订阅 + 防抖持久化）。
 */

import { hostOf, normalizeUrl, uid } from './utils.js';
import { isValidGroupIcon, DEFAULT_GROUP_ICON } from './icons.js';
import { loadState, saveState } from './storage.js';

export const WALLPAPERS = [
  { id: 'paper', name: '纸面' },
  { id: 'aurora', name: '极光' },
  { id: 'ocean', name: '深海' },
  { id: 'sunset', name: '日落' },
  { id: 'forest', name: '森林' },
  { id: 'grape', name: '紫夜' },
  { id: 'graphite', name: '石墨' },
];

export const SEARCH_ENGINES = [
  { id: 'baidu', name: '百度', searchUrl: 'https://www.baidu.com/s?wd=%s' },
  { id: 'bing', name: 'Bing', searchUrl: 'https://www.bing.com/search?q=%s' },
  { id: 'google', name: 'Google', searchUrl: 'https://www.google.com/search?q=%s' },
  { id: 'sogou', name: '搜狗', searchUrl: 'https://www.sogou.com/web?query=%s' },
  { id: 'duckduckgo', name: 'DuckDuckGo', searchUrl: 'https://duckduckgo.com/?q=%s' },
];

const THEMES = ['auto', 'light', 'dark'];
const OPEN_MODES = ['new', 'current'];
const MAX_TITLE_LENGTH = 40;
const MAX_TODO_LENGTH = 80;
const MAX_GROUP_NAME_LENGTH = 20;
const MAX_CUSTOM_WALLPAPER_LENGTH = 6_000_000; // base64 字符数上限（约 4.5MB 原始数据）

const WALLPAPER_IDS = new Set(WALLPAPERS.map((item) => item.id).concat('custom'));

export const DEFAULT_GROUP_ID = 'default';

const DEFAULT_GROUPS = [
  { id: DEFAULT_GROUP_ID, name: '常用', icon: 'star' },
  { id: 'grp-dev', name: '开发', icon: 'code' },
  { id: 'grp-design', name: '设计', icon: 'pen' },
  { id: 'grp-social', name: '社交', icon: 'message' },
  { id: 'grp-media', name: '影音', icon: 'play' },
  { id: 'grp-news', name: '资讯', icon: 'newspaper' },
];

const DEFAULT_SHORTCUTS = [
  // 常用
  { id: 'seed-baidu', title: '百度', url: 'https://www.baidu.com/', groupId: DEFAULT_GROUP_ID },
  { id: 'seed-bilibili', title: '哔哩哔哩', url: 'https://www.bilibili.com/', groupId: DEFAULT_GROUP_ID },
  { id: 'seed-zhihu', title: '知乎', url: 'https://www.zhihu.com/', groupId: DEFAULT_GROUP_ID },
  { id: 'seed-weibo', title: '微博', url: 'https://weibo.com/', groupId: DEFAULT_GROUP_ID },
  { id: 'seed-taobao', title: '淘宝', url: 'https://www.taobao.com/', groupId: DEFAULT_GROUP_ID },
  { id: 'seed-jd', title: '京东', url: 'https://www.jd.com/', groupId: DEFAULT_GROUP_ID },
  { id: 'seed-xhs', title: '小红书', url: 'https://www.xiaohongshu.com/', groupId: DEFAULT_GROUP_ID },
  { id: 'seed-netease-music', title: '网易云音乐', url: 'https://music.163.com/', groupId: DEFAULT_GROUP_ID },
  // 开发
  { id: 'seed-github', title: 'GitHub', url: 'https://github.com/', groupId: 'grp-dev' },
  { id: 'seed-juejin', title: '掘金', url: 'https://juejin.cn/', groupId: 'grp-dev' },
  { id: 'seed-so', title: 'Stack Overflow', url: 'https://stackoverflow.com/', groupId: 'grp-dev' },
  { id: 'seed-mdn', title: 'MDN', url: 'https://developer.mozilla.org/', groupId: 'grp-dev' },
  { id: 'seed-vercel', title: 'Vercel', url: 'https://vercel.com/', groupId: 'grp-dev' },
  { id: 'seed-npm', title: 'npm', url: 'https://www.npmjs.com/', groupId: 'grp-dev' },
  { id: 'seed-cloudflare', title: 'Cloudflare', url: 'https://www.cloudflare.com/', groupId: 'grp-dev' },
  // 设计
  { id: 'seed-figma', title: 'Figma', url: 'https://www.figma.com/', groupId: 'grp-design' },
  { id: 'seed-dribbble', title: 'Dribbble', url: 'https://dribbble.com/', groupId: 'grp-design' },
  { id: 'seed-behance', title: 'Behance', url: 'https://www.behance.net/', groupId: 'grp-design' },
  { id: 'seed-canva', title: 'Canva', url: 'https://www.canva.cn/', groupId: 'grp-design' },
  { id: 'seed-unsplash', title: 'Unsplash', url: 'https://unsplash.com/', groupId: 'grp-design' },
  { id: 'seed-zcool', title: '站酷', url: 'https://www.zcool.com.cn/', groupId: 'grp-design' },
  // 社交
  { id: 'seed-x', title: 'X', url: 'https://x.com/', groupId: 'grp-social' },
  { id: 'seed-reddit', title: 'Reddit', url: 'https://www.reddit.com/', groupId: 'grp-social' },
  { id: 'seed-instagram', title: 'Instagram', url: 'https://www.instagram.com/', groupId: 'grp-social' },
  { id: 'seed-telegram', title: 'Telegram', url: 'https://web.telegram.org/', groupId: 'grp-social' },
  { id: 'seed-discord', title: 'Discord', url: 'https://discord.com/', groupId: 'grp-social' },
  { id: 'seed-linkedin', title: 'LinkedIn', url: 'https://www.linkedin.com/', groupId: 'grp-social' },
  // 影音
  { id: 'seed-youtube', title: 'YouTube', url: 'https://www.youtube.com/', groupId: 'grp-media' },
  { id: 'seed-netflix', title: 'Netflix', url: 'https://www.netflix.com/', groupId: 'grp-media' },
  { id: 'seed-spotify', title: 'Spotify', url: 'https://open.spotify.com/', groupId: 'grp-media' },
  { id: 'seed-iqiyi', title: '爱奇艺', url: 'https://www.iqiyi.com/', groupId: 'grp-media' },
  { id: 'seed-douban', title: '豆瓣', url: 'https://www.douban.com/', groupId: 'grp-media' },
  { id: 'seed-twitch', title: 'Twitch', url: 'https://www.twitch.tv/', groupId: 'grp-media' },
  // 资讯
  { id: 'seed-sspai', title: '少数派', url: 'https://sspai.com/', groupId: 'grp-news' },
  { id: 'seed-hn', title: 'Hacker News', url: 'https://news.ycombinator.com/', groupId: 'grp-news' },
  { id: 'seed-36kr', title: '36氪', url: 'https://36kr.com/', groupId: 'grp-news' },
  { id: 'seed-huxiu', title: '虎嗅', url: 'https://www.huxiu.com/', groupId: 'grp-news' },
  { id: 'seed-ph', title: 'Product Hunt', url: 'https://www.producthunt.com/', groupId: 'grp-news' },
  { id: 'seed-verge', title: 'The Verge', url: 'https://www.theverge.com/', groupId: 'grp-news' },
];

const HITOKOTO_CAT_IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

/** 一言分类：只保留合法 id 并去重。 */
function normalizeHitokotoCats(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  for (const item of input) {
    if (typeof item === 'string' && HITOKOTO_CAT_IDS.includes(item)) seen.add(item);
  }
  return [...seen];
}

export function createDefaultState() {
  return {
    version: 1,
    theme: 'auto',
    wallpaper: 'paper',
    customWallpaper: null,
    iconStyle: 'favicon',
    hitokotoCats: [],
    openMode: 'new',
    searchEngine: 'baidu',
    groups: DEFAULT_GROUPS.map((group) => ({ ...group })),
    shortcuts: DEFAULT_SHORTCUTS.map((item) => ({ ...item })),
    todos: [],
  };
}

function normalizeGroups(input) {
  const seen = new Set();
  const result = [];

  if (Array.isArray(input)) {
    for (const item of input) {
      if (!item || typeof item !== 'object') continue;

      let id = typeof item.id === 'string' && item.id ? item.id : uid('grp');
      if (seen.has(id)) id = uid('grp');
      seen.add(id);

      const name = String(item.name ?? '').trim().slice(0, MAX_GROUP_NAME_LENGTH) || '未命名';
      const icon = isValidGroupIcon(item.icon) ? item.icon : DEFAULT_GROUP_ICON;
      result.push({ id, name, icon });
    }
  }

  // 默认分类必须存在且排在首位
  const defaultIndex = result.findIndex((group) => group.id === DEFAULT_GROUP_ID);
  if (defaultIndex < 0) {
    result.unshift({ id: DEFAULT_GROUP_ID, name: '常用', icon: 'star' });
  } else if (defaultIndex > 0) {
    const [defaultGroup] = result.splice(defaultIndex, 1);
    result.unshift(defaultGroup);
  }

  return result;
}

function normalizeShortcuts(input, validGroupIds) {
  if (!Array.isArray(input)) return createDefaultState().shortcuts;

  const seen = new Set();
  const result = [];

  for (const item of input) {
    if (!item || typeof item !== 'object') continue;

    const url = normalizeUrl(item.url);
    if (!url) continue;

    let id = typeof item.id === 'string' && item.id ? item.id : uid('sc');
    if (seen.has(id)) id = uid('sc');
    seen.add(id);

    const title = String(item.title ?? '').trim().slice(0, MAX_TITLE_LENGTH) || hostOf(url);
    const groupId =
      typeof item.groupId === 'string' && validGroupIds.has(item.groupId)
        ? item.groupId
        : DEFAULT_GROUP_ID;

    result.push({ id, title, url, groupId });
  }

  return result;
}

function normalizeTodos(input) {
  if (!Array.isArray(input)) return [];

  const seen = new Set();
  const result = [];

  for (const item of input) {
    if (!item || typeof item !== 'object') continue;

    const text = String(item.text ?? '').trim().slice(0, MAX_TODO_LENGTH);
    if (!text) continue;

    let id = typeof item.id === 'string' && item.id ? item.id : uid('todo');
    if (seen.has(id)) id = uid('todo');
    seen.add(id);

    result.push({ id, text, done: Boolean(item.done) });
  }

  return result;
}

/** 校验自定义壁纸：仅接受 data:image/ 开头且体积可控的 Data URL。 */
function normalizeCustomWallpaper(input) {
  if (typeof input !== 'string') return null;
  if (!input.startsWith('data:image/')) return null;
  if (input.length > MAX_CUSTOM_WALLPAPER_LENGTH) return null;
  return input;
}

/** 对读入的状态做容错校验，避免损坏数据导致页面异常。 */
export function normalizeState(input) {
  const defaults = createDefaultState();
  if (!input || typeof input !== 'object') return defaults;

  const groups = normalizeGroups(input.groups);
  const validGroupIds = new Set(groups.map((group) => group.id));

  const customWallpaper = normalizeCustomWallpaper(input.customWallpaper);

  return {
    version: 1,
    theme: THEMES.includes(input.theme) ? input.theme : defaults.theme,
    wallpaper:
      WALLPAPER_IDS.has(input.wallpaper) && (input.wallpaper !== 'custom' || customWallpaper)
        ? input.wallpaper
        : defaults.wallpaper,
    customWallpaper,
    openMode: OPEN_MODES.includes(input.openMode) ? input.openMode : defaults.openMode,
    iconStyle: input.iconStyle === 'letter' ? 'letter' : 'favicon',
    hitokotoCats: normalizeHitokotoCats(input.hitokotoCats),
    searchEngine: SEARCH_ENGINES.some((item) => item.id === input.searchEngine)
      ? input.searchEngine
      : defaults.searchEngine,
    groups,
    shortcuts: normalizeShortcuts(input.shortcuts, validGroupIds),
    todos: normalizeTodos(input.todos),
  };
}

export function engineById(id) {
  return SEARCH_ENGINES.find((item) => item.id === id) || SEARCH_ENGINES[0];
}

export class Store {
  #state;
  #listeners = new Set();
  #saveTimer = null;

  constructor(rawState) {
    this.#state = normalizeState(rawState);
  }

  get state() {
    return this.#state;
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }

  update(patch) {
    this.#state = normalizeState({ ...this.#state, ...patch });
    for (const listener of this.#listeners) {
      try {
        listener(this.#state);
      } catch (error) {
        console.error('[Nexus] 界面更新失败。', error);
      }
    }
    this.#scheduleSave();
  }

  #scheduleSave() {
    if (this.#saveTimer) clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => {
      this.#saveTimer = null;
      this.flush();
    }, 120);
  }

  flush() {
    if (this.#saveTimer) {
      clearTimeout(this.#saveTimer);
      this.#saveTimer = null;
    }
    return saveState(this.#state);
  }
}

export async function createStore() {
  const raw = await loadState();
  return new Store(raw);
}
