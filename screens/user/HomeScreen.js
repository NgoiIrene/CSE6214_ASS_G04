// 🌟 新增 1：在 React 导入中加入 useContext
import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Image,
  Dimensions, FlatList, Modal, TextInput, Alert, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { UserContext } from './UserContext';
import { supabase } from '../../supabaseClient';

const { width, height } = Dimensions.get('window');
const cardWidth = (width - 46) / 3;
const BANNER_WIDTH = width - 40;

export default function HomeScreen({ onOpenMenu, navigateToCheckout, autoOpenCart, clearAutoOpenCart, checkoutData, navigateToVendor }) {
  const { profile } = useContext(UserContext);

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerRef = useRef(null);

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [remarks, setRemarks] = useState("");

  const totalCartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // 🌟 修改：连接真实的 carts 表，并通过 food_items 拿到真实数据
  useEffect(() => {
    const fetchCartFromDB = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('carts') // 换成了 carts
          .select(`quantity, food_id, food_items (name, price, image_url)`)
          .eq('user_id', user.id)
          .eq('is_ordered', false);

        if (error) throw error;

        if (data && data.length > 0) {
          const dbCart = data.map(item => ({
            id: item.food_id,
            name: item.food_items?.name || 'Loading...',
            price: parseFloat(item.food_items?.price) || 0,
            quantity: item.quantity,
            image: item.food_items?.image_url || null
          }));
          setCartItems(dbCart);
        }
      } catch (error) {
        console.log('Fetch cart DB error:', error.message);
      }
    };
    fetchCartFromDB();
  }, []);

  useEffect(() => {
    if (autoOpenCart) {
      if (checkoutData && checkoutData.items) setCartItems(checkoutData.items);
      setIsCartVisible(true);
      clearAutoOpenCart();
    }
  }, [autoOpenCart]);

  // 🌟 最新修复版：完美适配干净的 carts 表，解决存不进数据库的问题
  const syncCartToDB = async (foodId, quantity) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("User not logged in");
        return;
      }

      if (quantity === 0) {
        // 如果数量是 0，从购物车删除
        const { error } = await supabase.from('carts').delete().match({ user_id: user.id, food_id: foodId });
        if (error) console.log("Delete error:", error.message);
      } else {
        // 1. 先检查数据库里是不是已经有这道菜了
        const { data: existingCart } = await supabase
          .from('carts')
          .select('cart_id') // 随便选一个字段检查存在性
          .eq('user_id', user.id)
          .eq('food_id', foodId)
          .maybeSingle();

        if (existingCart) {
          // 2. 如果有，就更新数量 (不再传 name 字段)
          const { error: updateError } = await supabase
            .from('carts')
            .update({ quantity: quantity })
            .eq('user_id', user.id)
            .eq('food_id', foodId);
          if (updateError) console.log("Update error:", updateError.message);
        } else {
          // 3. 如果没有，就插入新的一行 (不再传 name 字段)
          const { error: insertError } = await supabase
            .from('carts')
            .insert({ user_id: user.id, food_id: foodId, quantity: quantity });
          if (insertError) console.log("Insert error:", insertError.message);
        }
      }
    } catch (error) {
      console.log("DB Sync Error:", error.message);
    }
  };

  const handleAddToCart = (item) => {
    setCartItems(prevItems => {
      const itemExists = prevItems.find(cartItem => cartItem.id === item.id);
      let newQuantity = 1; let newCart;
      if (itemExists) {
        newQuantity = itemExists.quantity + 1;
        newCart = prevItems.map(cartItem => cartItem.id === item.id ? { ...cartItem, quantity: newQuantity } : cartItem);
      } else {
        const cleanPrice = parseFloat(item.price ? item.price.replace('RM ', '') : '10.00') || 10.00;
        newCart = [...prevItems, { id: item.id, name: item.name, price: cleanPrice, quantity: 1, image: item.image }];
      }
      syncCartToDB(item.id, newQuantity);
      return newCart;
    });
  };

  const increaseQuantity = (id) => {
    setCartItems(prevItems => {
      let newQuantity;
      let foodName;
      const newCart = prevItems.map(item => {
        if (item.id === id) {
          newQuantity = item.quantity + 1;
          foodName = item.name;
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      syncCartToDB(id, newQuantity);
      return newCart;
    });
  };

  const decreaseQuantity = (id) => {
    setCartItems(prevItems => {
      let newQuantity;
      let foodName;
      const newCart = prevItems.map(item => {
        if (item.id === id) {
          newQuantity = item.quantity > 1 ? item.quantity - 1 : 1;
          foodName = item.name;
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      syncCartToDB(id, newQuantity);
      return newCart;
    });
  };

  const removeItemFromCart = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    syncCartToDB(id, 0, null);
  };

  const [bannerAds, setBannerAds] = useState([
    { id: 'b1', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600' },
  ]);

  useEffect(() => {
    const fetchBannersFromDB = async () => {
      try {
        const { data, error } = await supabase.from('advertising_banners').select('id, image_url');
        if (error) throw error;
        if (data && data.length > 0) {
          setBannerAds(data.map(item => ({ id: item.id.toString(), image: item.image_url })));
        }
      } catch (error) {
        console.log('Fetch banners error:', error.message);
      }
    };
    fetchBannersFromDB();
  }, []);

  const onBannerScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / BANNER_WIDTH);
    if (index !== currentBannerIndex && index >= 0 && index < bannerAds.length) setCurrentBannerIndex(index);
  };

  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    const fetchVendorsFromProfiles = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('account_type', 'vendor');
        if (error) throw error;
        if (data && data.length > 0) {
          const formattedVendors = data.map(vendor => ({
            id: vendor.id,
            name: vendor.full_name || vendor.username || 'Unnamed Vendor',
            image_url: vendor.avatar_url || 'https://via.placeholder.com/150',
            rating: vendor.rating || 'N/A',
            category: vendor.category || 'N/A'
          }));
          setVendors(formattedVendors);
        }
      } catch (error) {
        console.log('Fetch vendors error:', error.message);
      }
    };
    fetchVendorsFromProfiles();
  }, []);

  const VendorCard = ({ vendor }) => (
    <TouchableOpacity
      style={styles.vendorCard}
      activeOpacity={0.8}
      onPress={() => {
        if (navigateToVendor) {
          navigateToVendor(vendor);
        } else {
          Alert.alert("Error", "Navigation not hooked up properly in Main App.js");
        }
      }}
    >
      <Image source={{ uri: vendor.image_url }} style={styles.vendorImage} />
      <View style={styles.vendorDetails}>
        <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
        <View style={styles.vendorRatingRow}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.vendorRatingText}>{vendor.rating}</Text>
          <Text style={styles.vendorCuisineText}>{vendor.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={onOpenMenu}>
          <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <View style={styles.profileContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={[styles.avatarPlaceholder, { width: 40, height: 40, borderRadius: 20 }]} />
          ) : (
            <Ionicons name="person-circle-outline" size={40} color="#000" style={styles.avatarPlaceholder} />
          )}
          <View style={styles.profileTextContainer}>
            <Text style={styles.helloText}>Hello!!</Text>
            <Text style={styles.userNameText}>{profile?.full_name || 'Loading...'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.cartIconButton} onPress={() => setIsCartVisible(true)}>
          <Ionicons name="cart" size={26} color="#757575" />
          {totalCartQuantity > 0 && (
            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{totalCartQuantity}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        <View style={styles.bannerContainer}>
          <FlatList ref={bannerRef} data={bannerAds} keyExtractor={(item) => item.id} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onBannerScroll} scrollEventThrottle={16} renderItem={({ item }) => (<View style={{ width: BANNER_WIDTH, height: '100%' }}><Image source={{ uri: item.image }} style={styles.bannerFullImage} /></View>)} />
          <View style={styles.dotsIndicatorContainer}>
            {bannerAds.map((_, i) => <View key={i} style={[styles.dotIndicator, i === currentBannerIndex && styles.dotIndicatorActive]} />)}
          </View>
        </View>

        <View style={[styles.sectionHeaderRow, { marginTop: 35, marginBottom: 20 }]}>
          <Text style={[styles.sectionTitleFont, { fontSize: 28, letterSpacing: 1 }]}>Vendors</Text>
        </View>

        <View style={styles.vendorListContainer}>
          {vendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)}
        </View>

      </ScrollView>

      <Modal animationType="fade" transparent visible={isDetailModalVisible} onRequestClose={() => setIsDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdropCloser} activeOpacity={1} onPress={() => setIsDetailModalVisible(false)} />
          {selectedFood && (
            <View style={styles.popupCardBody}>
              <View style={styles.popupHeaderRow}><TouchableOpacity onPress={() => setIsDetailModalVisible(false)}><Ionicons name="close" size={26} color="#000" /></TouchableOpacity></View>
              <View style={styles.popupImageWrapper}>
                <Image source={{ uri: selectedFood.image }} style={styles.popupFoodImage} />
                {selectedFood.status === 'new' && <View style={styles.modalStatusBadge}><Text style={styles.statusBadgeText}>NEW!</Text></View>}
              </View>
              <Text style={styles.popupFoodName}>{selectedFood.name}</Text>
              <ScrollView style={styles.popupDetailsScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.detailTextGroup}><Text style={styles.detailLabel}>Ingredient:</Text><Text style={styles.detailValue}>{selectedFood.ingredient}</Text></View>
                <View style={styles.detailTextGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}><Ionicons name="warning-outline" size={22} color="#D9383A" style={{ marginRight: 6, marginTop: -2 }} /><Text style={styles.detailLabel}>Allergen Warning:</Text></View>
                  <Text style={[styles.detailValue, { color: '#000000', fontWeight: '900' }]}>{selectedFood.allergen}</Text>
                </View>
                <View style={styles.detailTextGroup}><Text style={styles.detailLabel}>Calories:</Text><Text style={styles.detailValue}>{selectedFood.calories}</Text></View>
                <View style={styles.detailTextGroup}><Text style={styles.detailLabel}>Price:</Text><Text style={styles.popupPriceValue}>{selectedFood.price}</Text></View>
              </ScrollView>
              <TouchableOpacity style={styles.popupOrderButton} activeOpacity={0.8} onPress={() => { setIsDetailModalVisible(false); handleAddToCart(selectedFood); }}><Text style={styles.popupOrderButtonText}>Add to Cart</Text></TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <Modal animationType="slide" transparent={false} visible={isCartVisible} onRequestClose={() => setIsCartVisible(false)}>
        <ShoppingCartView cartItems={cartItems} remarks={remarks} setRemarks={setRemarks} increaseQuantity={increaseQuantity} decreaseQuantity={decreaseQuantity} removeItemFromCart={removeItemFromCart} onClose={() => setIsCartVisible(false)} onGoToCheckout={(items, remarks) => { setIsCartVisible(false); navigateToCheckout(items, remarks); }} />
      </Modal>
    </View>
  );
}

