// Test script for user management endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testUserManagement() {
  try {
    console.log('Testing user management endpoints...');
    
    // Generate a unique email for testing
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    
    // Test creating a user
    console.log('\n1. Testing user creation...');
    const createUserResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123',
        name: 'Test User',
        role: 'user'
      })
    });
    
    const createUserData = await createUserResponse.json();
    console.log('Create user response:', createUserData);
    
    if (createUserData.success) {
      console.log('✅ User created successfully');
      
      // Test updating user
      console.log('\n2. Testing user update...');
      const userId = createUserData.user.id;
      const updateUserResponse = await fetch(`${BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `updated-${timestamp}@example.com`,
          name: 'Updated User',
          role: 'editor'
        })
      });
      
      const updateUserData = await updateUserResponse.json();
      console.log('Update user response:', updateUserData);
      
      if (updateUserData.success) {
        console.log('✅ User updated successfully');
        
        // Test changing password
        console.log('\n3. Testing password change...');
        const changePasswordResponse = await fetch(`${BASE_URL}/api/users/${userId}/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: 'newpassword123'
          })
        });
        
        const changePasswordData = await changePasswordResponse.json();
        console.log('Change password response:', changePasswordData);
        
        if (changePasswordData.success) {
          console.log('✅ Password changed successfully');
          
          // Test deleting user
          console.log('\n4. Testing user deletion...');
          const deleteUserResponse = await fetch(`${BASE_URL}/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          const deleteUserData = await deleteUserResponse.json();
          console.log('Delete user response:', deleteUserData);
          
          if (deleteUserData.success) {
            console.log('✅ User deleted successfully');
            console.log('\n🎉 All tests passed!');
          } else {
            console.log('❌ Failed to delete user');
          }
        } else {
          console.log('❌ Failed to change password');
        }
      } else {
        console.log('❌ Failed to update user');
      }
    } else {
      console.log('❌ Failed to create user');
    }
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

// Run the test
testUserManagement();