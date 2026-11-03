/**
 * 入口：加载状态 → 初始化各组件 → 注册全局快捷键。
 */

import { createStore } from './state.js';
import { initClock } from './time.js';
import { initSearch } from './search.js';
import { initShortcuts } from './shortcuts.js';
import { initTodos } from './todos.js';
import { applyTheme, initSettings } from './settings.js';
import { initHitokoto } from './hitokoto.js';
import { $ } from './utils.js';

async function boot() {
  const store = await createStore();
  applyTheme(store.state.theme);

  const shortcuts = initShortcuts({ store });
  const settings = initSettings({
    store,
    onAddGroup: () => shortcuts.openGroupDialog(),
  });
  const search = initSearch({ store });

  const todos = initTodos({ store });
  initClock();
  initHitokoto({ store });

  // 全局禁用原生右键菜单（自定义菜单自行处理并阻止冒泡）
  document.addEventListener('contextmenu', (event) => event.preventDefault());

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const typing =
      target instanceof Element &&
      Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
    const dialogOpen = Boolean(document.querySelector('dialog[open]'));

    const isSearchShortcut =
      ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') ||
      (event.key === '/' && !typing && !settings.isOpen());

    if (isSearchShortcut && !dialogOpen) {
      event.preventDefault();
      if (settings.isOpen()) {
        settings.close();
        window.requestAnimationFrame(() => search.focus());
      } else {
        search.focus();
      }
      return;
    }

    if (event.key !== 'Escape') return;
    if (dialogOpen) return;

    if (todos.isOpen()) {
      event.preventDefault();
      todos.close();
      return;
    }

    if (settings.isOpen()) {
      event.preventDefault();
      settings.close();
    }
  });

  const persist = () => {
    store.flush();
  };

  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) persist();
  });
}

boot().catch((error) => {
  console.error('[Nexus] 初始化失败', error);
  const note = $('#storage-note');
  if (note) note.textContent = '初始化失败，请打开控制台查看详情';
});
