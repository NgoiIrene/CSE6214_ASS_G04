import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

export default function OrderTrackingPickupScreen({ route, navigation }) {
  // 🌟 从 navigation 统一接收 orderNumber (做了兼容处理)
  const orderNumber = route?.params?.orderNumber || route?.params?.orderId;
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentStatusLevel, setCurrentStatusLevel] = useState(1);
  const [countdown, setCountdown] = useState(30);
  const [isCancelDisabled, setIsCancelDisabled] = useState(false);

  const [eta, setEta] = useState('Calculating...');
  const [hasAlertedDelay, setHasAlertedDelay] = useState(false);
  // 🌟 新增：用来记录是不是用户自己按的取消按钮
  const isUserCancellingRef = useRef(false);

  // 🌟 1. 初次读取数据库逻辑 (已修复 PGRST201 报错)
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderNumber) {
        setLoading(false);
        return;
      }

      // 第一步：先单纯地查出 orders 表的数据
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (orderError) {
        console.error("Fetch order error:", orderError);
      } else if (orderResult) {

        // 第二步：拿到 order 后，手动去查对应 Vendor 的 profile
        if (orderResult.vendor_id) {
          const { data: vendorResult } = await supabase
            .from('profiles')
            .select('full_name') // 🌟 去掉 address 的查询
            .eq('id', orderResult.vendor_id)
            .single();

          if (vendorResult) {
            orderResult.profiles = vendorResult; // 拼接到对象里，让下面的 UI 能够正常读取
          }
        }

        setOrderData(orderResult); // 🌟 成功塞入数据，UI 瞬间更新！
      }

      setLoading(false);
    };
    fetchOrderDetails();
  }, [orderNumber]);

  // 🌟 2. 动态计算 ETA (下单时间 + 30秒宽限期 + 30分钟准备时间)
  useEffect(() => {
    if (orderData && orderData.created_at) {
      // 获取订单的创建时间
      const createdAt = new Date(orderData.created_at);

      // 计算 ETA: 下单时间 + 30.5分钟 (30s 宽限期 + 30min 准备)
      const etaTime = new Date(createdAt.getTime() + (30.5 * 60 * 1000));

      // 🌟 修复：只拿时间的 AM/PM，完美避开 Android 引擎报错
      const timeString = etaTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      setEta(timeString); // 成功算出时间并更新 UI
    }
  }, [orderData]);


  // 🌟 3. 30秒倒计时 & 触发正式下单
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0 && !isCancelDisabled) {
      setIsCancelDisabled(true);
      finalizeOrder();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown, isCancelDisabled]);

  const finalizeOrder = async () => {
    if (!orderNumber) return;

    // Pickup 的初始状态设定为 pending_vendor
    const { error } = await supabase
      .from('orders')
      .update({ status: 'pending_vendor' })
      .eq('order_number', orderNumber);

    if (error) {
      console.error("Finalize order error:", error.message);
      // 🌟 修复 2：如果数据库拒绝更新，会立刻弹窗提醒你！
      Alert.alert(
        "Database Error",
        `Could not update status to 'pending_vendor'.\nError: ${error.message}\n\nPlease check your Supabase 'orders' table to ensure 'pending_vendor' is an allowed status.`
      );
    }
  };

  // 🌟 4. 实时轮询逻辑 (用于更新状态)
  useEffect(() => {
    if (!orderData?.order_number) return;

    const statusSync = setInterval(async () => {
      const { data } = await supabase
        .from('orders')
        .select('status, created_at')
        .eq('order_number', orderData.order_number)
        .single();

      if (data) {
        const currentStatus = data.status;

        // 🔴 如果订单被拒绝
        if (currentStatus === 'rejected') {
          clearInterval(statusSync);
          // 🌟 修改：如果是用户自己取消的，就不弹 Vendor Rejected 的警告！
          if (!isUserCancellingRef.current) {
            Alert.alert("Order Rejected", "Vendor rejected the order.", [
              { text: "OK", onPress: () => navigation.navigate('Home') }
            ]);
          }
        }
        // 🟢 5. Completed
        else if (currentStatus === 'completed') {
          setCurrentStatusLevel(5);
          clearInterval(statusSync);
        }
        // 🟢 4. Ready for Pickup
        else if (currentStatus === 'ready_for_pickup') {
          setCurrentStatusLevel(4);
        }
        // 🟢 3. Accepted by Vendor & Preparing (点亮 1, 2, 3)
        else if (currentStatus === 'preparing') {
          setCurrentStatusLevel(3);
        }
        // 🟡 1. Order Placed / 还在 pending 状态 (加上了纯 pending 兜底)
        else if (currentStatus === 'pending_vendor' || currentStatus === 'pending_grace_period' || currentStatus === 'pending') {
          setCurrentStatusLevel(1);

          // 🌟 检查超时
          const createdAt = new Date(data.created_at).getTime();
          const etaTime = createdAt + (30.5 * 60 * 1000);
          if (Date.now() > etaTime && !hasAlertedDelay) {
            setHasAlertedDelay(true);
            Alert.alert("Order Delayed", "The vendor is taking longer than expected to prepare your order.");
          }
        }
      }
    }, 5000);

    return () => clearInterval(statusSync);
  }, [orderData, hasAlertedDelay]);

  // 🌟 5. 取消订单 (包含退款)
  const handleCancelOrder = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            // 🌟 新增：打上记号，告诉系统这是我自己取消的！
            isUserCancellingRef.current = true;

            setIsCancelDisabled(true);

            // 修改状态为 rejected
            const { error: cancelError } = await supabase
              .from('orders')
              .update({ status: 'cancelled' })
              .eq('order_number', orderNumber);
            if (cancelError) throw cancelError;

            // 退款逻辑
            if (orderData && orderData.total_price) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data: walletData } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
                if (walletData) {
                  const newBalance = walletData.balance + orderData.total_price;
                  await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', user.id);
                }
              }
            }

            Alert.alert("Order Cancelled", "Your order has been cancelled and the amount has been refunded to your wallet.", [
              { text: "OK", onPress: () => navigation.navigate('Home') }
            ]);
          } catch (error) {
            Alert.alert("Cancel Failed", error.message);
            setIsCancelDisabled(false);
          }
        }
      }
    ]);
  };

  // 🌟 6. 用户点击“我已经取餐”
  const handleConfirmPickup = async () => {
    if (currentStatusLevel === 4) { // 必须是 ready_for_pickup 才能按
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'completed' })
          .eq('order_number', orderNumber);

        if (error) throw error;

        setCurrentStatusLevel(5);
        Alert.alert("Enjoy Your Meal!", "Order is successfully completed.", [
          { text: "OK", onPress: () => navigation.navigate('Home') }
        ]);
      } catch (error) {
        Alert.alert("Error", "Could not complete order. Please try again.");
      }
    }
  };

  const renderStep = (level, title, description) => {
    const isActive = currentStatusLevel >= level;
    return (
      <View style={styles.stepRow} key={level}>
        <View style={styles.stepIndicatorColumn}>
          <View style={[styles.statusCircle, isActive ? styles.circleActive : styles.circleInactive]}>
            {isActive && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          {level < 5 && <View style={[styles.stepLine, isActive ? styles.lineActive : styles.lineInactive]} />}
        </View>
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, isActive ? styles.textActive : styles.textInactive]}>{title}</Text>
          <Text style={styles.stepDesc}>{description}</Text>
        </View>
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  // 提取 Vendor 信息 (🌟 名字和地址都指向 full_name)
  const vendorName = orderData?.profiles?.full_name || "Vendor";
  const vendorLocation = orderData?.profiles?.full_name || "Vendor";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.orderIdText}>Order ID: {orderData?.order_number || "N/A"}</Text>
          <Text style={styles.orderTimeText}>Estimated Pick-up Time: {eta}</Text>
          <Text style={styles.vendorText}>Vendor: {vendorName}</Text>
          <Text style={styles.vendorText}>Vendor Location: {vendorLocation}</Text>
        </View>

        <View style={styles.trackingCard}>
          <Text style={styles.trackingTitle}>Order Progress</Text>
          {renderStep(1, "Order Placed", "Your order has been received.")}
          {renderStep(2, "Accepted by Vendor", "Vendor has accepted your order.")}
          {renderStep(3, "Preparing", "Vendor is preparing your meal.")}
          {renderStep(4, "Ready for Pickup", "Food is ready for collection.")}
          {renderStep(5, "Order Completed", "Enjoy your meal!")}
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

      {/* 🌟 用户自己点击的 Pickup 按钮 */}
      <View style={styles.bottomFixedContainer}>
        <TouchableOpacity
          style={[styles.pickupBtn, currentStatusLevel === 4 ? styles.pickupBtnActive : styles.btnDisabled]}
          disabled={currentStatusLevel !== 4}
          activeOpacity={0.7}
          onPress={handleConfirmPickup}
        >
          <Ionicons
            name="fast-food-outline"
            size={20}
            color={currentStatusLevel === 4 ? "#fff" : "#999"}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.pickupBtnText, currentStatusLevel !== 4 && styles.textDisabled]}>
            I Have Picked Up My Order
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: 2, borderColor: '#000000' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
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
  stepLine: { width: 3, flex: 1, marginVertical: 2 },
  lineActive: { backgroundColor: '#2E7D32' },
  lineInactive: { backgroundColor: '#E0E0E0' },
  stepTitle: { fontSize: 14, fontWeight: '700' },
  stepDesc: { fontSize: 12, color: '#777', marginTop: 1, marginBottom: 6 },
  textActive: { color: '#2E7D32' },
  textInactive: { color: '#888' },
  cancelBtn: { backgroundColor: '#000000', height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cancelBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  noteContainer: { paddingHorizontal: 4, marginBottom: 8 },
  noteTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  noteMainTitle: { fontSize: 16, fontWeight: '700', color: '#000' },
  noteSubTitle: { fontSize: 14, fontWeight: '700', color: '#333', lineHeight: 20 },
  noteBodyText: { fontSize: 14, color: '#555', lineHeight: 18 },
  bottomFixedContainer: { backgroundColor: '#F8F9FA', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 45, borderTopWidth: 1, borderColor: '#E0E0E0' },
  pickupBtn: { height: 48, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  pickupBtnActive: { backgroundColor: '#2E7D32' },
  btnDisabled: { backgroundColor: '#E0E0E0' },
  textDisabled: { color: '#999' },
  pickupBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});