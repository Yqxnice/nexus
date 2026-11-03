/**
 * 待办抽屉：添加、勾选、删除、清除已完成，进度条。
 * 通过顶栏「待办」按钮呼出，独立 scrim 与 Esc 关闭。
 */

import { $, uid } from './utils.js';
import { appIconSvg } from './icons.js';

export function initTodos({ store, root = document }) {
  const drawer = $('#todos-drawer', root);
  const scrim = $('#todos-scrim', root);
  const openButton = $('#btn-todos', root);
  const closeButton = $('#btn-close-todos', root);
  const form = $('#todo-form', root);
  const input = $('#todo-input', root);
  const list = $('#todo-list', root);
  const empty = $('#todo-empty', root);
  const summary = $('#todo-summary', root);
  const clearButton = $('#todo-clear', root);
  const progressBar = $('#todo-progress-bar', root);

  openButton && (openButton.innerHTML = appIconSvg('todos'));

  if (!drawer || !scrim || !form || !input || !list || !empty || !summary || !clearButton || !progressBar) {
    return { isOpen: () => false, close: () => {} };
  }

  let isOpen = false;
  let lastSignature = '';

  store.subscribe((state) => {
    const signature = JSON.stringify(state.todos);
    if (signature === lastSignature) return;
    lastSignature = signature;
    render(state.todos);
  });

  function openDrawer() {
    if (isOpen) return;
    isOpen = true;

    scrim.classList.add('is-open');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('has-todos-drawer');

    window.requestAnimationFrame(() => {
      if (isOpen) input.focus();
    });
  }

  function closeDrawer() {
    if (!isOpen) return;
    isOpen = false;

    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    scrim.classList.remove('is-open');
    document.body.classList.remove('has-todos-drawer');
  }

  openButton?.addEventListener('click', openDrawer);
  closeButton?.addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen) return;

    // 弹窗打开时交给弹窗处理
    if (document.querySelector('dialog[open]')) return;

    event.preventDefault();
    closeDrawer();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }

    const todo = {
      id: uid('todo'),
      text: text.slice(0, 80),
      done: false,
    };

    store.update({ todos: [todo, ...store.state.todos] });
    input.value = '';
    input.focus();
  });

  list.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.todo-check');
    if (!checkbox) return;

    const id = checkbox.dataset.id;
    store.update({
      todos: store.state.todos.map((todo) =>
        todo.id === id ? { ...todo, done: checkbox.checked } : todo
      ),
    });
  });

  list.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('.todo-delete');
    if (!deleteButton) return;

    store.update({
      todos: store.state.todos.filter((todo) => todo.id !== deleteButton.dataset.id),
    });
  });

  clearButton.addEventListener('click', () => {
    store.update({ todos: store.state.todos.filter((todo) => !todo.done) });
  });

  function render(todos) {
    const fragment = document.createDocumentFragment();

    for (const todo of todos) {
      const item = document.createElement('li');
      item.className = `todo-item${todo.done ? ' is-done' : ''}`;
      item.dataset.id = todo.id;

      const main = document.createElement('label');
      main.className = 'todo-main';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'todo-check';
      checkbox.dataset.id = todo.id;
      checkbox.checked = todo.done;
      checkbox.setAttribute('aria-label', `完成任务：${todo.text}`);

      const text = document.createElement('span');
      text.className = 'todo-text';
      text.textContent = todo.text;

      main.append(checkbox, text);

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'todo-delete';
      deleteButton.dataset.id = todo.id;
      deleteButton.title = '删除待办';
      deleteButton.setAttribute('aria-label', `删除待办：${todo.text}`);
      deleteButton.textContent = '×';

      item.append(main, deleteButton);
      fragment.append(item);
    }

    list.replaceChildren(fragment);

    const total = todos.length;
    const doneCount = todos.filter((todo) => todo.done).length;

    summary.textContent = total ? `${total} 项 · 已完成 ${doneCount}` : '0 项';
    empty.hidden = total > 0;
    clearButton.disabled = doneCount === 0;
    progressBar.style.width = total ? `${Math.round((doneCount / total) * 100)}%` : '0%';
  }

  return { isOpen: () => isOpen, close: closeDrawer };
}
