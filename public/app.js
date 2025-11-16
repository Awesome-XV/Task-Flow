const API_URL = 'http://localhost:3000/api';

// State management
let currentView = 'tasks';
let tasks = [];
let recommendations = [];
let recurringEvents = [];
let currentSchedule = null;
let sleepSchedule = null;
let selectedEnergyLevel = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 TaskFlow initialized');
  initEventListeners();
  loadTasks();
  loadStats();
  loadRecommendations();
  loadRecurringEvents();
  loadSleepSchedule();
  
  // Set today's date as default (using local time)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  const scheduleDate = document.getElementById('schedule-date');
  if (scheduleDate) {
    scheduleDate.value = todayStr;
  }
});

// Event Listeners
function initEventListeners() {
  console.log('📋 Setting up event listeners...');
  
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.dataset.view;
      switchView(view);
    });
  });

  // Modals
  const addTaskBtn = document.getElementById('add-task-btn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
      console.log('➕ Add Task button clicked');
      openTaskModal();
    });
  }

  // Quick Create Buttons
  document.querySelectorAll('.create-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const type = e.currentTarget.dataset.type;
      console.log(`➕ Quick create ${type} clicked`);
      openTaskModal(null, type);
    });
  });

  const taskForm = document.getElementById('task-form');
  if (taskForm) {
    taskForm.addEventListener('submit', handleTaskSubmit);
  }

  const logEnergyBtn = document.getElementById('log-energy-btn');
  if (logEnergyBtn) {
    logEnergyBtn.addEventListener('click', openEnergyModal);
  }
  
  const studySessionBtn = document.getElementById('study-session-btn');
  if (studySessionBtn) {
    studySessionBtn.addEventListener('click', openStudySessionModal);
  }

  const sessionForm = document.getElementById('session-form');
  if (sessionForm) {
    sessionForm.addEventListener('submit', handleSessionSubmit);
  }

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
  if (productivitySlider && productivityValue) {
    productivitySlider.addEventListener('input', (e) => {
      productivityValue.textContent = e.target.value;
    });
  }

  // Filters
  const filterPriority = document.getElementById('filter-priority');
  if (filterPriority) {
    filterPriority.addEventListener('change', filterTasks);
  }

  const filterStatus = document.getElementById('filter-status');
  if (filterStatus) {
    filterStatus.addEventListener('change', filterTasks);
  }

  // Close modals on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Universal close button handler for all modals
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Universal cancel button handler for all modals  
  document.querySelectorAll('.btn-secondary').forEach(btn => {
    if (btn.textContent.trim() === 'Cancel') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = e.target.closest('.modal');
        if (modal) {
          modal.classList.remove('active');
        }
      });
    }
  });

  // NEW: Recurring Events
  const addRecurringBtn = document.getElementById('add-recurring-btn');
  if (addRecurringBtn) {
    addRecurringBtn.addEventListener('click', openRecurringModal);
  }

  const addRecurringEventBtn = document.getElementById('add-recurring-event-btn');
  if (addRecurringEventBtn) {
    addRecurringEventBtn.addEventListener('click', openRecurringModal);
  }

  const recurringForm = document.getElementById('recurring-form');
  if (recurringForm) {
    recurringForm.addEventListener('submit', handleRecurringSubmit);
  }

  const recurringPattern = document.getElementById('recurring-pattern');
  if (recurringPattern) {
    recurringPattern.addEventListener('change', toggleWeeklyDays);
  }

  // NEW: Sleep Schedule
  const sleepScheduleBtn = document.getElementById('sleep-schedule-btn');
  if (sleepScheduleBtn) {
    sleepScheduleBtn.addEventListener('click', openSleepModal);
  }

  const sleepForm = document.getElementById('sleep-form');
  if (sleepForm) {
    sleepForm.addEventListener('submit', handleSleepSubmit);
  }

  const sleepHoursSlider = document.getElementById('sleep-desired-hours');
  const sleepHoursValue = document.getElementById('sleep-hours-value');
  if (sleepHoursSlider && sleepHoursValue) {
    sleepHoursSlider.addEventListener('input', (e) => {
      sleepHoursValue.textContent = e.target.value;
    });
  }

  // NEW: Calendar Import
  const googleCalendarBtn = document.getElementById('google-calendar-btn');
  if (googleCalendarBtn) {
    googleCalendarBtn.addEventListener('click', openGoogleModal);
  }

  const importIcsBtn = document.getElementById('import-ics-btn');
  if (importIcsBtn) {
    importIcsBtn.addEventListener('click', importFromICS);
  }

  // NEW: Smart Schedule
  const generateScheduleBtn = document.getElementById('generate-schedule-btn');
  if (generateScheduleBtn) {
    generateScheduleBtn.addEventListener('click', generateSchedule);
  }

  const manualScheduleBtn = document.getElementById('manual-schedule-btn');
  if (manualScheduleBtn) {
    manualScheduleBtn.addEventListener('click', openManualScheduleModal);
  }

  const scheduleDate = document.getElementById('schedule-date');
  if (scheduleDate) {
    scheduleDate.addEventListener('change', (e) => {
      if (currentView === 'schedule') {
        generateSchedule();
      }
    });
  }

  // NEW: Manual Schedule Modal
  const manualScheduleForm = document.getElementById('manual-schedule-form');
  if (manualScheduleForm) {
    manualScheduleForm.addEventListener('submit', handleManualScheduleSubmit);
  }

  console.log('✅ Event listeners initialized');
}

