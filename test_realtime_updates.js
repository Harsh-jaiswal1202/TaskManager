const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'your_test_user_id'; // Replace with actual test user ID
const TEST_BATCH_ID = 'your_test_batch_id'; // Replace with actual test batch ID

// Test real-time updates
async function testRealTimeUpdates() {
  console.log('🧪 Testing Real-time Updates...\n');

  try {
    // Test 1: Create a task and verify it appears immediately
    console.log('📝 Test 1: Creating a task...');
    const taskData = {
      name: 'Test Real-time Task',
      description: 'This is a test task for real-time updates',
      details: 'Complete this task to test real-time functionality',
      category: 'your_category_id', // Replace with actual category ID
      difficulty: 'Beginner',
      batch: TEST_BATCH_ID,
      points: 100,
      type: 'Mini-project'
    };

    const createTaskResponse = await axios.post(`${BASE_URL}/api/task/create`, taskData, {
      withCredentials: true
    });

    if (createTaskResponse.data.success) {
      console.log('✅ Task created successfully');
      console.log('📊 Real-time data:', createTaskResponse.data.realTimeData);
    } else {
      console.log('❌ Task creation failed');
    }

    // Test 2: Submit a task and verify progress updates
    console.log('\n📝 Test 2: Submitting a task...');
    const taskId = createTaskResponse.data.task._id;
    
    const submissionData = new FormData();
    submissionData.append('userId', TEST_USER_ID);
    submissionData.append('submissionType', 'Text Entry');
    submissionData.append('value', 'This is a test submission for real-time updates');

    const submitTaskResponse = await axios.post(`${BASE_URL}/api/task/${taskId}/submit`, submissionData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (submitTaskResponse.data.success) {
      console.log('✅ Task submitted successfully');
      console.log('📊 Real-time data:', submitTaskResponse.data.realTimeData);
    } else {
      console.log('❌ Task submission failed');
    }

    // Test 3: Check user progress immediately after submission
    console.log('\n📝 Test 3: Checking user progress...');
    const progressResponse = await axios.get(`${BASE_URL}/api/batch-progress/dashboard/${TEST_USER_ID}`, {
      withCredentials: true
    });

    if (progressResponse.data.success) {
      console.log('✅ User progress retrieved successfully');
      const dashboard = progressResponse.data.dashboard;
      console.log('📊 Overall stats:', dashboard.overallStats);
      console.log('📊 Batch progress:', dashboard.batchProgress.length, 'batches');
    } else {
      console.log('❌ Failed to retrieve user progress');
    }

    // Test 4: Check batch progress
    console.log('\n📝 Test 4: Checking batch progress...');
    const batchProgressResponse = await axios.get(`${BASE_URL}/api/batch-progress/batch/${TEST_BATCH_ID}`, {
      withCredentials: true
    });

    if (batchProgressResponse.data.success) {
      console.log('✅ Batch progress retrieved successfully');
      console.log('📊 Students in batch:', batchProgressResponse.data.studentsProgress.length);
    } else {
      console.log('❌ Failed to retrieve batch progress');
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Test batch creation and enrollment
async function testBatchOperations() {
  console.log('\n🧪 Testing Batch Operations...\n');

  try {
    // Test 1: Create a batch
    console.log('📝 Test 1: Creating a batch...');
    const batchData = {
      name: 'Test Real-time Batch',
      description: 'This is a test batch for real-time updates',
      industryFocus: 'Technology',
      difficultyLevel: 'Beginner',
      estimatedDuration: 4,
      learningObjectives: ['Test objective 1', 'Test objective 2']
    };

    const createBatchResponse = await axios.post(`${BASE_URL}/api/batches/`, batchData, {
      withCredentials: true
    });

    if (createBatchResponse.data.success) {
      console.log('✅ Batch created successfully');
      const batchId = createBatchResponse.data.batch._id;
      
      // Test 2: Enroll user in batch
      console.log('\n📝 Test 2: Enrolling user in batch...');
      const enrollData = {
        userId: TEST_USER_ID
      };

      const enrollResponse = await axios.post(`${BASE_URL}/api/batches/${batchId}/enroll`, enrollData, {
        withCredentials: true
      });

      if (enrollResponse.data.success) {
        console.log('✅ User enrolled successfully');
      } else {
        console.log('❌ User enrollment failed');
      }
    } else {
      console.log('❌ Batch creation failed');
    }

  } catch (error) {
    console.error('❌ Batch test failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Real-time Update Tests...\n');
  
  await testBatchOperations();
  await testRealTimeUpdates();
  
  console.log('\n🏁 All tests completed!');
}

// Export for use in other files
module.exports = {
  testRealTimeUpdates,
  testBatchOperations,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
} 