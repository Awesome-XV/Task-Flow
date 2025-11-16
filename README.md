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
- **Smart Schedule Generation**: AI creates optimized daily schedules based on your tasks, energy patterns, sleep schedule, and recurring events
- **Sleep Schedule Optimization**: Set your sleep schedule and choose to maximize sleep or maintain desired sleep duration
- **Intelligent Task Prioritization**: AI considers task urgency, priority level, estimated hours, and your energy patterns
- **Optimal Study Time Suggestions**: AI analyzes your energy patterns and suggests the best times to study
- **Project Decomposition**: Automatically breaks down large projects into 2-8 subtasks
- **Workload Balance**: AI monitors your task distribution and suggests balanced scheduling

### 📅 Advanced Scheduling
- **Recurring Events**: Create daily or weekly repeating events for classes, work, or regular activities
- **Manual Scheduling**: Override AI suggestions and manually schedule tasks at specific times
- **Schedule Timeline View**: Visual timeline showing tasks, recurring events, and sleep periods with energy level indicators
- **Google Calendar Integration**: Import events from Google Calendar (requires API setup)

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
- **Optional**: Google Cloud Console account (for Google Calendar integration)

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

3. **(Optional) Set up Google Calendar Integration**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Calendar API
   - Create OAuth 2.0 credentials:
     - Application type: Web application
     - Authorized redirect URIs: `http://localhost:3000/api/google/callback`
   - Copy the Client ID and Client Secret
   - Edit `server.js` and replace the placeholder values:
     ```javascript
     const GOOGLE_CLIENT_ID = 'your-client-id-here';
     const GOOGLE_CLIENT_SECRET = 'your-client-secret-here';
     ```

4. **Start the server**:
   ```powershell
   npm start
   ```

5. **Open your browser** and navigate to:
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

1. Click the **"+ New Task"** button in the quick actions
2. Fill in the task details:
   - **Title**: Name of your task
   - **Description**: Additional details (optional)
   - **Type**: Assignment, Exam, Activity, Project, or Study Session
   - **Priority**: High, Medium, or Low
   - **Due Date**: When the task is due
   - **Estimated Hours**: How long you think it will take
   - **Energy Level**: Preferred energy level for this task (helps AI scheduling)
3. Click **"Save Task"**

### Setting Up Recurring Events

1. Click **"+ Recurring Event"** in quick actions
2. Enter event details:
   - **Name**: Event title (e.g., "Math Class", "Work Shift")
   - **Start Time**: When the event begins (HH:MM format)
   - **Duration**: How long it lasts in hours
   - **Pattern**: Daily or Weekly
   - **Days**: For weekly events, select which days (Mon-Sun)
3. Click **"Add Event"**

### Configuring Sleep Schedule

1. Click **"💤 Sleep Schedule"** in quick actions
2. Set your schedule:
   - **Bedtime**: When you go to sleep (HH:MM format)
   - **Wake Time**: When you wake up (HH:MM format)
   - **Desired Hours**: Target sleep duration
   - **Maximize Sleep**: Check to use all available time for sleep
3. Click **"Save Schedule"**

### Generating Smart Schedule

1. Navigate to **"Smart Schedule"** view in the main navigation
2. Click **"Generate Schedule"** button
3. AI creates an optimized schedule considering:
   - Your sleep schedule (blocks scheduling during sleep hours)
   - Recurring events (classes, work, etc.)
   - Task deadlines and priority
   - Your energy patterns
   - Available time slots
4. View the timeline with color-coded blocks:
   - 🌙 **Sleep periods** (blue)
   - 📅 **Recurring events** (green)
   - 📝 **Scheduled tasks** with energy badges (high/medium/low)

### Manual Scheduling

1. Click **"📝 Manual Schedule"** button
2. Select a task from the dropdown
3. Choose the date
4. Select the time slot
5. Click **"Schedule Task"** to override AI suggestion

### Google Calendar Import

1. Click **"📅 Google Calendar"** in quick actions
2. Click **"Connect Google Calendar"**
3. Authorize the app in the popup window
4. Click **"Import Events"** to sync calendar events
5. Events will be added as recurring events in TaskFlow
6. To disconnect, click **"Disconnect"**

### Logging Energy Levels

To help the AI learn your energy patterns:

1. Click **"⚡ Log Energy"** in quick actions
2. Select your current energy level (Low, Medium, or High)
3. The system records the time and day to build your energy profile

### Recording Study Sessions

Track your study sessions to improve AI recommendations:

1. Click **"🕐 Study Session"** in quick actions
2. Select the task you worked on
3. Enter the duration in minutes
4. Rate your energy level during the session
5. Rate your productivity (1-10)
6. Click **"Save Session"**

### Viewing AI Recommendations

1. Click **"🤖 Recommendations"** in the navigation menu
2. View personalized recommendations including:
   - **Urgent Deadlines**: Tasks due within 3 days
   - **Optimal Study Times**: Best times to study based on your energy patterns
   - **Break Suggestions**: Recommendations for long tasks
   - **Task Balance**: Overview of your workload distribution

