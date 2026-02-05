import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, Search, Zap, Fingerprint, Layers, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-face-seek-deep-space">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Navbar Placeholder */}
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-white/5 bg-black/20">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 bg-face-seek-cyan/20 rounded-lg flex items-center justify-center border border-face-seek-cyan/20">
              <ShieldCheck size={16} color="#00d9ff" />
            </View>
            <Text className="font-bold text-lg text-white tracking-tighter">FACE<Text className="text-face-seek-cyan">SEEK</Text></Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/login')} className="px-4 py-2 rounded-full border border-face-seek-cyan/30 bg-face-seek-cyan/10">
            <Text className="text-face-seek-cyan font-bold text-xs uppercase">Login</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View className="px-6 py-12 items-center">
          <View className="flex-row items-center gap-2 bg-face-seek-cyan/10 border border-face-seek-cyan/30 px-4 py-2 rounded-full mb-8">
            <Zap size={12} color="#00d9ff" />
            <Text className="text-face-seek-cyan text-[10px] font-black uppercase tracking-widest">AI POWERED ENGINE</Text>
          </View>

          <Text className="text-4xl font-black text-white text-center mb-6 leading-tight uppercase">
            Advanced <Text className="text-face-seek-cyan">Facial</Text> Intelligence
          </Text>

          <Text className="text-slate-400 text-center text-base font-medium mb-10 leading-relaxed">
            Secure, private, and GDPR-compliant facial recognition search engine for open source intelligence.
          </Text>

          <TouchableOpacity 
            onPress={() => router.push('/search')}
            className="w-full bg-face-seek-cyan py-4 rounded-xl items-center flex-row justify-center gap-2 shadow-lg shadow-face-seek-cyan/20 active:opacity-90"
          >
            <Search size={20} color="#0a0e27" strokeWidth={3} />
            <Text className="text-face-seek-deep-space font-black text-lg uppercase">Start Search</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/register')}
            className="mt-4 w-full bg-face-seek-dark-slate border border-face-seek-cyan/30 py-4 rounded-xl items-center active:bg-face-seek-cyan/5"
          >
            <Text className="text-white font-bold text-base">Create Free Account</Text>
          </TouchableOpacity>
        </View>

        {/* Trust Indicators */}
        <View className="flex-row justify-center gap-6 opacity-60 mb-12 px-6 flex-wrap">
          <View className="flex-row items-center gap-2">
            <Fingerprint size={14} color="#94a3b8" />
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biometric Secure</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={14} color="#94a3b8" />
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GDPR Compliant</Text>
          </View>
        </View>

        {/* Features Grid */}
        <View className="px-6 gap-4">
            <View className="bg-face-seek-dark-slate/50 p-6 rounded-2xl border border-white/10">
                <View className="w-10 h-10 bg-face-seek-cyan/10 rounded-full items-center justify-center mb-4">
                    <Search size={20} color="#00d9ff" />
                </View>
                <Text className="text-white font-bold text-lg mb-2">Deep Web Search</Text>
                <Text className="text-slate-400 text-sm">Scan billions of public images across the surface and deep web instantly.</Text>
            </View>

            <View className="bg-face-seek-dark-slate/50 p-6 rounded-2xl border border-white/10">
                <View className="w-10 h-10 bg-face-seek-purple/10 rounded-full items-center justify-center mb-4">
                    <ShieldCheck size={20} color="#8b5cf6" />
                </View>
                <Text className="text-white font-bold text-lg mb-2">Privacy First</Text>
                <Text className="text-slate-400 text-sm">Zero-knowledge architecture. We never store your uploaded biometric data.</Text>
            </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
