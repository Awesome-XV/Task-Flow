const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON Database (simple file-based storage)
const DB_FILE = 'taskflow-data.json';
let db = {
  tasks: [],
  subtasks: [],
  energy_patterns: [],
  study_sessions: []
};

// Load database from file
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    db = JSON.parse(data);
  }
}

// Save database to file
function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// Initialize database
loadDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// API Routes

// Get all tasks
app.get('/api/tasks', (req, res) => {
  try {
    // Get subtasks for each task
    const tasksWithSubtasks = db.tasks.map(task => {
      const subtasks = db.subtasks.filter(st => st.parent_id === task.id)
        .sort((a, b) => a.order_index - b.order_index);
      return { ...task, subtasks };
    });

    // Sort by due date and priority
    tasksWithSubtasks.sort((a, b) => {
      if (a.due_date && b.due_date) {
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

    res.json(tasksWithSubtasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task
app.get('/api/tasks/:id', (req, res) => {
  try {
    const task = db.tasks.find(t => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const subtasks = db.subtasks
      .filter(st => st.parent_id === task.id)
      .sort((a, b) => a.order_index - b.order_index);
    res.json({ ...task, subtasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
app.post('/api/tasks', (req, res) => {
  try {
    const { title, description, type, priority, due_date, estimated_hours, energy_level } = req.body;
    const id = uuidv4();
    
    const task = {
      id,
      title,
      description: description || '',
      type,
      priority: priority || 'medium',
      status: 'pending',
      due_date: due_date || null,
      estimated_hours: estimated_hours || null,
      completed_hours: 0,
      energy_level: energy_level || null,
      created_at: new Date().toISOString(),
      completed_at: null
    };
    
    db.tasks.push(task);
    
    // Auto-break down large projects
    const taskSubtasks = [];
    if (estimated_hours && estimated_hours > 4) {
      const subtaskTitles = breakDownProject(title, estimated_hours);
      
      subtaskTitles.forEach((subtaskTitle, index) => {
        const subtask = {
          id: uuidv4(),
          parent_id: id,
          title: subtaskTitle,
          status: 'pending',
          order_index: index
        };
        db.subtasks.push(subtask);
        taskSubtasks.push(subtask);
      });
    }
    
    saveDB();
    res.status(201).json({ ...task, subtasks: taskSubtasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
  try {
    const { title, description, type, priority, status, due_date, estimated_hours, completed_hours, energy_level } = req.body;
    
    const taskIndex = db.tasks.findIndex(t => t.id === req.params.id);
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    db.tasks[taskIndex] = {
      ...db.tasks[taskIndex],
      title,
      description,
      type,
      priority,
      status,
      due_date,
      estimated_hours,
      completed_hours: completed_hours || 0,
      energy_level,
      completed_at: status === 'completed' ? new Date().toISOString() : db.tasks[taskIndex].completed_at
    };
    
    saveDB();
    
    const subtasks = db.subtasks
      .filter(st => st.parent_id === req.params.id)
      .sort((a, b) => a.order_index - b.order_index);
    
    res.json({ ...db.tasks[taskIndex], subtasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  try {
    db.subtasks = db.subtasks.filter(st => st.parent_id !== req.params.id);
    db.tasks = db.tasks.filter(t => t.id !== req.params.id);
    saveDB();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subtask
app.put('/api/subtasks/:id', (req, res) => {
  try {
    const { status } = req.body;
    const subtaskIndex = db.subtasks.findIndex(st => st.id === req.params.id);
    
    if (subtaskIndex === -1) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    
    db.subtasks[subtaskIndex].status = status;
    saveDB();
    
    res.json(db.subtasks[subtaskIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record energy pattern
app.post('/api/energy-patterns', (req, res) => {
  try {
    const { day_of_week, hour, energy_level } = req.body;
    const id = uuidv4();
    
    db.energy_patterns.push({
      id,
      user_id: 'default',
      day_of_week,
      hour,
      energy_level,
      recorded_at: new Date().toISOString()
    });
    
    saveDB();
    res.status(201).json({ message: 'Energy pattern recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI study recommendations
app.get('/api/recommendations', (req, res) => {
  try {
    const tasks = db.tasks.filter(t => t.status !== 'completed')
      .sort((a, b) => {
        if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return 0;
      })
      .slice(0, 10);
    
    // Group energy patterns by day, hour, and level
    const energyGroups = {};
    db.energy_patterns.forEach(ep => {
      const key = `${ep.day_of_week}-${ep.hour}-${ep.energy_level}`;
      energyGroups[key] = (energyGroups[key] || 0) + 1;
    });
    
    const energyPatterns = Object.entries(energyGroups).map(([key, frequency]) => {
      const [day_of_week, hour, energy_level] = key.split('-');
      return {
        day_of_week: parseInt(day_of_week),
        hour: parseInt(hour),
        energy_level,
        frequency
      };
    }).sort((a, b) => b.frequency - a.frequency);
    
    const recommendations = generateStudyRecommendations(tasks, energyPatterns);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record study session
app.post('/api/study-sessions', (req, res) => {
  try {
    const { task_id, start_time, end_time, duration_minutes, energy_level, productivity_rating } = req.body;
    const id = uuidv4();
    
    db.study_sessions.push({
      id,
      task_id: task_id || null,
      start_time,
      end_time,
      duration_minutes,
      energy_level,
      productivity_rating
    });
    
    // Update energy patterns based on this session
    const startDate = new Date(start_time);
    db.energy_patterns.push({
      id: uuidv4(),
      user_id: 'default',
      day_of_week: startDate.getDay(),
      hour: startDate.getHours(),
      energy_level,
      recorded_at: new Date().toISOString()
    });
    
    saveDB();
    res.status(201).json({ message: 'Study session recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const now = new Date();
    const stats = {
      total: db.tasks.length,
      pending: db.tasks.filter(t => t.status === 'pending').length,
      in_progress: db.tasks.filter(t => t.status === 'in_progress').length,
      completed: db.tasks.filter(t => t.status === 'completed').length,
      overdue: db.tasks.filter(t => {
        return t.status !== 'completed' && t.due_date && new Date(t.due_date) < now;
      }).length,
      total_study_hours: db.study_sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0)
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Helper Functions

function breakDownProject(title, estimatedHours) {
  const subtasks = [];
  const numSubtasks = Math.min(Math.ceil(estimatedHours / 2), 8);
  
  const projectPhases = [
    'Research and planning',
    'Outline and structure',
    'Draft first section',
    'Draft middle sections',
    'Draft final section',
    'Review and edit',
    'Finalize and polish',
    'Final review'
  ];
  
  for (let i = 0; i < numSubtasks; i++) {
    subtasks.push(projectPhases[i] || `Complete phase ${i + 1}`);
  }
  
  return subtasks;
}

function generateStudyRecommendations(tasks, energyPatterns) {
  const recommendations = [];
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  
  // Find best energy times
  const highEnergyTimes = energyPatterns
    .filter(p => p.energy_level === 'high')
    .slice(0, 5);
  
  // Prioritize tasks
  const urgentTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24);
    return daysUntilDue <= 3 && daysUntilDue >= 0;
  });
  
  const highPriorityTasks = tasks.filter(t => t.priority === 'high');
  
  // Generate recommendations
  if (urgentTasks.length > 0) {
    recommendations.push({
      type: 'urgent',
      title: 'Urgent Deadlines Approaching',
      tasks: urgentTasks.map(t => ({
        id: t.id,
        title: t.title,
        due_date: t.due_date,
        priority: t.priority
      })),
      suggestion: 'These tasks are due within 3 days. Consider scheduling focused study sessions today.'
    });
  }
  
  if (highEnergyTimes.length > 0) {
    const nextHighEnergy = findNextHighEnergySlot(highEnergyTimes, currentDay, currentHour);
    if (nextHighEnergy && highPriorityTasks.length > 0) {
      recommendations.push({
        type: 'optimal_time',
        title: 'Optimal Study Time Detected',
        time: nextHighEnergy,
        suggestion: `Based on your energy patterns, ${nextHighEnergy.description} is a great time for focused work.`,
        recommended_tasks: highPriorityTasks.slice(0, 3).map(t => ({
          id: t.id,
          title: t.title,
          estimated_hours: t.estimated_hours
        }))
      });
    }
  }
  
  // Break time recommendation
  const longTasks = tasks.filter(t => t.estimated_hours > 3);
  if (longTasks.length > 0) {
    recommendations.push({
      type: 'break_suggestion',
      title: 'Long Tasks Detected',
      suggestion: 'Consider using the Pomodoro technique (25 min work, 5 min break) for these longer tasks.',
      tasks: longTasks.map(t => ({ id: t.id, title: t.title, estimated_hours: t.estimated_hours }))
    });
  }
  
  // Study balance recommendation
  const tasksByType = tasks.reduce((acc, task) => {
    acc[task.type] = (acc[task.type] || 0) + 1;
    return acc;
  }, {});
  
  recommendations.push({
    type: 'balance',
    title: 'Task Distribution',
    distribution: tasksByType,
    suggestion: 'Maintain a balanced schedule across different types of activities.'
  });
  
  return recommendations;
}

function findNextHighEnergySlot(highEnergyTimes, currentDay, currentHour) {
  // Simple logic to find the next high energy time slot
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDay = (currentDay + dayOffset) % 7;
    const slots = highEnergyTimes.filter(t => t.day_of_week === checkDay);
    
    for (const slot of slots) {
      if (dayOffset === 0 && slot.hour <= currentHour) continue;
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        day: checkDay,
        hour: slot.hour,
        description: `${days[checkDay]} at ${slot.hour}:00`
      };
    }
  }
  
  return null;
}

// Start server
app.listen(PORT, () => {
  console.log(`TaskFlow server running on http://localhost:${PORT}`);
});
