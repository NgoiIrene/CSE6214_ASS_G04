import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; // Expo/React Native 需要这个 polyfill

const supabaseUrl=process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase=createClient(supabaseUrl, supabaseAnonKey);