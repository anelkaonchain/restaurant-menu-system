<?php
/**
 * Template Name: Restaurant Menu
 * Description: Public-facing digital menu template
 */

// Get all menu items grouped by category
function rms_get_grouped_menu_items() {
    $categories = get_terms(array(
        'taxonomy' => 'rms_category',
        'hide_empty' => true,
    ));
    
    $menu_data = array();
    
    foreach ($categories as $category) {
        $args = array(
            'post_type' => 'rms_menu_item',
            'posts_per_page' => -1,
            'tax_query' => array(
                array(
                    'taxonomy' => 'rms_category',
                    'field' => 'term_id',
                    'terms' => $category->term_id,
                ),
            ),
            'orderby' => 'title',
            'order' => 'ASC',
        );
        
        $query = new WP_Query($args);
        $items = array();
        
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            
            $items[] = array(
                'id' => $post_id,
                'name' => get_the_title(),
                'description' => get_the_content(),
                'price' => get_post_meta($post_id, '_rms_price', true),
                'allergens' => get_post_meta($post_id, '_rms_allergens', true),
                'image' => get_post_meta($post_id, '_rms_image', true),
            );
        }
        wp_reset_postdata();
        
        if (!empty($items)) {
            $menu_data[] = array(
                'category' => $category->name,
                'items' => $items,
            );
        }
    }
    
    return $menu_data;
}

