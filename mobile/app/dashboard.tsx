import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Settings, LogOut, CreditCard, Activity } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { auth } from '../services/api';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await auth.me();
      setUser(res.data);
    } catch (error) {
      console.error(error);
      // If auth fails, redirect to login
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    router.replace('/login');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-face-seek-deep-space items-center justify-center">
        <ActivityIndicator color="#00d9ff" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-face-seek-deep-space">
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-white/5 bg-black/20">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white font-black text-lg uppercase tracking-wider">Dashboard</Text>
        <TouchableOpacity onPress={handleLogout}>
            <LogOut color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="items-center mb-8">
            <View className="w-24 h-24 bg-face-seek-cyan/10 rounded-full items-center justify-center border-2 border-face-seek-cyan/30 mb-4">
                <User size={40} color="#00d9ff" />
            </View>
            <Text className="text-white font-black text-2xl">{user?.full_name || 'User'}</Text>
            <Text className="text-slate-400">{user?.email}</Text>
            <View className="mt-2 bg-face-seek-green/10 px-3 py-1 rounded-full border border-face-seek-green/20">
                <Text className="text-face-seek-green text-xs font-bold uppercase">Active Subscription</Text>
            </View>
        </View>

        <View className="space-y-4">
            <View className="flex-row gap-4">
                <View className="flex-1 bg-face-seek-dark-slate p-4 rounded-2xl border border-white/5">
                    <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Total Searches</Text>
                    <Text className="text-white text-3xl font-black">124</Text>
                </View>
                <View className="flex-1 bg-face-seek-dark-slate p-4 rounded-2xl border border-white/5">
                    <Text className="text-slate-400 text-xs uppercase font-bold mb-2">Credits Left</Text>
                    <Text className="text-face-seek-cyan text-3xl font-black">850</Text>
                </View>
            </View>

            <TouchableOpacity className="bg-face-seek-dark-slate p-4 rounded-2xl border border-white/5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                    <View className="w-10 h-10 bg-face-seek-purple/10 rounded-full items-center justify-center">
                        <CreditCard size={20} color="#8b5cf6" />
                    </View>
                    <View>
                        <Text className="text-white font-bold">Billing & Plans</Text>
                        <Text className="text-slate-400 text-xs">Manage your subscription</Text>
                    </View>
                </View>
                <ArrowLeft size={16} color="#64748b" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>

            <TouchableOpacity className="bg-face-seek-dark-slate p-4 rounded-2xl border border-white/5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                    <View className="w-10 h-10 bg-face-seek-blue/10 rounded-full items-center justify-center">
                        <Activity size={20} color="#0ea5e9" />
                    </View>
                    <View>
                        <Text className="text-white font-bold">Search History</Text>
                        <Text className="text-slate-400 text-xs">View past analysis reports</Text>
                    </View>
                </View>
                <ArrowLeft size={16} color="#64748b" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>

            <TouchableOpacity className="bg-face-seek-dark-slate p-4 rounded-2xl border border-white/5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                    <View className="w-10 h-10 bg-slate-700/30 rounded-full items-center justify-center">
                        <Settings size={20} color="#94a3b8" />
                    </View>
                    <View>
                        <Text className="text-white font-bold">Settings</Text>
                        <Text className="text-slate-400 text-xs">App preferences and security</Text>
                    </View>
                </View>
                <ArrowLeft size={16} color="#64748b" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
