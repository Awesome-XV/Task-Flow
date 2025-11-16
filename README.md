# 📚 TaskFlow - Smart Task Manager for Students

A smart task manager specifically designed for students that integrates assignment deadlines, exam schedules, and extracurricular activities. TaskFlow uses AI to suggest optimal study times based on your energy patterns and automatically breaks large projects into manageable steps.

## ✨ Features

### 🎯 Task Management
- **Unified Dashboard**: Manage all your tasks in one place - assignments, exams, projects, and activities
- **Smart Categorization**: Filter and view tasks by type (assignments, exams, activities)
- **Priority System**: High, medium, and low priority levels with visual indicators
- **Status Tracking**: Track tasks as pending, in progress, or completed
- **Subtask Breakdown**: Large projects (>4 hours) are automatically broken into manageable subtasks

### 🤖 AI-Powered Features
- **Energy Pattern Learning**: Log your energy levels throughout the day
- **Optimal Study Time Suggestions**: AI analyzes your energy patterns and suggests the best times to study
- **Smart Scheduling**: Recommendations based on task urgency, priority, and your energy levels
- **Project Decomposition**: Automatically breaks down large projects into 2-8 subtasks
- **Workload Balance**: AI monitors your task distribution and suggests balanced scheduling

### 📊 Analytics & Insights
- **Real-time Statistics**: View total, pending, in-progress, completed, and overdue tasks
- **Study Session Tracking**: Record study sessions with duration, energy level, and productivity ratings
- **Progress Visualization**: Track completion progress on tasks with subtasks
- **Energy Insights**: Build a profile of your productive hours over time

### 🎨 Modern Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Intuitive UI**: Clean, modern interface with easy navigation
- **Visual Feedback**: Color-coded priorities, status badges, and progress indicators
- **Dark Mode Ready**: Designed with accessibility in mind

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/Awesome-XV/Task-Flow.git
   cd Task-Flow
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

3. **Start the server**:
   ```powershell
   npm start
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

### Development Mode

For development with auto-restart on file changes:
```powershell
npm run dev
```

## 📖 How to Use

### Creating Your First Task

1. Click the **"+ New Task"** button in the sidebar
2. Fill in the task details:
   - **Title**: Name of your task
   - **Description**: Additional details (optional)
   - **Type**: Assignment, Exam, Activity, Project, or Study Session
   - **Priority**: High, Medium, or Low
   - **Due Date**: When the task is due
   - **Estimated Hours**: How long you think it will take
   - **Energy Level**: Preferred energy level for this task (helps AI scheduling)
3. Click **"Save Task"**

### Logging Energy Levels

To help the AI learn your energy patterns:

1. Click **"⚡ Log Energy"** in the sidebar
2. Select your current energy level (Low, Medium, or High)
3. The system records the time and day to build your energy profile

### Recording Study Sessions

Track your study sessions to improve AI recommendations:

1. Click **"🕐 Study Session"** in the sidebar
2. Select the task you worked on
3. Enter the duration in minutes
4. Rate your energy level during the session
5. Rate your productivity (1-10)
6. Click **"Save Session"**

### Viewing AI Recommendations

1. Click **"🤖 AI Suggestions"** in the navigation menu
2. View personalized recommendations including:
   - **Urgent Deadlines**: Tasks due within 3 days
   - **Optimal Study Times**: Best times to study based on your energy patterns
   - **Break Suggestions**: Recommendations for long tasks
   - **Task Balance**: Overview of your workload distribution

### Managing Tasks

- **Edit**: Click the ✏️ icon on any task card
- **Delete**: Click the 🗑️ icon on any task card
- **Complete Subtasks**: Check off subtasks as you complete them
- **Filter**: Use the priority and status filters to find specific tasks

## 🛠️ Technology Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web application framework
- **better-sqlite3**: Fast, lightweight database
- **UUID**: Unique ID generation

### Frontend
- **HTML5/CSS3**: Modern web standards
- **Vanilla JavaScript**: No framework dependencies
- **Responsive Design**: Mobile-first approach

### Database
- **SQLite**: Embedded database with:
  - Tasks and subtasks tables
  - Energy patterns tracking
  - Study sessions history

## 📂 Project Structure

```
Task-Flow/
├── public/
│   ├── index.html      # Main HTML file
│   ├── styles.css      # All styles and themes
│   └── app.js          # Frontend JavaScript
├── server.js           # Express server & API routes
├── package.json        # Dependencies and scripts
├── taskflow.db         # SQLite database (auto-created)
└── README.md           # This file
```

## 🔌 API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Subtasks
- `PUT /api/subtasks/:id` - Update subtask status

### Energy & Sessions
- `POST /api/energy-patterns` - Log energy level
- `POST /api/study-sessions` - Record study session

### Analytics
- `GET /api/stats` - Get statistics
- `GET /api/recommendations` - Get AI recommendations

## 🎯 AI Algorithm Details

### Energy Pattern Analysis
The system tracks:
- Day of week
- Hour of day
- Energy level (high/medium/low)
- Frequency of patterns

### Study Time Recommendations
AI considers:
- Historical energy patterns
- Task urgency (days until due date)
- Task priority level
- Estimated effort required
- Your current energy level

### Project Breakdown
Tasks estimated at >4 hours are automatically divided into:
1. Research and planning
2. Outline and structure
3. Draft sections
4. Review and edit
5. Finalize and polish

(Up to 8 phases based on total estimated hours)

## 🔮 Future Enhancements

- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Pomodoro timer built-in
- [ ] Team collaboration features
- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Export data (PDF, CSV)
- [ ] Notifications and reminders
- [ ] Dark mode toggle
- [ ] Multiple user support with authentication
- [ ] Integration with learning management systems (Canvas, Blackboard)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

Created with ❤️ for students who want to manage their time better and achieve more.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

---

**Happy Studying! 📚✨**