import { useState, useEffect } from '@wordpress/element';

function ItemOptionsModal({ item, onClose }) {
    const [options, setOptions] = useState({});
    const [loading, setLoading] = useState(false);
    const [newOption, setNewOption] = useState({
        option_type: 'extras',
        option_name: '',
        option_price: '0'
    });

    useEffect(() => {
        loadOptions();
    }, [item.id]);

    const loadOptions = async () => {
        const formData = new FormData();
        formData.append('action', 'rms_get_item_options');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append('item_id', item.id);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                const optionsData = data.data || {};
                setOptions(optionsData);
                console.log('Loaded options:', optionsData);
            }
        } catch (error) {
            console.error('Load options error:', error);
        }
    };

    const handleAddOption = async () => {
        if (!newOption.option_name.trim()) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('action', 'rms_save_item_option');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append('item_id', item.id);
        formData.append('option_type', newOption.option_type);
        formData.append('option_name', newOption.option_name);
        formData.append('option_price', newOption.option_price);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                setNewOption({ option_type: 'extras', option_name: '', option_price: '0' });
                await loadOptions();
            }
        } catch (error) {
            console.error('Save option error:', error);
        }
        setLoading(false);
    };

    const handleDeleteOption = async (optionId) => {
        if (!confirm('Delete this option?')) return;

        const formData = new FormData();
        formData.append('action', 'rms_delete_item_option');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append('id', optionId);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                await loadOptions();
            }
        } catch (error) {
            console.error('Delete option error:', error);
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
            zIndex: 100000
        }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Manage Options: {item.name}</h2>
                    <button onClick={onClose} style={{ 
                        background: 'none', 
                        border: 'none', 
                        fontSize: '24px', 
                        cursor: 'pointer' 
                    }}>×</button>
                </div>

                {/* Add New Option */}
                <div style={{ 
                    background: '#f5f5f5', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    marginBottom: '20px' 
                }}>
                    <h3>Add New Option</h3>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        <select
                            value={newOption.option_type}
                            onChange={(e) => setNewOption({ ...newOption, option_type: e.target.value })}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="extras">Extras</option>
                            <option value="size">Size</option>
                            <option value="crust">Crust Type</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Option name (e.g., Extra Cheese)"
                            value={newOption.option_name}
                            onChange={(e) => setNewOption({ ...newOption, option_name: e.target.value })}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Additional price"
                            value={newOption.option_price}
                            onChange={(e) => setNewOption({ ...newOption, option_price: e.target.value })}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <button
                            className="button button-primary"
                            onClick={handleAddOption}
                            disabled={loading}
                        >
                            Add Option
                        </button>
                    </div>
                </div>

                {/* Existing Options */}
                {!options || Object.keys(options).length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666' }}>No options yet. Add one above!</p>
                ) : (
                    Object.entries(options).map(([type, opts]) => {
                        if (!Array.isArray(opts)) {
                            console.error('Expected array for type:', type, 'but got:', opts);
                            return null;
                        }
                        
                        return (
                            <div key={type} style={{ marginBottom: '20px' }}>
                                <h4 style={{ 
                                    textTransform: 'capitalize', 
                                    borderBottom: '2px solid #ddd', 
                                    paddingBottom: '8px' 
                                }}>
                                    {type}
                                </h4>
                                {opts.map(opt => (
                                    <div key={opt.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px',
                                        background: '#fafafa',
                                        borderRadius: '4px',
                                        marginBottom: '8px'
                                    }}>
                                        <span>{opt.option_name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontWeight: 'bold' }}>
                                                +${parseFloat(opt.option_price).toFixed(2)}
                                            </span>
                                            <button
                                                className="button button-small"
                                                onClick={() => handleDeleteOption(opt.id)}
                                                style={{ color: '#b32d2e' }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default ItemOptionsModal;