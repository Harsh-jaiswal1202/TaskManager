// Script to get valid task IDs from the database
const axios = require('axios');

async function getTasks() {
  try {
    console.log('🔍 Fetching tasks from database...');
    
    const response = await axios.get('http://localhost:3001/api/tasks/all');
    const tasks = response.data;
    
    console.log(`Found ${tasks.length} tasks:`);
    tasks.forEach((task, index) => {
      console.log(`${index + 1}. ID: ${task._id}, Name: ${task.name || 'Unnamed'}, Type: ${task.type}`);
    });
    
    if (tasks.length > 0) {
      console.log(`\n✅ Using first task ID for testing: ${tasks[0]._id}`);
      return tasks[0]._id;
    } else {
      console.log('❌ No tasks found in database');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching tasks:', error.response?.data || error.message);
    return null;
  }
}

getTasks();
