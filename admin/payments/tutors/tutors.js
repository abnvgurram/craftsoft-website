// Tutor Payments Module - Placeholder
document.addEventListener('DOMContentLoaded', async () => {
    const { NavigationSecurity } = window.AdminUtils || {};
    NavigationSecurity?.initProtectedPage();

    // Check session
    const session = await window.supabaseConfig?.getSession();
    if (!session) {
        NavigationSecurity?.secureRedirect('../../login.html');
        return;
    }

    // Init sidebar with 'payments-tutors' to highlight the correct item
    AdminSidebar.init('payments-tutors');

    // Render header
    document.getElementById('header-container').innerHTML = AdminHeader.render('Tutor Payments');
});
