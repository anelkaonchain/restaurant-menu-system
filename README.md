# 🍽️ Restaurant Menu & Order System

**Professional WordPress Plugin for Restaurant Management with QR Codes and Online Ordering**

Transform your restaurant operations with this comprehensive management system featuring QR code menus, real-time order tracking, multi-language support, and complete business analytics.

---

## ✨ Key Features

### 📱 Digital Menu System
- **QR Code Integration** - Generate unique QR codes for each table
- **Mobile-Optimized Menu** - Beautiful, responsive menu interface for customers
- **Real-Time Updates** - Menu changes reflect instantly on all QR codes
- **Image Support** - High-quality product images with automatic optimization

### 🌍 Multi-Language Support
- **30 Languages** - Built-in support for major world languages
- **Easy Translation** - Translate menu items and categories with one click
- **Language Switcher** - Customers can view menu in their preferred language
- **Supported Languages**: English, Turkish, Spanish, Arabic, German, French, Italian, Japanese, Chinese, Russian, Portuguese, Hindi, Dutch, Korean, Polish, Swedish, Norwegian, Danish, Finnish, Greek, Czech, Hungarian, Romanian, Thai, Vietnamese, Indonesian, Ukrainian, Hebrew, Bengali, Persian

### 📦 Complete Restaurant Management
- **Menu Management** - Add, edit, and organize menu items with categories
- **Order System** - Real-time order tracking from pending to delivered
- **Category Organization** - Organize menu items by categories
- **Stock Management** - Track inventory levels and supplier information
- **Expense Tracking** - Monitor business expenses by category
- **User Roles** - Separate permissions for owners and waiters

### 📊 Business Intelligence
- **Order Analytics** - Track order history and status
- **Expense Reports** - Monitor spending by category and time period
- **Stock Alerts** - Get notified when inventory runs low
- **Revenue Tracking** - Monitor daily, weekly, and monthly performance

### 🎨 Modern User Interface
- **React-Powered** - Fast, responsive admin interface
- **Intuitive Design** - Easy to use for non-technical users
- **Mobile Responsive** - Works perfectly on all devices
- **Dark/Light Mode Support** - Comfortable viewing in any lighting

---

## 🚀 Installation

### Requirements
- WordPress 5.8 or higher
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Modern web browser

### Step-by-Step Installation

1. **Download the Plugin**
   - Download `restaurant-menu-system.zip` from your purchase

2. **Upload to WordPress**
   - Go to WordPress Admin → Plugins → Add New
   - Click "Upload Plugin"
   - Choose the downloaded ZIP file
   - Click "Install Now"

3. **Activate**
   - Click "Activate Plugin"
   - The plugin will create necessary database tables automatically

4. **Initial Setup**
   - Go to Restaurant Menu → Settings
   - Configure default language
   - Set up categories
   - Add your first menu items

5. **Create QR Codes**
   - Go to Restaurant Menu → QR Codes
   - Add table numbers
   - Print QR codes for each table

---

## 📖 Usage Guide

### For Restaurant Owners

#### Setting Up Your Menu

1. **Create Categories**
   - Navigate to Restaurant Menu → Categories
   - Click "Add New Category"
   - Enter category name (e.g., "Appetizers", "Main Courses")
   - Add translations for each language

2. **Add Menu Items**
   - Go to Restaurant Menu → Menu Items
   - Click "Add New Item"
   - Fill in:
     - Item name
     - Description
     - Price
     - Category
     - Allergen information (optional)
     - Upload image (optional)
   - Click "Translate" to add translations

3. **Generate QR Codes**
   - Go to QR Codes section
   - Add table numbers (e.g., Table 1, Table 2)
   - Click "Print QR Code" for each table
   - Place printed QR codes on tables

#### Managing Orders

1. **View Orders**
   - Navigate to Orders page
   - See all orders in real-time
   - Filter by status: Pending, Preparing, Ready, Delivered

2. **Process Orders**
   - Click on an order to view details
   - Update status as order progresses
   - Customer receives automatic notifications

3. **Handle Waiter Calls**
   - Waiter call notifications appear instantly
   - Mark as resolved when attended

#### Tracking Expenses

1. **Add Expenses**
   - Go to Expenses section
   - Click "Add Expense"
   - Select category (Rent, Salary, Utilities, etc.)
   - Enter amount and date
   - Add receipt URL (optional)

2. **View Reports**
   - Filter by time range (Today, Week, Month, Year)
   - Filter by category
   - See total expenses at a glance

#### Managing Stock

1. **Add Stock Items**
   - Navigate to Stock section
   - Click "Add Item"
   - Enter item name, current stock, minimum stock
   - Add supplier information

2. **Monitor Inventory**
   - Items below minimum stock are highlighted
   - Update stock levels as needed

### For Waiters

#### View Menu
- Access read-only menu view
- Check item availability
- View prices and descriptions

#### Manage Orders
- View incoming orders
- Update order status
- Respond to customer calls

### For Customers

#### Ordering via QR Code

1. **Scan QR Code**
   - Use phone camera to scan table QR code
   - Menu opens automatically in browser

