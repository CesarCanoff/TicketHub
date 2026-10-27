import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import LoginScreen from '../screens/LoginScreen';
import ChamadosListScreen from '../screens/ChamadosListScreen';
import CreateChamadoScreen from '../screens/CreateChamadoScreen';
import ChamadoDetailsScreen from '../screens/ChamadoDetailsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!usuario ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="ChamadosList" component={ChamadosListScreen} />
            <Stack.Screen
              name="CreateChamado"
              component={CreateChamadoScreen}
              options={{ headerShown: true, title: 'Novo chamado' }}
            />
            <Stack.Screen
              name="ChamadoDetails"
              component={ChamadoDetailsScreen}
              options={{ headerShown: true, title: 'Detalhes' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
