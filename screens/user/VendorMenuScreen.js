import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Image,
  StatusBar, Dimensions, Platform, Alert, Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../supabaseClient'; // ⚠️ 如果路径不对请自行微调

import { useFocusEffect } from '@react-navigation/native'; // 确保加上这一行

const { width, height } = Dimensions.get('window');

export default function VendorMenuScreen({ vendorData, onBack, navigateToCheckout }) {

  // 🌟 自动接收从 Home 点击过来的商家资料
  const displayVendor = {
    name: vendorData?.name || 'Korean House',
    cuisine: vendorData?.category || 'Korean food',
    rating: vendorData?.rating || '4.7',
    // 如果商家没有写公告，就显示默认的
    announcement: vendorData?.announcement || 'Welcome to our store, enjoy your meal⭐ \n\n🔥 Today Special:\nWe have limited NEW items available NOW\n\n⚠️ IMPORTANT:\nPlease hurry up before it finished!'
  };

  const [foodItems, setFoodItems] = useState([]);
  const [announcementContent, setAnnouncementContent] = useState('Loading notice...');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);

  const [cart, setCart] = useState([]);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [remarks, setRemarks] = useState("");

  // // 页面加载时，根据商家的 ID 去拉取真实菜单！
  // useEffect(() => {
  //   const fetchFoodItemsFromDB = async () => {
  //     if (!vendorData?.id) return;

  //     try {
  //       const { data, error } = await supabase
  //         .from('food_items')
  //         .select('*')
  //         .eq('vendor_id', vendorData.id);

  //       if (error) throw error;

  //       if (data && data.length > 0) {
  //         const formattedMenu = data.map(item => ({
  //           id: item.id,
  //           name: item.name,
  //           price: `RM ${parseFloat(item.price).toFixed(2)}`,
  //           image: item.image_url || 'https://via.placeholder.com/150',
  //           ingredient: item.desc || 'No description provided.',
  //           allergen: item.allergen || 'None',
  //           calories: item.calories || 'N/A',
  //           status: item.stock <= 0 ? 'out_of_stock' : null
  //         }));

  //         setFoodItems(formattedMenu);
  //       }
  //     } catch (error) {
  //       console.log('Fetch food items error:', error.message);
  //     }
  //   };

  //   fetchFoodItemsFromDB();
  // }, [vendorData]);

  // // 🌟 1. 每次进入页面，强制从数据库读最新数据，解决不同步
  // useFocusEffect(
  //   React.useCallback(() => {
  //     fetchCartFromDB();
  //   }, [])
  // );


  // 🌟 1. 定义获取购物车函数 (这是唯一的一份)
  const fetchCartFromDB = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('carts')
        .select(`quantity, food_id, food_items (name, price, image_url, vendor_id)`)
        .eq('user_id', user.id)
        .eq('is_ordered', false);

      if (error) throw error;

      if (data) {
        const dbCart = data.map(item => ({
          id: item.food_id,
          name: item.food_items?.name || 'Loading...',
          price: parseFloat(item.food_items?.price) || 0,
          quantity: item.quantity,
          image: item.food_items?.image_url || null,
          vendor_id: item.food_items?.vendor_id
        }));
        setCart(dbCart);
      }
    } catch (error) {
      console.log('Fetch error:', error.message);
    }
  };

  // 🌟 2. 只需要这一个 hook，它负责当你进入页面时自动刷新数据
  useFocusEffect(
    React.useCallback(() => {
      fetchCartFromDB();
    }, [])
  );

  // 🌟 新增：根据商家 ID 去 announcements 表拉取公告
  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!vendorData?.id) return;
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('content')
          .eq('vendor_id', vendorData.id)
          .maybeSingle(); // 使用 maybeSingle，因为有些商家可能还没写公告

        if (error) throw error;
        
        if (data && data.content) {
          setAnnouncementContent(data.content);
        } else {
          // 🌟 修改：数据库里找不到对应公告时，显示这个
          setAnnouncementContent('waiting to update...'); 
        }
      } catch (error) {
        console.log('Fetch announcement error:', error.message);
        // 🌟 修改：网络错误或抓取失败时，也显示这个
        setAnnouncementContent('waiting to update...'); 
      }
    };

    fetchAnnouncement();
  }, [vendorData]);


  // 🌟 最新修复版：完美适配干净的 carts 表，解决存不进数据库的问题
  const syncCartToDB = async (foodId, quantity) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        //console.log("User not logged in");
        Alert.alert("Debug", "User is not logged in!"); // 检查是否没登录
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
          //if (insertError) console.log("Insert error:", insertError.message);
          // 🚨 重点在这里！如果有错，它会立刻弹窗告诉你！
          if (insertError) {
            Alert.alert("Insert Error (Please read!)", insertError.message);
          }

        }
      }
    } catch (error) {
      console.log("DB Sync Error:", error.message);
    }
  };

  const handleItemPress = (food) => {
    setSelectedFood(food);
    setIsModalVisible(true);
  };

  const handleAddToCart = async (food, isAvailable) => {
    if (!isAvailable) return;

    const currentVendorId = vendorData.id;
    // 检查购物车里是否已有不同商家的东西
    const hasDifferentVendor = cart.some(item => item.vendor_id && item.vendor_id !== currentVendorId);

    if (hasDifferentVendor) {
      Alert.alert(
        "Clear Cart?",
        "Your cart contains items from another vendor. Would you like to clear your cart and add this item instead?",
        [
          { text: "NO", style: "cancel" },
          {
            text: "YES",
            onPress: async () => {
              const { data: { user } } = await supabase.auth.getUser();
              // 1. 彻底清空数据库
              await supabase.from('carts').delete().eq('user_id', user.id).eq('is_ordered', false);
              // 2. 彻底清空本地状态
              setCart([]);

              // 3. 强制触发一次同步，确保数据是最新的
              await fetchCartFromDB();

              // 4. 在完全清空后，再添加这一个新商品 (不再触发其他逻辑)
              performAddToCart(food, currentVendorId);
            }
          }
        ]
      );
    } else {
      // 如果没有不同商家的东西，直接添加
      performAddToCart(food, currentVendorId);
    }
  };

  const performAddToCart = (food, vendorId) => {
    setCart((prevCart) => {
      // 这里的逻辑只负责更新本地 cart 状态
      const existingItem = prevCart.find((item) => item.id === food.id);
      let newCart;

      if (existingItem) {
        newCart = prevCart.map((item) => item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        const cleanPrice = parseFloat(food.price ? food.price.replace('RM ', '') : '10.00') || 10.00;
        newCart = [...prevCart, { id: food.id, name: food.name, price: cleanPrice, quantity: 1, image: food.image, vendor_id: vendorId }];
      }

      // 添加完后，手动调用一次同步到数据库
      syncCartToDB(food.id, existingItem ? existingItem.quantity + 1 : 1);
      return newCart;
    });
  };

  const increaseQuantity = (id) => {
    setCart(prevItems => {
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
    setCart(prevItems => {
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
    setCart(prevItems => prevItems.filter(item => item.id !== id));
    syncCartToDB(id, 0, null); // 加入 null 占位
  };

  const getTotalCartQuantity = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 顶部标题栏 */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { onBack ? onBack() : Alert.alert('Go Back') }}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>{displayVendor.name}</Text>

        <TouchableOpacity style={styles.cartHeaderIcon} onPress={() => setIsCartVisible(true)}>
          <Ionicons name="cart" size={28} color="#757575" />
          {getTotalCartQuantity() > 0 && (
            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{getTotalCartQuantity()}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Notice 留言板 */}
       {announcementContent && (
          <View style={styles.announcementCard}>
            <View style={styles.announcementBadge}>
              <Ionicons name="reader-outline" size={15} color="#fff" style={{ marginRight: 5 }} />
              <Text style={styles.announcementBadgeText}>NOTICE</Text>
            </View>
           <Text style={styles.announcementText}>{announcementContent}</Text>
          </View>
        )}

        {foodItems.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="fast-food-outline" size={64} color="#cccccc" />
            <Text style={{ fontSize: 16, color: '#999', marginTop: 10 }}>No items available yet.</Text>
          </View>
        ) : (
          foodItems.map((food, index) => {
            const isEvenRow = index % 2 === 0;
            const isOutOfStock = food.status === 'out_of_stock';
            const isNew = food.status === 'new';

            return (
              <TouchableOpacity key={food.id} style={[styles.foodCard, isOutOfStock && styles.foodCardDisabled]} activeOpacity={isOutOfStock ? 1 : 0.8} disabled={isOutOfStock} onPress={() => handleItemPress(food)}>
                {isEvenRow ? (
                  <>
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: food.image }} style={[styles.foodImageLeft, isOutOfStock && styles.foodImageDisabled]} />
                      {isNew && <View style={[styles.statusBadge, styles.badgeLeft]}><Text style={styles.statusBadgeText}>NEW!</Text></View>}
                    </View>
                    <View style={styles.foodInfoBox}>
                      <View>
                        <Text style={[styles.foodNameText, isOutOfStock && styles.foodTextDisabled]} numberOfLines={2}>{food.name}</Text>
                        <Text style={[styles.foodPriceText, isOutOfStock && styles.foodTextDisabled]}>{food.price}</Text>
                      </View>
                     {isOutOfStock && (
                      <View style={styles.outOfStockContainerRightBtn}>
                        <Ionicons name="warning-outline" size={14} color="#757575" style={{ marginRight: 4 }} />
                        <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
                        </View>
                        )}
                      <TouchableOpacity
                        style={[styles.actionButtonRight, isOutOfStock ? styles.actionButtonDisabled : styles.actionButtonNormal]}
                        disabled={isOutOfStock} onPress={() => handleAddToCart(food, !isOutOfStock)}>
                        <Ionicons name={isOutOfStock ? "close" : "add"} size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.foodInfoBox}>
                      <View>
                        <Text style={[styles.foodNameText, isOutOfStock && styles.foodTextDisabled]} numberOfLines={2}>{food.name}</Text>
                        <Text style={[styles.foodPriceText, isOutOfStock && styles.foodTextDisabled]}>{food.price}</Text>
                      </View>
                     {isOutOfStock && (
                      <View style={styles.outOfStockContainerLeftBtn}>
                       <Ionicons name="warning-outline" size={14} color="#757575" style={{ marginRight: 4 }} />
                       <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
                      </View>
                      )}
                      <TouchableOpacity
                        style={[styles.actionButtonLeft, isOutOfStock ? styles.actionButtonDisabled : styles.actionButtonNormal]}
                        disabled={isOutOfStock} onPress={() => handleAddToCart(food, !isOutOfStock)}>
                        <Ionicons name={isOutOfStock ? "close" : "add"} size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: food.image }} style={[styles.foodImageRight, isOutOfStock && styles.foodImageDisabled]} />
                      {isNew && <View style={[styles.statusBadge, styles.badgeRight]}><Text style={styles.statusBadgeText}>NEW!</Text></View>}
                    </View>
                  </>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* 弹窗部分 */}
      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdropCloser} activeOpacity={1} onPress={() => setIsModalVisible(false)} />
          {selectedFood && (
            <View style={styles.popupCardBody}>
              <View style={styles.popupHeaderRow}><TouchableOpacity onPress={() => setIsModalVisible(false)}><Ionicons name="close" size={26} color="#000" /></TouchableOpacity></View>
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
              <TouchableOpacity style={[styles.popupOrderButton, selectedFood.status === 'out_of_stock' && styles.popupOrderButtonDisabled]} disabled={selectedFood.status === 'out_of_stock'} onPress={() => { setIsModalVisible(false); handleAddToCart(selectedFood, selectedFood.status !== 'out_of_stock'); }}>
                <Text style={styles.popupOrderButtonText}>{selectedFood.status === 'out_of_stock' ? 'OUT OF STOCK' : 'Add to Cart'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <Modal animationType="slide" transparent={false} visible={isCartVisible} onRequestClose={() => setIsCartVisible(false)}>
        <ShoppingCartView
          cartItems={cart}
          remarks={remarks}
          setRemarks={setRemarks}
          increaseQuantity={increaseQuantity}
          decreaseQuantity={decreaseQuantity}
          removeItemFromCart={removeItemFromCart}
          onClose={() => setIsCartVisible(false)}
          onGoToCheckout={(items, remarks) => {
            setIsCartVisible(false);
            navigateToCheckout(items, remarks);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// 购物车 UI 组件（完全没动）
// ==========================================
function ShoppingCartView({ cartItems, remarks, setRemarks, increaseQuantity, decreaseQuantity, removeItemFromCart, onClose, onGoToCheckout }) {
  const [isRemoveModalVisible, setIsRemoveModalVisible] = useState(false);
  const [itemToIdToRemove, setItemToIdToRemove] = useState(null);
  const [itemNameToRemove, setItemNameToRemove] = useState("");

  const triggerRemovePrompt = (id, name) => { setItemToIdToRemove(id); setItemNameToRemove(name); setIsRemoveModalVisible(true); };
  const confirmRemoveItem = (confirm) => { if (confirm && itemToIdToRemove) removeItemFromCart(itemToIdToRemove); setIsRemoveModalVisible(false); };
  const calculateSubtotal = () => {
    const itemsTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return itemsTotal === 0 ? "RM 0.00" : `RM ${(itemsTotal).toFixed(2)}`;
  };

  return (
    <SafeAreaView style={cartStyles.safeArea}>
      <View style={cartStyles.headerRow}>
        <View style={{ width: 28 }} />
        <View style={cartStyles.titleContainer}><Text style={cartStyles.headerTitle}>Shopping Cart</Text></View>
        <TouchableOpacity style={cartStyles.closeXBtn} onPress={onClose}><Ionicons name="close-circle-outline" size={28} color="#000" /></TouchableOpacity>
      </View>
      <View style={cartStyles.divider} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={cartStyles.scrollContainer}>
        <Text style={cartStyles.sectionTitle}>Order Items</Text>
        {cartItems.length === 0 ? (
          <View style={cartStyles.emptyContainer}><Ionicons name="cart-outline" size={64} color="#cccccc" /><Text style={cartStyles.emptyText}>Your cart is empty</Text></View>
        ) : (
          cartItems.map((item) => (
            <View key={item.id} style={cartStyles.cartCard}>
              <Image source={{ uri: item.image }} style={cartStyles.cartItemImage} />
              <View style={cartStyles.cartItemInfoBox}>
                <View><Text style={cartStyles.itemNameText} numberOfLines={1}>{item.name}</Text><Text style={cartStyles.itemPriceText}>Price: RM {item.price.toFixed(2)}</Text></View>
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
      <View style={cartStyles.fixedFooter}>
        <TouchableOpacity
          style={[cartStyles.checkoutButton, cartItems.length === 0 && cartStyles.checkoutButtonDisabled]}
          disabled={cartItems.length === 0}
          onPress={() => {
            onGoToCheckout(cartItems, remarks);
          }}>
          <Text style={cartStyles.checkoutButtonText}>Go to Checkout</Text>
        </TouchableOpacity></View>
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
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 神仙 CSS 样式表（完全没动）
// ==========================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 10 : 10, backgroundColor: '#ffffff', zIndex: 10 },
  backBtn: { width: 35, height: 30, justifyContent: 'center', alignItems: 'center' },
  cartHeaderIcon: { padding: 2, position: 'relative' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  divider: { height: 2, backgroundColor: '#000000', width: '100%' },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 30, paddingBottom: Platform.OS === 'ios' ? 30 : 20 },

  announcementCard: {
    width: '100%', backgroundColor: '#FFFBEB', borderWidth: 2, borderColor: '#000000',
    borderRadius: 12, padding: 16, paddingTop: 22, marginBottom: 30, position: 'relative',
  },
  announcementBadge: {
    position: 'absolute', top: -14, left: 16, backgroundColor: '#FF8C32',
    borderWidth: 1.5, borderColor: '#000000', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center', zIndex: 5
  },
  announcementBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  announcementText: { fontSize: 14, fontWeight: '700', color: '#000000', lineHeight: 22 },

  foodCard: {
    flexDirection: 'row', width: '100%', marginBottom: 20, height: 125,
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#000000',
    overflow: 'hidden', alignItems: 'center'
  },
  foodCardDisabled: { borderColor: '#A0A0A0' },

  imageContainer: { width: 125, height: '100%', position: 'relative' },
  foodImageLeft: { width: '100%', height: '100%', resizeMode: 'cover', borderRightWidth: 1.5, borderColor: '#000000' },
  foodImageRight: { width: '100%', height: '100%', resizeMode: 'cover', borderLeftWidth: 1.5, borderColor: '#000000' },
  foodImageDisabled: { opacity: 0.6, borderColor: '#A0A0A0' },

  statusBadge: { position: 'absolute', backgroundColor: '#00E676', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 5 },
  badgeLeft: { top: -6, left: -4 },
  badgeRight: { top: -6, right: -4 },
  statusBadgeText: { color: '#000', fontSize: 11, fontWeight: '900' },

  foodInfoBox: { flex: 1, height: '100%', padding: 12, justifyContent: 'space-between', backgroundColor: '#ffffff', position: 'relative' },
  foodNameText: { fontSize: 16, fontWeight: 'bold', color: '#000000', lineHeight: 20 },
  foodPriceText: { fontSize: 15, fontWeight: '900', color: '#000000', marginTop: 4 },
  foodTextDisabled: { color: '#757575' },


  // 🌟 替换掉原来的 outOfStockContainer
  outOfStockContainerRightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute', 
    bottom: 14,            
    left: 12, // 按钮在右边，文字正常靠左
  },
  outOfStockContainerLeftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute', 
    bottom: 14,            
    left: 45, // 🌟 关键：按钮在左边时，给按钮留出 45px 的空间，文字就不会被挡住了
  },
  outOfStockText: { fontSize: 12, fontWeight: '900', color: '#757575', textTransform: 'uppercase' },

  actionButtonRight: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 10, right: 10 },
  actionButtonLeft: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 10, left: 10 },
  actionButtonNormal: { backgroundColor: '#FF8C32' },
  actionButtonDisabled: { backgroundColor: '#C0C0C0' },

  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#D9383A', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modalBackdropCloser: { position: 'absolute', width: width, height: height },
  popupCardBody: { width: width * 0.86, maxHeight: height * 0.85, backgroundColor: '#ffffff', borderWidth: 3, borderColor: '#000000', borderRadius: 16, padding: 18, justifyContent: 'space-between', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 0.2, shadowRadius: 0 }, android: { elevation: 8 } }) },
  popupHeaderRow: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%' },
  popupImageWrapper: { width: '100%', height: 175, borderWidth: 2, borderColor: '#000000', borderRadius: 10, overflow: 'hidden', marginTop: 4, position: 'relative' },
  popupFoodImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  modalStatusBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#00E676', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  popupFoodName: { fontSize: 22, fontWeight: '900', color: '#000000', textAlign: 'center', marginTop: 12, marginBottom: 20, letterSpacing: 0.5 },
  popupDetailsScroll: { flexGrow: 0, marginBottom: 20 },
  detailTextGroup: { marginBottom: 18, width: '100%' },
  detailLabel: { fontSize: 14, fontWeight: '900', color: '#000000', textTransform: 'uppercase', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#333333', lineHeight: 18 },
  popupPriceValue: { fontSize: 18, fontWeight: '900', color: '#000000' },
  popupOrderButton: { width: '100%', backgroundColor: '#FF8C32', borderRadius: 8, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  popupOrderButtonDisabled: { backgroundColor: '#757575' },
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
  cartCard: { flexDirection: 'row', width: '100%', marginBottom: 21, height: 115, alignItems: 'center' },
  cartItemImage: { width: 113, height: 115, borderRadius: 12, borderWidth: 1.7, borderColor: '#000000', resizeMode: 'cover' },
  cartItemInfoBox: { flex: 1, height: 105, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#000000', paddingHorizontal: 14, justifyContent: 'space-between', paddingVertical: 10, borderLeftWidth: 0 },
  itemNameText: { fontSize: 14, fontWeight: 'bold', color: '#000000', lineHeight: 18 },
  itemPriceText: { fontSize: 13, fontWeight: '700', color: '#444444', marginTop: 4 },
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