const API_URL = 'http://localhost:3000/api';

// State management
let currentView = 'tasks';
let tasks = [];
let recommendations = [];
let selectedEnergyLevel = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadTasks();
  loadStats();
  loadRecommendations();
});

// Event Listeners
function initEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.dataset.view;
      switchView(view);
    });
  });

  // Modals
  document.getElementById('add-task-btn').addEventListener('click', () => openTaskModal());
  document.getElementById('close-modal').addEventListener('click', closeTaskModal);
  document.getElementById('cancel-task-btn').addEventListener('click', closeTaskModal);
  document.getElementById('task-form').addEventListener('submit', handleTaskSubmit);

  document.getElementById('log-energy-btn').addEventListener('click', openEnergyModal);
  document.getElementById('close-energy-modal').addEventListener('click', closeEnergyModal);
  
  document.getElementById('study-session-btn').addEventListener('click', openStudySessionModal);
  document.getElementById('close-session-modal').addEventListener('click', closeStudySessionModal);
  document.getElementById('cancel-session-btn').addEventListener('click', closeStudySessionModal);
  document.getElementById('session-form').addEventListener('submit', handleSessionSubmit);

  // Energy level buttons
  document.querySelectorAll('.energy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.energy-btn').forEach(b => b.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      selectedEnergyLevel = e.currentTarget.dataset.level;
      setTimeout(() => {
        logEnergyLevel(selectedEnergyLevel);
      }, 300);
    });
  });

  // Productivity slider
  const productivitySlider = document.getElementById('session-productivity');
  const productivityValue = document.getElementById('productivity-value');
  productivitySlider?.addEventListener('input', (e) => {
    productivityValue.textContent = e.target.value;
  });

  // Filters
  document.getElementById('filter-priority')?.addEventListener('change', filterTasks);
  document.getElementById('filter-status')?.addEventListener('change', filterTasks);

  // Close modals on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
}

// Navigation
function switchView(view) {
  currentView = view;
  
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // Update views
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
  });
  document.getElementById(`${view}-view`).classList.add('active');

  // Load content based on view
  if (view === 'recommendations') {
    loadRecommendations();
  } else if (view !== 'tasks') {
    filterTasksByType(view);
  }
}

// API Calls
async function loadTasks() {
  try {
    const response = await fetch(`${API_URL}/tasks`);
    tasks = await response.json();
    renderTasks(tasks);
    loadStats();
  } catch (error) {
    console.error('Error loading tasks:', error);
    showError('Failed to load tasks');
  }
}

async function loadStats() {
  try {
    const response = await fetch(`${API_URL}/stats`);
    const stats = await response.json();
    
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-progress').textContent = stats.in_progress;
    document.getElementById('stat-completed').textContent = stats.completed;
    document.getElementById('stat-overdue').textContent = stats.overdue;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadRecommendations() {
  try {
    const response = await fetch(`${API_URL}/recommendations`);
    recommendations = await response.json();
    renderRecommendations(recommendations);
  } catch (error) {
    console.error('Error loading recommendations:', error);
  }
}

async function createTask(taskData) {
  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    const newTask = await response.json();
    tasks.push(newTask);
    renderTasks(tasks);
    loadStats();
    return newTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

async function updateTask(id, taskData) {
  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    const updatedTask = await response.json();
    tasks = tasks.map(t => t.id === id ? updatedTask : t);
    renderTasks(tasks);
    loadStats();
    return updatedTask;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  try {
    await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
    tasks = tasks.filter(t => t.id !== id);
    renderTasks(tasks);
    loadStats();
  } catch (error) {
    console.error('Error deleting task:', error);
    showError('Failed to delete task');
  }
}

async function updateSubtask(id, status) {
  try {
    await fetch(`${API_URL}/subtasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadTasks();
  } catch (error) {
    console.error('Error updating subtask:', error);
  }
}

async function logEnergyLevel(level) {
  try {
    const now = new Date();
    await fetch(`${API_URL}/energy-patterns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_of_week: now.getDay(),
        hour: now.getHours(),
        energy_level: level
      })
    });
    closeEnergyModal();
    showSuccess('Energy level logged! AI will use this to suggest optimal study times.');
    loadRecommendations();
  } catch (error) {
    console.error('Error logging energy:', error);
    showError('Failed to log energy level');
  }
}

