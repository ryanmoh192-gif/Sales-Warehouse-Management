/**
 * نظام إدارة المخازن والمبيعات
 * JavaScript File - كامل ومعدل
 * جميع الحقوق محفوظة © 2024
 */

document.addEventListener("DOMContentLoaded", function() {
    
    // ============================================
    // المتغيرات العامة
    // ============================================
    var PRODUCTS_KEY = 'products';
    var SALES_KEY = 'sales';
    var SETTINGS_KEY = 'settings';
    var USERS_KEY = 'users';
    var CURRENT_USER_KEY = 'currentUser';
    var ITEMS_PER_PAGE = 10;
    var currentPage = 1;
    var editingProductId = null;

    // ============================================
    // دوال LocalStorage
    // ============================================
    
    function saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            return false;
        }
    }

    function getFromLocalStorage(key) {
        try {
            var data = localStorage.getItem(key);
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
            var defaultUsers = [
                {
                    id: 1,
                    username: 'admin',
                    password: 'admin123',
                    fullName: 'مدير النظام',
                    role: 'admin',
                    email: 'admin@example.com',
                    createdAt: '2024-01-01'
                },
                {
                    id: 2,
                    username: 'user',
                    password: 'user123',
                    fullName: 'مستخدم عادي',
                    role: 'user',
                    email: 'user@example.com',
                    createdAt: '2024-01-01'
                }
            ];
            saveToLocalStorage(USERS_KEY, defaultUsers);
            console.log('تم إنشاء المستخدمين الافتراضيين');
        }
    }

    function getUsers() {
        return getFromLocalStorage(USERS_KEY) || [];
    }

    function findUser(username, password) {
        var users = getUsers();
        for (var i = 0; i < users.length; i++) {
            if (users[i].username === username && users[i].password === password) {
                return users[i];
            }
        }
        return null;
    }

    function getCurrentUser() {
        var userData = getFromLocalStorage(CURRENT_USER_KEY);
        if (userData && userData.sessionExpiry) {
            if (new Date().getTime() > userData.sessionExpiry) {
                // انتهت الجلسة
                localStorage.removeItem(CURRENT_USER_KEY);
                return null;
            }
        }
        return userData;
    }

    function isLoggedIn() {
        var currentUser = getCurrentUser();
        return (currentUser && currentUser.username) ? true : false;
    }

    function login(username, password, rememberMe) {
        var user = findUser(username, password);
        
        if (!user) {
            return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        }
        
        var expiryTime;
        if (rememberMe) {
            expiryTime = new Date().getTime() + (30 * 24 * 60 * 60 * 1000); // 30 يوم
        } else {
            expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 ساعة
        }
        
        var sessionData = {
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            loginTime: new Date().toISOString(),
            sessionExpiry: expiryTime
        };
        
        saveToLocalStorage(CURRENT_USER_KEY, sessionData);
        console.log('تم تسجيل الدخول بنجاح للمستخدم:', username);
        
        return { success: true, user: sessionData };
    }

    function logout() {
        console.log('جاري تسجيل الخروج...');
        localStorage.removeItem(CURRENT_USER_KEY);
        console.log('تم حذف بيانات الجلسة');
        window.location.replace('login.html');
    }

    function checkAuth() {
        var currentPath = window.location.pathname;
        var pageName = currentPath.split('/').pop();
        
        console.log('الصفحة الحالية:', pageName);
        console.log('حالة تسجيل الدخول:', isLoggedIn());
        
        // إذا كانت الصفحة هي login.html
        if (pageName === 'login.html') {
            // إذا كان المستخدم مسجل دخوله بالفعل، توجيهه إلى لوحة التحكم
            if (isLoggedIn()) {
                console.log('المستخدم مسجل دخوله، جاري التوجيه للوحة التحكم');
                window.location.replace('index.html');
            }
            return;
        }
        
        // إذا كان الملف مفتوح مباشرة بدون اسم (مثل localhost)
        if (pageName === '' || currentPath === '/' || currentPath.endsWith('/')) {
            if (isLoggedIn()) {
                window.location.replace('index.html');
            } else {
                window.location.replace('login.html');
            }
            return;
        }
        
        // التحقق من تسجيل الدخول لجميع الصفحات الأخرى
        if (!isLoggedIn()) {
            console.log('المستخدم غير مسجل، جاري التوجيه لصفحة تسجيل الدخول');
            window.location.replace('login.html');
            return;
        }
        
        // تحديث معلومات المستخدم في الواجهة
        updateUserInterface();
    }

    function updateUserInterface() {
        var currentUser = getCurrentUser();
        if (!currentUser) return;
        
        var userNameElements = document.querySelectorAll('#currentUserName, #welcomeUser');
        for (var i = 0; i < userNameElements.length; i++) {
            if (userNameElements[i]) {
                userNameElements[i].textContent = currentUser.fullName || currentUser.username;
            }
        }
    }

    // ============================================
    // معالجة صفحة تسجيل الدخول
    // ============================================
    
    function initLoginPage() {
        var loginForm = document.getElementById('loginForm');
        if (!loginForm) return;
        
        console.log('تهيئة صفحة تسجيل الدخول');
        
        var loginUsername = document.getElementById('loginUsername');
        var loginPassword = document.getElementById('loginPassword');
        var rememberMe = document.getElementById('rememberMe');
        var loginError = document.getElementById('loginError');
        var loginErrorMessage = document.getElementById('loginErrorMessage');
        var passwordToggle = document.getElementById('passwordToggle');
        var loginUsernameError = document.getElementById('loginUsernameError');
        var loginPasswordError = document.getElementById('loginPasswordError');
        
        // زر إظهار/إخفاء كلمة المرور
        if (passwordToggle) {
            passwordToggle.onclick = function() {
                if (loginPassword.getAttribute('type') === 'password') {
                    loginPassword.setAttribute('type', 'text');
                    var icon = this.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    }
                } else {
                    loginPassword.setAttribute('type', 'password');
                    var icon = this.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                }
            };
        }
        
        // معالجة تقديم نموذج تسجيل الدخول
        loginForm.onsubmit = function(e) {
            e.preventDefault();
            
            var username = loginUsername.value.trim();
            var password = loginPassword.value;
            
            // مسح رسائل الخطأ
            if (loginUsernameError) loginUsernameError.textContent = '';
            if (loginPasswordError) loginPasswordError.textContent = '';
            
            // التحقق من الحقول
            var isValid = true;
            
            if (!username) {
                if (loginUsernameError) loginUsernameError.textContent = 'يرجى إدخال اسم المستخدم';
                isValid = false;
            }
            
            if (!password) {
                if (loginPasswordError) loginPasswordError.textContent = 'يرجى إدخال كلمة المرور';
                isValid = false;
            }
            
            if (!isValid) return false;
            
            // محاولة تسجيل الدخول
            var remember = rememberMe ? rememberMe.checked : false;
            var result = login(username, password, remember);
            
            if (result.success) {
                if (loginError) loginError.style.display = 'none';
                showNotification('تم تسجيل الدخول بنجاح', 'success');
                
                setTimeout(function() {
                    window.location.href = 'index.html';
                }, 500);
            } else {
                if (loginError) {
                    loginError.style.display = 'flex';
                    if (loginErrorMessage) loginErrorMessage.textContent = result.message;
                }
                loginPassword.value = '';
            }
            
            return false;
        };
        
        // ملء بيانات الدخول الافتراضية عند النقر على معلومات الدخول
        var loginInfo = document.querySelector('.login-info');
        if (loginInfo) {
            loginInfo.style.cursor = 'pointer';
            loginInfo.onclick = function() {
                loginUsername.value = 'admin';
                loginPassword.value = 'admin123';
            };
        }
    }

    // ============================================
    // زر تسجيل الخروج - تم الإصلاح
    // ============================================
    
    function initLogoutButton() {
        var logoutButton = document.getElementById('logoutButton');
        
        if (!logoutButton) {
            console.log('زر تسجيل الخروج غير موجود في هذه الصفحة');
            return;
        }
        
        console.log('تم العثور على زر تسجيل الخروج، جاري تهيئته');
        
        // استخدام onclick مباشرة لتجنب مشاكل addEventListener
        logoutButton.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('تم النقر على زر تسجيل الخروج');
            
            var confirmed = confirm('هل أنت متأكد من تسجيل الخروج؟');
            
            if (confirmed) {
                console.log('تم تأكيد تسجيل الخروج');
                
                // إظهار رسالة
                showNotification('تم تسجيل الخروج بنجاح', 'success');
                
                // حذف بيانات الجلسة
                localStorage.removeItem(CURRENT_USER_KEY);
                console.log('تم حذف بيانات الجلسة');
                
                // التوجيه إلى صفحة تسجيل الدخول
                setTimeout(function() {
                    console.log('جاري التوجيه إلى صفحة تسجيل الدخول');
                    window.location.href = 'login.html';
                }, 300);
            } else {
                console.log('تم إلغاء تسجيل الخروج');
            }
            
            return false;
        };
        
        console.log('تم تهيئة زر تسجيل الخروج بنجاح');
    }

    // ============================================
    // تهيئة البيانات الافتراضية
    // ============================================
    
    function initializeData() {
        // تهيئة المستخدمين
        initializeUsers();
        
        // تهيئة المنتجات
        if (!getFromLocalStorage(PRODUCTS_KEY)) {
            var defaultProducts = [
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
            console.log('تم إنشاء المنتجات الافتراضية');
        }

        // تهيئة المبيعات
        if (!getFromLocalStorage(SALES_KEY)) {
            var defaultSales = [
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
            console.log('تم إنشاء المبيعات الافتراضية');
        }

        // تهيئة الإعدادات
        if (!getFromLocalStorage(SETTINGS_KEY)) {
            var defaultSettings = {
                storeName: 'مخازن المبيعات',
                currency: 'ج.م',
                lowStockThreshold: 10,
                language: 'ar'
            };
            saveToLocalStorage(SETTINGS_KEY, defaultSettings);
            console.log('تم إنشاء الإعدادات الافتراضية');
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
        var products = getProducts();
        var newId = 1;
        if (products.length > 0) {
            var maxId = 0;
            for (var i = 0; i < products.length; i++) {
                if (products[i].id > maxId) {
                    maxId = products[i].id;
                }
            }
            newId = maxId + 1;
        }
        
        var newProduct = {
            id: newId,
            name: product.name,
            code: product.code,
            category: product.category,
            price: product.price,
            quantity: product.quantity,
            supplier: product.supplier,
            date: new Date().toISOString().split('T')[0]
        };
        
        products.push(newProduct);
        saveProducts(products);
        return newProduct;
    }

    function updateProduct(productId, updatedData) {
        var products = getProducts();
        for (var i = 0; i < products.length; i++) {
            if (products[i].id === productId) {
                products[i].name = updatedData.name;
                products[i].code = updatedData.code;
                products[i].category = updatedData.category;
                products[i].price = updatedData.price;
                products[i].quantity = updatedData.quantity;
                products[i].supplier = updatedData.supplier;
                saveProducts(products);
                return products[i];
            }
        }
        return null;
    }

    function deleteProduct(productId) {
        var products = getProducts();
        var filteredProducts = [];
        for (var i = 0; i < products.length; i++) {
            if (products[i].id !== productId) {
                filteredProducts.push(products[i]);
            }
        }
        saveProducts(filteredProducts);
    }

    function searchProducts(products, query) {
        if (!query) return products;
        var searchTerm = query.toLowerCase();
        var results = [];
        for (var i = 0; i < products.length; i++) {
            if (products[i].name.toLowerCase().indexOf(searchTerm) !== -1 ||
                products[i].code.toLowerCase().indexOf(searchTerm) !== -1 ||
                products[i].supplier.toLowerCase().indexOf(searchTerm) !== -1) {
                results.push(products[i]);
            }
        }
        return results;
    }

    function filterProductsByCategory(products, category) {
        if (!category || category === 'all') return products;
        var results = [];
        for (var i = 0; i < products.length; i++) {
            if (products[i].category === category) {
                results.push(products[i]);
            }
        }
        return results;
    }

    function sortProducts(products, sortBy) {
        var sortedProducts = products.slice();
        
        if (sortBy === 'name-asc') {
            sortedProducts.sort(function(a, b) {
                return a.name.localeCompare(b.name, 'ar');
            });
        } else if (sortBy === 'name-desc') {
            sortedProducts.sort(function(a, b) {
                return b.name.localeCompare(a.name, 'ar');
            });
        } else if (sortBy === 'price-asc') {
            sortedProducts.sort(function(a, b) {
                return a.price - b.price;
            });
        } else if (sortBy === 'price-desc') {
            sortedProducts.sort(function(a, b) {
                return b.price - a.price;
            });
        } else if (sortBy === 'date-asc') {
            sortedProducts.sort(function(a, b) {
                return new Date(a.date) - new Date(b.date);
            });
        } else if (sortBy === 'date-desc') {
            sortedProducts.sort(function(a, b) {
                return new Date(b.date) - new Date(a.date);
            });
        }
        
        return sortedProducts;
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
        var sales = getSales();
        var newId = 1;
        if (sales.length > 0) {
            var maxId = 0;
            for (var i = 0; i < sales.length; i++) {
                if (sales[i].id > maxId) {
                    maxId = sales[i].id;
                }
            }
            newId = maxId + 1;
        }
        
        var now = new Date();
        var currentUser = getCurrentUser();
        
        var newSale = {
            id: newId,
            productId: sale.productId,
            productName: sale.productName,
            quantity: sale.quantity,
            price: sale.price,
            total: sale.total,
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
        var sales = getSales();
        var total = 0;
        for (var i = 0; i < sales.length; i++) {
            total += sales[i].total;
        }
        return total;
    }

    function getLowStockProducts() {
        var products = getProducts();
        var settings = getFromLocalStorage(SETTINGS_KEY) || { lowStockThreshold: 10 };
        var threshold = settings.lowStockThreshold || 10;
        var lowStock = [];
        for (var i = 0; i < products.length; i++) {
            if (products[i].quantity <= threshold) {
                lowStock.push(products[i]);
            }
        }
        return lowStock;
    }

    function getRecentSales(limit) {
        var sales = getSales();
        var recentSales = [];
        var start = sales.length - (limit || 5);
        if (start < 0) start = 0;
        
        for (var i = sales.length - 1; i >= start; i--) {
            recentSales.push(sales[i]);
        }
        
        return recentSales;
    }

    function getTopSellingProducts(limit) {
        var sales = getSales();
        var productSales = {};
        
        for (var i = 0; i < sales.length; i++) {
            var sale = sales[i];
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
        }
        
        var result = [];
        for (var key in productSales) {
            if (productSales.hasOwnProperty(key)) {
                result.push(productSales[key]);
            }
        }
        
        result.sort(function(a, b) {
            return b.count - a.count;
        });
        
        return result.slice(0, limit || 5);
    }

    // ============================================
    // دوال الترقيم (Pagination)
    // ============================================
    
    function paginateData(data, page, itemsPerPage) {
        var startIndex = (page - 1) * itemsPerPage;
        var endIndex = startIndex + itemsPerPage;
        var items = data.slice(startIndex, endIndex);
        var totalPages = Math.ceil(data.length / itemsPerPage);
        
        return {
            items: items,
            totalPages: totalPages,
            currentPage: page,
            totalItems: data.length
        };
    }

    function renderPagination(totalPages, currentPage, container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // زر السابق
        var prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = function() {
            if (currentPage > 1) {
                renderProductsTable(currentPage - 1);
            }
        };
        container.appendChild(prevBtn);
        
        // أرقام الصفحات
        for (var i = 1; i <= totalPages; i++) {
            var pageBtn = document.createElement('button');
            pageBtn.className = 'pagination-btn';
            if (i === currentPage) {
                pageBtn.className += ' active';
            }
            pageBtn.textContent = i;
            
            // استخدام closure للحفاظ على قيمة i
            (function(pageNum) {
                pageBtn.onclick = function() {
                    renderProductsTable(pageNum);
                };
            })(i);
            
            container.appendChild(pageBtn);
        }
        
        // زر التالي
        var nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = function() {
            if (currentPage < totalPages) {
                renderProductsTable(currentPage + 1);
            }
        };
        container.appendChild(nextBtn);
    }

    // ============================================
    // دوال الإشعارات
    // ============================================
    
    function showNotification(message, type) {
        // إزالة الإشعارات السابقة
        var existingNotifications = document.querySelectorAll('.notification');
        for (var i = 0; i < existingNotifications.length; i++) {
            existingNotifications[i].parentNode.removeChild(existingNotifications[i]);
        }
        
        var notification = document.createElement('div');
        notification.className = 'notification notification-' + (type || 'info');
        
        var icon = '';
        if (type === 'success') {
            icon = '<i class="fas fa-check-circle"></i> ';
        } else if (type === 'error') {
            icon = '<i class="fas fa-times-circle"></i> ';
        } else if (type === 'warning') {
            icon = '<i class="fas fa-exclamation-triangle"></i> ';
        } else {
            icon = '<i class="fas fa-info-circle"></i> ';
        }
        
        notification.innerHTML = icon + message;
        document.body.appendChild(notification);
        
        // إزالة الإشعار بعد 3 ثواني
        setTimeout(function() {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // ============================================
    // دوال التنسيق والعرض
    // ============================================
    
    function formatCurrency(amount) {
        if (isNaN(amount)) return '0 ج.م';
        return amount.toLocaleString('ar-EG') + ' ج.م';
    }

    function formatDate(dateString) {
        try {
            var date = new Date(dateString);
            var options = { year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('ar-EG', options);
        } catch (e) {
            return dateString || '';
        }
    }

    // ============================================
    // تحديث التاريخ في Navbar
    // ============================================
    function updateNavbarDate() {
        var dateElement = document.getElementById('currentDate');
        if (dateElement) {
            var options = { 
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
        var sidebarToggle = document.getElementById('sidebarToggle');
        var sidebar = document.getElementById('sidebar');
        var sidebarOverlay = document.getElementById('sidebarOverlay');
        
        if (!sidebarToggle || !sidebar || !sidebarOverlay) return;
        
        function toggleSidebar() {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            if (sidebar.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
        
        sidebarToggle.onclick = toggleSidebar;
        sidebarOverlay.onclick = toggleSidebar;
        
        var sidebarLinks = sidebar.querySelectorAll('.sidebar-link');
        for (var i = 0; i < sidebarLinks.length; i++) {
            sidebarLinks[i].onclick = function() {
                if (window.innerWidth < 1024) {
                    toggleSidebar();
                }
            };
        }
    }

    // ============================================
    // تحديث لوحة التحكم (Dashboard)
    // ============================================
    function updateDashboard() {
        var totalProductsEl = document.getElementById('totalProducts');
        var totalSalesEl = document.getElementById('totalSales');
        var totalProfitsEl = document.getElementById('totalProfits');
        var lowStockCountEl = document.getElementById('lowStockCount');
        
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
        
        var recentSalesList = document.getElementById('recentSalesList');
        if (recentSalesList) {
            var recentSales = getRecentSales(5);
            
            if (recentSales.length === 0) {
                recentSalesList.innerHTML = '<p class="no-data">لا توجد عمليات بيع حديثة</p>';
            } else {
                var html = '';
                for (var i = 0; i < recentSales.length; i++) {
                    var sale = recentSales[i];
                    html += '<div class="recent-sale-item">';
                    html += '<div class="recent-sale-info">';
                    html += '<div class="recent-sale-name">' + sale.productName + '</div>';
                    html += '<div class="recent-sale-details">' + sale.quantity + ' × ' + formatCurrency(sale.price) + ' | ' + formatDate(sale.date) + '</div>';
                    html += '</div>';
                    html += '<div class="recent-sale-amount">' + formatCurrency(sale.total) + '</div>';
                    html += '</div>';
                }
                recentSalesList.innerHTML = html;
            }
        }
    }

    // ============================================
    // عرض جدول المنتجات
    // ============================================
    function renderProductsTable(page) {
        if (!page) page = 1;
        
        var tableBody = document.getElementById('productsTableBody');
        var paginationContainer = document.getElementById('pagination');
        var noProductsMessage = document.getElementById('noProductsMessage');
        var productsTable = document.getElementById('productsTable');
        
        if (!tableBody) return;
        
        currentPage = page;
        
        var products = getProducts();
        
        // تطبيق البحث
        var searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            products = searchProducts(products, searchInput.value);
        }
        
        // تطبيق الفلترة
        var categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter && categoryFilter.value) {
            products = filterProductsByCategory(products, categoryFilter.value);
        }
        
        // تطبيق الترتيب
        var sortBy = document.getElementById('sortBy');
        if (sortBy && sortBy.value) {
            products = sortProducts(products, sortBy.value);
        }
        
        var paginatedData = paginateData(products, page, ITEMS_PER_PAGE);
        
        if (paginatedData.items.length === 0) {
            tableBody.innerHTML = '';
            if (noProductsMessage) noProductsMessage.style.display = 'block';
            if (productsTable) productsTable.style.display = 'none';
        } else {
            if (noProductsMessage) noProductsMessage.style.display = 'none';
            if (productsTable) productsTable.style.display = '';
            
            var html = '';
            for (var i = 0; i < paginatedData.items.length; i++) {
                var product = paginatedData.items[i];
                var rowNumber = (page - 1) * ITEMS_PER_PAGE + i + 1;
                var lowStock = product.quantity <= 10;
                
                html += '<tr>';
                html += '<td>' + rowNumber + '</td>';
                html += '<td><strong>' + product.name + '</strong></td>';
                html += '<td><span class="badge badge-info">' + product.code + '</span></td>';
                html += '<td>' + product.category + '</td>';
                html += '<td>' + formatCurrency(product.price) + '</td>';
                html += '<td><span class="badge ' + (lowStock ? 'badge-danger' : 'badge-success') + '">' + product.quantity + '</span></td>';
                html += '<td>' + product.supplier + '</td>';
                html += '<td>' + formatDate(product.date) + '</td>';
                html += '<td><div class="actions-cell">';
                html += '<button class="btn btn-sm btn-primary edit-product-btn" data-id="' + product.id + '" title="تعديل"><i class="fas fa-edit"></i></button> ';
                html += '<button class="btn btn-sm btn-danger delete-product-btn" data-id="' + product.id + '" title="حذف"><i class="fas fa-trash"></i></button>';
                html += '</div></td>';
                html += '</tr>';
            }
            tableBody.innerHTML = html;
            
            // ربط أزرار التعديل والحذف
            attachProductActionListeners();
        }
        
        if (paginationContainer) {
            renderPagination(paginatedData.totalPages, page, paginationContainer);
        }
    }

    function attachProductActionListeners() {
        var editButtons = document.querySelectorAll('.edit-product-btn');
        for (var i = 0; i < editButtons.length; i++) {
            editButtons[i].onclick = function() {
                var productId = parseInt(this.getAttribute('data-id'));
                openEditProductModal(productId);
            };
        }
        
        var deleteButtons = document.querySelectorAll('.delete-product-btn');
        for (var j = 0; j < deleteButtons.length; j++) {
            deleteButtons[j].onclick = function() {
                var productId = parseInt(this.getAttribute('data-id'));
                confirmDeleteProduct(productId);
            };
        }
    }

    // ============================================
    // إدارة المنتجات (Modal)
    // ============================================
    
    function openAddProductModal() {
        var modal = document.getElementById('productModal');
        var modalTitle = document.getElementById('modalTitle');
        var productForm = document.getElementById('productForm');
        
        if (!modal || !modalTitle || !productForm) return;
        
        editingProductId = null;
        modalTitle.textContent = 'إضافة منتج جديد';
        productForm.reset();
        document.getElementById('productId').value = '';
        
        clearFormErrors();
        
        modal.classList.add('active');
    }

    function openEditProductModal(productId) {
        var modal = document.getElementById('productModal');
        var modalTitle = document.getElementById('modalTitle');
        
        if (!modal || !modalTitle) return;
        
        var products = getProducts();
        var product = null;
        for (var i = 0; i < products.length; i++) {
            if (products[i].id === productId) {
                product = products[i];
                break;
            }
        }
        
        if (!product) {
            showNotification('المنتج غير موجود', 'error');
            return;
        }
        
        editingProductId = productId;
        modalTitle.textContent = 'تعديل المنتج';
        
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCode').value = product.code;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productSupplier').value = product.supplier;
        
        clearFormErrors();
        
        modal.classList.add('active');
    }

    function closeModal() {
        var modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.remove('active');
            editingProductId = null;
        }
    }

    function clearFormErrors() {
        var errorMessages = document.querySelectorAll('.error-message');
        for (var i = 0; i < errorMessages.length; i++) {
            errorMessages[i].textContent = '';
        }
    }

    function validateProductForm(data) {
        var isValid = true;
        var el;
        
        if (!data.name || data.name.trim().length < 2) {
            el = document.getElementById('productNameError');
            if (el) el.textContent = 'يجب إدخال اسم المنتج (حرفين على الأقل)';
            isValid = false;
        }
        
        if (!data.code || data.code.trim().length < 3) {
            el = document.getElementById('productCodeError');
            if (el) el.textContent = 'يجب إدخال كود المنتج (3 أحرف على الأقل)';
            isValid = false;
        }
        
        if (!data.category) {
            el = document.getElementById('productCategoryError');
            if (el) el.textContent = 'يجب اختيار التصنيف';
            isValid = false;
        }
        
        if (!data.price || isNaN(data.price) || data.price <= 0) {
            el = document.getElementById('productPriceError');
            if (el) el.textContent = 'يجب إدخال سعر صحيح أكبر من صفر';
            isValid = false;
        }
        
        if (data.quantity === '' || data.quantity === null || data.quantity === undefined || isNaN(data.quantity) || data.quantity < 0) {
            el = document.getElementById('productQuantityError');
            if (el) el.textContent = 'يجب إدخال كمية صحيحة';
            isValid = false;
        }
        
        if (!data.supplier || data.supplier.trim().length < 2) {
            el = document.getElementById('productSupplierError');
            if (el) el.textContent = 'يجب إدخال اسم المورد';
            isValid = false;
        }
        
        return isValid;
    }

    function saveProduct(event) {
        event.preventDefault();
        
        var productData = {
            name: document.getElementById('productName').value.trim(),
            code: document.getElementById('productCode').value.trim(),
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            quantity: parseInt(document.getElementById('productQuantity').value),
            supplier: document.getElementById('productSupplier').value.trim()
        };
        
        if (!validateProductForm(productData)) {
            return false;
        }
        
        if (editingProductId) {
            updateProduct(editingProductId, productData);
            showNotification('تم تحديث المنتج بنجاح', 'success');
        } else {
            addProduct(productData);
            showNotification('تم إضافة المنتج بنجاح', 'success');
        }
        
        closeModal();
        renderProductsTable(currentPage);
        updateDashboard();
        updateSalesProductSelect();
        
        return false;
    }

    function confirmDeleteProduct(productId) {
        var products = getProducts();
        var product = null;
        for (var i = 0; i < products.length; i++) {
            if (products[i].id === productId) {
                product = products[i];
                break;
            }
        }
        
        if (!product) return;
        
        var confirmed = confirm('هل أنت متأكد من حذف المنتج "' + product.name + '"؟');
        
        if (confirmed) {
            deleteProduct(productId);
            showNotification('تم حذف المنتج بنجاح', 'success');
            renderProductsTable(currentPage);
            updateDashboard();
            updateSalesProductSelect();
        }
    }

    // ============================================
    // إدارة المبيعات
    // ============================================
    
    function updateSalesProductSelect() {
        var saleProductSelect = document.getElementById('saleProduct');
        if (!saleProductSelect) return;
        
        var products = getProducts();
        
        var html = '<option value="">اختر المنتج</option>';
        for (var i = 0; i < products.length; i++) {
            var product = products[i];
            html += '<option value="' + product.id + '" data-price="' + product.price + '" data-quantity="' + product.quantity + '" data-name="' + product.name + '">';
            html += product.name + ' - (' + product.quantity + ' متاح) - ' + formatCurrency(product.price);
            html += '</option>';
        }
        
        saleProductSelect.innerHTML = html;
    }

    function updateSaleProductInfo() {
        var saleProductSelect = document.getElementById('saleProduct');
        var salePriceInput = document.getElementById('salePrice');
        var saleQuantityInput = document.getElementById('saleQuantity');
        var availableQuantitySpan = document.getElementById('availableQuantity');
        
        if (!saleProductSelect || !salePriceInput) return;
        
        var selectedOption = saleProductSelect.options[saleProductSelect.selectedIndex];
        
        if (selectedOption && selectedOption.value) {
            var price = parseFloat(selectedOption.getAttribute('data-price'));
            var quantity = parseInt(selectedOption.getAttribute('data-quantity'));
            
            salePriceInput.value = formatCurrency(price);
            
            if (availableQuantitySpan) {
                availableQuantitySpan.textContent = 'الكمية المتاحة: ' + quantity;
            }
            
            updateSaleTotal();
        } else {
            salePriceInput.value = '';
            if (availableQuantitySpan) {
                availableQuantitySpan.textContent = '';
            }
            if (saleQuantityInput) {
                saleQuantityInput.value = '';
            }
            var saleTotalInput = document.getElementById('saleTotal');
            if (saleTotalInput) {
                saleTotalInput.value = '';
            }
        }
    }

    function updateSaleTotal() {
        var saleProductSelect = document.getElementById('saleProduct');
        var saleQuantityInput = document.getElementById('saleQuantity');
        var saleTotalInput = document.getElementById('saleTotal');
        
        if (!saleProductSelect || !saleQuantityInput || !saleTotalInput) return;
        
        var selectedOption = saleProductSelect.options[saleProductSelect.selectedIndex];
        
        if (selectedOption && selectedOption.value && saleQuantityInput.value) {
            var price = parseFloat(selectedOption.getAttribute('data-price'));
            var quantity = parseInt(saleQuantityInput.value);
            
            if (quantity > 0) {
                var total = price * quantity;
                saleTotalInput.value = formatCurrency(total);
            } else {
                saleTotalInput.value = '';
            }
        } else {
            saleTotalInput.value = '';
        }
    }

    function executeSale(event) {
        event.preventDefault();
        
        var saleProductSelect = document.getElementById('saleProduct');
        var saleQuantityInput = document.getElementById('saleQuantity');
        
        if (!saleProductSelect || !saleQuantityInput) return false;
        
        var selectedOption = saleProductSelect.options[saleProductSelect.selectedIndex];
        
        if (!selectedOption || !selectedOption.value) {
            var saleProductError = document.getElementById('saleProductError');
            if (saleProductError) saleProductError.textContent = 'يجب اختيار منتج';
            return false;
        }
        
        var productId = parseInt(selectedOption.value);
        var productName = selectedOption.getAttribute('data-name');
        var price = parseFloat(selectedOption.getAttribute('data-price'));
        var availableQuantity = parseInt(selectedOption.getAttribute('data-quantity'));
        var quantity = parseInt(saleQuantityInput.value);
        
        if (!quantity || isNaN(quantity) || quantity <= 0) {
            var saleQuantityError = document.getElementById('saleQuantityError');
            if (saleQuantityError) saleQuantityError.textContent = 'يجب إدخال كمية صحيحة';
            return false;
        }
        
        if (quantity > availableQuantity) {
            var saleQuantityError = document.getElementById('saleQuantityError');
            if (saleQuantityError) saleQuantityError.textContent = 'الكمية غير كافية. المتاح: ' + availableQuantity;
            return false;
        }
        
        // مسح رسائل الخطأ
        var saleProductError = document.getElementById('saleProductError');
        var saleQuantityError = document.getElementById('saleQuantityError');
        if (saleProductError) saleProductError.textContent = '';
        if (saleQuantityError) saleQuantityError.textContent = '';
        
        var sale = {
            productId: productId,
            productName: productName,
            quantity: quantity,
            price: price,
            total: price * quantity
        };
        
        addSale(sale);
        
        // تحديث المخزون
        var products = getProducts();
        for (var i = 0; i < products.length; i++) {
            if (products[i].id === productId) {
                products[i].quantity -= quantity;
                break;
            }
        }
        saveProducts(products);
        
        showInvoice(sale);
        
        showNotification('تم تنفيذ البيع بنجاح', 'success');
        
        updateSalesProductSelect();
        renderSalesTable();
        updateDashboard();
        
        // إعادة تعيين النموذج
        var saleForm = document.getElementById('saleForm');
        if (saleForm) saleForm.reset();
        
        var salePriceInput = document.getElementById('salePrice');
        if (salePriceInput) salePriceInput.value = '';
        
        var saleTotalInput = document.getElementById('saleTotal');
        if (saleTotalInput) saleTotalInput.value = '';
        
        var availableQuantitySpan = document.getElementById('availableQuantity');
        if (availableQuantitySpan) availableQuantitySpan.textContent = '';
        
        return false;
    }

    function showInvoice(sale) {
        var invoiceContainer = document.getElementById('invoiceContainer');
        if (!invoiceContainer) return;
        
        var invoiceNumber = 'INV-' + sale.id + '-' + new Date().getFullYear();
        
        var html = '';
        html += '<div class="invoice-content">';
        html += '<div class="invoice-header">';
        html += '<h3>فاتورة بيع</h3>';
        html += '<div class="invoice-number">رقم الفاتورة: ' + invoiceNumber + '</div>';
        html += '<div>التاريخ: ' + formatDate(sale.date) + '</div>';
        html += '</div>';
        html += '<div class="invoice-details">';
        html += '<div class="invoice-row"><span class="invoice-label">المنتج:</span><span class="invoice-value">' + sale.productName + '</span></div>';
        html += '<div class="invoice-row"><span class="invoice-label">الكمية:</span><span class="invoice-value">' + sale.quantity + '</span></div>';
        html += '<div class="invoice-row"><span class="invoice-label">سعر الوحدة:</span><span class="invoice-value">' + formatCurrency(sale.price) + '</span></div>';
        html += '<div class="invoice-row"><span class="invoice-label">الإجمالي:</span><span class="invoice-value">' + formatCurrency(sale.total) + '</span></div>';
        html += '</div>';
        html += '<div class="invoice-footer">';
        html += '<p>شكراً لتعاملكم معنا</p>';
        html += '<p>نظام إدارة المخازن © ' + new Date().getFullYear() + '</p>';
        html += '</div>';
        html += '</div>';
        
        invoiceContainer.innerHTML = html;
    }

    function renderSalesTable() {
        var salesTableBody = document.getElementById('salesTableBody');
        var noSalesMessage = document.getElementById('noSalesMessage');
        
        if (!salesTableBody) return;
        
        var sales = getSales();
        var startIndex = sales.length - 10;
        if (startIndex < 0) startIndex = 0;
        
        var recentSales = [];
        for (var i = sales.length - 1; i >= startIndex; i--) {
            recentSales.push(sales[i]);
        }
        
        if (recentSales.length === 0) {
            salesTableBody.innerHTML = '';
            if (noSalesMessage) noSalesMessage.style.display = 'block';
        } else {
            if (noSalesMessage) noSalesMessage.style.display = 'none';
            
            var html = '';
            for (var j = 0; j < recentSales.length; j++) {
                var sale = recentSales[j];
                html += '<tr>';
                html += '<td>' + (j + 1) + '</td>';
                html += '<td><strong>' + sale.productName + '</strong></td>';
                html += '<td>' + sale.quantity + '</td>';
                html += '<td>' + formatCurrency(sale.price) + '</td>';
                html += '<td><strong>' + formatCurrency(sale.total) + '</strong></td>';
                html += '<td>' + formatDate(sale.date) + ' ' + (sale.time || '') + '</td>';
                html += '</tr>';
            }
            salesTableBody.innerHTML = html;
        }
    }

    // ============================================
    // التقارير
    // ============================================
    
    function updateReports() {
        var reportTotalProducts = document.getElementById('reportTotalProducts');
        var reportTotalSales = document.getElementById('reportTotalSales');
        var reportTotalProfits = document.getElementById('reportTotalProfits');
        
        if (reportTotalProducts) reportTotalProducts.textContent = getTotalProducts();
        if (reportTotalSales) reportTotalSales.textContent = getTotalSalesCount();
        if (reportTotalProfits) reportTotalProfits.textContent = formatCurrency(getTotalProfits());
        
        // أكثر المنتجات مبيعاً
        var topSellingTableBody = document.getElementById('topSellingTableBody');
        var noTopSellingMessage = document.getElementById('noTopSellingMessage');
        
        if (topSellingTableBody) {
            var topProducts = getTopSellingProducts(5);
            
            if (topProducts.length === 0) {
                topSellingTableBody.innerHTML = '';
                if (noTopSellingMessage) noTopSellingMessage.style.display = 'block';
            } else {
                if (noTopSellingMessage) noTopSellingMessage.style.display = 'none';
                
                var html = '';
                for (var i = 0; i < topProducts.length; i++) {
                    var item = topProducts[i];
                    html += '<tr>';
                    html += '<td>' + (i + 1) + '</td>';
                    html += '<td><strong>' + item.productName + '</strong></td>';
                    html += '<td>' + item.count + '</td>';
                    html += '<td>' + formatCurrency(item.totalAmount) + '</td>';
                    html += '</tr>';
                }
                topSellingTableBody.innerHTML = html;
            }
        }
        
        // المنتجات منخفضة المخزون
        var lowStockTableBody = document.getElementById('lowStockTableBody');
        var noLowStockMessage = document.getElementById('noLowStockMessage');
        
        if (lowStockTableBody) {
            var lowStockProducts = getLowStockProducts();
            
            if (lowStockProducts.length === 0) {
                lowStockTableBody.innerHTML = '';
                if (noLowStockMessage) noLowStockMessage.style.display = 'block';
            } else {
                if (noLowStockMessage) noLowStockMessage.style.display = 'none';
                
                var html = '';
                for (var j = 0; j < lowStockProducts.length; j++) {
                    var product = lowStockProducts[j];
                    html += '<tr>';
                    html += '<td>' + (j + 1) + '</td>';
                    html += '<td><strong>' + product.name + '</strong></td>';
                    html += '<td><span class="badge badge-danger">' + product.quantity + '</span></td>';
                    html += '<td>' + product.supplier + '</td>';
                    html += '</tr>';
                }
                lowStockTableBody.innerHTML = html;
            }
        }
        
        // آخر المبيعات
        var reportSalesTableBody = document.getElementById('reportSalesTableBody');
        var noReportSalesMessage = document.getElementById('noReportSalesMessage');
        
        if (reportSalesTableBody) {
            var recentSales = getRecentSales(10);
            
            if (recentSales.length === 0) {
                reportSalesTableBody.innerHTML = '';
                if (noReportSalesMessage) noReportSalesMessage.style.display = 'block';
            } else {
                if (noReportSalesMessage) noReportSalesMessage.style.display = 'none';
                
                var html = '';
                for (var k = 0; k < recentSales.length; k++) {
                    var sale = recentSales[k];
                    html += '<tr>';
                    html += '<td>' + (k + 1) + '</td>';
                    html += '<td><strong>' + sale.productName + '</strong></td>';
                    html += '<td>' + sale.quantity + '</td>';
                    html += '<td>' + formatCurrency(sale.total) + '</td>';
                    html += '<td>' + formatDate(sale.date) + '</td>';
                    html += '</tr>';
                }
                reportSalesTableBody.innerHTML = html;
            }
        }
    }

    // ============================================
    // طباعة الفاتورة والتقرير
    // ============================================
    function initPrintButtons() {
        var printInvoiceBtn = document.getElementById('printInvoice');
        if (printInvoiceBtn) {
            printInvoiceBtn.onclick = function() {
                var invoiceContainer = document.getElementById('invoiceContainer');
                if (invoiceContainer && invoiceContainer.querySelector('.invoice-content')) {
                    window.print();
                } else {
                    showNotification('لا توجد فاتورة للطباعة', 'warning');
                }
            };
        }
        
        var printReportBtn = document.getElementById('printReport');
        if (printReportBtn) {
            printReportBtn.onclick = function() {
                window.print();
            };
        }
    }

    // ============================================
    // تهيئة جميع مستمعي الأحداث
    // ============================================
    function initEventListeners() {
        // Sidebar
        initSidebar();
        
        // Product Modal
        var showAddProductBtn = document.getElementById('showAddProductForm');
        var closeModalBtn = document.getElementById('closeModal');
        var cancelProductBtn = document.getElementById('cancelProductBtn');
        var productForm = document.getElementById('productForm');
        var modalOverlay = document.querySelector('.modal-overlay');
        
        if (showAddProductBtn) {
            showAddProductBtn.onclick = openAddProductModal;
        }
        
        if (closeModalBtn) {
            closeModalBtn.onclick = closeModal;
        }
        
        if (cancelProductBtn) {
            cancelProductBtn.onclick = closeModal;
        }
        
        if (modalOverlay) {
            modalOverlay.onclick = closeModal;
        }
        
        if (productForm) {
            productForm.onsubmit = saveProduct;
        }
        
        // إغلاق المودال بزر Escape
        document.onkeydown = function(e) {
            if (e.key === 'Escape') {
                var modal = document.getElementById('productModal');
                if (modal && modal.classList.contains('active')) {
                    closeModal();
                }
            }
        };
        
        // Product Filters
        var searchInput = document.getElementById('searchInput');
        var categoryFilter = document.getElementById('categoryFilter');
        var sortBy = document.getElementById('sortBy');
        
        if (searchInput) {
            searchInput.oninput = function() {
                renderProductsTable(1);
            };
        }
        
        if (categoryFilter) {
            categoryFilter.onchange = function() {
                renderProductsTable(1);
            };
        }
        
        if (sortBy) {
            sortBy.onchange = function() {
                renderProductsTable(1);
            };
        }
        
        // Sales
        var saleProductSelect = document.getElementById('saleProduct');
        var saleQuantityInput = document.getElementById('saleQuantity');
        var saleForm = document.getElementById('saleForm');
        
        if (saleProductSelect) {
            saleProductSelect.onchange = updateSaleProductInfo;
        }
        
        if (saleQuantityInput) {
            saleQuantityInput.oninput = updateSaleTotal;
        }
        
        if (saleForm) {
            saleForm.onsubmit = executeSale;
        }
        
        // Print Buttons
        initPrintButtons();
        
        // Logout Button - تهيئة زر تسجيل الخروج
        initLogoutButton();
    }

    // ============================================
    // التهيئة الأولية
    // ============================================
    function init() {
        console.log('بدء تهيئة النظام...');
        
        // تهيئة البيانات
        initializeData();
        
        // التحقق من تسجيل الدخول
        checkAuth();
        
        // تهيئة صفحة تسجيل الدخول
        initLoginPage();
        
        // تحديث التاريخ
        updateNavbarDate();
        
        // تحديث التاريخ كل دقيقة
        setInterval(updateNavbarDate, 60000);
        
        // تهيئة المستمعين
        initEventListeners();
        
        // تحديث المحتوى حسب الصفحة
        var currentPath = window.location.pathname;
        var pageName = currentPath.split('/').pop();
        
        console.log('الصفحة الحالية:', pageName);
        
        if (pageName === 'index.html' || pageName === '') {
            console.log('تحميل لوحة التحكم');
            updateDashboard();
        } else if (pageName === 'products.html') {
            console.log('تحميل صفحة المنتجات');
            renderProductsTable(1);
        } else if (pageName === 'sales.html') {
            console.log('تحميل صفحة المبيعات');
            updateSalesProductSelect();
            renderSalesTable();
        } else if (pageName === 'reports.html') {
            console.log('تحميل صفحة التقارير');
            updateReports();
        }
        
        // تحديث لوحة التحكم إذا كانت موجودة
        if (pageName !== 'login.html') {
            updateDashboard();
        }
        
        console.log('تم تهيئة النظام بنجاح');
    }

    // بدء التطبيق
    init();
    
    console.log('تم تحميل السكربت بنجاح');
});
