// Global variables
let currentUser = null;
let currentSection = 'dashboard';
let products = [];
let customers = [];
let orders = [];
let categories = [];
let orderItems = [];

// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        currentUser = JSON.parse(localStorage.getItem('user'));
        showApp();
        loadDashboardData();
    } else {
        showLoginOverlay();
    }

    // Event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.closest('.nav-link').dataset.section;
            showSection(section);
        });
    });
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Product management
    document.getElementById('addProductBtn').addEventListener('click', () => showProductModal());
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    document.getElementById('cancelProduct').addEventListener('click', () => closeModal('productModal'));
    
    // Customer management
    document.getElementById('addCustomerBtn').addEventListener('click', () => showCustomerModal());
    document.getElementById('customerForm').addEventListener('submit', handleCustomerSubmit);
    document.getElementById('cancelCustomer').addEventListener('click', () => closeModal('customerModal'));
    
    // Order management
    document.getElementById('addOrderBtn').addEventListener('click', () => showOrderModal());
    document.getElementById('orderForm').addEventListener('submit', handleOrderSubmit);
    document.getElementById('cancelOrder').addEventListener('click', () => closeModal('orderModal'));
    document.getElementById('addOrderItem').addEventListener('click', addOrderItem);
    
    // Search and filters
    document.getElementById('productSearch').addEventListener('input', debounce(loadProducts, 300));
    document.getElementById('categoryFilter').addEventListener('change', loadProducts);
    document.getElementById('lowStockFilter').addEventListener('click', () => loadProducts(true));
    document.getElementById('customerSearch').addEventListener('input', debounce(loadCustomers, 300));
    document.getElementById('orderStatusFilter').addEventListener('change', loadOrders);
    
    // Order discount calculation
    document.getElementById('orderDiscount').addEventListener('input', calculateOrderTotal);

    // Insights: rating form
    const ratingForm = document.getElementById('ratingForm');
    if (ratingForm) {
        ratingForm.addEventListener('submit', handleRatingSubmit);
    }

    // Chatbot events
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbot = document.getElementById('chatbot');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatbotSend = document.getElementById('chatbotSend');
    const chatbotInput = document.getElementById('chatbotInput');

    if (chatbotToggle && chatbot) {
        chatbotToggle.addEventListener('click', () => {
            openChatbot();
        });
    }
    if (chatbotClose && chatbot) {
        chatbotClose.addEventListener('click', () => {
            closeChatbot();
        });
    }
    if (chatbotSend) {
        chatbotSend.addEventListener('click', sendChatbotMessage);
    }
    if (chatbotInput) {
        chatbotInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                sendChatbotMessage();
            }
        });
    }
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showApp();
            loadDashboardData();
        } else {
            showMessage('Invalid credentials', 'error');
        }
    } catch (error) {
        showMessage('Login failed. Please try again.', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.textContent = '';
    }
    showLoginOverlay();
}

function showLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    const appShell = document.getElementById('app');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
    if (appShell) {
        appShell.classList.add('hidden');
    }
}

function showApp() {
    hideLoginOverlay();
    const appShell = document.getElementById('app');
    if (appShell) {
        appShell.classList.remove('hidden');
    }
    const userInfo = document.getElementById('userInfo');
    if (userInfo && currentUser) {
        userInfo.textContent = `Welcome, ${currentUser.username}`;
    }
}

function hideLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Navigation functions
function showSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');
    
    currentSection = sectionName;
    
    // Load section data
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'products':
            loadProducts();
            loadCategories();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'orders':
            loadOrders();
            loadCustomers();
            break;
        case 'inventory':
            loadInventoryData();
            break;
        case 'insights':
            loadPredictions();
            loadProductsForRatings();
            break;
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE}/dashboard/stats`);
        const stats = await response.json();
        
        document.getElementById('totalProducts').textContent = stats.total_products;
        document.getElementById('totalCustomers').textContent = stats.total_customers;
        document.getElementById('totalOrders').textContent = stats.total_orders;
        document.getElementById('totalRevenue').textContent = `$${stats.total_revenue.toFixed(2)}`;
        document.getElementById('lowStockCount').textContent = stats.low_stock_products;
        
        if (stats.low_stock_products > 0) {
            document.getElementById('lowStockAlert').style.display = 'flex';
        } else {
            document.getElementById('lowStockAlert').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Product functions
async function loadProducts(lowStockOnly = false) {
    try {
        const search = document.getElementById('productSearch').value;
        const category = document.getElementById('categoryFilter').value;
        
        let url = `${API_BASE}/products?`;
        const params = new URLSearchParams();
        
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (lowStockOnly) params.append('lowStock', 'true');
        
        url += params.toString();
        
        const response = await fetch(url);
        products = await response.json();
        
        renderProductsTable();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-box"></i>
                    <h3>No products found</h3>
                    <p>Add some products to get started</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>
                <div>
                    <strong>${product.name}</strong>
                    <br>
                    <small class="text-muted">${product.sku}</small>
                </div>
            </td>
            <td>${product.category_name || 'N/A'}</td>
            <td>$${product.price}</td>
            <td>
                <span class="${product.stock_quantity <= product.min_stock_level ? 'stock-level' : ''}">
                    ${product.stock_quantity}
                </span>
            </td>
            <td>${product.brand || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        categories = await response.json();
        
        const categorySelects = ['productCategory', 'categoryFilter'];
        categorySelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            const currentValue = select.value;
            
            select.innerHTML = selectId === 'categoryFilter' 
                ? '<option value="">All Categories</option>'
                : '<option value="">Select Category</option>';
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
            
            select.value = currentValue;
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function showProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');
    
    if (product) {
        title.textContent = 'Edit Product';
        form.dataset.productId = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productSku').value = product.sku;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productCategory').value = product.category_id || '';
        document.getElementById('productBrand').value = product.brand || '';
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCost').value = product.cost || '';
        document.getElementById('productSize').value = product.size || '';
        document.getElementById('productColor').value = product.color || '';
        document.getElementById('productStock').value = product.stock_quantity;
        document.getElementById('productMinStock').value = product.min_stock_level;
    } else {
        title.textContent = 'Add Product';
        form.reset();
        delete form.dataset.productId;
    }
    
    modal.style.display = 'block';
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        category_id: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        cost: parseFloat(document.getElementById('productCost').value) || 0,
        sku: document.getElementById('productSku').value,
        size: document.getElementById('productSize').value,
        color: document.getElementById('productColor').value,
        brand: document.getElementById('productBrand').value,
        stock_quantity: parseInt(document.getElementById('productStock').value),
        min_stock_level: parseInt(document.getElementById('productMinStock').value)
    };
    
    try {
        const productId = e.target.dataset.productId;
        const url = productId ? `${API_BASE}/products/${productId}` : `${API_BASE}/products`;
        const method = productId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            showMessage('Product saved successfully', 'success');
            closeModal('productModal');
            loadProducts();
        } else {
            const error = await response.json();
            showMessage(error.error || 'Error saving product', 'error');
        }
    } catch (error) {
        showMessage('Error saving product', 'error');
    }
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        showProductModal(product);
    }
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(`${API_BASE}/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                showMessage('Product deleted successfully', 'success');
                loadProducts();
            } else {
                showMessage('Error deleting product', 'error');
            }
        } catch (error) {
            showMessage('Error deleting product', 'error');
        }
    }
}

