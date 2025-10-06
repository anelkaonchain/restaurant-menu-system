import { useState, useEffect } from '@wordpress/element';
import { useTranslation } from '../hooks/useTranslation';

function OrdersApp() {
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('pending');
    const [previousOrderCount, setPreviousOrderCount] = useState(null);
    const [previousCallCount, setPreviousCallCount] = useState(null);
    const [newOrderAlert, setNewOrderAlert] = useState(false);
    const [newCallAlert, setNewCallAlert] = useState(false);

    useEffect(() => {
        loadOrders();
        loadCalls();
        
        const interval = setInterval(() => {
            loadOrders(true);
            loadCalls(true);
        }, 10000);
        
        return () => clearInterval(interval);
    }, []);

    const playNotificationSound = () => {
        try {
            // Assets klasöründeki MP3 dosyasını kullan
            const audio = new Audio(window.rmsAdmin.pluginUrl + 'assets/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Sound play failed:', e));
        } catch (e) {
            console.log('Audio error:', e);
        }
    };

    const loadOrders = async (silent = false) => {
        if (!silent) setLoading(true);
        
        const formData = new FormData();
        formData.append('action', 'rms_get_orders');
        formData.append('nonce', window.rmsAdmin.nonce);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                const ordersWithItems = data.data.map(order => ({
                    ...order,
                    items: Array.isArray(order.items) ? order.items : []
                }));

                const pendingOrders = ordersWithItems.filter(o => o.status === 'pending');
                const currentPendingCount = pendingOrders.length;
                
                if (silent && previousOrderCount !== null && !newOrderAlert && currentPendingCount > previousOrderCount) {
                    playNotificationSound();
                    setNewOrderAlert(true);
                }
                
                setPreviousOrderCount(currentPendingCount);
                setOrders(ordersWithItems);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const loadCalls = async (silent = false) => {
        const formData = new FormData();
        formData.append('action', 'rms_get_calls');
        formData.append('nonce', window.rmsAdmin.nonce);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                const pendingCalls = data.data.filter(c => c.status === 'pending');
                const currentCallCount = pendingCalls.length;
                
                if (silent && previousCallCount !== null && !newCallAlert && currentCallCount > previousCallCount) {
                    playNotificationSound();
                    setNewCallAlert(true);
                }
                
                setPreviousCallCount(currentCallCount);
                setCalls(data.data);
            }
        } catch (error) {
            console.error('Error loading calls:', error);
        }
    };

    const resolveCall = async (callId) => {
        const formData = new FormData();
        formData.append('action', 'rms_resolve_call');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append('call_id', callId);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                loadCalls();
            }
        } catch (error) {
            console.error('Error resolving call:', error);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        const formData = new FormData();
        formData.append('action', 'rms_update_order_status');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append('order_id', orderId);
        formData.append('status', newStatus);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                loadOrders();
            }
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    const deleteOrder = async (orderId) => {
        if (!confirm(t('orders.delete_confirm'))) return;

        const formData = new FormData();
        formData.append('action', 'rms_delete_order');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append('order_id', orderId);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                loadOrders();
            }
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#fbbf24',
            preparing: '#3b82f6',
            ready: '#10b981',
            completed: '#6b7280',
            cancelled: '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    const filteredOrders = activeFilter === 'all' 
        ? orders 
        : orders.filter(order => order.status === activeFilter);

    const pendingCalls = calls.filter(call => call.status === 'pending');

    return (
        <div style={{ maxWidth: '1400px', margin: '20px auto', padding: '0 20px' }}>
            {newOrderAlert && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: '#27ae60',
                    color: 'white',
                    padding: '20px 30px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    zIndex: 9999
                }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                        🔔 {t('orders.new_order') || 'Yeni Sipariş!'}
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '15px' }}>
                        {t('orders.new_order_arrived') || 'Yeni bir sipariş geldi'}
                    </div>
                    <button
                        onClick={() => setNewOrderAlert(false)}
                        style={{
                            background: 'white',
                            color: '#27ae60',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {t('common.ok') || 'Tamam'}
                    </button>
                </div>
            )}

            {newCallAlert && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    background: '#f59e0b',
                    color: 'white',
                    padding: '20px 30px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    zIndex: 9999
                }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                        🔔 Garson Çağrısı!
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '15px' }}>
                        Bir masa garson çağırıyor
                    </div>
                    <button
                        onClick={() => setNewCallAlert(false)}
                        style={{
                            background: 'white',
                            color: '#f59e0b',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Tamam
                    </button>
                </div>
            )}

            <h1 style={{ marginBottom: '30px' }}>{t('orders.title')}</h1>

            {pendingCalls.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#f59e0b' }}>
                        🔔 {t('orders.waiter_calls') || 'Garson Çağrıları'} ({pendingCalls.length})
                    </h2>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {pendingCalls.map(call => (
                            <div key={call.id} style={{
                                background: '#fff3cd',
                                padding: '15px 20px',
                                borderRadius: '8px',
                                borderLeft: '4px solid #f59e0b',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <strong style={{ fontSize: '16px' }}>
                                        {t('orders.table')} {call.table_number}
                                    </strong>
                                    <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                                        {new Date(call.created_at).toLocaleString('tr-TR')}
                                    </p>
                                </div>
                                <button
                                    className="button button-primary"
                                    onClick={() => resolveCall(call.id)}
                                    style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                                >
                                    {t('orders.resolve') || 'Tamamlandı'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setActiveFilter(status)}
                        className="button"
                        style={{
                            background: activeFilter === status ? '#2271b1' : '#f0f0f1',
                            color: activeFilter === status ? 'white' : '#2c3338',
                            borderColor: activeFilter === status ? '#2271b1' : '#c3c4c7'
                        }}
                    >
                        {t(`orders.${status}`)}
                    </button>
                ))}
            </div>

            {loading ? (
                <p>{t('common.loading')}</p>
            ) : filteredOrders.length === 0 ? (
                <p>{t('orders.no_orders')}</p>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {filteredOrders.map(order => (
                        <div key={order.id} style={{
                            background: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            borderLeft: `4px solid ${getStatusColor(order.status)}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0' }}>
                                        {t('orders.order')} #{order.id} - {t('orders.table')} {order.table_number}
                                    </h3>
                                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                                        {new Date(order.created_at).toLocaleString('tr-TR')}
                                    </p>
                                </div>
                                <div style={{
                                    padding: '5px 15px',
                                    borderRadius: '20px',
                                    background: getStatusColor(order.status),
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    height: 'fit-content'
                                }}>
                                    {t(`orders.${order.status}`)}
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <h4 style={{ margin: '0 0 10px 0' }}>{t('orders.items')}:</h4>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    {order.items.map((item, idx) => (
                                        <li key={idx}>
                                            {item.quantity}x {item.name} - ${parseFloat(item.price).toFixed(2)}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {order.notes && (
                                <div style={{ marginBottom: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                                    <strong>{t('orders.notes')}:</strong> {order.notes}
                                </div>
                            )}

                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                paddingTop: '15px',
                                borderTop: '1px solid #eee'
                            }}>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                    {t('orders.total')}: ${parseFloat(order.total_amount).toFixed(2)}
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {order.status === 'pending' && (
                                        <button
                                            className="button button-primary"
                                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                                        >
                                            {t('orders.start_preparing')}
                                        </button>
                                    )}
                                    {order.status === 'preparing' && (
                                        <button
                                            className="button"
                                            onClick={() => updateOrderStatus(order.id, 'ready')}
                                            style={{ background: '#10b981', borderColor: '#10b981', color: 'white' }}
                                        >
                                            {t('orders.mark_ready')}
                                        </button>
                                    )}
                                    {order.status === 'ready' && (
                                        <button
                                            className="button"
                                            onClick={() => updateOrderStatus(order.id, 'completed')}
                                            style={{ background: '#6b7280', borderColor: '#6b7280', color: 'white' }}
                                        >
                                            {t('orders.complete_order')}
                                        </button>
                                    )}
                                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                                        <button
                                            className="button"
                                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                            style={{ background: '#fff3cd', borderColor: '#f59e0b' }}
                                        >
                                            {t('orders.cancel')}
                                        </button>
                                    )}
                                    <button
                                        className="button button-link-delete"
                                        onClick={() => deleteOrder(order.id)}
                                        style={{ color: '#b32d2e' }}
                                    >
                                        {t('common.delete')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OrdersApp;