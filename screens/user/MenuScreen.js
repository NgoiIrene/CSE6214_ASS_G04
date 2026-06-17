import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MenuScreen({ onOpenMenu }) {
  // 🌟 完全拉回 11 个分类标签
  const tags = [
    { id: '0', name: 'All' }, { id: '1', name: 'Healthy' }, { id: '2', name: 'Nut-free' },
    { id: '3', name: 'Vegan' }, { id: '4', name: 'Fries' }, { id: '5', name: 'Rice' },
    { id: '6', name: 'Bread' }, { id: '10', name: 'Noodles' }, { id: '7', name: 'non-Spicy' },
    { id: '8', name: 'Beverage' }, { id: '9', name: 'Fast Food' }
  ];

  // 🌟 完全拉回 6 家完整的校园档口列表
  const vendors = [
    { id: '1', name: 'Korean House', rating: '4.7', cuisine: 'Korean food', image: 'https://img.magnific.com/premium-photo/assortment-korean-traditional-dishes-asian-food-top-view-generative-ai_21085-39489.jpg', tags: ['Healthy', 'Rice', 'Noodles', 'non-Spicy'] },
    { id: '2', name: 'Rasa Sedap', rating: '4.9', cuisine: 'Malaysian food', image: 'https://www.nasilemakbamboo.my/wp-content/uploads/2023/07/Nasi-Lemak-Ayam-Goreng-Compressed.jpg', tags: ['Rice', 'Noodles', 'Beverage'] },
    { id: '3', name: 'Haji Curry Restaurant', rating: '4.3', cuisine: 'Indian food', image: 'https://thumbs.dreamstime.com/b/traditional-roti-canai-curry-dhal-served-banana-leaf-delicious-authentic-serving-roti-canai-popular-400619434.jpg', tags: ['Bread', 'Rice', 'Noodles', 'Beverage', 'non-Spicy'] },
    { id: '4', name: 'Vege & Health', rating: '4.4', cuisine: 'Healthy food', image: 'https://static.vecteezy.com/system/resources/previews/035/327/993/large_2x/ai-generated-salad-with-grilled-chicken-egg-and-cherry-tomatoes-on-black-plate-photo.jpg', tags: ['Healthy', 'Vegan', 'non-Spicy', 'Bread'] },
    { id: '5', name: 'Burger Lover', rating: '4.6', cuisine: 'Fast food', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300', tags: ['Fast Food', 'Fries', 'Bread', 'non-Spicy', 'Beverage', 'Nut-free'] },
    { id: '6', name: 'Neko & Coffee', rating: '4.5', cuisine: 'Beverage', image: 'https://images.lifestyleasia.com/wp-content/uploads/sites/5/2023/03/07152920/283728712_305044915168177_39218947419656438_n-e1678091604513.jpeg', tags: ['non-Spicy', 'Beverage', 'Nut-free'] },
  ];

  const [selectedTag, setSelectedTag] = useState(null);
  const filteredVendors = selectedTag ? vendors.filter(vendor => vendor.tags.includes(selectedTag.name)) : vendors;

  const toggleTagSelection = (tag) => {
    if (tag.name === 'All') setSelectedTag(null);
    else if (selectedTag && selectedTag.id === tag.id) setSelectedTag(null);
    else setSelectedTag({ id: tag.id, name: tag.name });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={onOpenMenu}>
          <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MENU</Text>
        <View style={{ width: 35 }} />
      </View>

      <View style={styles.divider} />

      {/* 🌟 100% 还原原本的双行标签高精过滤样式 */}
      <View style={styles.tagsAreaContainer}>
        <View style={styles.tagRowWithFilter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScrollInline}>
            {tags.slice(0, 6).map((tag) => {
              const isSelected = (selectedTag === null && tag.name === 'All') || (selectedTag && selectedTag.id === tag.id);
              return (
                <TouchableOpacity key={tag.id} style={[styles.tagBadge, isSelected && styles.tagBadgeActive]} onPress={() => toggleTagSelection(tag)}>
                  <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.tagRowSecond}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScrollInline}>
            {tags.slice(6, 11).map((tag) => {
              const isSelected = selectedTag && selectedTag.id === tag.id;
              return (
                <TouchableOpacity key={tag.id} style={[styles.tagBadge, isSelected && styles.tagBadgeActive]} onPress={() => toggleTagSelection(tag)}>
                  <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.vendorScrollPadding}>
        {filteredVendors.length === 0 ? (
          <View style={styles.noDataContainer}><Text style={styles.noDataText}>No food vendor available for "{selectedTag?.name}"</Text></View>
        ) : (
          filteredVendors.map((vendor) => (
            <TouchableOpacity key={vendor.id} style={styles.vendorCard} activeOpacity={0.9} onPress={() => Alert.alert("Store Details", `Entering ${vendor.name}'s individual Menu...`)}>
              <Image source={{ uri: vendor.image }} style={styles.vendorImage} />
              <View style={styles.vendorInfoBox}>
                <Text style={styles.vendorNameText}>{vendor.name}</Text>
                <View style={styles.metaRatingRow}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingNumberText}>{vendor.rating}</Text>
                  <Text style={styles.cuisineTypeText}>{vendor.cuisine}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 12, paddingTop: 10, backgroundColor: '#ffffff', zIndex: 10 },
  hamburgerBtn: { width: 35, height: 30, justifyContent: 'space-around', alignItems: 'center', paddingVertical: 4 },
  hamburgerLine: { width: 20, height: 2, backgroundColor: '#000' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  divider: { height: 2, backgroundColor: '#000000', width: '100%' },
  tagsAreaContainer: { paddingVertical: 10, backgroundColor: '#ffffff' },
  tagRowWithFilter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  tagsScrollInline: { paddingRight: 10 },
  tagRowSecond: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 8, marginBottom: 2 },
  tagBadge: { paddingHorizontal: 14, paddingVertical: 5, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#000000', borderRadius: 8, marginRight: 8 },
  tagBadgeActive: { backgroundColor: '#f0f0f0' },
  tagText: { fontSize: 13, fontWeight: '700', color: '#000000' },
  tagTextActive: { color: '#000000', textDecorationLine: 'underline' },
  vendorScrollPadding: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 20 },
  vendorCard: { flexDirection: 'row', width: '100%', marginBottom: 16, height: 105, alignItems: 'center' },
  vendorImage: { width: 105, height: 105, borderRadius: 12, borderWidth: 1.5, borderColor: '#000000', resizeMode: 'cover' },
  vendorInfoBox: { flex: 1, height: 90, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#000000', borderLeftWidth: 0, borderTopRightRadius: 4, borderBottomRightRadius: 4, paddingHorizontal: 12, justifyContent: 'center' },
  vendorNameText: { fontSize: 18, fontWeight: 'bold', color: '#000000', marginBottom: 6 },
  metaRatingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingNumberText: { fontSize: 14, fontWeight: 'bold', color: '#000000', marginLeft: 4, marginRight: 12 },
  cuisineTypeText: { fontSize: 14, fontWeight: 'bold', color: '#000000' },
  noDataContainer: { width: '100%', paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  noDataText: { fontSize: 14, fontWeight: '700', color: '#7f7f7f', textAlign: 'center' }
});