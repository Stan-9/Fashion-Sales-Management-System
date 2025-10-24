# Fashion Sales Management System

Fashion Sales Management System is a lightweight, end-to-end sales and inventory platform tailored for small fashion retailers. It streamlines product, customer, and order management while providing actionable insights from customer ratings and recent sales to guide restocking and promotion decisions.

Key capabilities:
- Products, customers, and orders with search and filters in a clean UI.
- Inventory monitoring with low-stock alerts and minimum thresholds.
- Ratings (1–5) per product with averages and counts.
- Insights and predictions: best sellers, market summary (total revenue, total orders, average order value, top category), and next‑month demand forecast that blends 3‑month sales with a rating signal.
- Dashboard KPIs for at‑a‑glance status.
- Built‑in assistant chatbot to quickly navigate sections and surface insights.

Tech stack: Node.js, Express, and SQLite on the backend; HTML, CSS, and vanilla JavaScript on the frontend. Authentication uses JWT with bcrypt hashing. The app ships with seed data and an admin account to help you explore it immediately.

Quick start:
```bash
npm install
cd server && npm install
cd .. && npm run server
# App: http://localhost:5000
```

Default login:
- Username: `admin`
- Password: `admin123`

This project emphasizes clarity and practicality over complexity. It is easy to run, simple to extend, and focused on turning day‑to‑day transactions and customer sentiment into clear, data‑driven recommendations for what to stock, when to reorder, and where to focus promotions.

## Features

### 🎯 Core Features
- **Dashboard Analytics** - Real-time sales metrics and business insights
- **Product Management** - Complete inventory control with categories, sizes, colors, and brands
- **Customer Management** - Customer database with contact information and order history
- **Order Processing** - Create and manage sales orders with item tracking
- **Inventory Control** - Stock level monitoring with low-stock alerts
- **User Authentication** - Secure login system with role-based access

### 📊 Dashboard
- Total products, customers, and orders
- Revenue tracking
- Low stock alerts
- Quick access to key metrics

### 📦 Product Management
- Add/edit/delete products
- Category organization (Tops, Bottoms, Dresses, Outerwear, Accessories)
- SKU management
- Price and cost tracking
- Stock quantity monitoring
- Size, color, and brand attributes
- Search and filter capabilities

### 👥 Customer Management
- Customer database with contact details
- Address management
- Search functionality
- Order history tracking

### 🛒 Order Processing
- Create new orders
- Add multiple items per order
- Automatic total calculation with tax and discount
- Payment method tracking
- Order status management
- Customer order history

### 📈 Inventory Management
- Real-time stock levels
- Low stock alerts
- Stock level monitoring
- Product availability tracking

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with modern design
- **Vanilla JavaScript** - Functionality
- **Font Awesome** - Icons

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Quick Start

1. **Clone or download the project**
   ```bash
   cd "sales mng system"
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser and go to `http://localhost:5000`
   - Use the demo credentials to login:
     - **Username:** admin
     - **Password:** admin123

### Manual Setup

If you prefer to set up each part manually:

1. **Install root dependencies**
   ```bash
   npm install
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Start the server**
   ```bash
   cd server
   npm run dev
   ```

4. **Access the application**
   - The server will run on `http://localhost:5000`
   - The frontend will be served from the same port

## Usage Guide

### Getting Started

1. **Login** - Use the provided demo credentials to access the system
2. **Dashboard** - View your business metrics and alerts
3. **Add Products** - Start by adding your fashion items with details like size, color, brand
4. **Add Customers** - Create customer profiles for order management
5. **Create Orders** - Process sales by creating orders with multiple items

### Product Management

1. Navigate to the **Products** section
2. Click **Add Product** to create new items
3. Fill in product details:
   - Name, SKU, Description
   - Category, Brand, Size, Color
   - Price, Cost, Stock Quantity
   - Minimum stock level for alerts
4. Use search and filters to find products quickly

### Order Processing

1. Go to the **Orders** section
2. Click **New Order**
3. Select a customer
4. Add products with quantities
5. Apply discounts if needed
6. Review totals and create the order

### Inventory Monitoring

1. Check the **Inventory** section for stock levels
2. Review low stock alerts
3. Monitor product availability
4. Update stock quantities as needed

## Database Schema

The system uses SQLite with the following main tables:

- **users** - System users and authentication
- **categories** - Product categories
- **products** - Product catalog with inventory
- **customers** - Customer information
- **orders** - Sales orders
- **order_items** - Individual items within orders

## API Endpoints

### Authentication
- `POST /api/login` - User login

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Customization

### Adding New Categories
1. Access the database directly or add through the API
2. Categories are used for product organization

### Modifying Tax Rates
1. Edit the tax calculation in `public/script.js`
2. Currently set to 8% - modify the `calculateOrderTotal()` function

### Styling Changes
1. Modify `public/styles.css` for visual changes
2. The design is responsive and modern

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection protection
- CORS configuration

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in `server/index.js`
   - Update the API_BASE in `public/script.js`

2. **Database errors**
   - Ensure SQLite is properly installed
   - Check file permissions

3. **Login issues**
   - Use the demo credentials: admin/admin123
   - Check browser console for errors

### Getting Help

1. Check the browser console for JavaScript errors
2. Verify the server is running on port 5000
3. Ensure all dependencies are installed
4. Check network connectivity

## Future Enhancements

- Payment gateway integration
- Advanced reporting and analytics
- Barcode scanning
- Multi-location inventory
- Email notifications
- Mobile app
- Advanced user roles and permissions

## License

This project is licensed under the MIT License.

## Support

For support or questions about this sales management system, please check the troubleshooting section or review the code documentation.

---

**Note:** This is a demo system with sample data. For production use, ensure proper security measures, data backup, and user management are implemented.
