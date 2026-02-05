import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { auth } from '../../services/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await auth.login(email, password);
      // Backend returns { access_token: "...", token_type: "bearer" }
      const { access_token } = response.data;
      
      await SecureStore.setItemAsync('auth_token', access_token);
      
      // Navigate to dashboard or home
      Alert.alert('Success', 'Login successful!');
      router.replace('/');
    } catch (error) {
      console.error(error);
      Alert.alert('Login Failed', 'Invalid credentials or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-face-seek-deep-space px-6">
      <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-8">
        <ArrowLeft color="white" size={24} />
      </TouchableOpacity>

      <View className="flex-1 justify-center -mt-20">
        <Text className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Welcome Back</Text>
        <Text className="text-slate-400 text-base mb-10">Sign in to access your dashboard</Text>

        <View className="space-y-4 gap-4">
          <View>
            <Text className="text-white font-bold mb-2 ml-1 text-xs uppercase tracking-wider">Email Address</Text>
            <View className="bg-face-seek-dark-slate border border-white/10 rounded-xl flex-row items-center px-4 h-14">
              <Mail color="#64748b" size={20} />
              <TextInput 
                className="flex-1 ml-3 text-white font-medium"
                placeholder="name@example.com"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View>
            <Text className="text-white font-bold mb-2 ml-1 text-xs uppercase tracking-wider">Password</Text>
            <View className="bg-face-seek-dark-slate border border-white/10 rounded-xl flex-row items-center px-4 h-14">
              <Lock color="#64748b" size={20} />
              <TextInput 
                className="flex-1 ml-3 text-white font-medium"
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleLogin}
            disabled={loading}
            className={`w-full bg-face-seek-cyan h-14 rounded-xl items-center justify-center mt-6 shadow-lg shadow-face-seek-cyan/20 ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? (
              <ActivityIndicator color="#0a0e27" />
            ) : (
              <Text className="text-face-seek-deep-space font-black text-lg uppercase">Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')} className="items-center mt-4">
            <Text className="text-slate-400 text-sm">
              Don't have an account? <Text className="text-face-seek-cyan font-bold">Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
