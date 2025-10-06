import { useState, useEffect } from '@wordpress/element';
import { useTranslation } from '../hooks/useTranslation';

function QRCodesApp() {
    const { t } = useTranslation();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [tableNumber, setTableNumber] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadTables();
    }, []);

    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const loadTables = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('action', 'rms_get_tables');
        formData.append('nonce', window.rmsAdmin.nonce);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                setTables(data.data);
            } else {
                console.error('Failed to load tables:', data);
            }
        } catch (error) {
            console.error('Load error:', error);
            setMessage({ type: 'error', text: t('qrcodes.load_error') });
        }
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!tableNumber.trim()) {
            setMessage({ type: 'error', text: t('qrcodes.number_required') });
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('action', 'rms_add_table');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append('table_number', tableNumber);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: t('qrcodes.add_success') });
                setShowForm(false);
                setTableNumber('');
                await loadTables();
            } else {
                setMessage({ type: 'error', text: data.data || t('qrcodes.add_error') });
            }
        } catch (error) {
            console.error('Add error:', error);
            setMessage({ type: 'error', text: t('qrcodes.add_error') });
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm(t('qrcodes.delete_confirm'))) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('action', 'rms_delete_table');
        formData.append('nonce', window.rmsAdmin.nonce);
        formData.append('id', id);

        try {
            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: t('qrcodes.delete_success') });
                await loadTables();
            } else {
                setMessage({ type: 'error', text: t('qrcodes.delete_error') });
            }
        } catch (error) {
            console.error('Delete error:', error);
            setMessage({ type: 'error', text: t('qrcodes.delete_error') });
        }
        setLoading(false);
    };

    const handlePrint = (table) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${t('qrcodes.table')} ${table.table_number}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                    }
                    .qr-container {
                        text-align: center;
                        border: 3px solid #333;
                        padding: 30px;
                        border-radius: 10px;
                        background: white;
                    }
                    h1 {
                        margin: 0 0 20px 0;
                        font-size: 36px;
                    }
                    .table-number {
                        font-size: 48px;
                        font-weight: bold;
                        color: #2271b1;
                        margin: 20px 0;
                    }
                    img {
                        max-width: 300px;
                        margin: 20px 0;
                    }
                    .instructions {
                        margin-top: 20px;
                        font-size: 18px;
                        color: #666;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <h1>Restaurant Menu</h1>
                    <div class="table-number">${t('qrcodes.table')} ${table.table_number}</div>
                    <img src="${table.qr_code}" alt="QR Code" />
                    <div class="instructions">${t('qrcodes.scan_instruction')}</div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0 }}>{t('qrcodes.title')}</h1>
                {!showForm && (
                    <button 
                        className="button button-primary"
                        onClick={() => setShowForm(true)}
                        disabled={loading}
                    >
                        {t('qrcodes.add_new_table')}
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
                    <h2 style={{ marginTop: 0 }}>{t('qrcodes.add_new_table')}</h2>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            {t('qrcodes.table_number')} *
                        </label>
                        <input
                            type="text"
                            className="regular-text"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            placeholder="1, 2, 3, A1, VIP-1..."
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="button button-primary"
                            onClick={handleAdd}
                            disabled={loading}
                        >
                            {loading ? t('common.saving') : t('common.save')}
                        </button>
                        <button
                            className="button"
                            onClick={() => {
                                setShowForm(false);
                                setTableNumber('');
                            }}
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
                {loading && tables.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        {t('common.loading')}...
                    </div>
                ) : tables.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        {t('qrcodes.no_tables')}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {tables.map(table => (
                            <div key={table.id} style={{
                                padding: '20px',
                                border: '2px solid #ddd',
                                borderRadius: '12px',
                                textAlign: 'center',
                                background: '#fafafa'
                            }}>
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    marginBottom: '15px',
                                    color: '#2271b1'
                                }}>
                                    {t('qrcodes.table')} {table.table_number}
                                </div>
                                <div style={{
                                    background: 'white',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    marginBottom: '15px'
                                }}>
                                    <img 
                                        src={table.qr_code} 
                                        alt={`QR Code for table ${table.table_number}`}
                                        style={{ 
                                            width: '100%',
                                            maxWidth: '200px',
                                            height: 'auto'
                                        }} 
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button
                                        className="button button-primary"
                                        onClick={() => handlePrint(table)}
                                        disabled={loading}
                                        style={{ width: '100%' }}
                                    >
                                        🖨️ {t('qrcodes.print_qr')}
                                    </button>
                                    <button
                                        className="button button-link-delete"
                                        onClick={() => handleDelete(table.id)}
                                        disabled={loading}
                                        style={{ width: '100%', color: '#b32d2e' }}
                                    >
                                        {t('common.delete')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default QRCodesApp;