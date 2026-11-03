/**
 * 一言：底部随机句子（hitokoto.cn），失败时回退本地句子。
 */

import { $ } from './utils.js';

export const HITOKOTO_CATS = [
  { id: 'a', label: '动画' },
  { id: 'b', label: '漫画' },
  { id: 'c', label: '游戏' },
  { id: 'd', label: '文学' },
  { id: 'e', label: '原创' },
  { id: 'f', label: '网络' },
  { id: 'h', label: '影视' },
  { id: 'i', label: '诗词' },
  { id: 'j', label: '网易云' },
  { id: 'k', label: '哲学' },
];

// 离线/请求失败时的本地兜底
const FALLBACK = [
  { text: '路虽远，行则将至；事虽难，做则必成。', from: '荀子' },
  { text: '不积跬步，无以至千里；不积小流，无以成江海。', from: '荀子·劝学' },
  { text: '凡是过往，皆为序章。', from: '莎士比亚' },
  { text: '夜色之浓，莫过于黎明前的黑暗。', from: '牧羊少年奇幻之旅' },
];

export function initHitokoto({ store }) {
  const footer = $('#hitokoto');
  if (!footer) return { refresh: () => {} };

  let lastCats = null; // null 保证首次订阅必拉取一次
  let fetching = false;

  footer.addEventListener('click', () => fetchQuote());
  footer.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fetchQuote();
    }
  });

  store.subscribe((state) => {
    const key = (state.hitokotoCats || []).join(',');
    if (key !== lastCats) {
      lastCats = key;
      fetchQuote();
    }
  });

  async function fetchQuote() {
    if (fetching) return;
    fetching = true;

    try {
      const cats = store.state.hitokotoCats || [];
      const query = cats.map((id) => `&c=${encodeURIComponent(id)}`).join('');
      const response = await fetch(`https://v1.hitokoto.cn/?max_length=42${query}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      render(data.hitokoto, data.from_who || data.from || '一言');
    } catch {
      const item = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
      render(item.text, item.from);
    } finally {
      fetching = false;
    }
  }

  function render(text, from) {
    const quote = document.createElement('span');
    quote.className = 'hitokoto__text';
    quote.textContent = `「${text}」`;

    const source = document.createElement('span');
    source.className = 'hitokoto__from';
    source.textContent = `—— ${from}`;

    footer.replaceChildren(quote, source);
  }

  return { refresh: fetchQuote };
}
