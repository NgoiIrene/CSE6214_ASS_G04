import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Image,
  Dimensions, FlatList, Modal, TextInput, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const cardWidth = (width - 46) / 3;
const BANNER_WIDTH = width - 40;

export default function HomeScreen({ onOpenMenu }) {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerRef = useRef(null);

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [remarks, setRemarks] = useState("");

  const totalCartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (item) => {
    setCartItems(prevItems => {
      const itemExists = prevItems.find(cartItem => cartItem.id === item.id);
      if (itemExists) {
        return prevItems.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      const cleanPrice = parseFloat(item.price ? item.price.replace('RM ', '') : '10.00') || 10.00;
      return [...prevItems, { id: item.id, name: item.name, price: cleanPrice, quantity: 1, image: item.image }];
    });
  };

  const increaseQuantity = (id) => {
    setCartItems(prevItems => prevItems.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const decreaseQuantity = (id) => {
    setCartItems(prevItems => prevItems.map(item => item.id === id ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 1 } : item));
  };

  const removeItemFromCart = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const bannerAds = [
    { id: 'b1', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600' },
    { id: 'b2', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600' },
    { id: 'b3', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600' },
  ];

  // 🌟 完全复原的 6 项今日精选
  const todaysPicks = [
    { id: '1', name: 'Vegan Salad with Mayo', price: 'RM 8.50', ingredient: 'broccoli, lettuce, cherry tomato, vegan mayo', allergen: 'none', calories: '320 kcal', status: null, image: 'https://atelizabethstable.com/wp-content/uploads/2023/07/vegan-broccoli-salad-with-vegan-mayonnaise.jpg' },
    { id: '2', name: 'Avocado Toast', price: 'RM 11.00', ingredient: 'avocado, sourdough bread, poached egg, pepper', allergen: 'wheat, egg', calories: '450 kcal', status: null, image: 'https://recipesmoms.com/wp-content/uploads/2024/11/Avocado-Toast-Recipe.jpeg' },
    { id: '3', name: 'Nasi Lemak with Fried Chicken', price: 'RM 15.00', ingredient: 'coconut rice, fried chicken, sambal, cucumber, egg', allergen: 'peanut, spicy', calories: '850 kcal', status: null, image: 'https://www.nasilemakbamboo.my/wp-content/uploads/2023/07/Nasi-Lemak-Ayam-Goreng-Compressed.jpg' },
    { id: '4', name: 'Fruit Salad in Coconut Shells', price: 'RM 9.50', ingredient: 'watermelon, mango, kiwi, dragon fruit, mint leaves', allergen: 'mango syrup', calories: '210 kcal', status: null, image: 'https://img.magnific.com/premium-photo/photo-tropical-fruit-salad-coconut-shell_1056572-53453.jpg' },
    { id: '5', name: 'Meat with Boiled egg and Veggies', price: 'RM 14.00', ingredient: 'grilled chicken, soft boiled egg, broccoli, carrots', allergen: 'egg, soy sauce', calories: '520 kcal', status: null, image: 'https://static.vecteezy.com/system/resources/previews/035/327/993/large_2x/ai-generated-salad-with-grilled-chicken-egg-and-cherry-tomatoes-on-black-plate-photo.jpg' },
    { id: '6', name: 'Kampung Fried Rice with Fried Chicken', price: 'RM 16.00', ingredient: 'rice, water spinach, anchovies, fried chicken, egg', allergen: 'spicy, seafood', calories: '790 kcal', status: null, image: 'https://papparich.my/cdn/shop/files/R11KampungFriedRicewithEgg_FriedChickenWings_6f67f371-0b31-4eb5-8844-d93cbe804d03.jpg?v=1702382146&width=1445' },
  ];

  // 🌟 完全复原的 3 项新品
  const newItems = [
    { id: '7', name: 'Roti Cannai with Fish Curry', price: 'RM 6.00', ingredient: 'flour, butter, milk, fish curry gravy', allergen: 'wheat, milk, spicy', calories: '480 kcal', status: 'new', image: 'https://thumbs.dreamstime.com/b/traditional-roti-canai-curry-dhal-served-banana-leaf-delicious-authentic-serving-roti-canai-popular-400619434.jpg' },
    { id: '8', name: 'Chicken Burger with Cheese', price: 'RM 12.50', ingredient: 'chicken patty, cheddar cheese, burger bun, lettuce', allergen: 'wheat, milk', calories: '610 kcal', status: 'new', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300' },
    { id: '9', name: 'Chicken Ham Sandwich with Cheese', price: 'RM 7.00', ingredient: 'sliced chicken ham, mozzarella cheese, white bread', allergen: 'wheat, milk', calories: '390 kcal', status: 'new', image: 'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?q=80&w=300' },
  ];

  const onBannerScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / BANNER_WIDTH);
    if (index !== currentBannerIndex && index >= 0 && index < bannerAds.length) {
      setCurrentBannerIndex(index);
    }
  };

  const FoodCard = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity style={styles.imageContainer} activeOpacity={0.8} onPress={() => { setSelectedFood(item); setIsDetailModalVisible(true); }}>
        <Image source={{ uri: item.image }} style={styles.foodImage} />
      </TouchableOpacity>
      <View style={styles.cardDetails}>
        <TouchableOpacity style={styles.foodNameWrapper} activeOpacity={0.7} onPress={() => { setSelectedFood(item); setIsDetailModalVisible(true); }}>
          <Text style={styles.foodName} numberOfLines={3}>{item.name}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.plusButton} activeOpacity={0.7} onPress={() => handleAddToCart(item)}>
          <Ionicons name="add" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 顶部导航条：拉回原本的三条杠跟 Charlotte 头像布局 */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={onOpenMenu}>
          <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <View style={styles.profileContainer}>
          <Ionicons name="person-circle-outline" size={40} color="#000" style={styles.avatarPlaceholder} />
          <View style={styles.profileTextContainer}>
            <Text style={styles.helloText}>Hello!!</Text>
            <Text style={styles.userNameText}>Charlotte</Text>
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
          <FlatList
            ref={bannerRef} data={bannerAds} keyExtractor={(item) => item.id} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onBannerScroll} scrollEventThrottle={16}
            renderItem={({ item }) => (
              <View style={{ width: BANNER_WIDTH, height: '100%' }}><Image source={{ uri: item.image }} style={styles.bannerFullImage} /></View>
            )}
          />
          <View style={styles.dotsIndicatorContainer}>
            {bannerAds.map((_, i) => <View key={i} style={[styles.dotIndicator, i === currentBannerIndex && styles.dotIndicatorActive]} />)}
          </View>
        </View>

        <View style={styles.sectionHeaderRow}><Text style={styles.sectionTitleFont}>Today’s Pick</Text></View>
        <View style={styles.gridContainer}>{todaysPicks.map((item) => <FoodCard key={item.id} item={item} />)}</View>

        <View style={styles.sectionHeaderRow}><Text style={styles.sectionTitleFont}>New Items</Text></View>
        <View style={styles.gridContainer}>{newItems.map((item) => <FoodCard key={item.id} item={item} />)}</View>
      </ScrollView>

      {/* 🌟 100% 还原详情 Modal 里的布局（包含所有警告和描述） */}
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
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                    <Ionicons name="warning-outline" size={22} color="#D9383A" style={{ marginRight: 6, marginTop: -2 }} />
                    <Text style={styles.detailLabel}>Allergen Warning:</Text>
                  </View>
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
        <ShoppingCartView cartItems={cartItems} remarks={remarks} setRemarks={setRemarks} increaseQuantity={increaseQuantity} decreaseQuantity={decreaseQuantity} removeItemFromCart={removeItemFromCart} onClose={() => setIsCartVisible(false)} />
      </Modal>
    </View>
  );
}

// 🌟 完全复原的硬核购物车 UI组件
function ShoppingCartView({ cartItems, remarks, setRemarks, increaseQuantity, decreaseQuantity, removeItemFromCart, onClose }) {
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
      <View style={cartStyles.headerRow}>
        <View style={{ width: 28 }} />
        <View style={cartStyles.titleContainer}><Text style={cartStyles.headerTitle}>Shopping Cart</Text></View>
        <TouchableOpacity style={cartStyles.closeXBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={cartStyles.divider} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={cartStyles.scrollContainer}>
        <Text style={cartStyles.sectionTitle}>Order Items</Text>
        {cartItems.length === 0 ? (
          <View style={cartStyles.emptyContainer}><Ionicons name="cart-outline" size={64} color="#cccccc" /><Text style={cartStyles.emptyText}>Your cart is empty</Text></View>
        ) : (
          // 🌟 只需要替换 ShoppingCartView 内部的这部分 map 循环
          cartItems.map((item) => (
            <View key={item.id} style={cartStyles.cartCard}>
              <Image source={{ uri: item.image }} style={cartStyles.cartItemImage} />
              <View style={cartStyles.cartItemInfoBox}>
                {/* 🌟 移除了 numberOfLines={1} 让长名字可以自由显示两行 */}
                <View style={styles.foodNameWrapperTmp}>
                  <Text style={cartStyles.itemNameText}>{item.name}</Text>
                  <Text style={cartStyles.itemPriceText}>Price: RM {item.price.toFixed(2)}</Text>
                </View>

                {/* 🌟 下方的加减数量 & Remove 按钮会自动被 Flex 推到最下面 */}
                <View style={cartStyles.actionRow}>
                  <View style={cartStyles.quantityController}>
                    <TouchableOpacity style={cartStyles.qtyBtn} onPress={() => decreaseQuantity(item.id)}>
                      <Ionicons name="remove" size={14} color="#000" />
                    </TouchableOpacity>
                    <Text style={cartStyles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity style={cartStyles.qtyBtn} onPress={() => increaseQuantity(item.id)}>
                      <Ionicons name="add" size={14} color="#000" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={cartStyles.removeButton} onPress={() => triggerRemovePrompt(item.id, item.name)}>
                    <Text style={cartStyles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <Text style={cartStyles.sectionTitle}>Special Remarks:</Text>
        <View style={cartStyles.remarksInputWrapper}>
          <TextInput style={cartStyles.remarksInput} multiline numberOfLines={4} textAlignVertical="top" value={remarks} onChangeText={setRemarks} placeholder="Please type remark here" placeholderTextColor="#999999" />
        </View>
        <View style={cartStyles.priceRow}>
          <Text style={cartStyles.totalLabel}>Subtotal</Text>
          <Text style={cartStyles.totalPriceText}>{calculateSubtotal()}</Text>
        </View>
      </ScrollView>
      <View style={cartStyles.fixedFooter}>
        <TouchableOpacity style={[cartStyles.checkoutButton, cartItems.length === 0 && cartStyles.checkoutButtonDisabled]} disabled={cartItems.length === 0} onPress={() => Alert.alert("Checkout", "Proceeding...")}><Text style={cartStyles.checkoutButtonText}>Go to Checkout</Text></TouchableOpacity>
      </View>
      <Modal animationType="fade" transparent visible={isRemoveModalVisible}>
        <View style={cartStyles.modalOverlay}>
          <View style={cartStyles.promptCardBody}>
            <View style={cartStyles.promptHeader}><Ionicons name="warning-outline" size={24} color="#000" style={{ marginRight: 6 }} /><Text style={cartStyles.promptTitleText}>Remove Item?</Text></View>
            <Text style={cartStyles.promptContentText}>Are you sure to remove "{itemNameToRemove}"?</Text>
            <View style={cartStyles.promptActionRow}>
              <TouchableOpacity style={[cartStyles.promptBtn, cartStyles.promptBtnNo]} onPress={() => confirmRemoveItem(false)}><Text style={cartStyles.promptBtnNoText}>No</Text></TouchableOpacity>
              <TouchableOpacity style={[cartStyles.promptBtn, cartStyles.promptBtnYes]} onPress={() => confirmRemoveItem(true)}><Text style={cartStyles.promptBtnYesText}>Yes</Text></TouchableOpacity>
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
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 12 },
  sectionTitleFont: { fontSize: 26, fontWeight: 'bold', fontFamily: 'serif', color: '#000000' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: cardWidth, backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1.5, borderColor: '#000000', marginBottom: 12, overflow: 'hidden', height: 210, justifyContent: 'space-between' },
  imageContainer: { width: '100%', height: 100, position: 'relative' },
  foodImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardDetails: { padding: 6, paddingBottom: 8, flex: 1, justifyContent: 'space-between', position: 'relative' },
  foodNameWrapper: { width: '100%', height: 68, marginBottom: 2 },
  foodName: { fontSize: 12, fontWeight: '700', color: '#000000', lineHeight: 15 },
  plusButton: { backgroundColor: '#FF8C32', width: 28, height: 28, borderRadius: 20, justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 6, right: 6 },
  // 👈 🌟 就是这里！把下面这 3 行补上：
  foodNameWrapperTmp: {
    width: '100%',
    flex: 1,
  },
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

  // 🌟 调整：将整张卡片（外层高度约束）从 115 扩大到 125，给下方留出更多空间
  cartCard: { flexDirection: 'row', width: '100%', marginBottom: 21, height: 125, alignItems: 'center' },

  // 🌟 调整：把食物图片和它的黑框等比例变大一点点（从 113x115 变成 120x125），圆角保持 12
  cartItemImage: { width: 120, height: 125, borderRadius: 12, borderWidth: 1.7, borderColor: '#000000', resizeMode: 'cover' },

  // 🌟 调整：右边盒子维持经典的 105 高度不随图片变大！这样图片大、名字框小的层次感更明显，且内部由于上下拉伸，按钮会完美下沉，拉开与字体的距离！
  cartItemInfoBox: {
    flex: 1,
    height: 110,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 12,
    justifyContent: 'space-between',       // 👈 关键：依然让名字死守顶部，按钮沉在底部
    paddingVertical: 10,
    borderLeftWidth: 0,
    marginLeft: 0,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },

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