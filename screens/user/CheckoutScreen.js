import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, StatusBar, Modal, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

export default function CheckoutScreen({ route, navigation, setCheckoutData }) {
  const { items = [], remarks = "" } = route?.params || {};

  // 1. 状态控制
  const [orderType, setOrderType] = useState('Delivery');

  // 🌟 新增：前端自动生成漂亮的订单号 (避免产生垃圾数据)
  const [orderNumber] = useState('ORD-' + Math.floor(100000 + Math.random() * 900000));

  // 🌟 新增：校园建筑选项与弹窗控制
  const BUILDINGS = ['Hostel HB 1', 'Hostel HB 2', 'Hostel HB 3 & 4', 'FCI Building', 'FOM Building'];
  const [campusBuilding, setCampusBuilding] = useState(BUILDINGS[2]);
  const [showBuildingModal, setShowBuildingModal] = useState(false);

  // 🌟 新增：动态获取 Vendor 地址
  const [vendorAddress, setVendorAddress] = useState('Fetching vendor location...');

  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🌟 1. 新增两个 State 来存 Vendor ID 和 Customer Name
  const [vendorId, setVendorId] = useState(null);
  const [customerName, setCustomerName] = useState('Customer');

  const [deliveryFee, setDeliveryFee] = useState(0);

  // 🌟 1. 新增：SST Rate 的状态 (默认 5%，即 0.05)
  const [sstRate, setSstRate] = useState(0.05);

  const totalItemsQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // 🌟 2. 修改：使用动态抓取到的 sstRate 计算税务
  const tax = itemsTotal * sstRate;

  // 根据选择的配送方式，决定当前运费是多少
  const currentDeliveryFee = orderType === 'Delivery' ? deliveryFee : 0;
  const totalPayment = itemsTotal + tax + currentDeliveryFee;


  // 🌟 初始化拉取数据 (钱包余额 & Vendor地址 & 动态运费)
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 抓钱包余额 和 用户名字
        const { data: walletData } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
        if (walletData) setWalletBalance(walletData.balance);

        const { data: profileData } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (profileData?.full_name) setCustomerName(profileData.full_name);

        // ==========================================
        // 🌟 新增：抓取全局 SST Rate
        // ==========================================
        const { data: finSettings } = await supabase
          .from('system_financial_settings')
          .select('sst_rate')
          .eq('id', 1)
          .single();

        if (finSettings && finSettings.sst_rate !== null) {
          // 数据库如果是 6，就转成 0.06
          setSstRate(parseFloat(finSettings.sst_rate) / 100);
        }

      }

      // 🌟 智能拉取 Vendor 地址 (根据购物车第一个食物)
      if (items.length > 0) {
        try {
          const { data: foodData } = await supabase.from('food_items').select('vendor_id').eq('id', items[0].id).single();
          if (foodData?.vendor_id) {
            setVendorId(foodData.vendor_id); // 存起来，等下放进 orders 表

            // 1. 查 Vendor 地址 (🌟 现在的地址直接等于 Vendor 的名字)
            const { data: vendorProfile } = await supabase.from('profiles').select('full_name').eq('id', foodData.vendor_id).single();
            if (vendorProfile?.full_name) {
              setVendorAddress(vendorProfile.full_name);
            } else {
              setVendorAddress('Vendor Name Unknown');
            }

            // ==========================================
            // 🌟 2. 新增：根据查到的 vendor_id 去查真实运费！
            // ==========================================
            const { data: zoneData, error: zoneError } = await supabase
              .from('delivery_zones')
              .select('base_fee, extra_fee')
              .eq('vendor_id', foodData.vendor_id)
              .single();

            if (!zoneError && zoneData) {
              const dbBaseFee = parseFloat(zoneData.base_fee || 0);
              const dbExtraFee = parseFloat(zoneData.extra_fee || 0);
              setDeliveryFee(dbBaseFee + dbExtraFee); // 👈 更新 UI 运费状态！
            } else {
              console.warn("Could not fetch delivery zones for UI:", zoneError?.message);
            }
            // ==========================================

          }
        } catch (err) {
          console.log("Fetch vendor address error: ", err.message);
        }
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  // 🌟 3. 升级下单逻辑：把你表里所有的列都精准填入！
  const handlePlaceOrder = async () => {
    try {
      // 🌟 新增：防御性检查，防止 vendorId 为空
      let currentVendorId = vendorId;
      if (!currentVendorId && items.length > 0) {
        const { data: foodData } = await supabase.from('food_items').select('vendor_id').eq('id', items[0].id).single();
        if (foodData) currentVendorId = foodData.vendor_id;
      }

      if (!currentVendorId) {
        throw new Error("Cannot identify the vendor. Please try again.");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please login first");

      if (walletBalance < totalPayment) {
        Alert.alert("Insufficient Balance", "Please top up your wallet.");
        return;
      }

      // ==========================================
      // 🌟 新增融合：去 Database 拿最新的抽成设定
      // ==========================================
      const { data: settings, error: settingsError } = await supabase
        .from('system_financial_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (settingsError) throw new Error("Failed to fetch system financial settings.");

      // 提取设定的百分比
      const commissionRate = settings.commission_rate / 100;

      // 🌟 新增：去 delivery_zones 表拿 extra_fee
      // （这里默认拿 id = 1 的 zone，如果你的系统有匹配建筑物的逻辑，可后续更改 id）
      const { data: zoneData, error: zoneError } = await supabase
        .from('delivery_zones')
        .select('base_fee, extra_fee')
        .eq('vendor_id', currentVendorId)
        .single();

      if (zoneError) {
        console.warn("Could not fetch delivery_zones data:", zoneError.message);
      }

      // 🌟 2. 新增：计算真实的运费 (base_fee + extra_fee) 和最终总价
      const dbBaseFee = parseFloat(zoneData?.base_fee || 0);
      const dbExtraFee = parseFloat(zoneData?.extra_fee || 0);

      const finalDeliveryFee = orderType === 'Delivery' ? (dbBaseFee + dbExtraFee) : 0;
      const finalTotalPrice = itemsTotal + tax + finalDeliveryFee;

      // 计算本次订单的商家抽成
      const calculatedVendorCommission = itemsTotal * commissionRate;

      // 🌟 关键修改：直接使用 delivery_zones 里的 extra_fee 作为 delivery_split
      // const calculatedDeliverySplit = orderType === 'Delivery'
      //   ? parseFloat(zoneData?.extra_fee || 0)
      //   : 0;

      // 🌟 保持 extra_fee 作为外卖员的 delivery_split
      const calculatedDeliverySplit = orderType === 'Delivery' ? dbExtraFee : 0;

      // 🌟 把购物车里的 items 变成一串文字 (例如: "1x Bibimbap, 2x Coke")
      const foodDetailsString = items.map(item => `${item.quantity}x ${item.name}`).join(', ');

      // 🌟 插入订单，对应你截图中所有的列名！
      const { error: orderError } = await supabase.from('orders').insert([{
        user_id: user.id,
        vendor_id: currentVendorId,              // 存入商家 ID
        order_number: orderNumber,        // ORD-xxxxxx
        order_type: orderType.toLowerCase(), // delivery 或 pick up
        delivery_building: orderType === 'Delivery' ? campusBuilding : null, // 只有 Delivery 才有 Building
        food_details: foodDetailsString,  // 存入食物文字详情
        subtotal: itemsTotal,             // RM 10.00
        sst_fee: tax,                     // RM 0.50
        delivery_fee: finalDeliveryFee,        // RM 5.00
        total_price: finalTotalPrice,        // RM 15.50
        payment_method: 'Campus Wallet',  // 支付方式
        status: 'pending',                // 初始状态
        remarks: remarks,                  // 备注
        food_items_json: JSON.stringify(items), // 🌟 关键：把 items 数组存成 JSON 字符串

        // 👇 融合进来的新字段：锁定这笔订单的财务账目
        // 👇 给计算结果加上安全转换，消除红线
        vendor_commission: parseFloat(Number(calculatedVendorCommission || 0).toFixed(2)),
        delivery_split: parseFloat(Number(calculatedDeliverySplit || 0).toFixed(2))
      }]);
      if (orderError) throw orderError;

      // 扣款与清空购物车
      await supabase.from('wallets').update({ balance: walletBalance - finalTotalPrice }).eq('user_id', user.id);
      // 🌟 关键：在这里直接标记为已下单 (is_ordered: true)
      const { error: cartError } = await supabase
        .from('carts')
        .update({ is_ordered: true })
        .eq('user_id', user.id)
        .eq('is_ordered', false);

      if (cartError) {
        console.error("Failed to mark cart as ordered:", cartError.message);
      }

      await supabase
        .from('carts')
        .update({ is_ordered: true }) // 🌟 标记这些购物车条目为“已下单”
        .eq('user_id', user.id)
        .eq('is_ordered', false); // 🌟 只标记那些还没被下单的

      // 🌟 在这里增加这一行，确保 CheckoutScreen 记住了刚刚下单的订单号
      setCheckoutData(prev => ({ ...prev, lastOrderNumber: orderNumber }));

      Alert.alert("Success", "Order placed successfully! Click the TRACK ORDER button to track it now, or view it anytime in the Order History from the Home page sidebar.", [
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

        {/* 1. Order Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{totalItemsQuantity} Items</Text></View>
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
          <View style={styles.priceDetailRow}>
            <Text style={styles.priceDetailLabel}>SST ({(sstRate * 100).toFixed(0)}%)
            </Text>
            <Text style={styles.priceDetailValue}>RM {tax.toFixed(2)}
            </Text>
          </View>
          {/* 找到这行并替换 */}
          {orderType === 'Delivery' && <View style={styles.priceDetailRow}>
            <Text style={styles.priceDetailLabel}>Delivery Fee</Text>
            <Text style={styles.priceDetailValue}>RM {currentDeliveryFee.toFixed(2)}
            </Text>
          </View>
          }
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