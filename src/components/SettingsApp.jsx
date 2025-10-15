import { useState, useEffect } from '@wordpress/element';
import { useTranslation } from '../hooks/useTranslation';

function SettingsApp() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [defaultLanguage, setDefaultLanguage] = useState('en');
    const [adminLanguage, setAdminLanguage] = useState('en');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [enableRecommendations, setEnableRecommendations] = useState(false);
    const [showModalRecommendations, setShowModalRecommendations] = useState(false);
    const [showPopupRecommendations, setShowPopupRecommendations] = useState(false);

    const languages = {
        'tr': 'Türkçe',
        'en': 'English',
        'es': 'Español',
        'ar': 'العربية',
        'de': 'Deutsch',
        'fr': 'Français',
        'it': 'Italiano',
        'ja': '日本語',
        'zh': '中文',
        'ru': 'Русский',
        'pt': 'Português',
        'hi': 'हिन्दी',
        'nl': 'Nederlands',
        'ko': '한국어',
        'pl': 'Polski',
        'sv': 'Svenska',
        'no': 'Norsk',
        'da': 'Dansk',
        'fi': 'Suomi',
        'el': 'Ελληνικά',
        'cs': 'Čeština',
        'hu': 'Magyar',
        'ro': 'Română',
        'th': 'ไทย',
        'vi': 'Tiếng Việt',
        'id': 'Bahasa Indonesia',
        'uk': 'Українська',
        'he': 'עברית',
        'bn': 'বাংলা',
        'fa': 'فارسی'
    };

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const loadSettings = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('action', 'rms_get_settings');
        formData.append('nonce', window.rmsAdmin.nonce);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                setDefaultLanguage(data.data.default_language);
                setAdminLanguage(data.data.admin_language || 'en');
                setEnableRecommendations(data.data.enable_recommendations || false);
                setShowModalRecommendations(data.data.show_modal_recommendations || false);
                setShowPopupRecommendations(data.data.show_popup_recommendations || false);
            }
        } catch (error) {
            console.error('Load error:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('action', 'rms_save_settings');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append('default_language', defaultLanguage);
        formData.append('admin_language', adminLanguage);
        if (enableRecommendations) formData.append('enable_recommendations', '1');
        if (showModalRecommendations) formData.append('show_modal_recommendations', '1');
        if (showPopupRecommendations) formData.append('show_popup_recommendations', '1');

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: t('settings.save_success') });
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setMessage({ type: 'error', text: 'Failed to save settings' });
                setLoading(false);
            }
        } catch (error) {
            console.error('Save error:', error);
            setMessage({ type: 'error', text: 'Error saving settings' });
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '20px auto', padding: '0 20px' }}>
            <h1 style={{ marginBottom: '30px' }}>{t('settings.title')}</h1>

            {message.text && (
                <div style={{
                    padding: '15px 20px',
                    marginBottom: '25px',
                    borderRadius: '8px',
                    background: message.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: message.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                    fontSize: '15px'
                }}>
                    {message.text}
                </div>
            )}

            <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '25px'
            }}>
                <h2 style={{ marginTop: 0 }}>
                    {t('settings.application_language')}
                </h2>

                <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>
                        {t('settings.admin_panel_language')}
                    </label>
                    <select
                        value={adminLanguage}
                        onChange={(e) => setAdminLanguage(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '16px',
                            border: '2px solid #ddd',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        {Object.entries(languages).map(([code, name]) => (
                            <option key={code} value={code}>
                                {name} ({code.toUpperCase()})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '25px'
            }}>
                <h2 style={{ marginTop: 0 }}>
                    {t('settings.menu_content_language')}
                </h2>

                <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>
                        {t('settings.menu_content_language')}
                    </label>
                    <select
                        value={defaultLanguage}
                        onChange={(e) => setDefaultLanguage(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '16px',
                            border: '2px solid #ddd',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        {Object.entries(languages).map(([code, name]) => (
                            <option key={code} value={code}>
                                {name} ({code.toUpperCase()})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '25px'
            }}>
                <h2 style={{ marginTop: 0 }}>
                    🎁 Recommended Items
                </h2>
                <p style={{ color: '#666', marginBottom: '25px' }}>
                    Show product recommendations to increase sales ("Customers also bought")
                </p>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        padding: '15px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0'
                    }}>
                        <input
                            type="checkbox"
                            checked={enableRecommendations}
                            onChange={(e) => setEnableRecommendations(e.target.checked)}
                            style={{ 
                                width: '20px', 
                                height: '20px', 
                                marginRight: '12px',
                                cursor: 'pointer'
                            }}
                        />
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                            Enable Recommended Items
                        </span>
                    </label>
                </div>

                {enableRecommendations && (
                    <div style={{ 
                        marginLeft: '20px', 
                        paddingLeft: '20px', 
                        borderLeft: '3px solid #667eea' 
                    }}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                cursor: 'pointer',
                                padding: '12px',
                                background: '#f8f9fa',
                                borderRadius: '6px'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={showModalRecommendations}
                                    onChange={(e) => setShowModalRecommendations(e.target.checked)}
                                    style={{ 
                                        width: '18px', 
                                        height: '18px', 
                                        marginRight: '10px',
                                        cursor: 'pointer'
                                    }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '15px' }}>
                                        Show in Product Details (Same Category)
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                                        Display similar items when viewing product details
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                cursor: 'pointer',
                                padding: '12px',
                                background: '#f8f9fa',
                                borderRadius: '6px'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={showPopupRecommendations}
                                    onChange={(e) => setShowPopupRecommendations(e.target.checked)}
                                    style={{ 
                                        width: '18px', 
                                        height: '18px', 
                                        marginRight: '10px',
                                        cursor: 'pointer'
                                    }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '15px' }}>
                                        Show After Adding to Cart (Different Category)
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                                        Display complementary items after adding to cart
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <button
                className="button button-primary button-hero"
                onClick={handleSave}
                disabled={loading}
                style={{ 
                    fontSize: '18px', 
                    padding: '15px 40px',
                    width: '100%',
                    height: 'auto'
                }}
            >
                {loading ? t('common.saving') : t('settings.save_all_settings')}
            </button>
        </div>
    );
}

export default SettingsApp;