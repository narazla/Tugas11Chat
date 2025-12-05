// App.tsx
import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ActivityIndicator, View} from 'react-native';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ChatScreen from './screens/ChatScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Chat: {username: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const CURRENT_USER_KEY = 'currentUser';

const App = () => {
  const [initialRoute, setInitialRoute] = useState<
    'Login' | 'Chat' | undefined
  >();
  const [initialParams, setInitialParams] = useState<any>();

  // Auto-login: cek apakah user sudah pernah login
  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        const raw = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (raw) {
          const user = JSON.parse(raw);
          if (user.username) {
            // User sudah pernah login, langsung ke ChatScreen
            setInitialRoute('Chat');
            setInitialParams({username: user.username});
            return;
          }
        }
      } catch (e) {
        console.warn('Auto-login check error', e);
      }
      // Tidak ada user login, ke LoginScreen
      setInitialRoute('Login');
    };

    checkAutoLogin();
  }, []);

  // Tampilkan loading sementara mengecek auto-login
  if (!initialRoute) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen}
          initialParams={initialParams}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;