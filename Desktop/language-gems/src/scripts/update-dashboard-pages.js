const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const pages = [
    { file: 'index.html', activeSection: 'ANALYTICS', activeItem: 'index.html' },
    { file: 'student-progress.html', activeSection: 'ANALYTICS', activeItem: 'student-progress.html' },
    { file: 'class-analytics.html', activeSection: 'ANALYTICS', activeItem: 'class-analytics.html' },
    { file: 'reports.html', activeSection: 'ANALYTICS', activeItem: 'reports.html' },
    { file: 'class-list.html', activeSection: 'MANAGEMENT', activeItem: 'class-list.html' },
    { file: 'assignments.html', activeSection: 'MANAGEMENT', activeItem: 'assignments.html' },
    { file: 'resources.html', activeSection: 'RESOURCES', activeItem: 'resources.html' },
    { file: 'games.html', activeSection: 'RESOURCES', activeItem: 'games.html' },
    { file: 'lessons.html', activeSection: 'RESOURCES', activeItem: 'lessons.html' },
    { file: 'marketplace.html', activeSection: 'RESOURCES', activeItem: 'marketplace.html' },
    { file: 'library.html', activeSection: 'RESOURCES', activeItem: 'library.html' },
    { file: 'messages.html', activeSection: 'COMMUNICATION', activeItem: 'messages.html' },
    { file: 'announcements.html', activeSection: 'COMMUNICATION', activeItem: 'announcements.html' },
    { file: 'feedback.html', activeSection: 'COMMUNICATION', activeItem: 'feedback.html' },
    { file: 'curriculum.html', activeSection: 'ADMIN', activeItem: 'curriculum.html' },
    { file: 'assessments.html', activeSection: 'ADMIN', activeItem: 'assessments.html' },
    { file: 'settings.html', activeSection: 'ADMIN', activeItem: 'settings.html' }
];

// Read the navigation template
const navTemplatePath = path.join(__dirname, '../teacher-dashboard/nav-template.html');
const navTemplate = fs.readFileSync(navTemplatePath, 'utf8');

pages.forEach(page => {
    const pagePath = path.join(__dirname, '../teacher-dashboard', page.file);
    
    // Read the existing page
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    const $ = cheerio.load(pageContent);

    // Load nav template
    const $nav = cheerio.load(navTemplate);

    // Set active state for the current page
    $nav(`a[href="${page.activeItem}"]`).addClass('active');

    // Replace navigation elements while preserving the rest of the page
    $('.nav-menu').replaceWith($nav('.nav-menu').toString());
    $('.dashboard-header').replaceWith($nav('.dashboard-header').toString());
    $('.dashboard-sidebar').replaceWith($nav('.dashboard-sidebar').toString());

    // Add required CSS if not present
    if (!$('link[href="../styles/menu.css"]').length) {
        $('head').append('<link rel="stylesheet" href="../styles/menu.css">');
    }

    // Write the updated file
    fs.writeFileSync(pagePath, $.html());
    console.log(`Updated navigation in ${page.file}`);
});

console.log('Navigation has been updated in all dashboard pages!'); 