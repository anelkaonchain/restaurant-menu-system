import React, { useState, useEffect } from 'react';
import useTranslation from '../hooks/useTranslation.js';

function OrdersApp() {
    const { t, language } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

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
                const oldOrders = orders;
                const newOrders = data.data;
                
                setOrders(newOrders);
                
                // Sadece yeni "pending" siparişler için bildirim göster
                if (oldOrders.length > 0) {
                    const newPendingOrders = newOrders.filter(newOrder => 
                        newOrder.status === 'pending' && 
                        !oldOrders.some(oldOrder => oldOrder.id === newOrder.id)
                    );
                    
                    if (newPendingOrders.length > 0) {
                        playNotificationSound();
                        showNotification(newPendingOrders.length);
                    }
                }
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        }
    };

    const playNotificationSound = () => {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZQQ0OXrXp7KhWFApGn+Dyu20h');
        audio.play().catch(e => console.log('Ses çalınamadı:', e));
    };

    const showNotification = (count) => {
        // Tarayıcı bildirimi göster
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
        
        // Animasyon stilleri
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes pulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.05);
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notificationDiv);
        
        // 5 saniye sonra bildirimi kaldır
        setTimeout(() => {
            notificationDiv.style.animation = 'slideInRight 0.5s ease-out reverse';
            setTimeout(() => {
                notificationDiv.remove();
            }, 500);
        }, 5000);
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
                                            order.items.map((item, index) => (
                                                <div 
                                                    key={index} 
                                                    style={{ 
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '10px',
                                                        backgroundColor: 'white',
                                                        borderRadius: '8px',
                                                        fontSize: '15px'
                                                    }}
                                                >
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
                                            ))
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