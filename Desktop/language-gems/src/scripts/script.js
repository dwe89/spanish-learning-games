console.log('Dashboard check:', {
    dashboardExists: !!window.dashboard,
    userStatsExists: !!window.userStats,
    dashboardElements: {
        notificationContainer: !!document.querySelector('#notification-container'),
        activityFeed: !!document.querySelector('#activity-feed'),
        xpDisplay: !!document.querySelector('#xp-display')
    }
}); 