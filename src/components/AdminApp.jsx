import { useState, useEffect } from '@wordpress/element';
import TranslationsModal from './TranslationsModal';
import { useTranslation } from '../hooks/useTranslation';

function AdminApp() {
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showTranslations, setShowTranslations] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        allergens: '',
        category: '',
        image: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadItems();
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

    const loadItems = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('action', 'rms_get_menu_items');
        formData.append('nonce', window.rmsAdmin.nonce);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                setItems(data.data);
            } else {
                console.error('Failed to load items:', data);
            }
        } catch (error) {
            console.error('Load error:', error);
            setMessage({ type: 'error', text: 'Error loading menu items' });
        }
        setLoading(false);
    };

    const loadCategories = async () => {
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
                setCategories(data.data);
            } else {
                console.error('Failed to load categories:', data);
            }
        } catch (error) {
            console.error('Categories load error:', error);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setMessage({ type: 'error', text: 'Item name is required' });
            return;
        }

        setLoading(true);
        const formDataObj = new FormData();
        formDataObj.append('action', 'rms_save_menu_item');
        formDataObj.append('nonce', window.rmsAdmin.nonce);
        formDataObj.append('name', formData.name);
        formDataObj.append('description', formData.description);
        formDataObj.append('price', formData.price);
        formDataObj.append('allergens', formData.allergens);
        formDataObj.append('category', formData.category);
        formDataObj.append('image', formData.image);
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
                setMessage({ type: 'success', text: 'Menu item saved successfully!' });
                setShowForm(false);
                setFormData({ name: '', description: '', price: '', allergens: '', category: '', image: '' });
                setEditingId(null);
                await loadItems();
            } else {
                setMessage({ type: 'error', text: data.data || 'Failed to save menu item' });
            }
        } catch (error) {
            console.error('Save error:', error);
            setMessage({ type: 'error', text: 'Error saving menu item' });
        }
        setLoading(false);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            name: item.name,
            description: item.description,
            price: item.price,
            allergens: item.allergens || '',
            category: item.category || '',
            image: item.image || ''
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('action', 'rms_delete_menu_item');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append('id', id);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Menu item deleted successfully!' });
                await loadItems();
            } else {
                setMessage({ type: 'error', text: 'Failed to delete menu item' });
            }
        } catch (error) {
            console.error('Delete error:', error);
            setMessage({ type: 'error', text: 'Error deleting menu item' });
        }
        setLoading(false);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', description: '', price: '', allergens: '', category: '', image: '' });
    };
    
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select an image file' });
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
            return;
        }
        
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('action', 'rms_upload_image');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append('image', file);
        
        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (data.success) {
                setFormData(prev => ({ ...prev, image: data.data.url }));
                setMessage({ type: 'success', text: 'Image uploaded successfully!' });
            } else {
                setMessage({ type: 'error', text: data.data || 'Failed to upload image' });
            }
        } catch (error) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: 'Error uploading image. Please try again.' });
        } finally {
            setUploadingImage(false);
            // Reset file input
            e.target.value = '';
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0 }}>{t('menu_items.title')}</h1>
                {!showForm && (
                    <button 
                        className="button button-primary"
                        onClick={() => setShowForm(true)}
                        disabled={loading}
                    >
                        {t('menu_items.add_new_item')}
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

            {showForm && (
                <div style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    marginBottom: '30px'
                }}>
                    <h2 style={{ marginTop: 0 }}>
                        {editingId ? t('common.edit') + ' ' + t('menu_items.title') : t('menu_items.add_new_item')}
                    </h2>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            {t('menu_items.item_name')} *
                        </label>
                        <input
                            type="text"
                            className="regular-text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Margherita Pizza"
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            {t('common.description')}
                        </label>
                        <textarea
                            className="large-text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the item..."
                            rows="4"
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                {t('menu_items.item_price')} *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="regular-text"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="0.00"
                                style={{ width: '100%', padding: '8px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                {t('menu_items.category')}
                            </label>
                            <select
                                className="regular-text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                style={{ width: '100%', padding: '8px' }}
                            >
                                <option value="">{t('menu_items.select_category')}</option>
                                {categories
                                    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            {t('menu_items.allergens')}
                        </label>
                        <input
                            type="text"
                            className="regular-text"
                            value={formData.allergens}
                            onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                            placeholder="e.g., Gluten, Dairy, Nuts"
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            {t('menu_items.item_image')}
                        </label>
                        {formData.image && (
                            <div style={{ marginBottom: '10px' }}>
                                <img src={formData.image} alt="Preview" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                                <button
                                    type="button"
                                    className="button"
                                    onClick={() => setFormData({ ...formData, image: '' })}
                                    style={{ display: 'block', marginTop: '5px' }}
                                >
                                    {t('menu_items.remove_image')}
                                </button>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            style={{ display: 'block' }}
                        />
                        {uploadingImage && (
                            <p style={{ color: '#666', fontSize: '13px', marginTop: '5px' }}>
                                Uploading image...
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="button button-primary"
                            onClick={handleSave}
                            disabled={loading || uploadingImage}
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
                padding: '20px'
            }}>
                {loading && items.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        Loading menu items...
                    </div>
                ) : items.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        No menu items yet. Click "Add New Item" to create one.
                    </div>
                ) : (
                    <>
                        {/* Kategorilere göre grupla */}
                        {categories
                            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                            .map(category => {
                                const categoryItems = items.filter(item => item.category === category.id);
                                if (categoryItems.length === 0) return null;
                                
                                return (
                                    <div key={category.id} style={{ marginBottom: '40px' }}>
                                        <h2 style={{ 
                                            fontSize: '24px', 
                                            color: '#2271b1', 
                                            marginBottom: '20px',
                                            paddingBottom: '10px',
                                            borderBottom: '2px solid #2271b1'
                                        }}>
                                            {category.name} ({categoryItems.length})
                                        </h2>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                            {categoryItems.map(item => (
                                                <div key={item.id} style={{
                                                    padding: '20px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    background: '#fafafa'
                                                }}>
                                                    {item.image && (
                                                        <img 
                                                            src={item.image} 
                                                            alt={item.name}
                                                            style={{ 
                                                                width: '100%', 
                                                                height: '200px', 
                                                                objectFit: 'cover', 
                                                                borderRadius: '8px',
                                                                marginBottom: '15px'
                                                            }} 
                                                        />
                                                    )}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                                        <h3 style={{ margin: 0, fontSize: '18px' }}>{item.name}</h3>
                                                        <span style={{
                                                            fontSize: '11px',
                                                            background: '#2271b1',
                                                            color: 'white',
                                                            padding: '3px 8px',
                                                            borderRadius: '10px'
                                                        }}>
                                                            {item.category_name}
                                                        </span>
                                                    </div>
                                                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                                                        {item.description || 'No description'}
                                                    </p>
                                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>
                                                        ${item.price}
                                                    </div>
                                                    {item.allergens && (
                                                        <div style={{ marginTop: '10px', padding: '8px', background: '#fff3cd', borderRadius: '4px', fontSize: '12px' }}>
                                                            Allergens: {item.allergens}
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                                                        <button 
                                                            className="button button-small" 
                                                            onClick={() => handleEdit(item)}
                                                            disabled={loading}
                                                        >
                                                            {t('common.edit')}
                                                        </button>
                                                        <button 
                                                            className="button button-small" 
                                                            onClick={() => setShowTranslations(item)}
                                                            disabled={loading}
                                                            style={{ background: '#667eea', color: 'white' }}
                                                        >
                                                            🌍 {t('common.translate')}
                                                        </button>
                                                        <button 
                                                            className="button button-small button-link-delete" 
                                                            onClick={() => handleDelete(item.id)} 
                                                            disabled={loading}
                                                            style={{ color: '#b32d2e' }}
                                                        >
                                                            {t('common.delete')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        
                        {/* Kategorisiz itemler */}
                        {items.filter(item => !item.category).length > 0 && (
                            <div style={{ marginBottom: '40px' }}>
                                <h2 style={{ 
                                    fontSize: '24px', 
                                    color: '#999', 
                                    marginBottom: '20px',
                                    paddingBottom: '10px',
                                    borderBottom: '2px solid #ddd'
                                }}>
                                    Uncategorized ({items.filter(item => !item.category).length})
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                    {items.filter(item => !item.category).map(item => (
                                        <div key={item.id} style={{
                                            padding: '20px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            background: '#fafafa'
                                        }}>
                                            {item.image && (
                                                <img 
                                                    src={item.image} 
                                                    alt={item.name}
                                                    style={{ 
                                                        width: '100%', 
                                                        height: '200px', 
                                                        objectFit: 'cover', 
                                                        borderRadius: '8px',
                                                        marginBottom: '15px'
                                                    }} 
                                                />
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                                <h3 style={{ margin: 0, fontSize: '18px' }}>{item.name}</h3>
                                            </div>
                                            <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                                                {item.description || 'No description'}
                                            </p>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>
                                                ${item.price}
                                            </div>
                                            {item.allergens && (
                                                <div style={{ marginTop: '10px', padding: '8px', background: '#fff3cd', borderRadius: '4px', fontSize: '12px' }}>
                                                    Allergens: {item.allergens}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                                                <button 
                                                    className="button button-small" 
                                                    onClick={() => handleEdit(item)}
                                                    disabled={loading}
                                                >
                                                    {t('common.edit')}
                                                </button>
                                                <button 
                                                    className="button button-small" 
                                                    onClick={() => setShowTranslations(item)}
                                                    disabled={loading}
                                                    style={{ background: '#667eea', color: 'white' }}
                                                >
                                                    🌍 {t('common.translate')}
                                                </button>
                                                <button 
                                                    className="button button-small button-link-delete" 
                                                    onClick={() => handleDelete(item.id)} 
                                                    disabled={loading}
                                                    style={{ color: '#b32d2e' }}
                                                >
                                                    {t('common.delete')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {showTranslations && (
                <TranslationsModal 
                    item={showTranslations} 
                    onClose={() => setShowTranslations(null)} 
                />
            )}
        </div>
    );
}

export default AdminApp;