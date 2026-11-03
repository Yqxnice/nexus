/**
 * 轻量 UI 反馈：toast 与确认对话框。
 */

import { $ } from './utils.js';

let toastTimer = null;

export function toast(message, duration = 2200) {
  const element = $('#toast');
  if (!element) return;

  element.textContent = message;
  element.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    element.classList.remove('is-visible');
  }, duration);
}

/**
 * 打开确认对话框，返回用户是否点击了确认。
 */
export function confirmAction({
  title = '确认操作',
  message = '此操作无法撤销。',
  confirmText = '确认',
} = {}) {
  const dialog = $('#confirm-dialog');
  const titleElement = $('#confirm-title');
  const textElement = $('#confirm-text');
  const confirmButton = $('#confirm-ok');

  if (!dialog || !titleElement || !textElement || !confirmButton) {
    return Promise.resolve(false);
  }

  titleElement.textContent = title;
  textElement.textContent = message;
  confirmButton.textContent = confirmText;

  return new Promise((resolve) => {
    const onClose = () => {
      dialog.removeEventListener('close', onClose);
      resolve(dialog.returnValue === 'confirm');
    };

    dialog.returnValue = '';
    dialog.addEventListener('close', onClose);
    dialog.showModal();
  });
}
