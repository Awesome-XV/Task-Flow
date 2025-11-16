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
  study_sessions: [],
  recurring_events: [],
  sleep_schedule: null,
  scheduled_tasks: [],
  google_tokens: null
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

// ============================================
// RECURRING EVENTS API
// ============================================

// Get all recurring events
app.get('/api/recurring-events', (req, res) => {
  try {
    res.json(db.recurring_events || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create recurring event
app.post('/api/recurring-events', (req, res) => {
  try {
    const { title, description, type, start_time, end_time, recurrence_pattern, days_of_week, start_date, end_date } = req.body;
    
    const event = {
      id: uuidv4(),
      title,
      description: description || '',
      type, // 'school', 'work', 'activity', 'custom'
      start_time, // e.g., "09:00"
      end_time, // e.g., "10:30"
      recurrence_pattern, // 'daily', 'weekly', 'monthly'
      days_of_week: days_of_week || [], // [0,1,2,3,4] for weekdays
      start_date: start_date || new Date().toISOString(),
      end_date: end_date || null,
      created_at: new Date().toISOString()
    };
    
    if (!db.recurring_events) db.recurring_events = [];
    db.recurring_events.push(event);
    saveDB();
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update recurring event
app.put('/api/recurring-events/:id', (req, res) => {
  try {
    const index = db.recurring_events.findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    db.recurring_events[index] = {
      ...db.recurring_events[index],
      ...req.body
    };
    
    saveDB();
    res.json(db.recurring_events[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete recurring event
app.delete('/api/recurring-events/:id', (req, res) => {
  try {
    db.recurring_events = db.recurring_events.filter(e => e.id !== req.params.id);
    saveDB();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SLEEP SCHEDULE API
// ============================================

// Get sleep schedule
app.get('/api/sleep-schedule', (req, res) => {
  try {
    res.json(db.sleep_schedule || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set/Update sleep schedule
app.post('/api/sleep-schedule', (req, res) => {
  try {
    const { bedtime, wake_time, desired_hours, optimize, flexible } = req.body;
    
    db.sleep_schedule = {
      bedtime, // e.g., "23:00"
      wake_time, // e.g., "07:00"
      desired_hours: desired_hours || 8,
      optimize: optimize || false, // AI optimizes sleep schedule
      flexible: flexible || false, // Allow flexible sleep times
      updated_at: new Date().toISOString()
    };
    
    saveDB();
    res.json(db.sleep_schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SMART SCHEDULING API
// ============================================

// Get AI-generated schedule
app.post('/api/schedule/generate', (req, res) => {
  try {
    const { date } = req.body; // Optional specific date, defaults to today
    const targetDate = date ? new Date(date) : new Date();
    
    const schedule = generateSmartSchedule(targetDate);
    res.json(schedule);
  } catch (error) {
    console.error('Schedule generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get scheduled tasks for a date range
app.get('/api/schedule', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let scheduled = db.scheduled_tasks || [];
    
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      scheduled = scheduled.filter(s => {
        const schedDate = new Date(s.scheduled_date);
        return schedDate >= start && schedDate <= end;
      });
    }
    
    res.json(scheduled);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manually schedule a task
app.post('/api/schedule', (req, res) => {
  try {
    const { task_id, scheduled_date, start_time, end_time, is_manual } = req.body;
    
    const scheduledTask = {
      id: uuidv4(),
      task_id,
      scheduled_date,
      start_time,
      end_time,
      is_manual: is_manual || false,
      created_at: new Date().toISOString()
    };
    
    if (!db.scheduled_tasks) db.scheduled_tasks = [];
    
    // Remove any existing schedule for this task on this date
    db.scheduled_tasks = db.scheduled_tasks.filter(s => 
      !(s.task_id === task_id && s.scheduled_date === scheduled_date)
    );
    
    db.scheduled_tasks.push(scheduledTask);
    saveDB();
    
    res.status(201).json(scheduledTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update scheduled task
app.put('/api/schedule/:id', (req, res) => {
  try {
    const index = db.scheduled_tasks.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Scheduled task not found' });
    }
    
    db.scheduled_tasks[index] = {
      ...db.scheduled_tasks[index],
      ...req.body,
      is_manual: true // Mark as manually modified
    };
    
    saveDB();
    res.json(db.scheduled_tasks[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete scheduled task
app.delete('/api/schedule/:id', (req, res) => {
  try {
    db.scheduled_tasks = db.scheduled_tasks.filter(s => s.id !== req.params.id);
    saveDB();
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CALENDAR IMPORT (Simple ICS/iCal)
// ============================================
// Note: Users can export their calendar as ICS file and import it here

// Import calendar from ICS file content
app.post('/api/calendar/import', (req, res) => {
  try {
    const { icsContent } = req.body;
    
    if (!icsContent) {
      return res.status(400).json({ error: 'ICS content is required' });
    }
    
    // Parse ICS content (basic parsing)
    const events = parseICS(icsContent);
    const imported = [];
    
    for (const event of events) {
      const recurringEvent = {
        id: uuidv4(),
        name: event.summary,
        start_time: event.startTime,
        duration: event.duration,
        pattern: event.recurring ? 'weekly' : 'daily',
        days: event.days || [],
        created_at: new Date().toISOString()
      };
      
      db.recurring_events.push(recurringEvent);
      imported.push(recurringEvent);
    }
    
    saveDB();
    res.json({ imported: imported.length, events: imported });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple ICS parser helper
function parseICS(icsContent) {
  const events = [];
  const lines = icsContent.split('\n');
  let currentEvent = null;
  
  for (let line of lines) {
    line = line.trim();
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.summary) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.summary = line.substring(8);
      } else if (line.startsWith('DTSTART')) {
        const timeMatch = line.match(/T(\d{2})(\d{2})/);
        if (timeMatch) {
          currentEvent.startTime = `${timeMatch[1]}:${timeMatch[2]}`;
        }
      } else if (line.startsWith('DTEND')) {
        const timeMatch = line.match(/T(\d{2})(\d{2})/);
        if (timeMatch && currentEvent.startTime) {
          const startHour = parseInt(currentEvent.startTime.split(':')[0]);
          const endHour = parseInt(timeMatch[1]);
          currentEvent.duration = endHour - startHour;
        }
      } else if (line.startsWith('RRULE')) {
        currentEvent.recurring = true;
        if (line.includes('BYDAY=')) {
          const dayMatch = line.match(/BYDAY=([^;]+)/);
          if (dayMatch) {
            const dayMap = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0 };
            currentEvent.days = dayMatch[1].split(',').map(d => dayMap[d.trim()] || 0);
          }
        }
      }
    }
  }
  
  return events;
}

// ============================================
// ENHANCED AI SCHEDULING ALGORITHM
// ============================================

function generateSmartSchedule(targetDate) {
  const dayOfWeek = targetDate.getDay();
  const dateStr = targetDate.toISOString().split('T')[0];
  
  // Check if this is today and get current hour
  const now = new Date();
  const isToday = dateStr === now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  
  // Get sleep schedule constraints
  const sleepSchedule = db.sleep_schedule || { bedtime: '23:00', wake_time: '07:00' };
  const sleepStart = parseTime(sleepSchedule.bedtime);
  const sleepEnd = parseTime(sleepSchedule.wake_time);
  
  // Get recurring events for this day
  const recurringEvents = (db.recurring_events || []).filter(event => {
    if (event.pattern === 'daily') return true;
    if (event.pattern === 'weekly' && event.days && event.days.includes(dayOfWeek)) return true;
    return false;
  }).map(event => {
    // Calculate end_time if not present
    if (!event.end_time && event.start_time && event.duration) {
      const startHour = parseTime(event.start_time);
      const endHour = startHour + (event.duration || 1);
      return { ...event, end_time: `${endHour.toString().padStart(2, '0')}:00` };
    }
    return event;
  });
  
  // Get tasks that need scheduling
  const pendingTasks = db.tasks.filter(t => 
    t.status !== 'completed' && 
    (!t.due_date || new Date(t.due_date) >= targetDate)
  );
  
  // Get energy patterns for this day
  const energyForDay = (db.energy_patterns || [])
    .filter(ep => ep.day_of_week === dayOfWeek)
    .reduce((acc, ep) => {
      const key = ep.hour;
      if (!acc[key]) acc[key] = { high: 0, medium: 0, low: 0 };
      acc[key][ep.energy_level]++;
      return acc;
    }, {});
  
  // Calculate available time slots
  const timeSlots = [];
  for (let hour = sleepEnd; hour < sleepStart; hour++) {
    // Skip past hours if scheduling for today
    if (isToday && hour <= currentHour) {
      continue;
    }
    
    let blocked = false;
    
    // Check if hour is blocked by recurring events
    for (const event of recurringEvents) {
      const eventStart = parseTime(event.start_time);
      const eventEnd = parseTime(event.end_time);
      if (hour >= eventStart && hour < eventEnd) {
        blocked = true;
        break;
      }
    }
    
    if (!blocked) {
      // Determine energy level for this hour
      const energyData = energyForDay[hour];
      let energyLevel = 'medium';
      if (energyData) {
        const max = Math.max(energyData.high, energyData.medium, energyData.low);
        if (energyData.high === max) energyLevel = 'high';
        else if (energyData.low === max) energyLevel = 'low';
      }
      
      timeSlots.push({
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        energy: energyLevel,
        available: true
      });
    }
  }
  
  // Smart task scheduling
  const scheduledTasks = [];
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    // Prioritize by: urgency > priority > energy match
    const urgencyA = a.due_date ? (new Date(a.due_date) - targetDate) / (1000 * 60 * 60 * 24) : 999;
    const urgencyB = b.due_date ? (new Date(b.due_date) - targetDate) / (1000 * 60 * 60 * 24) : 999;
    
    if (urgencyA < 3 && urgencyB >= 3) return -1;
    if (urgencyB < 3 && urgencyA >= 3) return 1;
    
    const priorityMap = { high: 3, medium: 2, low: 1 };
    return priorityMap[b.priority] - priorityMap[a.priority];
  });
  
  let slotIndex = 0;
  for (const task of sortedTasks) {
    if (slotIndex >= timeSlots.length) break;
    
    const requiredSlots = Math.ceil((task.estimated_hours || 1) / 1);
    
    // Find best time slot based on energy level
    let bestSlotIndex = slotIndex;
    if (task.energy_level) {
      for (let i = slotIndex; i < timeSlots.length - requiredSlots + 1; i++) {
        if (timeSlots[i].energy === task.energy_level) {
          bestSlotIndex = i;
          break;
        }
      }
    }
    
    if (bestSlotIndex + requiredSlots <= timeSlots.length) {
      const startSlot = timeSlots[bestSlotIndex];
      const endSlot = timeSlots[Math.min(bestSlotIndex + requiredSlots - 1, timeSlots.length - 1)];
      
      // Calculate urgency
      const daysUntilDue = task.due_date ? (new Date(task.due_date) - targetDate) / (1000 * 60 * 60 * 24) : 999;
      
      scheduledTasks.push({
        task_id: task.id,
        task,
        scheduled_date: dateStr,
        start_time: startSlot.time,
        end_time: `${(endSlot.hour + 1).toString().padStart(2, '0')}:00`,
        energy_level: startSlot.energy,
        reason: task.energy_level === startSlot.energy 
          ? 'Optimal energy match' 
          : daysUntilDue < 3 
            ? 'Urgent deadline' 
            : 'Best available slot'
      });
      
      slotIndex = bestSlotIndex + requiredSlots;
    }
  }
  
  return {
    date: dateStr,
    day_of_week: dayOfWeek,
    sleep_schedule: sleepSchedule,
    recurring_events: recurringEvents,
    available_slots: timeSlots,
    scheduled_tasks: scheduledTasks,
    total_tasks: scheduledTasks.length,
    total_hours: scheduledTasks.reduce((sum, st) => {
      const start = parseTime(st.start_time);
      const end = parseTime(st.end_time);
      return sum + (end - start);
    }, 0)
  };
}

function parseTime(timeStr) {
  const [hours] = timeStr.split(':').map(Number);
  return hours;
}

// Start server
app.listen(PORT, () => {
  console.log(`TaskFlow server running on http://localhost:${PORT}`);
});
