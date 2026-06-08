import 'react-native-url-polyfill/auto';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import WelcomeScreen from './src/screens/WelcomeScreen';
import PatientHomeScreen from './src/screens/PatientHomeScreen';
import UnitDetailsScreen from './src/screens/UnitDetailsScreen';
import UnitMapScreen from './src/screens/UnitMapScreen';
import CheckinScreen from './src/screens/CheckinScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfessionalDashboardScreen from './src/screens/ProfessionalDashboardScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();

const navHeader = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '800' },
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PatientHome" component={PatientHomeScreen} options={{ ...navHeader, title: 'Fluxo Saúde' }} />
        <Stack.Screen name="UnitDetails" component={UnitDetailsScreen} options={{ ...navHeader, title: 'Detalhes da Unidade' }} />
        <Stack.Screen name="UnitMap" component={UnitMapScreen} options={{ ...navHeader, title: 'Rota' }} />
        <Stack.Screen name="Checkin" component={CheckinScreen} options={{ ...navHeader, title: 'Check-in Digital' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ ...navHeader, title: 'Profissional' }} />
        <Stack.Screen name="ProfessionalDashboard" component={ProfessionalDashboardScreen} options={{ ...navHeader, title: 'Painel', headerBackVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
