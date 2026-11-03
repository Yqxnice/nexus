/**
 * 设置抽屉：主题、壁纸、搜索引擎、打开方式、编辑模式入口、重置。
 */

import { SEARCH_ENGINES, WALLPAPERS, createDefaultState } from './state.js';
import { storageLabel } from './storage.js';
import { appIconSvg } from './icons.js';
import { HITOKOTO_CATS } from './hitokoto.js';
import { $, $$ } from './utils.js';
import { toast, confirmAction } from './ui.js';

const THEME_LABELS = {
  auto: '跟随系统',
  light: '浅色',
  dark: '深色',
};

const THEME_ICONS = {
  auto: 'auto',
  light: 'sun',
  dark: 'moon',
};

const THEME_ORDER = ['auto', 'light', 'dark'];
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function applyTheme(theme) {
  const resolved = theme === 'auto' ? (darkQuery.matches ? 'dark' : 'light') : theme;
  document.documentElement.dataset.theme = resolved;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute('content', resolved === 'dark' ? '#0b1020' : '#f4f3ee');
  }
}

function fillEngineOptions(select, selected) {
  const fragment = document.createDocumentFragment();

  for (const engine of SEARCH_ENGINES) {
    const option = document.createElement('option');
    option.value = engine.id;
    option.textContent = engine.name;
    fragment.append(option);
  }

  select.replaceChildren(fragment);
  select.value = selected;
}

