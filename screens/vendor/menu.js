import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// 🔌 引入您项目中配置好的官方 Supabase 客户端实例
import { supabase } from '../../supabaseClient';

const { width } = Dimensions.get('window');

// ==================== 🔢 智能库存快捷控制器组件 ====================
function StockController({ stockValue, onChangeStock, isEditing }) {
  const [isTextInputMode, setIsTextInputMode] = useState(false);
  const [localValue, setLocalValue] = useState(stockValue.toString());

  useEffect(() => {
    setLocalValue(stockValue.toString());
  }, [stockValue]);

  const handleStep = (step) => {
    const current = parseInt(stockValue, 10) || 0;
    const nextValue = Math.max(0, current + step);
    onChangeStock(nextValue.toString());
  };

  const handleFinishEditing = () => {
    setIsTextInputMode(false);
    const parsed = parseInt(localValue, 10);
    if (isNaN(parsed) || parsed < 0) {
      setLocalValue(stockValue.toString());
    } else {
      onChangeStock(parsed.toString());
    }
  };

  if (!isEditing) {
    return <Text style={styles.stockTextStatic}>{stockValue}</Text>;
  }

  return (
    <View style={styles.stockStepperContainer}>
      <TouchableOpacity style={styles.stepperBtn} onPress={() => handleStep(-1)}>
        <Ionicons name="remove" size={16} color="#000" />
      </TouchableOpacity>

      {isTextInputMode ? (
        <TextInput
          style={styles.stepperInput}
          value={localValue}
          onChangeText={setLocalValue}
          keyboardType="number-pad"
          autoFocus={true}
          onBlur={handleFinishEditing}
          onSubmitEditing={handleFinishEditing}
          returnKeyType="done"
          selectTextOnFocus={true}
        />
      ) : (
        <TouchableOpacity style={styles.stepperValueContainer} onPress={() => setIsTextInputMode(true)}>
          <Text style={styles.stepperValueText}>{stockValue}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.stepperBtn} onPress={() => handleStep(1)}>
        <Ionicons name="add" size={16} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

// ==================== 📱 主页面 SCREEN ====================
export default function MenuScreen({ onBack, navigateToScreen }) {
  // 🚪 侧边栏显隐状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 👤 用户与商家状态
  const [vendorId, setVendorId] = useState(null);
  const [profileName, setProfileName] = useState('Loading...');
  const [profileAvatar, setProfileAvatar] = useState(null);

  // ==================== 🛠️ 全局状态控制 ====================
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('ANNOUNCEMENT');
  const [tabs, setTabs] = useState(['ANNOUNCEMENT']); // 默认只有公告栏，其余分类从数据库动态加载

  // ==================== ➕ 分类命名弹窗状态 ====================
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isEditModeCategory, setIsEditModeCategory] = useState(false);

  // ==================== 📢 公告板状态 (ANNOUNCEMENT) ====================
  const [welcomeText, setWelcomeText] = useState(
    'Welcome to Rasa Syiok . Hope you have a nice day and rasa syioknya'
  );
  const [imageUri, setImageUri] = useState(null);
  const [imageAspectRatio, setImageAspectRatio] = useState(1);

  // 🆕 新增：专门用来控制公告栏是否处于编辑状态
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);

  // ==================== 🍛 菜品列表数据状态 ====================
  const [foodItems, setFoodItems] = useState([]);

  // ==================== 📝 Food Detail 弹窗状态 ====================
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImg, setFormImg] = useState(null);

  // ==================== 🔄 核心：初始化拉取商家的全套数据 ====================
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 1. 获取当前登录用户的 Auth 信息
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setProfileName('GUEST');
          return;
        }
        setVendorId(user.id);

        // 2. 并发读取商家 Profile、分类、菜品
        const [profileRes, categoriesRes, foodRes] = await Promise.all([
          supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
          supabase.from('categories').select('name').eq('vendor_id', user.id).order('created_at', { ascending: true }),
          supabase.from('food_items').select('*').eq('vendor_id', user.id).order('created_at', { ascending: true })
        ]);

        // 绑定侧边栏个人信息
        if (profileRes.data) {
          setProfileName(profileRes.data.full_name || 'No Name');
          setProfileAvatar(profileRes.data.avatar_url || null);
        }

        // 绑定分类 Tab
        if (categoriesRes.data) {
          const dbTabs = categoriesRes.data.map(c => c.name);
          setTabs(['ANNOUNCEMENT', ...dbTabs]);
        }

        // 绑定菜品列表 (把数据库字段映射为前端需要的格式)
        if (foodRes.data) {
          const mappedFoods = foodRes.data.map(item => ({
            id: item.id,
            category: item.category,
            code: item.code,
            name: item.name,
            price: item.price.toString(),
            stock: item.stock.toString(),
            desc: item.desc || '',
            img: item.image_url || null
          }));
          setFoodItems(mappedFoods);
        }

      } catch (err) {
        console.error('Initialization failed:', err);
        setProfileName('ERROR');
      }
    };

    initializeData();
  }, []);

  // ==================== ⚡ 核心逻辑功能与 Supabase 交互 ====================

  const handleTabChange = (nextTab) => {
    // 🆕 修改：检查公告栏自身的编辑状态
    if (activeTab === 'ANNOUNCEMENT' && isEditingAnnouncement && nextTab !== 'ANNOUNCEMENT') {
      Alert.alert("Notice", "Please SAVE your announcement updates before leaving.");
      return;
    }
    if (activeTab !== 'ANNOUNCEMENT' && isEditing && nextTab === 'ANNOUNCEMENT') {
      Alert.alert("Notice", "Please finish or exit editing mode before viewing Announcement.");
      return;
    }

    // 🆕 切换 Tab 时，顺手关闭公告的编辑状态
    if (nextTab !== 'ANNOUNCEMENT') {
      setIsEditingAnnouncement(false);
    }
    setActiveTab(nextTab);
  };

  // 快捷修改单个库存并直接同步到 Supabase
  const handleUpdateSingleStock = async (id, newStock) => {
    const stockInt = parseInt(newStock, 10) || 0;

    // 先乐观更新本地 UI
    setFoodItems(prevItems =>
      prevItems.map(item => item.id === id ? { ...item, stock: newStock } : item)
    );

    // 同步到 Supabase
    const { error } = await supabase
      .from('food_items')
      .update({ stock: stockInt })
      .eq('id', id)
      .eq('vendor_id', vendorId);

    if (error) {
      Alert.alert("Error", "Failed to update stock in database: " + error.message);
    }
  };

  const handleSelectAnnouncementImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      Image.getSize(selectedUri, (width, height) => {
        setImageAspectRatio(width / height);
        setImageUri(selectedUri);
      });
    }
  };

  const handleSelectFoodImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      allowsMultipleSelection: false,
      selectionLimit: 1,
    });
    if (!result.canceled) {
      setFormImg(result.assets[0].uri);
    }
  };

  const openAddCategoryModal = () => {
    setIsEditModeCategory(false);
    setNewCategoryName('');
    setCategoryModalVisible(true);
  };

  const openEditCategoryModal = () => {
    if (activeTab === 'ANNOUNCEMENT') return;
    setIsEditModeCategory(true);
    setNewCategoryName(activeTab);
    setCategoryModalVisible(true);
  };

  // 提交新建分类或重命名分类
  const handleCategorySubmit = async () => {
    const formattedName = newCategoryName.trim().toUpperCase();
    if (formattedName === '') {
      Alert.alert("Error", "Category name cannot be empty.");
      return;
    }

    if (isEditModeCategory) {
      // 重命名模式
      if (formattedName === activeTab) {
        setCategoryModalVisible(false);
        return;
      }
      if (tabs.includes(formattedName) && formattedName !== activeTab) {
        Alert.alert("Error", "This category name already exists.");
        return;
      }

      // 在 Supabase 中更新分类名 (级联外键会自动更新对应的菜品)
      const { error } = await supabase
        .from('categories')
        .update({ name: formattedName })
        .eq('vendor_id', vendorId)
        .eq('name', activeTab);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      // 更新本地状态
      setTabs(tabs.map(t => t === activeTab ? formattedName : t));
      setFoodItems(foodItems.map(item => item.category === activeTab ? { ...item, category: formattedName } : item));
      setActiveTab(formattedName);
    } else {
      // 新建模式
      if (tabs.includes(formattedName)) {
        Alert.alert("Error", "This category already exists.");
        return;
      }

      // 插入到 Supabase
      const { error } = await supabase
        .from('categories')
        .insert([{ vendor_id: vendorId, name: formattedName }]);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setTabs([...tabs, formattedName]);
      setActiveTab(formattedName);
    }
    setCategoryModalVisible(false);
  };

  const openFoodModal = (food = null) => {
    if (food) {
      setEditingFoodId(food.id);
      setFormName(food.name);
      setFormPrice(food.price);
      setFormStock(food.stock);
      setFormDesc(food.desc);
      setFormImg(food.img);
    } else {
      setEditingFoodId(null);
      setFormName('');
      setFormPrice('');
      setFormStock('');
      setFormDesc('');
      setFormImg(null);
    }
    setFoodModalVisible(true);
  };

  // 提交保存或创建菜品
  const handleSaveFoodForm = async () => {
    if (!formName || !formPrice) {
      Alert.alert("Error", "Name and Price are required.");
      return;
    }

    const priceNum = parseFloat(formPrice) || 0;
    const stockInt = parseInt(formStock, 10) || 0;
    const finalName = formName.toUpperCase();

    if (editingFoodId) {
      // 1. 更新现有菜品到 Supabase
      const { error } = await supabase
        .from('food_items')
        .update({
          name: finalName,
          price: priceNum,
          stock: stockInt,
          desc: formDesc,
          image_url: formImg
        })
        .eq('id', editingFoodId)
        .eq('vendor_id', vendorId);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setFoodItems(foodItems.map(item => item.id === editingFoodId ? {
        ...item, name: finalName, price: formPrice, stock: formStock, desc: formDesc, img: formImg
      } : item));
    } else {
      // 2. 新增菜品到 Supabase
      const currentCatCount = foodItems.filter(i => i.category === activeTab).length;
      const newCode = `${activeTab.substring(0, 1)}0${currentCatCount + 1}`;

      const { data, error } = await supabase
        .from('food_items')
        .insert([{
          vendor_id: vendorId,
          category: activeTab,
          code: newCode,
          name: finalName,
          price: priceNum,
          stock: stockInt,
          desc: formDesc,
          image_url: formImg
        }])
        .select()
        .single();

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      // 用数据库返回的真实 id 塞入本地列表
      const newFood = {
        id: data.id,
        category: activeTab,
        code: newCode,
        name: finalName,
        price: formPrice,
        stock: formStock || '0',
        desc: formDesc,
        img: formImg
      };
      setFoodItems([...foodItems, newFood]);
    }
    setFoodModalVisible(false);
  };

  // 删除当前整个分类
  const handleDeleteCategory = () => {
    if (activeTab === 'ANNOUNCEMENT') return;

    Alert.alert("Delete Category", `Are you sure you want to delete the "${activeTab}" category and all its food items?`, [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // 从 Supabase 删除分类 (在建表时设置了 cascade 级联，关联的菜品也会自动被清空)
          const { error } = await supabase
            .from('categories')
            .delete()
            .eq('vendor_id', vendorId)
            .eq('name', activeTab);

          if (error) {
            Alert.alert("Error", error.message);
            return;
          }

          const currentIndex = tabs.indexOf(activeTab);
          let nextTargetTab = 'ANNOUNCEMENT';
          if (currentIndex < tabs.length - 1) {
            nextTargetTab = tabs[currentIndex + 1];
          } else if (currentIndex > 0) {
            nextTargetTab = tabs[currentIndex - 1];
          }

          if (nextTargetTab === 'ANNOUNCEMENT') setIsEditing(false);

          setTabs(tabs.filter(t => t !== activeTab));
          setFoodItems(foodItems.filter(item => item.category !== activeTab));
          setActiveTab(nextTargetTab);
        }
      }
    ]);
  };

  // 删除单个菜品
  const handleDeleteFood = (id) => {
    Alert.alert("Delete", "Are you sure you want to delete this food item?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from('food_items')
            .delete()
            .eq('id', id)
            .eq('vendor_id', vendorId);

          if (error) {
            Alert.alert("Error", error.message);
            return;
          }
          setFoodItems(foodItems.filter(i => i.id !== id));
        }
      }
    ]);
  };

  const handleMenuPress = (targetScreen) => {
    setIsSidebarOpen(false);
    if (targetScreen === 'menu') return;
    if (navigateToScreen) {
      navigateToScreen(targetScreen);
    } else if (onBack) {
      onBack(targetScreen);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ==================== 🚪 侧边栏（Sidebar）组件 ==================== */}
      <Modal
        transparent={true}
        visible={isSidebarOpen}
        animationType="none"
        onRequestClose={() => setIsSidebarOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="menu" size={32} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                {profileAvatar ? (
                  <Image source={{ uri: profileAvatar }} style={styles.sidebarAvatarImage} />
                ) : (
                  <Ionicons name="person-outline" size={45} color="#000" />
                )}
              </View>
              <Text style={styles.avatarName}>{profileName}</Text>
            </View>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('order')}>
              <Text style={styles.sidebarItemText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('profile')}>
              <Text style={styles.sidebarItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => handleMenuPress('menu')}>
              <Text style={styles.sidebarItemText}>Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('operationstatus')}>
              <Text style={styles.sidebarItemText}>Update Status</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('historyorder')}>
              <Text style={styles.sidebarItemText}>History Order</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('review')}>
              <Text style={styles.sidebarItemText}>Review</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('resetpassword')}>
              <Text style={styles.sidebarItemText}>Reset Password</Text>
            </TouchableOpacity>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={() => handleMenuPress('logout')}>
                <Ionicons name="log-out-outline" size={24} color="#000" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* ==================== 1. HEADER ==================== */}
      <View style={styles.header}>
        {!isEditing ? (
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setIsSidebarOpen(true)}>
            <Ionicons name="menu" size={35} color="#000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setIsEditing(false)}>
            <Ionicons name="arrow-back-circle-outline" size={32} color="#000" />
          </TouchableOpacity>
        )}

        <Text style={styles.headerTitle}>Menu</Text>
        
        {/* 无论在哪个 Tab 都会显示，它只控制全局菜品和分类的编辑/保存状态 */}
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => setIsEditing(!isEditing)}>
          <Ionicons
            name={isEditing ? "checkmark-circle-outline" : "create-outline"}
            size={28}
            color={isEditing ? "green" : "#000"}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {/* ==================== 2. TAB BAR ==================== */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
          {tabs.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                onPress={() => handleTabChange(tab)}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
          {isEditing && (
            <TouchableOpacity style={styles.tabAddButton} onPress={openAddCategoryModal}>
              <Ionicons name="add" size={22} color="#000" />
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* ==================== 3. 主页面显示区 ==================== */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {activeTab === 'ANNOUNCEMENT' && (
          <View style={{ flex: 1 }}>
            {/* 🆕 这里的控制栏完全移交给独立的公告编辑状态 isEditingAnnouncement */}
            {isEditingAnnouncement && (
              <View style={styles.toolbarContainer}>
                <View style={styles.leftTools}>
                  <TouchableOpacity style={styles.toolIconBtn} onPress={() => setImageUri(null)}>
                    <Ionicons name="trash-outline" size={24} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolIconBtn} onPress={handleSelectAnnouncementImage}>
                    <Ionicons name="image-outline" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.saveButton} onPress={() => setIsEditingAnnouncement(false)}>
                  <Text style={styles.saveButtonText}>SAVE</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.welcomeCard}>
                {/* 🆕 只有在没有编辑公告时，才显示红色小 edit 按钮 */}
                {!isEditingAnnouncement && (
                  <TouchableOpacity style={styles.cardEditBtn} onPress={() => setIsEditingAnnouncement(true)}>
                    <Text style={styles.cardEditText}>edit</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.cardHeader}>
                  <Ionicons name="person-circle-outline" size={60} color="#333" style={styles.avatarIcon} />
                  <Text style={styles.brandTitle}>Rasa Syiok</Text>
                </View>
                <View style={styles.cardBody}>
                  {!isEditingAnnouncement ? (
                    <Text style={styles.welcomeText}>{welcomeText}</Text>
                  ) : (
                    <TextInput
                      style={styles.welcomeInput}
                      multiline={true}
                      value={welcomeText}
                      onChangeText={setWelcomeText}
                      autoFocus={true}
                    />
                  )}
                </View>
                {imageUri && (
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: imageUri }} style={[styles.realSelectedImage, { aspectRatio: imageAspectRatio }]} resizeMode="contain" />
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}

        {activeTab !== 'ANNOUNCEMENT' && (
          <View style={{ flex: 1 }}>
            {isEditing && (
              <View style={styles.hintBar}>
                <View style={styles.hintLeftIcons}>
                  <TouchableOpacity onPress={handleDeleteCategory} style={{ marginRight: 16 }}>
                    <Ionicons name="trash-outline" size={22} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={openEditCategoryModal}>
                    <Ionicons name="create-outline" size={22} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <ScrollView contentContainerStyle={styles.foodListContainer} keyboardShouldPersistTaps="handled">
              {foodItems.filter(item => item.category === activeTab).map((food) => (
                <View key={food.id} style={styles.foodCard}>
                  {isEditing && (
                    <View style={styles.foodActionLeft}>
                      <TouchableOpacity onPress={() => handleDeleteFood(food.id)}>
                        <Ionicons name="trash-outline" size={20} color="red" style={{ marginRight: 8 }} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openFoodModal(food)}>
                        <Ionicons name="create-outline" size={20} color="blue" style={{ marginRight: 8 }} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {food.img ? (
                    <Image source={{ uri: food.img }} style={styles.foodThumb} />
                  ) : (
                    <View style={styles.foodThumbEmpty}>
                      <Ionicons name="fast-food-outline" size={20} color="#999" />
                    </View>
                  )}

                  <View style={styles.foodInfo}>
                    <Text style={styles.foodTitle}>{food.code} {food.name}</Text>
                    <Text style={styles.foodPrice}>RM {food.price}</Text>
                  </View>

                  <View style={styles.foodActionRight}>
                    <StockController
                      stockValue={food.stock}
                      isEditing={isEditing}
                      onChangeStock={(newStock) => handleUpdateSingleStock(food.id, newStock)}
                    />
                    {!isEditing && (
                      <TouchableOpacity style={styles.addBtn}>
                        <Ionicons name="add-circle" size={24} color="#000" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              {isEditing && (
                <TouchableOpacity style={styles.addFoodBigBtn} onPress={() => openFoodModal(null)}>
                  <Ionicons name="add" size={40} color="#000" />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ==================== 🛠️ 弹窗 1: 分类输入对话框 ==================== */}
      <Modal visible={categoryModalVisible} animationType="fade" transparent={true}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>{isEditModeCategory ? "Edit Category Name" : "Add New Category"}</Text>
            <Text style={styles.dialogSubTitle}>Enter a name for this category:</Text>
            <TextInput
              style={styles.dialogInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="e.g. SNACK, WESTERN"
              autoFocus={true}
              autoCapitalize="characters"
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={[styles.dialogBtn, { borderColor: '#eee', borderRightWidth: 0.5 }]} onPress={() => setCategoryModalVisible(false)}>
                <Text style={[styles.dialogBtnText, { color: '#666' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogBtn} onPress={handleCategorySubmit}>
                <Text style={[styles.dialogBtnText, { color: '#007AFF', fontWeight: 'bold' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== 🍔 弹窗 2: Food Detail 详情编辑层 ==================== */}
      <Modal visible={foodModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>{editingFoodId ? "Adjust Food" : "Add New Food"}</Text>
              <TouchableOpacity onPress={() => setFoodModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.imageSelectorCenterWrapper}>
                <TouchableOpacity style={styles.modalImageSelectorCircle} onPress={handleSelectFoodImage}>
                  {formImg ? (
                    <Image source={{ uri: formImg }} style={styles.modalSelectedImgCircle} />
                  ) : (
                    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 10 }}>
                      <Ionicons name="cloud-upload-outline" size={32} color="#aaa" />
                      <Text style={{ fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'center' }}>Upload Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Name:</Text>
              <TextInput style={styles.modalInput} value={formName} onChangeText={setFormName} placeholder="e.g. MEE GORENG" />

              <Text style={styles.inputLabel}>Price (RM):</Text>
              <TextInput style={styles.modalInput} value={formPrice} onChangeText={setFormPrice} keyboardType="numeric" placeholder="e.g. 6" />

              <Text style={styles.inputLabel}>Stock:</Text>
              <TextInput style={styles.modalInput} value={formStock} onChangeText={setFormStock} keyboardType="numeric" placeholder="e.g. 50" />

              <Text style={styles.inputLabel}>Description:</Text>
              <TextInput style={[styles.modalInput, { height: 80 }]} value={formDesc} onChangeText={setFormDesc} multiline placeholder="Describe this dish..." />

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSaveFoodForm}>
                <Text style={styles.modalSubmitBtnText}>CONFIRM & SAVE</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ==================== 🎨 STYLES ====================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  divider: { height: 2, backgroundColor: '#000', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: Platform.OS === 'ios' ? 15 : 35 },
  headerIconBtn: { width: 35, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: 'normal', color: '#000' },

  tabBarContainer: { width: '100%', borderBottomWidth: 1.5, borderColor: '#000', backgroundColor: '#fff', height: 50 },
  tabBarScroll: { flexDirection: 'row', alignItems: 'center' },

  tabButton: { paddingVertical: 10, paddingHorizontal: 16, borderRightWidth: 1.5, borderColor: '#000', minWidth: 95, height: '100%', alignItems: 'center', justifyContent: 'center' },
  tabButtonActive: { backgroundColor: '#A9A9A9' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#000' },
  tabTextActive: { color: '#fff' },
  tabAddButton: { width: 50, height: '100%', justifyContent: 'center', alignItems: 'center', borderRightWidth: 1.5, borderColor: '#000' },

  dialogOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  dialogBox: { width: 280, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', alignItems: 'center', paddingTop: 20 },
  dialogTitle: { fontSize: 17, fontWeight: '600', color: '#000', marginBottom: 5 },
  dialogSubTitle: { fontSize: 13, color: '#666', marginBottom: 15, paddingHorizontal: 10, textAlign: 'center' },
  dialogInput: { width: '85%', height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10, fontSize: 14, marginBottom: 20, textAlign: 'center', backgroundColor: '#fcfcfc' },
  dialogActions: { flexDirection: 'row', borderTopWidth: 0.5, borderColor: '#eee', width: '100%' },
  dialogBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  dialogBtnText: { fontSize: 16 },

  toolbarContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 15 },
  leftTools: { flexDirection: 'row', alignItems: 'center' },
  toolIconBtn: { marginRight: 15, padding: 5 },
  saveButton: { backgroundColor: '#A9A9A9', paddingVertical: 4, paddingHorizontal: 16, borderRadius: 12 },
  saveButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  scrollContainer: { paddingHorizontal: 20, paddingTop: 15, alignItems: 'center' },
  welcomeCard: { width: '100%', borderWidth: 1.5, borderColor: '#000', borderRadius: 24, padding: 20, backgroundColor: '#fff', position: 'relative' },
  cardEditBtn: { position: 'absolute', top: 15, right: 20 },
  cardEditText: { fontSize: 13, color: 'red', textDecorationLine: 'underline', fontWeight: 'bold' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarIcon: { marginRight: 12 },
  brandTitle: { fontSize: 32, fontWeight: 'bold', color: '#000' },
  cardBody: { width: '100%' },
  welcomeText: { fontSize: 16, lineHeight: 24, color: '#000', textAlign: 'center' },
  welcomeInput: { fontSize: 16, lineHeight: 24, color: '#000', textAlign: 'center', padding: 10, minHeight: 80, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, backgroundColor: '#fafafa' },
  imageWrapper: { width: '100%', marginTop: 15, alignItems: 'center' },
  realSelectedImage: { width: '100%', borderRadius: 12, borderWidth: 1, borderColor: '#000', backgroundColor: '#fafafa' },

  hintBar: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'space-between' },
  hintLeftIcons: { flexDirection: 'row', alignItems: 'center' },

  foodListContainer: { padding: 15, paddingTop: 5 },
  foodCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#000', borderRadius: 20, padding: 10, marginBottom: 12, backgroundColor: '#fff' },
  foodActionLeft: { flexDirection: 'row', alignItems: 'center' },

  foodThumb: { width: 45, height: 45, borderRadius: 22.5, marginRight: 10 },
  foodThumbEmpty: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 0.5, borderColor: '#ccc' },

  foodInfo: { flex: 1 },
  foodTitle: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  foodPrice: { fontSize: 12, color: '#333', marginTop: 2 },

  foodActionRight: { flexDirection: 'row', alignItems: 'center' },
  addBtn: { padding: 2, marginLeft: 4 },

  stockTextStatic: { fontSize: 13, fontWeight: 'bold', marginRight: 8, color: '#000' },
  stockStepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 15,
    height: 28,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginRight: 4
  },
  stepperBtn: { width: 26, height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  stepperValueContainer: { minWidth: 32, height: '100%', alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e5e5e5', paddingHorizontal: 4, backgroundColor: '#f9f9f9' },
  stepperValueText: { fontSize: 13, fontWeight: 'bold', color: '#000', textAlign: 'center' },
  stepperInput: { minWidth: 32, height: '100%', borderColor: '#e5e5e5', borderLeftWidth: 1, borderRightWidth: 1, textAlign: 'center', padding: 0, fontSize: 13, fontWeight: 'bold', color: '#000', backgroundColor: '#fff' },

  addFoodBigBtn: { width: '100%', height: 54, borderWidth: 1.5, borderColor: '#000', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginTop: 10, backgroundColor: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
  modalHeaderTitle: { fontSize: 18, fontWeight: 'bold' },
  modalForm: { padding: 20 },

  imageSelectorCenterWrapper: { width: '100%', alignItems: 'center', marginBottom: 20 },
  modalImageSelectorCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f8f8f8', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  modalSelectedImgCircle: { width: '100%', height: '100%', borderRadius: 55 },

  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#333' },
  modalInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 14, backgroundColor: '#fff' },
  modalSubmitBtn: { backgroundColor: '#A9A9A9', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  modalSubmitBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  /* ==================== Sidebar 样式表 ==================== */
  modalContainer: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: Dimensions.get('window').width * 0.75,
    height: '100%',
    backgroundColor: '#fff',
    borderRightWidth: 2,
    borderRightColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 40 : 25,
    zIndex: 10,
  },
  sidebarHeader: { paddingHorizontal: 15, paddingBottom: 10 },
  avatarSection: { alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1.5, borderBottomColor: '#000', marginBottom: 10 },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    overflow: 'hidden',
  },
  sidebarAvatarImage: { width: '100%', height: '100%', borderRadius: 35 },
  avatarName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  sidebarItem: { width: '100%', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1.5, borderBottomColor: '#000', alignItems: 'center' },
  sidebarActiveItem: { backgroundColor: '#A9A9A9' },
  sidebarItemText: { fontSize: 22, color: '#000', fontWeight: 'normal' },
  sidebarFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1.5, borderTopColor: '#000', paddingVertical: 12, backgroundColor: '#fff' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 22, color: '#000', marginLeft: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
});