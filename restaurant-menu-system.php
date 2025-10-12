<?php
/**
 * Plugin Name: Restaurant Menu & Order System
 * Description: Professional restaurant menu management with QR codes and online ordering
 * Version: 1.0.0
 * Author: Your Name
 * License: GPL2
 */

if (!defined('ABSPATH')) exit;

define('RMS_VERSION', '1.0.0');
define('RMS_PATH', plugin_dir_path(__FILE__));
define('RMS_URL', plugin_dir_url(__FILE__));

class Restaurant_Menu_System {
    
    private static $instance = null;
    
    private $supported_languages = array(
        'tr' => 'Türkçe',
        'en' => 'English',
        'es' => 'Español',
        'ar' => 'العربية',
        'de' => 'Deutsch',
        'fr' => 'Français',
        'it' => 'Italiano',
        'ja' => '日本語',
        'zh' => '中文',
        'ru' => 'Русский',
        'pt' => 'Português',
        'hi' => 'हिन्दी',
        'nl' => 'Nederlands',
        'ko' => '한국어',
        'pl' => 'Polski',
        'sv' => 'Svenska',
        'no' => 'Norsk',
        'da' => 'Dansk',
        'fi' => 'Suomi',
        'el' => 'Ελληνικά',
        'cs' => 'Čeština',
        'hu' => 'Magyar',
        'ro' => 'Română',
        'th' => 'ไทย',
        'vi' => 'Tiếng Việt',
        'id' => 'Bahasa Indonesia',
        'uk' => 'Українська',
        'he' => 'עברית',
        'bn' => 'বাংলা',
        'fa' => 'فارسی'
    );
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        register_activation_hook(__FILE__, array($this, 'activate'));
        add_action('init', array($this, 'register_post_types'));
        add_action('init', array($this, 'add_menu_rewrite_rules'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_filter('template_include', array($this, 'menu_template'));
        $this->register_ajax_handlers();
    }
    
    public function activate() {
        global $wpdb;
        
        $this->create_custom_roles();
        
        $charset_collate = $wpdb->get_charset_collate();
        $categories_meta = $wpdb->prefix . 'termmeta';
        $wpdb->query("ALTER TABLE {$wpdb->prefix}terms ADD COLUMN display_order INT DEFAULT 0");
        
        $tables_table = $wpdb->prefix . 'rms_tables';
        $sql_tables = "CREATE TABLE $tables_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            table_number varchar(50) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY table_number (table_number)
        ) $charset_collate;";
        
        $orders_table = $wpdb->prefix . 'rms_orders';
        $sql_orders = "CREATE TABLE $orders_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            table_number varchar(50) NOT NULL,
            customer_name varchar(100),
            items text NOT NULL,
            total_price decimal(10,2) NOT NULL,
            status varchar(20) DEFAULT 'pending' NOT NULL,
            notes text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        
        $translations_table = $wpdb->prefix . 'rms_translations';
        $sql_translations = "CREATE TABLE $translations_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            item_id mediumint(9) NOT NULL,
            language_code varchar(10) NOT NULL,
            name varchar(200) NOT NULL,
            description text,
            PRIMARY KEY  (id),
            UNIQUE KEY item_language (item_id, language_code)
        ) $charset_collate;";
        
