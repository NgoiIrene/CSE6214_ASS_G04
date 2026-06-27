import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Image // 🎯 Ensure Image component is imported for displaying avatars
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import emailjs from '@emailjs/react-native';
// 🎯 Successfully paired relative path, successfully importing the Supabase client instance
import { supabase } from '../../supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ResetPasswordScreen({ navigateToScreen }) {
  const [step, setStep] = useState(1);                     
  const [isLoading, setIsLoading] = useState(false); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  // Form input state
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [generatedPin, setGeneratedPin] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 👤 New: Supabase user profile state (used for dynamic Sidebar display)
  const [profileName, setProfileName] = useState('Loading...');
  const [avatarUrl, setAvatarUrl] = useState(null);

  // 🛠️ EmailJS credentials
  const EMAILJS_SERVICE_ID = 'service_cfa71kb';       
  const EMAILJS_TEMPLATE_ID = 'template_4lhl9wd';     
  const EMAILJS_PUBLIC_KEY = 'IWTAe2ZuqgcQdTyX_';     

  // ⚙️ Effect 1: Initialize EmailJS
  useEffect(() => {
    emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY,
    });
  }, []);

  // 👤 Effect 2: Dynamically fetch current logged-in user's profiles data to display in Sidebar
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // 1. Get the current session's user UID from Auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setProfileName('Guest');
          return;
        }

        // 2. Use the UID to query full_name and avatar_url from your profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id) // 🎯 'id' here corresponds to the field name in your profiles table that links to the user
          .single();

        if (profileError) throw profileError;

        if (profile) {
          if (profile.full_name) setProfileName(profile.full_name);
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        }
      } catch (error) {
        console.log('Fetch profile error:', error.message);
        setProfileName('User'); // Default fallback when error or no data
      }
    };

    fetchUserProfile();
  }, []);

  // Helper: reset all state fields
  const resetAllFields = () => {
    setStep(1);
    setEmail('');
    setPin('');
    setGeneratedPin('');
    setPassword('');
    setConfirmPassword('');
  };

  // ⚡ 1. Send verification code email (using your configured EmailJS)
  const handleVerify = async () => {
    const userEmail = email.trim();
    if (!userEmail) {
      Alert.alert("Error", "Please enter your email address first!");
      return;
    }

    // Generate a 6-digit random PIN and temporarily save it in local memory
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedPin(randomPin); 
    setIsLoading(true);

    const templateParams = {
      email: userEmail,      
      reply_pin: randomPin,   
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      Alert.alert(
        "Email Sent Successfully! 📩",
        `A verification email has been sent to:\n${userEmail}\n\nPlease check your inbox!`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.log('EmailJS Error:', error);
      Alert.alert("Mail Delivery Error", "Failed to send email. Please check your network.");
    } finally {
      setIsLoading(false); 
    }
  };

  // ⚡ 2. Continue button check (pure front-end PIN code comparison, verifies account ownership)
  const handleContinue = () => {
    const enteredEmail = email.trim();
    const enteredPin = pin.trim();

    if (!enteredEmail || !enteredPin) {
      Alert.alert("Error", "Please fill in both Email and Verification PIN!");
      return;
    }

    // Compare entered PIN with the one just sent
    if (!generatedPin || enteredPin !== generatedPin) {
      Alert.alert(
        "Verification Failed ❌",
        "The PIN code you entered is incorrect. Please try again.",
        [{ text: "Try Again" }]
      );
      return; 
    }
    
    // Identity verified, proceed to Step 2 to set new password
    setStep(2); 
  };

  // ⚡ 3. Reset password (calls the custom RPC database function you created in Supabase)
  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields!");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      Alert.alert(
        "Weak Password ❌",
        "Password must be at least 8 characters long and contain uppercase letters, numbers, and at least one special character (e.g., . , ! @)!",
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoading(true);

    try {
      // 🎯 Core call: invoke the special privileged modify function you successfully ran in SQL Editor
      const { data, error } = await supabase.rpc('reset_user_password_by_email', {
        target_email: email.trim(),
        new_password: password
      });

      if (error) throw error;

      if (data === 'Success') {
        Alert.alert("Success ✅", "Password reset successful!", [
          { 
            text: "OK", 
            onPress: () => { 
              resetAllFields(); 
              if (navigateToScreen) {
                navigateToScreen('order'); // Safely navigate back to main page after success
              } 
            } 
          } 
        ]);
      } else {
        Alert.alert("Error ❌", data || "User reset failed.");
      }

    } catch (error) {
      console.log('Supabase RPC Error:', error.message);
      Alert.alert("Error ❌", error.message || "Failed to update password.");
    } finally {
      setIsLoading(false); 
    }
  };

  // ⚡ Top-left button press logic
  const handleHeaderLeftPress = () => {
    if (step === 1) {
      setIsSidebarOpen(true); 
    } else {
      setStep(1); 
    }
  };

  // ⚡ Sidebar menu item press navigation logic
  const handleMenuSelect = (screenName) => {
    setIsSidebarOpen(false); 
    resetAllFields(); 

    if (screenName === 'resetpassword') return;

    if (navigateToScreen) {
      navigateToScreen(screenName); 
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* ==================== 🚪 Sidebar Component ==================== */}
      <Modal
        transparent={true}
        visible={isSidebarOpen}
        animationType="none"
        onRequestClose={() => setIsSidebarOpen(false)}
      >
        <View style={styles.modalContainer}>
          {/* Left side physical menu */}
          <View style={styles.sidebar}>
            {/* Top bar: Menu toggle button */}
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="menu" size={32} color="#000" />
              </TouchableOpacity>
            </View>

            {/* User avatar area (already changed to render dynamically based on Supabase data) */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image 
                    source={{ uri: avatarUrl }} 
                    style={{ width: 68, height: 68, borderRadius: 34 }} 
                  />
                ) : (
                  <Ionicons name="person-outline" size={45} color="#000" />
                )}
              </View>
              {/* Dynamically bind full name */}
              <Text style={styles.avatarName}>{profileName}</Text>
            </View>

            {/* Navigation list */}
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuSelect('order')}>
              <Text style={styles.sidebarItemText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuSelect('profile')}>
              <Text style={styles.sidebarItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuSelect('menu')}>
              <Text style={styles.sidebarItemText}>Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuSelect('operationstatus')}>
              <Text style={styles.sidebarItemText}>Update Status</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuSelect('historyorder')}>
              <Text style={styles.sidebarItemText}>History Order</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuSelect('review')}>
              <Text style={styles.sidebarItemText}>Review</Text>
            </TouchableOpacity>

            {/* Currently on Reset Password page: highlight it */}
            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => setIsSidebarOpen(false)}>
              <Text style={styles.sidebarItemText}>Reset Password</Text>
            </TouchableOpacity>

            {/* Bottom logout button */}
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={() => handleMenuSelect('logout')}>
                <Ionicons name="log-out-outline" size={24} color="#000" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right side dark overlay backdrop */}
          <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* ==================== Top Navigation Bar ==================== */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={handleHeaderLeftPress}>
          {step === 1 ? (
            <Ionicons name="menu" size={35} color="#000" />
          ) : (
            <Ionicons name="arrow-back-outline" size={35} color="#000" />
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? "Email Verification" : "Reset Password"}
        </Text>
        <View style={{ width: 35 }} /> 
      </View>
      <View style={styles.divider} />

      {/* Main card area */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.wireframeCard}>
          
          {/* STEP 1: Email Verification UI */}
          {step === 1 && (
            <View style={{ width: '100%' }}>
              <View style={styles.wireframeInputRow}>
                <View style={styles.inlineFieldRow}>
                  <Text style={styles.wireframeLabel}>Email address:</Text>
                  <TextInput 
                    style={styles.wireframeInputInline} 
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity style={styles.wireframeVerifyBtn} onPress={handleVerify} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.wireframeVerifyBtnText}>Verify</Text>}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.wireframeInputRow}>
                <View style={styles.inlineFieldRow}>
                  <Text style={styles.wireframeLabel}>Verification Pin:</Text>
                  <TextInput 
                    style={styles.wireframeInputShort} 
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="6-digit PIN"
                    placeholderTextColor="#999"
                  />
                  <View style={{ width: 68 }} /> 
                </View>
              </View>

              <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleContinue}>
                <Text style={styles.wireframeSubmitBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: New Password UI */}
          {step === 2 && (
            <View style={{ width: '100%' }}>
              <View style={styles.wireframeInputRow}>
                <View style={styles.inlineFieldRow}>
                  <Text style={styles.wireframeLabelLong}>Password:</Text>
                  <TextInput 
                    style={styles.wireframeInputLong} 
                    secureTextEntry={true} 
                    value={password} 
                    onChangeText={setPassword}
                    placeholder="Upper + Num + Symbol (8+ min)"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              <View style={styles.wireframeInputRow}>
                <View style={styles.inlineFieldRow}>
                  <Text style={styles.wireframeLabelLong}>Confirm Password:</Text>
                  <TextInput 
                    style={styles.wireframeInputLong} 
                    secureTextEntry={true} 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat password"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.wireframeSubmitBtn} onPress={handleReset} disabled={isLoading}>
                {isLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.wireframeSubmitBtnText}>Reset</Text>}
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  divider: { height: 2, backgroundColor: '#000', width: '100%' },
  scrollContainer: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: 30, alignItems: 'center' },
  
  // Header styles
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 15, 
    paddingBottom: 12,
    paddingTop: Platform.OS === 'ios' ? 15 : 35,
  },
  headerBackBtn: { 
    width: 35, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  headerTitle: { fontSize: 24, fontWeight: 'normal', color: '#000' },
  
  // Main card and input fields
  wireframeCard: { width: '100%', borderWidth: 1.5, borderColor: '#000', paddingHorizontal: 20, paddingVertical: 45, backgroundColor: '#fff', marginTop: 30 },
  wireframeInputRow: { marginBottom: 25, width: '100%' },
  inlineFieldRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  wireframeLabel: { fontSize: 14, fontWeight: 'bold', color: '#000', marginRight: 10, minWidth: 110 },
  wireframeLabelLong: { fontSize: 14, fontWeight: 'bold', color: '#000', marginRight: 10, minWidth: 130 },
  
  wireframeInputInline: { 
    flex: 1, 
    height: 40, 
    borderWidth: 1.5, 
    borderColor: '#000', 
    paddingHorizontal: 10, 
    fontSize: 14, 
    color: '#000', 
    backgroundColor: '#fff',
  },
  wireframeInputShort: { 
    width: 130, 
    height: 40, 
    borderWidth: 1.5, 
    borderColor: '#000', 
    paddingHorizontal: 10, 
    fontSize: 14, 
    color: '#000', 
    backgroundColor: '#fff',
  },
  wireframeInputLong: { 
    flex: 1, 
    height: 40, 
    borderWidth: 1.5, 
    borderColor: '#000', 
    paddingHorizontal: 10, 
    fontSize: 14, 
    color: '#000', 
    backgroundColor: '#fff',
  },
  
  wireframeVerifyBtn: { borderWidth: 1.5, borderColor: '#000', width: 60, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: 8, backgroundColor: '#fff' },
  wireframeVerifyBtnText: { fontSize: 13, color: '#000', fontWeight: 'bold' },
  wireframeSubmitBtn: { borderWidth: 1.5, borderColor: '#000', paddingVertical: 8, paddingHorizontal: 30, alignSelf: 'center', marginTop: 20, backgroundColor: '#fff' },
  wireframeSubmitBtnText: { fontSize: 15, color: '#000', fontWeight: 'bold' },

  /* ==================== 📌 Sidebar Style Sheet ==================== */
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SCREEN_WIDTH * 0.75, 
    height: '100%',
    backgroundColor: '#fff',
    borderRightWidth: 2,
    borderRightColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 40 : 25,
    zIndex: 10,
  },
  sidebarHeader: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    overflow: 'hidden' // Ensure the loaded image does not overflow the border
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    marginTop: 5
  },
  sidebarItem: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    alignItems: 'center',
  },
  sidebarActiveItem: {
    backgroundColor: '#A9A9A9', 
  },
  sidebarItemText: {
    fontSize: 22,
    color: '#000',
    fontWeight: 'normal',
  },
  sidebarFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderTopColor: '#000',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 22,
    color: '#000',
    marginLeft: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
  },
});