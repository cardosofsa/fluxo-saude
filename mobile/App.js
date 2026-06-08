import 'react-native-url-polyfill/auto';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import WelcomeScreen from './src/screens/WelcomeScreen';
import PatientHomeScreen from './src/screens/PatientHomeScreen';
import MapaScreen from './src/screens/MapaScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UnitDetailsScreen from './src/screens/UnitDetailsScreen';
import UnitMapScreen from './src/screens/UnitMapScreen';
import CheckinScreen from './src/screens/CheckinScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfessionalDashboardScreen from './src/screens/ProfessionalDashboardScreen';
import HandoverScreen from './src/screens/HandoverScreen';
import AdminScreen from './src/screens/AdminScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navHeader = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '800' },
};

const tabIcon = (emoji) => ({ color }) => <Text style={{ fontSize: 18, color }}>{emoji}</Text>;

function PatientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...navHeader,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen name="Inicio" component={PatientHomeScreen} options={{ title: 'Fluxo Saúde', tabBarLabel: 'Início', tabBarIcon: tabIcon('🏠') }} />
      <Tab.Screen name="Mapa" component={MapaScreen} options={{ title: 'Mapa de Transparência', tabBarLabel: 'Mapa', tabBarIcon: tabIcon('🗺️') }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Meu Perfil', tabBarLabel: 'Perfil', tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PatientTabs" component={PatientTabs} options={{ headerShown: false }} />
        <Stack.Screen name="UnitDetails" component={UnitDetailsScreen} options={{ ...navHeader, title: 'Detalhes da Unidade' }} />
        <Stack.Screen name="UnitMap" component={UnitMapScreen} options={{ ...navHeader, title: 'Rota' }} />
        <Stack.Screen name="Checkin" component={CheckinScreen} options={{ ...navHeader, title: 'Check-in Digital' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ ...navHeader, title: 'Profissional' }} />
        <Stack.Screen name="ProfessionalDashboard" component={ProfessionalDashboardScreen} options={{ ...navHeader, title: 'Painel', headerBackVisible: false }} />
        <Stack.Screen name="Handover" component={HandoverScreen} options={{ ...navHeader, title: 'Passagem de Plantão' }} />
        <Stack.Screen name="Admin" component={AdminScreen} options={{ ...navHeader, title: 'Painel Admin' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
