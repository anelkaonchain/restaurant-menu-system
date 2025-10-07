import { useState, useEffect } from '@wordpress/element';

const translations = {
    en: {
        common: {
            add_new: "Add New",
            edit: "Edit",
            delete: "Delete",
            save: "Save",
            cancel: "Cancel",
            loading: "Loading...",
            name: "Name",
            description: "Description",
            price: "Price",
            actions: "Actions",
            translate: "Translate"
        },
        menu_items: {
            title: "Restaurant Menu",
            add_new_item: "Add New Item",
            item_name: "Item Name",
            item_price: "Price ($)",
            allergens: "Allergens",
            category: "Category",
            select_category: "Select a category",
            item_image: "Item Image",
            remove_image: "Remove Image"
        },
        categories: {
            title: "Menu Categories",
            add_new_category: "Add New Category",
            category_name: "Category Name",
            slug: "Slug",
            count: "Count",
            items: "items"
        },
        orders: {
            title: "Orders",
            all: "All",
            pending: "Pending",
            preparing: "Preparing",
            ready: "Ready",
            delivered: "Delivered",
            cancelled: "Cancelled",
            order: "Order",
            table: "Table",
            customer_name: "Customer Name",
            items: "Items",
            notes: "Notes",
            total: "Total",
            start_preparing: "Start Preparing",
            mark_ready: "Mark Ready",
            mark_delivered: "Mark Delivered",
            confirm_delete: "Are you sure?",
            no_orders: "No orders found"
        },
        qrcodes: {
            title: "QR Codes",
            add_new_table: "Add New Table",
            table_number: "Table Number"
        },
        settings: {
            title: "Settings",
            application_language: "Application Language",
            admin_panel_language: "Admin Panel Language"
        }
    },
    tr: {
        common: {
            add_new: "Yeni Ekle",
            edit: "Düzenle",
            delete: "Sil",
            save: "Kaydet",
            cancel: "İptal",
            loading: "Yükleniyor...",
            name: "İsim",
            description: "Açıklama",
            price: "Fiyat",
            actions: "İşlemler",
            translate: "Çevir"
        },
        menu_items: {
            title: "Restoran Menüsü",
            add_new_item: "Yeni Ürün Ekle",
            item_name: "Ürün Adı",
            item_price: "Fiyat ($)",
            allergens: "Alerjenler",
            category: "Kategori",
            select_category: "Bir kategori seçin",
            item_image: "Ürün Görseli",
            remove_image: "Görseli Kaldır"
        },
        categories: {
            title: "Menü Kategorileri",
            add_new_category: "Yeni Kategori Ekle",
            category_name: "Kategori Adı",
            slug: "Slug",
            count: "Adet",
            items: "ürün"
        },
        orders: {
            title: "Siparişler",
            all: "Tümü",
            pending: "Bekliyor",
            preparing: "Hazırlanıyor",
            ready: "Hazır",
            delivered: "Teslim Edildi",
            cancelled: "İptal Edildi",
            order: "Sipariş",
            table: "Masa",
            customer_name: "Müşteri Adı",
            items: "Ürünler",
            notes: "Notlar",
            total: "Toplam",
            start_preparing: "Hazırlamaya Başla",
            mark_ready: "Hazır Olarak İşaretle",
            mark_delivered: "Teslim Edildi Olarak İşaretle",
            confirm_delete: "Emin misiniz?",
            no_orders: "Sipariş bulunamadı"
        },
        qrcodes: {
            title: "QR Kodları",
            add_new_table: "Yeni Masa Ekle",
            table_number: "Masa Numarası"
        },
        settings: {
            title: "Ayarlar",
            application_language: "Uygulama Dili",
            admin_panel_language: "Yönetim Paneli Dili"
        }
    }
};

function useTranslation() {
    const [currentLang, setCurrentLang] = useState('en');

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const formData = new FormData();
            formData.append('action', 'rms_get_settings');
            formData.append('nonce', window.rmsAdmin.nonce);

            const response = await fetch(window.rmsAdmin.ajaxUrl, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            if (data.success && data.data.admin_language) {
                setCurrentLang(data.data.admin_language);
            }
        } catch (error) {
            console.error('Failed to load language:', error);
        }
    };

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[currentLang];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                value = translations['en'];
                for (const k of keys) {
                    if (value && value[k]) {
                        value = value[k];
                    } else {
                        return key;
                    }
                }
                return value;
            }
        }
        
        return value;
    };

    return { t, language: currentLang };
}


export default useTranslation;
export { useTranslation };