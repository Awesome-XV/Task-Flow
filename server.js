const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database('taskflow.db');
db.pragma('journal_mode = WAL');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize database tables
const initDB = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      due_date TEXT,
      estimated_hours REAL,
      completed_hours REAL DEFAULT 0,
      energy_level TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      parent_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      order_index INTEGER,
      FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS energy_patterns (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'default',
      day_of_week INTEGER,
      hour INTEGER,
      energy_level TEXT,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      start_time TEXT,
      end_time TEXT,
      duration_minutes INTEGER,
      energy_level TEXT,
      productivity_rating INTEGER,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );
  `);
};

initDB();

// API Routes

// Get all tasks
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT * FROM tasks 
      ORDER BY due_date ASC, priority DESC
    `).all();

    // Get subtasks for each task
    const tasksWithSubtasks = tasks.map(task => {
      const subtasks = db.prepare(`
        SELECT * FROM subtasks 
        WHERE parent_id = ? 
        ORDER BY order_index ASC
      `).all(task.id);
      return { ...task, subtasks };
    });

    res.json(tasksWithSubtasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task
app.get('/api/tasks/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const subtasks = db.prepare('SELECT * FROM subtasks WHERE parent_id = ? ORDER BY order_index').all(task.id);
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
    
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, type, priority, due_date, estimated_hours, energy_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, title, description, type, priority || 'medium', due_date, estimated_hours, energy_level);
    
    // Auto-break down large projects
    if (estimated_hours && estimated_hours > 4) {
      const subtasks = breakDownProject(title, estimated_hours);
      const subtaskStmt = db.prepare(`
        INSERT INTO subtasks (id, parent_id, title, order_index)
        VALUES (?, ?, ?, ?)
      `);
      
      subtasks.forEach((subtask, index) => {
        subtaskStmt.run(uuidv4(), id, subtask, index);
      });
    }
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    const taskSubtasks = db.prepare('SELECT * FROM subtasks WHERE parent_id = ? ORDER BY order_index').all(id);
    
    res.status(201).json({ ...task, subtasks: taskSubtasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
  try {
    const { title, description, type, priority, status, due_date, estimated_hours, completed_hours, energy_level } = req.body;
    
    const stmt = db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, type = ?, priority = ?, status = ?, 
          due_date = ?, estimated_hours = ?, completed_hours = ?, energy_level = ?,
          completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = ?
    `);
    
    stmt.run(title, description, type, priority, status, due_date, estimated_hours, completed_hours, energy_level, status, req.params.id);
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    const subtasks = db.prepare('SELECT * FROM subtasks WHERE parent_id = ? ORDER BY order_index').all(req.params.id);
    
    res.json({ ...task, subtasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM subtasks WHERE parent_id = ?').run(req.params.id);
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subtask
app.put('/api/subtasks/:id', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE subtasks SET status = ? WHERE id = ?').run(status, req.params.id);
    const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(req.params.id);
    res.json(subtask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record energy pattern
app.post('/api/energy-patterns', (req, res) => {
  try {
    const { day_of_week, hour, energy_level } = req.body;
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO energy_patterns (id, day_of_week, hour, energy_level)
      VALUES (?, ?, ?, ?)
    `).run(id, day_of_week, hour, energy_level);
    
    res.status(201).json({ message: 'Energy pattern recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI study recommendations
app.get('/api/recommendations', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT * FROM tasks 
      WHERE status != 'completed' 
      ORDER BY due_date ASC, priority DESC
      LIMIT 10
    `).all();
    
    const energyPatterns = db.prepare(`
      SELECT day_of_week, hour, energy_level, COUNT(*) as frequency
      FROM energy_patterns
      GROUP BY day_of_week, hour, energy_level
      ORDER BY frequency DESC
    `).all();
    
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
    
    db.prepare(`
      INSERT INTO study_sessions (id, task_id, start_time, end_time, duration_minutes, energy_level, productivity_rating)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, task_id, start_time, end_time, duration_minutes, energy_level, productivity_rating);
    
    // Update energy patterns based on this session
    const startDate = new Date(start_time);
    db.prepare(`
      INSERT INTO energy_patterns (id, day_of_week, hour, energy_level)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), startDate.getDay(), startDate.getHours(), energy_level);
    
    res.status(201).json({ message: 'Study session recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM tasks').get().count,
      pending: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get().count,
      in_progress: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'").get().count,
      completed: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get().count,
      overdue: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status != 'completed' AND date(due_date) < date('now')").get().count,
      total_study_hours: db.prepare('SELECT SUM(duration_minutes) as total FROM study_sessions').get().total || 0
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