// Customer functions
async function loadCustomers() {
    try {
        const search = document.getElementById('customerSearch').value;
        let url = `${API_BASE}/customers`;
        if (search) {
            url += `?search=${encodeURIComponent(search)}`;
        }
        
        const response = await fetch(url);
        customers = await response.json();
        
        renderCustomersTable();
        updateCustomerSelects();
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

function renderCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    
    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No customers found</h3>
                    <p>Add some customers to get started</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.first_name} ${customer.last_name}</td>
            <td>${customer.email || 'N/A'}</td>
            <td>${customer.phone || 'N/A'}</td>
            <td>${customer.city || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="editCustomer(${customer.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateCustomerSelects() {
    const orderCustomerSelect = document.getElementById('orderCustomer');
    orderCustomerSelect.innerHTML = '<option value="">Select Customer</option>';
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.first_name} ${customer.last_name}`;
        orderCustomerSelect.appendChild(option);
    });
}

function showCustomerModal(customer = null) {
    const modal = document.getElementById('customerModal');
    const form = document.getElementById('customerForm');
    const title = document.getElementById('customerModalTitle');
    
    if (customer) {
        title.textContent = 'Edit Customer';
        form.dataset.customerId = customer.id;
        document.getElementById('customerFirstName').value = customer.first_name;
        document.getElementById('customerLastName').value = customer.last_name;
        document.getElementById('customerEmail').value = customer.email || '';
        document.getElementById('customerPhone').value = customer.phone || '';
        document.getElementById('customerAddress').value = customer.address || '';
        document.getElementById('customerCity').value = customer.city || '';
        document.getElementById('customerState').value = customer.state || '';
        document.getElementById('customerZip').value = customer.zip_code || '';
        document.getElementById('customerCountry').value = customer.country || '';
    } else {
        title.textContent = 'Add Customer';
        form.reset();
        delete form.dataset.customerId;
    }
    
    modal.style.display = 'block';
}

async function handleCustomerSubmit(e) {
    e.preventDefault();
    
    const customerData = {
        first_name: document.getElementById('customerFirstName').value,
        last_name: document.getElementById('customerLastName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value,
        city: document.getElementById('customerCity').value,
        state: document.getElementById('customerState').value,
        zip_code: document.getElementById('customerZip').value,
        country: document.getElementById('customerCountry').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        });
        
        if (response.ok) {
            showMessage('Customer saved successfully', 'success');
            closeModal('customerModal');
            loadCustomers();
        } else {
            const error = await response.json();
            showMessage(error.error || 'Error saving customer', 'error');
        }
    } catch (error) {
        showMessage('Error saving customer', 'error');
    }
}

function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (customer) {
        showCustomerModal(customer);
    }
}

// Order functions
async function loadOrders() {
    try {
        const status = document.getElementById('orderStatusFilter').value;
        let url = `${API_BASE}/orders`;
        if (status) {
            url += `?status=${status}`;
        }
        
        const response = await fetch(url);
        orders = await response.json();
        
        renderOrdersTable();
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>No orders found</h3>
                    <p>Create some orders to get started</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.order_number}</td>
            <td>${order.first_name} ${order.last_name}</td>
            <td>${new Date(order.order_date).toLocaleDateString()}</td>
            <td>$${order.total}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="viewOrder(${order.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function showOrderModal() {
    const modal = document.getElementById('orderModal');
    orderItems = [];
    document.getElementById('orderItemsTableBody').innerHTML = '';
    calculateOrderTotal();
    modal.style.display = 'block';
}

async function addOrderItem() {
    const productId = document.getElementById('orderProduct').value;
    const quantity = parseInt(document.getElementById('orderQuantity').value);
    
    if (!productId || quantity < 1) {
        showMessage('Please select a product and enter quantity', 'error');
        return;
    }
    
    const product = products.find(p => p.id == productId);
    if (!product) {
        showMessage('Product not found', 'error');
        return;
    }
    
    // Check if item already exists
    const existingItem = orderItems.find(item => item.product_id == productId);
    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.total_price = existingItem.quantity * existingItem.unit_price;
    } else {
        orderItems.push({
            product_id: productId,
            name: product.name,
            unit_price: product.price,
            quantity: quantity,
            total_price: product.price * quantity
        });
    }
    
    renderOrderItems();
    calculateOrderTotal();
    
    // Reset form
    document.getElementById('orderProduct').value = '';
    document.getElementById('orderQuantity').value = '1';
}

function renderOrderItems() {
    const tbody = document.getElementById('orderItemsTableBody');
    
    if (orderItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>No items added yet</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = orderItems.map((item, index) => `
        <tr>
            <td>${item.name}</td>
            <td>$${item.unit_price}</td>
            <td>${item.quantity}</td>
            <td>$${item.total_price.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removeOrderItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function removeOrderItem(index) {
    orderItems.splice(index, 1);
    renderOrderItems();
    calculateOrderTotal();
}

function calculateOrderTotal() {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const discount = parseFloat(document.getElementById('orderDiscount').value) || 0;
    const tax = (subtotal - discount) * 0.08; // 8% tax
    const total = subtotal - discount + tax;
    
    document.getElementById('orderSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('orderTax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('orderTotal').textContent = `$${total.toFixed(2)}`;
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    
    if (orderItems.length === 0) {
        showMessage('Please add at least one item to the order', 'error');
        return;
    }
    
    const customerId = document.getElementById('orderCustomer').value;
    if (!customerId) {
        showMessage('Please select a customer', 'error');
        return;
    }
    
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const discount = parseFloat(document.getElementById('orderDiscount').value) || 0;
    const tax = (subtotal - discount) * 0.08;
    const total = subtotal - discount + tax;
    
    const orderData = {
        customer_id: customerId,
        items: orderItems,
        subtotal: subtotal,
        tax: tax,
        discount: discount,
        total: total,
        payment_method: document.getElementById('orderPaymentMethod').value,
        notes: document.getElementById('orderNotes').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage(`Order created successfully! Order #: ${result.order_number}`, 'success');
            closeModal('orderModal');
            loadOrders();
            loadDashboardData();
        } else {
            const error = await response.json();
            showMessage(error.error || 'Error creating order', 'error');
        }
    } catch (error) {
        showMessage('Error creating order', 'error');
    }
}

function viewOrder(id) {
    const order = orders.find(o => o.id === id);
    if (order) {
        alert(`Order Details:\nOrder #: ${order.order_number}\nCustomer: ${order.first_name} ${order.last_name}\nTotal: $${order.total}\nStatus: ${order.status}`);
    }
}

// Inventory functions
async function loadInventoryData() {
    try {
        // Load low stock products
        const response = await fetch(`${API_BASE}/products?lowStock=true`);
        const lowStockProducts = await response.json();
        
        const lowStockList = document.getElementById('lowStockList');
        if (lowStockProducts.length === 0) {
            lowStockList.innerHTML = '<p>No low stock items</p>';
        } else {
            lowStockList.innerHTML = lowStockProducts.map(product => `
                <div class="low-stock-item">
                    <span>${product.name}</span>
                    <span class="stock-level">${product.stock_quantity} left</span>
                </div>
            `).join('');
        }
        
        // Load all products for stock levels
        const allProductsResponse = await fetch(`${API_BASE}/products`);
        const allProducts = await allProductsResponse.json();
        
        const stockLevels = document.getElementById('stockLevels');
        stockLevels.innerHTML = allProducts.slice(0, 10).map(product => `
            <div class="low-stock-item">
                <span>${product.name}</span>
                <span class="${product.stock_quantity <= product.min_stock_level ? 'stock-level' : ''}">
                    ${product.stock_quantity} in stock
                </span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading inventory data:', error);
    }
}

// Utility functions
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showMessage(message, type = 'success') {
    // Remove existing messages
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(messageDiv, mainContent.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load products for order modal
async function loadProductsForOrder() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        const allProducts = await response.json();
        
        const productSelect = document.getElementById('orderProduct');
        productSelect.innerHTML = '<option value="">Select Product</option>';
        
        allProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - $${product.price} (${product.stock_quantity} in stock)`;
            productSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading products for order:', error);
    }
}

// Update order modal when shown
document.getElementById('addOrderBtn').addEventListener('click', () => {
    loadProductsForOrder();
    showOrderModal();
});

async function loadPredictions() {
    try {
        const response = await fetch(`${API_BASE}/predictions`);
        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Error loading insights', 'error');
            return;
        }

        renderPredictionsTable(Array.isArray(data.products) ? data.products : []);
        renderSummaryCards(data.summary || {});
        renderBestSellers(Array.isArray(data.best_sellers) ? data.best_sellers : []);
    } catch (error) {
        console.error('Error loading predictions:', error);
        showMessage('Error loading insights', 'error');
    }
}

function renderPredictionsTable(predictions) {
    const tbody = document.getElementById('predictionsTableBody');
    if (!tbody) return;

    if (!predictions.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <h3>No insights available</h3>
                    <p>Create orders and ratings to generate predictions</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = predictions.map(item => `
        <tr>
            <td>
                <div>
                    <strong>${item.product_name}</strong>
                    <br>
                    <small class="text-muted">Ratings: ${item.rating_count || 0}</small>
                </div>
            </td>
            <td>${item.avg_rating?.toFixed ? item.avg_rating.toFixed(2) : Number(item.avg_rating || 0).toFixed(2)}</td>
            <td>${item.qty_last_3m || 0}</td>
            <td>${item.forecast_qty_next_month || 0}</td>
        </tr>
    `).join('');
}

function renderSummaryCards(summary) {
    const totalRevenueEl = document.getElementById('summaryTotalRevenue');
    const totalOrdersEl = document.getElementById('summaryTotalOrders');
    const avgOrderValueEl = document.getElementById('summaryAvgOrderValue');
    const topCategoryEl = document.getElementById('summaryTopCategory');

    if (totalRevenueEl) {
        const value = Number(summary.total_revenue || 0);
        totalRevenueEl.textContent = `$${value.toFixed(2)}`;
    }
    if (totalOrdersEl) {
        totalOrdersEl.textContent = summary.total_orders || 0;
    }
    if (avgOrderValueEl) {
        const value = Number(summary.avg_order_value || 0);
        avgOrderValueEl.textContent = `$${value.toFixed(2)}`;
    }
    if (topCategoryEl) {
        topCategoryEl.textContent = summary.top_category ? `${summary.top_category} ($${Number(summary.top_category_revenue || 0).toFixed(2)})` : 'N/A';
    }
}

function renderBestSellers(bestSellers) {
    const container = document.getElementById('bestSellersList');
    if (!container) return;

    if (!bestSellers.length) {
        container.innerHTML = '<p>No top products yet</p>';
        return;
    }

    container.innerHTML = bestSellers.map((item, index) => `
        <div class="best-seller-item">
            <div class="info">
                <span>${index + 1}. ${item.product_name}</span>
                <span>${item.qty_last_3m || 0} sold (last 3 months)</span>
            </div>
            <div class="metrics">
                <span>${item.avg_rating?.toFixed ? item.avg_rating.toFixed(1) : Number(item.avg_rating || 0).toFixed(1)} ★</span>
            </div>
        </div>
    `).join('');
}

async function loadProductsForRatings() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        const productList = await response.json();

        if (!response.ok) {
            showMessage(productList.error || 'Error loading products for rating', 'error');
            return;
        }

        const select = document.getElementById('ratingProduct');
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Product</option>';

        productList.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    } catch (error) {
        console.error('Error loading products for rating:', error);
        showMessage('Error loading products for rating', 'error');
    }
}

async function handleRatingSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('ratingProduct').value;
    const ratingValue = parseInt(document.getElementById('ratingValue').value, 10);

    if (!productId || !ratingValue) {
        showMessage('Select a product and rating', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/ratings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ product_id: Number(productId), rating: ratingValue })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Error submitting rating', 'error');
            return;
        }

        showMessage('Rating submitted successfully', 'success');
        e.target.reset();
        loadPredictions();
    } catch (error) {
        console.error('Error submitting rating:', error);
        showMessage('Error submitting rating', 'error');
    }
}