        $category_translations_table = $wpdb->prefix . 'rms_category_translations';
        $sql_category_translations = "CREATE TABLE $category_translations_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            category_id mediumint(9) NOT NULL,
            language_code varchar(10) NOT NULL,
            name varchar(200) NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY category_language (category_id, language_code)
        ) $charset_collate;";
        
        $settings_table = $wpdb->prefix . 'rms_settings';
        $sql_settings = "CREATE TABLE $settings_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            setting_key varchar(100) NOT NULL,
            setting_value text,
            PRIMARY KEY  (id),
            UNIQUE KEY setting_key (setting_key)
        ) $charset_collate;";
        
        $calls_table = $wpdb->prefix . 'rms_calls';
        $sql_calls = "CREATE TABLE $calls_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            table_number varchar(50) NOT NULL,
            status varchar(20) DEFAULT 'pending' NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            resolved_at datetime,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        $stock_table = $wpdb->prefix . 'rms_stock';
        $sql_stock = "CREATE TABLE $stock_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            item_name varchar(200) NOT NULL,
            current_stock decimal(10,2) NOT NULL,
            min_stock decimal(10,2) NOT NULL,
            unit varchar(20) DEFAULT 'kg' NOT NULL,
            supplier varchar(200),
            last_order_date date,
            notes text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        $expenses_table = $wpdb->prefix . 'rms_expenses';
        $sql_expenses = "CREATE TABLE $expenses_table (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            category varchar(50) NOT NULL,
            amount decimal(10,2) NOT NULL,
            description varchar(255) NOT NULL,
            expense_date date NOT NULL,
            receipt_url varchar(500),
            notes text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_tables);
        dbDelta($sql_orders);
        dbDelta($sql_translations);
        dbDelta($sql_category_translations);
        dbDelta($sql_settings);
        dbDelta($sql_calls);
        dbDelta($sql_stock);
        dbDelta($sql_expenses);
        
        $default_lang = $wpdb->get_var("SELECT setting_value FROM {$wpdb->prefix}rms_settings WHERE setting_key = 'default_language'");
        if (!$default_lang) {
            $wpdb->insert(
                $wpdb->prefix . 'rms_settings',
                array('setting_key' => 'default_language', 'setting_value' => 'en'),
                array('%s', '%s')
            );
        }
        
        $this->register_post_types();
        $this->add_menu_rewrite_rules();
        flush_rewrite_rules();
    }
    
    public function create_custom_roles() {
        remove_role('rms_owner');
        remove_role('rms_waiter');
        
        add_role('rms_owner', 'Restaurant Owner', array(
            'read' => true,
            'edit_posts' => true,
            'delete_posts' => true,
            'publish_posts' => true,
            'upload_files' => true,
            'manage_restaurant_menu' => true,
            'manage_restaurant_orders' => true,
            'manage_restaurant_settings' => true,
            'manage_restaurant_qrcodes' => true,
            'view_restaurant_reports' => true,
            'manage_restaurant_categories' => true,
        ));
        
        add_role('rms_waiter', 'Waiter', array(
            'read' => true,
            'manage_restaurant_orders' => true,
            'view_restaurant_menu' => true,
        ));
        
        $admin_role = get_role('administrator');
        if ($admin_role) {
            $admin_role->add_cap('manage_restaurant_menu');
            $admin_role->add_cap('manage_restaurant_orders');
            $admin_role->add_cap('manage_restaurant_settings');
            $admin_role->add_cap('manage_restaurant_qrcodes');
            $admin_role->add_cap('view_restaurant_reports');
            $admin_role->add_cap('manage_restaurant_categories');
            $admin_role->add_cap('view_restaurant_menu');
        }
    }
    
    public function check_user_capability($capability) {
        if (!is_user_logged_in()) {
            wp_send_json_error('You must be logged in.');
            exit;
        }
        
        if (!current_user_can($capability)) {
            wp_send_json_error('You do not have permission to perform this action.');
            exit;
        }
        
        return true;
    }
    
    public function register_post_types() {
        register_taxonomy('rms_category', array('rms_menu_item'), array(
            'hierarchical' => true,
            'labels' => array(
                'name' => 'Categories',
                'singular_name' => 'Category',
            ),
            'show_ui' => false,
            'show_admin_column' => true,
            'query_var' => true,
            'rewrite' => array('slug' => 'menu-category'),
        ));
        
        register_post_type('rms_menu_item', array(
            'labels' => array(
                'name' => 'Menu Items',
                'singular_name' => 'Menu Item',
            ),
            'public' => false,
            'show_ui' => false,
            'supports' => array('title', 'editor'),
            'has_archive' => false,
        ));
    }
    
    public function add_menu_rewrite_rules() {
        add_rewrite_rule('^menu/?$', 'index.php?rms_menu=1', 'top');
        add_rewrite_tag('%rms_menu%', '1');
    }
    
    public function menu_template($template) {
        if (get_query_var('rms_menu')) {
            return RMS_PATH . 'menu-template.php';
        }
        return $template;
    }
    
    public function add_admin_menu() {
        if (current_user_can('manage_restaurant_menu')) {
            add_menu_page(
                'Restaurant Menu',
                'Restaurant Menu',
                'manage_restaurant_menu',
                'restaurant-menu',
                array($this, 'render_admin_page'),
                'dashicons-food',
                30
            );
            
            add_submenu_page(
                'restaurant-menu',
                'Menu Items',
                'Menu Items',
                'manage_restaurant_menu',
                'restaurant-menu',
                array($this, 'render_admin_page')
            );
        }
        
        if (current_user_can('manage_restaurant_orders')) {
            if (!current_user_can('manage_restaurant_menu')) {
                add_menu_page(
                    'Orders',
                    'Orders',
                    'manage_restaurant_orders',
                    'rms-orders',
                    array($this, 'render_orders_page'),
                    'dashicons-food',
                    30
                );
            } else {
                add_submenu_page(
                    'restaurant-menu',
                    'Orders',
                    'Orders',
                    'manage_restaurant_orders',
                    'rms-orders',
                    array($this, 'render_orders_page')
                );
            }
        }
        
        if (current_user_can('view_restaurant_menu') && !current_user_can('manage_restaurant_menu')) {
            add_submenu_page(
                'rms-orders',
                'View Menu',
                'View Menu',
                'view_restaurant_menu',
                'rms-view-menu',
                array($this, 'render_view_menu_page')
            );
        }
        
        if (current_user_can('manage_restaurant_categories')) {
            add_submenu_page(
                'restaurant-menu',
                'Categories',
                'Categories',
                'manage_restaurant_categories',
                'rms-categories',
                array($this, 'render_categories_page')
            );
        }
        
        if (current_user_can('manage_restaurant_qrcodes')) {
            add_submenu_page(
                'restaurant-menu',
                'QR Codes',
                'QR Codes',
                'manage_restaurant_qrcodes',
                'rms-qrcodes',
                array($this, 'render_qrcodes_page')
            );
        }
        
        if (current_user_can('manage_restaurant_settings')) {
            add_submenu_page(
                'restaurant-menu',
                'Settings',
                'Settings',
                'manage_restaurant_settings',
                'rms-settings',
                array($this, 'render_settings_page')
            );
        }
        if (current_user_can('view_restaurant_reports')) {
            add_submenu_page(
                'restaurant-menu',
                'Reports',
                'Reports',
                'view_restaurant_reports',
                'rms-reports',
                array($this, 'render_reports_page')
            );
        }
        if (current_user_can('manage_restaurant_menu')) {
            add_submenu_page(
                'restaurant-menu',
                'Stock Management',
                'Stock',
                'manage_restaurant_menu',
                'rms-stock',
                array($this, 'render_stock_page')
            );
        }
        if (current_user_can('manage_restaurant_menu')) {
            add_submenu_page(
                'restaurant-menu',
                'Expenses',
                'Expenses',
                'manage_restaurant_menu',
                'rms-expenses',
                array($this, 'render_expenses_page')
            );
        }
    }
    
    public function render_view_menu_page() {
        echo '<div class="wrap"><div id="rms-view-menu-root"></div></div>';
    }
    
    public function render_admin_page() {
        echo '<div class="wrap"><div id="rms-admin-root"></div></div>';
    }
    
    public function render_orders_page() {
        echo '<div class="wrap"><div id="rms-orders-root"></div></div>';
    }
    
    public function render_categories_page() {
        echo '<div class="wrap"><div id="rms-categories-root"></div></div>';
    }
    
    public function render_qrcodes_page() {
        echo '<div class="wrap"><div id="rms-qrcodes-root"></div></div>';
    }
    
    public function render_settings_page() {
        echo '<div class="wrap"><div id="rms-settings-root"></div></div>';
    }
    public function render_reports_page() {
        echo '<div class="wrap"><div id="rms-reports-root"></div></div>';
    }
    public function render_stock_page() {
        echo '<div class="wrap"><div id="rms-stock-root"></div></div>';
    }
    public function render_expenses_page() {
        echo '<div class="wrap"><div id="rms-expenses-root"></div></div>';
    }
    public function enqueue_admin_scripts($hook) {
        if ('toplevel_page_restaurant-menu' === $hook) {
            wp_enqueue_style(
                'rms-admin-css',
                RMS_URL . 'assets/css/admin.css',
                array(),
                RMS_VERSION
            );
            
            wp_enqueue_script(
                'rms-admin',
                RMS_URL . 'build/admin.js',
                array('wp-element'),
                RMS_VERSION,
                true
            );
            
            wp_localize_script('rms-admin', 'rmsAdmin', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('rms_nonce'),
            ));
        }
        
        if ('restaurant-menu_page_rms-orders' === $hook || 'toplevel_page_rms-orders' === $hook) {
            wp_deregister_script('rms-orders');
            
            wp_enqueue_script(
                'rms-orders',
                RMS_URL . 'build/orders.js?v=' . filemtime(RMS_PATH . 'build/orders.js'),
                array('wp-element'),
                null,
                true
            );
            
            wp_localize_script('rms-orders', 'rmsAdmin', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('rms_nonce'),
            ));
        }
        
        if ('orders_page_rms-view-menu' === $hook) {
            wp_enqueue_script(
                'rms-view-menu',
                RMS_URL . 'build/view-menu.js',
                array('wp-element'),
                RMS_VERSION,
                true
            );
            
            wp_localize_script('rms-view-menu', 'rmsAdmin', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('rms_nonce'),
            ));
        }
        
        if ('restaurant-menu_page_rms-categories' === $hook) {
            wp_enqueue_script(
                'rms-categories',
                RMS_URL . 'build/categories.js',
                array('wp-element'),
                RMS_VERSION,
                true
            );
            
            wp_localize_script('rms-categories', 'rmsAdmin', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('rms_nonce'),
            ));
        }
        
        if ('restaurant-menu_page_rms-qrcodes' === $hook) {
            wp_enqueue_script(
                'rms-qrcodes',
                RMS_URL . 'build/qrcodes.js',
                array('wp-element'),
                RMS_VERSION,
                true
            );
            
            wp_localize_script('rms-qrcodes', 'rmsAdmin', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('rms_nonce'),
            ));
        }
        
        if ('restaurant-menu_page_rms-settings' === $hook) {
            wp_enqueue_script(
                'rms-settings',
                RMS_URL . 'build/settings.js',
                array('wp-element'),
                RMS_VERSION,
                true
            );
            
            wp_localize_script('rms-settings', 'rmsAdmin', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('rms_nonce'),
            ));
        }
        if ('restaurant-menu_page_rms-settings' === $hook) {
            wp_enqueue_script(
                'rms-settings',
                RMS_URL . 'build/settings.js',
                array('wp-element'),
                RMS_VERSION,
                true
            );
            
            wp_localize_script('rms-settings', 'rmsAdmin', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('rms_nonce'),
            ));
        }
        if ('restaurant-menu_page_rms-reports' === $hook) {
            wp_enqueue_script(
                'rms-reports',
                RMS_URL . 'build/reports.js',
                array('wp-element'),
                RMS_VERSION,
                true
            );
            
            wp_localize_script('rms-reports', 'rmsAdmin', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('rms_nonce'),
            ));
        }
        // Stock için script yükleme
        if ('restaurant-menu_page_rms-stock' === $hook) {
            wp_enqueue_script(
                'rms-stock',
                RMS_URL . 'build/stock.js',
                array('wp-element'),
                RMS_VERSION,
                true
            );
            
            wp_localize_script('rms-stock', 'rmsAdmin', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('rms_nonce'),
            ));
        }
        // Expenses için script yükleme
        if ('restaurant-menu_page_rms-expenses' === $hook) {
            wp_enqueue_script(
                'rms-expenses',
                RMS_URL . 'build/expenses.js',
                array('wp-element'),
                RMS_VERSION,
                true
            );
            
            wp_localize_script('rms-expenses', 'rmsAdmin', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('rms_nonce'),
            ));
        }
    }
    
    private function register_ajax_handlers() {
        add_action('wp_ajax_rms_get_menu_items', array($this, 'ajax_get_menu_items'));
        add_action('wp_ajax_rms_get_menu_items_readonly', array($this, 'ajax_get_menu_items_readonly'));
        add_action('wp_ajax_rms_save_menu_item', array($this, 'ajax_save_menu_item'));
        add_action('wp_ajax_rms_delete_menu_item', array($this, 'ajax_delete_menu_item'));
        add_action('wp_ajax_rms_get_categories', array($this, 'ajax_get_categories'));
        add_action('wp_ajax_rms_save_category', array($this, 'ajax_save_category'));
        add_action('wp_ajax_rms_delete_category', array($this, 'ajax_delete_category'));
        add_action('wp_ajax_rms_update_category_order', array($this, 'ajax_update_category_order'));
        add_action('wp_ajax_rms_get_tables', array($this, 'ajax_get_tables'));
        add_action('wp_ajax_rms_add_table', array($this, 'ajax_add_table'));
        add_action('wp_ajax_rms_delete_table', array($this, 'ajax_delete_table'));
        add_action('wp_ajax_rms_upload_image', array($this, 'ajax_upload_image'));
        add_action('wp_ajax_rms_get_orders', array($this, 'ajax_get_orders'));
        add_action('wp_ajax_rms_update_order_status', array($this, 'ajax_update_order_status'));
        add_action('wp_ajax_rms_delete_order', array($this, 'ajax_delete_order'));
        add_action('wp_ajax_rms_get_languages', array($this, 'ajax_get_languages'));
        add_action('wp_ajax_rms_get_translations', array($this, 'ajax_get_translations'));
        add_action('wp_ajax_rms_save_translation', array($this, 'ajax_save_translation'));
        add_action('wp_ajax_rms_get_category_translations', array($this, 'ajax_get_category_translations'));
        add_action('wp_ajax_rms_save_category_translation', array($this, 'ajax_save_category_translation'));
        add_action('wp_ajax_rms_get_settings', array($this, 'ajax_get_settings'));
        add_action('wp_ajax_rms_save_settings', array($this, 'ajax_save_settings'));
        add_action('wp_ajax_rms_get_current_user', array($this, 'ajax_get_current_user'));
        add_action('wp_ajax_nopriv_rms_submit_order', array($this, 'ajax_submit_order'));
        add_action('wp_ajax_rms_submit_order', array($this, 'ajax_submit_order'));
        add_action('wp_ajax_nopriv_rms_get_menu_by_language', array($this, 'ajax_get_menu_by_language'));
        add_action('wp_ajax_rms_get_menu_by_language', array($this, 'ajax_get_menu_by_language'));
        add_action('wp_ajax_rms_call_waiter', array($this, 'ajax_call_waiter'));
        add_action('wp_ajax_nopriv_rms_call_waiter', array($this, 'ajax_call_waiter'));
        add_action('wp_ajax_rms_get_calls', array($this, 'ajax_get_calls'));
        add_action('wp_ajax_rms_resolve_call', array($this, 'ajax_resolve_call'));
        add_action('wp_ajax_rms_get_order_status', array($this, 'ajax_get_order_status'));
        add_action('wp_ajax_nopriv_rms_get_order_status', array($this, 'ajax_get_order_status'));
        add_action('wp_ajax_rms_get_stocks', array($this, 'ajax_get_stocks'));
        add_action('wp_ajax_rms_save_stock', array($this, 'ajax_save_stock'));
        add_action('wp_ajax_rms_delete_stock', array($this, 'ajax_delete_stock'));
        add_action('wp_ajax_rms_get_expenses', array($this, 'ajax_get_expenses'));
        add_action('wp_ajax_rms_save_expense', array($this, 'ajax_save_expense'));
        add_action('wp_ajax_rms_delete_expense', array($this, 'ajax_delete_expense'));
    }
    
    public function ajax_get_current_user() {
        if (!is_user_logged_in()) {
            wp_send_json_error('Not logged in');
            return;
        }
        
        $user = wp_get_current_user();
        $capabilities = array(
            'manage_menu' => current_user_can('manage_restaurant_menu'),
            'manage_orders' => current_user_can('manage_restaurant_orders'),
            'manage_settings' => current_user_can('manage_restaurant_settings'),
            'manage_qrcodes' => current_user_can('manage_restaurant_qrcodes'),
            'view_reports' => current_user_can('view_restaurant_reports'),
            'manage_categories' => current_user_can('manage_restaurant_categories'),
            'view_menu' => current_user_can('view_restaurant_menu'),
        );
        
        wp_send_json_success(array(
            'id' => $user->ID,
            'name' => $user->display_name,
            'email' => $user->user_email,
            'role' => $user->roles[0],
            'capabilities' => $capabilities
        ));
    }
    
    public function ajax_get_menu_items_readonly() {
        $this->check_user_capability('view_restaurant_menu');
        check_ajax_referer('rms_nonce', 'nonce');
        
        $query = new WP_Query(array(
            'post_type' => 'rms_menu_item',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC',
        ));
        
        $items = array();
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            
            $terms = wp_get_post_terms($post_id, 'rms_category');
            $category_id = (!empty($terms) && !is_wp_error($terms)) ? $terms[0]->term_id : 0;
            $category_name = (!empty($terms) && !is_wp_error($terms)) ? $terms[0]->name : '';
            
            $items[] = array(
                'id' => $post_id,
                'name' => get_the_title(),
                'description' => get_the_content(),
                'price' => get_post_meta($post_id, '_rms_price', true),
                'allergens' => get_post_meta($post_id, '_rms_allergens', true),
                'image' => get_post_meta($post_id, '_rms_image', true),
                'category' => $category_id,
                'category_name' => $category_name,
            );
        }
        wp_reset_postdata();
        
        wp_send_json_success($items);
    }
    
    public function ajax_get_menu_items() {
        $this->check_user_capability('manage_restaurant_menu');
        check_ajax_referer('rms_nonce', 'nonce');
        
        $query = new WP_Query(array(
            'post_type' => 'rms_menu_item',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC',
        ));
        
        $items = array();
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            
            $terms = wp_get_post_terms($post_id, 'rms_category');
            $category_id = (!empty($terms) && !is_wp_error($terms)) ? $terms[0]->term_id : 0;
            $category_name = (!empty($terms) && !is_wp_error($terms)) ? $terms[0]->name : '';
            
            $items[] = array(
                'id' => $post_id,
                'name' => get_the_title(),
                'description' => get_the_content(),
                'price' => get_post_meta($post_id, '_rms_price', true),
                'allergens' => get_post_meta($post_id, '_rms_allergens', true),
                'image' => get_post_meta($post_id, '_rms_image', true),
                'category' => $category_id,
                'category_name' => $category_name,
            );
        }
        wp_reset_postdata();
        
        wp_send_json_success($items);
    }
    
    public function ajax_save_menu_item() {
        $this->check_user_capability('manage_restaurant_menu');
        check_ajax_referer('rms_nonce', 'nonce');
        
        $name = sanitize_text_field($_POST['name']);
        $description = sanitize_textarea_field($_POST['description']);
        $price = floatval($_POST['price']);
        $allergens = sanitize_text_field($_POST['allergens']);
        $category = !empty($_POST['category']) ? intval($_POST['category']) : 0;
        $image = !empty($_POST['image']) ? esc_url_raw($_POST['image']) : '';
        
        $post_data = array(
            'post_title' => $name,
            'post_content' => $description,
            'post_type' => 'rms_menu_item',
            'post_status' => 'publish',
        );
        
        if (!empty($_POST['id'])) {
            $post_data['ID'] = intval($_POST['id']);
            $post_id = wp_update_post($post_data);
        } else {
            $post_id = wp_insert_post($post_data);
        }
        
        if ($post_id) {
            update_post_meta($post_id, '_rms_price', $price);
            update_post_meta($post_id, '_rms_allergens', $allergens);
            update_post_meta($post_id, '_rms_image', $image);
            
            if ($category) {
                wp_set_object_terms($post_id, $category, 'rms_category');
            } else {
                wp_set_object_terms($post_id, array(), 'rms_category');
            }
            
            wp_send_json_success(array('id' => $post_id));
        } else {
            wp_send_json_error('Failed to save menu item');
        }
    }
    
    public function ajax_delete_menu_item() {
        $this->check_user_capability('manage_restaurant_menu');
        check_ajax_referer('rms_nonce', 'nonce');
        
        $result = wp_delete_post(intval($_POST['id']), true);
        
        if ($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error('Failed to delete menu item');
        }
    }
    
    public function ajax_get_categories() {
    $this->check_user_capability('manage_restaurant_categories');
    check_ajax_referer('rms_nonce', 'nonce');
    
    $terms = get_terms(array(
        'taxonomy' => 'rms_category',
        'hide_empty' => false,
    ));
    
    if (is_wp_error($terms)) {
        wp_send_json_success(array());
        return;
    }
    
    $categories = array();
    foreach ($terms as $term) {
        $display_order = get_term_meta($term->term_id, 'display_order', true);
        $categories[] = array(
            'id' => $term->term_id,
            'name' => $term->name,
            'slug' => $term->slug,
            'count' => $term->count,
            'display_order' => $display_order ? intval($display_order) : 0
        );
    }
    
    // Sort by display_order
    usort($categories, function($a, $b) {
        return ($a['display_order'] ?? 0) - ($b['display_order'] ?? 0);
    });
    
    wp_send_json_success($categories);
}
    
    public function ajax_save_category() {
        $this->check_user_capability('manage_restaurant_categories');
        check_ajax_referer('rms_nonce', 'nonce');
        
        $name = sanitize_text_field($_POST['name']);
        $slug = sanitize_title($_POST['slug']);
        $display_order = isset($_POST['display_order']) ? intval($_POST['display_order']) : 0;
        
        if (!empty($_POST['id'])) {
            $term_id = intval($_POST['id']);
            $result = wp_update_term($term_id, 'rms_category', array(
                'name' => $name,
                'slug' => $slug,
            ));
            if (!is_wp_error($result)) {
                update_term_meta($term_id, 'display_order', $display_order);
            }
        } else {
            $result = wp_insert_term($name, 'rms_category', array('slug' => $slug));
            if (!is_wp_error($result)) {
                update_term_meta($result['term_id'], 'display_order', $display_order);
            }
        }
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        } else {
            wp_send_json_success();
        }
    }
    
    public function ajax_delete_category() {
        $this->check_user_capability('manage_restaurant_categories');
        check_ajax_referer('rms_nonce', 'nonce');
        
        $result = wp_delete_term(intval($_POST['id']), 'rms_category');
        
        if (is_wp_error($result)) {
            wp_send_json_error();
        } else {
            wp_send_json_success();
        }
    }
    public function ajax_update_category_order() {
        $this->check_user_capability('manage_restaurant_categories');
        check_ajax_referer('rms_nonce', 'nonce');
        
        $categories = json_decode(stripslashes($_POST['categories']), true);
        
        if (!is_array($categories)) {
            wp_send_json_error('Invalid data');
            return;
        }
        
        foreach ($categories as $index => $category_id) {
            update_term_meta(intval($category_id), 'display_order', $index);
        }
        
        wp_send_json_success();
    }
    public function ajax_get_tables() {
        $this->check_user_capability('manage_restaurant_qrcodes');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'rms_tables';
        
        $tables = $wpdb->get_results(
            "SELECT * FROM $table_name ORDER BY table_number ASC",
            ARRAY_A
        );
        
        if ($tables) {
            foreach ($tables as &$table) {
                $menu_url = home_url('/menu?table=' . $table['table_number']);
                $table['qr_code'] = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($menu_url);
            }
        }
        
        wp_send_json_success($tables ? $tables : array());
    }
    
    public function ajax_add_table() {
        $this->check_user_capability('manage_restaurant_qrcodes');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'rms_tables';
        $table_number = sanitize_text_field($_POST['table_number']);
        
        $result = $wpdb->insert(
            $table_name,
            array('table_number' => $table_number),
            array('%s')
        );
        
        if ($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error('Table number already exists or database error');
        }
    }
    
    public function ajax_delete_table() {
        $this->check_user_capability('manage_restaurant_qrcodes');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'rms_tables';
        
        $result = $wpdb->delete(
            $table_name,
            array('id' => intval($_POST['id'])),
            array('%d')
        );
        
        if ($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error();
        }
    }
    
    public function ajax_upload_image() {
        $this->check_user_capability('manage_restaurant_menu');
        check_ajax_referer('rms_nonce', 'nonce');
        
        if (empty($_FILES['image'])) {
            wp_send_json_error('No file uploaded');
        }
        
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        
        $file = $_FILES['image'];
        $upload = wp_handle_upload($file, array('test_form' => false));
        
        if (isset($upload['error'])) {
            wp_send_json_error($upload['error']);
        }
        
        wp_send_json_success(array('url' => $upload['url']));
    }
    
    public function ajax_get_orders() {
        $this->check_user_capability('manage_restaurant_orders');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $orders_table = $wpdb->prefix . 'rms_orders';
        
        $orders = $wpdb->get_results(
            "SELECT * FROM $orders_table ORDER BY created_at DESC",
            ARRAY_A
        );
        
        if ($orders) {
            foreach ($orders as &$order) {
                if (is_string($order['items'])) {
                    $decoded = json_decode($order['items'], true);
                    $order['items'] = $decoded ? $decoded : array();
                } else {
                    $order['items'] = $order['items'] ? $order['items'] : array();
                }
            }
        }
        
        wp_send_json_success($orders ? $orders : array());
    }
    
    public function ajax_submit_order() {
        global $wpdb;
        $orders_table = $wpdb->prefix . 'rms_orders';
        
        $table_number = sanitize_text_field($_POST['table_number']);
        $customer_name = isset($_POST['customer_name']) ? sanitize_text_field($_POST['customer_name']) : '';
        $total_price = floatval($_POST['total_price']);
        $notes = isset($_POST['notes']) ? sanitize_textarea_field($_POST['notes']) : '';
        
        $items = isset($_POST['items']) ? wp_unslash($_POST['items']) : '[]';
        
        $result = $wpdb->insert(
            $orders_table,
            array(
                'table_number' => $table_number,
                'customer_name' => $customer_name,
                'items' => $items,
                'total_price' => $total_price,
                'notes' => $notes,
                'status' => 'pending'
            ),
            array('%s', '%s', '%s', '%f', '%s', '%s')
        );
        
        if ($result) {
            wp_send_json_success(array('order_id' => $wpdb->insert_id));
        } else {
            wp_send_json_error('Failed to submit order');
        }
    }
    
    public function ajax_update_order_status() {
        $this->check_user_capability('manage_restaurant_orders');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $orders_table = $wpdb->prefix . 'rms_orders';
        
        $result = $wpdb->update(
            $orders_table,
            array('status' => sanitize_text_field($_POST['status'])),
            array('id' => intval($_POST['id'])),
            array('%s'),
            array('%d')
        );
        
        if ($result !== false) {
            wp_send_json_success();
        } else {
            wp_send_json_error();
        }
    }
    
    public function ajax_delete_order() {
        $this->check_user_capability('manage_restaurant_orders');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $orders_table = $wpdb->prefix . 'rms_orders';
        
        $result = $wpdb->delete(
            $orders_table,
            array('id' => intval($_POST['id'])),
            array('%d')
        );
        
        if ($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error();
        }
    }
    
    public function ajax_get_languages() {
        wp_send_json_success($this->supported_languages);
    }
    
    public function ajax_get_translations() {
        $this->check_user_capability('manage_restaurant_menu');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $translations_table = $wpdb->prefix . 'rms_translations';
        $item_id = intval($_POST['item_id']);
        
        $translations = $wpdb->get_results(
            $wpdb->prepare("SELECT * FROM $translations_table WHERE item_id = %d", $item_id),
            ARRAY_A
        );
        
        $result = array();
        foreach ($translations as $trans) {
            $result[$trans['language_code']] = array(
                'name' => $trans['name'],
                'description' => $trans['description']
            );
        }
        
        wp_send_json_success($result);
    }
    
    public function ajax_save_translation() {
        $this->check_user_capability('manage_restaurant_menu');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $translations_table = $wpdb->prefix . 'rms_translations';
        
        $item_id = intval($_POST['item_id']);
        $language_code = sanitize_text_field($_POST['language_code']);
        $name = sanitize_text_field($_POST['name']);
        $description = sanitize_textarea_field($_POST['description']);
        
        $existing = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT id FROM $translations_table WHERE item_id = %d AND language_code = %s",
                $item_id,
                $language_code
            )
        );
        
        if ($existing) {
            $result = $wpdb->update(
                $translations_table,
                array('name' => $name, 'description' => $description),
                array('item_id' => $item_id, 'language_code' => $language_code),
                array('%s', '%s'),
                array('%d', '%s')
            );
        } else {
            $result = $wpdb->insert(
                $translations_table,
                array(
                    'item_id' => $item_id,
                    'language_code' => $language_code,
                    'name' => $name,
                    'description' => $description
                ),
                array('%d', '%s', '%s', '%s')
            );
        }
        
        if ($result !== false) {
            wp_send_json_success();
        } else {
            wp_send_json_error();
        }
    }
    
    public function ajax_get_category_translations() {
        $this->check_user_capability('manage_restaurant_categories');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $table = $wpdb->prefix . 'rms_category_translations';
        $category_id = intval($_POST['category_id']);
        
        $translations = $wpdb->get_results(
            $wpdb->prepare("SELECT * FROM $table WHERE category_id = %d", $category_id),
            ARRAY_A
        );
        
        $result = array();
        foreach ($translations as $trans) {
            $result[$trans['language_code']] = $trans['name'];
        }
        
        wp_send_json_success($result);
    }
    
    public function ajax_save_category_translation() {
        $this->check_user_capability('manage_restaurant_categories');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $table = $wpdb->prefix . 'rms_category_translations';
        
        $category_id = intval($_POST['category_id']);
        $language_code = sanitize_text_field($_POST['language_code']);
        $name = sanitize_text_field($_POST['name']);
        
        $existing = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT id FROM $table WHERE category_id = %d AND language_code = %s",
                $category_id,
                $language_code
            )
        );
        
        if ($existing) {
            $result = $wpdb->update(
                $table,
                array('name' => $name),
                array('category_id' => $category_id, 'language_code' => $language_code),
                array('%s'),
                array('%d', '%s')
            );
        } else {
            $result = $wpdb->insert(
                $table,
                array(
                    'category_id' => $category_id,
                    'language_code' => $language_code,
                    'name' => $name
                ),
                array('%d', '%s', '%s')
            );
        }
        
        if ($result !== false) {
            wp_send_json_success();
        } else {
            wp_send_json_error();
        }
    }
    
    public function ajax_call_waiter() {
        global $wpdb;
        $calls_table = $wpdb->prefix . 'rms_calls';
        
        $table_number = sanitize_text_field($_POST['table_number']);
        
        $result = $wpdb->insert(
            $calls_table,
            array(
                'table_number' => $table_number,
                'status' => 'pending'
            ),
            array('%s', '%s')
        );
        
        if ($result) {
            wp_send_json_success(array('message' => 'Waiter called successfully'));
        } else {
            wp_send_json_error('Failed to call waiter');
        }
    }
    
    public function ajax_get_calls() {
        $this->check_user_capability('manage_restaurant_orders');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $calls_table = $wpdb->prefix . 'rms_calls';
        
        $calls = $wpdb->get_results(
            "SELECT * FROM $calls_table WHERE status = 'pending' ORDER BY created_at DESC",
            ARRAY_A
        );
        
        wp_send_json_success($calls ? $calls : array());
    }
    
    public function ajax_resolve_call() {
        $this->check_user_capability('manage_restaurant_orders');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $calls_table = $wpdb->prefix . 'rms_calls';
        
        $result = $wpdb->update(
            $calls_table,
            array(
                'status' => 'resolved',
                'resolved_at' => current_time('mysql')
            ),
            array('id' => intval($_POST['id'])),
            array('%s', '%s'),
            array('%d')
        );
        
        if ($result !== false) {
            wp_send_json_success();
        } else {
            wp_send_json_error();
        }
    }
    
    public function ajax_get_order_status() {
        global $wpdb;
        $orders_table = $wpdb->prefix . 'rms_orders';
        
        $order_id = intval($_GET['order_id']);
        
        $order = $wpdb->get_row(
            $wpdb->prepare("SELECT status FROM $orders_table WHERE id = %d", $order_id),
            ARRAY_A
        );
        
        if ($order) {
            wp_send_json_success($order);
        } else {
            wp_send_json_error('Order not found');
        }
    }
    public function ajax_get_menu_by_language() {
        global $wpdb;
        $language = isset($_GET['lang']) ? sanitize_text_field($_GET['lang']) : 'en';
        $translations_table = $wpdb->prefix . 'rms_translations';
        $category_translations_table = $wpdb->prefix . 'rms_category_translations';
        
        $categories = get_terms(array(
            'taxonomy' => 'rms_category',
            'hide_empty' => true,
        ));
        
        $menu_data = array();
        
        foreach ($categories as $category) {
            $cat_translation = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT name FROM $category_translations_table WHERE category_id = %d AND language_code = %s",
                    $category->term_id,
                    $language
                )
            );
            
            $category_name = $cat_translation ? $cat_translation : $category->name;
            
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
                
                $translation = $wpdb->get_row(
                    $wpdb->prepare(
                        "SELECT name, description FROM $translations_table WHERE item_id = %d AND language_code = %s",
                        $post_id,
                        $language
                    ),
                    ARRAY_A
                );
                
                $items[] = array(
                    'id' => $post_id,
                    'name' => $translation && !empty($translation['name']) ? $translation['name'] : get_the_title(),
                    'description' => $translation && !empty($translation['description']) ? $translation['description'] : get_the_content(),
                    'price' => get_post_meta($post_id, '_rms_price', true),
                    'allergens' => get_post_meta($post_id, '_rms_allergens', true),
                    'image' => get_post_meta($post_id, '_rms_image', true),
                );
            }
            wp_reset_postdata();
            
            if (!empty($items)) {
                $menu_data[] = array(
                    'category' => $category_name,
                    'items' => $items,
                );
            }
        }
        
        wp_send_json_success($menu_data);
    }
    
    public function ajax_get_settings() {
        $this->check_user_capability('manage_restaurant_settings');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $table = $wpdb->prefix . 'rms_settings';
        
        $default_language = $wpdb->get_var(
            "SELECT setting_value FROM $table WHERE setting_key = 'default_language'"
        );
        
        $admin_language = $wpdb->get_var(
            "SELECT setting_value FROM $table WHERE setting_key = 'admin_language'"
        );
        
        wp_send_json_success(array(
            'default_language' => $default_language ? $default_language : 'en',
            'admin_language' => $admin_language ? $admin_language : 'en'
        ));
    }
    
    public function ajax_save_settings() {
        $this->check_user_capability('manage_restaurant_settings');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $table = $wpdb->prefix . 'rms_settings';
        $default_language = sanitize_text_field($_POST['default_language']);
        $admin_language = sanitize_text_field($_POST['admin_language']);
        
        $wpdb->delete($table, array('setting_key' => 'default_language'), array('%s'));
        $wpdb->delete($table, array('setting_key' => 'admin_language'), array('%s'));
        
        $wpdb->insert(
            $table,
            array('setting_key' => 'default_language', 'setting_value' => $default_language),
            array('%s', '%s')
        );
        
        $wpdb->insert(
            $table,
            array('setting_key' => 'admin_language', 'setting_value' => $admin_language),
            array('%s', '%s')
        );
        
        wp_send_json_success();
    }
    
    public function ajax_get_stocks() {
        $this->check_user_capability('manage_restaurant_menu');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $stock_table = $wpdb->prefix . 'rms_stock';
        
        $stocks = $wpdb->get_results(
            "SELECT * FROM $stock_table ORDER BY item_name ASC",
            ARRAY_A
        );
        
        wp_send_json_success($stocks ? $stocks : array());
    }
    
    public function ajax_save_stock() {
        $this->check_user_capability('manage_restaurant_menu');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $stock_table = $wpdb->prefix . 'rms_stock';
        
        $data = array(
            'item_name' => sanitize_text_field($_POST['item_name']),
            'current_stock' => floatval($_POST['current_stock']),
            'min_stock' => floatval($_POST['min_stock']),
            'unit' => sanitize_text_field($_POST['unit']),
            'supplier' => !empty($_POST['supplier']) ? sanitize_text_field($_POST['supplier']) : '',
            'last_order_date' => !empty($_POST['last_order_date']) ? sanitize_text_field($_POST['last_order_date']) : null,
            'notes' => !empty($_POST['notes']) ? sanitize_textarea_field($_POST['notes']) : ''
        );
        
        if (!empty($_POST['id'])) {
            $result = $wpdb->update(
                $stock_table,
                $data,
                array('id' => intval($_POST['id'])),
                array('%s', '%f', '%f', '%s', '%s', '%s', '%s'),
                array('%d')
            );
            
            // Update her zaman 0 veya 1 döner, false kontrolü yanlış
            if ($result !== false) {
                wp_send_json_success(array('message' => 'Stock updated'));
            } else {
                wp_send_json_error('Database update error: ' . $wpdb->last_error);
            }
        } else {
            $result = $wpdb->insert(
                $stock_table,
                $data,
                array('%s', '%f', '%f', '%s', '%s', '%s', '%s')
            );
            
            if ($result) {
                wp_send_json_success(array('message' => 'Stock created', 'id' => $wpdb->insert_id));
            } else {
                wp_send_json_error('Database insert error: ' . $wpdb->last_error);
            }
        }
    }
    
    public function ajax_delete_stock() {
        $this->check_user_capability('manage_restaurant_menu');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $stock_table = $wpdb->prefix . 'rms_stock';
        
        $result = $wpdb->delete(
            $stock_table,
            array('id' => intval($_POST['id'])),
            array('%d')
        );
        
        if ($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error();
        }
    }
    public function ajax_get_expenses() {
        $this->check_user_capability('manage_restaurant_menu');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $expenses_table = $wpdb->prefix . 'rms_expenses';
        
        $expenses = $wpdb->get_results(
            "SELECT * FROM $expenses_table ORDER BY expense_date DESC, created_at DESC",
            ARRAY_A
        );
        
        wp_send_json_success($expenses ? $expenses : array());
    }
    
    public function ajax_save_expense() {
        $this->check_user_capability('manage_restaurant_menu');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $expenses_table = $wpdb->prefix . 'rms_expenses';
        
        $data = array(
            'category' => sanitize_text_field($_POST['category']),
            'amount' => floatval($_POST['amount']),
            'description' => sanitize_text_field($_POST['description']),
            'expense_date' => sanitize_text_field($_POST['expense_date']),
            'receipt_url' => !empty($_POST['receipt_url']) ? esc_url_raw($_POST['receipt_url']) : '',
            'notes' => !empty($_POST['notes']) ? sanitize_textarea_field($_POST['notes']) : ''
        );
        
        if (!empty($_POST['id'])) {
            $result = $wpdb->update(
                $expenses_table,
                $data,
                array('id' => intval($_POST['id'])),
                array('%s', '%f', '%s', '%s', '%s', '%s'),
                array('%d')
            );
            
            if ($result !== false) {
                wp_send_json_success(array('message' => 'Expense updated'));
            } else {
                wp_send_json_error('Database update error');
            }
        } else {
            $result = $wpdb->insert(
                $expenses_table,
                $data,
                array('%s', '%f', '%s', '%s', '%s', '%s')
            );
            
            if ($result) {
                wp_send_json_success(array('message' => 'Expense created', 'id' => $wpdb->insert_id));
            } else {
                wp_send_json_error('Database insert error');
            }
        }
    }
    
    public function ajax_delete_expense() {
        $this->check_user_capability('manage_restaurant_menu');
        check_ajax_referer('rms_nonce', 'nonce');
        
        global $wpdb;
        $expenses_table = $wpdb->prefix . 'rms_expenses';
        
        $result = $wpdb->delete(
            $expenses_table,
            array('id' => intval($_POST['id'])),
            array('%d')
        );
        
        if ($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error();
        }
    }
    
}

Restaurant_Menu_System::get_instance();