import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Upload, Search as SearchIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { search } from '../services/api';

export default function SearchScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const handleSearch = async () => {
    if (!image) return;

    setLoading(true);
    try {
      // 1. Upload
      const uploadRes = await search.uploadFace(image);
      const filename = uploadRes.data.filename;

      // 2. Search
      const searchRes = await search.searchFace(filename);
      setResult(searchRes.data);
      
      Alert.alert('Search Complete', `Found ${searchRes.data.results?.length || 0} matches.`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-face-seek-deep-space">
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-white/5 bg-black/20">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white font-black text-lg uppercase tracking-wider">Face Search</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {!image ? (
          <View className="items-center justify-center min-h-[400px] border-2 border-dashed border-face-seek-cyan/30 rounded-3xl bg-face-seek-cyan/5">
            <View className="w-20 h-20 bg-face-seek-cyan/10 rounded-full items-center justify-center mb-6">
              <SearchIcon size={40} color="#00d9ff" />
            </View>
            <Text className="text-white font-bold text-xl mb-2">Upload a Photo</Text>
            <Text className="text-slate-400 text-center px-10 mb-8">
              Select a photo from your gallery or take a new one to start searching.
            </Text>
            
            <View className="flex-row gap-4">
              <TouchableOpacity 
                onPress={pickImage}
                className="bg-face-seek-dark-slate border border-white/10 px-6 py-3 rounded-xl flex-row items-center gap-2"
              >
                <Upload size={20} color="white" />
                <Text className="text-white font-bold">Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={takePhoto}
                className="bg-face-seek-cyan px-6 py-3 rounded-xl flex-row items-center gap-2"
              >
                <Camera size={20} color="#0a0e27" />
                <Text className="text-face-seek-deep-space font-bold">Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="space-y-6">
            <View className="relative rounded-3xl overflow-hidden border border-face-seek-cyan/50 shadow-2xl shadow-face-seek-cyan/20 h-[400px]">
              <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
              <TouchableOpacity 
                onPress={() => { setImage(null); setResult(null); }}
                className="absolute top-4 right-4 bg-black/50 p-2 rounded-full"
              >
                <X color="white" size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={handleSearch}
              disabled={loading}
              className={`w-full bg-face-seek-cyan py-4 rounded-xl items-center flex-row justify-center gap-2 shadow-lg shadow-face-seek-cyan/20 ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? (
                <ActivityIndicator color="#0a0e27" />
              ) : (
                <>
                  <SearchIcon size={20} color="#0a0e27" strokeWidth={3} />
                  <Text className="text-face-seek-deep-space font-black text-lg uppercase">Start Analysis</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {result && (
          <View className="mt-8 space-y-4">
            <Text className="text-white font-bold text-xl mb-4">Results</Text>
            {result.results?.length === 0 ? (
                <Text className="text-slate-400 text-center py-10">No matches found in public databases.</Text>
            ) : (
                result.results?.map((item: any, idx: number) => (
                    <View key={idx} className="bg-face-seek-dark-slate p-4 rounded-xl border border-white/10 flex-row gap-4">
                        <View className="w-16 h-16 bg-black/30 rounded-lg overflow-hidden">
                             {/* In a real app, you'd show the result thumbnail here */}
                             <SearchIcon size={24} color="#64748b" style={{ margin: 20 }} />
                        </View>
                        <View className="flex-1 justify-center">
                            <Text className="text-white font-bold text-base mb-1 truncate" numberOfLines={1}>{item.url || "Unknown Source"}</Text>
                            <Text className="text-face-seek-cyan text-xs font-bold">{item.score ? `${(item.score * 100).toFixed(1)}% Match` : "Potential Match"}</Text>
                        </View>
                    </View>
                ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
