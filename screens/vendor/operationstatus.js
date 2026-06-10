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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function OperationStatusApp() {
  // --- 状态控制 ---
  const [dateStart, setDateStart] = useState(new Date());
  const [dateEnd, setDateEnd] = useState(new Date());
  
  const [showPickerStart, setShowPickerStart] = useState(false);
  const [showPickerEnd, setShowPickerEnd] = useState(false);

  // 日期文本状态
  const [dateStartText, setDateStartText] = useState('2026-06-10'); // 初始化为您截图中的示例日期
  const [dateEndText, setDateEndText] = useState('2026-06-10');
  
  const [timeStartHour, setTimeStartHour] = useState('');
  const [timeStartMin, setTimeStartMin] = useState('');
  const [timeEndHour, setTimeEndHour] = useState('');
  const [timeEndMin, setTimeEndMin] = useState('');
  
  const [status, setStatus] = useState('active');

  // 🌟 新增：用于嵌入式显示时间格式提示或错误的状态
  const [timeNotice, setTimeNotice] = useState('Use 24-hour format (00-23)');
  const [isNoticeError, setIsNoticeError] = useState(false);

  // 获取清空时分秒的“今天”的凌晨时间
  const getTodayWithNoon = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // --- 事件触发 ---
  const handleBack = () => {
    Alert.alert("Back", "Going back to previous screen...");
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

  // 🌟 优化：失焦校验时直接修改嵌入式提示，不弹窗
  const validateHours = (val, setHourState) => {
    if (val === '') return;
    const hour = parseInt(val, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      setTimeNotice("Hours must be between 0 and 23!");
      setIsNoticeError(true);
      setHourState('');
    } else {
      // 恢复常规提示
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

  // 🌟 当用户聚焦输入框时，恢复原本的常规操作提示
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
      {/* 1. 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back-circle-outline" size={32} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Operation Status</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.divider} />

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

          {/* 🌟 嵌入式 Notice 区域：紧跟在时间选择器下方 */}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 15 : 35 },
  backButton: { justifyContent: 'center', alignItems: 'center' },
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
  
  // 🌟 新增：嵌入式通知栏样式
  noticeContainer: {
    paddingLeft: 100, // 与 fieldLabel 的宽度对齐，使文字刚好在输入框正下方
    marginBottom: 18,
    marginTop: -8,    // 向上微调，缩短与时间输入框的距离
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noticeNormal: {
    color: '#7f8c8d', // 正常状态下为静默的灰色
  },
  noticeError: {
    color: '#ff4d4d', // 输入错误（如超出23小时）时转为警示红色
  },

  radioGroup: { flexDirection: 'row', alignItems: 'center' },
  radioButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  radioCircle: { height: 14, width: 14, borderRadius: 7, borderWidth: 1, borderColor: '#000', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  radioDot: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#000' },
  radioLabel: { fontSize: 12, color: '#000' },
  button: { backgroundColor: '#A9A9A9', paddingVertical: 10, borderRadius: 20, marginTop: 35, width: '55%', alignSelf: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});