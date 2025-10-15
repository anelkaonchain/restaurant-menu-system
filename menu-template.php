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
        'meta_key' => 'display_order',
        'orderby' => 'meta_value_num',
        'order' => 'ASC',
    ));
    
    if (empty($categories) || is_wp_error($categories)) {
        return array();
    }
    
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
            
            global $wpdb;
            $options_table = $wpdb->prefix . 'rms_item_options';
            $options = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $options_table WHERE item_id = %d ORDER BY option_name",
                $post_id
            ), ARRAY_A);
            
            $items[] = array(
                'id' => $post_id,
                'name' => get_the_title(),
                'description' => get_the_content(),
                'price' => get_post_meta($post_id, '_rms_price', true),
                'discounted_price' => get_post_meta($post_id, '_rms_discounted_price', true),
                'allergens' => get_post_meta($post_id, '_rms_allergens', true),
                'image' => get_post_meta($post_id, '_rms_image', true),
                'options' => $options,
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
        
        /* ARAMA KUTUSU STİLLERİ */
        .search-container {
            padding: 20px 30px;
            background: white;
            border-bottom: 1px solid #eee;
        }
        
        /* KATEGORİ NAVİGASYONU */
        .category-nav {
            background: white;
            padding: 15px 0;
            border-bottom: 2px solid #eee;
            position: sticky;
            top: 0;
            z-index: 999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .category-nav-scroll {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding: 0 30px 10px 30px;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #667eea #f0f0f0;
        }
        
        .category-nav-scroll::-webkit-scrollbar {
            height: 6px;
        }
        
        .category-nav-scroll::-webkit-scrollbar-track {
            background: #f0f0f0;
            border-radius: 10px;
        }
        
        .category-nav-scroll::-webkit-scrollbar-thumb {
            background: #667eea;
            border-radius: 10px;
        }
        
        .category-nav-item {
            flex-shrink: 0;
            padding: 10px 20px;
            background: #f8f9fa;
            border: 2px solid transparent;
            border-radius: 25px;
            font-size: 15px;
            font-weight: 600;
            color: #666;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
        }
        
        .category-nav-item:hover {
            background: #e8ebff;
            color: #667eea;
            border-color: #667eea;
            transform: translateY(-2px);
        }
        
        .category-nav-item.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-color: #667eea;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        /* SEPET ÖZETİ KARTI */
        .cart-summary-card {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            width: 380px;
            max-height: calc(100vh - 40px);
            z-index: 1500;
            display: none;
            overflow: hidden;
            animation: slideInFromRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            display: flex;
            flex-direction: column;
        }

        @keyframes slideInFromRight {
            from {
                transform: translateX(400px) scale(0.8);
                opacity: 0;
            }
            to {
                transform: translateX(0) scale(1);
                opacity: 1;
            }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
        
        .cart-summary-card.visible {
            display: block;
        }
        
        .cart-summary-card.shake {
            animation: shake 0.5s ease-in-out;
        }

        .cart-summary-card.minimized {
            height: auto;
            max-height: 80px;
        }
        
        .cart-summary-card.minimized .cart-summary-items,
        .cart-summary-card.minimized .cart-summary-footer {
            display: none;
        }
        
        .cart-summary-minimize {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            margin-right: 8px;
        }
        
        .cart-summary-minimize:hover {
            background: rgba(255,255,255,0.3);
        }
        
        .cart-summary-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .cart-summary-title {
            font-size: 18px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .cart-summary-close {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }
        
        .cart-summary-close:hover {
            background: rgba(255,255,255,0.3);
            transform: rotate(90deg);
        }
        
        .cart-summary-items {
            max-height: none;
            overflow-y: visible;
            padding: 15px;
            flex-shrink: 0;
        }
        
        .cart-summary-items::-webkit-scrollbar {
            width: 6px;
        }
        
        .cart-summary-items::-webkit-scrollbar-track {
            background: #f0f0f0;
        }
        
        .cart-summary-items::-webkit-scrollbar-thumb {
            background: #667eea;
            border-radius: 10px;
        }
        
        .cart-summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 10px;
            transition: all 0.2s;
        }
        
        .cart-summary-item:hover {
            background: #e8ebff;
            transform: translateX(-5px);
        }
        
        .cart-summary-item-info {
            flex: 1;
        }
        
        .cart-summary-item-name {
            font-weight: 600;
            color: #333;
            font-size: 14px;
            margin-bottom: 4px;
        }
        
        .cart-summary-item-qty {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .cart-summary-item-price {
            font-weight: bold;
            color: #27ae60;
            font-size: 16px;
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .cart-summary-footer {
            padding: 15px 20px;
            border-top: 2px solid #eee;
        }

        .cart-summary-checkout {
            padding: 15px 20px;
            border-top: 2px solid #eee;
            background: #f8f9fa;
        }
        
        .cart-summary-form-group {
            margin-bottom: 12px;
        }
        
        .cart-summary-form-group label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #333;
            margin-bottom: 6px;
        }
        
        .cart-summary-form-group input,
        .cart-summary-form-group textarea {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s;
            font-family: inherit;
        }
        
        .cart-summary-form-group input:focus,
        .cart-summary-form-group textarea:focus {
            outline: none;
            border-color: #667eea;
            background: white;
        }
        
        .cart-summary-form-group textarea {
            resize: none;
            min-height: 60px;
        }
        
        .cart-summary-submit-btn {
            width: 100%;
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            color: white;
            border: none;
            padding: 14px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .cart-summary-submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
        }
        
        .cart-summary-submit-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .cart-summary-success {
            text-align: center;
            padding: 30px 20px;
        }
        
        .cart-summary-success-icon {
            font-size: 64px;
            margin-bottom: 15px;
        }
        
        .cart-summary-success h3 {
            color: #27ae60;
            margin-bottom: 10px;
            font-size: 20px;
        }
        
        .cart-summary-success p {
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
        }
        
        .cart-summary-success-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .cart-summary-success-btn:hover {
            background: #5568d3;
            transform: translateY(-2px);
        }
        
        /* ORDER SUCCESS ANIMATION */
        .order-success-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.85);
            z-index: 9999;
            display: none;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s;
        }
        
        .order-success-overlay.active {
            display: flex;
        }
        
        .order-success-content {
            background: white;
            border-radius: 30px;
            padding: 50px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            position: relative;
            animation: successSlideUp 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes successSlideUp {
            from {
                transform: translateY(100px) scale(0.8);
                opacity: 0;
            }
            to {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
        }
        
        .success-icon-big {
            font-size: 100px;
            margin-bottom: 20px;
            animation: successPulse 1s infinite;
        }
        
        @keyframes successPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .order-number-display {
            font-size: 64px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 20px 0;
            font-family: 'Arial Black', sans-serif;
        }
        
        .order-info-box {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .order-info-item {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 12px;
            font-size: 18px;
            color: #333;
        }
        
        .order-info-item strong {
            color: #667eea;
        }
        
        .close-success-btn {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 18px;
            border-radius: 15px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .close-success-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        /* CONFETTI */
        .confetti {
            position: fixed;
            width: 10px;
            height: 10px;
            background: #f0f;
            position: absolute;
            animation: confetti-fall 3s linear forwards;
        }
        
        @keyframes confetti-fall {
            to {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }
        }
        .cart-summary-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .cart-summary-total-label {
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }
        
        .cart-summary-total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #27ae60;
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        
        .cart-summary-btn-view:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        
        .cart-summary-btn-clear:hover {
            background: #e74c3c;
            color: white;
            transform: translateY(-2px);
        }
        
        .cart-summary-empty {
            text-align: center;
            padding: 40px 20px;
            color: #999;
        }
        
        .cart-summary-empty-icon {
            font-size: 48px;
            margin-bottom: 10px;
            opacity: 0.5;
        }

        #cartSummaryContent {
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            max-height: calc(100vh - 140px);
        }
        
        #cartSummaryContent::-webkit-scrollbar {
            width: 6px;
        }
        
        #cartSummaryContent::-webkit-scrollbar-track {
            background: #f0f0f0;
        }
        
        #cartSummaryContent::-webkit-scrollbar-thumb {
            background: #667eea;
            border-radius: 10px;
        }
        
        .search-box {
            position: relative;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .search-input {
            width: 100%;
            padding: 15px 50px 15px 20px;
            border: 2px solid #e0e0e0;
            border-radius: 50px;
            font-size: 16px;
            transition: all 0.3s;
            background: #f8f9fa;
        }
        
        .search-input:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }
        
        .search-icon {
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 20px;
            color: #999;
            pointer-events: none;
        }
        
        .clear-search {
            position: absolute;
            right: 55px;
            top: 50%;
            transform: translateY(-50%);
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 14px;
            display: none;
            align-items: center;
            justify-content: center;
        }
        
        .clear-search.visible {
            display: flex;
        }
        
        .no-results {
            text-align: center;
            padding: 60px 30px;
            color: #999;
        }
        
        .no-results h3 {
            color: #666;
            margin-bottom: 10px;
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
        
        .item-price-wrapper {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 5px;
            margin-left: 15px;
        }
        
        .item-price {
            font-size: 20px;
            font-weight: bold;
            color: #27ae60;
        }
        
        .item-price.has-discount {
            font-size: 14px;
            color: #999;
            text-decoration: line-through;
        }
        
        .item-discounted-price {
            font-size: 22px;
            font-weight: bold;
            color: #e74c3c;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .discount-badge {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(231, 76, 60, 0.3);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
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

        .item-detail-modal .modal-content {
            max-width: 500px;
        }

        .item-detail-image {
            width: 100%;
            height: 250px;
            object-fit: cover;
            border-radius: 12px;
            margin-bottom: 20px;
        }

        .item-detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .item-detail-name {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }

        .item-detail-price {
            font-size: 28px;
            font-weight: bold;
            color: #27ae60;
        }

        .item-detail-description {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
        }

        .options-section {
            margin: 20px 0;
        }

        .options-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #333;
        }

        .option-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            border: 2px solid #eee;
            border-radius: 8px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .option-item:hover {
            border-color: #667eea;
            background: #f8f9ff;
        }

        .option-item.selected {
            border-color: #667eea;
            background: #e8ebff;
        }

        .option-name {
            font-weight: 500;
            color: #333;
        }

        .option-price {
            font-weight: 600;
            color: #667eea;
        }

        .add-to-cart-btn {
            width: 100%;
            background: #27ae60;
            color: white;
            border: none;
            padding: 16px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .add-to-cart-btn:hover {
            background: #229954;
        }

        .modal-total-price {
            font-size: 22px;
            font-weight: bold;
        }

        .recommended-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #f0f0f0;
        }
        
        .recommended-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .recommended-items {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 10px;
            scrollbar-width: thin;
            scrollbar-color: #667eea #f0f0f0;
        }
        
        .recommended-items::-webkit-scrollbar {
            height: 6px;
        }
        
        .recommended-items::-webkit-scrollbar-track {
            background: #f0f0f0;
            border-radius: 10px;
        }
        
        .recommended-items::-webkit-scrollbar-thumb {
            background: #667eea;
            border-radius: 10px;
        }
        
        .recommended-item-card {
            flex-shrink: 0;
            width: 140px;
            background: #f8f9fa;
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s;
            border: 2px solid transparent;
        }
        
        .recommended-item-card:hover {
            border-color: #667eea;
            transform: translateY(-4px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }
        
        .recommended-item-image {
            width: 100%;
            height: 100px;
            object-fit: cover;
        }
        
        .recommended-item-info {
            padding: 10px;
        }
        
        .recommended-item-name {
            font-size: 13px;
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .recommended-item-price {
            font-size: 14px;
            font-weight: bold;
            color: #27ae60;
        }
        
        .recommended-badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
            margin-left: 5px;
        }

        /* ADD TO CART POPUP */
        .add-to-cart-popup {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            z-index: 3000;
            display: none;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s;
        }
        
        .add-to-cart-popup.active {
            display: flex;
        }
        
        .add-to-cart-popup-content {
            background: white;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: slideUp 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translateY(50px) scale(0.9); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        .popup-header {
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            color: white;
            padding: 25px;
            text-align: center;
            border-radius: 20px 20px 0 0;
        }
        
        .popup-success-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        
        .popup-header h3 {
            margin: 0;
            font-size: 22px;
        }
        
        .popup-body {
            padding: 25px;
        }
        
        .popup-recommended-title {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .popup-recommended-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .popup-recommended-item {
            display: flex;
            gap: 12px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 12px;
            transition: all 0.3s;
            cursor: pointer;
            border: 2px solid transparent;
        }
        
        .popup-recommended-item:hover {
            background: #e8ebff;
            border-color: #667eea;
            transform: translateX(5px);
        }
        
        .popup-item-image {
            width: 70px;
            height: 70px;
            object-fit: cover;
            border-radius: 8px;
            flex-shrink: 0;
        }
        
        .popup-item-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .popup-item-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
            font-size: 14px;
        }
        
        .popup-item-price {
            font-weight: bold;
            color: #27ae60;
            font-size: 16px;
        }
        
        .popup-add-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 13px;
            white-space: nowrap;
        }
        
        .popup-add-btn:hover {
            background: #5568d3;
            transform: scale(1.05);
        }
        
        .popup-add-btn.added {
            background: #27ae60;
        }
        
        .popup-footer {
            padding: 0 25px 25px 25px;
            display: flex;
            gap: 10px;
        }
        
        .popup-btn {
            flex: 1;
            padding: 14px;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .popup-btn-continue {
            background: #f8f9fa;
            color: #333;
        }
        
        .popup-btn-continue:hover {
            background: #e9ecef;
        }
        
        .popup-btn-checkout {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .popup-btn-checkout:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        /* YEŞİL CHECKOUT BUTONU VE KIRMIZI BADGE GİZLE */
        .checkout-btn {
            display: none !important;
        }
        
        .cart-badge {
            display: none !important;
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
            
            .search-container {
                padding: 15px 20px;
            }
            
            .category-nav {
                padding: 10px 0;
            }
            
            .category-nav-scroll {
                padding: 0 20px 8px 20px;
            }
            
            .category-nav-item {
                font-size: 14px;
                padding: 8px 16px;
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
        
        <!-- ARAMA KUTUSU -->
        <div class="search-container">
            <div class="search-box">
                <input 
                    type="text" 
                    id="searchInput" 
                    class="search-input" 
                    placeholder="🔍 Search menu items..."
                    autocomplete="off"
                >
                <button class="clear-search" id="clearSearch">×</button>
                <span class="search-icon">🔍</span>
            </div>
        </div>
        
        <!-- KATEGORİ NAVİGASYONU -->
        <div class="category-nav" id="categoryNav" style="display: none;">
            <div class="category-nav-scroll" id="categoryNavScroll"></div>
        </div>
        
        <div class="menu-content" id="menuContent">
            <?php if (empty($menu_data)): ?>
                <div style="padding: 60px 30px; text-align: center; color: #999;">
                    <h2 style="color: #999; margin-bottom: 10px;">Menu Coming Soon</h2>
                    <p>We're preparing our delicious offerings for you!</p>
                </div>
            <?php else: ?>
                <?php foreach ($menu_data as $section): ?>
                    <?php 
                    $category_id = 'category-' . sanitize_title($section['category']);
                    ?>
                    <div class="category" id="<?php echo esc_attr($category_id); ?>">
                        <h2 class="category-title"><?php echo esc_html($section['category']); ?></h2>
                        
                        <?php foreach ($section['items'] as $item): ?>
                            <div class="menu-item" onclick='openItemModal(<?php echo htmlspecialchars(json_encode($item), ENT_QUOTES, 'UTF-8'); ?>)'>
                                <?php if (!empty($item['image'])): ?>
                                    <img src="<?php echo esc_url($item['image']); ?>" alt="<?php echo esc_attr($item['name']); ?>" class="item-image">
                                <?php endif; ?>
                                
                                <div class="item-content">
                                    <div class="item-header">
                                    <div class="item-name"><?php echo esc_html($item['name']); ?></div>
                                    <div class="item-price-wrapper">
                                        <?php if (!empty($item['discounted_price']) && $item['discounted_price'] > 0): ?>
                                            <div class="item-price has-discount">$<?php echo esc_html(number_format($item['price'], 2)); ?></div>
                                            <div class="item-discounted-price">
                                                $<?php echo esc_html(number_format($item['discounted_price'], 2)); ?>
                                                <span class="discount-badge">
                                                    <?php 
                                                        $discount_percent = round((($item['price'] - $item['discounted_price']) / $item['price']) * 100);
                                                        echo $discount_percent . '% OFF';
                                                    ?>
                                                </span>
                                            </div>
                                        <?php else: ?>
                                            <div class="item-price">$<?php echo esc_html(number_format($item['price'], 2)); ?></div>
                                        <?php endif; ?>
                                    </div>
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

    <!-- ORDER SUCCESS OVERLAY -->
    <div class="order-success-overlay" id="orderSuccessOverlay">
        <div class="order-success-content">
            <div class="success-icon-big">🎉</div>
            <h2 style="color: #27ae60; margin: 10px 0; font-size: 32px;">Order Placed!</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Your order has been successfully submitted</p>
            
            <div class="order-number-display" id="orderNumberDisplay">#0</div>
            
            <div class="order-info-box">
                <div class="order-info-item">
                    <span>📍</span>
                    <span>Table: <strong id="orderTableDisplay">-</strong></span>
                </div>
                <div class="order-info-item">
                    <span>⏱️</span>
                    <span>Estimated time: <strong id="orderTimeDisplay">~15 min</strong></span>
                </div>
                <div class="order-info-item">
                    <span>💰</span>
                    <span>Total: <strong id="orderTotalDisplay">$0.00</strong></span>
                </div>
            </div>
            
            <p style="color: #999; font-size: 14px; margin: 20px 0;">
                Please wait at your table. We'll bring your order shortly!
            </p>
            
            <button class="close-success-btn" onclick="closeOrderSuccess()">
                Got it! ✨
            </button>
        </div>
    </div>

    <!-- ADD TO CART SUCCESS POPUP -->
    <div class="add-to-cart-popup" id="addToCartPopup">
        <div class="add-to-cart-popup-content">
            <div class="popup-header">
                <div class="popup-success-icon">✅</div>
                <h3>Added to Cart!</h3>
            </div>
            <div class="popup-body">
                <div class="popup-recommended-title">
                    🎁 Customers also bought:
                </div>
                <div class="popup-recommended-grid" id="popupRecommendedGrid">
                    <!-- Items will be loaded here -->
                </div>
            </div>
            <div class="popup-footer">
                <button class="popup-btn popup-btn-continue" onclick="closeAddToCartPopup()">
                    Continue Shopping
                </button>
                <button class="popup-btn popup-btn-checkout" onclick="closeAddToCartPopup(); updateCartSummary();">
                    View Cart
                </button>
            </div>
        </div>
    </div>
    
    <div class="modal item-detail-modal" id="itemDetailModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalItemName">Item Details</h2>
                <span class="close-btn" onclick="closeItemModal()">&times;</span>
            </div>
            
            <img id="modalItemImage" class="item-detail-image" style="display: none;" />
            
            <div class="item-detail-header">
                <div class="item-detail-name" id="modalItemNameLarge"></div>
                <div class="item-detail-price" id="modalItemPrice">$0.00</div>
            </div>
            
            <div class="item-detail-description" id="modalItemDescription"></div>
            
            <div id="modalItemAllergens" style="display: none;" class="item-allergens"></div>
            
            <div id="optionsSection" class="options-section" style="display: none;">
                <div class="options-title">Customize Your Order</div>
                <div id="optionsList"></div>
            </div>
            
            <div id="recommendedSection" class="recommended-section" style="display: none;">
                <div class="recommended-title">
                    🎁 Frequently bought together
                </div>
                <div class="recommended-items" id="recommendedItems"></div>
            </div>

            <button class="add-to-cart-btn" onclick="addItemToCart()">
                <span>Add to Cart</span>
                <span class="modal-total-price" id="modalTotalPrice">$0.00</span>
            </button>
        </div>
    </div>

    <!-- SEPET ÖZETİ KARTI -->
    <div class="cart-summary-card" id="cartSummaryCard">
        <div class="cart-summary-header">
            <div class="cart-summary-title">
                🛒 <span id="cartSummaryCount">0</span> Items
            </div>
            <button class="cart-summary-minimize" onclick="toggleMinimizeCart()" id="minimizeBtn">−</button>
        </div>
        
        <div id="cartSummaryContent">
            <div class="cart-summary-items" id="cartSummaryItems">
                <div class="cart-summary-empty">
                    <div class="cart-summary-empty-icon">🛒</div>
                    <p>Your cart is empty</p>
                </div>
            </div>
            
            <div class="cart-summary-footer" id="cartSummaryFooter" style="display: none;">
                <div class="cart-summary-total">
                    <span class="cart-summary-total-label">Total:</span>
                    <span class="cart-summary-total-amount">$<span id="cartSummaryTotal">0.00</span></span>
                </div>
            </div>
            
            <div class="cart-summary-checkout" id="cartSummaryCheckout" style="display: none;">
                <div class="cart-summary-form-group">
                    <label>Your Name (Optional)</label>
                    <input type="text" id="cartSummaryName" placeholder="Enter your name">
                </div>
                <div class="cart-summary-form-group">
                    <label>Special Requests (Optional)</label>
                    <textarea id="cartSummaryNotes" placeholder="Any special requests?"></textarea>
                </div>
                <button class="cart-summary-submit-btn" onclick="submitOrderFromCard()">
                    📤 Place Order
                </button>
            </div>
            
            <div class="cart-summary-success" id="cartSummarySuccess" style="display: none;">
                <div class="cart-summary-success-icon">✅</div>
                <h3>Order Submitted!</h3>
                <p>Your order has been received. We'll prepare it shortly.</p>
                <button class="cart-summary-success-btn" onclick="closeSuccessMessage()">
                    Continue Browsing
                </button>
            </div>
        </div>
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
        let currentItem = null;
        let selectedOptions = [];
        let searchTimer = null;
        let cartSummaryTimeout = null;
        let isCartSummaryHovered = false;
        let isCartSummaryMinimized = false;
        let isCartFirstOpen = true;
        // Settings
        let recommendationsEnabled = false;
        let showModalRecommendations = false;
        let showPopupRecommendations = false;
        
        // Load settings
        async function loadRecommendationSettings() {
            try {
                const formData = new FormData();
                formData.append('action', 'rms_get_settings');
                formData.append('nonce', '<?php echo wp_create_nonce('rms_nonce'); ?>');
                
                const response = await fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    recommendationsEnabled = data.data.enable_recommendations || false;
                    showModalRecommendations = data.data.show_modal_recommendations || false;
                    showPopupRecommendations = data.data.show_popup_recommendations || false;
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
        
        // Load settings on page load
        loadRecommendationSettings();

        // ==================== ORDER SUCCESS ANIMATION ====================
        
        function createConfetti() {
            const colors = ['#667eea', '#764ba2', '#27ae60', '#e74c3c', '#f39c12', '#3498db'];
            const confettiCount = 100;
            
            for (let i = 0; i < confettiCount; i++) {
                setTimeout(() => {
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    confetti.style.left = Math.random() * 100 + '%';
                    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.animationDelay = Math.random() * 0.5 + 's';
                    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                    confetti.style.width = (Math.random() * 10 + 5) + 'px';
                    confetti.style.height = confetti.style.width;
                    
                    document.body.appendChild(confetti);
                    
                    setTimeout(() => confetti.remove(), 3000);
                }, i * 10);
            }
        }
        
        function showOrderSuccess(orderData) {
            // Update display
            document.getElementById('orderNumberDisplay').textContent = '#' + orderData.order_id;
            document.getElementById('orderTableDisplay').textContent = orderData.table_number || tableNumber;
            document.getElementById('orderTimeDisplay').textContent = '~15 min';
            document.getElementById('orderTotalDisplay').textContent = '$' + orderData.total_price.toFixed(2);
            
            // Show overlay
            document.getElementById('orderSuccessOverlay').classList.add('active');
            
            // Create confetti
            createConfetti();
            
            // Play sound if available
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe47OeeSwwPUKzn77RgGwU7k9n0y3goBS18zu/glEILElyx5+yrVBMKRp/h8sFrIQUsgc7y2Yk2CBhnuO3kn0wMD0+n5e6zYhsFO5PY88t6KQUtfM/w36JVEQtcr+ftrVQTCUah4fLBayEELYHO8tmJNggYZrnt5Z9MDA9Pp+P0s2IcBTqU2fPLeikFLnvN79+jUxIKW6zm7axWEgpFoOHyvWsgBCyAzvLaiTYIGGW67OSeSwwPT6fi9LJhHAU6ldj0y3spBS17ze/fo1MSCluq5u+2VhIKRaDh8r5rIQQugs7y2Yk3CBhmvOzlnkwMD0+p4/SzYBwEOZTX9Mp6KgUue83v4KJTFQ==');
                audio.volume = 0.3;
                audio.play();
            } catch (e) {}
        }
        
        function closeOrderSuccess() {
            document.getElementById('orderSuccessOverlay').classList.remove('active');
        }

        
        
        
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
        
        window.onload = function() {
            const dropdown = document.getElementById('languageDropdown');
            let html = '';
            for (const [code, name] of Object.entries(languages)) {
                html += `<div class="language-option ${code === 'en' ? 'selected' : ''}" onclick="changeLanguage('${code}')">${name}</div>`;
            }
            dropdown.innerHTML = html;
            
            if (currentOrderId) {
                startOrderTracking();
            }
            
            setTimeout(initializeSearch, 500);
            setTimeout(initializeCategoryNav, 600);
        };
        
        function toggleLanguageDropdown() {
            document.getElementById('languageDropdown').classList.toggle('active');
        }
        
        async function changeLanguage(langCode) {
            currentLanguage = langCode;
            document.getElementById('currentLanguage').textContent = languages[langCode];
            document.getElementById('languageDropdown').classList.remove('active');
            
            document.querySelectorAll('.language-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            event.target.classList.add('selected');
            
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
            const menuContent = document.getElementById('menuContent');
            if (!data || data.length === 0) {
                menuContent.innerHTML = '<div style="padding: 60px 30px; text-align: center; color: #999;"><h2>Menu Coming Soon</h2></div>';
                return;
            }
            
            let html = '';
            data.forEach(section => {
                const categoryId = 'category-' + section.category.toLowerCase().replace(/\s+/g, '-');
                html += `<div class="category" id="${categoryId}"><h2 class="category-title">${section.category}</h2>`;
                section.items.forEach(item => {
                    html += `
                        <div class="menu-item" onclick='openItemModal(${JSON.stringify(item).replace(/'/g, "&#39;")})'> 
                            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="item-image">` : ''}
                            <div class="item-content">
                                <div class="item-header">
                                    <div class="item-name">${item.name}</div>
                                    <div class="item-price">${parseFloat(item.price).toFixed(2)}</div>
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
            
            initializeCategoryNav();
            
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value) {
                performSearch(searchInput.value.toLowerCase());
            }
        }
        
        document.addEventListener('click', function(event) {
            const selector = document.querySelector('.language-selector');
            if (selector && !selector.contains(event.target)) {
                document.getElementById('languageDropdown').classList.remove('active');
            }
        });

        window.openItemModal = function(item) {
            currentItem = item;
            selectedOptions = [];
            
            document.getElementById('modalItemName').textContent = item.name;
            document.getElementById('modalItemNameLarge').textContent = item.name;
            
            const displayPrice = (item.discounted_price && parseFloat(item.discounted_price) > 0) 
                ? parseFloat(item.discounted_price) 
                : parseFloat(item.price);
            
            const priceElement = document.getElementById('modalItemPrice');
            if (item.discounted_price && parseFloat(item.discounted_price) > 0) {
                const discountPercent = Math.round(((item.price - item.discounted_price) / item.price) * 100);
                priceElement.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
                        <div style="font-size: 18px; color: #999; text-decoration: line-through;">$${parseFloat(item.price).toFixed(2)}</div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 28px; font-weight: bold; color: #e74c3c;">$${parseFloat(item.discounted_price).toFixed(2)}</span>
                            <span class="discount-badge">${discountPercent}% OFF</span>
                        </div>
                    </div>
                `;
            } else {
                priceElement.textContent = '$' + displayPrice.toFixed(2);
            }
            
            document.getElementById('modalTotalPrice').textContent = '$' + displayPrice.toFixed(2);
            
            const modalImage = document.getElementById('modalItemImage');
            if (item.image) {
                modalImage.src = item.image;
                modalImage.style.display = 'block';
            } else {
                modalImage.style.display = 'none';
            }
            
            const descElement = document.getElementById('modalItemDescription');
            if (item.description) {
                descElement.textContent = item.description;
                descElement.style.display = 'block';
            } else {
                descElement.style.display = 'none';
            }
            
            const allergenElement = document.getElementById('modalItemAllergens');
            if (item.allergens) {
                allergenElement.textContent = '⚠️ Contains: ' + item.allergens;
                allergenElement.style.display = 'block';
            } else {
                allergenElement.style.display = 'none';
            }
            
            const optionsSection = document.getElementById('optionsSection');
            const optionsList = document.getElementById('optionsList');
            
            if (item.options && item.options.length > 0) {
                optionsSection.style.display = 'block';
                let optionsHtml = '';
                item.options.forEach(option => {
                    optionsHtml += `
                        <div class="option-item" onclick="toggleOption(${option.id}, '${option.option_name.replace(/'/g, "\\'")}', ${option.option_price})">
                            <span class="option-name">${option.option_name}</span>
                            <span class="option-price">+$${parseFloat(option.option_price).toFixed(2)}</span>
                        </div>
                    `;
                });
                optionsList.innerHTML = optionsHtml;
            } else {
                optionsSection.style.display = 'none';
            }

            // Load recommended items (same category) - only if enabled
            if (recommendationsEnabled && showModalRecommendations) {
                loadRecommendedItems(item.id, 'same_category');
            } else {
                document.getElementById('recommendedSection').style.display = 'none';
            }
            
            document.getElementById('itemDetailModal').classList.add('active');
        }

        window.closeItemModal = function() {
            document.getElementById('itemDetailModal').classList.remove('active');
            currentItem = null;
            selectedOptions = [];
        }

        window.toggleOption = function(optionId, optionName, optionPrice) {
            const optionIndex = selectedOptions.findIndex(opt => opt.id === optionId);
            
            if (optionIndex > -1) {
                selectedOptions.splice(optionIndex, 1);
                event.target.closest('.option-item').classList.remove('selected');
            } else {
                selectedOptions.push({
                    id: optionId,
                    option_name: optionName,
                    option_price: optionPrice
                });
                event.target.closest('.option-item').classList.add('selected');
            }
            
            updateModalTotal();
        }

        window.updateModalTotal = function() {
            if (!currentItem) return;
            
            const basePrice = (currentItem.discounted_price && parseFloat(currentItem.discounted_price) > 0) 
                ? parseFloat(currentItem.discounted_price) 
                : parseFloat(currentItem.price);
            
            let total = basePrice;
            selectedOptions.forEach(opt => {
                total += parseFloat(opt.option_price);
            });
            
            document.getElementById('modalTotalPrice').textContent = '$' + total.toFixed(2);
        }

        // ==================== RECOMMENDED ITEMS ====================
        
        async function loadRecommendedItems(itemId, type = 'all') {
            try {
                const formData = new FormData();
                formData.append('action', 'rms_get_recommended_items');
                formData.append('nonce', '<?php echo wp_create_nonce('rms_nonce'); ?>');
                formData.append('item_id', itemId);
                formData.append('limit', 4);
                formData.append('type', type);
                
                const response = await fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success && data.data && data.data.length > 0) {
                    renderRecommendedItems(data.data);
                } else {
                    document.getElementById('recommendedSection').style.display = 'none';
                }
            } catch (error) {
                console.error('Error loading recommended items:', error);
                document.getElementById('recommendedSection').style.display = 'none';
            }
        }
        

        // ==================== ADD TO CART POPUP ====================
        
        let lastAddedItemRecommendations = [];
        
        async function showAddToCartPopup(itemId) {
            try {
                const formData = new FormData();
                formData.append('action', 'rms_get_recommended_items');
                formData.append('nonce', '<?php echo wp_create_nonce('rms_nonce'); ?>');
                formData.append('item_id', itemId);
                formData.append('limit', 3);
                formData.append('type', 'different_category');
                
                const response = await fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success && data.data && data.data.length > 0) {
                    lastAddedItemRecommendations = data.data;
                    renderPopupRecommendedItems(data.data);
                    document.getElementById('addToCartPopup').classList.add('active');
                } else {
                    // No recommendations, just show notification
                    showNotification('Added to cart!', 'success');
                }
            } catch (error) {
                console.error('Error loading recommendations:', error);
                showNotification('Added to cart!', 'success');
            }
        }
        
        function renderPopupRecommendedItems(items) {
            const grid = document.getElementById('popupRecommendedGrid');
            
            let html = '';
            items.forEach(item => {
                const displayPrice = (item.discounted_price && parseFloat(item.discounted_price) > 0) 
                    ? parseFloat(item.discounted_price) 
                    : parseFloat(item.price);
                
                html += `
                    <div class="popup-recommended-item">
                        ${item.image ? `<img src="${item.image}" class="popup-item-image" alt="${item.name}">` : `<div class="popup-item-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 30px;">🍽️</div>`}
                        <div class="popup-item-info">
                            <div class="popup-item-name">${item.name}</div>
                            <div class="popup-item-price">$${displayPrice.toFixed(2)}</div>
                        </div>
                        <button class="popup-add-btn" onclick='quickAddToCart(${JSON.stringify(item).replace(/'/g, "&#39;")}, this)'>
                            + Add
                        </button>
                    </div>
                `;
            });
            
            grid.innerHTML = html;
        }
        
        function quickAddToCart(item, buttonElement) {
            const itemPrice = (item.discounted_price && parseFloat(item.discounted_price) > 0) 
                ? parseFloat(item.discounted_price) 
                : parseFloat(item.price);
            
            const uniqueId = item.id + '_' + Date.now() + '_' + Math.random();
            
            cart.push({
                uniqueId: uniqueId,
                id: item.id,
                name: item.name,
                price: itemPrice,
                original_price: parseFloat(item.price),
                discounted_price: item.discounted_price,
                quantity: 1,
                selectedOptions: []
            });
            
            updateCart();
            
            // Visual feedback
            buttonElement.textContent = '✓ Added';
            buttonElement.classList.add('added');
            buttonElement.disabled = true;
        }
        
        function closeAddToCartPopup() {
            document.getElementById('addToCartPopup').classList.remove('active');
        }
        
        // Close popup when clicking outside
        document.addEventListener('click', function(e) {
            const popup = document.getElementById('addToCartPopup');
            if (e.target === popup) {
                closeAddToCartPopup();
            }
        });

        function renderRecommendedItems(items) {
            const container = document.getElementById('recommendedItems');
            const section = document.getElementById('recommendedSection');
            
            if (!items || items.length === 0) {
                section.style.display = 'none';
                return;
            }
            
            let html = '';
            items.forEach(item => {
                const displayPrice = (item.discounted_price && parseFloat(item.discounted_price) > 0) 
                    ? parseFloat(item.discounted_price) 
                    : parseFloat(item.price);
                
                html += `
                    <div class="recommended-item-card" onclick='openItemModal(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
                        ${item.image ? `<img src="${item.image}" class="recommended-item-image" alt="${item.name}">` : `<div class="recommended-item-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 40px;">🍽️</div>`}
                        <div class="recommended-item-info">
                            <div class="recommended-item-name">${item.name}</div>
                            <div class="recommended-item-price">$${displayPrice.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            section.style.display = 'block';
        }

        window.addItemToCart = function() {
            if (!currentItem) return;
            
            const uniqueId = currentItem.id + '_' + Date.now() + '_' + Math.random();
            
            const itemPrice = (currentItem.discounted_price && parseFloat(currentItem.discounted_price) > 0) 
                ? parseFloat(currentItem.discounted_price) 
                : parseFloat(currentItem.price);
            
            cart.push({
                uniqueId: uniqueId,
                id: currentItem.id,
                name: currentItem.name,
                price: itemPrice,
                original_price: parseFloat(currentItem.price),
                discounted_price: currentItem.discounted_price,
                quantity: 1,
                selectedOptions: [...selectedOptions]
            });
            
            updateCart();
            const itemId = currentItem.id; // Önce ID'yi kaydet
            closeItemModal();
            
            // Show popup only if enabled
            if (recommendationsEnabled && showPopupRecommendations) {
                showAddToCartPopup(itemId);
            } else {
                showNotification('Added to cart!', 'success');
            }
        }
        
        window.removeFromCart = function(uniqueId) {
            cart = cart.filter(item => item.uniqueId !== uniqueId);
            updateCart();
        }
        
        window.updateQuantity = function(uniqueId, change) {
            const item = cart.find(i => i.uniqueId === uniqueId);
            if (item) {
                item.quantity += change;
                if (item.quantity <= 0) {
                    removeFromCart(uniqueId);
                } else {
                    updateCart();
                }
            }
        }
        
        function updateCart() {
            const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        
            
            renderCart();
            updateCartSummary();
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
                
                let optionsTotal = 0;
                if (item.selectedOptions && item.selectedOptions.length > 0) {
                    item.selectedOptions.forEach(opt => {
                        optionsTotal += parseFloat(opt.option_price) * item.quantity;
                    });
                }
                
                const finalTotal = itemTotal + optionsTotal;
                total += finalTotal;
                
                html += `
                    <div class="cart-item">
                        <div style="flex: 1;">
                            <div style="font-weight: 600;">${item.name}</div>
                            <div style="color: #666; font-size: 14px;">$${item.price} each</div>
                            ${item.selectedOptions && item.selectedOptions.length > 0 ? `
                                <div style="font-size: 12px; color: #667eea; margin-top: 5px;">
                                    ${item.selectedOptions.map(opt => `+ ${opt.option_name} ($${parseFloat(opt.option_price).toFixed(2)})`).join('<br>')}
                                </div>
                            ` : ''}
                        </div>
                        <div class="quantity-controls">
                            <button class="qty-btn" onclick="updateQuantity('${item.uniqueId}', -1)">-</button>
                            <span style="min-width: 30px; text-align: center; font-weight: 600;">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity('${item.uniqueId}', 1)">+</button>
                            <span style="margin-left: 15px; font-weight: 600;">$${finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                `;
            });
            
            cartItems.innerHTML = html;
            document.getElementById('totalPrice').textContent = total.toFixed(2);
        }
        
        window.toggleCart = function() {
            const modal = document.getElementById('cartModal');
            modal.classList.toggle('active');
            if (modal.classList.contains('active')) {
                renderCart();
            }
        }
        
        window.submitOrder = async function() {
            if (!tableNumber) {
                alert('Table number is required!');
                return;
            }
            
            const customerName = document.getElementById('customerName').value;
            const notes = document.getElementById('orderNotes').value;
            const total = cart.reduce((sum, item) => {
                let itemTotal = item.price * item.quantity;
                if (item.selectedOptions && item.selectedOptions.length > 0) {
                    item.selectedOptions.forEach(opt => {
                        itemTotal += parseFloat(opt.option_price) * item.quantity;
                    });
                }
                return sum + itemTotal;
            }, 0);
            
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
                quantity: item.quantity,
                selectedOptions: item.selectedOptions || []
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
        
        window.closeAndReset = function() {
            cart = [];
            updateCart();
            toggleCart();
            document.getElementById('cartItems').style.display = 'block';
            document.getElementById('checkoutForm').style.display = 'none';
            document.getElementById('successMessage').style.display = 'none';
            document.getElementById('customerName').value = '';
            document.getElementById('orderNotes').value = '';
        }
        
        document.getElementById('callWaiterBtn')?.addEventListener('click', async function() {
            const btn = this;
            const originalText = btn.textContent;
            btn.textContent = '⏳ Calling...';
            btn.disabled = true;
            
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
                    btn.textContent = '✓ Waiter Called';
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.disabled = false;
                    }, 3000);
                } else {
                    showNotification('Failed to call waiter', 'warning');
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            } catch (error) {
                console.error('Error calling waiter:', error);
                showNotification('Error calling waiter', 'warning');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
        
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
        
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

            setInterval(checkStatus, 10000);
            checkStatus();
        }

        let lastNotifiedStatus = null;

        function updateOrderStatus(status) {
            document.querySelectorAll('.status-step').forEach(el => {
                el.className = 'status-step pending';
            });

            if (status === 'pending') {
                document.getElementById('statusPending').className = 'status-step active';
            } else if (status === 'preparing') {
                document.getElementById('statusPending').className = 'status-step completed';
                document.getElementById('statusPreparing').className = 'status-step active';
                
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
        
        // ==================== ARAMA FONKSİYONLARI ====================
        
        function initializeSearch() {
            const searchInput = document.getElementById('searchInput');
            const clearButton = document.getElementById('clearSearch');
            
            if (!searchInput) {
                console.error('Search input not found');
                return;
            }
            
            searchInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value.trim().toLowerCase();
                
                if (searchTimer) {
                    clearTimeout(searchTimer);
                }
                
                if (searchTerm.length > 0) {
                    clearButton.classList.add('visible');
                    searchTimer = setTimeout(() => {
                        performSearch(searchTerm);
                    }, 300);
                } else {
                    clearButton.classList.remove('visible');
                    showAllItems();
                }
            });
            
            clearButton.addEventListener('click', function() {
                searchInput.value = '';
                clearButton.classList.remove('visible');
                showAllItems();
                searchInput.focus();
            });
            
            console.log('Search initialized successfully');
        }
        
        function performSearch(searchTerm) {
            console.log('Searching for:', searchTerm);
            
            // Hide category navigation during search
            const categoryNav = document.getElementById('categoryNav');
            if (categoryNav) {
                categoryNav.style.display = 'none';
            }
            
            const menuContent = document.getElementById('menuContent');
            if (!menuContent) return;
            
            const categories = menuContent.querySelectorAll('.category');
            let foundCount = 0;
            
            categories.forEach(category => {
                const categoryTitle = category.querySelector('.category-title').textContent.toLowerCase();
                const items = category.querySelectorAll('.menu-item');
                let categoryHasVisibleItems = false;
                
                items.forEach(item => {
                    const itemName = item.querySelector('.item-name')?.textContent.toLowerCase() || '';
                    const itemDesc = item.querySelector('.item-description')?.textContent.toLowerCase() || '';
                    
                    const matches = itemName.includes(searchTerm) || 
                                  itemDesc.includes(searchTerm) || 
                                  categoryTitle.includes(searchTerm);
                    
                    if (matches) {
                        item.style.display = 'flex';
                        categoryHasVisibleItems = true;
                        foundCount++;
                        highlightSearchTerm(item, searchTerm);
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                category.style.display = categoryHasVisibleItems ? 'block' : 'none';
            });
            
            if (foundCount === 0) {
                showNoResults();
            } else {
                removeNoResults();
            }
            
            console.log('Found', foundCount, 'items');
        }
        
        function highlightSearchTerm(item, searchTerm) {
            const itemName = item.querySelector('.item-name');
            if (itemName) {
                const originalText = itemName.textContent;
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                const highlightedText = originalText.replace(regex, '<mark style="background: #fff3cd; padding: 2px 4px; border-radius: 3px;">$1</mark>');
                
                if (originalText.toLowerCase().includes(searchTerm)) {
                    itemName.innerHTML = highlightedText;
                }
            }
        }
        
        function showAllItems() {
            const menuContent = document.getElementById('menuContent');
            if (!menuContent) return;
            
            // Show category navigation when clearing search
            const categoryNav = document.getElementById('categoryNav');
            if (categoryNav) {
                const categories = document.querySelectorAll('.category');
                if (categories.length > 0) {
                    categoryNav.style.display = 'block';
                }
            }
            
            menuContent.querySelectorAll('mark').forEach(mark => {
                mark.outerHTML = mark.textContent;
            });
            
            menuContent.querySelectorAll('.category').forEach(category => {
                category.style.display = 'block';
            });
            
            menuContent.querySelectorAll('.menu-item').forEach(item => {
                item.style.display = 'flex';
            });
            
            removeNoResults();
        }
        
        function showNoResults() {
            removeNoResults();
            
            const menuContent = document.getElementById('menuContent');
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results';
            noResultsDiv.id = 'noResultsMessage';
            noResultsDiv.innerHTML = `
                <div style="font-size: 64px; margin-bottom: 20px;">🔍</div>
                <h3 style="color: #666; margin-bottom: 10px; font-size: 24px;">No items found</h3>
                <p style="color: #999; font-size: 16px;">Try searching with different keywords</p>
            `;
            
            menuContent.insertBefore(noResultsDiv, menuContent.firstChild);
        }
        
        function removeNoResults() {
            const noResults = document.getElementById('noResultsMessage');
            if (noResults) {
                noResults.remove();
            }
        }
        
        // ==================== KATEGORİ NAVİGASYONU ====================
        
        function initializeCategoryNav() {
            const categories = document.querySelectorAll('.category');
            if (categories.length === 0) return;
            
            const categoryNav = document.getElementById('categoryNav');
            const categoryNavScroll = document.getElementById('categoryNavScroll');
            
            categoryNav.style.display = 'block';
            
            let navHtml = '';
            categories.forEach(category => {
                const categoryTitle = category.querySelector('.category-title').textContent;
                const categoryId = category.id;
                
                navHtml += `
                    <div class="category-nav-item" onclick="scrollToCategory('${categoryId}')">
                        ${categoryTitle}
                    </div>
                `;
            });
            
            categoryNavScroll.innerHTML = navHtml;
            
            // Scroll event listener for active category highlight
            let scrollTimeout;
            window.addEventListener('scroll', function() {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(updateActiveCategory, 100);
            });
            
            console.log('Category navigation initialized with', categories.length, 'categories');
        }
        
        window.scrollToCategory = function(categoryId) {
            const category = document.getElementById(categoryId);
            if (!category) return;
            
            const categoryNav = document.getElementById('categoryNav');
            const offset = categoryNav ? categoryNav.offsetHeight + 10 : 80;
            
            const elementPosition = category.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            // Update active state immediately
            setTimeout(() => {
                updateActiveCategory();
            }, 100);
        }
        
        function updateActiveCategory() {
            const categories = document.querySelectorAll('.category');
            const navItems = document.querySelectorAll('.category-nav-item');
            
            if (categories.length === 0 || navItems.length === 0) return;
            
            const categoryNav = document.getElementById('categoryNav');
            const offset = categoryNav ? categoryNav.offsetHeight + 100 : 150;
            
            let activeIndex = 0;
            
            categories.forEach((category, index) => {
                const rect = category.getBoundingClientRect();
                if (rect.top <= offset && rect.bottom > offset) {
                    activeIndex = index;
                }
            });
            
            navItems.forEach((item, index) => {
                if (index === activeIndex) {
                    item.classList.add('active');
                    
                    // Scroll active item into view in nav
                    const navScroll = document.getElementById('categoryNavScroll');
                    if (navScroll) {
                        const itemLeft = item.offsetLeft;
                        const itemWidth = item.offsetWidth;
                        const scrollLeft = navScroll.scrollLeft;
                        const navWidth = navScroll.offsetWidth;
                        
                        if (itemLeft < scrollLeft) {
                            navScroll.scrollTo({ left: itemLeft - 20, behavior: 'smooth' });
                        } else if (itemLeft + itemWidth > scrollLeft + navWidth) {
                            navScroll.scrollTo({ left: itemLeft - navWidth + itemWidth + 20, behavior: 'smooth' });
                        }
                    }
                } else {
                    item.classList.remove('active');
                }
            });
        }// ==================== SEPET ÖZETİ KARTI ====================
        
       function updateCartSummary() {
            const summaryCard = document.getElementById('cartSummaryCard');
            const summaryItems = document.getElementById('cartSummaryItems');
            const summaryFooter = document.getElementById('cartSummaryFooter');
            const summaryCheckout = document.getElementById('cartSummaryCheckout');
            const summaryCount = document.getElementById('cartSummaryCount');
            const summaryTotal = document.getElementById('cartSummaryTotal');
            
            if (cart.length === 0) {
                summaryItems.innerHTML = `
                    <div class="cart-summary-empty">
                        <div class="cart-summary-empty-icon">🛒</div>
                        <p>Your cart is empty</p>
                    </div>
                `;
                summaryFooter.style.display = 'none';
                summaryCheckout.style.display = 'none';
                hideCartSummary();
                isCartFirstOpen = true;
                return;
            }
            
            // Show card - shake animation ONLY on first open
            if (isCartFirstOpen) {
                summaryCard.classList.add('visible', 'shake');
                setTimeout(() => {
                    summaryCard.classList.remove('shake');
                }, 500);
                isCartFirstOpen = false;
            } else {
                summaryCard.classList.add('visible');
            }
            
            // Calculate total
            let total = 0;
            let itemCount = 0;
            
            let html = '';
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                let optionsTotal = 0;
                
                if (item.selectedOptions && item.selectedOptions.length > 0) {
                    item.selectedOptions.forEach(opt => {
                        optionsTotal += parseFloat(opt.option_price) * item.quantity;
                    });
                }
                
                const finalTotal = itemTotal + optionsTotal;
                total += finalTotal;
                itemCount += item.quantity;
                
                html += `
                    <div class="cart-summary-item">
                        <div class="cart-summary-item-info">
                            <div class="cart-summary-item-name">${item.name}</div>
                            <span class="cart-summary-item-qty">×${item.quantity}</span>
                            ${item.selectedOptions && item.selectedOptions.length > 0 ? `
                                <div style="font-size: 11px; color: #667eea; margin-top: 3px;">
                                    ${item.selectedOptions.map(opt => opt.option_name).join(', ')}
                                </div>
                            ` : ''}
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                            <div class="cart-summary-item-price">$${finalTotal.toFixed(2)}</div>
                            <div style="display: flex; gap: 5px;">
                                <button onclick="updateQuantity('${item.uniqueId}', -1)" style="width: 24px; height: 24px; border: none; background: #667eea; color: white; border-radius: 50%; cursor: pointer; font-size: 14px;">-</button>
                                <span style="min-width: 20px; text-align: center; font-weight: 600; font-size: 14px;">${item.quantity}</span>
                                <button onclick="updateQuantity('${item.uniqueId}', 1)" style="width: 24px; height: 24px; border: none; background: #667eea; color: white; border-radius: 50%; cursor: pointer; font-size: 14px;">+</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            summaryItems.innerHTML = html;
            summaryCount.textContent = itemCount;
            summaryTotal.textContent = total.toFixed(2);
            summaryFooter.style.display = 'block';
            summaryCheckout.style.display = 'block';
        }
        
        function hideCartSummary() {
            const summaryCard = document.getElementById('cartSummaryCard');
            summaryCard.classList.remove('visible');
        }
        

        function toggleMinimizeCart() {
            const summaryCard = document.getElementById('cartSummaryCard');
            const summaryContent = document.getElementById('cartSummaryContent');
            const minimizeBtn = document.getElementById('minimizeBtn');
            
            isCartSummaryMinimized = !isCartSummaryMinimized;
            
            if (isCartSummaryMinimized) {
                summaryContent.style.display = 'none';
                minimizeBtn.textContent = '+';
            } else {
                summaryContent.style.display = 'flex';
                minimizeBtn.textContent = '−';
            }
        }

        async function submitOrderFromCard() {
            if (!tableNumber) {
                alert('Table number is required!');
                return;
            }
            
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            
            const submitBtn = document.querySelector('.cart-summary-submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '⏳ Submitting...';
            
            const customerName = document.getElementById('cartSummaryName').value;
            const notes = document.getElementById('cartSummaryNotes').value;
            const total = cart.reduce((sum, item) => {
                let itemTotal = item.price * item.quantity;
                if (item.selectedOptions && item.selectedOptions.length > 0) {
                    item.selectedOptions.forEach(opt => {
                        itemTotal += parseFloat(opt.option_price) * item.quantity;
                    });
                }
                return sum + itemTotal;
            }, 0);
            
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
                quantity: item.quantity,
                selectedOptions: item.selectedOptions || []
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
                    
                    // Close cart summary
                    hideCartSummary();
                    
                    // Show animated success overlay
                    showOrderSuccess({
                        order_id: data.data.order_id,
                        table_number: tableNumber,
                        total_price: total
                    });
                    
                    // Reset cart
                    cart = [];
                    updateCart();
                    
                    // Clear form
                    document.getElementById('cartSummaryName').value = '';
                    document.getElementById('cartSummaryNotes').value = '';
                    
                    startOrderTracking();
                } else {
                    alert('Failed to submit order. Please try again.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error submitting order. Please try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
        
        function closeSuccessMessage() {
            cart = [];
            updateCart();
            document.getElementById('cartSummaryName').value = '';
            document.getElementById('cartSummaryNotes').value = '';
            document.getElementById('cartSummaryItems').style.display = 'block';
            document.getElementById('cartSummarySuccess').style.display = 'none';
            hideCartSummary();
        }

        
        

    </script>
</body>
</html>