/* ============================================
   CRAFTSOFT - Festival Effects System (JavaScript)
   Auto-activates based on Indian festival dates
   API: Calendarific for lunar calendar dates
   ============================================ */

(function () {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        API_KEY: 'ez3pfQ9AxWlU4qbAHmC8Z34qaEKBbV9N',
        CACHE_KEY: 'craftsoft_festival_dates',
        CACHE_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
        PARTICLE_COUNT: 25
    };

    // Festival definitions with particles
    const FESTIVALS = {
        newyear: {
            name: 'New Year',
            particles: ['🎉', '🎊', '✨', '🎆', '🥳'],
            fixedDate: { month: 1, day: 1 }
        },
        sankranti: {
            name: 'Makar Sankranti',
            particles: ['🪁', '🪁', '🪁', '🎏'],
            fixedDate: { month: 1, day: 14 }
        },
        republic: {
            name: 'Republic Day',
            particles: ['🇮🇳', '●', '●', '●'], // CSS handles tricolor
            fixedDate: { month: 1, day: 26 }
        },
        holi: {
            name: 'Holi',
            particles: ['●', '●', '●', '●', '●', '●'], // CSS handles colors
            apiName: 'Holi'
        },
        ugadi: {
            name: 'Ugadi',
            particles: ['🌸', '🌺', '🌼', '🌷', '🌹', '💐'],
            apiName: 'Ugadi'
        },
        independence: {
            name: 'Independence Day',
            particles: ['🇮🇳', '●', '●', '●'],
            fixedDate: { month: 8, day: 15 }
        },
        ganesh: {
            name: 'Vinayaka Chaviti',
            particles: ['🌺', '🌸', '🪷', '🌼', '🍬'],
            apiName: 'Ganesh Chaturthi'
        },
        bathukamma: {
            name: 'Bathukamma',
            particles: ['🌺', '🌸', '🌼', '🌻', '🌷', '💐'],
            apiName: 'Bathukamma'
        },
        dasara: {
            name: 'Dasara',
            particles: ['✨', '⭐', '💫', '🌟', '✦'],
            apiName: 'Dussehra'
        },
        diwali: {
            name: 'Diwali',
            particles: ['🪔', '🎆', '🎇', '✨', '💫', '🌟'],
            apiName: 'Diwali',
            darkMode: true
        },
        eid: {
            name: 'Eid ul-Fitr',
            particles: ['☪️', '⭐', '✨', '🌙', '💫'],
            apiName: 'Eid ul-Fitr'
        },
        christmas: {
            name: 'Christmas',
            particles: ['❄', '❅', '❆', '✧', '✦'],
            fixedDate: { month: 12, day: 25 },
            endDate: { month: 12, day: 31 }
        }
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }

    function isDateInRange(date, startMonth, startDay, endMonth, endDay) {
        const month = date.getMonth() + 1;
        const day = date.getDate();

        if (startMonth === endMonth) {
            return month === startMonth && day >= startDay && day <= endDay;
        }
        return (month === startMonth && day >= startDay) ||
            (month === endMonth && day <= endDay);
    }

    // ============================================
    // FESTIVAL DETECTION
    // ============================================

    async function getCurrentFestival() {
        const now = new Date();
        const year = now.getFullYear();

        // Check fixed date festivals first
        for (const [key, festival] of Object.entries(FESTIVALS)) {
            if (festival.fixedDate) {
                const festDate = new Date(year, festival.fixedDate.month - 1, festival.fixedDate.day);

                if (festival.endDate) {
                    // Range check (e.g., Christmas Dec 25-31)
                    if (isDateInRange(now, festival.fixedDate.month, festival.fixedDate.day,
                        festival.endDate.month, festival.endDate.day)) {
                        return key;
                    }
                } else if (isSameDay(now, festDate)) {
                    return key;
                }
            }
        }

        // Check API-based festivals
        const apiDates = await getAPIFestivalDates(year);
        if (apiDates) {
            for (const [key, festival] of Object.entries(FESTIVALS)) {
                if (festival.apiName && apiDates[key]) {
                    const festDate = new Date(apiDates[key]);
                    if (isSameDay(now, festDate)) {
                        return key;
                    }
                }
            }
        }

        return null;
    }

    // ============================================
    // API INTEGRATION
    // ============================================

    async function getAPIFestivalDates(year) {
        // Check cache first
        const cached = localStorage.getItem(CONFIG.CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            if (data.year === year && Date.now() - data.timestamp < CONFIG.CACHE_EXPIRY) {
                return data.dates;
            }
        }

        // Fetch from API
        try {
            const response = await fetch(
                `https://calendarific.com/api/v2/holidays?api_key=${CONFIG.API_KEY}&country=IN&year=${year}`
            );
            const data = await response.json();

            if (data.response && data.response.holidays) {
                const dates = {};

                data.response.holidays.forEach(holiday => {
                    const name = holiday.name.toLowerCase();

                    // Map API names to our keys
                    if (name.includes('holi') && !name.includes('holika')) dates.holi = holiday.date.iso;
                    if (name.includes('ugadi')) dates.ugadi = holiday.date.iso;
                    if (name.includes('ganesh chaturthi')) dates.ganesh = holiday.date.iso;
                    if (name.includes('dussehra') || name.includes('vijayadashami')) dates.dasara = holiday.date.iso;
                    if (name.includes('diwali') || name.includes('deepavali')) dates.diwali = holiday.date.iso;
                    if (name.includes('eid ul-fitr') || name.includes('eid-ul-fitr')) dates.eid = holiday.date.iso;
                    if (name.includes('bathukamma')) dates.bathukamma = holiday.date.iso;
                });

                // Cache the results
                localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({
                    year: year,
                    timestamp: Date.now(),
                    dates: dates
                }));

                return dates;
            }
        } catch (error) {
            console.error('Festival API error:', error);
        }

        return null;
    }

    // ============================================
    // EFFECT RENDERING
    // ============================================

    function createFestivalEffect(festivalKey) {
        const festival = FESTIVALS[festivalKey];
        if (!festival) return;

        console.log(`🎉 Festival: ${festival.name} - Effect activated!`);

        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/assets/css/festivals.css?v=1.0';
        document.head.appendChild(link);

        // Create container
        const container = document.createElement('div');
        container.className = `festival-effects festival-${festivalKey}`;
        container.setAttribute('aria-hidden', 'true');

        // Create particles
        const particleCount = window.innerWidth < 768 ? 14 : CONFIG.PARTICLE_COUNT;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('span');
            particle.className = 'festival-particle';
            particle.textContent = festival.particles[i % festival.particles.length];
            container.appendChild(particle);
        }

        // Add to page
        if (document.body) {
            document.body.appendChild(container);
        }

        // Apply dark mode for Diwali
        if (festival.darkMode) {
            document.body.classList.add('diwali-mode');
        }
    }

    function clearFestivalEffects() {
        const existing = document.querySelector('.festival-effects');
        if (existing) existing.remove();
        document.body.classList.remove('diwali-mode');
    }

    // ============================================
    // TEST MODE (for development)
    // ============================================

    window.testFestival = function (festivalKey) {
        clearFestivalEffects();
        if (festivalKey && FESTIVALS[festivalKey]) {
            createFestivalEffect(festivalKey);
        }
    };

    window.getFestivalsList = function () {
        return Object.keys(FESTIVALS);
    };

    // ============================================
    // INITIALIZATION
    // ============================================

    async function init() {
        // Don't run on admin pages
        if (window.location.pathname.includes('/admin')) {
            return;
        }

        // Check for test mode
        const urlParams = new URLSearchParams(window.location.search);
        const testFest = urlParams.get('festival');
        if (testFest && FESTIVALS[testFest]) {
            createFestivalEffect(testFest);
            return;
        }

        // Normal mode - detect current festival
        const currentFestival = await getCurrentFestival();
        if (currentFestival) {
            createFestivalEffect(currentFestival);
        } else {
            console.log('🎉 No festival today');
        }
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