export function initSettings({ store, onAddGroup }) {
  const drawer = $('#settings-drawer');
  const scrim = $('#scrim');
  const app = $('#app');
  const closeButton = $('#btn-close-settings');
  const themeButton = $('#btn-theme');
  const wallpaperButton = $('#btn-wallpaper');
  const settingsButton = $('#btn-settings');
  const themeSegmented = $('#theme-segmented');
  const openModeSegmented = $('#open-mode-segmented');
  const iconStyleSegmented = $('#icon-style-segmented');
  const wallpaperPicker = $('#wallpaper-picker');
  const settingsEngine = $('#settings-engine');
  const hitokotoCats = $('#hitokoto-cats');
  const addGroupButton = $('#settings-add-group');
  const resetButton = $('#btn-reset');
  const storageText = $('#settings-storage');
  const footerStorage = $('#storage-note');

  if (!drawer || !scrim) {
    return { isOpen: () => false, open: () => {}, close: () => {} };
  }

  const themeButtons = themeSegmented ? $$('button', themeSegmented) : [];
  const openModeButtons = openModeSegmented ? $$('button', openModeSegmented) : [];
  const iconStyleButtons = iconStyleSegmented ? $$('button', iconStyleSegmented) : [];

  let isOpen = false;
  let lastFocused = null;
  let lastRenderKey = '';

  drawer.inert = true;
  if (settingsEngine) fillEngineOptions(settingsEngine, store.state.searchEngine);
  settingsButton && (settingsButton.innerHTML = appIconSvg('settings'));

  buildWallpaperPicker();
  buildHitokotoChips();
  updateStorageLabels();
  store.subscribe(render);

  darkQuery.addEventListener('change', () => {
    if (store.state.theme === 'auto') applyTheme('auto');
  });

  themeButton?.addEventListener('click', () => {
    const nextIndex = (THEME_ORDER.indexOf(store.state.theme) + 1) % THEME_ORDER.length;
    const nextTheme = THEME_ORDER[nextIndex];
    store.update({ theme: nextTheme });
    toast(`主题：${THEME_LABELS[nextTheme]}`);
  });

  wallpaperButton?.addEventListener('click', () => openDrawer('settings-appearance'));
  settingsButton?.addEventListener('click', () => openDrawer());
  closeButton?.addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);

  for (const button of themeButtons) {
    button.addEventListener('click', () => {
      store.update({ theme: button.dataset.themeValue });
    });
  }

  for (const button of openModeButtons) {
    button.addEventListener('click', () => {
      store.update({ openMode: button.dataset.openMode });
    });
  }

  for (const button of iconStyleButtons) {
    button.addEventListener('click', () => {
      store.update({ iconStyle: button.dataset.iconStyle });
    });
  }

  settingsEngine?.addEventListener('change', () => {
    store.update({ searchEngine: settingsEngine.value });
  });

  addGroupButton?.addEventListener('click', () => {
    closeDrawer();
    onAddGroup?.();
  });

  resetButton?.addEventListener('click', async () => {
    const confirmed = await confirmAction({
      title: '重置全部数据',
      message: '站点、待办、外观与搜索设置都会恢复为默认值，此操作无法撤销。',
      confirmText: '重置',
    });

    if (!confirmed) return;

    store.update(createDefaultState());
    toast('已恢复默认数据');
  });

  drawer.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;

    const focusable = $$(
      'button:not(:disabled), select:not(:disabled), input:not(:disabled), [tabindex="0"]',
      drawer
    ).filter((element) => element.getClientRects().length > 0);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  function buildWallpaperPicker() {
    if (!wallpaperPicker) return;

    const fragment = document.createDocumentFragment();

    for (const wallpaper of WALLPAPERS) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'wp-option';
      option.dataset.wallpaper = wallpaper.id;
      option.title = `使用壁纸：${wallpaper.name}`;
      option.setAttribute('aria-pressed', 'false');

      const swatch = document.createElement('span');
      swatch.className = 'wp-swatch';
      swatch.dataset.wallpaper = wallpaper.id;

      const name = document.createElement('span');
      name.className = 'wp-name';
      name.textContent = wallpaper.name;

      option.append(swatch, name);
      option.addEventListener('click', () => {
        store.update({ wallpaper: wallpaper.id });
        toast(`壁纸：${wallpaper.name}`);
      });

      fragment.append(option);
    }

    // 自定义图片卡片：点击选图，有图后显示缩略图与移除按钮
    const customOption = document.createElement('button');
    customOption.type = 'button';
    customOption.className = 'wp-option wp-option--custom';
    customOption.dataset.wallpaper = 'custom';
    customOption.title = '使用本地图片壁纸';
    customOption.setAttribute('aria-pressed', 'false');

    const customSwatch = document.createElement('span');
    customSwatch.className = 'wp-swatch wp-swatch--custom';

    const customName = document.createElement('span');
    customName.className = 'wp-name';
    customName.textContent = '本地图片';

    const removeButton = document.createElement('span');
    removeButton.className = 'wp-option__remove';
    removeButton.title = '移除自定义壁纸';
    removeButton.setAttribute('role', 'button');
    removeButton.setAttribute('aria-label', '移除自定义壁纸');
    removeButton.textContent = '×';
    removeButton.hidden = true;
    removeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      store.update({ customWallpaper: null, wallpaper: 'aurora' });
      toast('已移除自定义壁纸');
    });

    customOption.append(customSwatch, customName, removeButton);
    customOption.addEventListener('click', () => {
      if (store.state.customWallpaper) {
        store.update({ wallpaper: 'custom' });
        toast('壁纸：本地图片');
        return;
      }
      fileInput.click();
    });

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.hidden = true;
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      void applyCustomImage(file);
    });

    fragment.append(customOption, fileInput);
    wallpaperPicker.replaceChildren(fragment);
  }

  async function applyCustomImage(file) {
    if (!file.type.startsWith('image/')) {
      toast('请选择图片文件');
      return;
    }

    try {
      const dataUrl = await compressImage(file);
      store.update({ customWallpaper: dataUrl, wallpaper: 'custom' });
      toast('壁纸：本地图片');
    } catch (error) {
      console.error('[Nexus] 壁纸图片处理失败。', error);
      toast('图片处理失败，请换一张试试');
    }
  }

  /** 压缩为最长边 2560 的 JPEG Data URL，控制在存储限额内。 */
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('读取图片失败'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('图片解析失败'));
        image.onload = () => {
          try {
            const maxEdge = 2560;
            const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));

            const context = canvas.getContext('2d');
            if (!context) {
              reject(new Error('无法创建画布'));
              return;
            }
            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            let output = canvas.toDataURL('image/jpeg', 0.85);
            if (output.length > 6_000_000) {
              output = canvas.toDataURL('image/jpeg', 0.7);
            }
            if (output.length > 6_000_000) {
              reject(new Error('图片过大，请选择更小的图片'));
              return;
            }
            resolve(output);
          } catch (error) {
            reject(error);
          }
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  function buildHitokotoChips() {
    if (!hitokotoCats) return;

    const fragment = document.createDocumentFragment();
    for (const cat of HITOKOTO_CATS) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.dataset.cat = cat.id;
      chip.setAttribute('aria-pressed', 'false');
      chip.textContent = cat.label;
      chip.addEventListener('click', () => {
        const current = store.state.hitokotoCats || [];
        const next = current.includes(cat.id)
          ? current.filter((id) => id !== cat.id)
          : [...current, cat.id].sort();
        store.update({ hitokotoCats: next });
      });
      fragment.append(chip);
    }
    hitokotoCats.replaceChildren(fragment);
  }

  function updateStorageLabels() {
    const label = storageLabel();
    if (storageText) storageText.textContent = `存储位置：${label}`;
    if (footerStorage) footerStorage.textContent = `数据存储：${label}`;
  }

  function render(state) {
    // 设置抽屉只关心这几项；无关更新（如待办、宫格）直接跳过，避免卡顿
    const key = `${state.theme}|${state.wallpaper}|${state.searchEngine}|${state.openMode}|${state.iconStyle}|${(state.hitokotoCats || []).join(',')}|${state.customWallpaper ? 'custom' : 'plain'}`;
    if (key === lastRenderKey) return;
    lastRenderKey = key;

    applyTheme(state.theme);

    if (themeButton) {
      themeButton.innerHTML = appIconSvg(THEME_ICONS[state.theme] || 'auto');
      themeButton.title = `当前主题：${THEME_LABELS[state.theme]}，点击切换`;
    }

    for (const button of themeButtons) {
      const active = button.dataset.themeValue === state.theme;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    }

    for (const button of openModeButtons) {
      const active = button.dataset.openMode === state.openMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    }

    for (const button of iconStyleButtons) {
      const active = button.dataset.iconStyle === state.iconStyle;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    }

    if (wallpaperPicker) {
      $$('.wp-option', wallpaperPicker).forEach((option) => {
        option.setAttribute('aria-pressed', String(option.dataset.wallpaper === state.wallpaper));
      });

      const customSwatch = $('.wp-swatch--custom', wallpaperPicker);
      if (customSwatch) {
        if (state.customWallpaper) {
          customSwatch.style.backgroundImage = `url("${state.customWallpaper}")`;
          customSwatch.classList.add('has-image');
        } else {
          customSwatch.style.backgroundImage = '';
          customSwatch.classList.remove('has-image');
        }
      }

      const removeButton = $('.wp-option__remove', wallpaperPicker);
      if (removeButton) removeButton.hidden = !state.customWallpaper;
    }

    if (settingsEngine && settingsEngine.value !== state.searchEngine) {
      settingsEngine.value = state.searchEngine;
    }

    if (hitokotoCats) {
      $$('.chip', hitokotoCats).forEach((chip) => {
        const active = (state.hitokotoCats || []).includes(chip.dataset.cat);
        chip.classList.toggle('is-active', active);
        chip.setAttribute('aria-pressed', String(active));
      });
    }

    const background = document.querySelector('#wallpaper');
    if (background) {
      if (state.wallpaper === 'custom' && state.customWallpaper) {
        background.style.backgroundImage = `url("${state.customWallpaper}")`;
        background.dataset.wallpaper = 'custom';
      } else {
        const paper = WALLPAPERS.find((item) => item.id === state.wallpaper) || WALLPAPERS[0];
        background.style.backgroundImage = '';
        background.dataset.wallpaper = paper.id;
      }
    }
  }

  function openDrawer(sectionId = null) {
    if (!isOpen) {
      isOpen = true;
      lastFocused = document.activeElement;

      scrim.classList.add('is-open');
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      drawer.inert = false;

      if (app) app.inert = true;
      document.body.classList.add('has-drawer');

      window.requestAnimationFrame(() => {
        if (isOpen) closeButton?.focus();
      });
    }

    if (sectionId) {
      window.setTimeout(() => {
        if (!isOpen) return;
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 260);
    }
  }

  function closeDrawer() {
    if (!isOpen) return;
    isOpen = false;

    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    scrim.classList.remove('is-open');

    if (app) app.inert = false;
    document.body.classList.remove('has-drawer');

    window.setTimeout(() => {
      if (!isOpen) drawer.inert = true;
    }, 300);

    const target = lastFocused;
    lastFocused = null;

    window.requestAnimationFrame(() => {
      if (!isOpen && target && target.isConnected) target.focus();
    });
  }

  return { isOpen: () => isOpen, open: openDrawer, close: closeDrawer };
}
