/**
 * 站点区：左侧分类导轨（图标在上、名称在下）+ 右侧单分类图标网格。
 * 支持拖拽排序、右键菜单、悬停工具按钮与分类图标选择。
 */

import {
  $,
  $$,
  colorIndex,
  hostOf,
  initialOf,
  normalizeUrl,
  openUrl,
  uid,
} from './utils.js';
import { toast, confirmAction } from './ui.js';
import { DEFAULT_GROUP_ID } from './state.js';
import { GROUP_ICONS, DEFAULT_GROUP_ICON, iconSvg, appIconSvg } from './icons.js';

export function initShortcuts({ store, root = document }) {
  const rail = $('#category-rail', root);
  const railItems = $('#rail-items', root) || rail;
  const grid = $('#shortcut-grid', root);
  const addGroupButton = $('#btn-add-group', root);
  const dialog = $('#shortcut-dialog', root);
  const form = $('#shortcut-form', root);
  const dialogTitle = $('#shortcut-dialog-title', root);
  const titleInput = $('#shortcut-title', root);
  const urlInput = $('#shortcut-url', root);
  const errorElement = $('#shortcut-error', root);
  const saveButton = $('#shortcut-save', root);
  const deleteButton = $('#shortcut-delete', root);
  const cancelButton = $('#shortcut-cancel', root);

  const groupDialog = $('#group-dialog', root);
  const groupForm = $('#group-form', root);
  const groupDialogTitle = $('#group-dialog-title', root);
  const groupNameInput = $('#group-name', root);
  const groupIconPicker = $('#group-icon-picker', root);
  const groupCancelButton = $('#group-cancel', root);

  if (!rail || !grid || !dialog || !form || !titleInput || !urlInput) {
    return { openGroupDialog: () => {} };
  }

  let dialogMode = 'add';
  let activeId = null;
  let dialogGroupId = DEFAULT_GROUP_ID;
  let groupDialogMode = 'add';
  let groupActiveId = null;
  let selectedGroupIcon = DEFAULT_GROUP_ICON;
  let activeGroupId = DEFAULT_GROUP_ID;
  let latestState = store.state;
  let lastSignature = '';
  let dragging = false;
  let sortable = null;

  store.subscribe((state) => {
    latestState = state;
    const signature = JSON.stringify([state.groups, state.shortcuts, state.iconStyle]);
    if (signature === lastSignature) return;
    lastSignature = signature;

    // 拖拽进行中不重建 DOM（会打断 Sortable），onEnd 回写时会补渲染
    if (dragging) return;
    render(state);
  });

  /* ---------- 分类导轨 ---------- */

  function buildRailItem(group) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'rail-item';
    item.dataset.groupId = group.id;
    item.title = group.name;

    const icon = document.createElement('span');
    icon.className = 'rail-item__icon';
    icon.innerHTML = iconSvg(group.icon);

    const name = document.createElement('span');
    name.className = 'rail-item__name';
    name.textContent = group.name;

    item.append(icon, name);

    if (group.id === activeGroupId) {
      item.classList.add('is-active');
      item.setAttribute('aria-current', 'true');
    }

    item.addEventListener('click', () => {
      if (activeGroupId === group.id) return;
      activeGroupId = group.id;
      renderRail(latestState);
      renderCategory(latestState, { animate: true });
    });

    return item;
  }

  function buildRailAdd() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rail-item rail-item--add';
    button.title = '添加分类';
    button.setAttribute('aria-label', '添加分类');

    const icon = document.createElement('span');
    icon.className = 'rail-item__icon';
    icon.textContent = '+';

    const name = document.createElement('span');
    name.className = 'rail-item__name';
    name.textContent = '添加';

    button.append(icon, name);
    button.addEventListener('click', () => openGroupDialog('add'));
    return button;
  }

  function renderRail(state) {
    const fragment = document.createDocumentFragment();
    for (const group of state.groups) {
      fragment.append(buildRailItem(group));
    }
    fragment.append(buildRailAdd());
    railItems.replaceChildren(fragment);
  }

  // 导轨方向键导航
  rail.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = $$('.rail-item', rail);
    const index = items.indexOf(document.activeElement);
    if (index < 0) return;

    event.preventDefault();
    const next = event.key === 'ArrowDown' ? index + 1 : index - 1;
    items[(next + items.length) % items.length]?.focus();
  });

  /* ---------- 右侧分类视图 ---------- */

  /* ---------- Chrome 本地 favicon（_favicon/ 接口，零网络请求） ---------- */

  // 探针 URL：本地库必然未收录，返回默认地球图标，用于识别“无图标”站点
  const FAVICON_PROBE_URL = 'https://favicon-probe.invalid/';
  let missingIconData = null;

  function faviconUrl(pageUrl) {
    return `${chrome.runtime.getURL('_favicon/')}?pageUrl=${encodeURIComponent(pageUrl)}&size=32`;
  }

  function getMissingIconData() {
    if (missingIconData !== null) return Promise.resolve(missingIconData);
    return new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = probe.naturalWidth;
          canvas.height = probe.naturalHeight;
          canvas.getContext('2d').drawImage(probe, 0, 0);
          missingIconData = canvas.toDataURL();
        } catch {
          missingIconData = '';
        }
        resolve(missingIconData);
      };
      probe.onerror = () => {
        missingIconData = '';
        resolve('');
      };
      probe.src = faviconUrl(FAVICON_PROBE_URL);
    });
  }

  function originFaviconUrl(pageUrl) {
    try {
      return `${new URL(pageUrl).origin}/favicon.ico`;
    } catch {
      return '';
    }
  }

  // 图标多级回退：本地图标库 → 站点 /favicon.ico → 字母磁贴
  function buildFaviconImg(item, tile) {
    const hasFaviconApi = typeof chrome !== 'undefined' && Boolean(chrome.runtime?.getURL);
    const sources = [];
    if (hasFaviconApi) sources.push(faviconUrl(item.url));
    const direct = originFaviconUrl(item.url);
    if (direct) sources.push(direct);

    const img = document.createElement('img');
    img.className = 'shortcut__favicon';
    img.alt = '';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';

    let index = 0;

    const fallbackToLetter = () => {
      img.remove();
      tile.classList.remove('tile--favicon'); // 恢复彩色字母磁贴底色
      tile.textContent = initialOf(item.title);
    };

    const tryNextSource = () => {
      if (index >= sources.length) {
        fallbackToLetter();
        return;
      }
      img.src = sources[index++];
    };

    img.addEventListener('error', tryNextSource);
    img.addEventListener('load', () => {
      // 只有第一级（本地图标库）需要识别“未收录地球”；直连 favicon.ico 无需判断
      if (index !== 1 || !hasFaviconApi) return;
      getMissingIconData().then((missingData) => {
        if (!missingData) return;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext('2d').drawImage(img, 0, 0);
          if (canvas.toDataURL() === missingData) tryNextSource();
        } catch {
          /* 画布异常时保留当前图标 */
        }
      });
    });

    tile.classList.add('tile--favicon');
    tile.append(img);
    tryNextSource();
  }

  function buildCard(item, state) {
    const card = document.createElement('div');
    card.className = 'shortcut';
    card.dataset.id = item.id;
    card.dataset.groupId = item.groupId;
    card.setAttribute('role', 'listitem');
    card.draggable = true;

    const link = document.createElement('a');
    link.className = 'shortcut__main';
    link.href = item.url;
    link.rel = 'noopener noreferrer';
    link.draggable = false;
    link.title = `${item.title} · ${hostOf(item.url)}`;
    link.setAttribute('aria-label', `${item.title}，${hostOf(item.url)}`);

    const tile = document.createElement('span');
    tile.className = `shortcut__tile tile--${colorIndex(`${item.id}${item.title}`, 6)}`;

    if (state.iconStyle === 'favicon') {
      buildFaviconImg(item, tile);
    } else {
      // 字母磁贴
      tile.textContent = initialOf(item.title);
    }

    const label = document.createElement('span');
    label.className = 'shortcut__label';
    label.textContent = item.title;

    link.append(tile, label);
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openUrl(item.url, state.openMode);
    });

    card.append(link);
    return card;
  }

  function buildAddTile(groupId) {
    const addButton = document.createElement('div');
    addButton.className = 'shortcut shortcut--add';
    addButton.title = '添加站点';
    addButton.setAttribute('role', 'button');
    addButton.setAttribute('aria-label', '添加站点');
    addButton.tabIndex = 0;

    const icon = document.createElement('span');
    icon.className = 'shortcut__add-icon';
    icon.innerHTML = appIconSvg('addSquare');

    const label = document.createElement('span');
    label.className = 'shortcut__label';
    label.textContent = '添加';

    addButton.append(icon, label);
    addButton.addEventListener('click', () => openDialog('add', null, groupId));
    addButton.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDialog('add', null, groupId);
      }
    });
    return addButton;
  }

  function renderCategory(state, { animate = false } = {}) {
    const group = state.groups.find((item) => item.id === activeGroupId);
    if (!group) return;

    const items = state.shortcuts.filter((item) => item.groupId === group.id);
    grid.dataset.groupId = group.id;

    const fragment = document.createDocumentFragment();
    for (const item of items) {
      fragment.append(buildCard(item, state));
    }
    fragment.append(buildAddTile(group.id));

    if (sortable) {
      try {
        sortable.destroy();
      } catch {
        // 忽略重建时的销毁异常
      }
      sortable = null;
    }

    grid.replaceChildren(fragment);
    initSortable();

    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      grid.classList.remove('is-entering');
      // 强制 reflow，确保重复切换时动画重放
      void grid.offsetWidth;
      grid.classList.add('is-entering');
    }
  }

  function render(state) {
    if (!state.groups.some((group) => group.id === activeGroupId)) {
      activeGroupId = DEFAULT_GROUP_ID;
    }
    renderRail(state);
    renderCategory(state);
  }

  /* ---------- 站点弹窗 ---------- */

  cancelButton?.addEventListener('click', () => {
    dialog.close();
  });

  deleteButton?.addEventListener('click', async () => {
    const item = latestState.shortcuts.find((shortcut) => shortcut.id === activeId);
    if (!item) return;

    dialog.close();
    const deleted = await confirmDelete(item);
    if (!deleted) {
      openDialog('edit', item);
    }
  });

  form.addEventListener('input', () => {
    if (errorElement) errorElement.hidden = true;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const normalizedUrl = normalizeUrl(urlInput.value);
    if (!normalizedUrl) {
      if (errorElement) errorElement.hidden = false;
      urlInput.focus();
      return;
    }

    const title = titleInput.value.trim().slice(0, 40) || hostOf(normalizedUrl);
    const state = store.state;
    // 编辑时保持原分类；添加时归入当前所在分类
    const groupId = dialogMode === 'edit' && activeId
      ? state.shortcuts.find((item) => item.id === activeId)?.groupId || DEFAULT_GROUP_ID
      : dialogGroupId;

    if (dialogMode === 'edit' && activeId) {
      const nextShortcuts = state.shortcuts.map((item) =>
        item.id === activeId ? { ...item, title, url: normalizedUrl, groupId } : item
      );
      store.update({ shortcuts: nextShortcuts });
      toast('站点已更新');
    } else {
      const shortcut = { id: uid('sc'), title, url: normalizedUrl, groupId };
      store.update({ shortcuts: [...state.shortcuts, shortcut] });
      toast('站点已添加');
    }

    dialog.close();
  });

  function openDialog(mode, item = null, preselectGroup = null) {
    dialogMode = mode;
    activeId = item ? item.id : null;
    if (preselectGroup) dialogGroupId = preselectGroup;
    else if (!item) dialogGroupId = activeGroupId;

    if (dialogTitle) dialogTitle.textContent = mode === 'edit' ? '编辑站点' : '添加站点';
    if (saveButton) saveButton.textContent = mode === 'edit' ? '保存' : '添加';
    if (deleteButton) deleteButton.hidden = mode !== 'edit';
    if (errorElement) errorElement.hidden = true;

    titleInput.value = item ? item.title : '';
    urlInput.value = item ? item.url : '';

    if (dialog.open) dialog.close();
    dialog.showModal();

    window.requestAnimationFrame(() => {
      if (mode === 'edit') {
        titleInput.focus();
        titleInput.select();
      } else {
        urlInput.focus();
      }
    });
  }

  /* ---------- 分类弹窗（含图标选择） ---------- */

  function buildIconPicker(selected) {
    if (!groupIconPicker) return;

    const fragment = document.createDocumentFragment();
    for (const [id, icon] of Object.entries(GROUP_ICONS)) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'icon-option';
      option.dataset.icon = id;
      option.title = icon.name;
      option.setAttribute('aria-label', `图标：${icon.name}`);
      option.setAttribute('aria-pressed', String(id === selected));
      option.innerHTML = iconSvg(id);

      option.addEventListener('click', () => {
        selectedGroupIcon = id;
        $$('.icon-option', groupIconPicker).forEach((element) => {
          element.setAttribute('aria-pressed', String(element.dataset.icon === id));
        });
      });

      fragment.append(option);
    }

    groupIconPicker.replaceChildren(fragment);
  }

  addGroupButton?.addEventListener('click', () => openGroupDialog('add'));

  groupCancelButton?.addEventListener('click', () => groupDialog.close());

  groupForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = groupNameInput.value.trim().slice(0, 20);
    if (!name) {
      groupNameInput.focus();
      return;
    }

    if (groupDialogMode === 'edit' && groupActiveId) {
      store.update({
        groups: store.state.groups.map((group) =>
          group.id === groupActiveId ? { ...group, name, icon: selectedGroupIcon } : group
        ),
      });
      toast('分类已更新');
    } else {
      store.update({
        groups: [...store.state.groups, { id: uid('grp'), name, icon: selectedGroupIcon }],
      });
      toast('分类已添加');
    }

    groupDialog.close();
  });

  function openGroupDialog(mode, group = null) {
    if (!groupDialog) return;

    groupDialogMode = mode;
    groupActiveId = group ? group.id : null;
    selectedGroupIcon = group?.icon || DEFAULT_GROUP_ICON;

    if (groupDialogTitle) groupDialogTitle.textContent = mode === 'edit' ? '编辑分类' : '添加分类';
    const submitButton = groupForm?.querySelector('[type="submit"]');
    if (submitButton) submitButton.textContent = mode === 'edit' ? '保存' : '添加';

    groupNameInput.value = group ? group.name : '';
    buildIconPicker(selectedGroupIcon);

    if (groupDialog.open) groupDialog.close();
    groupDialog.showModal();

    window.requestAnimationFrame(() => {
      groupNameInput.focus();
      groupNameInput.select();
    });
  }

  async function removeGroup(group) {
    if (group.id === DEFAULT_GROUP_ID) {
      toast('默认分类不能删除');
      return;
    }

    const confirmed = await confirmAction({
      title: '删除分类',
      message: `确定删除分类“${group.name}”吗？其中的站点将移入“常用”。`,
      confirmText: '删除',
    });
    if (!confirmed) return;

    const state = store.state;
    store.update({
      groups: state.groups.filter((item) => item.id !== group.id),
      shortcuts: state.shortcuts.map((item) =>
        item.groupId === group.id ? { ...item, groupId: DEFAULT_GROUP_ID } : item
      ),
    });
    toast(`已删除“${group.name}”`);
  }

  /* ---------- 删除站点 ---------- */

  async function confirmDelete(item) {
    const confirmed = await confirmAction({
      title: '删除站点',
      message: `确定删除“${item.title}”吗？此操作无法撤销。`,
      confirmText: '删除',
    });

    if (!confirmed) return false;

    store.update({
      shortcuts: store.state.shortcuts.filter((shortcut) => shortcut.id !== item.id),
    });
    toast(`已删除“${item.title}”`);
    return true;
  }

  /* ---------- 拖拽排序（SortableJS，当前分类内） ---------- */

  function initSortable() {
    const Sortable = window.Sortable;
    if (typeof Sortable !== 'function') return;

    sortable = new Sortable(grid, {
      group: 'nexus-shortcuts',
      animation: 150,
      swapThreshold: 0.6,
      draggable: '.shortcut[data-id]',
      filter: '.shortcut--add', // “添加站点”块不参与拖拽
      preventOnFilter: false, // 过滤块仍可点击
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onStart: () => {
        dragging = true;
        hideMenu();
        document.body.classList.add('is-dragging');
      },
      onEnd: () => {
        dragging = false;
        document.body.classList.remove('is-dragging');
        // 延后一帧：避免在 Sortable 自身回调内销毁实例
        window.requestAnimationFrame(() => commitDomOrder());
      },
    });
  }

  /** 拖拽结束后，以 DOM 顺序为准回写 store。 */
  function commitDomOrder() {
    const groupId = grid.dataset.groupId || activeGroupId;
    const byId = new Map(store.state.shortcuts.map((item) => [item.id, { ...item }]));
    const next = [];

    $$('.shortcut[data-id]', grid).forEach((card) => {
      const item = byId.get(card.dataset.id);
      if (item) next.push({ ...item, groupId });
    });

    if (next.length !== store.state.shortcuts.length) return;

    const current = JSON.stringify(store.state.shortcuts);
    const updated = JSON.stringify(next);
    if (current === updated) return;

    store.update({ shortcuts: next });
  }

  /* ---------- 右键菜单（站点：打开/编辑/删除；分类：添加站点/编辑/删除） ---------- */

  const menu = $('#shortcut-menu', root);
  const groupMenu = $('#group-menu', root);
  let menuItemId = null;
  let menuGroupId = null;

  function hideMenu() {
    if (menu) {
      menu.hidden = true;
      menuItemId = null;
    }
    if (groupMenu) {
      groupMenu.hidden = true;
      menuGroupId = null;
    }
  }

  /** 在视口内钳制位置后显示菜单。 */
  function showMenuAt(element, x, y) {
    hideMenu();
    element.hidden = false;
    element.style.left = `${Math.max(8, Math.min(x, window.innerWidth - element.offsetWidth - 8))}px`;
    element.style.top = `${Math.max(8, Math.min(y, window.innerHeight - element.offsetHeight - 8))}px`;
  }

  if (menu || groupMenu) {
    document.addEventListener('click', (event) => {
      if (menu && !menu.hidden && !menu.contains(event.target)) hideMenu();
      if (groupMenu && !groupMenu.hidden && !groupMenu.contains(event.target)) hideMenu();
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && (!menu?.hidden || !groupMenu?.hidden)) {
        event.stopPropagation();
        hideMenu();
      }
    }, true);

    window.addEventListener('blur', hideMenu);
    window.addEventListener('resize', hideMenu);
    window.addEventListener('scroll', hideMenu, true);

    menu?.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button || !menuItemId) return;

      const item = store.state.shortcuts.find((shortcut) => shortcut.id === menuItemId);
      hideMenu();
      if (!item) return;

      if (button.dataset.action === 'open') {
        openUrl(item.url, store.state.openMode);
      } else if (button.dataset.action === 'edit') {
        openDialog('edit', item);
      } else if (button.dataset.action === 'remove') {
        await confirmDelete(item);
      }
    });

    groupMenu?.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button || !menuGroupId) return;

      const group = store.state.groups.find((item) => item.id === menuGroupId);
      hideMenu();
      if (!group) return;

      if (button.dataset.action === 'add') {
        openDialog('add', null, group.id);
      } else if (button.dataset.action === 'edit') {
        openGroupDialog('edit', group);
      } else if (button.dataset.action === 'remove') {
        await removeGroup(group);
      }
    });
  }

  grid.addEventListener('contextmenu', (event) => {
    const card = event.target.closest('.shortcut[data-id]');
    if (!card || !menu) return;

    event.preventDefault();
    showMenuAt(menu, event.clientX, event.clientY);
    menuItemId = card.dataset.id;
  });

  rail.addEventListener('contextmenu', (event) => {
    const item = event.target.closest('.rail-item[data-group-id]');
    if (!item || !groupMenu) return;

    event.preventDefault();

    showMenuAt(groupMenu, event.clientX, event.clientY);
    menuGroupId = item.dataset.groupId;
    // 默认分类不可删除，隐藏对应菜单项
    const removeButton = $('button[data-action="remove"]', groupMenu);
    if (removeButton) removeButton.hidden = menuGroupId === DEFAULT_GROUP_ID;
  });

  return { openGroupDialog: () => openGroupDialog('add') };
}
