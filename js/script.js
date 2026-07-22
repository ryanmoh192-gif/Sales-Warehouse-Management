/**
 * نظام إدارة المخازن والمبيعات
 * JavaScript File
 * تم التطوير باستخدام Vanilla JavaScript
 * يتضمن نظام تسجيل دخول متكامل
 */

// ============================================
// الانتظار حتى تحميل DOM بالكامل
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    // ============================================
    // المتغيرات العامة
    // ============================================
    const PRODUCTS_KEY = 'products';
    const SALES_KEY = 'sales';
    const SETTINGS_KEY = 'settings';
    const USERS_KEY = 'users';
    const CURRENT_USER_KEY = 'currentUser';
    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    let editingProductId = null;

    // ============================================
    // دوال LocalStorage
    // ============================================
    
    function saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            showNotification('فشل في حفظ البيانات', 'error');
        }
    }

    function getFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('خطأ في استرجاع البيانات:', error);
            return null;
        }
    }

    // ============================================
    // نظام المستخدمين وتسجيل الدخول
    // ============================================
    
    function initializeUsers() {
        if (!getFromLocalStorage(USERS_KEY)) {
            const defaultUsers = [
                {
                    id: 1,
                    username: 'admin',
                    password: 'admin123',
                    fullName: 'مدير النظام',
                    role: 'admin',
                    email: 'admin@example.com',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    username: 'user',
                    password: 'user123',
                    fullName: 'مستخدم عادي',
                    role: 'user',
                    email: 'user@example.com',
                    createdAt: new Date().toISOString()
                }
            ];
            saveToLocalStorage(USERS_KEY, defaultUsers);
        }
    }

    function getUsers() {
        return getFromLocalStorage(USERS_KEY) || [];
    }

    function findUser(username, password) {
        const users = getUsers();
        return users.find(u => u.username === username && u.password === password);
    }

    function getCurrentUser() {
        const userData = getFromLocalStorage(CURRENT_USER_KEY);
        if (userData && userData.sessionExpiry) {
            // التحقق من انتهاء الجلسة (24 ساعة)
            if (new Date().getTime() > userData.sessionExpiry) {
                logout();
                return null;
            }
        }
        return userData;
    }

    function isLoggedIn() {
        const currentUser = getCurrentUser();
        return currentUser && currentUser.username;
    }

    function login(username, password, rememberMe = false) {
        const user = findUser(username, password);
        
        if (!user) {
            return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        }
        
        const sessionData = {
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            loginTime: new Date().toISOString(),
            sessionExpiry: rememberMe ? new Date().getTime() + (30 * 24 * 60 * 60 * 1000) : new Date().getTime() + (24 * 60 * 60 * 1000)
        };
        
        saveToLocalStorage(CURRENT_USER_KEY, sessionData);
        
        return { success: true, user: sessionData };
    }

    function logout() {
        localStorage.removeItem(CURRENT_USER_KEY);
        
        // التحقق من أننا في صفحة تسجيل الدخول
        const currentPath = window.location.pathname;
        const pageName = currentPath.split('/').pop();
        
        if (pageName !== 'login.html' && pageName !== '') {
            window.location.href = 'login.html';
        }
    }

    function checkAuth() {
        const currentPath = window.location.pathname;
        const pageName = currentPath.split('/').pop();
        
        // السماح بالوصول إلى صفحة تسجيل الدخول فقط
        if (pageName === 'login.html' || pageName === '' || currentPath === '/') {
            // إذا كان المستخدم مسجل دخوله بالفعل، توجيهه إلى لوحة التحكم
            if (isLoggedIn() && pageName === 'login.html') {
                window.location.href = 'index.html';
            }
            return;
        }
        
        // التحقق من تسجيل الدخول لجميع الصفحات الأخرى
        if (!isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        
        // تحديث معلومات المستخدم في الواجهة
        updateUserInterface();
    }

    function updateUserInterface() {
        const currentUser = getCurrentUser();
        const userNameElements = document.querySelectorAll('#currentUserName, #welcomeUser');
        
        userNameElements.forEach(el => {
            if (el && currentUser) {
                el.textContent = currentUser.fullName || currentUser.username;
            }
        });
    }

    // ============================================
    // معالجة تسجيل الدخول
    // ============================================
    
    function initLoginPage() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;
        
        const loginUsername = document.getElementById('loginUsername');
        const loginPassword = document.getElementById('loginPassword');
        const rememberMe = document.getElementById('rememberMe');
        const loginError = document.getElementById('loginError');
        const loginErrorMessage = document.getElementById('loginErrorMessage');
        const passwordToggle = document.getElementById('passwordToggle');
        
        // زر إظهار/إخفاء كلمة المرور
        if (passwordToggle) {
            passwordToggle.addEventListener('click', function() {
                const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
                loginPassword.setAttribute('type', type);
                
                const icon = this.querySelector('i');
                if (type === 'text') {
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }
        
        // معالجة تقديم نموذج تسجيل الدخول
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = loginUsername.value.trim();
            const password = loginPassword.value;
            
            // التحقق من الحقول
            let isValid = true;
            
            document.getElementById('loginUsernameError').textContent = '';
            document.getElementById('loginPasswordError').textContent = '';
            
            if (!username) {
                document.getElementById('loginUsernameError').textContent = 'يرجى إدخال اسم المستخدم';
                isValid = false;
            }
            
            if (!password) {
                document.getElementById('loginPasswordError').textContent = 'يرجى إدخال كلمة المرور';
                isValid = false;
            }
            
            if (!isValid) return;
            
            // محاولة تسجيل الدخول
            const result = login(username, password, rememberMe ? rememberMe.checked : false);
            
            if (result.success) {
                // إظهار رسالة نجاح
                loginError.style.display = 'none';
                showNotification('تم تسجيل الدخول بنجاح', 'success');
                
                // التوجيه إلى لوحة التحكم
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            } else {
                // إظهار رسالة خطأ
                loginError.style.display = 'flex';
                loginErrorMessage.textContent = result.message;
                loginPassword.value = '';
            }
        });
        
        // ملء بيانات الدخول الافتراضية عند النقر على معلومات الدخول
        const loginInfo = document.querySelector('.login-info');
        if (loginInfo) {
            loginInfo.addEventListener('click', function() {
                loginUsername.value = 'admin';
                loginPassword.value = 'admin123';
            });
            loginInfo.style.cursor = 'pointer';
        }
    }

    // ============================================
    // زر تسجيل الخروج
    // ============================================
    
    function initLogoutButton() {
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                const confirmed = confirm('هل أنت متأكد من تسجيل الخروج؟');
                if (confirmed) {
                    showNotification('تم تسجيل الخروج بنجاح', 'success');
                    setTimeout(() => {
                        logout();
                    }, 500);
                }
            });
        }
    }

    // ============================================
    // تهيئة البيانات الافتراضية
    // ============================================
    
    function initializeData() {
        // تهيئة المستخدمين
        initializeUsers();
        
        // تهيئة المنتجات
        if (!getFromLocalStorage(PRODUCTS_KEY)) {
            const defaultProducts = [
                {
                    id: 1,
                    name: 'هاتف ذكي',
                    code: 'PROD-001',
                    category: 'إلكترونيات',
                    price: 5000,
                    quantity: 50,
                    supplier: 'شركة التقنية',
                    date: '2024-01-15'
                },
                {
                    id: 2,
                    name: 'حاسوب محمول',
                    code: 'PROD-002',
                    category: 'إلكترونيات',
                    price: 12000,
                    quantity: 30,
                    supplier: 'شركة الحواسيب',
                    date: '2024-01-20'
                },
                {
                    id: 3,
                    name: 'قميص رجالي',
                    code: 'PROD-003',
                    category: 'ملابس',
                    price: 250,
                    quantity: 5,
                    supplier: 'مصنع الملابس',
                    date: '2024-02-01'
                },
                {
                    id: 4,
                    name: 'طاولة خشبية',
                    code: 'PROD-004',
                    category: 'أثاث',
                    price: 3500,
                    quantity: 3,
                    supplier: 'شركة الأثاث',
                    date: '2024-02-10'
                },
                {
                    id: 5,
                    name: 'علبة بسكويت',
                    code: 'PROD-005',
                    category: 'مواد غذائية',
                    price: 35,
                    quantity: 200,
                    supplier: 'شركة المواد الغذائية',
                    date: '2024-03-05'
                },
                {
                    id: 6,
                    name: 'مكنسة كهربائية',
                    code: 'PROD-006',
                    category: 'أدوات منزلية',
                    price: 1800,
                    quantity: 15,
                    supplier: 'شركة الأدوات المنزلية',
                    date: '2024-03-10'
                }
            ];
            saveToLocalStorage(PRODUCTS_KEY, defaultProducts);
        }

        // تهيئة المبيعات
        if (!getFromLocalStorage(SALES_KEY)) {
            const defaultSales = [
                {
                    id: 1,
                    productId: 1,
                    productName: 'هاتف ذكي',
                    quantity: 2,
                    price: 5000,
                    total: 10000,
                    date: '2024-06-01',
                    time: '10:30',
                    seller: 'admin'
                },
                {
                    id: 2,
                    productId: 5,
                    productName: 'علبة بسكويت',
                    quantity: 10,
                    price: 35,
                    total: 350,
                    date: '2024-06-02',
                    time: '14:15',
                    seller: 'admin'
                }
            ];
            saveToLocalStorage(SALES_KEY, defaultSales);
        }

        // تهيئة الإعدادات
        if (!getFromLocalStorage(SETTINGS_KEY)) {
            const defaultSettings = {
                storeName: 'مخازن المبيعات',
                currency: 'ج.م',
                lowStockThreshold: 10,
                language: 'ar'
            };
            saveToLocalStorage(SETTINGS_KEY, defaultSettings);
        }
    }

    // ============================================
    // دوال المنتجات
    // ============================================
    
    function getProducts() {
        return getFromLocalStorage(PRODUCTS_KEY) || [];
    }

    function saveProducts(products) {
        saveToLocalStorage(PRODUCTS_KEY, products);
    }

    function addProduct(product) {
        const products = getProducts();
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const newProduct = {
            ...product,
            id: newId,
            date: new Date().toISOString().split('T')[0]
        };
        products.push(newProduct);
        saveProducts(products);
        return newProduct;
    }

    function updateProduct(productId, updatedData) {
        const products = getProducts();
        const index = products.findIndex(p => p.id === productId);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedData };
            saveProducts(products);
            return products[index];
        }
        return null;
    }

    function deleteProduct(productId) {
        const products = getProducts();
        const filteredProducts = products.filter(p => p.id !== productId);
        saveProducts(filteredProducts);
        return filteredProducts;
    }

    function searchProducts(products, query) {
        if (!query) return products;
        const searchTerm = query.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.code.toLowerCase().includes(searchTerm) ||
            p.supplier.toLowerCase().includes(searchTerm)
        );
    }

    function filterProductsByCategory(products, category) {
        if (!category || category === 'all') return products;
        return products.filter(p => p.category === category);
    }

    function sortProducts(products, sortBy) {
        const sortedProducts = [...products];
        switch (sortBy) {
            case 'name-asc':
                return sortedProducts.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
            case 'name-desc':
                return sortedProducts.sort((a, b) => b.name.localeCompare(a.name, 'ar'));
            case 'price-asc':
                return sortedProducts.sort((a, b) => a.price - b.price);
            case 'price-desc':
                return sortedProducts.sort((a, b) => b.price - a.price);
            case 'date-asc':
                return sortedProducts.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'date-desc':
                return sortedProducts.sort((a, b) => new Date(b.date) - new Date(a.date));
            default:
                return sortedProducts;
        }
    }

    // ============================================
    // دوال المبيعات
    // ============================================
    
    function getSales() {
        return getFromLocalStorage(SALES_KEY) || [];
    }

    function saveSales(sales) {
        saveToLocalStorage(SALES_KEY, sales);
    }

    function addSale(sale) {
        const sales = getSales();
        const newId = sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1;
        const now = new Date();
        const currentUser = getCurrentUser();
        
        const newSale = {
            ...sale,
            id: newId,
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().split(' ')[0].substring(0, 5),
            seller: currentUser ? currentUser.username : 'unknown'
        };
        sales.push(newSale);
        saveSales(sales);
        return newSale;
    }

    // ============================================
    // دوال الإحصائيات
    // ============================================
    
    function getTotalProducts() {
        return getProducts().length;
    }

    function getTotalSalesCount() {
        return getSales().length;
    }

    function getTotalProfits() {
        const sales = getSales();
        return sales.reduce((total, sale) => total + sale.total, 0);
    }

    function getLowStockProducts() {
        const products = getProducts();
        const settings = getFromLocalStorage(SETTINGS_KEY) || { lowStockThreshold: 10 };
        return products.filter(p => p.quantity <= settings.lowStockThreshold);
    }

    function getRecentSales(limit = 5) {
        const sales = getSales();
        return sales.slice(-limit).reverse();
    }

    function getTopSellingProducts(limit = 5) {
        const sales = getSales();
        const productSales = {};
        
        sales.forEach(sale => {
            if (!productSales[sale.productId]) {
                productSales[sale.productId] = {
                    productId: sale.productId,
                    productName: sale.productName,
                    count: 0,
                    totalAmount: 0
                };
            }
            productSales[sale.productId].count += sale.quantity;
            productSales[sale.productId].totalAmount += sale.total;
        });
        
        return Object.values(productSales)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    // ============================================
    // دوال الترقيم (Pagination)
    // ============================================
    
    function paginateData(data, page, itemsPerPage) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return {
            items: data.slice(startIndex, endIndex),
            totalPages: Math.ceil(data.length / itemsPerPage),
            currentPage: page,
            totalItems: data.length
        };
    }

    function renderPagination(totalPages, currentPage, container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                renderProductsTable(currentPage - 1);
            }
        });
        container.appendChild(prevBtn);
        
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                renderProductsTable(i);
            });
            container.appendChild(pageBtn);
        }
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                renderProductsTable(currentPage + 1);
            }
        });
        container.appendChild(nextBtn);
    }

    // ============================================
    // دوال الإشعارات
    // ============================================
    
    function showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<i class="fas fa-check-circle"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-times-circle"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            default:
                icon = '<i class="fas fa-info-circle"></i>';
        }
        
        notification.innerHTML = `${icon} ${message}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // ============================================
    // دوال التنسيق والعرض
    // ============================================
    
    function formatCurrency(amount) {
        return amount.toLocaleString('ar-EG') + ' ج.م';
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    }

    // ============================================
    // تحديث التاريخ في Navbar
    // ============================================
    function updateNavbarDate() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            dateElement.textContent = new Date().toLocaleDateString('ar-EG', options);
        }
    }

    // ============================================
    // Sidebar Toggle
    // ============================================
    function initSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (!sidebarToggle || !sidebar || !sidebarOverlay) return;
        
        function toggleSidebar() {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        }
        
        sidebarToggle.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar);
        
        const sidebarLinks = sidebar.querySelectorAll('.sidebar-link');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 1024) {
                    toggleSidebar();
                }
            });
        });
    }

    // ============================================
    // تحديث لوحة التحكم (Dashboard)
    // ============================================
    function updateDashboard() {
        const totalProductsEl = document.getElementById('totalProducts');
        const totalSalesEl = document.getElementById('totalSales');
        const totalProfitsEl = document.getElementById('totalProfits');
        const lowStockCountEl = document.getElementById('lowStockCount');
        
        if (totalProductsEl) {
            totalProductsEl.textContent = getTotalProducts();
        }
        if (totalSalesEl) {
            totalSalesEl.textContent = getTotalSalesCount();
        }
        if (totalProfitsEl) {
            totalProfitsEl.textContent = formatCurrency(getTotalProfits());
        }
        if (lowStockCountEl) {
            lowStockCountEl.textContent = getLowStockProducts().length;
        }
        
        const recentSalesList = document.getElementById('recentSalesList');
        if (recentSalesList) {
            const recentSales = getRecentSales(5);
            
            if (recentSales.length === 0) {
                recentSalesList.innerHTML = '<p class="no-data">لا توجد عمليات بيع حديثة</p>';
            } else {
                recentSalesList.innerHTML = recentSales.map(sale => `
                    <div class="recent-sale-item">
                        <div class="recent-sale-info">
                            <div class="recent-sale-name">${sale.productName}</div>
                            <div class="recent-sale-details">
                                ${sale.quantity} × ${formatCurrency(sale.price)} | ${formatDate(sale.date)}
                            </div>
                        </div>
                        <div class="recent-sale-amount">${formatCurrency(sale.total)}</div>
                    </div>
                `).join('');
            }
        }
    }

    // ============================================
    // عرض جدول المنتجات
    // ============================================
    function renderProductsTable(page = 1) {
        const tableBody = document.getElementById('productsTableBody');
        const paginationContainer = document.getElementById('pagination');
        const noProductsMessage = document.getElementById('noProductsMessage');
        const productsTable = document.getElementById('productsTable');
        
        if (!tableBody) return;
        
        currentPage = page;
        
        let products = getProducts();
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            products = searchProducts(products, searchInput.value);
        }
        
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            products = filterProductsByCategory(products, categoryFilter.value);
        }
        
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
            products = sortProducts(products, sortBy.value);
        }
        
        const paginatedData = paginateData(products, page, ITEMS_PER_PAGE);
        
        if (paginatedData.items.length === 0) {
            tableBody.innerHTML = '';
            if (noProductsMessage) noProductsMessage.style.display = 'block';
            if (productsTable)
