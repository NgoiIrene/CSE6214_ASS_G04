import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../supabaseClient'; // 确保路径正确

export default function OrderHistoryScreen({ onOpenMenu }) {
  const [activeTab, setActiveTab] = useState('Active');
  const [isModalVisible, setModalVisible] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const orders = [
    { id: 'ORD-210626', date: '15 May 2026', status: 'Completed', shopName: 'Rasa Sedap', items: [{ id: '1', quantity: 1, name: 'Bibimbap' }] },
    { id: 'ORD-210628', date: '15 May 2026', status: 'Cancelled', shopName: 'Korean House', items: [] },
    { id: 'ORD-231410', date: '19 May 2026', status: 'Completed', shopName: 'Rasa Sedap', items: [{ id: '2', quantity: 1, name: 'Kimchi' }] },
    { id: 'ORD-241511', date: '16 Jun 2026', status: 'Processing', shopName: 'Burger Joint', items: [] },
  ];

  const filteredOrders = orders.filter(order => {
    const isPastOrder = order.status === 'Completed' || order.status === 'Cancelled';
    return activeTab === 'Past' ? isPastOrder : !isPastOrder;
  });

  // 🌟 新增：重购逻辑 (仅此改动)
  const handleReorder = async (order) => {
    try {
      if (!order.items || order.items.length === 0) {
        Alert.alert("Info", "No items to reorder.");
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('carts').delete().eq('user_id', user.id);
      const { error } = await supabase.from('carts').insert(
        order.items.map(item => ({
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

  const handleDownloadInvoice = async (order) => { /* 保持原样 */ };
  const openReviewModal = (orderId) => { setCurrentOrderId(orderId); setModalVisible(true); };
  const handleSubmitReview = () => { Alert.alert("Success", "Submitted!"); setModalVisible(false); };
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

      <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        {filteredOrders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>#{order.id}</Text>
              <Text style={styles.orderDate}>{order.date}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.label}>Order status</Text>
              {order.status === 'Completed' ? (
                <View style={styles.iconTextWrapper}><Ionicons name="checkmark-circle" size={16} color="green" /><Text style={styles.statusCompleted}> Completed</Text></View>
              ) : order.status === 'Cancelled' ? (
                <View style={styles.iconTextWrapper}><Ionicons name="close-circle" size={16} color="red" /><Text style={styles.statusCancelled}> Cancelled</Text></View>
              ) : (
                <View style={styles.iconTextWrapper}><Ionicons name="time" size={16} color="orange" /><Text style={{ color: 'orange', fontWeight: 'bold' }}> {order.status}</Text></View>
              )}
            </View>
            <Text style={styles.label}>Shop Name:</Text>
            <Text style={styles.shopName}>{order.shopName}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.btnDownload} onPress={() => handleDownloadInvoice(order)}>
                <Text style={styles.btnTextBlack}>Download Invoice</Text>
              </TouchableOpacity>
              {/* 🌟 绑定重购函数 */}
              <TouchableOpacity style={styles.btnReorder} onPress={() => handleReorder(order)}>
                <View style={styles.iconTextWrapper}>
                  <Ionicons name="cart-outline" size={18} color="white" />
                  <Text style={styles.btnTextWhite}> Reorder</Text>
                </View>
              </TouchableOpacity>
            </View>
            {order.status === 'Completed' && (
              <TouchableOpacity style={styles.btnReview} onPress={() => openReviewModal(order.id)}>
                <View style={styles.iconTextWrapper}><MaterialIcons name="rate-review" size={18} color="black" /><Text style={styles.btnTextBlack}> Make a review</Text></View>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* 🌟 100% 完整评分反馈弹窗 */}
      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color="#ccc" /></TouchableOpacity>
            <Text style={styles.modalTitle}>Rate your Order</Text>
            <Text style={styles.modalOrderId}>#{currentOrderId}</Text>
            {renderStars()}
            <Text style={styles.reviewLabel}>Your Review (Optional)</Text>
            <TextInput style={styles.textInput} multiline={true} numberOfLines={4} placeholder="The food is excellent..." value={reviewText} onChangeText={setReviewText} textAlignVertical="top" />
            <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmitReview}><Text style={styles.btnTextWhite}>Submit</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// 样式部分保持不变...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: 'white', borderBottomWidth: 2, borderColor: 'black' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
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
  btnSubmit: { backgroundColor: '#222', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 }
});