// Navigation
function switchView(view) {
  currentView = view;
  console.log(`🔄 Switching to view: ${view}`);
  
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // Update views
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
  });
  
  const targetView = document.getElementById(`${view}-view`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Load content based on view
  if (view === 'recommendations') {
    loadRecommendations();
  } else if (view === 'schedule') {
    renderScheduleEmptyState();
  } else if (view === 'recurring') {
    renderRecurringEvents();
  } else if (view !== 'tasks') {
    filterTasksByType(view);
  }
}

// API Calls
async function loadTasks() {
  console.log('📥 Loading tasks...');
  try {
    const response = await fetch(`${API_URL}/tasks`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    tasks = await response.json();
    console.log(`✅ Loaded ${tasks.length} tasks`);
    renderTasks(tasks);
    loadStats();
  } catch (error) {
    console.error('❌ Error loading tasks:', error);
    showError('Failed to load tasks. Make sure the server is running on port 3000.');
  }
}

async function loadStats() {
  try {
    const response = await fetch(`${API_URL}/stats`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const stats = await response.json();
    
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-progress').textContent = stats.in_progress;
    document.getElementById('stat-completed').textContent = stats.completed;
    document.getElementById('stat-overdue').textContent = stats.overdue;
    
    console.log('📊 Stats updated:', stats);
  } catch (error) {
    console.error('❌ Error loading stats:', error);
  }
}

async function loadRecommendations() {
  console.log('🤖 Loading AI recommendations...');
  try {
    const response = await fetch(`${API_URL}/recommendations`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    recommendations = await response.json();
    console.log(`✅ Loaded ${recommendations.length} recommendations`);
    renderRecommendations(recommendations);
  } catch (error) {
    console.error('❌ Error loading recommendations:', error);
  }
}

async function createTask(taskData) {
  console.log('➕ Creating task:', taskData);
  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const newTask = await response.json();
    console.log('✅ Task created:', newTask);
    tasks.push(newTask);
    renderTasks(tasks);
    loadStats();
    return newTask;
  } catch (error) {
    console.error('❌ Error creating task:', error);
    throw error;
  }
}

async function updateTask(id, taskData) {
  console.log('✏️ Updating task:', id);
  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const updatedTask = await response.json();
    console.log('✅ Task updated:', updatedTask);
    tasks = tasks.map(t => t.id === id ? updatedTask : t);
    renderTasks(tasks);
    loadStats();
    return updatedTask;
  } catch (error) {
    console.error('❌ Error updating task:', error);
    throw error;
  }
}

async function deleteTask(id) {
  console.log('🗑️ Deleting task:', id);
  try {
    const response = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('✅ Task deleted');
    tasks = tasks.filter(t => t.id !== id);
    renderTasks(tasks);
    loadStats();
    showSuccess('Task deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    showError('Failed to delete task');
  }
}

async function updateSubtask(id, status) {
  console.log('☑️ Updating subtask:', id, status);
  try {
    const response = await fetch(`${API_URL}/subtasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('✅ Subtask updated');
    loadTasks();
  } catch (error) {
    console.error('❌ Error updating subtask:', error);
  }
}

async function logEnergyLevel(level) {
  console.log('⚡ Logging energy level:', level);
  try {
    const now = new Date();
    const response = await fetch(`${API_URL}/energy-patterns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_of_week: now.getDay(),
        hour: now.getHours(),
        energy_level: level
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('✅ Energy level logged');
    closeEnergyModal();
    showSuccess('Energy level logged! AI will use this to suggest optimal study times.');
    loadRecommendations();
  } catch (error) {
    console.error('❌ Error logging energy:', error);
    showError('Failed to log energy level');
  }
}

async function recordStudySession(sessionData) {
  console.log('🕐 Recording study session:', sessionData);
  try {
    const now = new Date();
    const startTime = new Date(now - sessionData.duration_minutes * 60000).toISOString();
    
    const response = await fetch(`${API_URL}/study-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...sessionData,
        start_time: startTime,
        end_time: now.toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('✅ Study session recorded');
    closeStudySessionModal();
    showSuccess('Study session recorded!');
    loadRecommendations();
  } catch (error) {
    console.error('❌ Error recording session:', error);
    showError('Failed to record study session');
  }
}

// Rendering
function renderTasks(tasksToRender) {
  const container = document.getElementById('tasks-container');
  
  if (!container) {
    console.error('❌ Tasks container not found');
    return;
  }
  
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
    
    const editBtn = card.querySelector('.edit-task-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editTask(taskId);
      });
    }
    
    const deleteBtn = card.querySelector('.delete-task-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(taskId);
      });
    }

    card.querySelectorAll('.subtask-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const subtaskId = e.target.dataset.subtaskId;
        const status = e.target.checked ? 'completed' : 'pending';
        updateSubtask(subtaskId, status);
      });
    });
  });
  
  console.log(`✅ Rendered ${tasksToRender.length} tasks`);
}

function createTaskCard(task) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let dueDate = null;
  let dueDateStr = 'No due date';
  let isOverdue = false;
  
  if (task.due_date) {
    // Parse the date correctly to avoid timezone issues
    const dueDateParts = task.due_date.split('T')[0].split('-');
    dueDate = new Date(dueDateParts[0], dueDateParts[1] - 1, dueDateParts[2]);
    
    const taskDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const timeDiff = taskDate - today;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Format the date display
    if (daysDiff === 0) {
      dueDateStr = 'Today';
    } else if (daysDiff === 1) {
      dueDateStr = 'Tomorrow';
    } else if (daysDiff === -1) {
      dueDateStr = 'Yesterday';
    } else if (daysDiff > 1 && daysDiff <= 7) {
      dueDateStr = dueDate.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      dueDateStr = dueDate.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric'
      });
    }
    
    // Add time if present
    if (task.due_date.includes('T')) {
      const timeMatch = task.due_date.match(/T(\d{2}):(\d{2})/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const min = timeMatch[2];
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        dueDateStr += `, ${displayHour}:${min} ${period}`;
      }
    }
    
    isOverdue = taskDate < today && task.status !== 'completed';
  }

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
  
  if (!container) {
    console.error('❌ Recommendations container not found');
    return;
  }
  
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
    
    const editBtn = card.querySelector('.edit-task-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editTask(taskId);
      });
    }
    
    const deleteBtn = card.querySelector('.delete-task-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(taskId);
      });
    }
    
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
  console.log('📝 Opening task modal', task ? '(edit mode)' : '(create mode)');
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
  console.log('❌ Closing task modal');
  document.getElementById('task-modal').classList.remove('active');
}

function openEnergyModal() {
  console.log('⚡ Opening energy modal');
  document.getElementById('energy-modal').classList.add('active');
  selectedEnergyLevel = null;
  document.querySelectorAll('.energy-btn').forEach(b => b.classList.remove('selected'));
}

function closeEnergyModal() {
  console.log('❌ Closing energy modal');
  document.getElementById('energy-modal').classList.remove('active');
}

function openStudySessionModal() {
  console.log('🕐 Opening study session modal');
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
  console.log('❌ Closing study session modal');
  document.getElementById('session-modal').classList.remove('active');
}

// Form Handlers
async function handleTaskSubmit(e) {
  e.preventDefault();
  console.log('💾 Submitting task form...');
  
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
  console.log('💾 Submitting study session form...');
  
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
  console.log('✏️ Editing task:', taskId);
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
  console.log('✅', message);
  showToast(message, 'success');
}

function showError(message) {
  console.error('❌', message);
  showToast(message, 'error');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${escapeHtml(message)}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// ============================================
// NEW FEATURES FUNCTIONS
// ============================================

// Recurring Events
async function loadRecurringEvents() {
  try {
    const response = await fetch(`${API_URL}/recurring-events`);
    recurringEvents = await response.json();
    if (currentView === 'recurring') {
      renderRecurringEvents();
    }
  } catch (error) {
    console.error('Error loading recurring events:', error);
  }
}

function openRecurringModal(event = null) {
  const modal = document.getElementById('recurring-modal');
  const form = document.getElementById('recurring-form');
  const modalTitle = document.getElementById('recurring-modal-title');
  
  form.reset();
  
  if (event) {
    modalTitle.textContent = 'Edit Recurring Event';
    document.getElementById('recurring-id').value = event.id;
    document.getElementById('recurring-title').value = event.title;
    document.getElementById('recurring-description').value = event.description || '';
    document.getElementById('recurring-type').value = event.type;
    document.getElementById('recurring-pattern').value = event.recurrence_pattern;
    document.getElementById('recurring-start-time').value = event.start_time;
    document.getElementById('recurring-end-time').value = event.end_time;
    
    if (event.days_of_week) {
      event.days_of_week.forEach(day => {
        const checkbox = document.querySelector(`#weekly-days-group input[value="${day}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
    
    if (event.start_date) {
      document.getElementById('recurring-start-date').value = event.start_date.split('T')[0];
    }
    if (event.end_date) {
      document.getElementById('recurring-end-date').value = event.end_date.split('T')[0];
    }
  } else {
    modalTitle.textContent = 'Add Recurring Event';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('recurring-start-date').value = today;
  }
  
  toggleWeeklyDays();
  modal.classList.add('active');
}

function toggleWeeklyDays() {
  const pattern = document.getElementById('recurring-pattern').value;
  const weeklyDaysGroup = document.getElementById('weekly-days-group');
  
  if (pattern === 'weekly') {
    weeklyDaysGroup.style.display = 'block';
  } else {
    weeklyDaysGroup.style.display = 'none';
  }
}

async function handleRecurringSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('recurring-id').value;
  const pattern = document.getElementById('recurring-pattern').value;
  
  let daysOfWeek = [];
  if (pattern === 'weekly') {
    const checkedDays = document.querySelectorAll('#weekly-days-group input:checked');
    daysOfWeek = Array.from(checkedDays).map(cb => parseInt(cb.value));
    
    if (daysOfWeek.length === 0) {
      showError('Please select at least one day of the week');
      return;
    }
  }
  
  const eventData = {
    title: document.getElementById('recurring-title').value,
    description: document.getElementById('recurring-description').value,
    type: document.getElementById('recurring-type').value,
    start_time: document.getElementById('recurring-start-time').value,
    end_time: document.getElementById('recurring-end-time').value,
    recurrence_pattern: pattern,
    days_of_week: daysOfWeek,
    start_date: document.getElementById('recurring-start-date').value || null,
    end_date: document.getElementById('recurring-end-date').value || null
  };
  
  try {
    const url = id ? `${API_URL}/recurring-events/${id}` : `${API_URL}/recurring-events`;
    const method = id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    
    const result = await response.json();
    
    if (id) {
      recurringEvents = recurringEvents.map(e => e.id === id ? result : e);
    } else {
      recurringEvents.push(result);
    }
    
    renderRecurringEvents();
    closeModal('recurring-modal');
    showSuccess(id ? 'Event updated!' : 'Recurring event created!');
  } catch (error) {
    showError('Failed to save recurring event');
  }
}

async function deleteRecurringEvent(id) {
  try {
    await fetch(`${API_URL}/recurring-events/${id}`, { method: 'DELETE' });
    recurringEvents = recurringEvents.filter(e => e.id !== id);
    renderRecurringEvents();
    showSuccess('Event deleted successfully');
  } catch (error) {
    showError('Failed to delete event');
  }
}

function renderRecurringEvents() {
  const container = document.getElementById('recurring-container');
  
  if (recurringEvents.length === 0) {
    container.innerHTML = `
      <div class="empty-state-modern">
        <div class="empty-icon-circle">
          <span class="empty-icon">🔄</span>
        </div>
        <h3 class="empty-title">No recurring events yet</h3>
        <p class="empty-description">Add recurring events like classes, work shifts, or regular activities to keep track of your schedule.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = recurringEvents.map(event => {
    const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const pattern = event.pattern || event.recurrence_pattern || 'weekly';
    const days = event.days || event.days_of_week || [];
    const startTime = formatTime12Hour(event.start_time);
    const endTime = event.end_time ? formatTime12Hour(event.end_time) : null;
    const duration = event.duration || 1;
    
    return `
      <div class="recurring-card-modern">
        <div class="recurring-card-header">
          <div class="recurring-name-section">
            <h3 class="recurring-name">${escapeHtml(event.name || event.title)}</h3>
            <span class="recurring-pattern-badge">${pattern === 'daily' ? '📅 Daily' : '📆 Weekly'}</span>
          </div>
          <div class="recurring-actions">
            <button class="action-btn edit-btn" onclick="openRecurringModal(${JSON.stringify(event).replace(/"/g, '&quot;')})" title="Edit">
              <span>✏️</span>
            </button>
            <button class="action-btn delete-btn" onclick="deleteRecurringEvent('${event.id}')" title="Delete">
              <span>🗑️</span>
            </button>
          </div>
        </div>
        
        <div class="recurring-card-body">
          <div class="recurring-info-row">
            <div class="info-item">
              <span class="info-icon">🕐</span>
              <span class="info-text">${startTime}${endTime ? ' - ' + endTime : ` (${duration}h)`}</span>
            </div>
          </div>
          
          ${pattern === 'weekly' && days.length > 0 ? `
            <div class="recurring-days">
              ${[0,1,2,3,4,5,6].map(d => `
                <span class="day-badge ${days.includes(d) ? 'active' : ''}">
                  ${dayLabels[d]}
                </span>
              `).join('')}
            </div>
          ` : pattern === 'daily' ? `
            <div class="recurring-days">
              <span class="daily-indicator">Every day</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Sleep Schedule
async function loadSleepSchedule() {
  try {
    const response = await fetch(`${API_URL}/sleep-schedule`);
    sleepSchedule = await response.json();
  } catch (error) {
    console.error('Error loading sleep schedule:', error);
  }
}

function openSleepModal() {
  const modal = document.getElementById('sleep-modal');
  const form = document.getElementById('sleep-form');
  
  if (sleepSchedule) {
    document.getElementById('sleep-bedtime').value = sleepSchedule.bedtime;
    document.getElementById('sleep-waketime').value = sleepSchedule.wake_time;
    document.getElementById('sleep-desired-hours').value = sleepSchedule.desired_hours;
    document.getElementById('sleep-hours-value').textContent = sleepSchedule.desired_hours;
    document.getElementById('sleep-optimize').checked = sleepSchedule.optimize || false;
    document.getElementById('sleep-flexible').checked = sleepSchedule.flexible || false;
  }
  
  modal.classList.add('active');
}

async function handleSleepSubmit(e) {
  e.preventDefault();
  
  const scheduleData = {
    bedtime: document.getElementById('sleep-bedtime').value,
    wake_time: document.getElementById('sleep-waketime').value,
    desired_hours: parseFloat(document.getElementById('sleep-desired-hours').value),
    optimize: document.getElementById('sleep-optimize').checked,
    flexible: document.getElementById('sleep-flexible').checked
  };
  
  try {
    const response = await fetch(`${API_URL}/sleep-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });
    
    sleepSchedule = await response.json();
    closeModal('sleep-modal');
    showSuccess('Sleep schedule saved! AI will now avoid scheduling during sleep hours.');
  } catch (error) {
    showError('Failed to save sleep schedule');
  }
}

