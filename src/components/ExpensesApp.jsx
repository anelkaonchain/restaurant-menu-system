import React, { useState, useEffect } from 'react';

function ExpensesApp() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingExpense, setEditingExpense] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [timeRange, setTimeRange] = useState('month');

    const categories = [
        { value: 'rent', label: '🏠 Rent', color: '#DC3545' },
        { value: 'salary', label: '💼 Salary', color: '#FF6B35' },
        { value: 'utilities', label: '💡 Utilities', color: '#FFC107' },
        { value: 'supplies', label: '📦 Supplies', color: '#06A77D' },
        { value: 'maintenance', label: '🔧 Maintenance', color: '#004E89' },
        { value: 'marketing', label: '📢 Marketing', color: '#9C27B0' },
        { value: 'tax', label: '📋 Tax', color: '#795548' },
        { value: 'insurance', label: '🛡️ Insurance', color: '#607D8B' },
        { value: 'other', label: '📌 Other', color: '#6C757D' }
    ];

    const [formData, setFormData] = useState({
        category: 'supplies',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        receipt_url: '',
        notes: ''
    });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const formData = new FormData();
            formData.append('action', 'rms_get_expenses');
            formData.append('nonce', window.rmsAdmin.nonce);

            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                setExpenses(data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('action', 'rms_save_expense');
        data.append('nonce', window.rmsAdmin.nonce);
        
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                data.append(key, formData[key]);
            }
        });

        if (editingExpense) {
            data.append('id', editingExpense.id);
        }

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: data
            });

            const result = await response.json();
            if (result.success) {
                fetchExpenses();
                resetForm();
                alert('Expense saved successfully!');
            } else {
                alert('Error: ' + (result.data || 'Failed to save expense'));
            }
        } catch (error) {
            console.error('Error saving expense:', error);
            alert('Network error: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        const data = new FormData();
        data.append('action', 'rms_delete_expense');
        data.append('nonce', window.rmsAdmin.nonce);
        data.append('id', id);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: data
            });

            const result = await response.json();
            if (result.success) {
                fetchExpenses();
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData({
            category: expense.category,
            amount: expense.amount,
            description: expense.description,
            expense_date: expense.expense_date,
            receipt_url: expense.receipt_url || '',
            notes: expense.notes || ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            category: 'supplies',
            amount: '',
            description: '',
            expense_date: new Date().toISOString().split('T')[0],
            receipt_url: '',
            notes: ''
        });
        setEditingExpense(null);
        setShowForm(false);
    };

    const filterExpensesByDate = (expenses) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return expenses.filter(expense => {
            const expenseDate = new Date(expense.expense_date);
            
            if (timeRange === 'today') {
                return expenseDate >= today;
            } else if (timeRange === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return expenseDate >= weekAgo;
            } else if (timeRange === 'month') {
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return expenseDate >= monthAgo;
            } else if (timeRange === 'year') {
                const yearAgo = new Date(today);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                return expenseDate >= yearAgo;
            } else if (timeRange === 'all') {
                return true;
            }
            return true;
        });
    };

    const filteredExpenses = filterExpensesByDate(expenses).filter(expense => 
        filterCategory === 'all' || expense.category === filterCategory
    );

    const totalExpense = filteredExpenses.reduce((sum, expense) => 
        sum + parseFloat(expense.amount || 0), 0
    );

    const expensesByCategory = {};
    categories.forEach(cat => {
        expensesByCategory[cat.value] = filteredExpenses
            .filter(e => e.category === cat.value)
            .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    });

    const getCategoryInfo = (categoryValue) => {
        return categories.find(cat => cat.value === categoryValue) || categories[categories.length - 1];
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
                <p style={{ marginTop: '20px', color: '#6C757D' }}>Loading Expenses...</p>
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
                    💰 Expense Management
                </h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#DC3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '700',
                        boxShadow: '0 4px 12px rgba(220,53,69,0.3)'
                    }}
                >
                    {showForm ? '✕ Cancel' : '➕ Add Expense'}
                </button>
            </div>

            {/* Time Range Filter */}
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '15px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginBottom: '20px',
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap'
            }}>
                {['today', 'week', 'month', 'year', 'all'].map(range => (
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
                            fontWeight: '600'
                        }}
                    >
                        {range === 'today' && '📅 Today'}
                        {range === 'week' && '📆 Last 7 Days'}
                        {range === 'month' && '🗓️ Last 30 Days'}
                        {range === 'year' && '📈 Last Year'}
                        {range === 'all' && '🌍 All Time'}
                    </button>
                ))}
            </div>

            {/* Stats Card */}
            <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '15px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                marginBottom: '30px',
                borderLeft: '6px solid #DC3545'
            }}>
                <div style={{ fontSize: '14px', color: '#6C757D', marginBottom: '8px', fontWeight: '600' }}>
                    💸 Total Expenses
                </div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#DC3545' }}>
                    ${totalExpense.toFixed(2)}
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
                        {editingExpense ? '✏️ Edit Expense' : '➕ Add New Expense'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2C3E50' }}>
                                    Category *
                                </label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '2px solid #E9ECEF',
                                        borderRadius: '8px',
                                        fontSize: '15px'
                                    }}
                                >
                                    {categories.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2C3E50' }}>
                                    Amount ($) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
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
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.expense_date}
                                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
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
                                Description *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="e.g., Monthly office rent"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '2px solid #E9ECEF',
                                    borderRadius: '8px',
                                    fontSize: '15px'
                                }}
                            />
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2C3E50' }}>
                                Receipt URL (Optional)
                            </label>
                            <input
                                type="url"
                                value={formData.receipt_url}
                                onChange={(e) => setFormData({...formData, receipt_url: e.target.value})}
                                placeholder="https://..."
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '2px solid #E9ECEF',
                                    borderRadius: '8px',
                                    fontSize: '15px'
                                }}
                            />
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
                                💾 Save Expense
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

            {/* Category Filter */}
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '15px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginBottom: '20px',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => setFilterCategory('all')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: filterCategory === 'all' ? '#004E89' : 'white',
                        color: filterCategory === 'all' ? 'white' : '#2C3E50',
                        border: filterCategory === 'all' ? 'none' : '2px solid #E9ECEF',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    📊 All Categories
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setFilterCategory(cat.value)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: filterCategory === cat.value ? cat.color : 'white',
                            color: filterCategory === cat.value ? 'white' : '#2C3E50',
                            border: filterCategory === cat.value ? 'none' : '2px solid #E9ECEF',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        {cat.label} ${expensesByCategory[cat.value].toFixed(0)}
                    </button>
                ))}
            </div>

            {/* Expenses List */}
            <div style={{ display: 'grid', gap: '15px' }}>
                {filteredExpenses.length === 0 ? (
                    <div style={{
                        backgroundColor: 'white',
                        padding: '60px',
                        textAlign: 'center',
                        borderRadius: '15px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '15px' }}>💰</div>
                        <h3 style={{ color: '#6C757D' }}>No expenses found</h3>
                    </div>
                ) : (
                    filteredExpenses.map(expense => {
                        const categoryInfo = getCategoryInfo(expense.category);
                        
                        return (
                            <div
                                key={expense.id}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '15px',
                                    padding: '20px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    borderLeft: `6px solid ${categoryInfo.color}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '20px',
                                    flexWrap: 'wrap'
                                }}
                            >
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '6px 12px',
                                        backgroundColor: categoryInfo.color,
                                        color: 'white',
                                        borderRadius: '20px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        marginBottom: '10px'
                                    }}>
                                        {categoryInfo.label}
                                    </div>
                                    <h3 style={{ margin: '0 0 8px 0', color: '#2C3E50', fontSize: '18px' }}>
                                        {expense.description}
                                    </h3>
                                    <div style={{ fontSize: '14px', color: '#6C757D' }}>
                                        📅 {new Date(expense.expense_date).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </div>
                                    {expense.notes && (
                                        <div style={{
                                            marginTop: '10px',
                                            padding: '8px',
                                            backgroundColor: '#F8F9FA',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            color: '#6C757D'
                                        }}>
                                            📝 {expense.notes}
                                        </div>
                                    )}
                                    {expense.receipt_url && (
                                        <a
                                            href={expense.receipt_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-block',
                                                marginTop: '10px',
                                                color: '#004E89',
                                                textDecoration: 'none',
                                                fontSize: '13px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            📎 View Receipt
                                        </a>
                                    )}
                                </div>

                                <div style={{
                                    fontSize: '28px',
                                    fontWeight: '800',
                                    color: '#DC3545',
                                    minWidth: '120px',
                                    textAlign: 'right'
                                }}>
                                    ${parseFloat(expense.amount).toFixed(2)}
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleEdit(expense)}
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
                                        onClick={() => handleDelete(expense.id)}
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

export default ExpensesApp;