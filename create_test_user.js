// Script to create a test user for debugging task submission
const axios = require('axios');

async function createTestUser() {
  try {
    console.log('🔍 Creating test user...');
    
    // Register a test user
    const userData = {
      name: 'testuser', // Backend expects 'name' field
      email: 'test@example.com',
      password: 'testpassword123',
      designation: 'user', // Required field
      parentId: 'admin123' // Required for user designation
    };
    
    const registerResponse = await axios.post(
      'http://localhost:3001/api/user/register',
      userData
    );
    
    console.log('✅ User registered successfully:', registerResponse.data);
    
    // Login to get the user ID
    const loginResponse = await axios.post(
      'http://localhost:3001/api/user/login',
      {
        username: userData.name, // Use name field
        password: userData.password
      }
    );
    
    console.log('✅ User logged in successfully:', loginResponse.data);
    
    if (loginResponse.data.user && loginResponse.data.user._id) {
      console.log(`\n🎯 Test User ID: ${loginResponse.data.user._id}`);
      return loginResponse.data.user._id;
    }
    
    return null;
  } catch (error) {
    if (error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️ User already exists, trying to login...');
      
      // Try to login with existing user
      try {
        const loginResponse = await axios.post(
          'http://localhost:3001/api/user/login',
          {
            username: 'testuser',
            password: 'testpassword123'
          }
        );
        
        console.log('✅ Logged in with existing user:', loginResponse.data);
        
        if (loginResponse.data.user && loginResponse.data.user._id) {
          console.log(`\n🎯 Existing User ID: ${loginResponse.data.user._id}`);
          return loginResponse.data.user._id;
        }
      } catch (loginError) {
        console.error('❌ Login failed:', loginError.response?.data || loginError.message);
      }
    } else {
      console.error('❌ Error creating user:', error.response?.data || error.message);
    }
    return null;
  }
}

createTestUser();
