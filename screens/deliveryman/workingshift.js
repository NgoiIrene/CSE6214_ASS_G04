import { useNavigation } from '@react-navigation/native';

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function WorkingShift() {
  const navigation = useNavigation(); // 🌟 加上这一行
  // ================= 1. 动态状态管理 (State) =================
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    return today;
  };

  const [currentDate, setCurrentDate] = useState(getToday());
  const [showPicker, setShowPicker] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const initialShiftsTemplate = [
    { id: 1, time: '8.00AM - 10.30AM', duration: '(2hrs 30min)', state: 'available' },
    { id: 2, time: '10.30AM - 12.30PM', duration: '(2hrs)', state: 'available' },
    { id: 3, time: '2.00PM - 3.30PM', duration: '(1hr 30min)', state: 'available' },
    { id: 4, time: '5.00PM - 7.00PM', duration: '(2hrs)', state: 'available' },
    { id: 5, time: '1.00PM - 3.00PM', duration: '(2hrs)', state: 'available' },
  ];

  const [shiftsByDate, setShiftsByDate] = useState({});

  const currentDateKey = currentDate.toDateString();
  const currentShifts = shiftsByDate[currentDateKey] || initialShiftsTemplate;

  // ================= 2. 日期算法 =================
  const getWeekDays = (targetDate) => {
    const dateCopy = new Date(targetDate);
    const dayOfWeek = dateCopy.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(dateCopy.setDate(dateCopy.getDate() + distanceToMonday));
    
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekArray = [];
    
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      weekArray.push({
        day: dayNames[i],
        date: nextDay.getDate().toString(),
        fullDate: nextDay
      });
    }
    return weekArray;
  };

  const weekDays = getWeekDays(currentDate);
  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const currentMonthText = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // ================= 3. 拦截与安全逻辑 =================
  const isPastDate = (dateToCheck) => {
    const copy = new Date(dateToCheck);
    copy.setHours(0, 0, 0, 0);
    return copy < getToday();
  };

  // ================= 4. 交互逻辑 (Actions) =================
  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  };

  const handleDatePress = (fullDate) => {
    if (isPastDate(fullDate)) {
      return; 
    }
    setCurrentDate(fullDate);
  };

  const handlePrevMonth = () => {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
    if (isPastDate(prev)) {
      Alert.alert("Notice", "Kept at today to prevent accessing past dates.");
      setCurrentDate(getToday());
      return;
    }
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
    setCurrentDate(next);
  };

  const toggleShift = (id) => {
    const updatedShifts = currentShifts.map(shift => {
      if (shift.id === id) {
        if (shift.state === 'available') return { ...shift, state: 'selected' };
        if (shift.state === 'selected') return { ...shift, state: 'available' };
      }
      return shift;
    });
    setShiftsByDate({ ...shiftsByDate, [currentDateKey]: updatedShifts });
  };

  const handleSave = () => {
    let hasSelected = false;
    const updatedShifts = currentShifts.map(shift => {
      if (shift.state === 'selected') {
        hasSelected = true;
        return { ...shift, state: 'taken' };
      }
      return shift;
    });

    if (hasSelected) {
      setShiftsByDate({ ...shiftsByDate, [currentDateKey]: updatedShifts });
      Alert.alert("Success", "Shifts saved successfully!");
    } else {
      Alert.alert("Notice", "Please select at least one available shift.");
    }
  };

  const handleBack = () => {
    const hasUnsavedChanges = currentShifts.some(shift => shift.state === 'selected');

    if (hasUnsavedChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have selected shifts but haven't saved them. Are you sure you want to leave?",
        [
          { text: "No", style: "cancel" }, 
          { 
            text: "Yes, Discard", 
            style: "destructive", 
            onPress: () => navigation.goBack() // 🌟 确认丢弃后，直接退回上一页
          }
        ]
      );
    } else {
      navigation.goBack(); // 🌟 如果没有未保存的更改，直接退回上一页
    }
  };

  // ================= 5. 界面渲染 (UI) =================
  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIcon} onPress={() => setIsSidebarOpen(true)}>
          <View style={styles.menuIconBorder}>
            <Ionicons name="menu" size={26} color="black" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AVAILABLE SHIFTS</Text>
        <View style={{ width: 40, marginLeft: 15 }} /> 
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        
        <View style={styles.monthNavRow}>
          <TouchableOpacity onPress={handleBack} style={styles.iconButtonOutline}>
            <Ionicons name="arrow-back" size={20} color="black" />
          </TouchableOpacity>

          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn}>
              <Ionicons name="chevron-back" size={20} color="black" />
            </TouchableOpacity>
            <Text style={styles.monthText}>{currentMonthText}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn}>
              <Ionicons name="chevron-forward" size={20} color="black" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.iconButtonOutline}>
            <Ionicons name="calendar-outline" size={20} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.weekStrip}>
          {weekDays.map((item) => {
            const isActive = item.fullDate.toDateString() === currentDate.toDateString();
            const isPast = isPastDate(item.fullDate);
            
            return (
              <TouchableOpacity 
                key={item.fullDate.toString()} 
                style={[
                  styles.dayBlock, 
                  isActive && styles.dayBlockActive,
                  isPast && !isActive && styles.dayBlockPast 
                ]}
                onPress={() => handleDatePress(item.fullDate)}
                disabled={isPast} 
                activeOpacity={0.7}
              >
                <Text style={[styles.dayName, isActive && styles.dayTextActive, isPast && !isActive && styles.dayTextPast]}>
                  {item.day}
                </Text>
                <Text style={[styles.dayDate, isActive && styles.dayTextActive, isPast && !isActive && styles.dayTextPast]}>
                  {item.date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>Available Shifts ({currentShifts.length})</Text>
          
          {currentShifts.map((shift) => {
            let btnStyle = styles.btnAvailable;
            let btnTextStyle = styles.btnTextAvailable;
            let btnLabel = "Take Shift";
            let cardHighlight = null;

            if (shift.state === 'selected') {
              btnStyle = styles.btnSelected;
              btnTextStyle = styles.btnTextSelected;
              btnLabel = "Selected ✓";
              cardHighlight = styles.shiftCardSelected; 
            } else if (shift.state === 'taken') {
              btnStyle = styles.btnTaken;
              btnTextStyle = styles.btnTextTaken;
              btnLabel = "Taken";
            }

            return (
              <View key={shift.id} style={[styles.shiftCard, cardHighlight]}>
                <View style={styles.shiftInfo}>
                  <Ionicons name="time-outline" size={20} color="#666" style={{ marginRight: 8, marginTop: 2 }} />
                  <View>
                    <Text style={[styles.shiftTime, shift.state === 'taken' && styles.textDisabled]}>{shift.time}</Text>
                    <Text style={styles.shiftDuration}>{shift.duration}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.actionBtn, btnStyle]}
                  onPress={() => toggleShift(shift.id)}
                  disabled={shift.state === 'taken'} 
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionBtnText, btnTextStyle]}>{btnLabel}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save Shifts</Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          minimumDate={getToday()} 
          onChange={onDateChange}
        />
      )}

      {/* ================= 侧边栏 ================= */}
      {isSidebarOpen ? (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity 
            style={styles.closeOverlay} 
            activeOpacity={1} 
            onPress={() => {setIsSidebarOpen(false); // 1. 先关掉菜单
    navigation.navigate('Home'); // 2. 跳转到对应名字的页面
  }}
          />
          
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={36} color="#FFF" />
              </View>
              <Text style={styles.profileName}>Charlene</Text>
            </View>

            <ScrollView style={styles.menuList}>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="home-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="person-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItemActive}>
                <Ionicons name="calendar" size={22} color="#424242" style={styles.menuIconLeft} />
                <Text style={styles.menuTextActive}>Working Shift</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="wallet-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>Earnings & History</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="lock-closed-outline" size={22} color="#666" style={styles.menuIconLeft} />
                <Text style={styles.menuText}>Reset Password</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity 
                style={styles.logoutButton} 
                activeOpacity={0.7}
                onPress={() => {
                  setIsSidebarOpen(false);
                  Alert.alert("Logout", "Logging out...");
                }}
              >
                <Ionicons name="log-out-outline" size={22} color="#FF3B30" style={{ marginRight: 12 }} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
              <View style={{ height: Platform.OS === 'ios' ? 25 : 45, backgroundColor: '#FFF' }} />
            </View>
          </View>
        </View>
      ) : null}
      
    </SafeAreaView>
  );
}