async function recordStudySession(sessionData) {
  try {
    const now = new Date();
    const startTime = new Date(now - sessionData.duration_minutes * 60000).toISOString();
    
    await fetch(`${API_URL}/study-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...sessionData,
        start_time: startTime,
        end_time: now.toISOString()
      })
    });
    closeStudySessionModal();
    showSuccess('Study session recorded!');
    loadRecommendations();
  } catch (error) {
    console.error('Error recording session:', error);
    showError('Failed to record study session');
  }
}

// Rendering
function renderTasks(tasksToRender) {
  const container = document.getElementById('tasks-container');
  
  if (tasksToRender.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3>No tasks yet</h3>
        <p>Create your first task to get started!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = tasksToRender.map(task => createTaskCard(task)).join('');
  
  // Add event listeners to task cards
  container.querySelectorAll('.task-card').forEach(card => {
    const taskId = card.dataset.taskId;
    
    card.querySelector('.edit-task-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      editTask(taskId);
    });
    
    card.querySelector('.delete-task-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(taskId);
    });

    card.querySelectorAll('.subtask-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const subtaskId = e.target.dataset.subtaskId;
        const status = e.target.checked ? 'completed' : 'pending';
        updateSubtask(subtaskId, status);
      });
    });
  });
}

function createTaskCard(task) {
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'completed';
  const dueDateStr = dueDate ? dueDate.toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  }) : 'No due date';

  const progress = task.subtasks && task.subtasks.length > 0
    ? (task.subtasks.filter(s => s.status === 'completed').length / task.subtasks.length) * 100
    : 0;

  return `
    <div class="task-card priority-${task.priority}" data-task-id="${task.id}">
      <div class="task-header">
        <span class="task-type ${task.type}">${task.type}</span>
        <div class="task-actions">
          <button class="icon-btn edit-task-btn" title="Edit">✏️</button>
          <button class="icon-btn delete-task-btn" title="Delete">🗑️</button>
        </div>
      </div>
      
      <h3 class="task-title">${escapeHtml(task.title)}</h3>
      ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
      
      <div class="task-meta">
        <div class="meta-item">
          <span>📅</span>
          <span class="${isOverdue ? 'text-danger' : ''}">${dueDateStr}</span>
        </div>
        ${task.estimated_hours ? `
          <div class="meta-item">
            <span>⏱️</span>
            <span>${task.estimated_hours}h estimated</span>
          </div>
        ` : ''}
        ${task.energy_level ? `
          <div class="meta-item">
            <span>⚡</span>
            <span>${task.energy_level} energy</span>
          </div>
        ` : ''}
      </div>
      
      <span class="task-status ${task.status}">${formatStatus(task.status)}</span>
      
      ${task.subtasks && task.subtasks.length > 0 ? `
        <div class="subtasks">
          <div class="subtasks-header">
            📋 Subtasks (${task.subtasks.filter(s => s.status === 'completed').length}/${task.subtasks.length})
          </div>
          ${task.subtasks.map(subtask => `
            <div class="subtask-item ${subtask.status === 'completed' ? 'completed' : ''}">
              <input type="checkbox" 
                     class="subtask-checkbox" 
                     data-subtask-id="${subtask.id}"
                     ${subtask.status === 'completed' ? 'checked' : ''}>
              <span>${escapeHtml(subtask.title)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderRecommendations(recs) {
  const container = document.getElementById('recommendations-container');
  
  if (recs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🤖</div>
        <h3>No recommendations yet</h3>
        <p>Add tasks and log your energy levels to get AI-powered study suggestions!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = recs.map(rec => createRecommendationCard(rec)).join('');
}

function createRecommendationCard(rec) {
  let content = '';
  
  if (rec.type === 'urgent') {
    content = `
      <div class="rec-title">⚠️ ${rec.title}</div>
      <p class="rec-suggestion">${rec.suggestion}</p>
      <div class="rec-tasks">
        ${rec.tasks.map(task => `
          <div class="rec-task-item">
            <strong>${escapeHtml(task.title)}</strong><br>
            Due: ${new Date(task.due_date).toLocaleDateString()} | Priority: ${task.priority}
          </div>
        `).join('')}
      </div>
    `;
  } else if (rec.type === 'optimal_time') {
    content = `
      <div class="rec-title">✨ ${rec.title}</div>
      <p class="rec-suggestion">${rec.suggestion}</p>
      ${rec.recommended_tasks ? `
        <div class="rec-tasks">
          <strong>Recommended tasks for this time:</strong>
          ${rec.recommended_tasks.map(task => `
            <div class="rec-task-item">
              ${escapeHtml(task.title)} (${task.estimated_hours}h)
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  } else if (rec.type === 'break_suggestion') {
    content = `
      <div class="rec-title">💡 ${rec.title}</div>
      <p class="rec-suggestion">${rec.suggestion}</p>
    `;
  } else if (rec.type === 'balance') {
    content = `
      <div class="rec-title">📊 ${rec.title}</div>
      <p class="rec-suggestion">${rec.suggestion}</p>
      <div class="rec-tasks">
        ${Object.entries(rec.distribution).map(([type, count]) => `
          <div class="rec-task-item">
            ${type}: ${count} task${count !== 1 ? 's' : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  return `<div class="recommendation-card ${rec.type}">${content}</div>`;
}

// Filtering
function filterTasks() {
  const priority = document.getElementById('filter-priority').value;
  const status = document.getElementById('filter-status').value;
  
  let filtered = tasks;
  
  if (priority) {
    filtered = filtered.filter(t => t.priority === priority);
  }
  
  if (status) {
    filtered = filtered.filter(t => t.status === status);
  }
  
  renderTasks(filtered);
}

function filterTasksByType(type) {
  const container = document.getElementById(`${type}-container`);
  const typeMap = {
    'assignments': 'assignment',
    'exams': 'exam',
    'activities': 'activity'
  };
  
  const filtered = tasks.filter(t => t.type === typeMap[type]);
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3>No ${type} yet</h3>
        <p>Create a new task to get started!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filtered.map(task => createTaskCard(task)).join('');
  
  // Re-attach event listeners
  container.querySelectorAll('.task-card').forEach(card => {
    const taskId = card.dataset.taskId;
    card.querySelector('.edit-task-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      editTask(taskId);
    });
    card.querySelector('.delete-task-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(taskId);
    });
    card.querySelectorAll('.subtask-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const subtaskId = e.target.dataset.subtaskId;
        const status = e.target.checked ? 'completed' : 'pending';
        updateSubtask(subtaskId, status);
      });
    });
  });
}

// Modal Management
function openTaskModal(task = null) {
  const modal = document.getElementById('task-modal');
  const form = document.getElementById('task-form');
  const modalTitle = document.getElementById('modal-title');
  const statusGroup = document.getElementById('task-status-group');
  
  form.reset();
  
  if (task) {
    modalTitle.textContent = 'Edit Task';
    statusGroup.style.display = 'block';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-type').value = task.type;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-energy').value = task.energy_level || '';
    document.getElementById('task-hours').value = task.estimated_hours || '';
    
    if (task.due_date) {
      const date = new Date(task.due_date);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      document.getElementById('task-due-date').value = localDateTime;
    }
  } else {
    modalTitle.textContent = 'Add New Task';
    statusGroup.style.display = 'none';
  }
  
  modal.classList.add('active');
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('active');
}

function openEnergyModal() {
  document.getElementById('energy-modal').classList.add('active');
  selectedEnergyLevel = null;
  document.querySelectorAll('.energy-btn').forEach(b => b.classList.remove('selected'));
}

function closeEnergyModal() {
  document.getElementById('energy-modal').classList.remove('active');
}

function openStudySessionModal() {
  const modal = document.getElementById('session-modal');
  const taskSelect = document.getElementById('session-task');
  
  // Populate task dropdown
  taskSelect.innerHTML = '<option value="">Select a task...</option>' +
    tasks.filter(t => t.status !== 'completed').map(t => 
      `<option value="${t.id}">${escapeHtml(t.title)}</option>`
    ).join('');
  
  modal.classList.add('active');
}

function closeStudySessionModal() {
  document.getElementById('session-modal').classList.remove('active');
}

// Form Handlers
async function handleTaskSubmit(e) {
  e.preventDefault();
  
  const taskId = document.getElementById('task-id').value;
  const taskData = {
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-description').value,
    type: document.getElementById('task-type').value,
    priority: document.getElementById('task-priority').value,
    due_date: document.getElementById('task-due-date').value || null,
    estimated_hours: parseFloat(document.getElementById('task-hours').value) || null,
    energy_level: document.getElementById('task-energy').value || null,
    status: taskId ? document.getElementById('task-status').value : 'pending'
  };
  
  try {
    if (taskId) {
      await updateTask(taskId, taskData);
      showSuccess('Task updated successfully!');
    } else {
      await createTask(taskData);
      showSuccess('Task created successfully!');
    }
    closeTaskModal();
  } catch (error) {
    showError('Failed to save task');
  }
}

async function handleSessionSubmit(e) {
  e.preventDefault();
  
  const sessionData = {
    task_id: document.getElementById('session-task').value || null,
    duration_minutes: parseInt(document.getElementById('session-duration').value),
    energy_level: document.getElementById('session-energy').value,
    productivity_rating: parseInt(document.getElementById('session-productivity').value)
  };
  
  try {
    await recordStudySession(sessionData);
  } catch (error) {
    showError('Failed to record study session');
  }
}

function editTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    openTaskModal(task);
  }
}

// Utilities
function formatStatus(status) {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showSuccess(message) {
  alert(message); // Simple alert for now - could be replaced with a toast notification
}

function showError(message) {
  alert('Error: ' + message);
}
