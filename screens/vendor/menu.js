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
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// 🛠️ Import the new File API from Expo SDK 54 for reading local file binary ArrayBuffer
import { File } from 'expo-file-system';

// 🔌 Import the configured official Supabase client instance from your project
import { supabase } from '../../supabaseClient';

const { width } = Dimensions.get('window');

// ==================== 🔢 Smart stock quick-control sub-component ====================
function StockController({ stockValue, onChangeStock, isEditing }) {
  const [isTextInputMode, setIsTextInputMode] = useState(false);
  const [localValue, setLocalValue] = useState(stockValue.toString());

  useEffect(() => {
    setLocalValue(stockValue.toString());
  }, [stockValue]);

  const handleFinishEditing = () => {
    setIsTextInputMode(false);
    const parsed = parseInt(localValue, 10);
    if (isNaN(parsed) || parsed < 0) {
      setLocalValue(stockValue.toString());
    } else {
      onChangeStock(parsed.toString());
    }
  };

  const handleStep = (step) => {
    const current = parseInt(stockValue, 10) || 0;
    const nextValue = Math.max(0, current + step);
    onChangeStock(nextValue.toString());
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

// ==================== 📱 Main Screen ====================
function MenuScreen({ onBack, navigateToScreen }) {
  // 🚪 Sidebar open/close state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 👤 User and vendor state
  const [vendorId, setVendorId] = useState(null);
  const [profileName, setProfileName] = useState('Loading...');
  const [profileAvatar, setProfileAvatar] = useState(null);

  // ==================== 🛠️ Global state controls ====================
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('ANNOUNCEMENT');
  const [tabs, setTabs] = useState(['ANNOUNCEMENT']); // Default has only announcement, other categories loaded dynamically from database
  const [isLoading, setIsLoading] = useState(false); // Upload loading spinner state

  // ==================== ➕ Category naming modal state ====================
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isEditModeCategory, setIsEditModeCategory] = useState(false);

  // ==================== 📢 Announcement board state ====================
  const [welcomeText, setWelcomeText] = useState(' ');
  const [imageUri, setImageUri] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 }); // Real dimensions, avoid flickering
  const [imageLoaded, setImageLoaded] = useState(false); // Image loaded flag, prevents rendering with wrong ratio first

  // Dedicated control for whether the announcement is in edit mode
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);

  // ==================== 🍛 Food item data state ====================
  const [foodItems, setFoodItems] = useState([]);

  // ==================== 📝 Food Detail modal state ====================
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImg, setFormImg] = useState(null);
  const [formAllergen, setFormAllergen] = useState('');  // Allergen field state
  const [formCalories, setFormCalories] = useState('');  // Calories field state

  // ==================== 🔄 Core: Initialize and fetch all vendor data ====================
  useEffect(() => {
    const initializeData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setProfileName('GUEST');
          return;
        }
        setVendorId(user.id);

        const [profileRes, categoriesRes, foodRes, announcementRes] = await Promise.all([
          supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
          supabase.from('categories').select('category_id, name').eq('vendor_id', user.id).order('created_at', { ascending: true }),
          supabase.from('food_items').select('*').eq('vendor_id', user.id).order('created_at', { ascending: true }),
          supabase.from('announcements').select('content, image_url').eq('vendor_id', user.id).maybeSingle()
        ]);

        if (profileRes.data) {
          setProfileName(profileRes.data.full_name || 'No Name');
          setProfileAvatar(profileRes.data.avatar_url || null);
        }

        if (announcementRes.data) {
          setWelcomeText(announcementRes.data.content || ' ');
          const dbImgUrl = announcementRes.data.image_url || null;
          setImageUri(dbImgUrl);
        }

        const categoryMap = {};
        if (categoriesRes.data) {
          categoriesRes.data.forEach(c => {
            categoryMap[c.category_id] = c.name;
          });
          const dbTabs = categoriesRes.data.map(c => c.name);
          setTabs(['ANNOUNCEMENT', ...dbTabs]);
        }

        if (foodRes.data) {
          const mappedFoods = foodRes.data.map(item => ({
            id: item.id,
            category: categoryMap[item.category_id] || '',
            category_id: item.category_id,
            name: item.name,
            price: item.price.toString(),
            stock: item.stock.toString(),
            desc: item.desc || '',
            img: item.image_url || null,
            allergen: item.allergen || '',
            calories: item.calories ? item.calories.toString() : ''
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

  // ==================== 🖼️ Fix image flickering: reset load state when imageUri changes ====================
  useEffect(() => {
    if (!imageUri) {
      setImageLoaded(false);
      setImageSize({ width: 1, height: 1 });
      return;
    }
    // Reset to not-loaded each time URI changes; onLoad will re-trigger display
    setImageLoaded(false);

    if (!imageUri.startsWith('file://')) {
      // https URL: use Image.getSize to prefetch dimensions (local files provided by ImagePicker asset)
      let cancelled = false;
      Image.getSize(
        imageUri,
        (w, h) => { if (!cancelled && w && h) setImageSize({ width: w, height: h }); },
        (err) => console.log('Failed to get image size:', err)
      );
      return () => { cancelled = true; };
    }
  }, [imageUri]);

  // ==================== 📦 Stable upload: use expo-file-system to read Base64 and avoid Fetch errors ====================
  const uploadImageToStorage = async (localUri, bucketName) => {
    if (!localUri || !localUri.startsWith('file://')) {
      return localUri;
    }

    try {
      const fileExt = (localUri.split('.').pop() || 'jpg').toLowerCase();
      const mimeType = fileExt === 'png' ? 'image/png' : fileExt === 'gif' ? 'image/gif' : 'image/jpeg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${vendorId}/${fileName}`;

      // 🛠️ Core fix: use Expo SDK 54's File API to directly read as ArrayBuffer asynchronously, no bridge overhead and no deprecation warnings
      const file = new File(localUri);
      const arrayBuffer = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, arrayBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      throw err;
    }
  };

  // ==================== ⚡ Business interaction logic ====================

  const handleTabChange = (nextTab) => {
    if (activeTab === 'ANNOUNCEMENT' && isEditingAnnouncement && nextTab !== 'ANNOUNCEMENT') {
      Alert.alert("Notice", "Please SAVE your announcement updates before leaving.");
      return;
    }
    if (activeTab !== 'ANNOUNCEMENT' && isEditing && nextTab === 'ANNOUNCEMENT') {
      Alert.alert("Notice", "Please finish or exit editing mode before viewing Announcement.");
      return;
    }

    if (nextTab !== 'ANNOUNCEMENT') {
      setIsEditingAnnouncement(false);
    }
    setActiveTab(nextTab);
  };

  const handleSaveAnnouncement = async () => {
    setIsLoading(true);
    try {
      let finalImageUrl = imageUri;

      if (imageUri && imageUri.startsWith('file://')) {
        finalImageUrl = await uploadImageToStorage(imageUri, 'announcements');
      }

      // Check first if an existing record exists, then decide to insert or update
      // ⚠️ Important: the table's primary key is vendor_id, there is no separate id column!
      const { data: existing, error: selectError } = await supabase
        .from('announcements')
        .select('vendor_id')
        .eq('vendor_id', vendorId)
        .maybeSingle();

      if (selectError) {
        console.error('SELECT error:', JSON.stringify(selectError));
        throw selectError;
      }

      let dbError = null;

      if (existing) {
        // Existing record → update
        const { error } = await supabase
          .from('announcements')
          .update({ content: welcomeText, image_url: finalImageUrl })
          .eq('vendor_id', vendorId);
        dbError = error;
      } else {
        // No record → insert
        const { error } = await supabase
          .from('announcements')
          .insert({ vendor_id: vendorId, content: welcomeText, image_url: finalImageUrl });
        dbError = error;
      }

      if (dbError) {
        console.error('DB write error:', JSON.stringify(dbError));
        Alert.alert('Error', `Save failed [${dbError.code}]: ${dbError.message}`);
      } else {
        setImageUri(finalImageUrl);
        setIsEditingAnnouncement(false);
        Alert.alert('Success', 'Announcement saved successfully!');
      }
    } catch (err) {
      console.error('handleSaveAnnouncement error:', err);
      Alert.alert('Error', 'Upload failed: ' + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSingleStock = async (id, newStock) => {
    const stockInt = parseInt(newStock, 10) || 0;

    setFoodItems(prevItems =>
      prevItems.map(item => item.id === id ? { ...item, stock: newStock } : item)
    );

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
      const asset = result.assets[0];
      // Set URI directly; get dimensions synchronously from asset, no async getSize needed
      if (asset.width && asset.height) {
        setImageSize({ width: asset.width, height: asset.height });
      }
      setImageLoaded(false); // Reset load state, wait for new image onLoad
      setImageUri(asset.uri);
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

  const handleCategorySubmit = async () => {
    const formattedName = newCategoryName.trim().toUpperCase();
    if (formattedName === '') {
      Alert.alert("Error", "Category name cannot be empty.");
      return;
    }

    if (isEditModeCategory) {
      if (formattedName === activeTab) {
        setCategoryModalVisible(false);
        return;
      }
      if (tabs.includes(formattedName) && formattedName !== activeTab) {
        Alert.alert("Error", "This category name already exists.");
        return;
      }

      const { error } = await supabase
        .from('categories')
        .update({ name: formattedName })
        .eq('vendor_id', vendorId)
        .eq('name', activeTab);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setTabs(tabs.map(t => t === activeTab ? formattedName : t));
      setFoodItems(foodItems.map(item => item.category === activeTab ? { ...item, category: formattedName } : item));
      setActiveTab(formattedName);
    } else {
      if (tabs.includes(formattedName)) {
        Alert.alert("Error", "This category already exists.");
        return;
      }

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
      setFormAllergen(food.allergen || '');
      setFormCalories(food.calories ? food.calories.toString() : '');
    } else {
      setEditingFoodId(null);
      setFormName('');
      setFormPrice('');
      setFormStock('');
      setFormDesc('');
      setFormImg(null);
      setFormAllergen('');
      setFormCalories('');
    }
    setFoodModalVisible(true);
  };

  const handleSaveFoodForm = async () => {
    // 🚨 Validation logic update:
    // Required: Name, Price, Allergen, Calories, Stock
    // Optional: Desc (can be empty)
    if (!formName || !formPrice || !formAllergen.trim() || !formCalories.trim() || formStock === '') {
      Alert.alert("Error", "Name, Price, Stock, Allergen, and Calories are required.");
      return;
    }

    setIsLoading(true);
    const priceNum = parseFloat(formPrice) || 0;
    const stockInt = parseInt(formStock, 10) || 0; // Initialize to 0 even if not filled
    const caloriesNum = parseFloat(formCalories) || 0;
    const finalName = formName.toUpperCase();
    const finalAllergen = formAllergen.trim();
    const finalDesc = formDesc.trim(); // Get description, keep it optional

    try {
      let finalFoodImgUrl = formImg;
      if (formImg && formImg.startsWith('file://')) {
        finalFoodImgUrl = await uploadImageToStorage(formImg, 'food_items');
      }

      const { data: catData } = await supabase
        .from('categories')
        .select('category_id')
        .eq('vendor_id', vendorId)
        .eq('name', activeTab)
        .single();

      const currentCategoryId = catData ? catData.category_id : null;

      if (editingFoodId) {
        const { error } = await supabase
          .from('food_items')
          .update({
            name: finalName,
            price: priceNum,
            stock: stockInt,
            desc: finalDesc,         // Update description, store even if empty
            image_url: finalFoodImgUrl,
            allergen: finalAllergen,
            calories: caloriesNum
          })
          .eq('id', editingFoodId)
          .eq('vendor_id', vendorId);

        if (error) {
          Alert.alert("Error", error.message);
          return;
        }

        setFoodItems(foodItems.map(item => item.id === editingFoodId ? {
          ...item,
          name: finalName,
          price: formPrice,
          stock: formStock,
          desc: finalDesc,
          img: finalFoodImgUrl,
          allergen: finalAllergen,
          calories: formCalories
        } : item));
      } else {
        const { data, error } = await supabase
          .from('food_items')
          .insert([{
            vendor_id: vendorId,
            category_id: currentCategoryId,
            name: finalName,
            price: priceNum,
            stock: stockInt,
            desc: finalDesc,         // Insert description, even if empty
            image_url: finalFoodImgUrl,
            allergen: finalAllergen,
            calories: caloriesNum
          }])
          .select()
          .single();

        if (error) {
          Alert.alert("Error", error.message);
          return;
        }

        const newFood = {
          id: data.id,
          category: activeTab,
          category_id: currentCategoryId,
          name: finalName,
          price: formPrice,
          stock: formStock,
          desc: finalDesc,
          img: finalFoodImgUrl,
          allergen: finalAllergen,
          calories: formCalories
        };
        setFoodItems([...foodItems, newFood]);
      }
      setFoodModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "An error occurred while saving food.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = () => {
    if (activeTab === 'ANNOUNCEMENT') return;

    Alert.alert("Delete Category", `Are you sure you want to delete "${activeTab}"? All inside items will be removed.`, [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error: catDeleteError } = await supabase
              .from('categories')
              .delete()
              .eq('vendor_id', vendorId)
              .eq('name', activeTab);

            if (catDeleteError) {
              Alert.alert("Error", "Failed to complete deletion: " + catDeleteError.message);
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

            Alert.alert("Success", "Category and internal foods deleted successfully.");
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "An unexpected runtime error occurred.");
          }
        }
      }
    ]);
  };

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
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Syncing data with Cloud Storage...</Text>
        </View>
      )}

      {/* Sidebar */}
      <Modal transparent={true} visible={isSidebarOpen} animationType="none" onRequestClose={() => setIsSidebarOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="menu" size={32} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                {profileAvatar ? <Image source={{ uri: profileAvatar }} style={styles.sidebarAvatarImage} /> : <Ionicons name="person-outline" size={45} color="#000" />}
              </View>
              <Text style={styles.avatarName}>{profileName}</Text>
            </View>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('order')}><Text style={styles.sidebarItemText}>Home</Text></TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('profile')}><Text style={styles.sidebarItemText}>Profile</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.sidebarItem, styles.sidebarActiveItem]} onPress={() => handleMenuPress('menu')}><Text style={styles.sidebarItemText}>Menu</Text></TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('operationstatus')}><Text style={styles.sidebarItemText}>Update Status</Text></TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('historyorder')}><Text style={styles.sidebarItemText}>History Order</Text></TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('review')}><Text style={styles.sidebarItemText}>Review</Text></TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => handleMenuPress('resetpassword')}><Text style={styles.sidebarItemText}>Reset Password</Text></TouchableOpacity>
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={() => handleMenuPress('logout')}>
                <Ionicons name="log-out-outline" size={24} color="#000" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}><View style={styles.backdrop} /></TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* HEADER */}
      <View style={styles.header}>
        {!isEditing ? (
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setIsSidebarOpen(true)}><Ionicons name="menu" size={35} color="#000" /></TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setIsEditing(false)}><Ionicons name="arrow-back-circle-outline" size={32} color="#000" /></TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Menu</Text>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name={isEditing ? "checkmark-circle-outline" : "create-outline"} size={28} color={isEditing ? "green" : "#000"} />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {/* TAB BAR */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
          {tabs.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity key={tab} style={[styles.tabButton, isSelected && styles.tabButtonActive]} onPress={() => handleTabChange(tab)}>
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
          {isEditing && (
            <TouchableOpacity style={styles.tabAddButton} onPress={openAddCategoryModal}><Ionicons name="add" size={22} color="#000" /></TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* CONTENT AREA */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {activeTab === 'ANNOUNCEMENT' && (
          <View style={{ flex: 1 }}>
            {isEditingAnnouncement && (
              <View style={styles.toolbarContainer}>
                <View style={styles.leftTools}>
                  <TouchableOpacity style={styles.toolIconBtn} onPress={() => setImageUri(null)}><Ionicons name="trash-outline" size={24} color="#000" /></TouchableOpacity>
                  <TouchableOpacity style={styles.toolIconBtn} onPress={handleSelectAnnouncementImage}><Ionicons name="image-outline" size={24} color="#000" /></TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveAnnouncement}><Text style={styles.saveButtonText}>SAVE</Text></TouchableOpacity>
              </View>
            )}
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.welcomeCard}>
                {!isEditingAnnouncement && <TouchableOpacity style={styles.cardEditBtn} onPress={() => setIsEditingAnnouncement(true)}><Text style={styles.cardEditText}>edit</Text></TouchableOpacity>}
                <View style={styles.cardHeader}>
                  {profileAvatar ? <Image source={{ uri: profileAvatar }} style={[styles.avatarIcon, { width: 60, height: 60, borderRadius: 30 }]} /> : <Ionicons name="person-circle-outline" size={60} color="#333" style={styles.avatarIcon} />}
                  <Text style={styles.brandTitle}>{profileName}</Text>
                </View>
                <View style={styles.cardBody}>
                  {!isEditingAnnouncement ? <Text style={styles.welcomeText}>{welcomeText}</Text> : <TextInput style={styles.welcomeInput} multiline value={welcomeText} onChangeText={setWelcomeText} autoFocus />}
                </View>

                {imageUri && (
                  <View style={[styles.imageWrapper, !imageLoaded && { borderWidth: 0, backgroundColor: 'transparent' }]}>
                    {!imageLoaded && (
                      <ActivityIndicator size="small" color="#000" style={{ marginVertical: 20 }} />
                    )}
                    <Image
                      source={{ uri: imageUri }}
                      style={[
                        styles.realSelectedImage,
                        { aspectRatio: imageSize.width / imageSize.height },
                        !imageLoaded && { position: 'absolute', opacity: 0, width: 1, height: 1 }
                      ]}
                      resizeMode="contain"
                      onLoad={(e) => {
                        const { width: w, height: h } = e.nativeEvent.source;
                        if (w && h) {
                          setImageSize({ width: w, height: h });
                        }
                        setImageLoaded(true);
                      }}
                      onError={() => {
                        setImageLoaded(true);
                      }}
                    />
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
                  <TouchableOpacity onPress={handleDeleteCategory} style={{ marginRight: 16 }}><Ionicons name="trash-outline" size={22} color="#000" /></TouchableOpacity>
                  <TouchableOpacity onPress={openEditCategoryModal}><Ionicons name="create-outline" size={22} color="#000" /></TouchableOpacity>
                </View>
              </View>
            )}
            <ScrollView contentContainerStyle={styles.foodListContainer} keyboardShouldPersistTaps="handled">
              {foodItems.filter(item => item.category === activeTab).map((food) => (
                <View key={food.id} style={styles.foodCard}>
                  {isEditing && (
                    <View style={styles.foodActionLeft}>
                      <TouchableOpacity onPress={() => handleDeleteFood(food.id)}><Ionicons name="trash-outline" size={20} color="red" style={{ marginRight: 8 }} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => openFoodModal(food)}><Ionicons name="create-outline" size={20} color="blue" style={{ marginRight: 8 }} /></TouchableOpacity>
                    </View>
                  )}
                  {food.img ? <Image source={{ uri: food.img }} style={styles.foodThumb} /> : <View style={styles.foodThumbEmpty}><Ionicons name="fast-food-outline" size={20} color="#999" /></View>}
                  <View style={styles.foodInfo}>
                    {/* ✨ food.code rendering has been removed */}
                    <Text style={styles.foodTitle}>{food.name}</Text>
                    <Text style={styles.foodPrice}>RM {food.price}</Text>
                  </View>
                  <View style={styles.foodActionRight}>
                    <StockController stockValue={food.stock} isEditing={isEditing} onChangeStock={(newStock) => handleUpdateSingleStock(food.id, newStock)} />
                    {!isEditing && <TouchableOpacity style={styles.addBtn}><Ionicons name="add-circle" size={24} color="#000" /></TouchableOpacity>}
                  </View>
                </View>
              ))}
              {isEditing && <TouchableOpacity style={styles.addFoodBigBtn} onPress={() => openFoodModal(null)}><Ionicons name="add" size={40} color="#000" /></TouchableOpacity>}
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Category modal */}
      <Modal visible={categoryModalVisible} animationType="fade" transparent={true}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>{isEditModeCategory ? "Edit Category Name" : "Add New Category"}</Text>
            <TextInput style={styles.dialogInput} value={newCategoryName} onChangeText={setNewCategoryName} placeholder="e.g. SNACK" autoFocus autoCapitalize="characters" />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogBtn} onPress={() => setCategoryModalVisible(false)}><Text style={{ color: '#666' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dialogBtn} onPress={handleCategorySubmit}><Text style={{ color: '#007AFF', fontWeight: 'bold' }}>OK</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Food item edit modal */}
      <Modal visible={foodModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>{editingFoodId ? "Adjust Food" : "Add New Food"}</Text>
              <TouchableOpacity onPress={() => setFoodModalVisible(false)}><Ionicons name="close" size={28} color="#000" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={styles.imageSelectorCenterWrapper}>
                <TouchableOpacity style={styles.modalImageSelectorCircle} onPress={handleSelectFoodImage}>
                  {formImg ? <Image source={{ uri: formImg }} style={styles.modalSelectedImgCircle} /> : <Text style={{ color: '#aaa' }}>Upload Photo</Text>}
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Name:</Text>
              <TextInput style={styles.modalInput} value={formName} onChangeText={setFormName} />

              <Text style={styles.inputLabel}>Price (RM):</Text>
              <TextInput style={styles.modalInput} value={formPrice} onChangeText={setFormPrice} keyboardType="numeric" />

              <Text style={styles.inputLabel}>Stock:</Text>
              <TextInput style={styles.modalInput} value={formStock} onChangeText={setFormStock} keyboardType="numeric" />

              {/* Allergen field */}
              <Text style={styles.inputLabel}>Allergen:</Text>
              <TextInput
                style={styles.modalInput}
                value={formAllergen}
                onChangeText={setFormAllergen}
                placeholder="e.g. Peanuts, Eggs / None"
              />

              {/* Calories field */}
              <Text style={styles.inputLabel}>Calories (kcal):</Text>
              <TextInput
                style={styles.modalInput}
                value={formCalories}
                onChangeText={setFormCalories}
                keyboardType="numeric"
                placeholder="e.g. 350"
              />

              <Text style={styles.inputLabel}>Description (Optional):</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder="Briefly describe your food..."
                multiline
              />

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSaveFoodForm}><Text style={styles.modalSubmitBtnText}>CONFIRM & SAVE</Text></TouchableOpacity>
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
  dialogTitle: { fontSize: 17, fontWeight: '600', color: '#000', marginBottom: 15 },
  dialogInput: { width: '85%', height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10, marginBottom: 20, textAlign: 'center' },
  dialogActions: { flexDirection: 'row', borderTopWidth: 0.5, borderColor: '#eee', width: '100%' },
  dialogBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
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
  brandTitle: { fontSize: 26, fontWeight: 'bold', color: '#000', flex: 1 },
  cardBody: { width: '100%', marginBottom: 5 },
  welcomeText: { fontSize: 16, lineHeight: 24, color: '#000', textAlign: 'center' },
  welcomeInput: { fontSize: 16, lineHeight: 24, color: '#000', textAlign: 'center', padding: 10, minHeight: 80, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, backgroundColor: '#fafafa' },

  imageWrapper: {
    width: '100%',
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#000'
  },
  realSelectedImage: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#fafafa'
  },

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
  stockStepperContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#000', borderRadius: 15, height: 28, backgroundColor: '#fff', overflow: 'hidden', marginRight: 4 },
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
  modalContainer: { flex: 1, flexDirection: 'row' },
  sidebar: { width: Dimensions.get('window').width * 0.75, height: '100%', backgroundColor: '#fff', borderRightWidth: 2, borderRightColor: '#000', paddingTop: Platform.OS === 'ios' ? 40 : 25, zIndex: 10 },
  sidebarHeader: { paddingHorizontal: 15, paddingBottom: 10 },
  avatarSection: { alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1.5, borderBottomColor: '#000', marginBottom: 10 },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 1.5, borderColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 5, overflow: 'hidden' },
  sidebarAvatarImage: { width: '100%', height: '100%', borderRadius: 35 },
  avatarName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  sidebarItem: { width: '100%', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1.5, borderBottomColor: '#000', alignItems: 'center' },
  sidebarActiveItem: { backgroundColor: '#A9A9A9' },
  sidebarItemText: { fontSize: 22, color: '#000', fontWeight: 'normal' },
  sidebarFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1.5, borderTopColor: '#000', paddingVertical: 12, backgroundColor: '#fff' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 22, color: '#000', marginLeft: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
    fontWeight: '600'
  }
});

export { MenuScreen };
export default MenuScreen;