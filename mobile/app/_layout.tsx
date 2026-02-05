import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "../global.css";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View className="flex-1 bg-face-seek-deep-space">
        <Stack screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: '#0a0e27' }
        }} />
      </View>
    </SafeAreaProvider>
  );
}
