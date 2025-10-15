import React, { useState, useEffect, useRef } from 'react';
import useTranslation from '../hooks/useTranslation.js';

function OrdersApp() {
    const { t, language } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedCall, setSelectedCall] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState('');
    
    // Önceki siparişleri takip et
    const previousOrdersRef = useRef([]);
    const previousCallsRef = useRef([]);
    const isInitialLoadRef = useRef(true); // İlk yükleme flag'i
    
    // Ses için AudioContext oluştur
    const [audioContext] = useState(() => {
        return new (window.AudioContext || window.webkitAudioContext)();
    });

    useEffect(() => {
        fetchOrders();
        fetchCalls();
        
        // İlk yükleme tamamlandı, artık bildirimleri göster
        const initTimer = setTimeout(() => {
            isInitialLoadRef.current = false;
        }, 2000);
        
        const ordersInterval = setInterval(fetchOrders, 5000);
        const callsInterval = setInterval(fetchCalls, 5000);
        
        return () => {
            clearTimeout(initTimer);
            clearInterval(ordersInterval);
            clearInterval(callsInterval);
        };
    }, []);

    // Audio unlock - İlk tıklamada AudioContext'i unlock et
    useEffect(() => {
        const unlockAudio = () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        };
        
        document.addEventListener('click', unlockAudio, { once: true });
        document.addEventListener('touchstart', unlockAudio, { once: true });
        
        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };
    }, [audioContext]);

    const fetchOrders = async () => {
        try {
            const formData = new FormData();
            formData.append('action', 'rms_get_orders');
            formData.append('nonce', rmsAdmin.nonce);

            const response = await fetch(rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                const newOrders = data.data;
                const oldOrders = previousOrdersRef.current;
                
                // İlk yükleme değilse ve yeni pending siparişler varsa bildirim gönder
                if (!isInitialLoadRef.current && oldOrders.length > 0) {
                    const newPendingOrders = newOrders.filter(newOrder => 
                        newOrder.status === 'pending' && 
                        !oldOrders.some(oldOrder => oldOrder.id === newOrder.id)
                    );
                    
                    if (newPendingOrders.length > 0) {
                        playNotificationSound();
                        showNotification(newPendingOrders.length);
                    }
                }
                
                // Önceki siparişleri güncelle
                previousOrdersRef.current = newOrders;
                setOrders(newOrders);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        }
    };

    const fetchCalls = async () => {
        try {
            const formData = new FormData();
            formData.append('action', 'rms_get_calls');
            formData.append('nonce', rmsAdmin.nonce);

            const response = await fetch(rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                const newCalls = data.data;
                const oldCalls = previousCallsRef.current;
                
                // İlk yükleme değilse ve yeni call varsa bildirim gönder
                if (!isInitialLoadRef.current && newCalls.length > oldCalls.length) {
                    playWaiterCallSound();
                    showWaiterCallNotification(newCalls[0].table_number);
                }
                
                previousCallsRef.current = newCalls;
                setCalls(newCalls);
            }
        } catch (error) {
            console.error('Error fetching calls:', error);
        }
    };

    const resolveCall = async (callId) => {
        try {
            const formData = new FormData();
            formData.append('action', 'rms_resolve_call');
            formData.append('nonce', rmsAdmin.nonce);
            formData.append('id', callId);

            const response = await fetch(rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                fetchCalls();
            }
        } catch (error) {
            console.error('Error resolving call:', error);
        }
    };

    const assignOrderToTable = async () => {
        if (!selectedOrder || !selectedCall) {
            alert('Please select an order');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'rms_assign_order_to_table');
            formData.append('nonce', rmsAdmin.nonce);
            formData.append('order_id', selectedOrder);
            formData.append('table_number', selectedCall.table_number);

            const response = await fetch(rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                alert(`Order #${selectedOrder} assigned to Table ${selectedCall.table_number}!`);
                setShowAssignModal(false);
                setSelectedOrder('');
                setSelectedCall(null);
                fetchOrders();
                resolveCall(selectedCall.id);
            }
        } catch (error) {
            console.error('Error assigning order:', error);
        }
    };

    const playNotificationSound = () => {
        try {
            // Beep sesi üret (440Hz, 0.2 saniye)
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800; // Yüksek pitch
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.error('❌ Sound error:', error);
        }
    };

    const playWaiterCallSound = () => {
        try {
            // Çift beep sesi
            const playBeep = (frequency, startTime, duration) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.5, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };
            
            const now = audioContext.currentTime;
            playBeep(880, now, 0.15);
            playBeep(880, now + 0.2, 0.15);
            playBeep(880, now + 0.4, 0.15);
        } catch (error) {
            console.error('❌ Waiter call error:', error);
        }
    };

    const showNotification = (count) => {
        const notificationDiv = document.createElement('div');
        notificationDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #FF6B35 0%, #FF8A5C 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            box-shadow: 0 8px 24px rgba(255, 107, 53, 0.4);
            z-index: 10000;
            font-size: 16px;
            font-weight: 700;
            animation: slideInRight 0.5s ease-out, pulse 2s infinite;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 350px;
        `;
        
        notificationDiv.innerHTML = `
            <span style="font-size: 28px;">🔔</span>
            <div>
                <div style="font-size: 18px; margin-bottom: 4px;">
                    ${count} ${t('orders.pending')} ${t('orders.order')}!
                </div>
                <div style="font-size: 13px; opacity: 0.9;">
                    ${t('orders.start_preparing')}
                </div>
            </div>
        `;
        
        document.body.appendChild(notificationDiv);
        
        setTimeout(() => {
            notificationDiv.style.animation = 'slideInRight 0.5s ease-out reverse';
            setTimeout(() => notificationDiv.remove(), 500);
        }, 5000);
    };

    const showWaiterCallNotification = (tableNumber) => {
        const notificationDiv = document.createElement('div');
        notificationDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%);
            color: white;
            padding: 25px 35px;
            border-radius: 15px;
            box-shadow: 0 8px 24px rgba(231, 76, 60, 0.5);
            z-index: 10000;
            font-size: 18px;
            font-weight: 700;
            animation: shake 0.5s ease-in-out, pulse 2s infinite;
            display: flex;
            align-items: center;
            gap: 15px;
        `;
        
        notificationDiv.innerHTML = `
            <span style="font-size: 36px; animation: ring 1s ease-in-out infinite;">🔔</span>
            <div>
                <div style="font-size: 20px; margin-bottom: 5px;">
                    Table ${tableNumber} is calling!
                </div>
                <div style="font-size: 14px; opacity: 0.9;">
                    Customer needs assistance
                </div>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
            @keyframes ring {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-15deg); }
                75% { transform: rotate(15deg); }
            }
            @keyframes slideInRight {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notificationDiv);
        
        setTimeout(() => {
            notificationDiv.style.animation = 'slideInRight 0.5s ease-out reverse';
            setTimeout(() => notificationDiv.remove(), 500);
        }, 7000);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const formData = new FormData();
            formData.append('action', 'rms_update_order_status');
            formData.append('nonce', rmsAdmin.nonce);
            formData.append('id', orderId);
            formData.append('status', newStatus);

            const response = await fetch(rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                fetchOrders();
            }
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    const deleteOrder = async (orderId) => {
        if (!confirm(t('orders.confirm_delete'))) return;

        try {
            const formData = new FormData();
            formData.append('action', 'rms_delete_order');
            formData.append('nonce', rmsAdmin.nonce);
            formData.append('id', orderId);

            const response = await fetch(rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                fetchOrders();
            }
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#FF6B35',
            preparing: '#004E89',
            ready: '#06A77D',
            delivered: '#6C757D',
            cancelled: '#DC3545'
        };
        return colors[status] || '#6C757D';
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: '🕐',
            preparing: '👨‍🍳',
            ready: '✅',
            delivered: '🎉',
            cancelled: '❌'
        };
        return icons[status] || '📋';
    };

    const getNextStatus = (currentStatus) => {
        const statusFlow = {
            pending: 'preparing',
            preparing: 'ready',
            ready: 'delivered'
        };
        return statusFlow[currentStatus];
    };

    const getNextStatusLabel = (currentStatus) => {
        const labels = {
            pending: t('orders.start_preparing'),
            preparing: t('orders.mark_ready'),
            ready: t('orders.mark_delivered')
        };
        return labels[currentStatus];
    };

    const filteredOrders = activeTab === 'all' 
        ? orders 
        : orders.filter(order => order.status === activeTab);

    if (loading) {
        return (
            <div style={{ 
                padding: '60px 20px', 
                textAlign: 'center',
                fontSize: '18px',
                color: '#6C757D'
            }}>
                <div style={{
                    display: 'inline-block',
                    width: '50px',
                    height: '50px',
                    border: '5px solid #f3f3f3',
                    borderTop: '5px solid #004E89',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '20px'
                }}></div>
                <div>{t('common.loading')}</div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ 
            padding: '30px',
            maxWidth: '1400px',
            margin: '0 auto',
            backgroundColor: '#F8F9FA',
            minHeight: '100vh'
        }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '30px',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <h1 style={{ 
                    margin: 0,
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#2C3E50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    📋 {t('orders.title')}
                </h1>
                <div style={{
                    backgroundColor: '#004E89',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '16px'
                }}>
                    {t('orders.total')}: {orders.length} {t('orders.order')}
                </div>
            </div>

            {/* WAITER CALLS PANEL */}
            {calls.length > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
                    padding: '25px',
                    borderRadius: '15px',
                    marginBottom: '30px',
                    boxShadow: '0 8px 24px rgba(231, 76, 60, 0.3)',
                    animation: 'pulse 2s infinite'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                    }}>
                        <h2 style={{
                            margin: 0,
                            color: 'white',
                            fontSize: '24px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span style={{ fontSize: '32px', animation: 'ring 1s ease-in-out infinite' }}>🔔</span>
                            Waiter Calls ({calls.length})
                        </h2>
                    </div>
                    
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {calls.map(call => (
                            <div key={call.id} style={{
                                background: 'white',
                                padding: '20px',
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{
                                        background: '#E74C3C',
                                        color: 'white',
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        fontWeight: '700'
                                    }}>
                                        🪑
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#2C3E50' }}>
                                            Table {call.table_number}
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#6C757D' }}>
                                            {new Date(call.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => {
                                            setSelectedCall(call);
                                            setShowAssignModal(true);
                                        }}
                                        style={{
                                            padding: '12px 24px',
                                            background: '#004E89',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            fontSize: '15px'
                                        }}
                                    >
                                        📝 Assign Order
                                    </button>
                                    <button
                                        onClick={() => resolveCall(call.id)}
                                        style={{
                                            padding: '12px 24px',
                                            background: '#06A77D',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            fontSize: '15px'
                                        }}
                                    >
                                        ✅ Resolve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <style>{`
                        @keyframes ring {
                            0%, 100% { transform: rotate(0deg); }
                            25% { transform: rotate(-15deg); }
                            75% { transform: rotate(15deg); }
                        }
                        @keyframes pulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.02); }
                        }
                    `}</style>
                </div>
            )}

            {/* ASSIGN ORDER MODAL */}
            {showAssignModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '20px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{ marginTop: 0, fontSize: '24px', color: '#2C3E50', marginBottom: '20px' }}>
                            📝 Handle Table {selectedCall?.table_number}
                        </h2>
                        
                        {/* Pending Orders Varsa Göster */}
                        {orders.filter(o => o.status === 'pending').length > 0 && (
                            <>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '16px' }}>
                                        Option 1: Assign Existing Order
                                    </label>
                                    <select
                                        value={selectedOrder}
                                        onChange={(e) => setSelectedOrder(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '2px solid #E9ECEF',
                                            fontSize: '16px'
                                        }}
                                    >
                                        <option value="">-- Select an order --</option>
                                        {orders.filter(o => o.status === 'pending').map(order => (
                                            <option key={order.id} value={order.id}>
                                                Order #{order.id} - ${parseFloat(order.total_price).toFixed(2)} - {order.table_number}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {selectedOrder && (
                                    <button
                                        onClick={assignOrderToTable}
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            background: '#06A77D',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            fontSize: '16px',
                                            marginBottom: '20px'
                                        }}
                                    >
                                        ✅ Assign Order #{selectedOrder}
                                    </button>
                                )}
                                
                                <div style={{
                                    textAlign: 'center',
                                    margin: '20px 0',
                                    color: '#6C757D',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}>
                                    — OR —
                                </div>
                            </>
                        )}
                        
                        {/* Take New Order Butonu */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: '20px',
                            borderRadius: '12px',
                            textAlign: 'center',
                            marginBottom: '20px'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🍽️</div>
                            <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>
                                {orders.filter(o => o.status === 'pending').length > 0 ? 'Option 2: Take New Order' : 'Take New Order'}
                            </h3>
                            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '15px' }}>
                                Go to customer menu and create order for Table {selectedCall?.table_number}
                            </p>
                            <button
                                onClick={() => {
                                    const menuUrl = window.location.origin + '/menu?table=' + selectedCall?.table_number;
                                    window.open(menuUrl, '_blank');
                                }}
                                style={{
                                    background: 'white',
                                    color: '#667eea',
                                    border: 'none',
                                    padding: '12px 30px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '16px'
                                }}
                            >
                                🚀 Open Menu for Table {selectedCall?.table_number}
                            </button>
                        </div>
                        
                        {/* Close & Resolve Butonları */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    resolveCall(selectedCall.id);
                                    setShowAssignModal(false);
                                    setSelectedCall(null);
                                    setSelectedOrder('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    background: '#06A77D',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '16px'
                                }}
                            >
                                ✅ Just Resolve (No Order)
                            </button>
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedCall(null);
                                    setSelectedOrder('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    background: '#6C757D',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '16px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ 
                marginBottom: '30px', 
                display: 'flex', 
                gap: '12px', 
                flexWrap: 'wrap',
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '15px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
                {[
                    { key: 'all', icon: '📊', color: '#004E89' },
                    { key: 'pending', icon: '🕐', color: '#FF6B35' },
                    { key: 'preparing', icon: '👨‍🍳', color: '#004E89' },
                    { key: 'ready', icon: '✅', color: '#06A77D' },
                    { key: 'delivered', icon: '🎉', color: '#6C757D' },
                    { key: 'cancelled', icon: '❌', color: '#DC3545' }
                ].map(tab => {
                    const count = tab.key === 'all' 
                        ? orders.length 
                        : orders.filter(o => o.status === tab.key).length;
                    const isActive = activeTab === tab.key;
                    
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: isActive ? tab.color : 'white',
                                color: isActive ? 'white' : '#2C3E50',
                                border: isActive ? 'none' : '2px solid #E9ECEF',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                                transform: isActive ? 'translateY(-2px)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.target.style.backgroundColor = '#F8F9FA';
                                    e.target.style.transform = 'translateY(-2px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.target.style.backgroundColor = 'white';
                                    e.target.style.transform = 'none';
                                }
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                            <span>{t(`orders.${tab.key}`)}</span>
                            <span style={{
                                backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : tab.color,
                                color: isActive ? 'white' : 'white',
                                padding: '2px 10px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '700',
                                minWidth: '28px',
                                textAlign: 'center'
                            }}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Orders Grid */}
            <div style={{ display: 'grid', gap: '20px' }}>
                {filteredOrders.length === 0 ? (
                    <div style={{ 
                        padding: '80px 40px', 
                        textAlign: 'center', 
                        background: 'white',
                        borderRadius: '15px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
                        <h3 style={{ color: '#6C757D', fontSize: '20px', fontWeight: '600' }}>
                            {t('orders.no_orders')}
                        </h3>
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const totalPrice = parseFloat(order.total_price) || 0;
                        const statusColor = getStatusColor(order.status);
                        
                        return (
                            <div
                                key={order.id}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '15px',
                                    padding: '25px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    borderLeft: `6px solid ${statusColor}`,
                                    transition: 'all 0.3s ease',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                    e.currentTarget.style.transform = 'none';
                                }}
                            >
                                {/* Header */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'flex-start',
                                    marginBottom: '20px',
                                    gap: '15px',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <h3 style={{ 
                                            margin: '0 0 8px 0', 
                                            fontSize: '22px',
                                            fontWeight: '700',
                                            color: '#2C3E50'
                                        }}>
                                            {t('orders.order')} #{order.id}
                                        </h3>
                                        <div style={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '15px',
                                            flexWrap: 'wrap'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                color: '#6C757D',
                                                fontSize: '15px'
                                            }}>
                                                <span>🪑</span>
                                                <span style={{ fontWeight: '600' }}>
                                                    {t('orders.table')} {order.table_number}
                                                </span>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                color: '#6C757D',
                                                fontSize: '14px'
                                            }}>
                                                <span>🕐</span>
                                                <span>
                                                    {new Date(order.created_at).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: '25px',
                                            backgroundColor: statusColor,
                                            color: 'white',
                                            fontWeight: '700',
                                            fontSize: '15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            boxShadow: `0 4px 12px ${statusColor}40`
                                        }}
                                    >
                                        <span style={{ fontSize: '18px' }}>{getStatusIcon(order.status)}</span>
                                        <span>{t(`orders.${order.status}`)}</span>
                                    </div>
                                </div>

                                {/* Items */}
                                <div style={{ 
                                    marginBottom: '20px',
                                    padding: '20px',
                                    backgroundColor: '#F8F9FA',
                                    borderRadius: '10px'
                                }}>
                                    <div style={{ 
                                        fontWeight: '700', 
                                        marginBottom: '12px',
                                        color: '#2C3E50',
                                        fontSize: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <span>🍽️</span>
                                        {t('orders.items')}:
                                    </div>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        {Array.isArray(order.items) && order.items.length > 0 ? (
                                            order.items.map((item, index) => {
                                                // Normalize options - farklı key isimlerini destekle
                                                let rawOptions = item.options || item.selectedOptions || [];
                                                const itemOptions = rawOptions.map(opt => ({
                                                    name: opt.name || opt.option_name || '',
                                                    price: opt.price || opt.option_price || 0
                                                }));
                                                
                                                return (
                                                    <div 
                                                        key={index} 
                                                        style={{ 
                                                            padding: '10px',
                                                            backgroundColor: 'white',
                                                            borderRadius: '8px',
                                                            fontSize: '15px'
                                                        }}
                                                    >
                                                        {/* Ana Item Satırı */}
                                                        <div style={{ 
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            marginBottom: itemOptions.length > 0 ? '8px' : '0'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span style={{
                                                                    backgroundColor: statusColor,
                                                                    color: 'white',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '13px',
                                                                    fontWeight: '700',
                                                                    minWidth: '32px',
                                                                    textAlign: 'center'
                                                                }}>
                                                                    {item.quantity}x
                                                                </span>
                                                                <span style={{ fontWeight: '600', color: '#2C3E50' }}>
                                                                    {item.name}
                                                                </span>
                                                            </div>
                                                            <span style={{ 
                                                                fontWeight: '700',
                                                                color: '#06A77D',
                                                                fontSize: '15px'
                                                            }}>
                                                                ${parseFloat(item.price).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Options (Customizations) */}
                                                        {itemOptions.length > 0 && (
                                                            <div style={{ 
                                                                paddingLeft: '52px',
                                                                display: 'flex',
                                                                flexWrap: 'wrap',
                                                                gap: '6px'
                                                            }}>
                                                                {itemOptions.map((option, optIdx) => (
                                                                    <div 
                                                                        key={optIdx}
                                                                        style={{
                                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                            color: 'white',
                                                                            padding: '4px 10px',
                                                                            borderRadius: '12px',
                                                                            fontSize: '12px',
                                                                            fontWeight: '600',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px'
                                                                        }}
                                                                    >
                                                                        <span>➕</span>
                                                                        <span>{option.name}</span>
                                                                        {option.price > 0 && (
                                                                            <span style={{ 
                                                                                fontWeight: '700',
                                                                                marginLeft: '2px'
                                                                            }}>
                                                                                (+${parseFloat(option.price).toFixed(2)})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div style={{ color: '#6C757D', fontStyle: 'italic' }}>
                                                No items
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Customer Name */}
                                {order.customer_name && (
                                    <div style={{ 
                                        marginBottom: '15px',
                                        padding: '12px',
                                        backgroundColor: '#E7F3FF',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <span>👤</span>
                                        <strong style={{ color: '#004E89' }}>{t('orders.customer_name')}:</strong>
                                        <span style={{ color: '#2C3E50' }}>{order.customer_name}</span>
                                    </div>
                                )}

                                {/* Notes */}
                                {order.notes && (
                                    <div style={{ 
                                        marginBottom: '20px',
                                        padding: '15px',
                                        backgroundColor: '#FFF3CD',
                                        borderLeft: '4px solid #FFC107',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{ 
                                            fontWeight: '700',
                                            marginBottom: '6px',
                                            color: '#856404',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <span>📝</span>
                                            {t('orders.notes')}:
                                        </div>
                                        <div style={{ color: '#856404', fontSize: '14px' }}>
                                            {order.notes}
                                        </div>
                                    </div>
                                )}

                                {/* Total & Actions */}
                                <div style={{ 
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingTop: '20px',
                                    borderTop: '2px solid #E9ECEF',
                                    gap: '15px',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ 
                                        fontSize: '28px', 
                                        fontWeight: '800',
                                        color: '#06A77D',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <span style={{ fontSize: '20px' }}>💰</span>
                                        {t('orders.total')}: ${totalPrice.toFixed(2)}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {getNextStatus(order.status) && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                                                style={{
                                                    padding: '12px 24px',
                                                    backgroundColor: '#004E89',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer',
                                                    fontSize: '15px',
                                                    fontWeight: '700',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: '0 4px 12px rgba(0,78,137,0.3)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = '#003D6E';
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 6px 16px rgba(0,78,137,0.4)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = '#004E89';
                                                    e.target.style.transform = 'none';
                                                    e.target.style.boxShadow = '0 4px 12px rgba(0,78,137,0.3)';
                                                }}
                                            >
                                                {getNextStatusLabel(order.status)}
                                            </button>
                                        )}
                                        
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                                style={{
                                                    padding: '12px 24px',
                                                    backgroundColor: '#FFC107',
                                                    color: '#2C3E50',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer',
                                                    fontSize: '15px',
                                                    fontWeight: '700',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = '#FFB300';
                                                    e.target.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = '#FFC107';
                                                    e.target.style.transform = 'none';
                                                }}
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => deleteOrder(order.id)}
                                            style={{
                                                padding: '12px 24px',
                                                backgroundColor: '#DC3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                fontSize: '15px',
                                                fontWeight: '700',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = '#C82333';
                                                e.target.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = '#DC3545';
                                                e.target.style.transform = 'none';
                                            }}
                                        >
                                            🗑️ {t('common.delete')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default OrdersApp;