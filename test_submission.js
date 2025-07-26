// Test script to reproduce the task submission error
const axios = require('axios');
const FormData = require('form-data');

async function testTaskSubmission() {
  try {
    console.log('🧪 Testing task submission...');
    
    // First, create a test user and get their ID
    console.log('🔧 Creating test user first...');
    let testUserId;
    
    try {
      const userResponse = await axios.post('http://localhost:3001/api/user/register', {
        name: `testuser${Date.now()}`, // Use unique name
        email: `test${Date.now()}@example.com`, // Use unique email
        password: 'testpassword123',
        designation: 'user',
        parentId: 'admin123'
      });
      
      testUserId = userResponse.data.userId;
      console.log('✅ Test user created with ID:', testUserId);
    } catch (userError) {
      if (userError.response?.data?.message?.includes('already exists')) {
        // Use existing test user ID if available
        console.log('ℹ️ Using existing test user...');
        testUserId = '6881070cb0a2c9b7ee5df4227'; // Use the ID from previous creation
        console.log('✅ Using existing user ID:', testUserId);
      } else {
        throw userError;
      }
    }
    
    // Create FormData just like the frontend does
    const formData = new FormData();
    formData.append('userId', testUserId); // Use valid user ID
    formData.append('submissionType', 'Text Entry');
    formData.append('value', 'Debug test submission from Node.js');
    
    // Use a valid task ID from the database
    const taskId = '68792204389817bbc9bd7aed'; // Valid task ID from database
    
    const response = await axios.post(
      `http://localhost:3001/api/task/${taskId}/submit`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testTaskSubmission();