2. **Browse Menu**
   - View all categories and items
   - See prices, descriptions, and images
   - Change language if needed

3. **Place Order**
   - Tap items to add to cart
   - Review cart and add special requests
   - Submit order

4. **Track Order**
   - Real-time status updates
   - Notifications when order is ready

5. **Call Waiter**
   - Tap "Call Waiter" button
   - Waiter receives instant notification

---

## 🎨 Screenshots

### Admin Panel
1. **Menu Management** - Intuitive interface for managing menu items
2. **Order Dashboard** - Real-time order tracking and management
3. **QR Code Generator** - Create and print QR codes for tables
4. **Multi-Language Settings** - Configure languages and translations
5. **Expense Tracking** - Monitor business expenses with beautiful charts
6. **Stock Management** - Track inventory levels and suppliers

### Customer Experience
7. **Mobile Menu** - Beautiful, responsive menu interface
8. **Shopping Cart** - Easy-to-use cart and checkout
9. **Order Tracking** - Real-time order status updates
10. **Language Selector** - Switch between 30 languages instantly

---

## 🛠️ Technical Specifications

### Built With
- **Frontend**: React 18.2.0, WordPress Element API
- **Backend**: PHP 7.4+, WordPress Plugin API
- **Database**: MySQL with custom tables
- **Build Tool**: @wordpress/scripts
- **Styling**: Inline CSS (no external dependencies)

### Database Tables
- `wp_rms_tables` - Table management
- `wp_rms_orders` - Order data
- `wp_rms_translations` - Menu item translations
- `wp_rms_category_translations` - Category translations
- `wp_rms_settings` - Plugin settings
- `wp_rms_calls` - Waiter call requests
- `wp_rms_stock` - Inventory management
- `wp_rms_expenses` - Expense tracking

### Security Features
- WordPress nonce verification
- Data sanitization and validation
- SQL injection prevention
- XSS protection
- Capability-based access control

---

## 🔧 Configuration

### Language Settings
```
Restaurant Menu → Settings → Languages
- Default Language: Language for new menu items
- Admin Panel Language: Interface language for staff
```

### User Roles and Capabilities
```
Restaurant Owner:
- Full access to all features
- Manage menu, orders, settings
- View reports and analytics

Waiter:
- View menu (read-only)
- Manage orders
- Respond to customer calls
```

---

## 🆘 Troubleshooting

### QR Codes Not Working
- Ensure permalink structure is set (Settings → Permalinks → Save)
- Check if mod_rewrite is enabled on server

### Orders Not Appearing
- Verify AJAX URL is correct in browser console
- Check PHP error logs for database issues

### Translation Not Showing
- Make sure translations are saved for selected language
- Clear browser cache

### Images Not Uploading
- Check upload directory permissions (wp-content/uploads)
- Verify max upload size in php.ini

---

## 📋 Changelog

### Version 1.0.0 (2025-01-15)
- Initial release
- Menu management system
- QR code generation
- Order tracking
- 30 language support
- User role system
- Stock management
- Expense tracking
- Waiter call feature
- Real-time notifications

---

## 🤝 Support

### Getting Help
- **Documentation**: Full documentation included
- **Email Support**: anelkaonchain@gmail.com
- **Response Time**: Within 24 hours (business days)

### Before Contacting Support
1. Check this documentation
2. Review troubleshooting section
3. Check WordPress and PHP versions meet requirements
4. Disable other plugins to test for conflicts

### When Requesting Support, Include:
- WordPress version
- PHP version
- Plugin version
- Description of the issue
- Steps to reproduce
- Screenshots (if applicable)

---

## 📜 License

This plugin is licensed under GPL-2.0+

### What You Can Do
✅ Use on unlimited personal or client websites
✅ Modify the code
✅ Create derivative works

### What You Cannot Do
❌ Resell or redistribute the plugin
❌ Remove copyright notices
❌ Use for products competing with this plugin

---

## 🎯 Roadmap

### Planned Features (v1.1)
- [ ] Email notifications for orders
- [ ] SMS integration (Twilio)
- [ ] Payment gateway (Stripe/PayPal)
- [ ] Advanced analytics dashboard
- [ ] Table reservation system
- [ ] Customer loyalty program
- [ ] Kitchen display system
- [ ] Receipt printer integration

### Planned Features (v1.2)
- [ ] Multi-restaurant support
- [ ] Employee shift management
- [ ] Customer feedback system
- [ ] Social media integration
- [ ] Recipe management
- [ ] Nutrition information display

---

## 🙏 Credits

### Author
 anelkaonchain

- Email: anelkaonchain@gmail.com

### Technologies Used
- React - A JavaScript library for building user interfaces
- WordPress - Content management system
- QR Server API - QR code generation

---

## ⭐ Rate Us

If you find this plugin helpful, please consider:
- ⭐ Rating us 5 stars on CodeCanyon
- 💬 Leaving a review
- 🔄 Recommending to other restaurant owners

Your feedback helps us improve!

---

## 📞 Contact

- **Support Email**: anelkaonchain@gmail.com

---

**Made with ❤️ for Restaurant Owners Worldwide**

© 2025 anelkaonchain. All rights reserved.