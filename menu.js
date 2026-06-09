import React, { useState } from 'react';
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
  Image, // 🌟 用于渲染用户从相册选出的真实照片
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// 🌟 引入 Expo 官方相册选择器
import * as ImagePicker from 'expo-image-picker';

export default function MenuScreen() {
  // 🌟 状态控制 1：控制当前是 'view'（浏览模式）还是 'edit'（编辑模式）
  const [mode, setMode] = useState('view'); 

  // 🌟 状态控制 2：当前选中的顶部分类标签
  const [activeTab, setActiveTab] = useState('ANNOUNCEMENT');
  const tabs = ['ANNOUNCEMENT', 'RICE', 'NOODLE', 'DRINK', 'COMBO'];

  // 🌟 状态控制 3：公告的欢迎文本内容
  const [welcomeText, setWelcomeText] = useState(
    'Welcome to Rasa Syiok . Hope you have a nice day and rasa syioknya'
  );
  
  // 🌟 状态控制 4：存储用户选择的图片本地真实路径（null 表示没有选择图片）
  const [imageUri, setImageUri] = useState(null);

  // 🌟 状态控制 5：动态存储图片的宽高比（拒绝固定高度，让图片完美自适应）
  const [imageAspectRatio, setImageAspectRatio] = useState(1); 

  // 📸 核心功能：打开手机相册选择任意比例的图片
  const handleInsertImage = async () => {
    // 1. 询问用户是否允许访问相册权限
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "You need to allow library access to select a photo!");
      return;
    }

    // 2. 打开相册选择一张完整图片
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // 只能选图片
      allowsEditing: false, // 🌟 关闭强行裁剪，保留图片原本的完整形状
      quality: 1,           // 1 为最高清晰度
    });

    // 3. 如果用户没有取消选择，动态计算图片的宽高比并更新状态
    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      
      // 🌟 动态获取图片的真实尺寸并计算比例
      Image.getSize(selectedUri, (width, height) => {
        const ratio = width / height; // 计算 宽/高 比例
        setImageAspectRatio(ratio);   // 存入比例状态
        setImageUri(selectedUri);     // 成功拿到比例后再显示图片，防止画面闪烁变形
      }, (error) => {
        console.error("Failed to get image size", error);
        setImageAspectRatio(4 / 3);   // 失败时的保底安全比例
        setImageUri(selectedUri);
      });
    }
  };

  // 🗑️ 核心功能：删除已选图片
  const handleDeleteImage = () => {
    if (!imageUri) {
      Alert.alert("Notice", "There is no image to delete.");
      return;
    }
    Alert.alert(
      "Delete Image",
      "Are you sure you want to delete this image?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          onPress: () => setImageUri(null), // 擦除图片路径，卡片会自动收缩回去
          style: "destructive" 
        }
      ]
    );
  };

  // 💾 保存按钮触发
  const handleSave = () => {
    setMode('view'); // 切换回普通的浏览模式
    Alert.alert("Saved", "Announcement updated successfully!");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* ==================== 1. 顶部导航栏 ==================== */}
      <View style={styles.header}>
        {mode === 'view' ? (
          // 浏览模式：显示侧边栏三道杠菜单键
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="menu-outline" size={28} color="#000" />
          </TouchableOpacity>
        ) : (
          // 编辑模式：显示返回键，点击可以返回浏览模式
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setMode('view')}>
            <Ionicons name="arrow-back-circle-outline" size={32} color="#000" />
          </TouchableOpacity>
        )}
        
        <Text style={styles.headerTitle}>Menu</Text>
        
        {mode === 'view' ? (
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="create-outline" size={26} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 42 }} />
        )}
      </View>

      {/* ==================== 2. 横向分类标签栏 ==================== */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
          {tabs.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.divider} />

      {/* ==================== 3. 键盘避让与表单区域 ==================== */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 30} // 确保输入时卡片和图片能被顶起来，不被键盘挡住
      >
        
        {/* 编辑模式特有的工具栏 (垃圾桶、相册、SAVE) */}
        {mode === 'edit' && (
          <View style={styles.toolbarContainer}>
            <View style={styles.leftTools}>
              {/* 删除按钮 */}
              <TouchableOpacity style={styles.toolIconBtn} onPress={handleDeleteImage}>
                <Ionicons name="trash-outline" size={24} color="#000" />
              </TouchableOpacity>
              {/* 导入真实相册按钮 */}
              <TouchableOpacity style={styles.toolIconBtn} onPress={handleInsertImage}>
                <Ionicons name="image-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* 保存按钮（颜色与你第一份代码的胶囊登录按钮保持色系一致） */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. 卡片滑动主体 */}
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {activeTab === 'ANNOUNCEMENT' && (
            <View style={styles.welcomeCard}>
              
              {/* 🌟 优化：edit 按钮改成了精致沉稳的暗灰色下划线风格，不再使用红圈红字 */}
              {mode === 'view' && (
                <TouchableOpacity style={styles.cardEditBtn} onPress={() => setMode('edit')}>
                  <Text style={styles.cardEditText}>edit</Text>
                </TouchableOpacity>
              )}

              {/* 卡片头部：头像与店名 */}
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle-outline" size={60} color="#333" style={styles.avatarIcon} />
                <Text style={styles.brandTitle}>Rasa Syiok</Text>
              </View>

              {/* 卡片中部：公告文字展示 / 文本输入 */}
              <View style={styles.cardBody}>
                {mode === 'view' ? (
                  <Text style={styles.welcomeText}>{welcomeText}</Text>
                ) : (
                  <TextInput
                    style={styles.welcomeInput}
                    multiline={true}
                    value={welcomeText}
                    onChangeText={setWelcomeText}
                    placeholder="Type your welcome message..."
                    placeholderTextColor="#bbb"
                    autoFocus={true} // 自动聚焦弹键盘
                  />
                )}
              </View>

              {/* 🌟 核心改进：真正的图片渲染，完全不限制宽高尺寸，实现完美自适应 */}
              {imageUri && (
                <View style={styles.imageWrapper}>
                  <Image 
                    source={{ uri: imageUri }} 
                    style={[
                      styles.realSelectedImage, 
                      { aspectRatio: imageAspectRatio } // 🌟 动态注入计算出的图片比例
                    ]} 
                    resizeMode="contain" // 确保任何怪异比例的图都能完整显示不被裁剪
                  />
                </View>
              )}

            </View>
          )}

          {activeTab !== 'ANNOUNCEMENT' && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{activeTab} Coming Soon...</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

// 🎨 精致统一的样式表
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 10,
    paddingTop: Platform.OS === 'ios' ? 15 : 35,
  },
  headerIconBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
  },
  tabBarContainer: {
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  tabBarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderColor: '#000',
    minWidth: 80,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#A9A9A9', 
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  tabTextActive: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    width: '100%',
  },
  keyboardAvoid: {
    flex: 1,
  },
  toolbarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginTop: 15,
    width: '100%',
  },
  leftTools: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolIconBtn: {
    marginRight: 15,
    padding: 5,
  },
  saveButton: {
    backgroundColor: '#A9A9A9', // 经典高级灰色
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 40, // 底部留出缓冲带，方便滚动避让键盘
    alignItems: 'center',
  },
  welcomeCard: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#fff',
    position: 'relative',
  },
  cardEditBtn: {
    position: 'absolute',
    top: 15,
    right: 20,
  },
  cardEditText: {
    fontSize: 13,
    color: '#555', // 抛弃突兀的红色，采用低调高级的灰色
    textDecorationLine: 'underline', // 保持精细的下划线可点击感
    fontWeight: '500',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarIcon: {
    marginRight: 12,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  cardBody: {
    width: '100%',
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
    textAlign: 'center',
  },
  welcomeInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
    textAlign: 'center',
    padding: 10,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    backgroundColor: '#fafafa', // 背景浅灰，高级感十足
  },
  imageWrapper: {
    width: '100%',
    marginTop: 15,
    alignItems: 'center',
  },
  // 🌟 自适应的核心样式：去掉了固定的高度 height 属性！
  realSelectedImage: {
    width: '100%',         // 宽度固定撑满卡片内壁
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#000',   // 复刻原型的黑框线条感
    backgroundColor: '#fafafa',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  }
});