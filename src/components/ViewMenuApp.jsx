import { useState, useEffect } from '@wordpress/element';
import { useTranslation } from '../hooks/useTranslation';

function ViewMenuApp() {
    const { t } = useTranslation();
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadMenuItems();
    }, []);

    const loadMenuItems = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('action', 'rms_get_menu_items_readonly');
        formData.append('nonce', window.rmsAdmin.nonce);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                setMenuItems(data.data);
                
                const cats = ['all', ...new Set(data.data
                    .filter(item => item.category_name)
                    .map(item => item.category_name))];
                setCategories(cats);
            }
        } catch (error) {
            console.error('Load error:', error);
        }
        setLoading(false);
    };

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category_name === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <div style={{ maxWidth: '1400px', margin: '20px auto', padding: '0 20px' }}>
            <div style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{ margin: 0 }}>{t('menu_items.title')} (View Only)</h1>
                    <button 
                        className="button button-primary"
                        onClick={loadMenuItems}
                        disabled={loading}
                    >
                        {loading ? t('common.loading') : t('common.refresh')}
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search menu items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: '1',
                            minWidth: '200px',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                    
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            minWidth: '150px'
                        }}
                    >
                        <option value="all">All Categories</option>
                        {categories.filter(cat => cat !== 'all').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    {t('common.loading')}
                </div>
            ) : filteredItems.length === 0 ? (
                <div style={{ 
                    background: 'white', 
                    padding: '40px', 
                    textAlign: 'center',
                    borderRadius: '8px',
                    color: '#666'
                }}>
                    No menu items found
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredItems.map(item => (
                        <div key={item.id} style={{
                            background: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '20px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'transform 0.2s',
                            cursor: 'default'
                        }}>
                            {item.image && (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    style={{
                                        width: '100%',
                                        height: '200px',
                                        objectFit: 'cover',
                                        borderRadius: '6px',
                                        marginBottom: '15px'
                                    }}
                                />
                            )}
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', flex: 1 }}>{item.name}</h3>
                                <span style={{
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    color: '#27ae60',
                                    marginLeft: '10px'
                                }}>
                                    ${parseFloat(item.price).toFixed(2)}
                                </span>
                            </div>

                            {item.category_name && (
                                <div style={{
                                    display: 'inline-block',
                                    background: '#f0f0f0',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    marginBottom: '10px',
                                    color: '#666'
                                }}>
                                    {item.category_name}
                                </div>
                            )}

                            {item.description && (
                                <p style={{ 
                                    color: '#666', 
                                    fontSize: '14px', 
                                    margin: '10px 0',
                                    lineHeight: '1.5'
                                }}>
                                    {item.description}
                                </p>
                            )}

                            {item.allergens && (
                                <div style={{
                                    background: '#fff3cd',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    marginTop: '10px',
                                    color: '#856404'
                                }}>
                                    <strong>Allergens:</strong> {item.allergens}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ViewMenuApp;