// ================= 6. 专业级样式表 (CSS) =================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  
  /* 更新了 header 的 borderBottomWidth，从 1 变成了 1.5 */
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 15, 
    marginTop: 30, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1.5, // 与 menuIconBorder 的粗度保持一致
    borderBottomColor: '#E0E0E0' 
  },
  
  menuIcon: { paddingHorizontal: 5 },
  menuIconBorder: {
    width: 40, 
    height: 40, 
    borderRadius: 8, 
    borderWidth: 1.5, 
    borderColor: '#000', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#FFF'
  },
  
  headerTitle: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  monthNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#FFF' },
  
  iconButtonOutline: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#D0D0D0',
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#FFF'
  },
  
  monthSelector: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  monthText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 15, textAlign: 'center' },
  arrowBtn: { padding: 5 },

  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  dayBlock: { width: 45, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#F0F0F0' },
  
  dayBlockActive: { backgroundColor: '#424242', elevation: 4, shadowColor: '#424242', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  dayBlockPast: { backgroundColor: '#E8E8E8' },
  dayName: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  dayDate: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  dayTextActive: { color: '#FFF' },
  dayTextPast: { color: '#A0A0A0' },

  listContainer: { flex: 1, padding: 20 },
  listHeader: { fontWeight: 'bold', fontSize: 14, color: '#666', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  shiftCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 15, marginBottom: 12, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, borderWidth: 1, borderColor: '#FFF' },
  shiftCardSelected: { borderColor: '#424242', backgroundColor: '#F5F5F5' },
  shiftInfo: { flexDirection: 'row', alignItems: 'flex-start' },
  shiftTime: { fontWeight: 'bold', fontSize: 15, color: '#000' },
  textDisabled: { color: '#A0A0A0' },
  shiftDuration: { color: '#888', fontSize: 13, marginTop: 4 },
  
  actionBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5 },
  actionBtnText: { fontWeight: 'bold', fontSize: 13 },
  btnAvailable: { backgroundColor: '#FFF', borderColor: '#000' },
  btnTextAvailable: { color: '#000' },
  btnSelected: { backgroundColor: '#424242', borderColor: '#424242' },
  btnTextSelected: { color: '#FFF' },
  btnTaken: { backgroundColor: '#F0F0F0', borderColor: '#E0E0E0' },
  btnTextTaken: { color: '#A0A0A0' },

  footerRow: { flexDirection: 'row', padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  saveBtn: { flex: 1, paddingVertical: 15, borderRadius: 10, backgroundColor: '#424242', alignItems: 'center', elevation: 3, shadowColor: '#424242', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  saveBtnText: { fontWeight: 'bold', fontSize: 16, color: '#FFF' },

  sidebarOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    zIndex: 100, 
  },
  closeOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', 
  },
  sidebar: {
    width: '75%', 
    backgroundColor: '#FFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 15,
  },
  sidebarHeader: {
    alignItems: 'center',
    padding: 25,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    backgroundColor: '#424242', 
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  menuList: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 25,
  },
  menuItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 25,
    backgroundColor: '#F5F5F5', 
    borderLeftWidth: 4,
    borderColor: '#424242',
  },
  menuIconLeft: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  menuTextActive: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#424242',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  logoutButton: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF3B30',
  }
});