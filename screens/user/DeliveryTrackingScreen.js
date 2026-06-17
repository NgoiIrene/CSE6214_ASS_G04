import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
    StatusBar,
    Platform,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OrderTrackingDeliveryScreen({ route, navigation }) {
    // 接收参数：加入了 Delivery 专属的 ETA、Building 和 外卖员信息
    const {
        orderId = "ORD-210626",
        orderDate = "14 JUN 26",
        eta = "09:20 AM",
        vendorName = "Rasa Sedap",
        deliveryBuilding = "Hostel HB 3 & 4",
        deliveryManName = "Mohd Adam bin Mat",
        deliveryManPhone = "+6016221XXXX"
    } = route?.params || {};

    // Delivery 的阶段从 1 到 7
    const [currentStatusLevel, setCurrentStatusLevel] = useState(1);
    const [countdown, setCountdown] = useState(30);
    const [isCancelDisabled, setIsCancelDisabled] = useState(false);

    // 1. 30秒取消倒计时
    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else {
            setIsCancelDisabled(true);
        }
    }, [countdown]);

    // 2. 模拟监听后端状态
    useEffect(() => {
        const statusSync = setInterval(() => {
            console.log("Syncing with database to check the next stage...");
        }, 5000);
        return () => clearInterval(statusSync);
    }, [currentStatusLevel]);

    const handleCancelOrder = () => {
        Alert.alert("Cancel Order", "Are you sure to cancel order?", [
            { text: "No", style: "cancel" },
            {
                text: "Yes", onPress: () => {
                    Alert.alert("Order Cancelled", "Dear customer, order is successfully cancelled, please wait for 3 working days for refund.",
                        [{ text: "OK", onPress: () => navigation.navigate('Home') }]);
                }
            }
        ]);
    };

    // 渲染状态步骤条
    const renderStep = (level, title, description) => {
        const isActive = currentStatusLevel >= level;
        const isLineActive = currentStatusLevel > level;
        return (
            <View style={styles.stepRow} key={level}>
                <View style={styles.stepIndicatorColumn}>
                    <View style={[styles.statusCircle, isActive ? styles.circleActive : styles.circleInactive]}>
                        {isActive && <Ionicons name="checkmark" size={18} color="#fff" />}
                    </View>
                    {level < 7 && <View style={[styles.stepLine, isLineActive ? styles.lineActive : styles.lineInactive]} />}
                </View>
                <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, isActive ? styles.textActive : styles.textInactive]}>{title}</Text>
                    <Text style={styles.stepDesc}>{description}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={26} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Tracking</Text>
                <View style={{ width: 30 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* 1. ORDER INFO CARD */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>Order Details</Text>
                    <View style={styles.infoDivider} />

                    <Text style={styles.infoText}><Text style={styles.boldText}>Order ID:</Text> {orderId}</Text>
                    <Text style={styles.infoText}><Text style={styles.boldText}>Date:</Text> {orderDate}</Text>
                    <Text style={styles.infoText}><Text style={styles.boldText}>Shop Name:</Text> {vendorName}</Text>
                    <Text style={styles.infoText}><Text style={styles.boldText}>Campus Delivery Building:</Text> {deliveryBuilding}</Text>
                    <Text style={styles.infoText}><Text style={styles.boldText}>Estimated Time of Arrival (ETA):</Text> {eta}</Text>
                </View>

                {/* 2. ORDER PROGRESS */}
                <View style={styles.trackingCard}>
                    {renderStep(1, "Order Placed", "Your order has been received.")}
                    {renderStep(3, "Accepted by Delivery Man", "Your delivery man is ready.")}
                    {renderStep(4, "Preparing", "Vendor is preparing your meal.")}
                    {renderStep(5, "Picked up by Delivery Man", "Your order is picked up by delivery man.")}
                    {renderStep(6, "Out for Delivery", "Your order is delivering now.")}
                    {renderStep(7, "Delivered", "Your order is delivered.")}
                </View>

                {/* 3. CANCEL BUTTON & NOTE (✅ 已经按照图片一完全重写了黑色长条按钮结构) */}
                <View style={styles.cancelSection}>
                    <TouchableOpacity
                        style={[styles.cancelBtn, isCancelDisabled && styles.btnDisabled]}
                        disabled={isCancelDisabled}
                        activeOpacity={0.7}
                        onPress={handleCancelOrder}
                    >
                        <Text style={styles.cancelBtnText}>
                            {isCancelDisabled ? "Cannot Cancel" : `Cancel Order (${countdown}s)`}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Note 提示框 */}
                <View style={styles.noteBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Ionicons name="warning-outline" size={18} color="#000" />
                        <Text style={styles.noteTitle}> Note!</Text>
                    </View>
                    <Text style={styles.noteSubTitle}>Grace Period Active:</Text>
                    <Text style={styles.noteDesc}>You have 30s Remaining to cancel order</Text>
                    <Text style={styles.noteSubTitle}>Order Preparing:</Text>
                    <Text style={styles.noteDesc}>Your order will be accepted by Vendor AFTER the 30s grace period</Text>
                </View>

                {/* 4. DELIVERY MAN DETAILS */}
                <View style={styles.deliveryManCard}>
                    <Text style={styles.deliveryManTitle}>Delivery Man Details</Text>
                    <View style={styles.infoDivider} />

                    <View style={styles.deliveryManRow}>
                        <Ionicons name="person-circle-outline" size={50} color="#000" style={{ marginRight: 12 }} />
                        <View>
                            <Text style={styles.deliveryManName}>{deliveryManName}</Text>
                            <Text style={styles.deliveryManPhone}>Phone no: {deliveryManPhone}</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        paddingBottom: 48
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 2,
        borderColor: '#000000'
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
    scrollContent: { padding: 16, paddingBottom: 120 },

    infoCard: { backgroundColor: '#fff', padding: 16, borderWidth: 1, borderColor: '#000', borderRadius: 12, marginBottom: 16, elevation: 1 },
    infoCardTitle: { fontSize: 15, fontWeight: '800', color: '#000' },
    infoDivider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 10 },
    infoText: { fontSize: 13, color: '#333', marginBottom: 6, lineHeight: 20 },
    boldText: { fontWeight: '700', color: '#000' },

    trackingCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 16,
        elevation: 1,
        marginBottom: 20
    },
    trackingTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 20 },

    stepRow: { flexDirection: 'row', minHeight: 75 },
    stepIndicatorColumn: { alignItems: 'center', marginRight: 16, width: 28 },

    statusCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    circleActive: { backgroundColor: '#437A40' },
    circleInactive: { borderWidth: 2.5, borderColor: '#D3D3D3', backgroundColor: '#FFF' },

    stepLine: { width: 3, flex: 1, marginVertical: 2 },
    lineActive: { backgroundColor: '#437A40' },
    lineInactive: { backgroundColor: '#E0E0E0' },

    stepContent: { flex: 1, paddingTop: 2, paddingBottom: 15 },
    stepTitle: { fontSize: 16, fontWeight: '700' },
    stepDesc: { fontSize: 14, color: '#888', marginTop: 4 },

    textActive: { color: '#437A40' },
    textInactive: { color: '#888' },

    // ✅ 已经针对图片一进行了全包围样式升级：改成和 Pickup 一致的黑色两端带圆角长条长按钮
    cancelSection: {
        width: '100%',
        marginBottom: 16
    },
    cancelBtn: {
        backgroundColor: '#000000',
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },
    cancelBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700'
    },
    btnDisabled: {
        backgroundColor: '#E0E0E0'
    },

    noteBox: { marginBottom: 22, paddingHorizontal: 5 },
    noteTitle: { fontSize: 18, fontWeight: '800', color: '#000' },
    noteSubTitle: { fontSize: 13, fontWeight: '700', color: '#000', marginTop: 6 },
    noteDesc: { fontSize: 13, color: '#444', marginTop: 2 },

    deliveryManCard: { backgroundColor: '#fff', padding: 16, borderWidth: 1, borderColor: '#000', borderRadius: 12, marginBottom: 10 },
    deliveryManTitle: { fontSize: 15, fontWeight: '800', color: '#000' },
    deliveryManRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    deliveryManName: { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 2 },
    deliveryManPhone: { fontSize: 13, color: '#555' }
});