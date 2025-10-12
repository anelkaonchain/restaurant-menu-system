import { useState, useEffect } from '@wordpress/element';
import TranslationsModal from './TranslationsModal';
import { useTranslation } from '../hooks/useTranslation';

function CategoriesApp() {
    const { t } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showTranslations, setShowTranslations] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', slug: '' });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const loadCategories = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('action', 'rms_get_categories');
        formData.append('nonce', window.rmsAdmin.nonce);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                // Sort by display_order
                const sortedCategories = data.data.sort((a, b) => 
                    (a.display_order || 0) - (b.display_order || 0)
                );
                setCategories(sortedCategories);
            } else {
                console.error('Failed to load categories:', data);
            }
        } catch (error) {
            console.error('Load error:', error);
            setMessage({ type: 'error', text: t('categories.load_error') });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setMessage({ type: 'error', text: t('categories.name_required') });
            return;
        }

        setLoading(true);
        const formDataObj = new FormData();
        formDataObj.append('action', 'rms_save_category');
        formDataObj.append('nonce', window.rmsAdmin.nonce);
        formDataObj.append('name', formData.name);
        formDataObj.append('slug', formData.slug);
        if (editingId) {
            formDataObj.append('id', editingId);
        }

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formDataObj
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: t('categories.save_success') });
                setShowForm(false);
                setFormData({ name: '', slug: '' });
                setEditingId(null);
                await loadCategories();
            } else {
                setMessage({ type: 'error', text: data.data || t('categories.save_error') });
            }
        } catch (error) {
            console.error('Save error:', error);
            setMessage({ type: 'error', text: t('categories.save_error') });
        }
        setLoading(false);
    };

    const handleEdit = (category) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            slug: category.slug
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm(t('categories.delete_confirm'))) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('action', 'rms_delete_category');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append('id', id);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: t('categories.delete_success') });
                await loadCategories();
            } else {
                setMessage({ type: 'error', text: t('categories.delete_error') });
            }
        } catch (error) {
            console.error('Delete error:', error);
            setMessage({ type: 'error', text: t('categories.delete_error') });
        }
        setLoading(false);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', slug: '' });
    };

    // Drag & Drop handlers
    const handleDragStart = (e, index) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === index) return;

        const newCategories = [...categories];
        const draggedCategory = newCategories[draggedItem];
        
        // Remove from old position
        newCategories.splice(draggedItem, 1);
        // Insert at new position
        newCategories.splice(index, 0, draggedCategory);

        setDraggedItem(index);
        setCategories(newCategories);
    };

    const handleDragEnd = async (e) => {
        e.currentTarget.style.opacity = '1';
        setDraggedItem(null);
        
        // Save new order to backend
        const categoryIds = categories.map(cat => cat.id);
        const formData = new FormData();
        formData.append('action', 'rms_update_category_order');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append('categories', JSON.stringify(categoryIds));

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (data.success) {
                setMessage({ type: 'success', text: 'Category order updated!' });
                await loadCategories(); // Reload to get updated display_order values
            } else {
                setMessage({ type: 'error', text: 'Failed to update order' });
            }
        } catch (error) {
            console.error('Error updating order:', error);
            setMessage({ type: 'error', text: 'Error updating order' });
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0 }}>{t('categories.title')}</h1>
                {!showForm && (
                    <button 
                        className="button button-primary"
                        onClick={() => setShowForm(true)}
                        disabled={loading}
                    >
                        {t('categories.add_new_category')}
                    </button>
                )}
            </div>

            {message.text && (
                <div style={{
                    padding: '12px 20px',
                    marginBottom: '20px',
                    borderRadius: '4px',
                    background: message.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: message.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    {message.text}
                </div>
            )}

            {categories.length > 0 && !showForm && (
                <div style={{
                    padding: '12px 20px',
                    marginBottom: '20px',
                    borderRadius: '4px',
                    background: '#e7f3ff',
                    color: '#004085',
                    border: '1px solid #b8daff',
                    fontSize: '14px'
                }}>
                    💡 <strong>Tip:</strong> Drag and drop rows to reorder categories. This order will be reflected in the menu.
                </div>
            )}

            {showForm && (
                <div style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    marginBottom: '30px'
                }}>
                    <h2 style={{ marginTop: 0 }}>
                        {editingId ? t('common.edit') + ' ' + t('categories.title') : t('categories.add_new_category')}
                    </h2>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            {t('categories.category_name')} *
                        </label>
                        <input
                            type="text"
                            className="regular-text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('categories.category_name')}
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            {t('categories.slug')}
                        </label>
                        <input
                            type="text"
                            className="regular-text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder={t('categories.slug')}
                            style={{ width: '100%', padding: '8px' }}
                        />
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                            Leave empty to auto-generate from name
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="button button-primary"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? t('common.saving') : t('common.save')}
                        </button>
                        <button
                            className="button"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            )}

            <div style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                {loading && categories.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        {t('common.loading')}...
                    </div>
                ) : categories.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        {t('categories.no_categories')}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', width: '40px' }}>
                                    {/* Drag handle column */}
                                </th>
                                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                                    {t('common.name')}
                                </th>
                                <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>
                                    {t('categories.slug')}
                                </th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                                    {t('categories.count')}
                                </th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category, index) => (
                                <tr 
                                    key={category.id} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    style={{ 
                                        borderBottom: '1px solid #dee2e6',
                                        cursor: 'move',
                                        backgroundColor: draggedItem === index ? '#f0f0f0' : 'transparent',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <span style={{ 
                                            color: '#999', 
                                            cursor: 'grab',
                                            fontSize: '20px',
                                            userSelect: 'none'
                                        }}>
                                            ⋮⋮
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <strong>{category.name}</strong>
                                    </td>
                                    <td style={{ padding: '15px', color: '#666', fontFamily: 'monospace' }}>
                                        {category.slug}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <span style={{
                                            background: '#e3f2fd',
                                            color: '#1976d2',
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '13px',
                                            fontWeight: 'bold'
                                        }}>
                                            {category.count} {t('categories.items')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button
                                                className="button button-small"
                                                onClick={() => handleEdit(category)}
                                                disabled={loading}
                                            >
                                                {t('common.edit')}
                                            </button>
                                            <button
                                                className="button button-small"
                                                onClick={() => setShowTranslations(category)}
                                                disabled={loading}
                                                style={{ background: '#667eea', color: 'white' }}
                                            >
                                                🌍 {t('common.translate')}
                                            </button>
                                            <button
                                                className="button button-small button-link-delete"
                                                onClick={() => handleDelete(category.id)}
                                                disabled={loading}
                                                style={{ color: '#b32d2e' }}
                                            >
                                                {t('common.delete')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            {showTranslations && (
                <TranslationsModal 
                    item={showTranslations}
                    isCategory={true}
                    onClose={() => setShowTranslations(null)} 
                />
            )}
        </div>
    );
}

export default CategoriesApp;