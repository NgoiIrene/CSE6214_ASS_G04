import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
    StatusBar,
    Platform,
    SafeAreaView,
    ActivityIndicator,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient'; // 确保路径正确

export default function OrderTrackingDeliveryScreen({ route, navigation }) {
    // 🌟 新增：从 route 获取传入的 orderNumber
    const { orderNumber } = route?.params || {};
    const orderId = orderNumber;
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    // 🌟 新增：读取数据库逻辑
    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderNumber) {
                setLoading(false);
                return;
            }

            try {
                // 1. 先查订单本身 (不要在这里连表，防止 rider_id 为 null 导致的查询错误)
                const { data: orderResult, error: orderError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('order_number', orderNumber)
                    .single();

                if (orderError) throw orderError;

                // 2. 独立查询：拿到 orderResult 后，如果有 rider_id，去查骑手
                if (orderResult && orderResult.rider_id) {
                    const { data: riderProfile, error: riderError } = await supabase
                        .from('profiles')
                        .select('full_name, avatar_url')
                        .eq('id', orderResult.rider_id)
                        .single();

                    if (riderProfile) {
                        // 🌟 将查到的骑手信息直接拼接到订单数据里
                        orderResult.profiles = riderProfile;
                    }
                }
                setOrderData(orderResult);

            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false); // 🌟 无论成功失败，必须关掉 Loading，否则屏幕永远转圈
            }
        };
        fetchOrderDetails();
    }, [orderNumber]);

    const [currentStatusLevel, setCurrentStatusLevel] = useState(1);
    const [countdown, setCountdown] = useState(30);
    const [isCancelDisabled, setIsCancelDisabled] = useState(false);

    // 🌟 1. ETA 的 State
    const [eta, setEta] = useState('Calculating...');

    // 🌟 新增：防止 ETA 超时警告重复弹出的控制开关
    const [hasAlertedDelay, setHasAlertedDelay] = useState(false);

    const isUserCancellingRef = useRef(false);

    // 🌟 2. 动态计算 ETA (下单时间 + 30秒宽限期 + 30分钟准备时间)
    useEffect(() => {
        if (orderData?.created_at) {
            // 将数据库的 created_at 转为日期对象
            const createdAt = new Date(orderData.created_at);

            // 计算 ETA: 下单时间 + 35.5分钟 (30s 宽限期 + 35min 准备)
            const etaTime = new Date(createdAt.getTime() + (35.5 * 60 * 1000));

            // 格式化为 HH:MM AM/PM
            const timeString = etaTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            setEta(timeString);
        }
    }, [orderData]); // 只要 orderData 一拿到，立刻计算

    // 🌟 3. 实时轮询逻辑 (用于更新状态)
    useEffect(() => {
        if (!orderData?.order_number) return;

        const statusSync = setInterval(async () => {
            // 🌟 1. 加上 rider_id 的查询
            const { data } = await supabase
                .from('orders')
                .select('status, created_at, rider_id')
                .eq('order_number', orderData.order_number)
                .single();

            if (data) {
                // 🌟 2. 核心修复：如果数据库里有了 rider_id，且当前 state 里没有，就立刻去查头像名字！
                if (data.rider_id && (!orderData.rider_id || data.rider_id !== orderData.rider_id)) {
                    const { data: riderProfile } = await supabase
                        .from('profiles')
                        .select('full_name, avatar_url')
                        .eq('id', data.rider_id)
                        .single();

                    // 把查到的骑手信息，动态更新到页面的 orderData 里，UI 就会立刻显示！
                    setOrderData(prev => ({
                        ...prev,
                        rider_id: data.rider_id,
                        profiles: riderProfile
                    }));
                }

                const currentStatus = data.status;

                // 🔴 如果订单被拒绝
                if (currentStatus === 'rejected') {
                    clearInterval(statusSync); // 停止轮询
                    // 👇 🌟 修改：如果是用户自己取消的，就不弹 Vendor Rejected 的警告！ 👇
                    if (!isUserCancellingRef.current) {
                        Alert.alert("Order Rejected", "Vendor rejected the order.", [
                            { text: "OK", onPress: () => navigation.navigate('Home') }
                        ]);
                    }
                }

                // 🟢 5. Delivered
                else if (currentStatus === 'completed') {

                    // 🌟 加固：先停止轮询，防止在弹窗期间再次触发状态更新
                    clearInterval(statusSync);

                    setCurrentStatusLevel(7);

                    // 🌟 新增：订单完成弹窗
                    Alert.alert(
                        "Order Completed",
                        "Enjoy Your Meal! Order is successfully delivered.",
                        [{ text: "OK", onPress: () => navigation.navigate('Home') }]
                    );
                }
                // 🟢 4. Out for Delivery
                else if (currentStatus === 'otw_delivery') {
                    setCurrentStatusLevel(6);
                }
                // 🟢 3. Picked up by Delivery Man
                else if (currentStatus === 'pickup_rider') {
                    setCurrentStatusLevel(5);
                }
                // 🟢 2. Accepted by Delivery Man
                else if (currentStatus === 'accepted_by_rider') {
                    setCurrentStatusLevel(4);
                }
                // 🟢 1. Accepted by Vendor & Preparing (Level 2 和 3 一起亮起)
                else if (currentStatus === 'pending_rider') {
                    setCurrentStatusLevel(3);
                }
                // 🟡 还在 pending 状态 (Vendor 还没接单)
                else if (currentStatus === 'pending_vendor') {
                    setCurrentStatusLevel(1);

                    // 🌟 检查时间：如果迟迟没有变成 pending_rider，对比当前时间与 ETA
                    const createdAt = new Date(data.created_at).getTime();
                    const etaTime = createdAt + (30.5 * 60 * 1000); // 下单时间 + 30分30秒

                    // 如果当前时间已经超过了 ETA，并且还没弹过窗
                    if (Date.now() > etaTime && !hasAlertedDelay) {
                        setHasAlertedDelay(true); // 锁上开关，避免无限弹窗
                        Alert.alert(
                            "Order Delayed",
                            "The vendor is taking longer than expected. Please be patient or contact the vendor."
                        );
                    }
                }
            }
        }, 5000); // 每 5 秒查一次

        return () => clearInterval(statusSync);
    }, [orderData, hasAlertedDelay]); // 🌟 确保依赖项更新

    // ... (后续 useEffect, handleCancelOrder, renderStep 代码保持完全不变) ...
    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (countdown === 0 && !isCancelDisabled) { // 🌟 加入这个条件，确保只执行一次
            setIsCancelDisabled(true);
            finalizeOrder();
        }
    }, [countdown]);

    // 🌟 然后在下方添加这个新函数：
    const finalizeOrder = async () => {
        if (!orderNumber) return;
        const { error } = await supabase
            .from('orders')
            .update({ status: 'pending_vendor' }) // 商家此时才能查到此订单
            .eq('order_number', orderNumber);

        if (error) console.error("Finalize order error:", error);
        else console.log("Order officially sent to vendor!");
    };

    const handleCancelOrder = () => {
        Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
            { text: "No", style: "cancel" },
            {
                text: "Yes",
                onPress: async () => {
                    try {

                        isUserCancellingRef.current = true;

                        // 1. 拦截倒计时和状态提交
                        setIsCancelDisabled(true);

                        // 2. 把订单状态改成 rejected
                        const { error: cancelError } = await supabase
                            .from('orders')
                            .update({ status: 'cancelled' })
                            .eq('order_number', orderNumber);

                        if (cancelError) throw cancelError;

                        // 3. 执行退款：把钱加回用户的钱包
                        if (orderData && orderData.total_price) {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                                // 先查目前的余额
                                const { data: walletData } = await supabase
                                    .from('wallets')
                                    .select('balance')
                                    .eq('user_id', user.id)
                                    .single();

                                // 加上这笔订单的钱，更新回去
                                if (walletData) {
                                    const newBalance = walletData.balance + orderData.total_price;
                                    await supabase
                                        .from('wallets')
                                        .update({ balance: newBalance })
                                        .eq('user_id', user.id);
                                }
                            }
                        }

                        // 4. 成功提示并返回主页
                        Alert.alert("Order Cancelled", "Your order has been cancelled and the amount has been refunded to your wallet.", [
                            { text: "OK", onPress: () => navigation.navigate('Home') }
                        ]);

                    } catch (error) {
                        Alert.alert("Cancel Failed", error.message);
                        setIsCancelDisabled(false); // 失败的话恢复按钮
                    }
                }
            }
        ]);
    };

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

    if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

    const orderDate = orderData?.created_at ? new Date(orderData.created_at).toLocaleDateString() : "N/A";
    const vendorName = "Vendor";
    const deliveryBuilding = orderData?.delivery_building || "N/A";

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}><Ionicons name="chevron-back" size={26} color="#000" /></TouchableOpacity>
                <Text style={styles.headerTitle}>Order Tracking</Text>
                <View style={{ width: 30 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* 1. ORDER INFO CARD (已连接数据库数据) */}
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
                    {renderStep(2, "Accepted by Vendor", "Vendor has accepted your order.")}
                    {renderStep(3, "Preparing", "Vendor is preparing your meal.")}
                    {renderStep(4, "Accepted by Delivery Man", "Your delivery man is ready.")}
                    {renderStep(5, "Picked up by Delivery Man", "Your order is picked up by delivery man.")}
                    {renderStep(6, "Out for Delivery", "Your order is delivering now.")}
                    {renderStep(7, "Delivered", "Your order is delivered.")}
                </View>

                {/* 3. CANCEL & NOTE ... (其余 UI 部分保持完全不变) ... */}
                <View style={styles.cancelSection}>
                    <TouchableOpacity style={[styles.cancelBtn, isCancelDisabled && styles.btnDisabled]} disabled={isCancelDisabled} onPress={handleCancelOrder}>
                        <Text style={styles.cancelBtnText}>{isCancelDisabled ? "Cannot Cancel" : `Cancel Order (${countdown}s)`}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.noteBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><Ionicons name="warning-outline" size={18} color="#000" /><Text style={styles.noteTitle}> Note!</Text></View>
                    <Text style={styles.noteSubTitle}>Grace Period Active:</Text>
                    <Text style={styles.noteDesc}>You have 30s Remaining to cancel order</Text>
                    <Text style={styles.noteSubTitle}>Order Preparing:</Text>
                    <Text style={styles.noteDesc}>Your order will be accepted by Vendor AFTER the 30s grace period</Text>
                </View>

                {/* 4. DELIVERY MAN DETAILS */}
                {currentStatusLevel >= 4 && (
                    <View style={styles.deliveryManCard}>
                        <Text style={styles.deliveryManTitle}>Delivery Man Details</Text>
                        <View style={styles.infoDivider} />
                        <View style={styles.deliveryManRow}>
                            {/* 🌟 智能判断：有头像链接，并且【不是】本地 file:// 开头的，才显示真实图片 */}
                            {orderData?.profiles?.avatar_url && !orderData.profiles.avatar_url.startsWith('file://') && !imageError ? (
                                <Image
                                    source={{ uri: orderData.profiles.avatar_url }}
                                    style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }}
                                    // 👇 🌟 核心绝招：只要图片打不开（白屏），立马把错误开关打开！
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <Ionicons name="person-circle-outline" size={50} color="#000" style={{ marginRight: 12 }} />
                            )}
                            <View>
                                <Text style={styles.deliveryManName}>
                                    {orderData?.profiles?.full_name || "Delivery Rider"}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
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