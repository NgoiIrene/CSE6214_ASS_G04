import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';

// ==================== 🛠️ 真实子页面引入 ====================
import OrderScreen from './order';
import ReviewScreen from './review';
import MenuScreen from './menu';
import HistoryOrderScreen from './historyorder';
import OperationStatusScreen from './operationstatus';
import ResetPasswordScreen from './resetpassword';
import ProfileScreen from './vendorprofile'; // 确保文件名与此处完全一致

export default function App() {
  // 初始设为 'order' 页面
  const [currentScreen, setCurrentScreen] = useState('order');

  // 路由跳转核心方法
  const navigateToScreen = (screenName) => {
    console.log(`[路由导航] 正在前往页面: ${screenName}`);
    if (screenName === 'logout') {
      setCurrentScreen('menu'); // 退出登录时重置回 menu
      return;
    }
    setCurrentScreen(screenName);
  };

  // 根据子页面侧边栏传回的字符串渲染对应的真实组件
  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return <MenuScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      case 'order':
        return <OrderScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      case 'review':
        return <ReviewScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      case 'historyorder':
        return <HistoryOrderScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      case 'operationstatus':
        return <OperationStatusScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      case 'resetpassword':
        return <ResetPasswordScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      case 'profile': // ✨ 新增：个人资料页面分支
        return <ProfileScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
      default:
        return <MenuScreen navigateToScreen={navigateToScreen} onBack={navigateToScreen} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

// import React from 'react';
// // 引入你想看的那个 js 文件（这里以同级目录的 order.js 为例）
// import OrderScreen from './resetpassword';

// export default function App() {
//   // 直接在这里渲染你想看的页面
//   return <OrderScreen />;
// }

// import React, { useState } from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   TextInput,
//   TouchableOpacity,
//   SafeAreaView,
//   ScrollView,
//   KeyboardAvoidingView, //🌟 1. 引入键盘避让组件
//   Platform,             //🌟 2. 引入平台判断（iOS/Android 机制不同）
//   Alert
// } from 'react-native';
// // 导入小眼睛、返回键等图标
// import { Ionicons } from '@expo/vector-icons';
// // 导入下拉菜单
// import { Picker } from '@react-native-picker/picker';

// export default function App() {
//   // 🌟 新增状态：控制当前显示 'signup' 还是 'login' 页面
//   const [currentPage, setCurrentPage] = useState('login'); // 默认先看登录页

//   // --- 注册页面的状态 ---
//   const [fullName, setFullName] = useState('');
//   const [signUpEmail, setSignUpEmail] = useState('');
//   const [accountType, setAccountType] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [gender, setGender] = useState('');
//   const [age, setAge] = useState('');
//   const [signUpPassword, setSignUpPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   // 控制密码隐藏/显示的布尔状态
//   const [secureSignUpPwd, setSecureSignUpPwd] = useState(true);
//   const [secureConfirmPwd, setSecureConfirmPwd] = useState(true);

//   // --- 登录页面的状态 ---
//   const [loginEmail, setLoginEmail] = useState('');
//   const [loginPassword, setLoginPassword] = useState('');
//   const [secureLoginPwd, setSecureLoginPwd] = useState(true);

//   // 注册按钮触发
//   const handleSignUpSubmit = () => {
//     if (!fullName || !signUpEmail || !accountType || !phoneNumber || !gender || !age || !signUpPassword || !confirmPassword) {
//       Alert.alert("Error", "Please fill in all fields!");
//       return;
//     }
//     if (signUpPassword !== confirmPassword) {
//       Alert.alert("Error", "The passwords you entered do not match!");
//       return;
//     }
//     Alert.alert("LoggedIn ", `Welcome,${fullName}!`);
//   };

//   // 登录按钮触发
//   const handleLoginSubmit = () => {
//     if (!loginEmail || !loginPassword) {
//       Alert.alert("Error", "Please fill in all fields!");
//       return;
//     }
//     // 暂时先弹窗打印出数据，证明我们拿到了输入
//     // Alert.alert("Success", `Welcome, ${fullName}! Your information is ready.`);
//   };

//   // 忘记密码触发
//   const handleForgotPassword = () => {
//     Alert.alert("Linked...", "Connecting to Reset Password page...");
//   };

//   return ( /* 🌟 秘诀：我们两边都不放东西，或者放一个一模一样的空 View,标题就会自然在中间完美居中 */
//     <SafeAreaView style={styles.safeArea}>
//       {/* 1. 顶部导航栏 (代码完全没有改动) */}
//       <View style={styles.header}>
//         <View style={{ width: 32 }} />
//         <Text style={styles.headerTitle}>{currentPage === 'login' ? 'Log In' : 'Sign Up'}</Text>
//         <View style={{ width: 32 }} />
//       </View>

//       <View style={styles.divider} />

//       {/* 🌟 核心改动：用 KeyboardAvoidingView 包裹整个表单区域 */}
//       <KeyboardAvoidingView
//         style={styles.keyboardAvoid}
//         // iOS 推荐用 padding，Android 推荐用 height 或者不设
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // 微调弹起的高度偏移量
//       >
//         {/* 使用 ScrollView 包裹中间所有内容，防止手机装不下内容 */}
//         <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

//           {/* ==================== 登录界面 UI ==================== */}
//           {currentPage === 'login' && (
//             <View style={{ width: '100%', alignItems: 'center' }}>

//               {/* 登录字段 1: Email */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.fieldLabel}>Email Address</Text>
//                 <View style={styles.inputBoxContainer}>
//                   <Ionicons name="mail-outline" size={18} color="#777" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="ailysmith@gmail.com"
//                     placeholderTextColor="#bbb"
//                     keyboardType="email-address"
//                     autoCapitalize="none"
//                     value={loginEmail}
//                     onChangeText={setLoginEmail}
//                   />
//                 </View>
//               </View>

//               {/* 登录字段 2: Password (带小眼睛) */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.fieldLabel}>Password</Text>
//                 <View style={styles.inputBoxContainer}>
//                   <Ionicons name="lock-closed-outline" size={18} color="#777" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="......"
//                     placeholderTextColor="#bbb"
//                     secureTextEntry={secureLoginPwd}
//                     value={loginPassword}
//                     onChangeText={setLoginPassword}
//                   />
//                   {/* 点击小眼睛切换状态 */}
//                   <TouchableOpacity onPress={() => setSecureLoginPwd(!secureLoginPwd)}>
//                     <Ionicons
//                       name={secureLoginPwd ? "eye-off-outline" : "eye-outline"}
//                       size={18}
//                       color="#777"
//                       style={styles.rightIcon}
//                     />
//                   </TouchableOpacity>
//                 </View>

//                 {/* 🌟 密码框右下角的 Forgot Password 蓝色小字 */}
//                 <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPassword}>
//                   <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
//                 </TouchableOpacity>
//               </View>

//               {/* LOGIN 按钮 */}
//               <TouchableOpacity style={styles.button} onPress={handleLoginSubmit}>
//                 <Text style={styles.buttonText}>Login</Text>
//               </TouchableOpacity>

//               {/* 切换到注册页面的链接 */}
//               <TouchableOpacity style={styles.switchContainer} onPress={() => setCurrentPage('signup')}>
//                 <Text style={styles.switchText}>Don't have an account? <Text style={styles.switchHighlight}>Sign Up</Text></Text>
//               </TouchableOpacity>

//             </View>
//           )}

//           {/* ==================== 注册界面 UI ==================== */}
//           {currentPage === 'signup' && (
//             <View style={{ width: '100%', alignItems: 'center' }}>

//               {/* 字段 1: Full Name */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.fieldLabel}>Full Name</Text>
//                 <View style={styles.inputBoxContainer}>
//                   <Ionicons name="person-outline" size={18} color="#777" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="John Doe"
//                     placeholderTextColor="#bbb"
//                     value={fullName}
//                     onChangeText={setFullName}
//                   />
//                 </View>
//               </View>

//               {/* 字段 2: Email Address */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.fieldLabel}>Email Address</Text>
//                 <View style={styles.inputBoxContainer}>
//                   <Ionicons name="mail-outline" size={18} color="#777" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="johndoe@gmail.com"
//                     placeholderTextColor="#bbb"
//                     keyboardType="email-address"
//                     autoCapitalize="none"
//                     value={signUpEmail}
//                     onChangeText={setSignUpEmail}
//                   />
//                 </View>
//               </View>

//               {/* 字段 3: Account Type (下拉选择) */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.fieldLabel}>Account Type</Text>
//                 <View style={styles.pickerBoxContainer}>
//                   <Ionicons name="layers-outline" size={18} color="#777" style={styles.icon} />
//                   <View style={styles.pickerWrapper}>
//                     <Picker
//                       selectedValue={accountType}
//                       onValueChange={(itemValue) => setAccountType(itemValue)}
//                       style={styles.picker}
//                     >
//                       <Picker.Item label="--- PLEASE SELECT ONE ---" value="" color="#bbb" style={{ fontSize: 13 }} />
//                       <Picker.Item label="User(Customer)" value="user(customer)" style />
//                       <Picker.Item label="Vendor" value="vendor" style />
//                       <Picker.Item label="Delivery Man " value="delivery" />
//                     </Picker>
//                   </View>
//                 </View>
//               </View>

//               {/* 字段 4: Phone Number */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.fieldLabel}>Phone Number</Text>
//                 <View style={styles.inputBoxContainer}>
//                   <Ionicons name="call-outline" size={18} color="#777" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="012-3456789"
//                     placeholderTextColor="#bbb"
//                     keyboardType="phone-pad"
//                     value={phoneNumber}
//                     onChangeText={setPhoneNumber}
//                   />
//                 </View>
//               </View>

//               {/* 字段 5: Gender (下拉选择) */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.fieldLabel}>Gender</Text>
//                 <View style={styles.pickerBoxContainer}>
//                   <Ionicons name="male-female-outline" size={18} color="#777" style={styles.icon} />
//                   <View style={styles.pickerWrapper}>
//                     <Picker
//                       selectedValue={gender}
//                       onValueChange={(itemValue) => setGender(itemValue)}
//                       style={styles.picker}
//                     >
//                       <Picker.Item label="--- PLEASE SELECT ONE ---" value="" color="#bbb" style={{ fontSize: 13 }} />
//                       <Picker.Item label="Male" value="male" style={{ fontSize: 13 }} />
//                       <Picker.Item label="Female" value="female" style={{ fontSize: 13 }} />
//                     </Picker>
//                   </View>
//                 </View>
//               </View>

//               {/* 字段 6: Age */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.fieldLabel}>Age</Text>
//                 <View style={styles.inputBoxContainer}>
//                   <Ionicons name="calendar-outline" size={18} color="#777" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="20"
//                     placeholderTextColor="#bbb"
//                     keyboardType="numeric"
//                     value={age}
//                     onChangeText={setAge}
//                   />
//                 </View>
//               </View>

//               {/* 字段 7: Password (带小眼睛) */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.fieldLabel}>Password</Text>
//                 <View style={styles.inputBoxContainer}>
//                   <Ionicons name="lock-closed-outline" size={18} color="#777" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="......"
//                     placeholderTextColor="#bbb"
//                     secureTextEntry={secureSignUpPwd}
//                     value={signUpPassword}
//                     onChangeText={setSignUpPassword}
//                   />
//                   {/* 点击小眼睛切换状态 */}
//                   <TouchableOpacity onPress={() => setSecureSignUpPwd(!secureSignUpPwd)}>
//                     <Ionicons
//                       name={secureSignUpPwd ? "eye-off-outline" : "eye-outline"}
//                       size={18}
//                       color="#777"
//                       style={styles.rightIcon}
//                     />
//                   </TouchableOpacity>
//                 </View>
//               </View>

//               {/* 字段 8: Confirm Password (带小眼睛) */}
//               <View style={styles.inputGroup}>
//                 <Text style={styles.fieldLabel}>Confirm Password</Text>
//                 <View style={styles.inputBoxContainer}>
//                   <Ionicons name="lock-closed-outline" size={18} color="#777" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="......"
//                     placeholderTextColor="#bbb"
//                     secureTextEntry={secureConfirmPwd}
//                     value={confirmPassword}
//                     onChangeText={setConfirmPassword}
//                   />
//                   <TouchableOpacity onPress={() => setSecureConfirmPwd(!secureConfirmPwd)}>
//                     <Ionicons
//                       name={secureConfirmPwd ? "eye-off-outline" : "eye-outline"}
//                       size={18}
//                       color="#777"
//                       style={styles.rightIcon}
//                     />
//                   </TouchableOpacity>
//                 </View>
//               </View>

//               {/* 3. CONTINUE 按钮  */}
//               <TouchableOpacity style={styles.button} onPress={handleSignUpSubmit}>
//                 <Text style={styles.buttonText}>Signup</Text>
//               </TouchableOpacity>

//               {/* 切换到登录页面的链接 */}
//               <TouchableOpacity style={styles.switchContainer} onPress={() => setCurrentPage('login')}>
//                 <Text style={styles.switchText}>Already have an account? <Text style={styles.switchHighlight}>Log In</Text></Text>
//               </TouchableOpacity>

//             </View>
//           )}

//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// // 🎨 精致样式表
// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 15,
//     paddingBottom: 12,
//     // 🌟 核心修复：加大了顶部的间距，确保在绝大多数全面屏手机上，标题都能完美避开摄像头
//     paddingTop: Platform.OS === 'ios' ? 15 : 35,
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: '600',
//     color: '#000',
//     textAlign: 'center',
//   },
//   divider: {
//     height: 1,
//     backgroundColor: '#eee',
//     width: '100%',
//   },
//   keyboardAvoid: {
//     flex: 1,
//   },
//   scrollContainer: {
//     paddingHorizontal: 28,
//     paddingTop: 10, // 🌟 让登录内容更靠中间
//     paddingBottom: 60,
//     alignItems: 'center',
//   },
//   inputGroup: {
//     width: '100%',
//     marginBottom: 12,  //the space between each boxes(verticle)
//   },
//   fieldLabel: {
//     fontSize: 13,
//     fontWeight: '500',
//     color: '#333',
//     marginBottom: 4,
//   },
//   inputBoxContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#e5e5e5',
//     borderRadius: 6,
//     height: 40,
//     backgroundColor: '#fafafa',
//     paddingHorizontal: 10,
//   },
//   pickerBoxContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#e5e5e5',
//     borderRadius: 6,
//     height: 40,
//     backgroundColor: '#fafafa',
//     paddingLeft: 10,
//   },
//   icon: {
//     marginRight: 8,
//   },
//   rightIcon: {
//     paddingHorizontal: 5,
//   },
//   input: {
//     flex: 1,
//     height: '100%',
//     fontSize: 13,
//     color: '#333',
//   },
//   pickerWrapper: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   picker: {
//     width: '100%',
//     height: 50,
//   },
//   // 🌟 Forgot Password 文字容器（让它靠右对齐）
//   forgotPasswordContainer: {
//     alignSelf: 'flex-end',
//     marginTop: 5,
//   },
//   forgotPasswordText: {
//     fontSize: 12,
//     color: '#0000EE', // 标准的链接浅蓝色
//     textDecorationLine: 'underline', // 加上好看的下划线
//   },
//   button: {
//     backgroundColor: '#A9A9A9',
//     paddingVertical: 10,
//     paddingHorizontal: 35,
//     borderRadius: 20,
//     marginTop: 20,
//     width: '55%',
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//     letterSpacing: 0.5,
//   },
//   // 底部页面切换链接样式
//   switchContainer: {
//     marginTop: 20,
//     padding: 10,
//   },
//   switchText: {
//     fontSize: 13,
//     color: '#666',
//   },
//   switchHighlight: {
//     color: '#000',
//     fontWeight: 'bold',
//     textDecorationLine: 'underline',
//   },
// });