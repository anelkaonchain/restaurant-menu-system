import { useState, useEffect } from '@wordpress/element';

function TranslationsModal({ item, isCategory = false, onClose }) {
    const [languages, setLanguages] = useState({});
    const [translations, setTranslations] = useState({});
    const [selectedLang, setSelectedLang] = useState('');
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadLanguages();
        loadTranslations();
    }, []);

    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const loadLanguages = async () => {
        const formData = new FormData();
        formData.append('action', 'rms_get_languages');

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                setLanguages(data.data);
            }
        } catch (error) {
            console.error('Load languages error:', error);
        }
    };

    const loadTranslations = async () => {
        const formData = new FormData();
        formData.append('action', isCategory ? 'rms_get_category_translations' : 'rms_get_translations');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append(isCategory ? 'category_id' : 'item_id', item.id);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                setTranslations(data.data);
            }
        } catch (error) {
            console.error('Load translations error:', error);
        }
    };

    const handleSaveTranslation = async () => {
        if (!selectedLang) {
            setMessage({ type: 'error', text: 'Please select a language' });
            return;
        }

        if (!formData.name.trim()) {
            setMessage({ type: 'error', text: 'Name is required' });
            return;
        }

        setLoading(true);
        const formDataObj = new FormData();
        formDataObj.append('action', isCategory ? 'rms_save_category_translation' : 'rms_save_translation');
        formDataObj.append('nonce', window.rmsAdmin.nonce);
        formDataObj.append(isCategory ? 'category_id' : 'item_id', item.id);
        formDataObj.append('language_code', selectedLang);
        formDataObj.append('name', formData.name);
        if (!isCategory) {
            formDataObj.append('description', formData.description);
        }

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formDataObj
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Translation saved!' });
                await loadTranslations();
                setSelectedLang('');
                setFormData({ name: '', description: '' });
            } else {
                setMessage({ type: 'error', text: 'Failed to save translation' });
            }
        } catch (error) {
            console.error('Save error:', error);
            setMessage({ type: 'error', text: 'Error saving translation' });
        }
        setLoading(false);
    };

    const handleSelectLanguage = (langCode) => {
        setSelectedLang(langCode);
        if (translations[langCode]) {
            if (isCategory) {
                setFormData({ name: translations[langCode], description: '' });
            } else {
                setFormData({
                    name: translations[langCode].name,
                    description: translations[langCode].description
                });
            }
        } else {
            setFormData({ name: '', description: '' });
        }
    };

    return (
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
            zIndex: 10000,
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '30px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Translations for: {item.name}</h2>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '30px',
                        cursor: 'pointer',
                        color: '#999'
                    }}>×</button>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                    <div>
                        <h3>Languages</h3>
                        <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
                            {Object.entries(languages).map(([code, name]) => (
                                <div
                                    key={code}
                                    onClick={() => handleSelectLanguage(code)}
                                    style={{
                                        padding: '12px',
                                        cursor: 'pointer',
                                        background: selectedLang === code ? '#667eea' : 'white',
                                        color: selectedLang === code ? 'white' : '#333',
                                        borderBottom: '1px solid #eee',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <span>{name} ({code})</span>
                                    {translations[code] && (
                                        <span style={{
                                            background: selectedLang === code ? 'white' : '#27ae60',
                                            color: selectedLang === code ? '#667eea' : 'white',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontSize: '11px'
                                        }}>✓</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        {selectedLang ? (
                            <>
                                <h3>Edit Translation ({languages[selectedLang]})</h3>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        className="regular-text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Translated name"
                                        style={{ width: '100%', padding: '8px' }}
                                    />
                                </div>

                                {!isCategory && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Description
                                        </label>
                                        <textarea
                                            className="large-text"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Translated description"
                                            rows="6"
                                            style={{ width: '100%', padding: '8px' }}
                                        />
                                    </div>
                                )}

                                <div style={{
                                    background: '#f8f9fa',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    marginBottom: '15px'
                                }}>
                                    <strong>Original (English):</strong>
                                    <div style={{ marginTop: '8px', color: '#666' }}>
                                        <div><strong>Name:</strong> {item.name}</div>
                                        {!isCategory && item.description && (
                                            <div style={{ marginTop: '5px' }}><strong>Description:</strong> {item.description}</div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    className="button button-primary"
                                    onClick={handleSaveTranslation}
                                    disabled={loading}
                                    style={{ width: '100%' }}
                                >
                                    {loading ? 'Saving...' : 'Save Translation'}
                                </button>
                            </>
                        ) : (
                            <div style={{
                                padding: '40px',
                                textAlign: 'center',
                                color: '#999'
                            }}>
                                ← Select a language to add or edit translation
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TranslationsModal;