$menu_data = rms_get_grouped_menu_items();
$restaurant_name = get_bloginfo('name');
$table_number = isset($_GET['table']) ? sanitize_text_field($_GET['table']) : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html($restaurant_name); ?> - Menu</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            padding-bottom: 100px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 20px 20px 0 0;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            position: relative;
        }
        
        .header h1 {
            color: #333;
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666;
            font-size: 16px;
        }
        
        .call-waiter-btn {
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 15px;
            transition: all 0.3s;
        }
        
        .call-waiter-btn:hover {
            background: #ee5a52;
            transform: translateY(-2px);
        }
        
        .call-waiter-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .language-selector {
            position: absolute;
            top: 20px;
            right: 20px;
        }
        
        .language-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .language-dropdown {
            position: absolute;
            top: 50px;
            right: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            min-width: 200px;
            max-height: 400px;
            overflow-y: auto;
            display: none;
            z-index: 1000;
        }
        
        .language-dropdown.active {
            display: block;
        }
        
        .language-option {
            padding: 12px 20px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
            transition: background 0.2s;
        }
        
        .language-option:hover {
            background: #f8f9fa;
        }
        
        .language-option.selected {
            background: #667eea;
            color: white;
        }
        
        .language-option:last-child {
            border-bottom: none;
        }
        
        .menu-content {
            background: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .category {
            padding: 30px;
            border-bottom: 1px solid #eee;
        }
        
        .category:last-child {
            border-bottom: none;
        }
        
        .category-title {
            font-size: 24px;
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        
        .menu-item {
            padding: 20px 0;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: background 0.2s;
            display: flex;
            gap: 15px;
        }
        
        .menu-item:hover {
            background: #f8f9fa;
            margin: 0 -10px;
            padding: 20px 10px;
            border-radius: 8px;
        }
        
        .menu-item:last-child {
            border-bottom: none;
        }
        
        .item-image {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 8px;
            flex-shrink: 0;
        }
        
        .item-content {
            flex: 1;
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .item-name {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            flex: 1;
        }
        
        .item-price {
            font-size: 20px;
            font-weight: bold;
            color: #27ae60;
            margin-left: 15px;
        }
        
        .item-description {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        
        .item-allergens {
            display: inline-block;
            background: #fff3cd;
            color: #856404;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            margin-top: 8px;
        }
        
        .cart-badge {
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: #667eea;
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer;
            z-index: 1000;
        }
        
        .cart-count {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #e74c3c;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        }
        
        .checkout-btn {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            border: none;
            padding: 18px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: none;
            z-index: 1000;
        }
        
        .checkout-btn.active {
            display: block;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            z-index: 2000;
            padding: 20px;
            overflow-y: auto;
        }
        
        .modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background: white;
            border-radius: 20px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            padding: 30px;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .close-btn {
            font-size: 30px;
            cursor: pointer;
            color: #999;
        }
        
        .cart-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .quantity-controls {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .qty-btn {
            width: 30px;
            height: 30px;
            border: none;
            background: #667eea;
            color: white;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
        }
        
        .submit-btn {
            width: 100%;
            background: #27ae60;
            color: white;
            border: none;
            padding: 15px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
        }
        
        .empty-cart {
            text-align: center;
            padding: 40px;
            color: #999;
        }
        
        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            min-width: 300px;
            animation: slideIn 0.3s ease-out;
        }
        
        .notification.success {
            border-left: 4px solid #51cf66;
        }
        
        .notification.info {
            border-left: 4px solid #4c6ef5;
        }
        
        .notification.warning {
            border-left: 4px solid #ffd43b;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .order-status-tracker {
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 300px;
            display: none;
            z-index: 1500;
        }
        
        .order-status-tracker.active {
            display: block;
        }
        
        .status-step {
            padding: 10px;
            margin: 5px 0;
            border-radius: 6px;
            font-weight: 600;
        }
        
        .status-step.completed {
            background: #d3f9d8;
            color: #2b8a3e;
        }
        
        .status-step.active {
            background: #fff3bf;
            color: #e67700;
        }
        
        .status-step.pending {
            background: #f1f3f5;
            color: #868e96;
        }
        
        @media (max-width: 600px) {
            body {
                padding: 10px;
                padding-bottom: 100px;
            }
            
            .header {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .category {
                padding: 20px;
            }
            
            .category-title {
                font-size: 20px;
            }
            
            .menu-item {
                flex-direction: column;
            }
            
            .item-image {
                width: 100%;
                height: 200px;
            }
            
            .item-header {
                flex-direction: row;
            }
            
            .item-price {
                margin-left: 0;
            }
            
            .language-selector {
                position: static;
                margin-top: 15px;
            }
            
            .language-btn {
                width: 100%;
                justify-content: center;
            }
            
            .order-status-tracker {
                left: 10px;
                right: 10px;
                bottom: 90px;
                min-width: auto;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="language-selector">
                <button class="language-btn" onclick="toggleLanguageDropdown()">
                    🌍 <span id="currentLanguage">English</span>
                </button>
                <div class="language-dropdown" id="languageDropdown"></div>
            </div>
            
            <h1><?php echo esc_html($restaurant_name); ?></h1>
            <p>📱 Digital Menu <?php if($table_number) echo '- Table ' . esc_html($table_number); ?></p>
            
            <?php if ($table_number): ?>
                <button class="call-waiter-btn" id="callWaiterBtn">📞 Call Waiter</button>
            <?php endif; ?>
        </div>
        
        <div class="menu-content">
            <?php if (empty($menu_data)): ?>
                <div style="padding: 60px 30px; text-align: center; color: #999;">
                    <h2 style="color: #999; margin-bottom: 10px;">Menu Coming Soon</h2>
                    <p>We're preparing our delicious offerings for you!</p>
                </div>
            <?php else: ?>
                <?php foreach ($menu_data as $section): ?>
                    <div class="category">
                        <h2 class="category-title"><?php echo esc_html($section['category']); ?></h2>
                        
                        <?php foreach ($section['items'] as $item): ?>
                            <div class="menu-item" onclick="addToCart(<?php echo htmlspecialchars(json_encode($item)); ?>)">
                                <?php if (!empty($item['image'])): ?>
                                    <img src="<?php echo esc_url($item['image']); ?>" alt="<?php echo esc_attr($item['name']); ?>" class="item-image">
                                <?php endif; ?>
                                
                                <div class="item-content">
                                    <div class="item-header">
                                        <div class="item-name"><?php echo esc_html($item['name']); ?></div>
                                        <div class="item-price">$<?php echo esc_html(number_format($item['price'], 2)); ?></div>
                                    </div>
                                    
                                    <?php if (!empty($item['description'])): ?>
                                        <div class="item-description"><?php echo esc_html($item['description']); ?></div>
                                    <?php endif; ?>
                                    
                                    <?php if (!empty($item['allergens'])): ?>
                                        <div class="item-allergens">
                                            ⚠️ Contains: <?php echo esc_html($item['allergens']); ?>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
    
    <div class="cart-badge" onclick="toggleCart()" id="cartBadge" style="display: none;">
        🛒
        <span class="cart-count" id="cartCount">0</span>
    </div>
    
    <button class="checkout-btn" id="checkoutBtn" onclick="toggleCart()">
        View Cart & Checkout
    </button>
    
    <div class="order-status-tracker" id="orderStatusTracker">
        <h3 style="margin-bottom: 15px;">Order Status</h3>
        <div class="status-step pending" id="statusPending">⏳ Pending</div>
        <div class="status-step pending" id="statusPreparing">👨‍🍳 Preparing</div>
        <div class="status-step pending" id="statusReady">✅ Ready</div>
        <div class="status-step pending" id="statusDelivered">🎉 Delivered</div>
    </div>
    
    <div class="modal" id="cartModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Your Order</h2>
                <span class="close-btn" onclick="toggleCart()">&times;</span>
            </div>
            
            <div id="cartItems"></div>
            
            <div id="checkoutForm" style="display: none;">
                <hr style="margin: 20px 0;">
                <div class="form-group">
                    <label>Your Name (Optional)</label>
                    <input type="text" id="customerName" placeholder="Enter your name">
                </div>
                <div class="form-group">
                    <label>Special Requests (Optional)</label>
                    <textarea id="orderNotes" rows="3" placeholder="Any special requests?"></textarea>
                </div>
                <div style="font-size: 24px; font-weight: bold; text-align: right; margin: 20px 0;">
                    Total: $<span id="totalPrice">0.00</span>
                </div>
                <button class="submit-btn" onclick="submitOrder()">Place Order</button>
            </div>
            
            <div id="successMessage" style="display: none;">
                <div class="success-message">
                    <h3>✓ Order Submitted!</h3>
                    <p>Your order has been received. We'll prepare it shortly.</p>
                    <button class="submit-btn" onclick="closeAndReset()" style="margin-top: 20px;">Close</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let cart = [];
        const tableNumber = '<?php echo esc_js($table_number); ?>';
        let currentLanguage = 'en';
        let menuData = <?php echo json_encode($menu_data); ?>;
        let currentOrderId = localStorage.getItem('currentOrderId_' + tableNumber);
        
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
        
        // Initialize language dropdown
        window.onload = function() {
            const dropdown = document.getElementById('languageDropdown');
            let html = '';
            for (const [code, name] of Object.entries(languages)) {
                html += `<div class="language-option ${code === 'en' ? 'selected' : ''}" onclick="changeLanguage('${code}')">${name}</div>`;
            }
            dropdown.innerHTML = html;
            
            // Start order tracking if order exists
            if (currentOrderId) {
                startOrderTracking();
            }
        };
        
        function toggleLanguageDropdown() {
            document.getElementById('languageDropdown').classList.toggle('active');
        }
        
        async function changeLanguage(langCode) {
            currentLanguage = langCode;
            document.getElementById('currentLanguage').textContent = languages[langCode];
            document.getElementById('languageDropdown').classList.remove('active');
            
            // Update selected state
            document.querySelectorAll('.language-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            event.target.classList.add('selected');
            
            // Load menu in selected language
            if (langCode === 'en') {
                renderMenu(menuData);
            } else {
                try {
                    const url = '<?php echo admin_url('admin-ajax.php'); ?>?action=rms_get_menu_by_language&lang=' + langCode;
                    const response = await fetch(url);
                    const data = await response.json();
                    if (data.success) {
                        renderMenu(data.data);
                    }
                } catch (error) {
                    console.error('Error loading language:', error);
                }
            }
        }
        
        function renderMenu(data) {
            const menuContent = document.querySelector('.menu-content');
            if (!data || data.length === 0) {
                menuContent.innerHTML = '<div style="padding: 60px 30px; text-align: center; color: #999;"><h2>Menu Coming Soon</h2></div>';
                return;
            }
            
            let html = '';
            data.forEach(section => {
                html += `<div class="category"><h2 class="category-title">${section.category}</h2>`;
                section.items.forEach(item => {
                    html += `
                        <div class="menu-item" onclick='addToCart(${JSON.stringify(item).replace(/'/g, "\\'")})'> 
                            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="item-image">` : ''}
                            <div class="item-content">
                                <div class="item-header">
                                    <div class="item-name">${item.name}</div>
                                    <div class="item-price">$${parseFloat(item.price).toFixed(2)}</div>
                                </div>
                                ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                                ${item.allergens ? `<div class="item-allergens">⚠️ Contains: ${item.allergens}</div>` : ''}
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            });
            menuContent.innerHTML = html;
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const selector = document.querySelector('.language-selector');
            if (selector && !selector.contains(event.target)) {
                document.getElementById('languageDropdown').classList.remove('active');
            }
        });
        
        function addToCart(item) {
            const existingItem = cart.find(i => i.id === item.id);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({...item, quantity: 1});
            }
            updateCart();
            showNotification('Added to cart: ' + item.name, 'success');
        }
        
        function removeFromCart(itemId) {
            cart = cart.filter(item => item.id !== itemId);
            updateCart();
        }
        
        function updateQuantity(itemId, change) {
            const item = cart.find(i => i.id === itemId);
            if (item) {
                item.quantity += change;
                if (item.quantity <= 0) {
                    removeFromCart(itemId);
                } else {
                    updateCart();
                }
            }
        }
        
        function updateCart() {
            const count = cart.reduce((sum, item) => sum + item.quantity, 0);
            document.getElementById('cartCount').textContent = count;
            document.getElementById('cartBadge').style.display = count > 0 ? 'flex' : 'none';
            document.getElementById('checkoutBtn').className = count > 0 ? 'checkout-btn active' : 'checkout-btn';
            
            renderCart();
        }
        
        function renderCart() {
            const cartItems = document.getElementById('cartItems');
            const checkoutForm = document.getElementById('checkoutForm');
            
            if (cart.length === 0) {
                cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
                checkoutForm.style.display = 'none';
                return;
            }
            
            checkoutForm.style.display = 'block';
            
            let total = 0;
            let html = '';
            
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                html += `
                    <div class="cart-item">
                        <div>
                            <div style="font-weight: 600;">${item.name}</div>
                            <div style="color: #666; font-size: 14px;">$${item.price} each</div>
                        </div>
                        <div class="quantity-controls">
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span style="min-width: 30px; text-align: center; font-weight: 600;">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                            <span style="margin-left: 15px; font-weight: 600;">$${itemTotal.toFixed(2)}</span>
                        </div>
                    </div>
                `;
            });
            
            cartItems.innerHTML = html;
            document.getElementById('totalPrice').textContent = total.toFixed(2);
        }
        
        function toggleCart() {
            const modal = document.getElementById('cartModal');
            modal.classList.toggle('active');
            if (modal.classList.contains('active')) {
                renderCart();
            }
        }
        
        async function submitOrder() {
            if (!tableNumber) {
                alert('Table number is required!');
                return;
            }
            
            const customerName = document.getElementById('customerName').value;
            const notes = document.getElementById('orderNotes').value;
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const formData = new FormData();
            formData.append('action', 'rms_submit_order');
            formData.append('table_number', tableNumber);
            formData.append('customer_name', customerName);
            formData.append('notes', notes);
            formData.append('total_price', total);
            formData.append('items', JSON.stringify(cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            }))));
            
            try {
                const response = await fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    currentOrderId = data.data.order_id;
                    localStorage.setItem('currentOrderId_' + tableNumber, currentOrderId);
                    
                    document.getElementById('cartItems').style.display = 'none';
                    document.getElementById('checkoutForm').style.display = 'none';
                    document.getElementById('successMessage').style.display = 'block';
                    
                    showNotification('Order placed successfully!', 'success');
                    startOrderTracking();
                } else {
                    alert('Failed to submit order. Please try again.');
                }
            } catch (error) {
                alert('Error submitting order. Please try again.');
            }
        }
        
        function closeAndReset() {
            cart = [];
            updateCart();
            toggleCart();
            document.getElementById('cartItems').style.display = 'block';
            document.getElementById('checkoutForm').style.display = 'none';
            document.getElementById('successMessage').style.display = 'none';
            document.getElementById('customerName').value = '';
            document.getElementById('orderNotes').value = '';
        }
        
        // Call waiter function
        document.getElementById('callWaiterBtn')?.addEventListener('click', async function() {
            const originalText = this.textContent;
            this.textContent = '⏳ Calling...';
            
            try {
                const formData = new FormData();
                formData.append('action', 'rms_call_waiter');
                formData.append('table_number', tableNumber);

                const response = await fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                
                if (data.success) {
                    showNotification('Waiter has been called! Please wait.', 'success');
                    this.textContent = '✓ Waiter Called';
                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 3000);
                } else {
                    showNotification('Failed to call waiter', 'warning');
                    this.textContent = originalText;
                }
            } catch (error) {
                console.error('Error calling waiter:', error);
                showNotification('Error calling waiter', 'warning');
                this.textContent = originalText;
            }
        });
        
        // Notification system
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
        
        // Order tracking
        function startOrderTracking() {
            if (!currentOrderId) return;

            document.getElementById('orderStatusTracker').classList.add('active');
            
            const checkStatus = async () => {
                try {
                    const response = await fetch('<?php echo admin_url('admin-ajax.php'); ?>?action=rms_get_order_status&order_id=' + currentOrderId);
                    const data = await response.json();
                    
                    if (data.success) {
                        updateOrderStatus(data.data.status);
                    }
                } catch (error) {
                    console.error('Error checking order status:', error);
                }
            };

            // Check every 10 seconds
            setInterval(checkStatus, 10000);
            checkStatus();
        }

        let lastNotifiedStatus = null; // Yeni değişken ekleyin (script başına)

function updateOrderStatus(status) {
    // Reset all statuses
    document.querySelectorAll('.status-step').forEach(el => {
        el.className = 'status-step pending';
    });

    // Update based on current status
    if (status === 'pending') {
        document.getElementById('statusPending').className = 'status-step active';
    } else if (status === 'preparing') {
        document.getElementById('statusPending').className = 'status-step completed';
        document.getElementById('statusPreparing').className = 'status-step active';
        
        // Sadece durum değiştiyse bildirim göster
        if (lastNotifiedStatus !== 'preparing') {
            showNotification('Your order is being prepared!', 'info');
            lastNotifiedStatus = 'preparing';
        }
    } else if (status === 'ready') {
        document.getElementById('statusPending').className = 'status-step completed';
        document.getElementById('statusPreparing').className = 'status-step completed';
        document.getElementById('statusReady').className = 'status-step active';
        
        if (lastNotifiedStatus !== 'ready') {
            showNotification('Your order is ready!', 'success');
            lastNotifiedStatus = 'ready';
        }
    } else if (status === 'delivered') {
        document.getElementById('statusPending').className = 'status-step completed';
        document.getElementById('statusPreparing').className = 'status-step completed';
        document.getElementById('statusReady').className = 'status-step completed';
        document.getElementById('statusDelivered').className = 'status-step active';
        
        if (lastNotifiedStatus !== 'delivered') {
            showNotification('Enjoy your meal!', 'success');
            lastNotifiedStatus = 'delivered';
        }
        
        localStorage.removeItem('currentOrderId_' + tableNumber);
        setTimeout(() => {
            document.getElementById('orderStatusTracker').classList.remove('active');
        }, 5000);
    }
}
    </script>
</body>
</html>