/**
 * Global Event Manager for Real-time Updates
 * Handles communication between components and ensures immediate data updates
 */

class EventManager {
  constructor() {
    this.listeners = new Map();
    this.globalListeners = new Set();
  }

  // Subscribe to specific events
  subscribe(eventType, callback, options = {}) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    const listener = {
      callback,
      options,
      id: Date.now() + Math.random()
    };
    
    this.listeners.get(eventType).add(listener);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(eventType);
      if (eventListeners) {
        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  // Subscribe to all events
  subscribeToAll(callback) {
    this.globalListeners.add(callback);
    
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  // Emit event to all listeners
  emit(eventType, data = {}) {
    console.log(`📡 EventManager: Emitting ${eventType}`, data);
    
    // Notify specific event listeners
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
    
    // Notify global listeners
    this.globalListeners.forEach(callback => {
      try {
        callback(eventType, data);
      } catch (error) {
        console.error('Error in global event listener:', error);
      }
    });
    
    // Also dispatch as DOM event for backward compatibility
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventType, { detail: data }));
    }
  }

  // Task-related events
  emitTaskCompleted(taskData) {
    this.emit('taskCompleted', {
      type: 'taskCompleted',
      taskStatus: 'completed',
      ...taskData
    });
  }

  emitTaskCreated(taskData) {
    this.emit('taskCreated', {
      type: 'taskCreated',
      ...taskData
    });
  }

  emitTaskAssigned(taskData) {
    this.emit('taskAssigned', {
      type: 'taskAssigned',
      ...taskData
    });
  }

  emitBatchCreated(batchData) {
    this.emit('batchCreated', {
      type: 'batchCreated',
      ...batchData
    });
  }

  emitBatchEnrolled(batchData) {
    this.emit('batchEnrolled', {
      type: 'batchEnrolled',
      ...batchData
    });
  }

  emitProgressUpdate(progressData) {
    this.emit('progressUpdate', {
      type: 'progressUpdate',
      ...progressData
    });
  }

  emitUserUpdate(userData) {
    this.emit('userUpdate', {
      type: 'userUpdate',
      ...userData
    });
  }

  // Data refresh events
  emitDataRefresh(dataType) {
    this.emit('dataRefresh', {
      type: 'dataRefresh',
      dataType
    });
  }

  // Clear all listeners
  clear() {
    this.listeners.clear();
    this.globalListeners.clear();
  }
}

// Global event manager instance
export const eventManager = new EventManager();

// Convenience functions for common events
export const emitTaskCompleted = (taskData) => eventManager.emitTaskCompleted(taskData);
export const emitTaskCreated = (taskData) => eventManager.emitTaskCreated(taskData);
export const emitTaskAssigned = (taskData) => eventManager.emitTaskAssigned(taskData);
export const emitBatchCreated = (batchData) => eventManager.emitBatchCreated(batchData);
export const emitBatchEnrolled = (batchData) => eventManager.emitBatchEnrolled(batchData);
export const emitProgressUpdate = (progressData) => eventManager.emitProgressUpdate(progressData);
export const emitUserUpdate = (userData) => eventManager.emitUserUpdate(userData);
export const emitDataRefresh = (dataType) => eventManager.emitDataRefresh(dataType);

export default eventManager; 