// Calendar Import (ICS File)
function openGoogleModal() {
  document.getElementById('google-modal').classList.add('active');
}

async function importFromICS() {
  const fileInput = document.getElementById('ics-file-input');
  const file = fileInput.files[0];
  
  if (!file) {
    showError('Please select an ICS file to import');
    return;
  }
  
  try {
    const icsContent = await file.text();
    
    const response = await fetch(`${API_URL}/calendar/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ icsContent })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Import failed');
    }
    
    // Show detailed success message
    let message = `Successfully imported ${result.imported} events!`;
    if (result.tasks > 0 && result.recurring > 0) {
      message = `Imported ${result.tasks} one-time events as tasks and ${result.recurring} recurring events!`;
    } else if (result.tasks > 0) {
      message = `Imported ${result.tasks} events as tasks!`;
    } else if (result.recurring > 0) {
      message = `Imported ${result.recurring} recurring events!`;
    }
    
    showSuccess(message);
    
    // Reload both tasks and recurring events
    await loadTasks();
    await loadRecurringEvents();
    closeModal('google-modal');
    fileInput.value = ''; // Clear file input
  } catch (error) {
    console.error('Error importing ICS:', error);
    showError(error.message || 'Failed to import calendar file. Make sure it\'s a valid ICS file.');
  }
}

// Smart Scheduling
async function generateSchedule() {
  const dateInput = document.getElementById('schedule-date');
  const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
  
  try {
    const response = await fetch(`${API_URL}/schedule/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    currentSchedule = await response.json();
    renderSchedule();
    showSuccess('Schedule generated successfully!');
  } catch (error) {
    console.error('Error generating schedule:', error);
    showError('Failed to generate schedule');
  }
}

function renderSchedule() {
  const container = document.getElementById('schedule-container');
  
  if (!currentSchedule) {
    container.innerHTML = '<div class="loading">Generating schedule...</div>';
    return;
  }
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  container.innerHTML = `
    <div class="schedule-day-card">
      <div class="schedule-header">
        <div>
          <div class="schedule-date">${days[currentSchedule.day_of_week]}, ${currentSchedule.date}</div>
          ${currentSchedule.sleep_schedule ? `
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.5rem;">
              😴 Sleep: ${formatTime12Hour(currentSchedule.sleep_schedule.bedtime)} - ${formatTime12Hour(currentSchedule.sleep_schedule.wake_time)}
            </div>
          ` : ''}
        </div>
        <div class="schedule-stats">
          <span>📋 ${currentSchedule.total_tasks} tasks</span>
          <span>⏱️ ${currentSchedule.total_hours}h scheduled</span>
        </div>
      </div>
      
      <div class="schedule-timeline">
        ${renderScheduleSlots()}
      </div>
    </div>
  `;
}

function renderScheduleSlots() {
  const allSlots = [];
  
  // Add sleep time
  if (currentSchedule.sleep_schedule) {
    const bedtime = parseInt(currentSchedule.sleep_schedule.bedtime.split(':')[0]);
    const waketime = parseInt(currentSchedule.sleep_schedule.wake_time.split(':')[0]);
    
    if (bedtime > waketime) {
      allSlots.push({
        time: formatTimeRange(currentSchedule.sleep_schedule.bedtime, '23:59'),
        title: '😴 Sleep',
        type: 'sleep-time'
      });
      allSlots.push({
        time: formatTimeRange('00:00', currentSchedule.sleep_schedule.wake_time),
        title: '😴 Sleep',
        type: 'sleep-time'
      });
    } else {
      allSlots.push({
        time: formatTimeRange(currentSchedule.sleep_schedule.bedtime, currentSchedule.sleep_schedule.wake_time),
        title: '😴 Sleep',
        type: 'sleep-time'
      });
    }
  }
  
  // Add recurring events
  currentSchedule.recurring_events.forEach(event => {
    allSlots.push({
      time: formatTimeRange(event.start_time, event.end_time),
      title: event.name || event.title || 'Recurring Event',
      meta: event.pattern || 'Event',
      type: 'recurring-event'
    });
  });
  
  // Add scheduled tasks
  currentSchedule.scheduled_tasks.forEach(st => {
    allSlots.push({
      time: formatTimeRange(st.start_time, st.end_time),
      title: st.task.title,
      meta: st.reason,
      energy: st.energy_level,
      type: 'task-scheduled'
    });
  });
  
  // Sort by time
  allSlots.sort((a, b) => {
    const timeA = a.time.split(' - ')[0];
    const timeB = b.time.split(' - ')[0];
    return timeA.localeCompare(timeB);
  });
  
  return allSlots.map(slot => `
    <div class="schedule-slot ${slot.type}">
      <div class="schedule-time">${slot.time}</div>
      <div class="schedule-content">
        <div class="schedule-title">${escapeHtml(slot.title)}</div>
        ${slot.meta ? `<div class="schedule-meta">${slot.meta}</div>` : ''}
      </div>
      ${slot.energy ? `<span class="schedule-energy ${slot.energy}">${slot.energy}</span>` : ''}
    </div>
  `).join('');
}

// Manual Scheduling
function openManualScheduleModal() {
  const modal = document.getElementById('manual-schedule-modal');
  const taskSelect = document.getElementById('manual-task-select');
  const dateInput = document.getElementById('manual-schedule-date');
  
  // Populate tasks
  taskSelect.innerHTML = '<option value="">Choose a task...</option>' +
    tasks.filter(t => t.status !== 'completed').map(t => 
      `<option value="${t.id}">${escapeHtml(t.title)}</option>`
    ).join('');
  
  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  
  modal.classList.add('active');
}

async function handleManualScheduleSubmit(e) {
  e.preventDefault();
  
  const scheduleData = {
    task_id: document.getElementById('manual-task-select').value,
    scheduled_date: document.getElementById('manual-schedule-date').value,
    start_time: document.getElementById('manual-start-time').value,
    end_time: document.getElementById('manual-end-time').value,
    is_manual: true
  };
  
  try {
    await fetch(`${API_URL}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });
    
    closeModal('manual-schedule-modal');
    showSuccess('Task scheduled!');
    
    if (currentView === 'schedule') {
      generateSchedule();
    }
  } catch (error) {
    showError('Failed to schedule task');
  }
}

// Helper function to close any modal
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Helper function to convert 24-hour time to 12-hour format
function formatTime12Hour(time24) {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Helper function to format time range
function formatTimeRange(start, end) {
  return `${formatTime12Hour(start)} - ${formatTime12Hour(end)}`;
}