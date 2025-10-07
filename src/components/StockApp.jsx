import React, { useState, useEffect } from 'react';

function StockApp() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingStock, setEditingStock] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        item_name: '',
        current_stock: '',
        min_stock: '',
        unit: 'kg',
        supplier: '',
        last_order_date: '',
        notes: ''
    });

    useEffect(() => {
        fetchStocks();
    }, []);

    const fetchStocks = async () => {
        try {
            const formData = new FormData();
            formData.append('action', 'rms_get_stocks');
            formData.append('nonce', window.rmsAdmin.nonce);

            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                setStocks(data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching stocks:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('Form submitted!');
        console.log('Form data:', formData);
        console.log('rmsAdmin:', window.rmsAdmin);

        if (!window.rmsAdmin || !window.rmsAdmin.ajaxUrl || !window.rmsAdmin.nonce) {
            alert('Error: rmsAdmin not loaded. Please refresh the page.');
            return;
        }

        const data = new FormData();
        data.append('action', 'rms_save_stock');
        data.append('nonce', window.rmsAdmin.nonce);
        
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                data.append(key, formData[key]);
            }
        });

        if (editingStock) {
            data.append('id', editingStock.id);
        }

        console.log('Sending data to:', window.rmsAdmin.ajaxUrl);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: data
            });

            console.log('Response status:', response.status);

            const result = await response.json();
            console.log('Response data:', result);
            
            if (result.success) {
                fetchStocks();
                resetForm();
                alert('Stock item saved successfully!');
            } else {
                alert('Error: ' + (result.data || 'Failed to save stock'));
            }
        } catch (error) {
            console.error('Error saving stock:', error);
            alert('Network error: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this stock item?')) return;

        const data = new FormData();
        data.append('action', 'rms_delete_stock');
        data.append('nonce', window.rmsAdmin.nonce);
        data.append('id', id);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: data
            });

            const result = await response.json();
            if (result.success) {
                fetchStocks();
            }
        } catch (error) {
            console.error('Error deleting stock:', error);
        }
    };

    const handleEdit = (stock) => {
        setEditingStock(stock);
        setFormData({
            item_name: stock.item_name,
            current_stock: stock.current_stock,
            min_stock: stock.min_stock,
            unit: stock.unit,
            supplier: stock.supplier || '',
            last_order_date: stock.last_order_date || '',
            notes: stock.notes || ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            item_name: '',
            current_stock: '',
            min_stock: '',
            unit: 'kg',
            supplier: '',
            last_order_date: '',
            notes: ''
        });
        setEditingStock(null);
        setShowForm(false);
    };

    const getStockStatus = (current, min) => {
        const currentNum = parseFloat(current);
        const minNum = parseFloat(min);
        
        if (currentNum === 0) return 'out';
        if (currentNum <= minNum) return 'low';
        if (currentNum <= minNum * 1.5) return 'medium';
        return 'good';
    };

    const getStatusColor = (status) => {
        const colors = {
            out: '#DC3545',
            low: '#FFC107',
            medium: '#FF6B35',
            good: '#06A77D'
        };
        return colors[status];
    };

    const getStatusLabel = (status) => {
        const labels = {
            out: 'Out of Stock',
            low: 'Low Stock',
            medium: 'Medium Stock',
            good: 'Good Stock'
        };
        return labels[status];
    };

    const filteredStocks = stocks.filter(stock => {
        const status = getStockStatus(stock.current_stock, stock.min_stock);
        const matchesFilter = filterStatus === 'all' || status === filterStatus;
        const matchesSearch = stock.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (stock.supplier && stock.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    const stockStats = {
        total: stocks.length,
        out: stocks.filter(s => getStockStatus(s.current_stock, s.min_stock) === 'out').length,
        low: stocks.filter(s => getStockStatus(s.current_stock, s.min_stock) === 'low').length,
        good: stocks.filter(s => getStockStatus(s.current_stock, s.min_stock) === 'good').length
    };

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
                <p style={{ marginTop: '20px', color: '#6C757D' }}>Loading Stock...</p>
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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#2C3E50' }}>
                    📦 Stock Management
                </h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#004E89',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '700',
                        boxShadow: '0 4px 12px rgba(0,78,137,0.3)'
                    }}
                >
                    {showForm ? '✕ Cancel' : '➕ Add Stock Item'}
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    borderLeft: '6px solid #004E89'
                }}>
                    <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px', fontWeight: '600' }}>
                        📦 Total Items
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#004E89' }}>
                        {stockStats.total}
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    borderLeft: '6px solid #DC3545'
                }}>
                    <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px', fontWeight: '600' }}>
                        ⚠️ Out of Stock
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#DC3545' }}>
                        {stockStats.out}
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    borderLeft: '6px solid #FFC107'
                }}>
                    <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px', fontWeight: '600' }}>
                        ⚡ Low Stock
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#FFC107' }}>
                        {stockStats.low}
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    borderLeft: '6px solid #06A77D'
                }}>
                    <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px', fontWeight: '600' }}>
                        ✅ Good Stock
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#06A77D' }}>
                        {stockStats.good}
                    </div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    marginBottom: '30px'
                }}>
                    <h3 style={{ marginTop: 0, color: '#2C3E50' }}>
                        {editingStock ? '✏️ Edit Stock Item' : '➕ Add New Stock Item'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2C3E50' }}>
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.item_name}
                                    onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '2px solid #E9ECEF',
                                        borderRadius: '8px',
                                        fontSize: '15px'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2C3E50' }}>
                                    Current Stock *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.current_stock}
                                    onChange={(e) => setFormData({...formData, current_stock: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '2px solid #E9ECEF',
                                        borderRadius: '8px',
                                        fontSize: '15px'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2C3E50' }}>
                                    Minimum Stock *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.min_stock}
                                    onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '2px solid #E9ECEF',
                                        borderRadius: '8px',
                                        fontSize: '15px'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2C3E50' }}>
                                    Unit
                                </label>
                                <select
                                    value={formData.unit}
                                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '2px solid #E9ECEF',
                                        borderRadius: '8px',
                                        fontSize: '15px'
                                    }}
                                >
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="l">l</option>
                                    <option value="ml">ml</option>
                                    <option value="pcs">pieces</option>
                                    <option value="box">box</option>
                                    <option value="pack">pack</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2C3E50' }}>
                                    Supplier
                                </label>
                                <input
                                    type="text"
                                    value={formData.supplier}
                                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '2px solid #E9ECEF',
                                        borderRadius: '8px',
                                        fontSize: '15px'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2C3E50' }}>
                                    Last Order Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.last_order_date}
                                    onChange={(e) => setFormData({...formData, last_order_date: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '2px solid #E9ECEF',
                                        borderRadius: '8px',
                                        fontSize: '15px'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2C3E50' }}>
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                rows="3"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '2px solid #E9ECEF',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button
                                type="submit"
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#06A77D',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '700'
                                }}
                            >
                                💾 Save Stock
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#6C757D',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '700'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '15px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginBottom: '20px',
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <input
                    type="text"
                    placeholder="🔍 Search items or suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: '250px',
                        padding: '10px',
                        border: '2px solid #E9ECEF',
                        borderRadius: '8px',
                        fontSize: '15px'
                    }}
                />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {['all', 'out', 'low', 'good'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: filterStatus === status ? '#004E89' : 'white',
                                color: filterStatus === status ? 'white' : '#2C3E50',
                                border: filterStatus === status ? 'none' : '2px solid #E9ECEF',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        >
                            {status === 'all' && 'All'}
                            {status === 'out' && '⚠️ Out'}
                            {status === 'low' && '⚡ Low'}
                            {status === 'good' && '✅ Good'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stock List */}
            <div style={{ display: 'grid', gap: '15px' }}>
                {filteredStocks.length === 0 ? (
                    <div style={{
                        backgroundColor: 'white',
                        padding: '60px',
                        textAlign: 'center',
                        borderRadius: '15px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '15px' }}>📦</div>
                        <h3 style={{ color: '#6C757D' }}>No stock items found</h3>
                    </div>
                ) : (
                    filteredStocks.map(stock => {
                        const status = getStockStatus(stock.current_stock, stock.min_stock);
                        const statusColor = getStatusColor(status);
                        
                        return (
                            <div
                                key={stock.id}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '15px',
                                    padding: '20px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    borderLeft: `6px solid ${statusColor}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '20px',
                                    flexWrap: 'wrap'
                                }}
                            >
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <h3 style={{ margin: '0 0 10px 0', color: '#2C3E50', fontSize: '20px' }}>
                                        {stock.item_name}
                                    </h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '14px', color: '#6C757D' }}>
                                        <div>
                                            <strong>Current:</strong> {stock.current_stock} {stock.unit}
                                        </div>
                                        <div>
                                            <strong>Min:</strong> {stock.min_stock} {stock.unit}
                                        </div>
                                        {stock.supplier && (
                                            <div>
                                                <strong>Supplier:</strong> {stock.supplier}
                                            </div>
                                        )}
                                    </div>
                                    {stock.notes && (
                                        <div style={{
                                            marginTop: '10px',
                                            padding: '8px',
                                            backgroundColor: '#F8F9FA',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            color: '#6C757D'
                                        }}>
                                            📝 {stock.notes}
                                        </div>
                                    )}
                                </div>

                                <div style={{
                                    padding: '10px 20px',
                                    backgroundColor: statusColor,
                                    color: 'white',
                                    borderRadius: '25px',
                                    fontWeight: '700',
                                    fontSize: '14px'
                                }}>
                                    {getStatusLabel(status)}
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleEdit(stock)}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#004E89',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(stock.id)}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#DC3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default StockApp;