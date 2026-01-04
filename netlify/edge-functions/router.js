export default async (request, context) => {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;

    // 1. Signup Subdomain
    if (hostname.includes("signup.craftsoft")) {
        if (pathname === "/") {
            return context.rewrite("/subdomains/acs_admin/signup/index.html");
        }
        // Redirect directory to trailing slash for relative assets to work
        if (!pathname.includes(".") && !pathname.endsWith("/")) {
            return Response.redirect(`${request.url}/`, 301);
        }
        return context.rewrite(`/subdomains/acs_admin/signup${pathname}`);
    }

    // 2. Admin Subdomain
    if (hostname.includes("admin.craftsoft")) {
        // Assets, Shared, and Subdomains should be served from root
        if (pathname.startsWith("/assets/") || pathname.startsWith("/shared/") || pathname.startsWith("/subdomains/")) {
            return; // Fall through to static files
        }

        if (pathname === "/") {
            return context.rewrite("/subdomains/acs_admin/index.html");
        }

        if (pathname === "/login") {
            return context.rewrite("/subdomains/acs_admin/login.html");
        }

        // Redirect directory to trailing slash
        const adminFolders = ["/dashboard", "/inquiries", "/students", "/clients", "/courses", "/services", "/payments", "/settings"];
        if (adminFolders.some(folder => pathname === folder)) {
            return Response.redirect(`${request.url}/`, 301);
        }

        // Rewrite admin paths
        if (adminFolders.some(folder => pathname.startsWith(folder + "/"))) {
            // Map to subfolder
            let newPath = pathname;
            if (pathname.endsWith("/")) {
                newPath += "index.html";
            }
            return context.rewrite(`/subdomains/acs_admin${newPath}`);
        }

        // Fallback for admin assets (like /login.css)
        return context.rewrite(`/subdomains/acs_admin${pathname}`);
    }

    // 3. Main Website
    return;
};

export const config = { path: "/*" };
