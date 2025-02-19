class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.currentView = 'month';
        this.events = [];
        this.filteredEventTypes = new Set(['lesson', 'practice', 'assignment', 'exam', 'meeting']);
        
        this.initializeEventListeners();
        this.loadEvents();
    }

    async initializeEventListeners() {
        // Navigation buttons
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

        // View options
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => this.changeView(btn.dataset.view));
        });

        // New event button
        document.getElementById('newEventBtn').addEventListener('click', () => this.showEventModal());

        // Modal close buttons
        document.getElementById('closeEventModal').addEventListener('click', () => this.hideEventModal());
        document.getElementById('cancelEventBtn').addEventListener('click', () => this.hideEventModal());
        document.getElementById('closeDetailsModal').addEventListener('click', () => this.hideDetailsModal());

        // Save event button
        document.getElementById('saveEventBtn').addEventListener('click', () => this.saveEvent());

        // Event type filters
        document.querySelectorAll('.filter-option input').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const eventType = checkbox.dataset.type;
                if (checkbox.checked) {
                    this.filteredEventTypes.add(eventType);
                } else {
                    this.filteredEventTypes.delete(eventType);
                }
                this.renderCalendar();
            });
        });

        // Event details modal buttons
        document.getElementById('deleteEventBtn').addEventListener('click', () => this.deleteEvent());
        document.getElementById('editEventBtn').addEventListener('click', () => this.editEvent());

        // Initialize calendar
        this.renderCalendar();
    }

    async loadEvents() {
        try {
            // In a real application, this would be an API call
            const response = await this.fetchEvents();
            this.events = response;
            this.renderCalendar();
            this.renderUpcomingEvents();
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    async fetchEvents() {
        // This is a mock response. In a real application, this would be an API call
        return [
            {
                id: 1,
                title: 'Spanish Grammar Lesson',
                type: 'lesson',
                date: new Date(2024, 2, 15, 10, 0),
                duration: 60,
                description: 'Focus on past tense conjugation'
            },
            {
                id: 2,
                title: 'Vocabulary Practice',
                type: 'practice',
                date: new Date(2024, 2, 15, 14, 30),
                duration: 30,
                description: 'Review food and restaurant vocabulary'
            },
            {
                id: 3,
                title: 'Writing Assignment',
                type: 'assignment',
                date: new Date(2024, 2, 17, 9, 0),
                duration: 120,
                description: 'Write a 500-word essay about your favorite holiday'
            }
        ];
    }

    renderCalendar() {
        this.updateMonthDisplay();
        this.renderMiniCalendar();
        
        if (this.currentView === 'month') {
            this.renderMonthView();
        } else if (this.currentView === 'week') {
            this.renderWeekView();
        } else {
            this.renderDayView();
        }
    }

    updateMonthDisplay() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('currentMonth').textContent = 
            `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }

    renderMiniCalendar() {
        const miniCalendar = document.getElementById('miniCalendar');
        const date = new Date(this.currentDate);
        date.setDate(1);
        
        const firstDay = date.getDay();
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        
        let html = `
            <div class="mini-calendar-grid">
                <div class="mini-calendar-days">
                    <span>S</span>
                    <span>M</span>
                    <span>T</span>
                    <span>W</span>
                    <span>T</span>
                    <span>F</span>
                    <span>S</span>
                </div>
                <div class="mini-calendar-dates">
        `;

        for (let i = 0; i < firstDay; i++) {
            html += '<span></span>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = this.isToday(new Date(date.getFullYear(), date.getMonth(), day));
            const isSelected = this.isSelectedDate(new Date(date.getFullYear(), date.getMonth(), day));
            html += `
                <span class="${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
                      data-date="${date.getFullYear()}-${date.getMonth() + 1}-${day}">
                    ${day}
                </span>
            `;
        }

        html += '</div></div>';
        miniCalendar.innerHTML = html;

        // Add click events to dates
        miniCalendar.querySelectorAll('.mini-calendar-dates span[data-date]').forEach(dateEl => {
            dateEl.addEventListener('click', () => {
                const [year, month, day] = dateEl.dataset.date.split('-').map(Number);
                this.selectedDate = new Date(year, month - 1, day);
                this.renderCalendar();
            });
        });
    }

    renderMonthView() {
        const calendarDates = document.getElementById('calendarDates');
        const date = new Date(this.currentDate);
        date.setDate(1);
        
        const firstDay = date.getDay();
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        
        let html = '';

        // Previous month's days
        const prevMonthDays = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            html += this.createDateCell(new Date(date.getFullYear(), date.getMonth() - 1, day), true);
        }

        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            html += this.createDateCell(new Date(date.getFullYear(), date.getMonth(), day));
        }

        // Next month's days
        const cellsToAdd = 42 - (firstDay + daysInMonth);
        for (let day = 1; day <= cellsToAdd; day++) {
            html += this.createDateCell(new Date(date.getFullYear(), date.getMonth() + 1, day), true);
        }

        calendarDates.innerHTML = html;

        // Add click events to events
        calendarDates.querySelectorAll('.calendar-event').forEach(eventEl => {
            eventEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = parseInt(eventEl.dataset.eventId);
                const event = this.events.find(e => e.id === eventId);
                if (event) {
                    this.showEventDetails(event);
                }
            });
        });
    }

    createDateCell(date, isOtherMonth = false) {
        const isToday = this.isToday(date);
        const events = this.getEventsForDate(date);
        
        return `
            <div class="calendar-date ${isToday ? 'today' : ''} ${isOtherMonth ? 'other-month' : ''}"
                 data-date="${date.toISOString()}">
                <span class="date-number">${date.getDate()}</span>
                ${events.map(event => `
                    <div class="calendar-event ${event.type}" data-event-id="${event.id}">
                        ${this.formatTime(event.date)} ${event.title}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderWeekView() {
        // To be implemented
    }

    renderDayView() {
        // To be implemented
    }

    renderUpcomingEvents() {
        const container = document.querySelector('.events-list');
        const now = new Date();
        
        // Get future events, sorted by date
        const upcomingEvents = this.events
            .filter(event => event.date > now && this.filteredEventTypes.has(event.type))
            .sort((a, b) => a.date - b.date)
            .slice(0, 5);

        container.innerHTML = upcomingEvents.map(event => `
            <div class="event-item" data-event-id="${event.id}">
                <span class="color-dot ${event.type}"></span>
                <div class="event-info">
                    <span class="event-time">${this.formatDateTime(event.date)}</span>
                    <h4 class="event-title">${event.title}</h4>
                </div>
            </div>
        `).join('');

        // Add click events
        container.querySelectorAll('.event-item').forEach(eventEl => {
            eventEl.addEventListener('click', () => {
                const eventId = parseInt(eventEl.dataset.eventId);
                const event = this.events.find(e => e.id === eventId);
                if (event) {
                    this.showEventDetails(event);
                }
            });
        });
    }

    showEventModal(event = null) {
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        
        if (event) {
            // Edit mode
            form.elements.eventTitle.value = event.title;
            form.elements.eventType.value = event.type;
            form.elements.eventDate.value = this.formatDate(event.date);
            form.elements.eventTime.value = this.formatTime(event.date);
            form.elements.eventDuration.value = event.duration;
            form.elements.eventDescription.value = event.description || '';
            form.dataset.eventId = event.id;
        } else {
            // New event mode
            form.reset();
            form.elements.eventDate.value = this.formatDate(this.selectedDate);
            delete form.dataset.eventId;
        }

        modal.classList.add('active');
    }

    hideEventModal() {
        document.getElementById('eventModal').classList.remove('active');
    }

    showEventDetails(event) {
        const modal = document.getElementById('eventDetailsModal');
        
        document.getElementById('detailsTitle').textContent = event.title;
        document.getElementById('detailsDate').textContent = this.formatDate(event.date);
        document.getElementById('detailsTime').textContent = `${this.formatTime(event.date)} (${event.duration} minutes)`;
        document.getElementById('detailsType').textContent = event.type.charAt(0).toUpperCase() + event.type.slice(1);
        document.getElementById('detailsDescription').textContent = event.description || 'No description provided';

        modal.dataset.eventId = event.id;
        modal.classList.add('active');
    }

    hideDetailsModal() {
        document.getElementById('eventDetailsModal').classList.remove('active');
    }

    async saveEvent() {
        const form = document.getElementById('eventForm');
        const eventData = {
            title: form.elements.eventTitle.value,
            type: form.elements.eventType.value,
            date: new Date(`${form.elements.eventDate.value}T${form.elements.eventTime.value}`),
            duration: parseInt(form.elements.eventDuration.value),
            description: form.elements.eventDescription.value
        };

        if (form.dataset.eventId) {
            // Edit existing event
            eventData.id = parseInt(form.dataset.eventId);
            const index = this.events.findIndex(e => e.id === eventData.id);
            if (index !== -1) {
                this.events[index] = eventData;
            }
        } else {
            // Create new event
            eventData.id = Date.now();
            this.events.push(eventData);
        }

        this.hideEventModal();
        this.renderCalendar();
        this.renderUpcomingEvents();
    }

    async deleteEvent() {
        const modal = document.getElementById('eventDetailsModal');
        const eventId = parseInt(modal.dataset.eventId);
        
        this.events = this.events.filter(e => e.id !== eventId);
        this.hideDetailsModal();
        this.renderCalendar();
        this.renderUpcomingEvents();
    }

    editEvent() {
        const modal = document.getElementById('eventDetailsModal');
        const eventId = parseInt(modal.dataset.eventId);
        const event = this.events.find(e => e.id === eventId);
        
        if (event) {
            this.hideDetailsModal();
            this.showEventModal(event);
        }
    }

    navigateMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.renderCalendar();
    }

    changeView(view) {
        this.currentView = view;
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        this.renderCalendar();
    }

    getEventsForDate(date) {
        return this.events.filter(event => {
            return this.isSameDay(event.date, date) && this.filteredEventTypes.has(event.type);
        });
    }

    isToday(date) {
        const today = new Date();
        return this.isSameDay(date, today);
    }

    isSelectedDate(date) {
        return this.isSameDay(date, this.selectedDate);
    }

    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatDateTime(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (this.isSameDay(date, today)) {
            return `Today, ${this.formatTime(date)}`;
        } else if (this.isSameDay(date, tomorrow)) {
            return `Tomorrow, ${this.formatTime(date)}`;
        } else {
            return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${this.formatTime(date)}`;
        }
    }
}

// Initialize calendar manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.calendarManager = new CalendarManager();
}); 