function ShoppingCartView({ cartItems, remarks, setRemarks, increaseQuantity, decreaseQuantity, removeItemFromCart, onClose, onGoToCheckout }) {
  const [isRemoveModalVisible, setIsRemoveModalVisible] = useState(false);
  const [itemToIdToRemove, setItemToIdToRemove] = useState(null);
  const [itemNameToRemove, setItemNameToRemove] = useState("");

  const triggerRemovePrompt = (id, name) => { setItemToIdToRemove(id); setItemNameToRemove(name); setIsRemoveModalVisible(true); };
  const confirmRemoveItem = (confirm) => { if (confirm && itemToIdToRemove) removeItemFromCart(itemToIdToRemove); setIsRemoveModalVisible(false); };

  const calculateSubtotal = () => {
    const itemsTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return itemsTotal === 0 ? "RM 0.00" : `RM ${itemsTotal.toFixed(2)}`;
  };

  return (
    <View style={cartStyles.safeArea}>
      <View style={cartStyles.headerRow}><View style={{ width: 28 }} /><View style={cartStyles.titleContainer}><Text style={cartStyles.headerTitle}>Shopping Cart</Text></View><TouchableOpacity style={cartStyles.closeXBtn} onPress={onClose}><Ionicons name="close" size={28} color="#000" /></TouchableOpacity></View>
      <View style={cartStyles.divider} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={cartStyles.scrollContainer}>
        <Text style={cartStyles.sectionTitle}>Order Items</Text>
        {cartItems.length === 0 ? (<View style={cartStyles.emptyContainer}><Ionicons name="cart-outline" size={64} color="#cccccc" /><Text style={cartStyles.emptyText}>Your cart is empty</Text></View>) : (
          cartItems.map((item) => (
            <View key={item.id} style={cartStyles.cartCard}>
              <Image source={{ uri: item.image }} style={cartStyles.cartItemImage} />
              <View style={cartStyles.cartItemInfoBox}>
                <View style={styles.foodNameWrapperTmp}><Text style={cartStyles.itemNameText}>{item.name}</Text><Text style={cartStyles.itemPriceText}>Price: RM {item.price.toFixed(2)}</Text></View>
                <View style={cartStyles.actionRow}>
                  <View style={cartStyles.quantityController}><TouchableOpacity style={cartStyles.qtyBtn} onPress={() => decreaseQuantity(item.id)}><Ionicons name="remove" size={14} color="#000" /></TouchableOpacity><Text style={cartStyles.qtyText}>{item.quantity}</Text><TouchableOpacity style={cartStyles.qtyBtn} onPress={() => increaseQuantity(item.id)}><Ionicons name="add" size={14} color="#000" /></TouchableOpacity></View>
                  <TouchableOpacity style={cartStyles.removeButton} onPress={() => triggerRemovePrompt(item.id, item.name)}><Text style={cartStyles.removeButtonText}>Remove</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <Text style={cartStyles.sectionTitle}>Special Remarks:</Text>
        <View style={cartStyles.remarksInputWrapper}><TextInput style={cartStyles.remarksInput} multiline numberOfLines={4} textAlignVertical="top" value={remarks} onChangeText={setRemarks} placeholder="Please type remark here" placeholderTextColor="#999999" /></View>
        <View style={cartStyles.priceRow}><Text style={cartStyles.totalLabel}>Subtotal</Text><Text style={cartStyles.totalPriceText}>{calculateSubtotal()}</Text></View>
      </ScrollView>
      <View style={cartStyles.fixedFooter}><TouchableOpacity style={[cartStyles.checkoutButton, cartItems.length === 0 && cartStyles.checkoutButtonDisabled]} disabled={cartItems.length === 0} onPress={() => { onGoToCheckout(cartItems, remarks); }}><Text style={cartStyles.checkoutButtonText}>Go to Checkout</Text></TouchableOpacity></View>
      <Modal animationType="fade" transparent visible={isRemoveModalVisible}>
        <View style={cartStyles.modalOverlay}>
          <View style={cartStyles.promptCardBody}>
            <View style={cartStyles.promptHeader}><Ionicons name="warning-outline" size={24} color="#000" style={{ marginRight: 6 }} /><Text style={cartStyles.promptTitleText}>Remove Item?</Text></View>
            <Text style={cartStyles.promptContentText}>Are you sure to remove "{itemNameToRemove}"?</Text>
            <View style={cartStyles.promptActionRow}>
              <TouchableOpacity style={[cartStyles.promptBtn, cartStyles.promptBtnNo]} onPress={() => confirmRemoveItem(false)}><Text style={cartStyles.promptBtnNoText}>No</Text></TouchableOpacity><TouchableOpacity style={[cartStyles.promptBtn, cartStyles.promptBtnYes]} onPress={() => confirmRemoveItem(true)}><Text style={cartStyles.promptBtnYesText}>Yes</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollPadding: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: 10, backgroundColor: '#ffffff', zIndex: 10 },
  hamburgerBtn: { width: 35, height: 30, borderRadius: 4, justifyContent: 'space-around', alignItems: 'center', paddingVertical: 4 },
  hamburgerLine: { width: 20, height: 2, backgroundColor: '#000' },
  profileContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 15 },
  avatarPlaceholder: { marginRight: 4 },
  profileTextContainer: { justifyContent: 'center' },
  helloText: { fontSize: 16, fontWeight: '900', color: '#000000' },
  userNameText: { fontSize: 14, color: '#000000', fontWeight: '600', marginTop: -4 },
  cartIconButton: { padding: 4, position: 'relative' },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#D9383A', borderRadius: 9, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  divider: { height: 2, backgroundColor: '#000', width: '100%' },
  bannerContainer: { width: '100%', height: 165, marginTop: 15, borderWidth: 1.5, borderColor: '#000000', borderRadius: 16, overflow: 'hidden', backgroundColor: '#f9f9f9', position: 'relative' },
  bannerFullImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  dotsIndicatorContainer: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  dotIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.4)', marginHorizontal: 4 },
  dotIndicatorActive: { width: 14, backgroundColor: '#ffffff' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitleFont: { fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#000000' },

  vendorListContainer: { paddingBottom: 20 },
  vendorCard: { flexDirection: 'row', width: '100%', marginBottom: 20, alignItems: 'center', paddingHorizontal: 2 },
  vendorImage: { width: 105, height: 105, borderRadius: 16, borderWidth: 1.5, borderColor: '#000000', resizeMode: 'cover', zIndex: 2, backgroundColor: '#fff' },
  vendorDetails: { flex: 1, height: 80, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#000000', borderLeftWidth: 0, borderTopRightRadius: 12, borderBottomRightRadius: 12, justifyContent: 'center', paddingLeft: 16, paddingRight: 10, marginLeft: -2, zIndex: 1 },
  vendorName: { fontSize: 18, fontWeight: 'bold', color: '#000000', marginBottom: 6 },
  vendorRatingRow: { flexDirection: 'row', alignItems: 'center' },
  vendorRatingText: { fontSize: 15, fontWeight: 'bold', color: '#000000', marginLeft: 6, marginRight: 12 },
  vendorCuisineText: { fontSize: 14, fontWeight: 'bold', color: '#000000' },

  foodNameWrapperTmp: { width: '100%', flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modalBackdropCloser: { position: 'absolute', width: width, height: height },
  popupCardBody: { width: width * 0.86, maxHeight: height * 0.85, backgroundColor: '#ffffff', borderWidth: 3, borderColor: '#000000', borderRadius: 16, padding: 18, justifyContent: 'space-between', elevation: 8 },
  popupHeaderRow: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%' },
  popupImageWrapper: { width: '100%', height: 175, borderWidth: 2, borderColor: '#000000', borderRadius: 10, overflow: 'hidden', marginTop: 4, position: 'relative' },
  popupFoodImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  modalStatusBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#00E676', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { color: '#000', fontSize: 10, fontWeight: '900' },
  popupFoodName: { fontSize: 22, fontWeight: '900', color: '#000000', textAlign: 'center', marginTop: 12, marginBottom: 20, letterSpacing: 0.5 },
  popupDetailsScroll: { flexGrow: 0, marginBottom: 20 },
  detailTextGroup: { marginBottom: 18, width: '100%' },
  detailLabel: { fontSize: 14, fontWeight: '900', color: '#000000', textTransform: 'uppercase', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#333333', lineHeight: 18 },
  popupPriceValue: { fontSize: 18, fontWeight: '900', color: '#000000' },
  popupOrderButton: { width: '100%', backgroundColor: '#FF8C32', borderRadius: 8, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  popupOrderButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});

const cartStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff', paddingTop: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: 10, backgroundColor: '#ffffff' },
  titleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#000', fontFamily: 'serif' },
  closeXBtn: { padding: 2 },
  divider: { height: 2, backgroundColor: '#000000', width: '100%' },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#000000', marginVertical: 14, fontFamily: 'serif' },
  cartCard: { flexDirection: 'row', width: '100%', marginBottom: 21, height: 125, alignItems: 'center' },
  cartItemImage: { width: 120, height: 125, borderRadius: 12, borderWidth: 1.7, borderColor: '#000000', resizeMode: 'cover' },
  cartItemInfoBox: { flex: 1, height: 110, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#000000', paddingHorizontal: 12, justifyContent: 'space-between', paddingVertical: 10, borderLeftWidth: 0, marginLeft: 0, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  itemNameText: { fontSize: 14, fontWeight: 'bold', color: '#000000', lineHeight: 16, paddingRight: 4 },
  itemPriceText: { fontSize: 13, fontWeight: '700', color: '#444444', marginTop: 3 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  quantityController: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#000000', borderRadius: 20, backgroundColor: '#ffffff', paddingHorizontal: 4 },
  qtyBtn: { padding: 6, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontWeight: '900', color: '#000000', paddingHorizontal: 8 },
  removeButton: { backgroundColor: '#262626', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  removeButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  remarksInputWrapper: { width: '100%', borderWidth: 1.5, borderColor: '#000000', backgroundColor: '#ffffff', borderRadius: 8, padding: 10, marginBottom: 20 },
  remarksInput: { fontSize: 14, fontWeight: '600', color: '#000000', height: 90 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, width: '100%', paddingHorizontal: 2 },
  totalLabel: { fontSize: 15, fontWeight: '900', color: '#000000' },
  totalPriceText: { fontSize: 18, fontWeight: '900', color: '#000000' },
  fixedFooter: { width: '100%', backgroundColor: '#ffffff', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, borderTopWidth: 1, borderColor: '#efefef' },
  checkoutButton: { width: '100%', backgroundColor: '#22252A', borderRadius: 25, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  checkoutButtonDisabled: { backgroundColor: '#999999' },
  checkoutButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  promptCardBody: { width: width * 0.82, backgroundColor: '#ffffff', borderWidth: 3, borderColor: '#000000', borderRadius: 14, padding: 20, elevation: 6 },
  promptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  promptTitleText: { fontSize: 18, fontWeight: '900', color: '#000000' },
  promptContentText: { fontSize: 14, fontWeight: '600', color: '#333333', lineHeight: 20, marginBottom: 22 },
  promptActionRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  promptBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  promptBtnNo: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#000000', marginRight: 10 },
  promptBtnNoText: { color: '#000000', fontSize: 14, fontWeight: '900' },
  promptBtnYes: { backgroundColor: '#FF8C32', borderWidth: 1.5, borderColor: '#000000' },
  promptBtnYesText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, fontWeight: '700', color: '#999999', marginTop: 10 }
});