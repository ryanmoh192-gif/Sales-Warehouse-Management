/**
 * نظام إدارة المخازن والمبيعات
 * JavaScript File
 * تم التطوير باستخدام Vanilla JavaScript
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
    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    let editingProductId = null;

    // ============================================
    // دوال LocalStorage
    // ============================================
    
    /**
     * حفظ البيانات في LocalStorage
     */
    function saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            showNotification('فشل في حفظ البيانات', 'error');
        }
    }

    /**
     * استرجاع البيانات من LocalStorage
     */
    function getFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('خطأ في استرجاع البيانات:', error);
            return null;
        }
    }

    /**
     * تهيئة البيانات الافتراضية إذا لم تكن موجودة
     */
    function initializeData() {
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
                    time: '10:30'
                },
                {
                    id: 2,
                    productId: 5,
                    productName: 'علبة بسكويت',
                    quantity: 10,
                    price: 35,
                    total: 350,
                    date: '2024-06-02',
                    time: '14:15'
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
    
    /**
     * الحصول على جميع المنتجات
     */
    function getProducts() {
        return getFromLocalStorage(PRODUCTS_KEY) || [];
    }

    /**
     * حفظ جميع المنتجات
     */
    function saveProducts(products) {
        saveToLocalStorage(PRODUCTS_KEY, products);
    }

    /**
     * إضافة منتج جديد
     */
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

    /**
     * تحديث منتج موجود
     */
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

    /**
     * حذف منتج
     */
    function deleteProduct(productId) {
        const products = getProducts();
        const filteredProducts = products.filter(p => p.id !== productId);
        saveProducts(filteredProducts);
        return filteredProducts;
    }

    /**
     * البحث عن منتج
     */
    function searchProducts(products, query) {
        if (!query) return products;
        const searchTerm = query.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.code.toLowerCase().includes(searchTerm) ||
            p.supplier.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * فلترة المنتجات حسب التصنيف
     */
    function filterProductsByCategory(products, category) {
        if (!category || category === 'all') return products;
        return products.filter(p => p.category === category);
    }

    /**
     * ترتيب المنتجات
     */
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
    
    /**
     * الحصول على جميع المبيعات
     */
    function getSales() {
        return getFromLocalStorage(SALES_KEY) || [];
    }

    /**
     * حفظ جميع المبيعات
     */
    function saveSales(sales) {
        saveToLocalStorage(SALES_KEY, sales);
    }

    /**
     * إضافة عملية بيع جديدة
     */
    function addSale(sale) {
        const sales = getSales();
        const newId = sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1;
        const now = new Date();
        const newSale = {
            ...sale,
            id: newId,
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().split(' ')[0].substring(0, 5)
        };
        sales.push(newSale);
        saveSales(sales);
        return newSale;
    }

    // ============================================
    // دوال الإحصائيات
    // ============================================
    
    /**
     * حساب إجمالي المنتجات
     */
    function getTotalProducts() {
        return getProducts().length;
    }

    /**
     * حساب إجمالي المبيعات (عدد العمليات)
     */
    function getTotalSalesCount() {
        return getSales().length;
    }

    /**
     * حساب إجمالي الأرباح
     */
    function getTotalProfits() {
        const sales = getSales();
        return sales.reduce((total, sale) => total + sale.total, 0);
    }

    /**
     * الحصول على المنتجات منخفضة المخزون
     */
    function getLowStockProducts() {
        const products = getProducts();
        const settings = getFromLocalStorage(SETTINGS_KEY) || { lowStockThreshold: 10 };
        return products.filter(p => p.quantity <= settings.lowStockThreshold);
    }

    /**
     * الحصول على آخر المبيعات
     */
    function getRecentSales(limit = 5) {
        const sales = getSales();
        return sales.slice(-limit).reverse();
    }

    /**
     * الحصول على أكثر المنتجات مبيعاً
     */
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
    
    /**
     * تقسيم البيانات إلى صفحات
     */
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

    /**
     * إنشاء أزرار الترقيم
     */
    function renderPagination(totalPages, currentPage, container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // زر السابق
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
        
        // أرقام الصفحات
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                renderProductsTable(i);
            });
            container.appendChild(pageBtn);
        }
        
        // زر التالي
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
    
    /**
     * عرض إشعار للمستخدم
     */
    function showNotification(message, type = 'info') {
        // إزالة الإشعارات السابقة
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
        
        // إزالة الإشعار بعد 3 ثواني
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
    
    /**
     * تنسيق العملة
     */
    function formatCurrency(amount) {
        return amount.toLocaleString('ar-EG') + ' ج.م';
    }

    /**
     * تنسيق التاريخ
     */
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
        
        // إغلاق sidebar عند النقر على رابط
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
        // تحديث الإحصائيات
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
        
        // تحديث آخر العمليات
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
        
        // الحصول على المنتجات مع تطبيق الفلاتر
        let products = getProducts();
        
        // تطبيق البحث
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            products = searchProducts(products, searchInput.value);
        }
        
        // تطبيق الفلترة
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            products = filterProductsByCategory(products, categoryFilter.value);
        }
        
        // تطبيق الترتيب
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
            products = sortProducts(products, sortBy.value);
        }
        
        // تطبيق الترقيم
        const paginatedData = paginateData(products, page, ITEMS_PER_PAGE);
        
        // عرض البيانات
        if (paginatedData.items.length === 0) {
            tableBody.innerHTML = '';
            if (noProductsMessage) noProductsMessage.style.display = 'block';
            if (productsTable) productsTable.style.display = 'none';
        } else {
            if (noProductsMessage) noProductsMessage.style.display = 'none';
            if (productsTable) productsTable.style.display = '';
            
            tableBody.innerHTML = paginatedData.items.map((product, index) => {
                const rowNumber = (page - 1) * ITEMS_PER_PAGE + index + 1;
                const lowStock = product.quantity <= 10;
                
                return `
                    <tr>
                        <td>${rowNumber}</td>
                        <td><strong>${product.name}</strong></td>
                        <td><span class="badge badge-info">${product.code}</span></td>
                        <td>${product.category}</td>
                        <td>${formatCurrency(product.price)}</td>
                        <td>
                            <span class="badge ${lowStock ? 'badge-danger' : 'badge-success'}">
                                ${product.quantity}
                            </span>
                        </td>
                        <td>${product.supplier}</td>
                        <td>${formatDate(product.date)}</td>
                        <td>
                            <div class="actions-cell">
                                <button class="btn btn-sm btn-primary edit-product-btn" data-id="${product.id}" title="تعديل">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger delete-product-btn" data-id="${product.id}" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
            // إضافة event listeners لأزرار التعديل والحذف
            attachProductActionListeners();
        }
        
        // عرض الترقيم
        if (paginationContainer) {
            renderPagination(paginatedData.totalPages, page, paginationContainer);
        }
    }

    /**
     * إضافة مستمعي الأحداث لأزرار المنتجات
     */
    function attachProductActionListeners() {
        // أزرار التعديل
        const editButtons = document.querySelectorAll('.edit-product-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.getAttribute('data-id'));
                openEditProductModal(productId);
            });
        });
        
        // أزرار الحذف
        const deleteButtons = document.querySelectorAll('.delete-product-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.getAttribute('data-id'));
                confirmDeleteProduct(productId);
            });
        });
    }

    // ============================================
    // إدارة المنتجات (Modal)
    // ============================================
    
    /**
     * فتح نافذة إضافة منتج
     */
    function openAddProductModal() {
        const modal = document.getElementById('productModal');
        const modalTitle = document.getElementById('modalTitle');
        const productForm = document.getElementById('productForm');
        
        if (!modal || !modalTitle || !productForm) return;
        
        editingProductId = null;
        modalTitle.textContent = 'إضافة منتج جديد';
        productForm.reset();
        document.getElementById('productId').value = '';
        
        // مسح رسائل الخطأ
        clearFormErrors();
        
        modal.classList.add('active');
    }

    /**
     * فتح نافذة تعديل منتج
     */
    function openEditProductModal(productId) {
        const modal = document.getElementById('productModal');
        const modalTitle = document.getElementById('modalTitle');
        const productForm = document.getElementById('productForm');
        
        if (!modal || !modalTitle || !productForm) return;
        
        const products = getProducts();
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            showNotification('المنتج غير موجود', 'error');
            return;
        }
        
        editingProductId = productId;
        modalTitle.textContent = 'تعديل المنتج';
        
        // ملء النموذج بالبيانات
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCode').value = product.code;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productSupplier').value = product.supplier;
        
        // مسح رسائل الخطأ
        clearFormErrors();
        
        modal.classList.add('active');
    }

    /**
     * إغلاق النافذة المنبثقة
     */
    function closeModal() {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.remove('active');
            editingProductId = null;
        }
    }

    /**
     * مسح رسائل الخطأ في النموذج
     */
    function clearFormErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(el => el.textContent = '');
    }

    /**
     * التحقق من صحة بيانات المنتج
     */
    function validateProductForm(data) {
        let isValid = true;
        
        // التحقق من اسم المنتج
        if (!data.name || data.name.trim().length < 2) {
            document.getElementById('productNameError').textContent = 'يجب إدخال اسم المنتج (حرفين على الأقل)';
            isValid = false;
        }
        
        // التحقق من الكود
        if (!data.code || data.code.trim().length < 3) {
            document.getElementById('productCodeError').textContent = 'يجب إدخال كود المنتج (3 أحرف على الأقل)';
            isValid = false;
        }
        
        // التحقق من التصنيف
        if (!data.category) {
            document.getElementById('productCategoryError').textContent = 'يجب اختيار التصنيف';
            isValid = false;
        }
        
        // التحقق من السعر
        if (!data.price || data.price <= 0) {
            document.getElementById('productPriceError').textContent = 'يجب إدخال سعر صحيح أكبر من صفر';
            isValid = false;
        }
        
        // التحقق من الكمية
        if (data.quantity === '' || data.quantity < 0) {
            document.getElementById('productQuantityError').textContent = 'يجب إدخال كمية صحيحة';
            isValid = false;
        }
        
        // التحقق من المورد
        if (!data.supplier || data.supplier.trim().length < 2) {
            document.getElementById('productSupplierError').textContent = 'يجب إدخال اسم المورد';
            isValid = false;
        }
        
        return isValid;
    }

    /**
     * حفظ المنتج (إضافة أو تعديل)
     */
    function saveProduct(event) {
        event.preventDefault();
        
        // جمع البيانات من النموذج
        const productData = {
            name: document.getElementById('productName').value.trim(),
            code: document.getElementById('productCode').value.trim(),
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            quantity: parseInt(document.getElementById('productQuantity').value),
            supplier: document.getElementById('productSupplier').value.trim()
        };
        
        // التحقق من صحة البيانات
        if (!validateProductForm(productData)) {
            return;
        }
        
        if (editingProductId) {
            // تحديث منتج موجود
            updateProduct(editingProductId, productData);
            showNotification('تم تحديث المنتج بنجاح', 'success');
        } else {
            // إضافة منتج جديد
            addProduct(productData);
            showNotification('تم إضافة المنتج بنجاح', 'success');
        }
        
        // إغلاق النافذة وتحديث الجدول
        closeModal();
        renderProductsTable(currentPage);
        updateDashboard();
        updateSalesProductSelect();
    }

    /**
     * تأكيد حذف المنتج
     */
    function confirmDeleteProduct(productId) {
        const products = getProducts();
        const product = products.find(p => p.id === productId);
        
        if (!product) return;
        
        const confirmed = confirm(`هل أنت متأكد من حذف المنتج "${product.name}"؟`);
        
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
    
    /**
     * تحديث قائمة المنتجات في صفحة المبيعات
     */
    function updateSalesProductSelect() {
        const saleProductSelect = document.getElementById('saleProduct');
        if (!saleProductSelect) return;
        
        const products = getProducts();
        
        saleProductSelect.innerHTML = '<option value="">اختر المنتج</option>' + 
            products.map(product => `
                <option value="${product.id}" 
                    data-price="${product.price}" 
                    data-quantity="${product.quantity}"
                    data-name="${product.name}">
                    ${product.name} - (${product.quantity} متاح) - ${formatCurrency(product.price)}
                </option>
            `).join('');
    }

    /**
     * تحديث السعر والكمية المتاحة عند اختيار منتج
     */
    function updateSaleProductInfo() {
        const saleProductSelect = document.getElementById('saleProduct');
        const salePriceInput = document.getElementById('salePrice');
        const saleQuantityInput = document.getElementById('saleQuantity');
        const availableQuantitySpan = document.getElementById('availableQuantity');
        
        if (!saleProductSelect || !salePriceInput) return;
        
        const selectedOption = saleProductSelect.options[saleProductSelect.selectedIndex];
        
        if (selectedOption && selectedOption.value) {
            const price = parseFloat(selectedOption.getAttribute('data-price'));
            const quantity = parseInt(selectedOption.getAttribute('data-quantity'));
            
            salePriceInput.value = formatCurrency(price);
            
            if (availableQuantitySpan) {
                availableQuantitySpan.textContent = `الكمية المتاحة: ${quantity}`;
            }
            
            // تحديث الإجمالي
            updateSaleTotal();
        } else {
            salePriceInput.value = '';
            if (availableQuantitySpan) {
                availableQuantitySpan.textContent = '';
            }
            if (saleQuantityInput) {
                saleQuantityInput.value = '';
            }
            document.getElementById('saleTotal').value = '';
        }
    }

    /**
     * تحديث الإجمالي في صفحة المبيعات
     */
    function updateSaleTotal() {
        const saleProductSelect = document.getElementById('saleProduct');
        const saleQuantityInput = document.getElementById('saleQuantity');
        const saleTotalInput = document.getElementById('saleTotal');
        
        if (!saleProductSelect || !saleQuantityInput || !saleTotalInput) return;
        
        const selectedOption = saleProductSelect.options[saleProductSelect.selectedIndex];
        
        if (selectedOption && selectedOption.value && saleQuantityInput.value) {
            const price = parseFloat(selectedOption.getAttribute('data-price'));
            const quantity = parseInt(saleQuantityInput.value);
            
            if (quantity > 0) {
                const total = price * quantity;
                saleTotalInput.value = formatCurrency(total);
            } else {
                saleTotalInput.value = '';
            }
        } else {
            saleTotalInput.value = '';
        }
    }

    /**
     * تنفيذ عملية البيع
     */
    function executeSale(event) {
        event.preventDefault();
        
        const saleProductSelect = document.getElementById('saleProduct');
        const saleQuantityInput = document.getElementById('saleQuantity');
        
        if (!saleProductSelect || !saleQuantityInput) return;
        
        const selectedOption = saleProductSelect.options[saleProductSelect.selectedIndex];
        
        // التحقق من اختيار منتج
        if (!selectedOption || !selectedOption.value) {
            document.getElementById('saleProductError').textContent = 'يجب اختيار منتج';
            return;
        }
        
        const productId = parseInt(selectedOption.value);
        const productName = selectedOption.getAttribute('data-name');
        const price = parseFloat(selectedOption.getAttribute('data-price'));
        const availableQuantity = parseInt(selectedOption.getAttribute('data-quantity'));
        const quantity = parseInt(saleQuantityInput.value);
        
        // التحقق من الكمية
        if (!quantity || quantity <= 0) {
            document.getElementById('saleQuantityError').textContent = 'يجب إدخال كمية صحيحة';
            return;
        }
        
        // التحقق من توفر الكمية
        if (quantity > availableQuantity) {
            document.getElementById('saleQuantityError').textContent = `الكمية غير كافية. المتاح: ${availableQuantity}`;
            return;
        }
        
        // مسح رسائل الخطأ
        document.getElementById('saleProductError').textContent = '';
        document.getElementById('saleQuantityError').textContent = '';
        
        // إنشاء عملية البيع
        const sale = {
            productId: productId,
            productName: productName,
            quantity: quantity,
            price: price,
            total: price * quantity
        };
        
        // إضافة البيع
        addSale(sale);
        
        // تحديث المخزون
        const products = getProducts();
        const product = products.find(p => p.id === productId);
        if (product) {
            product.quantity -= quantity;
            saveProducts(products);
        }
        
        // عرض الفاتورة
        showInvoice(sale);
        
        // عرض رسالة نجاح
        showNotification('تم تنفيذ البيع بنجاح', 'success');
        
        // تحديث الواجهة
        updateSalesProductSelect();
        renderSalesTable();
        updateDashboard();
        
        // إعادة تعيين النموذج
        document.getElementById('saleForm').reset();
        document.getElementById('salePrice').value = '';
        document.getElementById('saleTotal').value = '';
        const availableQuantitySpan = document.getElementById('availableQuantity');
        if (availableQuantitySpan) {
            availableQuantitySpan.textContent = '';
        }
    }

    /**
     * عرض الفاتورة
     */
    function showInvoice(sale) {
        const invoiceContainer = document.getElementById('invoiceContainer');
        if (!invoiceContainer) return;
        
        const invoiceNumber = `INV-${sale.id}-${new Date().getFullYear()}`;
        
        invoiceContainer.innerHTML = `
            <div class="invoice-content">
                <div class="invoice-header">
                    <h3>فاتورة بيع</h3>
                    <div class="invoice-number">رقم الفاتورة: ${invoiceNumber}</div>
                    <div>التاريخ: ${formatDate(sale.date)}</div>
                </div>
                <div class="invoice-details">
                    <div class="invoice-row">
                        <span class="invoice-label">المنتج:</span>
                        <span class="invoice-value">${sale.productName}</span>
                    </div>
                    <div class="invoice-row">
                        <span class="invoice-label">الكمية:</span>
                        <span class="invoice-value">${sale.quantity}</span>
                    </div>
                    <div class="invoice-row">
                        <span class="invoice-label">سعر الوحدة:</span>
                        <span class="invoice-value">${formatCurrency(sale.price)}</span>
                    </div>
                    <div class="invoice-row">
                        <span class="invoice-label">الإجمالي:</span>
                        <span class="invoice-value">${formatCurrency(sale.total)}</span>
                    </div>
                </div>
                <div class="invoice-footer">
                    <p>شكراً لتعاملكم معنا</p>
                    <p>نظام إدارة المخازن © ${new Date().getFullYear()}</p>
                </div>
            </div>
        `;
    }

    /**
     * عرض جدول المبيعات
     */
    function renderSalesTable() {
        const salesTableBody = document.getElementById('salesTableBody');
        const noSalesMessage = document.getElementById('noSalesMessage');
        
        if (!salesTableBody) return;
        
        const sales = getSales();
        const recentSales = sales.slice(-10).reverse();
        
        if (recentSales.length === 0) {
            salesTableBody.innerHTML = '';
            if (noSalesMessage) noSalesMessage.style.display = 'block';
        } else {
            if (noSalesMessage) noSalesMessage.style.display = 'none';
            
            salesTableBody.innerHTML = recentSales.map((sale, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${sale.productName}</strong></td>
                    <td>${sale.quantity}</td>
                    <td>${formatCurrency(sale.price)}</td>
                    <td><strong>${formatCurrency(sale.total)}</strong></td>
                    <td>${formatDate(sale.date)} ${sale.time || ''}</td>
                </tr>
            `).join('');
        }
    }

    // ============================================
    // التقارير
    // ============================================
    
    /**
     * تحديث صفحة التقارير
     */
    function updateReports() {
        // تحديث الإحصائيات
        const reportTotalProducts = document.getElementById('reportTotalProducts');
        const reportTotalSales = document.getElementById('reportTotalSales');
        const reportTotalProfits = document.getElementById('reportTotalProfits');
        
        if (reportTotalProducts) reportTotalProducts.textContent = getTotalProducts();
        if (reportTotalSales) reportTotalSales.textContent = getTotalSalesCount();
        if (reportTotalProfits) reportTotalProfits.textContent = formatCurrency(getTotalProfits());
        
        // تحديث أكثر المنتجات مبيعاً
        const topSellingTableBody = document.getElementById('topSellingTableBody');
        const noTopSellingMessage = document.getElementById('noTopSellingMessage');
        
        if (topSellingTableBody) {
            const topProducts = getTopSellingProducts(5);
            
            if (topProducts.length === 0) {
                topSellingTableBody.innerHTML = '';
                if (noTopSellingMessage) noTopSellingMessage.style.display = 'block';
            } else {
                if (noTopSellingMessage) noTopSellingMessage.style.display = 'none';
                
                topSellingTableBody.innerHTML = topProducts.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${item.productName}</strong></td>
                        <td>${item.count}</td>
                        <td>${formatCurrency(item.totalAmount)}</td>
                    </tr>
                `).join('');
            }
        }
        
        // تحديث المنتجات منخفضة المخزون
        const lowStockTableBody = document.getElementById('lowStockTableBody');
        const noLowStockMessage = document.getElementById('noLowStockMessage');
        
        if (lowStockTableBody) {
            const lowStockProducts = getLowStockProducts();
            
            if (lowStockProducts.length === 0) {
                lowStockTableBody.innerHTML = '';
                if (noLowStockMessage) noLowStockMessage.style.display = 'block';
            } else {
                if (noLowStockMessage) noLowStockMessage.style.display = 'none';
                
                lowStockTableBody.innerHTML = lowStockProducts.map((product, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${product.name}</strong></td>
                        <td>
                            <span class="badge badge-danger">${product.quantity}</span>
                        </td>
                        <td>${product.supplier}</td>
                    </tr>
                `).join('');
            }
        }
        
        // تحديث آخر المبيعات
        const reportSalesTableBody = document.getElementById('reportSalesTableBody');
        const noReportSalesMessage = document.getElementById('noReportSalesMessage');
        
        if (reportSalesTableBody) {
            const recentSales = getRecentSales(10);
            
            if (recentSales.length === 0) {
                reportSalesTableBody.innerHTML = '';
                if (noReportSalesMessage) noReportSalesMessage.style.display = 'block';
            } else {
                if (noReportSalesMessage) noReportSalesMessage.style.display = 'none';
                
                reportSalesTableBody.innerHTML = recentSales.map((sale, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${sale.productName}</strong></td>
                        <td>${sale.quantity}</td>
                        <td>${formatCurrency(sale.total)}</td>
                        <td>${formatDate(sale.date)}</td>
                    </tr>
                `).join('');
            }
        }
    }

    // ============================================
    // طباعة الفاتورة والتقرير
    // ============================================
    function initPrintButtons() {
        // زر طباعة الفاتورة
        const printInvoiceBtn = document.getElementById('printInvoice');
        if (printInvoiceBtn) {
            printInvoiceBtn.addEventListener('click', () => {
                const invoiceContainer = document.getElementById('invoiceContainer');
                if (invoiceContainer && invoiceContainer.querySelector('.invoice-content')) {
                    window.print();
                } else {
                    showNotification('لا توجد فاتورة للطباعة', 'warning');
                }
            });
        }
        
        // زر طباعة التقرير
        const printReportBtn = document.getElementById('printReport');
        if (printReportBtn) {
            printReportBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }

    // ============================================
    // تهيئة جميع مستمعي الأحداث
    // ============================================
    function initEventListeners() {
        // Sidebar
        initSidebar();
        
        // Product Modal
        const showAddProductBtn = document.getElementById('showAddProductForm');
        const closeModalBtn = document.getElementById('closeModal');
        const cancelProductBtn = document.getElementById('cancelProductBtn');
        const productForm = document.getElementById('productForm');
        const modalOverlay = document.querySelector('.modal-overlay');
        
        if (showAddProductBtn) {
            showAddProductBtn.addEventListener('click', openAddProductModal);
        }
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeModal);
        }
        
        if (cancelProductBtn) {
            cancelProductBtn.addEventListener('click', closeModal);
        }
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', closeModal);
        }
        
        if (productForm) {
            productForm.addEventListener('submit', saveProduct);
        }
        
        // إغلاق المودال بزر Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('productModal');
                if (modal && modal.classList.contains('active')) {
                    closeModal();
                }
            }
        });
        
        // Product Filters
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortBy = document.getElementById('sortBy');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => renderProductsTable(1));
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => renderProductsTable(1));
        }
        
        if (sortBy) {
            sortBy.addEventListener('change', () => renderProductsTable(1));
        }
        
        // Sales
        const saleProductSelect = document.getElementById('saleProduct');
        const saleQuantityInput = document.getElementById('saleQuantity');
        const saleForm = document.getElementById('saleForm');
        
        if (saleProductSelect) {
            saleProductSelect.addEventListener('change', updateSaleProductInfo);
        }
        
        if (saleQuantityInput) {
            saleQuantityInput.addEventListener('input', updateSaleTotal);
        }
        
        if (saleForm) {
            saleForm.addEventListener('submit', executeSale);
        }
        
        // Print Buttons
        initPrintButtons();
    }

    // ============================================
    // التهيئة الأولية
    // ============================================
    function init() {
        // تهيئة البيانات
        initializeData();
        
        // تحديث التاريخ
        updateNavbarDate();
        
        // تحديث التاريخ كل دقيقة
        setInterval(updateNavbarDate, 60000);
        
        // تهيئة المستمعين
        initEventListeners();
        
        // تحديث المحتوى حسب الصفحة
        const currentPath = window.location.pathname;
        const pageName = currentPath.split('/').pop();
        
        if (pageName === 'index.html' || pageName === '') {
            updateDashboard();
        } else if (pageName === 'products.html') {
            renderProductsTable();
        } else if (pageName === 'sales.html') {
            updateSalesProductSelect();
            renderSalesTable();
        } else if (pageName === 'reports.html') {
            updateReports();
        }
        
        // تحديث لوحة التحكم إذا كانت موجودة
        updateDashboard();
    }

    // بدء التطبيق
    init();
});