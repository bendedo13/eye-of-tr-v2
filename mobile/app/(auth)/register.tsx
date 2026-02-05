import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react-native';
import { auth } from '../../services/api';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await auth.register({
        email,
        password,
        full_name: fullName,
      });
      
      Alert.alert('Success', 'Account created successfully! Please login.');
      router.replace('/login');
    } catch (error) {
      console.error(error);
      Alert.alert('Registration Failed', 'Could not create account. Email might be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-face-seek-deep-space px-6">
      <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-4">
        <ArrowLeft color="white" size={24} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="justify-center mt-4">
          <Text className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Create Account</Text>
          <Text className="text-slate-400 text-base mb-10">Join FaceSeek for secure visual intelligence</Text>

          <View className="space-y-4 gap-4">
            <View>
              <Text className="text-white font-bold mb-2 ml-1 text-xs uppercase tracking-wider">Full Name</Text>
              <View className="bg-face-seek-dark-slate border border-white/10 rounded-xl flex-row items-center px-4 h-14">
                <User color="#64748b" size={20} />
                <TextInput 
                  className="flex-1 ml-3 text-white font-medium"
                  placeholder="John Doe"
                  placeholderTextColor="#64748b"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

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
              onPress={handleRegister}
              disabled={loading}
              className={`w-full bg-face-seek-cyan h-14 rounded-xl items-center justify-center mt-6 shadow-lg shadow-face-seek-cyan/20 ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? (
                <ActivityIndicator color="#0a0e27" />
              ) : (
                <Text className="text-face-seek-deep-space font-black text-lg uppercase">Register</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')} className="items-center mt-4 mb-10">
              <Text className="text-slate-400 text-sm">
                Already have an account? <Text className="text-face-seek-cyan font-bold">Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