function openChatbot() {
    const chatbot = document.getElementById('chatbot');
    const chatbotInput = document.getElementById('chatbotInput');
    if (chatbot) {
        chatbot.style.display = 'flex';
    }
    if (chatbotInput) {
        chatbotInput.focus();
    }
}

function closeChatbot() {
    const chatbot = document.getElementById('chatbot');
    if (chatbot) {
        chatbot.style.display = 'none';
    }
}

function appendChatbotMessage(type, text) {
    const container = document.getElementById('chatbotMessages');
    if (!container) return;

    const msg = document.createElement('div');
    msg.className = `chatbot-msg ${type}`;
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

function getChatbotResponse(message) {
    const normalized = message.toLowerCase();
    const sections = ['dashboard', 'products', 'customers', 'orders', 'inventory', 'insights'];

    for (const section of sections) {
        if (normalized.includes(section)) {
            showSection(section);
            return `Navigated to ${section.charAt(0).toUpperCase() + section.slice(1)}.`;
        }
    }

    if (normalized.includes('best seller') || normalized.includes('top product')) {
        showSection('insights');
        return 'Here are the current top products.';
    }

    if (normalized.includes('summary') || normalized.includes('market')) {
        showSection('insights');
        return 'Market summary refreshed for you.';
    }

    if (normalized.includes('help')) {
        return 'You can ask me to open dashboard, products, customers, orders, inventory, or insights, or ask for market summary.';
    }

    return "I'm here to help. Try asking me to open a section or for the market summary.";
}

async function sendChatbotMessage() {
    const input = document.getElementById('chatbotInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    appendChatbotMessage('user', text);
    input.value = '';

    const responseText = getChatbotResponse(text);
    appendChatbotMessage('bot', responseText);
}
