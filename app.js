// ── State ─────────────────────────────────────────────────────────────────────
let tasks  = JSON.parse(localStorage.getItem('tasks') || '[]');
let filter = 'all';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const taskInput     = document.getElementById('taskInput');
const addBtn        = document.getElementById('addBtn');
const taskList      = document.getElementById('taskList');
const emptyState    = document.getElementById('emptyState');
const remainingEl   = document.getElementById('remainingCount');
const doneEl        = document.getElementById('doneCount');
const clearDoneBtn  = document.getElementById('clearDoneBtn');
const filterBtns    = document.querySelectorAll('.filter-btn');
const currentDateEl = document.getElementById('currentDate');

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  renderDate();
  render();

  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });
  clearDoneBtn.addEventListener('click', clearDone);
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
  });
}

// ── Date ──────────────────────────────────────────────────────────────────────
function renderDate() {
  const now = new Date();
  currentDateEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  }).toUpperCase();
}

// ── Add Task ──────────────────────────────────────────────────────────────────
function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    taskInput.classList.add('shake');
    setTimeout(() => taskInput.classList.remove('shake'), 400);
    return;
  }

  tasks.unshift({ id: Date.now(), text, done: false });
  save();
  taskInput.value = '';
  taskInput.focus();
  render();
}

// ── Toggle Done ───────────────────────────────────────────────────────────────
function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  save();
  render();
}

// ── Delete Task ───────────────────────────────────────────────────────────────
function deleteTask(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) {
    el.classList.add('removing');
    el.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== id);
      save();
      render();
    }, { once: true });
  }
}

// ── Clear Done ────────────────────────────────────────────────────────────────
function clearDone() {
  const doneItems = document.querySelectorAll('.task-item.done');
  if (!doneItems.length) return;

  let removed = 0;
  doneItems.forEach(el => {
    el.classList.add('removing');
    el.addEventListener('animationend', () => {
      removed++;
      if (removed === doneItems.length) {
        tasks = tasks.filter(t => !t.done);
        save();
        render();
      }
    }, { once: true });
  });
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done')   return  t.done;
    return true;
  });

  // Stats
  const remaining = tasks.filter(t => !t.done).length;
  const done      = tasks.filter(t =>  t.done).length;
  remainingEl.textContent = remaining;
  doneEl.textContent      = done;

  // Empty state
  if (filtered.length === 0) {
    taskList.innerHTML = '';
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    taskList.innerHTML = filtered.map(taskHTML).join('');

    // Bind events
    taskList.querySelectorAll('.check-btn').forEach(btn => {
      btn.addEventListener('click', () => toggleTask(Number(btn.dataset.id)));
    });
    taskList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteTask(Number(btn.dataset.id)));
    });
  }
}

// ── Task HTML ─────────────────────────────────────────────────────────────────
function taskHTML(task) {
  return `
    <li class="task-item ${task.done ? 'done' : ''}" data-id="${task.id}">
      <button class="check-btn ${task.done ? 'checked' : ''}" data-id="${task.id}" aria-label="Toggle task"></button>
      <span class="task-text">${escapeHTML(task.text)}</span>
      <button class="delete-btn" data-id="${task.id}" aria-label="Delete task">✕</button>
    </li>
  `;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function save() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Shake animation (CSS-free fallback via JS)
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%,60% { transform: translateX(-6px); }
    40%,80% { transform: translateX(6px); }
  }
  .shake { animation: shake 0.35s ease; }
`;
document.head.appendChild(style);

// ── Start ─────────────────────────────────────────────────────────────────────
init();
