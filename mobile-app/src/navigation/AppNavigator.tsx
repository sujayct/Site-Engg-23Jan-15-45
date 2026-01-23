import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../utils/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import EngineerDashboard from '../screens/EngineerDashboard';
import HRDashboard from '../screens/HRDashboard';
import ClientDashboard from '../screens/ClientDashboard';
import AdminDashboard from '../screens/AdminDashboard';
import CheckInScreen from '../screens/CheckInScreen';
import ReportScreen from '../screens/ReportScreen';
import LeaveScreen from '../screens/LeaveScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {!user ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ title: 'Forgot Password' }}
            />
          </>
        ) : (
          <>
            {user.role === 'engineer' && (
              <>
                <Stack.Screen
                  name="EngineerDashboard"
                  component={EngineerDashboard}
                  options={{ title: 'Engineer Dashboard' }}
                />
                <Stack.Screen
                  name="CheckIn"
                  component={CheckInScreen}
                  options={{ title: 'Check In' }}
                />
                <Stack.Screen
                  name="Report"
                  component={ReportScreen}
                  options={{ title: 'Daily Report' }}
                />
                <Stack.Screen
                  name="Leave"
                  component={LeaveScreen}
                  options={{ title: 'Leave Request' }}
                />
              </>
            )}
            {user.role === 'hr' && (
              <Stack.Screen
                name="HRDashboard"
                component={HRDashboard}
                options={{ title: 'HR Dashboard' }}
              />
            )}
            {user.role === 'client' && (
              <Stack.Screen
                name="ClientDashboard"
                component={ClientDashboard}
                options={{ title: 'Client Dashboard' }}
              />
            )}
            {user.role === 'admin' && (
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboard}
                options={{ title: 'Admin Dashboard' }}
              />
            )}
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'My Profile' }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ title: 'Change Password' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
