import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your screens
import LandingPage from './frontend/LandingPage';
import ProfileSetup from './frontend/ProfileSetup';
import MainDashboard from './frontend/MainDashboard';
import ChatScreen from './frontend/ChatScreen';
import CallsScreen from './frontend/Call'; 
const Stack = createNativeStackNavigator();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Landing');

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        
        if (userToken) {
          setInitialRoute('Home');
        } else {
          setInitialRoute('Landing');
        }
      } catch (error) {
        console.error('Failed to check user token', error);
      } finally {
        setIsLoading(false); 
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Landing"
          component={LandingPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileSetup"
          component={ProfileSetup}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={MainDashboard}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChatScreen"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CallsScreen"
          component={CallsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0f0d',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;