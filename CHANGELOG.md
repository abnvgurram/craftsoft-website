# Abhi's Craft Soft - Website Changelog

## Version 2.0 (December 23, 2025)

### ✅ All UX Issues Fixed

#### Critical Issues Resolved
- Fixed 404 page JS path (absolute → relative)
- Added favicon to all 24 HTML pages
- Standardized Firebase version to 10.7.1
- Fixed hamburger button accessibility (div → button)
- Replaced external Unsplash image with local `about-team.png`
- Added About link to verify page navigation
- Added Enter key support for receipt verification
- Added og:image and twitter:card meta tags
- Added `inputmode="numeric"` to phone inputs

#### UX Enhancements Added
- **Live Chat Widget** - Multi-channel contact (WhatsApp, Phone, Email) - Now standard across all pages
- **Removed Scroll-to-Top** - Streamlined UI and fixed mobile overlap with chat widget
- **Standardized UI** - Chat Widget consistently positioned at bottom-right (30px)
- **Related Courses** - "You May Also Like" section on course pages
- **Breadcrumbs** - Added to courses.html page
- **Better Loading States** - CSS spinner animations for forms
- **SEO Structured Data** - JSON-LD for Organization, Courses, FAQs
- **Cleaner Code** - Consolidated CSS and removed unused files (components.css, responsive.css, etc.)

---

## Project Structure

```
Website/
├── index.html              # Homepage
├── about.html              # About Us page
├── 404.html                # Error page
├── favicon.svg             # Site favicon
├── netlify.toml            # Netlify configuration
│
├── assets/
│   ├── css/
│   │   ├── main.css        # Main CSS (imports all modules)
│   │   ├── base/           # Variables, reset, typography
│   │   ├── components/     # Navbar, buttons, FAQ, etc.
│   │   ├── sections/       # Hero, courses, contact, etc.
│   │   ├── pages/          # Page-specific styles
│   │   └── utilities/      # Animations, responsive
│   │
│   ├── js/
│   │   ├── main.js         # All JavaScript functionality
│   │   ├── quiz.js         # Career quiz logic
│   │   └── firebase-config.js
│   │
│   └── images/
│       ├── founder.jpg
│       ├── about-team.png
│       └── og-image.png    # Social sharing image
│
├── pages/
│   ├── courses.html        # All courses listing
│   ├── services.html       # IT services page
│   ├── verify.html         # Receipt verification
│   └── courses/            # Individual course pages
│
└── admin/                  # Admin panel
```

---

## What's Working Well

1. ✅ Beautiful gradient-based design
2. ✅ Fully responsive layout
3. ✅ Firebase + Formspree form handling
4. ✅ Interactive career quiz
5. ✅ Receipt verification system
6. ✅ Live chat widget (new)
7. ✅ Related courses (new)
8. ✅ SEO structured data (new)
9. ✅ Social sharing previews
10. ✅ Consistent favicon across all pages

---

## Future Improvements (Optional)

- [ ] Add search functionality
- [ ] Dark mode toggle
- [ ] Course comparison feature
- [ ] Show course prices
- [ ] Testimonials manual navigation arrows
- [ ] Create sitemap.xml
- [ ] Skip-to-content accessibility link

---

**Last Updated**: December 23, 2025
**Deployed**: https://www.craftsoft.co.in
