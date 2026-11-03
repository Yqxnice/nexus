/**
 * 搜索框：切换搜索引擎，支持搜索词与网址直达。
 */

import { SEARCH_ENGINES, engineById } from './state.js';
import { isProbablyUrl, normalizeUrl, openUrl, $ } from './utils.js';
import { toast } from './ui.js';

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

export function initSearch({ store, root = document }) {
  const form = $('#search-form', root);
  const input = $('#search-input', root);
  const select = $('#engine-select', root);

  if (!form || !input || !select) {
    return { focus: () => {} };
  }

  fillEngineOptions(select, store.state.searchEngine);

  store.subscribe((state) => {
    if (select.value !== state.searchEngine) {
      select.value = state.searchEngine;
    }
  });

  select.addEventListener('change', () => {
    store.update({ searchEngine: select.value });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const raw = input.value.trim();
    if (!raw) {
      input.focus();
      return;
    }

    const state = store.state;
    let targetUrl = null;

    if (isProbablyUrl(raw)) {
      targetUrl = normalizeUrl(raw);
      if (!targetUrl) {
        toast('网址格式不正确');
        return;
      }
    } else {
      const engine = engineById(state.searchEngine);
      targetUrl = engine.searchUrl.replace('%s', encodeURIComponent(raw));
    }

    openUrl(targetUrl, state.openMode);
  });

  const focus = () => {
    input.focus();
    input.select();
  };

  return { focus };
}
