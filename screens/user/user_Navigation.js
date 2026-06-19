import React, { useState, useRef, useContext } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity, ScrollView,
    Platform, Dimensions, Alert, Animated, TouchableWithoutFeedback, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './HomeScreen';
import MenuScreen from './MenuScreen';
import OrderHistoryScreen from './OrderHistoryScreen';
import UserProfileScreen from './ProfileScreen';
import VendorMenuScreen from './VendorMenuScreen';

import { UserContext, UserProvider } from './UserContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = 260;

function MainLayout() {
    const [currentPage, setCurrentPage] = useState('Home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [checkoutData, setCheckoutData] = useState({ items: [], remarks: '' });

    const [selectedVendorData, setSelectedVendorData] = useState(null);

    const { profile } = useContext(UserContext);

    const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;

    const toggleSidebar = (open) => {
        setIsSidebarOpen(open);
        Animated.parallel([
            Animated.timing(sidebarAnim, {
                toValue: open ? 0 : -SIDEBAR_WIDTH,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(overlayAnim, {
                toValue: open ? 1 : 0,
                duration: 250,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleMenuClick = (moduleName) => {
        setCurrentPage(moduleName);
        toggleSidebar(false);
    };

    const handleLogout = () => {
        Alert.alert("Logout", "You have been logged out successfully.");
        toggleSidebar(false);
    };

    const renderMainContent = () => {
        const props = { onOpenMenu: () => toggleSidebar(true) };

        const renderHome = () => (
            <HomeScreen
                {...props}
                autoOpenCart={checkoutData.autoOpenCart}
                checkoutData={checkoutData}
                clearAutoOpenCart={() => setCheckoutData(prev => ({ ...prev, autoOpenCart: false }))}
                navigateToCheckout={(items, remarks) => {
                    setCheckoutData({ items, remarks, autoOpenCart: false });
                    setCurrentPage('Checkout');
                }}
                navigateToVendor={(vendorData) => {
                    setSelectedVendorData(vendorData);
                    setCurrentPage('VendorMenu');
                }}
            />
        );

        switch (currentPage) {
            case 'Home':
                return renderHome();

            case 'Menu':
                // 🌟 修复关键点：给 MenuScreen 也配上遥控器！
                return (
                    <MenuScreen
                        {...props}
                        navigateToVendor={(vendorData) => {
                            setSelectedVendorData(vendorData);
                            setCurrentPage('VendorMenu');
                        }}
                    />
                );

            case 'Order History':
                return <OrderHistoryScreen {...props} />;

            case 'Checkout':
                const CheckoutScreen = require('./CheckoutScreen').default;
                return (
                    <CheckoutScreen
                        route={{ params: { items: checkoutData.items, remarks: checkoutData.remarks } }}
                        navigation={{
                            goBack: () => {
                                setCheckoutData(prev => ({ ...prev, autoOpenCart: true }));
                                setCurrentPage('Home');
                            },
                            navigate: (pageName) => setCurrentPage(pageName)
                        }}
                    />
                );

            case 'VendorMenu':
                return (
                    <VendorMenuScreen
                        vendorData={selectedVendorData}
                        onBack={() => setCurrentPage('Menu')}
                        navigateToCheckout={(items, remarks) => {
                            setCheckoutData({ items, remarks, autoOpenCart: false });
                            setCurrentPage('Checkout');
                        }}
                    />
                );

            case 'Profile':
                return (
                    <View style={{ flex: 1, backgroundColor: '#fff' }}>
                        <View style={styles.tmpHeader}>
                            <TouchableOpacity style={styles.hamburgerBtn} onPress={() => toggleSidebar(true)}>
                                <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
                            </TouchableOpacity>
                            <Text style={styles.tmpHeaderTitle}>USER PROFILE</Text>
                            <View style={{ width: 40 }} />
                        </View>
                        <View style={styles.tmpDivider} />
                        <UserProfileScreen
                            {...props}
                            onProfileUpdate={() => {
                                console.log("Global refresh signal received from profile update.");
                            }}
                        />
                    </View>
                );

            case 'Reset Password':
                return (
                    <View style={{ flex: 1, backgroundColor: '#fff' }}>
                        <View style={styles.tmpHeader}>
                            <TouchableOpacity style={styles.hamburgerBtn} onPress={() => toggleSidebar(true)}>
                                <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
                            </TouchableOpacity>
                            <Text style={styles.tmpHeaderTitle}>{currentPage.toUpperCase()}</Text>
                            <View style={{ width: 40 }} />
                        </View>
                        <View style={styles.tmpDivider} />
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="construct-outline" size={64} color="#ccc" style={{ marginBottom: 15 }} />
                            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{currentPage} Page is coming soon...</Text>
                            <Text style={{ fontSize: 14, color: '#999', marginTop: 5 }}>
                                {'Click the top-left "<" button to go back.'}
                            </Text>
                        </View>
                    </View>
                );

            default:
                return renderHome();
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.mainContainer}>

                <Animated.View
                    style={[styles.overlayWrapper, { opacity: overlayAnim }]}
                    pointerEvents={isSidebarOpen ? 'auto' : 'none'}
                >
                    <TouchableWithoutFeedback onPress={() => toggleSidebar(false)}>
                        <View style={styles.overlayClickableArea} />
                    </TouchableWithoutFeedback>
                </Animated.View>

                <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
                    <View style={styles.sidebarHeader}>
                        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => toggleSidebar(false)}>
                            <View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.userSection}>
                        {profile?.avatar_url ? (
                            <Image
                                source={{ uri: profile.avatar_url }}
                                style={[styles.avatarCircle, { borderWidth: 0 }]}
                            />
                        ) : (
                            <View style={styles.avatarCircle}>
                                <View style={styles.avatarHead} />
                                <View style={styles.avatarBody} />
                            </View>
                        )}
                        <Text style={styles.username}>{profile?.full_name || 'Loading...'}</Text>
                    </View>

                    <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
                        <TouchableOpacity style={[styles.menuItem, currentPage === 'Home' && { backgroundColor: '#f0f0f0' }]} onPress={() => handleMenuClick('Home')}>
                            <Text style={styles.menuItemText}>Home</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, currentPage === 'Profile' && { backgroundColor: '#f0f0f0' }]} onPress={() => handleMenuClick('Profile')}>
                            <Text style={styles.menuItemText}>Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, currentPage === 'Menu' && { backgroundColor: '#f0f0f0' }]} onPress={() => handleMenuClick('Menu')}>
                            <Text style={styles.menuItemText}>Menu</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, currentPage === 'Order History' && { backgroundColor: '#f0f0f0' }]} onPress={() => handleMenuClick('Order History')}>
                            <Text style={styles.menuItemText}>Order History</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, currentPage === 'Reset Password' && { backgroundColor: '#f0f0f0' }]} onPress={() => handleMenuClick('Reset Password')}>
                            <Text style={styles.menuItemText}>Reset Password</Text>
                        </TouchableOpacity>
                        <View style={styles.menuListBottomLine} />
                    </ScrollView>

                    <TouchableOpacity style={styles.logoutBox} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color="#000" style={{ transform: [{ scaleX: -1 }] }} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.contentCanvas}>
                    {renderMainContent()}
                </View>

            </View>
        </SafeAreaView>
    );
}

