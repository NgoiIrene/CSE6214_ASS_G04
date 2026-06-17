import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OrderTrackingPickupScreen({ route, navigation }) {
  const {
    orderId = "ORD-210626",
    orderTime = "01:30 PM",
    orderDate = "13 Jun 26 (SAT)",
    vendorName = "Kafe Mesra",
    vendorLocation = "Level 2, Student Hub"
  } = route?.params || {};

  const [currentStatusLevel, setCurrentStatusLevel] = useState(1);
  const [countdown, setCountdown] = useState(30);
  const [isCancelDisabled, setIsCancelDisabled] = useState(false);

  // 1. 30秒取消倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else {
      setIsCancelDisabled(true);
    }
  }, [countdown]);

  // 2. 模拟监听后端状态
  useEffect(() => {
    const statusSync = setInterval(() => {
      console.log("Syncing with vendor database...");
    }, 5000);
    return () => clearInterval(statusSync);
  }, []);

  const handleCancelOrder = () => {
    Alert.alert("Cancel Order", "Are you sure to cancel order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes", onPress: () => {
          Alert.alert("Order Cancelled", "Dear user, order is successfully cancelled, please wait for 3 working days for refund.",
            [{ text: "OK", onPress: () => navigation.navigate('Home') }]);
        }
      }
    ]);
  };

  const handleConfirmPickup = () => {
    if (currentStatusLevel === 3) {
      setCurrentStatusLevel(4);
      Alert.alert("Enjoy Your Meal!", "Order completed.");
    }
  };

  const renderStep = (level, title, description) => {
    const isActive = currentStatusLevel >= level;
    return (
      <View style={styles.stepRow}>
        <View style={styles.stepIndicatorColumn}>
          <View style={[styles.statusCircle, isActive ? styles.circleActive : styles.circleInactive]}>
            {isActive && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          {level < 4 && <View style={[styles.stepLine, isActive ? styles.lineActive : styles.lineInactive]} />}
        </View>
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, isActive ? styles.textActive : styles.textInactive]}>{title}</Text>
          <Text style={styles.stepDesc}>{description}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* 滚动区域：现在只包含到橙色线（Note提示）为止的内容 */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.orderIdText}>Order ID: {orderId}</Text>
          <Text style={styles.orderTimeText}>Estimated Pick-up Time: {orderDate}, {orderTime}</Text>
          <Text style={styles.vendorText}>Vendor: {vendorName}</Text>
          <Text style={styles.vendorText}>Vendor Location: {vendorLocation}</Text>
        </View>

        <View style={styles.trackingCard}>
          <Text style={styles.trackingTitle}>Order Progress</Text>
          {renderStep(1, "Order Placed", "Your order has been received.")}
          {renderStep(2, "Preparing", "Vendor is preparing your meal.")}
          {renderStep(3, "Ready for Pickup", "Food is ready for collection.")}
          {renderStep(4, "Order Completed", "Enjoy your meal!")}
        </View>

        {/* Cancel Order Button */}
        <TouchableOpacity
          style={[styles.cancelBtn, isCancelDisabled && styles.btnDisabled]}
          disabled={isCancelDisabled}
          activeOpacity={0.7}
          onPress={handleCancelOrder}
        >
          <Text style={styles.cancelBtnText}>
            {isCancelDisabled ? "Cannot Cancel" : `Cancel Order (${countdown}s)`}
          </Text>
        </TouchableOpacity>

        {/* Note! 提示文本区域（作为滚动内容的终点，对应你的橙色线） */}
        <View style={styles.noteContainer}>
          <View style={styles.noteTitleRow}>
            <Ionicons name="warning-outline" size={16} color="#000" style={{ marginRight: 4 }} />
            <Text style={styles.noteMainTitle}>Note!</Text>
          </View>

          <Text style={styles.noteSubTitle}>Grace Period Active:</Text>
          <Text style={styles.noteBodyText}>You have {countdown}s Remaining to cancel order</Text>

          <Text style={[styles.noteSubTitle, { marginTop: 8 }]}>Order Preparing:</Text>
          <Text style={styles.noteBodyText}>Your order will be accepted by Vendor AFTER the 30s grace period</Text>
        </View>
      </ScrollView>

      {/* ✅ 按钮位置调整：将 Pick Up 按钮移到 ScrollView 外面，固定在屏幕底部，永远不会和 Note 抢位置 */}
      <View style={styles.bottomFixedContainer}>
        <TouchableOpacity
          style={[styles.pickupBtn, currentStatusLevel === 3 ? styles.pickupBtnActive : styles.btnDisabled]}
          disabled={currentStatusLevel !== 3}
          activeOpacity={0.7}
          onPress={handleConfirmPickup}
        >
          <Ionicons
            name="fast-food-outline"
            size={20}
            color={currentStatusLevel === 3 ? "#fff" : "#999"}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.pickupBtnText, currentStatusLevel !== 3 && styles.textDisabled]}>
            I Have Picked Up My Order
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderColor: '#000000'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },

  // 调整了底部的内边距，配合固定的底部按钮
  scrollContent: { padding: 16, paddingBottom: 16 },

  infoCard: { backgroundColor: '#fff', padding: 16, borderWidth: 1, borderRadius: 12, marginBottom: 16, elevation: 2 },
  orderIdText: { fontSize: 16, fontWeight: '700', color: '#111' },
  orderTimeText: { fontSize: 14, color: '#666', marginTop: 4 },
  vendorText: { fontSize: 14, color: '#333', marginTop: 4, fontWeight: '600' },

  trackingCard: { backgroundColor: '#fff', padding: 14, borderWidth: 1, borderRadius: 12, elevation: 2, marginBottom: 14 },
  trackingTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 12 },

  stepRow: { flexDirection: 'row', minHeight: 58 },
  stepIndicatorColumn: { alignItems: 'center', marginRight: 14, width: 24 },
  statusCircle: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  circleActive: { backgroundColor: '#2E7D32' },
  circleInactive: { borderWidth: 2, borderColor: '#CCC', backgroundColor: '#FFF' },
  dotInactive: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CCC' },
  stepLine: { width: 3, flex: 1, marginVertical: 2 },
  lineActive: { backgroundColor: '#2E7D32' },
  lineInactive: { backgroundColor: '#E0E0E0' },

  stepTitle: { fontSize: 14, fontWeight: '700' },
  stepDesc: { fontSize: 12, color: '#777', marginTop: 1, marginBottom: 6 },
  textActive: { color: '#2E7D32' },
  textInactive: { color: '#888' },

  cancelBtn: { backgroundColor: '#000000', height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cancelBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  noteContainer: {
    paddingHorizontal: 4,
    marginBottom: 8, // 缩减底部间距，使整体排版紧凑
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteMainTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  noteSubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    lineHeight: 20,
  },
  noteBodyText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 18,
  },

  // ✅ 新增：底部固定按钮的容器样式，带有白色底色撑起并与上方滚动内容完美隔开
  bottomFixedContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 45,
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
  },

  pickupBtn: { height: 48, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  pickupBtnActive: { backgroundColor: '#2E7D32' },

  btnDisabled: { backgroundColor: '#E0E0E0' },
  textDisabled: { color: '#999' },
  pickupBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});