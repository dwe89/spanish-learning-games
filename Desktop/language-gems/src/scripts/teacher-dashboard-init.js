import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { TeacherDashboard } from '../components/Dashboard/teacher-dashboard-consolidated.js";

document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new TeacherDashboard();
});