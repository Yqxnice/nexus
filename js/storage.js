/**
 * 持久化适配层：
 * 扩展环境优先 chrome.storage.local；在普通网页预览时回退 localStorage。
 */

const STORAGE_KEY = 'nexus_state_v1';

export function hasExtensionStorage() {
  try {
    return typeof chrome !== 'undefined' && Boolean(chrome.storage && chrome.storage.local);
  } catch {
    return false;
  }
}

export function storageLabel() {
  return hasExtensionStorage() ? 'chrome.storage.local' : 'localStorage（浏览器预览回退）';
}

export function readLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('[Nexus] localStorage 读取失败。', error);
    return null;
  }
}

export function writeLocalState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn('[Nexus] localStorage 写入失败。', error);
    return false;
  }
}

export async function loadState() {
  if (hasExtensionStorage()) {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      if (result && result[STORAGE_KEY]) return result[STORAGE_KEY];
      return null;
    } catch (error) {
      console.warn('[Nexus] chrome.storage.local 读取失败，回退到 localStorage。', error);
    }
  }
  return readLocalState();
}

export async function saveState(state) {
  if (hasExtensionStorage()) {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: state });
      return true;
    } catch (error) {
      console.warn('[Nexus] chrome.storage.local 写入失败，回退到 localStorage。', error);
    }
  }
  return writeLocalState(state);
}
