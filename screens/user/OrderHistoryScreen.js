import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function OrderHistoryScreen({ onOpenMenu, navigation }) {
  const [activeTab, setActiveTab] = useState('Active');
  const [isModalVisible, setModalVisible] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [displayOrderId, setDisplayOrderId] = useState('');

  
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
       const { data, error } = await supabase
        .from('orders')
        .select(`
        *,
        profiles:vendor_id (full_name)
      `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error("Fetch Error:", e.message);
    }
  };

  useEffect(() => {
    fetchOrders();
     const channel = supabase
      .channel('order-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
     return () => { supabase.removeChannel(channel); };
  }, []);

   const filteredOrders = orders.filter(order => {
     const status = (order.status || '').trim().toLowerCase();
     const isPast = status === 'completed' || status === 'cancelled';
     return activeTab === 'Past' ? isPast : !isPast;
   });

  // 处理重购
  const handleReorder = async (order) => {
    try {
      // 确保解析 JSON
      const items = typeof order.food_items_json === 'string'
        ? JSON.parse(order.food_items_json)
        : order.food_items_json;
      if (!items || items.length === 0) {
        Alert.alert("Info", "No items to reorder.");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('carts').delete().eq('user_id', user.id);
      const { error } = await supabase.from('carts').insert(
        items.map(item => ({
          user_id: user.id,
          food_id: item.id,
          quantity: item.quantity
        }))
      );
      if (error) throw error;
      Alert.alert("Success", "Items re-added to cart!");
    } catch (e) {
      Alert.alert("Reorder Failed", e.message);
    }
  };

  const handleDownloadInvoice = async (order) => {
    const items = typeof order.food_items_json === 'string'
      ? JSON.parse(order.food_items_json)
      : order.food_items_json;

    // 1. 生成商品列表 (移除了 Qty)
    const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">RM ${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

    // 2. 动态构建费用明细
    let feesHtml = '';
    if (order.order_type !== 'pick up') {
      feesHtml += `<p><strong>Delivery Fee:</strong> RM ${order.delivery_fee?.toFixed(2) || '0.00'}</p>`;
    }
    feesHtml += `<p><strong>SST Fee:</strong> RM ${order.sst_fee?.toFixed(2) || '0.00'}</p>`;

    // 3. 构建 HTML
    const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 40px; }
          h1 { font-size: 32px; text-align: center; }
          p, td, th { font-size: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          .total { font-size: 22px; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { margin-top: 60px; text-align: left; border-top: 2px solid #eee; padding-top: 20px; }
          .footer p { font-size: 16px; margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>E-Invoice</h1>
        <p><strong>Order ID:</strong> #${order.order_number}</p>
        <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
        <p><strong>Shop:</strong> ${order.profiles?.full_name || 'N/A'}</p>
        <p><strong>Order Type:</strong> ${order.order_type || 'N/A'}</p>
        <p><strong>Payment Method:</strong> ${order.payment_method || 'N/A'}</p>
        <hr/>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Item</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        
        ${feesHtml}
        <p class="total">Total Price: RM ${order.total_price ? order.total_price.toFixed(2) : '0.00'}</p>
        
        <div class="footer">
          <p>Thank you for ordering with our Campus Food Ordering and Management System!</p>
          <p>Please come again. We hope you enjoy your meal!</p>
        </div>
      </body>
    </html>
  `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Error", "Could not generate invoice: " + error.message);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a star rating.");
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Error", "You must be logged in to submit a review.");
        return;
      }

      // Insert review into the reviews table
      const { error } = await supabase.from('reviews').insert([
        {
          order_id: currentOrderId,
          user_id: user.id,
          rating: rating,
          review_text: reviewText,
        }
      ]);

      if (error) throw error;
       Alert.alert("Success", "Review submitted successfully!");
      setModalVisible(false); // Close modal after submission
      setRating(0);
      setReviewText('');
    } catch (error) {
      Alert.alert("Submit Failed", error.message);
    }
  };

  const renderStars = () => {
    let stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <FontAwesome name={i <= rating ? "star" : "star-o"} size={36} color={i <= rating ? "#f5c518" : "#ccc"} style={{ marginHorizontal: 5 }} />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenMenu}><Ionicons name="menu" size={30} color="black" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'Active' ? styles.activeTab : null]} onPress={() => setActiveTab('Active')}>
          <Text style={styles.tabText}>Active Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'Past' ? styles.activeTab : null]} onPress={() => setActiveTab('Past')}>
          <Text style={styles.tabText}>Past Orders</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea}>
        {filteredOrders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>#{order.order_number || 'N/A'}</Text>
              <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.label}>Order status</Text>
              <Text style={{
                color: order.status === 'completed' ? 'green' : order.status === 'cancelled' ? 'red' : 'orange',
                fontWeight: 'bold'
              }}> {order.status}</Text>
            </View>

            {/* 🌟 干净整洁的 Shop Name 与 TRACK ORDER 按钮 */}
            <View style={styles.shopNameRow}>
              <View>
                <Text style={styles.label}>Shop Name:</Text>
                <Text style={styles.shopName}>
                  {order.profiles ? order.profiles.full_name : 'Unknown Vendor'}
                </Text>
              </View>

              {/* 🌟 只有在 Active 状态下显示唯一的 TRACK ORDER 按钮 */}
              {activeTab === 'Active' && (
                <TouchableOpacity
                  style={styles.trackOrderBtn}
                  onPress={() => {
                    const isDelivery = order.order_type?.toLowerCase() === 'delivery';
                    if (navigation) {
                      navigation.navigate(
                        isDelivery ? 'DeliveryOrderTrack' : 'PickupOrderTrack',
                        { orderNumber: order.order_number }
                      );
                    } else {
                      Alert.alert("Navigation Error", "Navigation object is missing.");
                    }
                  }}
                >
                  <Text style={styles.trackOrderText}>TRACK ORDER</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 只有 Past Orders 显示下方按钮 */}
            {activeTab === 'Past' && (
              <>
                <View style={styles.singleActionRow}>
                  <TouchableOpacity style={styles.btnDownloadFull} onPress={() => handleDownloadInvoice(order)}>
                    <Text style={styles.btnTextBlack}>Download E-invoice</Text>
                  </TouchableOpacity>
                </View>

                {order.status === 'completed' && (
                  <TouchableOpacity
                    style={styles.btnReview}
                    onPress={() => {
                      setCurrentOrderId(order.id);
                      setDisplayOrderId(order.order_number);
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.btnTextBlack}>Make a review</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color="#ccc" /></TouchableOpacity>
            <Text style={styles.modalTitle}>Rate your Order</Text>
            <Text style={styles.modalOrderId}>#{displayOrderId}</Text>
            {renderStars()}
            <Text style={styles.reviewLabel}>Your Review (Optional)</Text>
            <TextInput style={styles.textInput} multiline={true} numberOfLines={4} placeholder="The food is excellent..." value={reviewText} onChangeText={setReviewText} textAlignVertical="top" />
            <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmitReview}><Text style={styles.btnTextWhite}>Submit</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: 'white', borderBottomWidth: 2, borderColor: 'black' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', fontFamily: 'serif' },
  tabContainer: { flexDirection: 'row', alignSelf: 'center', backgroundColor: '#e0e0e0', borderRadius: 25, marginVertical: 15, padding: 5 },
  tabButton: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20 },
  activeTab: { backgroundColor: 'white' },
  tabText: { fontWeight: 'bold', fontSize: 16 },
  scrollArea: { paddingHorizontal: 15 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#ddd', marginHorizontal: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontSize: 16, fontWeight: 'bold' },
  orderDate: { fontSize: 14, color: 'black', fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 14, color: '#555', marginTop: 5 },
  iconTextWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statusCompleted: { color: 'green', fontWeight: 'bold' },
  statusCancelled: { color: 'red', fontWeight: 'bold' },
  shopName: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  singleActionRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 5 },
  btnDownloadFull: { width: '100%', backgroundColor: '#d3d3d3', paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  btnDownload: { flex: 1.3, backgroundColor: '#d3d3d3', paddingVertical: 10, paddingHorizontal: 5, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  btnReorder: { flex: 0.9, backgroundColor: '#222', paddingVertical: 10, paddingHorizontal: 5, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnReview: { backgroundColor: 'white', marginTop: 10, padding: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  btnTextBlack: { fontWeight: 'bold', color: 'black', fontSize: 12 },
  btnTextWhite: { fontWeight: 'bold', color: 'white', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 400, backgroundColor: 'white', borderRadius: 15, padding: 25, position: 'relative' },
  closeBtn: { position: 'absolute', top: 15, right: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  modalOrderId: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  reviewLabel: { fontWeight: 'bold', marginBottom: 10 },
  textInput: { borderWidth: 1, borderColor: '#333', borderRadius: 10, height: 100, padding: 10, fontSize: 14, backgroundColor: '#fafafa' },
  btnSubmit: { backgroundColor: '#222', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  shopNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 5 },
  trackOrderBtn: {
    backgroundColor: '#000000', // 🌟 变成黑色填充背景
    paddingHorizontal: 14,
    paddingVertical: 8, // 稍微增加一点高度让按钮更好看
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  trackOrderText: {
    color: '#ffffff', // 🌟 文字变成纯白色
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
}); 