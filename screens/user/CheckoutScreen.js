import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, StatusBar, Modal, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

export default function CheckoutScreen({ route, navigation }) {
  const { items = [], remarks = "" } = route?.params || {};

  // 1. 状态控制
  const [orderType, setOrderType] = useState('Delivery');

  // 🌟 新增：前端自动生成漂亮的订单号 (避免产生垃圾数据)
  const [orderNumber] = useState('ORD-' + Math.floor(100000 + Math.random() * 900000));

  // 🌟 新增：校园建筑选项与弹窗控制
  const BUILDINGS = ['Hostel HB 1', 'Hostel HB 2', 'Hostel HB 3 & 4', 'FCI Building', 'FOM Building', 'Main Library'];
  const [campusBuilding, setCampusBuilding] = useState(BUILDINGS[2]);
  const [showBuildingModal, setShowBuildingModal] = useState(false);

  // 🌟 新增：动态获取 Vendor 地址
  const [vendorAddress, setVendorAddress] = useState('Fetching vendor location...');

  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = itemsTotal * 0.05;
  const deliveryFee = orderType === 'Delivery' ? 5.00 : 0.00;
  const totalPayment = itemsTotal + tax + deliveryFee;

  // 🌟 初始化拉取数据 (钱包余额 & Vendor地址)
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // 拉取钱包余额
      if (user) {
        const { data: walletData } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
        if (walletData) setWalletBalance(walletData.balance);
      }

      // 🌟 智能拉取 Vendor 地址 (根据购物车第一个食物)
      if (items.length > 0) {
        try {
          // A. 找食物是谁卖的
          const { data: foodData } = await supabase.from('food_items').select('vendor_id').eq('id', items[0].id).single();
          if (foodData?.vendor_id) {
            // B. 去 profile 表找老板的地址 (⚠️ 记得在 profiles 表加 address 列)
            const { data: vendorProfile } = await supabase.from('profiles').select('address, full_name').eq('id', foodData.vendor_id).single();
            if (vendorProfile?.address) {
              setVendorAddress(`${vendorProfile.full_name} - ${vendorProfile.address}`);
            } else {
              setVendorAddress(`${vendorProfile.full_name || 'Vendor'} (Address not set)`);
            }
          }
        } catch (err) {
          console.log("Fetch vendor address error: ", err.message);
        }
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  const handlePlaceOrder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please login first");

      if (walletBalance < totalPayment) {
        Alert.alert("Insufficient Balance", "Please top up your wallet.");
        return;
      }

      // 🌟 插入订单 (加入 order_number)
      const { error: orderError } = await supabase.from('orders').insert([{
        user_id: user.id,
        order_number: orderNumber, // 存入刚生成的漂亮订单号
        total_price: totalPayment,
        order_type: orderType.toLowerCase(),
        delivery_building: orderType === 'Delivery' ? campusBuilding : null,
        status: 'pending',
        remarks: remarks
      }]);
      if (orderError) throw orderError;

      // 扣款与清空购物车
      await supabase.from('wallets').update({ balance: walletBalance - totalPayment }).eq('user_id', user.id);
      await supabase.from('carts').delete().eq('user_id', user.id);

      Alert.alert("Success", "Order placed successfully!", [
        { text: "Back to Home", onPress: () => navigation.navigate('Home') },
        {
          text: "Track Order", onPress: () => {
            navigation.navigate(orderType === 'Delivery' ? 'DeliveryOrderTrack' : 'PickupOrderTrack');
          }
        }
      ]);
    } catch (e) {
      Alert.alert("Order Failed", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>

        {/* 🌟 订单号显示区域 */}
        <View style={styles.orderNumberBox}>
          <Text style={styles.orderNumberLabel}>Order No:</Text>
          <Text style={styles.orderNumberValue}>{orderNumber}</Text>
        </View>

        {/* 1. Order Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{items.length} Items</Text></View>
          </View>
          {items.map((item, index) => (
            <View style={styles.itemRow} key={index}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>RM {(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.dashedDivider} />
          <Text style={styles.remarkLabel}>Special Remarks:</Text>
          <Text style={styles.remarkValue}>{remarks || 'None'}</Text>
        </View>

        {/* 2. Delivery/Pickup */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, orderType === 'Delivery' && styles.toggleBtnActive]} onPress={() => setOrderType('Delivery')}>
            <Ionicons name="bicycle-outline" size={18} color={orderType === 'Delivery' ? '#fff' : '#666'} />
            <Text style={[styles.toggleText, orderType === 'Delivery' && styles.toggleTextActive]}>Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, orderType === 'Pick up' && styles.toggleBtnActive]} onPress={() => setOrderType('Pick up')}>
            <Ionicons name="storefront-outline" size={18} color={orderType === 'Pick up' ? '#fff' : '#666'} />
            <Text style={[styles.toggleText, orderType === 'Pick up' && styles.toggleTextActive]}>Pick up</Text>
          </TouchableOpacity>
        </View>

        {orderType === 'Delivery' ? (
          <View style={styles.card}>
            <Text style={styles.inputHeading}>Campus Delivery Building</Text>
            {/* 🌟 改成了可点击的按钮 */}
            <TouchableOpacity style={styles.selectorSelector} onPress={() => setShowBuildingModal(true)}>
              <View style={styles.rowAlign}>
                <Ionicons name="location" size={20} color="#FF8C32" style={{ marginRight: 8 }} />
                <Text style={styles.selectorValueText}>{campusBuilding}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: '#F9F9F9' }]}>
            <Text style={styles.inputHeading}>Pick up Address (Vendor)</Text>
            <View style={[styles.rowAlign, { marginTop: 4, paddingHorizontal: 4 }]}>
              <Ionicons name="cafe" size={20} color="#4A3424" style={{ marginRight: 8 }} />
              <Text style={styles.addressText}>{vendorAddress}</Text>
            </View>
          </View>
        )}

        {/* 4. Payment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          <View style={styles.paymentRow}>
            <View style={styles.rowAlign}>
              <View style={styles.walletIconContainer}><Ionicons name="card" size={20} color="#fff" /></View>
              <View>
                <Text style={styles.paymentMethodName}>Campus Wallet</Text>
                <Text style={styles.walletId}>Balance: RM {walletBalance.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Billing */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={styles.cardTitle}>Billing Details</Text>
          <View style={styles.priceDetailRow}><Text style={styles.priceDetailLabel}>Items Subtotal</Text><Text style={styles.priceDetailValue}>RM {itemsTotal.toFixed(2)}</Text></View>
          <View style={styles.priceDetailRow}><Text style={styles.priceDetailLabel}>SST (5%)</Text><Text style={styles.priceDetailValue}>RM {tax.toFixed(2)}</Text></View>
          {orderType === 'Delivery' && <View style={styles.priceDetailRow}><Text style={styles.priceDetailLabel}>Delivery Fee</Text><Text style={styles.priceDetailValue}>RM {deliveryFee.toFixed(2)}</Text></View>}
        </View>

        {/* 6. Action */}
        <View style={styles.inlineActionBar}>
          <View style={styles.totalPaymentBox}>
            <Text style={styles.totalStickyLabel}>Total Payment</Text>
            <Text style={styles.totalStickyPrice}>RM {totalPayment.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder}>
            <Text style={styles.placeOrderText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 🌟 新增：建筑物选择弹窗 Modal */}
      <Modal visible={showBuildingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Delivery Building</Text>
            <FlatList
              data={BUILDINGS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => { setCampusBuilding(item); setShowBuildingModal(false); }}
                >
                  <Text style={[styles.modalOptionText, campusBuilding === item && { color: '#FF8C32', fontWeight: 'bold' }]}>{item}</Text>
                  {campusBuilding === item && <Ionicons name="checkmark-circle" size={20} color="#FF8C32" />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowBuildingModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// 样式表 (完美保留你的原版设计，仅补充弹窗和Order Number的样式)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: 2, borderColor: '#000000', paddingTop: StatusBar.currentHeight - 35, height: 20 + StatusBar.currentHeight },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111', letterSpacing: 0.3 },
  scrollPadding: { paddingHorizontal: 15, paddingTop: 19, paddingBottom: 100 },

  // 🌟 新增的 Order Number 样式
  orderNumberBox: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  orderNumberLabel: { fontSize: 13, fontWeight: '700', color: '#666', marginRight: 6, textTransform: 'uppercase' },
  orderNumberValue: { fontSize: 15, fontWeight: '900', color: '#000', letterSpacing: 1 },

  card: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  badge: { backgroundColor: '#FFF0E5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#FF8C32', fontSize: 12, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6 },
  itemQty: { fontSize: 14, fontWeight: '700', color: '#FF8C32', width: 26 },
  itemName: { fontSize: 14, fontWeight: '500', color: '#333', flex: 1, paddingRight: 10, lineHeight: 18 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#111' },
  dashedDivider: { height: 1, borderStyle: 'dashed', borderWidth: 0.6, borderColor: '#DDD', marginVertical: 12 },
  remarkLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 2 },
  remarkValue: { fontSize: 14, color: '#444', fontStyle: 'italic' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#EFEFEF', borderRadius: 25, padding: 4, marginBottom: 14 },
  toggleBtn: { flex: 1, flexDirection: 'row', height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
  toggleBtnActive: { backgroundColor: '#22252A', elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#666', marginLeft: 6 },
  toggleTextActive: { color: '#FFF', fontWeight: '700' },
  inputHeading: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 8 },
  selectorSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F6F8', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10 },
  selectorValueText: { fontSize: 14, fontWeight: '600', color: '#111' },
  addressText: { fontSize: 14, fontWeight: '500', color: '#555', flex: 1, lineHeight: 18 },
  rowAlign: { flexDirection: 'row', alignItems: 'center' },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  walletIconContainer: { backgroundColor: '#FF8C32', width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  paymentMethodName: { fontSize: 14, fontWeight: '700', color: '#111' },
  walletId: { fontSize: 12, color: '#777', marginTop: 1 },
  priceDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  priceDetailLabel: { fontSize: 14, color: '#666' },
  priceDetailValue: { fontSize: 14, fontWeight: '600', color: '#222' },
  inlineActionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 6 },
  totalPaymentBox: { justifyContent: 'center' },
  totalStickyLabel: { fontSize: 12, fontWeight: '600', color: '#666' },
  totalStickyPrice: { fontSize: 22, fontWeight: '900', color: '#111', marginTop: 2 },
  placeOrderBtn: { backgroundColor: '#FF8C32', flexDirection: 'row', paddingHorizontal: 24, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#FF8C32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  // 🌟 新增弹窗样式
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#111', textAlign: 'center' },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#eee' },
  modalOptionText: { fontSize: 16, color: '#333' },
  modalCloseBtn: { marginTop: 20, paddingVertical: 15, backgroundColor: '#f0f0f0', borderRadius: 10, alignItems: 'center' },
  modalCloseText: { fontSize: 16, fontWeight: 'bold', color: '#333' }
});