export default function App() {
    return (
        <UserProvider>
            <MainLayout />
        </UserProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    mainContainer: { flex: 1, position: 'relative', overflow: 'hidden' },
    contentCanvas: { flex: 1, backgroundColor: '#fff' },
    hamburgerBtn: { width: 35, height: 30, justifyContent: 'space-around', alignItems: 'center', paddingVertical: 4 },
    hamburgerLine: { width: 20, height: 2, backgroundColor: '#000' },
    sidebar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: SIDEBAR_WIDTH, backgroundColor: '#ffffff', borderRightWidth: 2, borderColor: '#000000', zIndex: 100 },
    sidebarHeader: { height: 50, justifyContent: 'center', paddingLeft: 15 },
    userSection: { alignItems: 'center', paddingVertical: 15 },
    avatarCircle: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 5 },
    avatarHead: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#000', marginTop: 4 },
    avatarBody: { width: 34, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#000', marginBottom: -8 },
    username: { fontSize: 16, fontWeight: 'bold', color: '#000' },
    menuList: { flex: 1 },
    menuItem: { width: '100%', paddingVertical: 12, borderTopWidth: 1, borderColor: '#000', backgroundColor: '#fff' },
    menuItemText: { fontSize: 14, fontWeight: 'bold', textAlign: 'left', color: '#000', paddingLeft: 30 },
    menuListBottomLine: { width: '100%', borderTopWidth: 1, borderColor: '#000' },
    logoutBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderTopWidth: 2, borderBottomWidth: 2, borderColor: '#000000', backgroundColor: '#fff' },
    logoutText: { fontSize: 16, fontWeight: 'bold', color: '#070707', marginLeft: 8 },
    overlayWrapper: { position: 'absolute', top: 0, left: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 90 },
    overlayClickableArea: { flex: 1 },
    tmpHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    tmpHeaderTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
    tmpDivider: { height: 2, backgroundColor: '#000000', width: '100%' }
});