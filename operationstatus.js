import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.5; // 侧边栏宽度占屏幕的 50%

export default function OperationStatusApp({ onBack, navigateToScreen }) {
  // 🚪 侧边栏显隐状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- 状态控制 ---
  const [dateStart, setDateStart] = useState(new Date());
  const [dateEnd, setDateEnd] = useState(new Date());
  
  const [showPickerStart, setShowPickerStart] = useState(false);
  const [showPickerEnd, setShowPickerEnd] = useState(false);

  // 日期文本状态
  const [dateStartText, setDateStartText] = useState('2026-06-10'); 
  const [dateEndText, setDateEndText] = useState('2026-06-10');
  
  const [timeStartHour, setTimeStartHour] = useState('');
  const [timeStartMin, setTimeStartMin] = useState('');
  const [timeEndHour, setTimeEndHour] = useState('');
  const [timeEndMin, setTimeEndMin] = useState('');
  
  const [status, setStatus] = useState('active');

  // 用于嵌入式显示时间格式提示或错误的状态
  const [timeNotice, setTimeNotice] = useState('Use 24-hour format (00-23)');
  const [isNoticeError, setIsNoticeError] = useState(false);

  // 获取清空时分秒的“今天”的凌晨时间
  const getTodayWithNoon = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // 处理侧边栏导航点击
  const handleMenuPress = (targetScreen) => {
    setIsSidebarOpen(false); // 先关闭侧边栏
    
    // 如果点击的是当前页面，不需要跳转
    if (targetScreen === 'operationstatus') return;

    // 回传参数给上层主控组件进行界面跳转
    if (navigateToScreen) {
      navigateToScreen(targetScreen);
    } else if (onBack) {
      onBack(targetScreen); 
    }
  };

  const onChangeDateStart = (event, selectedDate) => {
    setShowPickerStart(Platform.OS === 'ios'); 
    if (selectedDate) {
      if (selectedDate < getTodayWithNoon()) {
        Alert.alert("Error", "Start date cannot be earlier than today!");
        return;
      }
      
      setDateStart(selectedDate);
      const formatted = selectedDate.toISOString().split('T')[0];
      setDateStartText(formatted);

      if (dateEndText && selectedDate > dateEnd) {
        setDateEnd(selectedDate);
        setDateEndText(formatted);
      }
    }
  };

  const onChangeDateEnd = (event, selectedDate) => {
    setShowPickerEnd(Platform.OS === 'ios');
    if (selectedDate) {
      const compareDate = dateStartText ? dateStart : getTodayWithNoon();
      const targetCompare = new Date(compareDate);
      targetCompare.setHours(0,0,0,0);
      
      if (selectedDate < targetCompare) {
        Alert.alert("Error", "End date cannot be earlier than Start date!");
        return;
      }

      setDateEnd(selectedDate);
      const formatted = selectedDate.toISOString().split('T')[0];
      setDateEndText(formatted);
    }
  };

  const validateHours = (val, setHourState) => {
    if (val === '') return;
    const hour = parseInt(val, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      setTimeNotice("Hours must be between 0 and 23!");
      setIsNoticeError(true);
      setHourState('');
    } else {
      setTimeNotice('Use 24-hour format (00-23)');
      setIsNoticeError(false);
    }
  };

  const validateMinutes = (val, setMinState) => {
    if (val === '') return;
    const min = parseInt(val, 10);
    if (isNaN(min) || min < 0 || min > 59) {
      setTimeNotice("Minutes cannot exceed 59!");
      setIsNoticeError(true);
      setMinState('');
    } else {
      setTimeNotice('Use 24-hour format (00-23)');
      setIsNoticeError(false);
    }
  };

  const handleHourFocus = () => {
    setTimeNotice('Please use 24-hour format (00-23).');
    setIsNoticeError(false);
  };

  const handleUpdateSubmit = () => {
    if (!dateStartText || !dateEndText || !timeStartHour || !timeStartMin || !timeEndHour || !timeEndMin) {
      Alert.alert("Error", "Please fill in all date and time fields!");
      return;
    }

    const sMin = parseInt(timeStartMin, 10);
    const eMin = parseInt(timeEndMin, 10);
    const sHour = parseInt(timeStartHour, 10);
    const eHour = parseInt(timeEndHour, 10);

    if (sMin > 59 || eMin > 59 || sHour > 23 || eHour > 23) {
      setTimeNotice("Hours max 23, Minutes max 59.");
      setIsNoticeError(true);
      return;
    }

    const dStart = new Date(dateStartText);
    const dEnd = new Date(dateEndText);
    const today = getTodayWithNoon();

    if (dStart < today) {
      Alert.alert("Error", "Operation cannot start in the past!");
      return;
    }

    if (dEnd < dStart) {
      Alert.alert("Error", "End date cannot be earlier than Start date!");
      return;
    }
    
    Alert.alert(
      "Success", 
      `Status updated successfully!\nStatus: ${status}\nDate: ${dateStartText} to ${dateEndText}\nTime: ${timeStartHour}:${timeStartMin} - ${timeEndHour}:${timeEndMin}`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ==================== 🚪 侧边栏（Sidebar）组件 ==================== */}
      <Modal
        transparent={true}
        visible={isSidebarOpen}
        animationType="none"
        onRequestClose={() => setIsSidebarOpen(false)}
      >
        <View style={styles.modalContainer}>
          {/* 左侧实体菜单 */}
          <View style={styles.sidebar}>
            {/* 顶栏：Menu 切换按钮 */}
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="menu" size={32} color="#000" />
              </TouchableOpacity>
            </View>

            {/* 用户头像区域 */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person-outline" size={45} color="#000" />
              </View>
              <Text style={styles.avatarName}>Rasa Syiok</Text>
            </View>

            {/* 导航列表 */}
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('order')}>
              <Text style={styles.sidebarItemText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('profile')}>
              <Text style={styles.sidebarItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('menu')}>
              <Text style={styles.sidebarItemText}>Menu</Text>
            </TouchableOpacity>

            {/* 当前页面：高亮为灰色背景 */}
            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => handleMenuPress('operationstatus')}>
              <Text style={styles.sidebarItemText}>Update Status</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('historyorder')}>
              <Text style={styles.sidebarItemText}>History Order</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('review')}>
              <Text style={styles.sidebarItemText}>Review</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('resetpassword')}>
              <Text style={styles.sidebarItemText}>Reset Password</Text>
            </TouchableOpacity>

            {/* 底部退出登录 */}
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={() => handleMenuPress('logout')}>
                <Ionicons name="log-out-outline" size={24} color="#000" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 右侧空白处暗色遮罩层 */}
          <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* 1. 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.backButton}>
          <Ionicons name="menu-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Operation Status</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.divider} />

      {/* 🛠️ 语法修复点：KeyboardAvoidingView 移到最外层包裹 ScrollView */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* 字段 1: Date Start */}
          <View style={styles.inputGroupRow}>
            <Text style={styles.fieldLabel}>Date Start:</Text>
            <TouchableOpacity 
              style={styles.dateBoxContainer} 
              onPress={() => setShowPickerStart(true)}
            >
              {dateStartText ? (
                <Text style={styles.dateBoxText}>{dateStartText}</Text>
              ) : (
                <Ionicons name="calendar-outline" size={18} color="#333" />
              )}
            </TouchableOpacity>
          </View>

          {showPickerStart && (
            <DateTimePicker
              value={dateStart}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onChangeDateStart}
              minimumDate={getTodayWithNoon()}
            />
          )}

          {/* 字段 2: Date End */}
          <View style={styles.inputGroupRow}>
            <Text style={styles.fieldLabel}>Date End:</Text>
            <TouchableOpacity 
              style={styles.dateBoxContainer} 
              onPress={() => setShowPickerEnd(true)}
            >
              {dateEndText ? (
                <Text style={styles.dateBoxText}>{dateEndText}</Text>
              ) : (
                <Ionicons name="calendar-outline" size={18} color="#333" />
              )}
            </TouchableOpacity>
          </View>

          {showPickerEnd && (
            <DateTimePicker
              value={dateEnd}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onChangeDateEnd}
              minimumDate={dateStartText ? dateStart : getTodayWithNoon()} 
            />
          )}

          {/* 字段 3: Time Start */}
          <View style={styles.inputGroupRow}>
            <Text style={styles.fieldLabel}>Time Start:</Text>
            <View style={styles.timeGroup}>
              <TextInput
                style={styles.timeInput}
                placeholder="HH"
                keyboardType="numeric"
                maxLength={2}
                value={timeStartHour}
                onFocus={handleHourFocus}
                onChangeText={setTimeStartHour}
                onBlur={() => validateHours(timeStartHour, setTimeStartHour)}
              />
              <Text style={styles.colon}>:</Text>
              <TextInput
                style={styles.timeInput}
                placeholder="MM"
                keyboardType="numeric"
                maxLength={2}
                value={timeStartMin}
                onChangeText={setTimeStartMin}
                onBlur={() => validateMinutes(timeStartMin, setTimeStartMin)}
              />
            </View>
          </View>

          {/* 字段 4: Time End */}
          <View style={styles.inputGroupRow}>
            <Text style={styles.fieldLabel}>Time End:</Text>
            <View style={styles.timeGroup}>
              <TextInput
                style={styles.timeInput}
                placeholder="HH"
                keyboardType="numeric"
                maxLength={2}
                value={timeEndHour}
                onFocus={handleHourFocus}
                onChangeText={setTimeEndHour}
                onBlur={() => validateHours(timeEndHour, setTimeEndHour)}
              />
              <Text style={styles.colon}>:</Text>
              <TextInput
                style={styles.timeInput}
                placeholder="MM"
                keyboardType="numeric"
                maxLength={2}
                value={timeEndMin}
                onChangeText={setTimeEndMin}
                onBlur={() => validateMinutes(timeEndMin, setTimeEndMin)}
              />
            </View>
          </View>

          {/* 嵌入式 Notice 区域 */}
          <View style={styles.noticeContainer}>
            <Text style={[styles.noticeText, isNoticeError ? styles.noticeError : styles.noticeNormal]}>
              {timeNotice}
            </Text>
          </View>

          {/* 字段 5: Status */}
          <View style={styles.inputGroupRow}>
            <Text style={styles.fieldLabel}>Status:</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity style={styles.radioButton} onPress={() => setStatus('active')}>
                <View style={styles.radioCircle}>
                  {status === 'active' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioLabel}>Active</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.radioButton} onPress={() => setStatus('inactive')}>
                <View style={styles.radioCircle}>
                  {status === 'inactive' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioLabel}>Inactive</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* UPDATE 按钮 */}
          <TouchableOpacity style={styles.button} onPress={handleUpdateSubmit}>
            <Text style={styles.buttonText}>UPDATE</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView> {/* 👈 🛠️ 语法修复点：确保闭合标签顺序正确 */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 15 : 35 },
  backButton: { justifyContent: 'center', alignItems: 'center', padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#000', textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#eee', width: '100%' },
  keyboardAvoid: { flex: 1 },
  scrollContainer: { paddingHorizontal: 28, paddingTop: 30, paddingBottom: 60 },
  inputGroupRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 18 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#000', width: 100 },
  dateBoxContainer: { borderWidth: 1, borderColor: '#000', borderRadius: 2, minWidth: 90, paddingHorizontal: 8, height: 28, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  dateBoxText: { fontSize: 13, color: '#000', fontWeight: '500' },
  timeGroup: { flexDirection: 'row', alignItems: 'center' },
  timeInput: { borderWidth: 1, borderColor: '#000', borderRadius: 2, width: 70, height: 28, backgroundColor: '#fff', textAlign: 'center', fontSize: 13, padding: 0 },
  colon: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 8, color: '#000' },
  
  noticeContainer: {
    paddingLeft: 100, 
    marginBottom: 18,
    marginTop: -8,    
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noticeNormal: {
    color: '#7f8c8d', 
  },
  noticeError: {
    color: '#ff4d4d', 
  },

  radioGroup: { flexDirection: 'row', alignItems: 'center' },
  radioButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  radioCircle: { height: 14, width: 14, borderRadius: 7, borderWidth: 1, borderColor: '#000', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  radioDot: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#000' },
  radioLabel: { fontSize: 12, color: '#000' },
  button: { backgroundColor: '#A9A9A9', paddingVertical: 10, borderRadius: 20, marginTop: 35, width: '55%', alignSelf: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },

  /* ==================== 📌 Sidebar 样式表 ==================== */
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: Dimensions.get('window').width * 0.75, 
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
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
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