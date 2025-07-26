# Real-Time Updates System

This document describes the comprehensive real-time update system implemented to ensure immediate data synchronization across all dashboards (Admin, Mentor, and User) when tasks are created, assigned, or completed.

## Overview

The real-time update system consists of several interconnected components that work together to provide immediate data updates:

1. **Backend Real-time Data Generation** - Enhanced API responses with comprehensive real-time data
2. **Frontend Data Refresh Manager** - Centralized cache invalidation and data refresh
3. **Event Manager** - Global event system for component communication
4. **Real-time Data Hooks** - React hooks for automatic data management
5. **Automatic Cache Invalidation** - Immediate cache clearing on data changes

## Architecture

### 1. Backend Components

#### Enhanced API Responses
All critical API endpoints now return comprehensive real-time data:

```javascript
// Example response structure
{
  success: true,
  data: { /* main response data */ },
  realTimeData: {
    taskStatus: 'completed',
    taskId: 'task_id',
    batchId: 'batch_id',
    userId: 'user_id',
    pointsEarned: 100,
    newTotalXP: 1500,
    currentStreak: 5,
    completionTime: '2024-01-01T00:00:00.000Z',
    batchProgress: {
      completedTasks: 10,
      totalTasks: 20,
      completionPercentage: 50,
      totalPointsEarned: 1000
    }
  }
}
```

#### Updated Controllers

**Task Controller (`backend/controllers/Task.js`)**
- Enhanced `createTask` function with real-time data
- Enhanced `submitTask` function with comprehensive progress data
- Immediate user progress updates

**Batch Progress Controller (`backend/controllers/BatchProgress.js`)**
- Enhanced `handleTaskSubmission` with real-time metrics
- Comprehensive progress tracking
- Streak calculation and XP updates

### 2. Frontend Components

#### Data Refresh Manager (`Gamify/src/services/api.js`)

```javascript
class DataRefreshManager {
  // Subscribe to data updates
  subscribe(key, callback)
  
  // Notify all listeners of data changes
  notify(key, data)
  
  // Invalidate cache and notify listeners
  invalidate(key)
  
  // Force refresh specific data
  async refresh(key, fetchFunction)
}
```

#### Event Manager (`Gamify/src/utils/eventManager.js`)

```javascript
// Global event system
const eventManager = new EventManager();

// Emit events
eventManager.emitTaskCompleted(taskData);
eventManager.emitTaskCreated(taskData);
eventManager.emitBatchCreated(batchData);
eventManager.emitProgressUpdate(progressData);
```

#### Real-time Data Hooks (`Gamify/src/hooks/useRealTimeData.js`)

```javascript
// Automatic data management hooks
const { data, loading, error, refresh } = useDashboardData(userId);
const { data, loading, error, refresh } = useBatchProgressData(batchId);
const { data, loading, error, refresh } = useTasksData();
const { data, loading, error, refresh } = useBatchesData();
```

## Implementation Details

### 1. Task Creation Flow

1. **Admin creates task** → `POST /api/task/create`
2. **Backend processes** → Updates batch progress for all users
3. **Response includes** → Real-time data with task details
4. **Frontend receives** → Cache invalidation + event emission
5. **All dashboards update** → Immediate reflection of new task

### 2. Task Submission Flow

1. **User submits task** → `POST /api/task/{id}/submit`
2. **Backend processes** → Updates user progress, XP, streak
3. **Response includes** → Comprehensive real-time data
4. **Frontend receives** → Cache invalidation + event emission
5. **All dashboards update** → Immediate progress reflection

### 3. Batch Operations Flow

1. **Admin creates/enrolls** → `POST /api/batches/` or `POST /api/batches/{id}/enroll`
2. **Backend processes** → Updates batch and user data
3. **Response includes** → Real-time batch data
4. **Frontend receives** → Cache invalidation + event emission
5. **All dashboards update** → Immediate batch reflection

## Usage Examples

### Using Real-time Data Hooks

```javascript
import { useDashboardData, useTasksData } from '../hooks/useRealTimeData';

function MyComponent() {
  const { data: dashboard, loading, refresh } = useDashboardData(userId);
  const { data: tasks } = useTasksData();

  // Data automatically updates when changes occur
  return (
    <div>
      {loading ? <Loading /> : <Dashboard data={dashboard} />}
    </div>
  );
}
```

### Using Event Manager

```javascript
import { eventManager } from '../utils/eventManager';

// Subscribe to events
useEffect(() => {
  const unsubscribe = eventManager.subscribe('taskCompleted', (data) => {
    console.log('Task completed:', data);
    // Handle task completion
  });

  return unsubscribe;
}, []);

// Emit events
eventManager.emitTaskCompleted({
  taskId: 'task_123',
  pointsEarned: 100,
  newTotalXP: 1500
});
```

### Manual Cache Invalidation

```javascript
import { dataRefreshManager } from '../services/api';

// Invalidate specific data
dataRefreshManager.invalidate('dashboard');
dataRefreshManager.invalidate('tasks');

// Force refresh
await dataRefreshManager.refresh('dashboard', fetchDashboardData);
```

## Automatic Updates

### 1. Window Focus/Visibility
- Data refreshes when user returns to the application
- Ensures latest data is always displayed

### 2. Periodic Refresh
- Automatic refresh every 30 seconds for user pages
- Configurable intervals for different page types

### 3. Event-Driven Updates
- Immediate updates on task completion
- Real-time progress tracking
- Cross-component communication

## Testing

Use the provided test script to verify real-time updates:

```bash
node test_realtime_updates.js
```

The test script verifies:
- Task creation and immediate reflection
- Task submission and progress updates
- User progress synchronization
- Batch operations and updates

## Configuration

### Environment Variables

```javascript
// config/environment.js
export default {
  REAL_TIME: {
    PERIODIC_REFRESH: {
      USER_PAGES: 30000, // 30 seconds
      ADMIN_PAGES: 60000, // 60 seconds
    },
    TASK_COMPLETION_DELAY: 500, // 500ms delay for backend processing
  }
};
```

### Cache Configuration

```javascript
// Data refresh manager settings
const CACHE_KEYS = {
  DASHBOARD: 'dashboard',
  TASKS: 'tasks',
  BATCHES: 'batches',
  BATCH_PROGRESS: 'batch-progress',
  USER_PROGRESS: 'user-progress'
};
```

## Troubleshooting

### Common Issues

1. **Data not updating immediately**
   - Check if cache invalidation is working
   - Verify event listeners are properly subscribed
   - Ensure backend is returning real-time data

2. **Multiple API calls**
   - Check for duplicate event listeners
   - Verify cache is being used properly
   - Ensure proper cleanup on component unmount

3. **Performance issues**
   - Reduce periodic refresh intervals
   - Implement proper debouncing
   - Use selective cache invalidation

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('debug', 'true');

// Check real-time events
window.addEventListener('taskCompleted', (e) => {
  console.log('Task completed event:', e.detail);
});
```

## Benefits

1. **Immediate Updates** - No manual refresh required
2. **Consistent Data** - All dashboards show same information
3. **Better UX** - Users see changes instantly
4. **Reduced Server Load** - Smart caching and selective updates
5. **Scalable** - Event-driven architecture supports growth

## Future Enhancements

1. **WebSocket Integration** - Real-time push notifications
2. **Offline Support** - Queue updates when offline
3. **Optimistic Updates** - UI updates before server confirmation
4. **Conflict Resolution** - Handle concurrent updates
5. **Analytics Integration** - Track real-time usage patterns 