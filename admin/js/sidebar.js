// Shared Sidebar Component for Admin Pages

const AdminSidebar = {
    currentPage: '',
    rootPath: '../',

    init(pageName, rootPath = '../') {
        this.currentPage = pageName;
        this.rootPath = rootPath;

        this.render();
        this.bindEvents();

        // Session timeout only (AccountManager has no init)
        this.initSessionTimeout();
    },

    render() {
        const sidebarHTML = `
            <aside class="admin-sidebar" id="admin-sidebar">
                <div class="sidebar-header">
                    <span class="sidebar-logo-text">CraftSoft</span>
                </div>

                <nav class="sidebar-nav">
                    ${this.navItem('dashboard', 'Dashboard', 'fa-chart-pie')}
                    ${this.navItem('students', 'Students', 'fa-user-graduate')}
                    ${this.navItem('tutors', 'Tutors', 'fa-chalkboard-user')}
                    ${this.navItem('inquiries', 'Inquiries', 'fa-envelope-open-text')}
                    ${this.navItem('courses', 'Courses', 'fa-book-bookmark')}

                    <!-- Payments -->
                    <div class="sidebar-group ${['payments', 'receipts'].includes(this.currentPage) ? 'expanded' : ''}">
                        <div class="sidebar-item has-submenu">
                            <i class="fa-solid fa-money-bill-transfer"></i>
                            <span>Payments</span>
                            <i class="fa-solid fa-chevron-down submenu-arrow"></i>
                        </div>
                        <div class="sidebar-submenu">
                            <a href="${this.rootPath}payments/receipts/" 
                               class="sidebar-subitem ${this.currentPage === 'receipts' ? 'active' : ''}">
                                <i class="fa-solid fa-file-invoice"></i>
                                <span>Receipts</span>
                            </a>
                        </div>
                    </div>

                    ${this.navItem('settings', 'Settings', 'fa-gear')}
                </nav>
            </aside>

            <div class="sidebar-overlay" id="sidebar-overlay"></div>
        `;

        const layout = document.querySelector('.admin-layout');
        if (layout && !document.getElementById('admin-sidebar')) {
            layout.insertAdjacentHTML('afterbegin', sidebarHTML);
        }
    },

    navItem(page, label, icon) {
        return `
            <a href="${this.rootPath}${page}/"
               class="sidebar-item ${this.currentPage === page ? 'active' : ''}">
                <i class="fa-solid ${icon}"></i>
                <span>${label}</span>
            </a>
        `;
    },

    bindEvents() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('admin-sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        menuBtn?.addEventListener('click', () => {
            sidebar?.classList.toggle('open');
            overlay?.classList.toggle('active');
        });

        overlay?.addEventListener('click', () => {
            sidebar?.classList.remove('open');
            overlay?.classList.remove('active');
        });

        const paymentsItem = document.querySelector('.sidebar-item.has-submenu');
        paymentsItem?.addEventListener('click', (e) => {
            e.preventDefault();
            paymentsItem.closest('.sidebar-group')?.classList.toggle('expanded');
        });
    },

    // AccountManager doesn't need init - it's stateless

    initSessionTimeout() {
        const utils = window.AdminUtils;
        if (!utils || !utils.SessionTimeout) return;

        if (typeof utils.SessionTimeout.init === 'function') {
            utils.SessionTimeout.init();
        }
    },

    async renderAccountPanel(session, admin) {
        const { AccountManager } = window.AdminUtils || {};
        if (!AccountManager || !session || !admin) return;

        if (typeof AccountManager.addAccount !== 'function') return;

        AccountManager.addAccount({
            id: session.user.id,
            admin_id: admin.admin_id,
            email: admin.email,
            full_name: admin.full_name,
            initials: AccountManager.getInitials?.(admin.full_name) || ''
        }, true);

        AccountManager.storeSession?.(session.user.id, session);
        AccountManager.renderAccountPanel?.('account-panel-container');
    }
};

// Header helper
const AdminHeader = {
    render(title, showAddBtn = false, addBtnText = 'Add', addBtnId = 'add-btn') {
        return `
            <header class="admin-header">
                <div class="admin-header-left">
                    <button class="mobile-menu-btn" id="mobile-menu-btn">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                    <h1 class="page-title">${title}</h1>
                </div>
                <div class="header-actions">
                    ${showAddBtn ? `
                        <button class="btn btn-primary" id="${addBtnId}">
                            <i class="fa-solid fa-plus"></i>
                            <span>${addBtnText}</span>
                        </button>
                    ` : ''}
                    <div id="account-panel-container"></div>
                </div>
            </header>
        `;
    }
};

window.AdminSidebar = AdminSidebar;
window.AdminHeader = AdminHeader;
