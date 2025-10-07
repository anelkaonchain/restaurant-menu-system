import React, { useState, useEffect } from 'react';

function ReportsApp() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('today');

    useEffect(() => {
        console.log('ReportsApp mounted!');
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const formData = new FormData();
            formData.append('action', 'rms_get_orders');
            formData.append('nonce', window.rmsAdmin.nonce);

            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log('Orders data:', data);
            
            if (data.success) {
                setOrders(data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        }
    };

    const filterOrdersByDate = (orders) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return orders.filter(order => {
            const orderDate = new Date(order.created_at);
            
            if (timeRange === 'today') {
                return orderDate >= today;
            } else if (timeRange === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return orderDate >= weekAgo;
            } else if (timeRange === 'month') {
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return orderDate >= monthAgo;
            } else if (timeRange === '6months') {
                const sixMonthsAgo = new Date(today);
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                return orderDate >= sixMonthsAgo;
            } else if (timeRange === 'year') {
                const yearAgo = new Date(today);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                return orderDate >= yearAgo;
            } else if (timeRange === 'all') {
                return true;
            }
            return true;
        });
    };

    const filteredOrders = filterOrdersByDate(orders);

    const totalRevenue = filteredOrders.reduce((sum, order) => 
        sum + parseFloat(order.total_price || 0), 0
    );

    const averageOrderValue = filteredOrders.length > 0 
        ? totalRevenue / filteredOrders.length 
        : 0;

    const ordersByStatus = {
        pending: filteredOrders.filter(o => o.status === 'pending').length,
        preparing: filteredOrders.filter(o => o.status === 'preparing').length,
        ready: filteredOrders.filter(o => o.status === 'ready').length,
        delivered: filteredOrders.filter(o => o.status === 'delivered').length,
        cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
    };

    const itemSales = {};
    filteredOrders.forEach(order => {
        if (Array.isArray(order.items)) {
            order.items.forEach(item => {
                if (!itemSales[item.name]) {
                    itemSales[item.name] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                itemSales[item.name].quantity += parseInt(item.quantity || 0);
                itemSales[item.name].revenue += parseFloat(item.price || 0) * parseInt(item.quantity || 0);
            });
        }
    });

    const topItems = Object.values(itemSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    const tableStats = {};
    filteredOrders.forEach(order => {
        if (!tableStats[order.table_number]) {
            tableStats[order.table_number] = {
                orders: 0,
                revenue: 0
            };
        }
        tableStats[order.table_number].orders += 1;
        tableStats[order.table_number].revenue += parseFloat(order.total_price || 0);
    });

    const topTables = Object.entries(tableStats)
        .map(([table, stats]) => ({ table, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    if (loading) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-block',
                    width: '50px',
                    height: '50px',
                    border: '5px solid #f3f3f3',
                    borderTop: '5px solid #004E89',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '20px', color: '#6C757D' }}>Loading Reports...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
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
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ 
                    margin: '0 0 20px 0',
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#2C3E50'
                }}>
                    📊 Reports & Analytics
                </h1>

                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    display: 'flex',
                    gap: '15px',
                    flexWrap: 'wrap'
                }}>
                    {['today', 'week', 'month', '6months', 'year', 'all'].map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: timeRange === range ? '#004E89' : 'white',
                                color: timeRange === range ? 'white' : '#2C3E50',
                                border: timeRange === range ? 'none' : '2px solid #E9ECEF',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                boxShadow: timeRange === range ? '0 4px 12px rgba(0,78,137,0.3)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (timeRange !== range) {
                                    e.target.style.backgroundColor = '#F8F9FA';
                                    e.target.style.transform = 'translateY(-2px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (timeRange !== range) {
                                    e.target.style.backgroundColor = 'white';
                                    e.target.style.transform = 'none';
                                }
                            }}
                        >
                            {range === 'today' && '📅 Today'}
                            {range === 'week' && '📆 Last 7 Days'}
                            {range === 'month' && '🗓️ Last 30 Days'}
                            {range === '6months' && '📊 Last 6 Months'}
                            {range === 'year' && '📈 Last Year'}
                            {range === 'all' && '🌍 All Time'}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    borderLeft: '6px solid #06A77D'
                }}>
                    <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px', fontWeight: '600' }}>
                        💰 Total Revenue
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#06A77D' }}>
                        ${totalRevenue.toFixed(2)}
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    borderLeft: '6px solid #004E89'
                }}>
                    <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px', fontWeight: '600' }}>
                        📋 Total Orders
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#004E89' }}>
                        {filteredOrders.length}
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    borderLeft: '6px solid #FF6B35'
                }}>
                    <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px', fontWeight: '600' }}>
                        📊 Average Order
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#FF6B35' }}>
                        ${averageOrderValue.toFixed(2)}
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    borderLeft: '6px solid #DC3545'
                }}>
                    <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px', fontWeight: '600' }}>
                        ❌ Cancelled Orders
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#DC3545' }}>
                        {ordersByStatus.cancelled}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' }}>
                
                <div style={{
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                    <h3 style={{ marginBottom: '20px', color: '#2C3E50', fontSize: '20px', fontWeight: '700' }}>
                        📈 Order Status Distribution
                    </h3>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {Object.entries(ordersByStatus).map(([status, count]) => {
                            const colors = {
                                pending: '#FF6B35',
                                preparing: '#004E89',
                                ready: '#06A77D',
                                delivered: '#6C757D',
                                cancelled: '#DC3545'
                            };
                            const percentage = filteredOrders.length > 0 
                                ? (count / filteredOrders.length * 100).toFixed(1)
                                : 0;
                            
                            return (
                                <div key={status}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ textTransform: 'capitalize', fontWeight: '600', fontSize: '14px' }}>
                                            {status}
                                        </span>
                                        <span style={{ fontWeight: '700', color: colors[status] }}>
                                            {count} ({percentage}%)
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '10px',
                                        backgroundColor: '#E9ECEF',
                                        borderRadius: '5px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${percentage}%`,
                                            height: '100%',
                                            backgroundColor: colors[status],
                                            transition: 'width 0.5s ease'
                                        }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                    <h3 style={{ marginBottom: '20px', color: '#2C3E50', fontSize: '20px', fontWeight: '700' }}>
                        🏆 Top Selling Items
                    </h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {topItems.length > 0 ? topItems.map((item, index) => (
                            <div key={index} style={{
                                padding: '15px',
                                backgroundColor: '#F8F9FA',
                                borderRadius: '10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#E9ECEF',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        color: 'white'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#2C3E50' }}>
                                            {item.name}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#6C757D' }}>
                                            {item.quantity} sold
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontWeight: '800', fontSize: '18px', color: '#06A77D' }}>
                                    ${item.revenue.toFixed(2)}
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', color: '#6C757D', padding: '40px' }}>
                                📭 No data available
                            </div>
                        )}
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                    <h3 style={{ marginBottom: '20px', color: '#2C3E50', fontSize: '20px', fontWeight: '700' }}>
                        🪑 Top Tables by Revenue
                    </h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {topTables.length > 0 ? topTables.map((table, index) => (
                            <div key={index} style={{
                                padding: '15px',
                                backgroundColor: '#F8F9FA',
                                borderRadius: '10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#2C3E50' }}>
                                        🪑 Table {table.table}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#6C757D' }}>
                                        {table.orders} orders
                                    </div>
                                </div>
                                <div style={{ fontWeight: '800', fontSize: '18px', color: '#004E89' }}>
                                    ${table.revenue.toFixed(2)}
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', color: '#6C757D', padding: '40px' }}>
                                📭 No data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportsApp;