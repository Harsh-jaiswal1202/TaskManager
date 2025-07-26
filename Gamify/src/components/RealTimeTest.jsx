import React, { useEffect, useState } from 'react';
import { eventManager } from '../utils/eventManager.js';

const RealTimeTest = () => {
  const [events, setEvents] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Subscribe to all events for testing
    const unsubscribe = eventManager.subscribeToAll((eventType, data) => {
      console.log(`🧪 RealTimeTest received event: ${eventType}`, data);
      setEvents(prev => [{
        type: eventType,
        data: data,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 9)]); // Keep last 10 events
    });

    return unsubscribe;
  }, []);

  const testTaskCompleted = () => {
    eventManager.emitTaskCompleted({
      taskId: 'test-task-123',
      taskName: 'Test Task',
      pointsEarned: 100,
      newTotalXP: 1500,
      currentStreak: 5
    });
  };

  const testTaskCreated = () => {
    eventManager.emitTaskCreated({
      taskId: 'test-task-456',
      taskName: 'New Test Task',
      batchId: 'test-batch-123',
      points: 150
    });
  };

  const testBatchCreated = () => {
    eventManager.emitBatchCreated({
      batchId: 'test-batch-789',
      batchName: 'Test Batch',
      totalUsersAffected: 5
    });
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600"
        >
          🧪 Test Real-time
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">🧪 Real-time Test</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testTaskCompleted}
          className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
        >
          Test Task Completed
        </button>
        <button
          onClick={testTaskCreated}
          className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          Test Task Created
        </button>
        <button
          onClick={testBatchCreated}
          className="w-full bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
        >
          Test Batch Created
        </button>
      </div>

      <div className="max-h-40 overflow-y-auto">
        <h4 className="font-semibold text-sm mb-2">Recent Events:</h4>
        {events.length === 0 ? (
          <p className="text-gray-500 text-xs">No events yet</p>
        ) : (
          <div className="space-y-1">
            {events.map((event, index) => (
              <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                <div className="font-medium text-gray-700">{event.type}</div>
                <div className="text-gray-500">{event.timestamp}</div>
                <div className="text-gray-600 truncate">
                  {JSON.stringify(event.data).substring(0, 50)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeTest; 