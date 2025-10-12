import { useState, useEffect } from '@wordpress/element';

function ItemDetailModal({ item, onClose, onAddToCart }) {
    const [options, setOptions] = useState({});
    const [selectedOptions, setSelectedOptions] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [totalPrice, setTotalPrice] = useState(parseFloat(item.price));

    useEffect(() => {
        loadOptions();
    }, [item.id]);

    useEffect(() => {
        calculateTotal();
    }, [selectedOptions, quantity]);

    const loadOptions = async () => {
        const formData = new FormData();
        formData.append('action', 'rms_get_item_options');
        formData.append('item_id', item.id);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                setOptions(data.data || {});
            }
        } catch (error) {
            console.error('Load options error:', error);
        }
    };

    const calculateTotal = () => {
        let optionsTotal = 0;
        Object.values(selectedOptions).forEach(option => {
            optionsTotal += parseFloat(option.option_price);
        });
        setTotalPrice((parseFloat(item.price) + optionsTotal) * quantity);
    };

    const handleOptionToggle = (option) => {
        setSelectedOptions(prev => {
            const key = `${option.option_type}-${option.id}`;
            if (prev[key]) {
                const newSelected = { ...prev };
                delete newSelected[key];
                return newSelected;
            } else {
                return { ...prev, [key]: option };
            }
        });
    };

    const handleAddToCart = () => {
        onAddToCart({
            ...item,
            selectedOptions: Object.values(selectedOptions),
            quantity,
            totalPrice
        });
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative'
            }}>
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '35px',
                        height: '35px',
                        fontSize: '20px',
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                >
                    ×
                </button>

                {/* Image */}
                {item.image && (
                    <img 
                        src={item.image} 
                        alt={item.name}
                        style={{
                            width: '100%',
                            height: '300px',
                            objectFit: 'cover',
                            borderRadius: '16px 16px 0 0'
                        }}
                    />
                )}

                <div style={{ padding: '30px' }}>
                    {/* Title & Price */}
                    <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>{item.name}</h2>
                        <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
                            {item.description}
                        </p>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60', marginTop: '10px' }}>
                            ${parseFloat(item.price).toFixed(2)}
                        </div>
                    </div>

                    {/* Allergens */}
                    {item.allergens && (
                        <div style={{
                            background: '#fff3cd',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            fontSize: '14px',
                            color: '#856404'
                        }}>
                            <strong>⚠️ Allergens:</strong> {item.allergens}
                        </div>
                    )}

                    {/* Options */}
                    {Object.keys(options).length > 0 && (
                        <div style={{ marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '20px', marginBottom: '15px' }}>Customize Your Order</h3>
                            {Object.entries(options).map(([type, opts]) => {
                                if (!Array.isArray(opts)) return null;
                                
                                return (
                                    <div key={type} style={{ marginBottom: '20px' }}>
                                        <h4 style={{
                                            fontSize: '16px',
                                            textTransform: 'capitalize',
                                            marginBottom: '10px',
                                            color: '#333'
                                        }}>
                                            {type}
                                        </h4>
                                        {opts.map(opt => {
                                            const key = `${opt.option_type}-${opt.id}`;
                                            const isSelected = !!selectedOptions[key];
                                            
                                            return (
                                                <label
                                                    key={opt.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '12px',
                                                        background: isSelected ? '#e8f5e9' : '#f5f5f5',
                                                        border: isSelected ? '2px solid #27ae60' : '2px solid transparent',
                                                        borderRadius: '8px',
                                                        marginBottom: '8px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleOptionToggle(opt)}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                        <span>{opt.option_name}</span>
                                                    </div>
                                                    <span style={{ fontWeight: 'bold', color: '#27ae60' }}>
                                                        +${parseFloat(opt.option_price).toFixed(2)}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Quantity */}
                    <div style={{ marginBottom: '25px' }}>
                        <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>Quantity</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    background: 'white',
                                    fontSize: '20px',
                                    cursor: 'pointer'
                                }}
                            >
                                -
                            </button>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>
                                {quantity}
                            </span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    background: 'white',
                                    fontSize: '20px',
                                    cursor: 'pointer'
                                }}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <span>Add to Cart</span>
                        <span>${totalPrice.toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ItemDetailModal;