### Managing Tasks

- **Edit**: Click the ✏️ icon on any task card
- **Delete**: Click the 🗑️ icon on any task card
- **Complete Subtasks**: Check off subtasks as you complete them
- **Filter**: Use the navigation to view tasks by category

## 🛠️ Technology Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web application framework
- **googleapis**: Google Calendar API integration
- **open**: OAuth flow helper
- **UUID**: Unique ID generation

### Frontend
- **HTML5/CSS3**: Modern web standards
- **Vanilla JavaScript**: No framework dependencies
- **Responsive Design**: Mobile-first approach

### Database
- **JSON File Storage**: Lightweight, portable data storage with:
  - Tasks and subtasks
  - Recurring events
  - Energy patterns tracking
  - Study sessions history
  - Sleep schedule
  - Scheduled tasks
  - Google Calendar tokens

## 📂 Project Structure

```
Task-Flow/
├── public/
│   ├── index.html      # Main HTML file with all views and modals
│   ├── styles.css      # All styles including new scheduling features
│   └── app.js          # Frontend JavaScript with AI scheduling
├── server.js           # Express server, API routes & AI algorithms
├── package.json        # Dependencies and scripts
├── taskflow-data.json  # JSON database (auto-created)
└── README.md           # This file
```

## 🔌 API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task (auto-generates subtasks for >4hr tasks)
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/status` - Update task status

### Recurring Events
- `GET /api/recurring-events` - Get all recurring events
- `POST /api/recurring-events` - Create recurring event (daily/weekly)
- `DELETE /api/recurring-events/:id` - Delete recurring event

### Scheduling
- `POST /api/schedule/generate` - Generate AI-optimized schedule
- `POST /api/schedule/manual` - Manually schedule a task
- `GET /api/schedule` - Get current schedule
- `DELETE /api/schedule/:id` - Remove scheduled task

### Sleep Schedule
- `GET /api/sleep-schedule` - Get sleep schedule configuration
- `POST /api/sleep-schedule` - Update sleep schedule

### Energy & Study Sessions
- `POST /api/energy-patterns` - Log energy level
- `POST /api/study-sessions` - Record study session

### Analytics
- `GET /api/stats` - Get task statistics
- `GET /api/recommendations` - Get AI recommendations

### Google Calendar
- `GET /api/google/auth` - Initiate OAuth flow
- `GET /api/google/callback` - OAuth callback handler
- `POST /api/google/import` - Import calendar events
- `GET /api/google/status` - Check connection status
- `POST /api/google/disconnect` - Disconnect Google account

## 🎯 AI Algorithm Details

### Smart Schedule Generation
The AI scheduler considers multiple factors:
1. **Sleep Schedule**: Blocks out sleep hours, respects maximize sleep preference
2. **Recurring Events**: Reserves time for classes, work, and regular activities
3. **Energy Patterns**: Schedules high-priority tasks during your peak energy hours
4. **Task Urgency**: Prioritizes tasks with approaching deadlines
5. **Task Priority**: High priority tasks get scheduled first
6. **Available Time**: Finds optimal time slots that fit task duration

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

### Sleep Optimization
- **Maximize Sleep Mode**: Uses all time not occupied by tasks/events for sleep
- **Desired Hours Mode**: Maintains specific sleep duration while scheduling tasks
- Validates sleep schedule prevents task scheduling during sleep periods

## 🔮 Future Enhancements

- [ ] Multi-calendar integration (Outlook, iCal)
- [ ] Pomodoro timer built-in
- [ ] Team collaboration features
- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics dashboard with charts
- [ ] Export schedule (PDF, CSV, iCal)
- [ ] Push notifications and reminders
- [ ] Dark mode toggle
- [ ] Multiple user support with authentication
- [ ] Integration with learning management systems (Canvas, Blackboard)
- [ ] Voice input for tasks
- [ ] Habit tracking
- [ ] Weather-based scheduling adjustments

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

### Troubleshooting

**Server won't start**
- Make sure port 3000 is not in use
- Check that all dependencies are installed: `npm install`
- Verify Node.js version is 14 or higher: `node --version`

**Google Calendar not working**
- Ensure you've set up OAuth credentials correctly in Google Cloud Console
- Check that redirect URI matches exactly: `http://localhost:3000/api/google/callback`
- Verify Google Calendar API is enabled in Cloud Console
- Check that Client ID and Secret are correctly set in `server.js`

**Data not persisting**
- Check file permissions on `taskflow-data.json`
- Ensure the server has write access to the project directory
- Verify the file is not locked by another process

**Tasks not appearing in schedule**
- Verify tasks have due dates set
- Check that sleep schedule is configured
- Ensure there are available time slots after sleep and recurring events
- Try regenerating the schedule

**Schedule shows empty**
- Click "Generate Schedule" button in Smart Schedule view
- Ensure you have tasks with future due dates
- Check that your sleep schedule leaves available time
- Verify recurring events aren't blocking all available time

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

---

**Happy Studying! 📚✨**