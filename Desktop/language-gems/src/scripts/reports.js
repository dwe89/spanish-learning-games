document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeReports();
});

async function initializeReports() {
    try {
        await Promise.all([
            loadClasses(),
            loadReports()
        ]);
        
        setupEventListeners();
        showSuccess('Reports loaded successfully');
    } catch (error) {
        console.error('Error initializing reports:', error);
        showError('Failed to load reports');
    }
}

async function loadClasses() {
    try {
        const classes = await window.teacherApiService.getClasses();
        const classSelect = document.getElementById('report-class');
        
        classes.forEach(classItem => {
            const option = document.createElement('option');
            option.value = classItem.id;
            option.textContent = classItem.name;
            classSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading classes:', error);
        showError('Failed to load classes');
    }
}

async function loadReports() {
    try {
        const typeFilter = document.getElementById('report-type-filter').value;
        const dateFilter = document.getElementById('date-filter').value;
        
        const reports = await window.teacherApiService.getReports(typeFilter, dateFilter);
        renderReportsList(reports);
    } catch (error) {
        console.error('Error loading reports:', error);
        showError('Failed to load reports');
    }
}

function renderReportsList(reports) {
    const reportsList = document.querySelector('.reports-list');
    
    if (reports.length === 0) {
        reportsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>No Reports Found</h3>
                <p>Generate a new report to get started</p>
            </div>
        `;
        return;
    }
    
    reportsList.innerHTML = reports.map(report => `
        <div class="report-item">
            <div class="report-info">
                <div class="report-header">
                    <h3>${report.title}</h3>
                    <span class="report-type ${report.type}">${report.type}</span>
                </div>
                <div class="report-meta">
                    <span><i class="fas fa-calendar"></i> Generated: ${formatDate(report.timestamp)}</span>
                    <span><i class="fas fa-users"></i> ${report.scope}</span>
                </div>
                <p class="report-description">${report.description}</p>
            </div>
            <div class="report-actions">
                <button onclick="viewReport('${report.id}')" class="action-button">
                    <i class="fas fa-eye"></i>
                    View
                </button>
                <button onclick="downloadReport('${report.id}')" class="action-button">
                    <i class="fas fa-download"></i>
                    Download
                </button>
                <button onclick="deleteReport('${report.id}')" class="action-button danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function generateReport(type = null) {
    const modal = document.getElementById('report-modal');
    
    if (type) {
        document.getElementById('report-type').value = type;
    }
    
    modal.style.display = 'block';
}

function closeReportModal() {
    const modal = document.getElementById('report-modal');
    modal.style.display = 'none';
    document.getElementById('report-form').reset();
    document.getElementById('custom-date-range').style.display = 'none';
}

async function submitReport(event) {
    event.preventDefault();
    
    const form = event.target;
    const reportData = {
        type: form['report-type'].value,
        classId: form['report-class'].value,
        timeframe: form['report-timeframe'].value,
        startDate: form['start-date']?.value,
        endDate: form['end-date']?.value,
        sections: Array.from(form.sections)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value)
    };
    
    try {
        showLoading('Generating report...');
        const report = await window.teacherApiService.generateReport(reportData);
        
        closeReportModal();
        showSuccess('Report generated successfully');
        
        // Refresh reports list
        loadReports();
        
        // Open the new report
        viewReport(report.id);
    } catch (error) {
        console.error('Error generating report:', error);
        showError('Failed to generate report');
    } finally {
        hideLoading();
    }
}

async function viewReport(reportId) {
    try {
        const report = await window.teacherApiService.getReportDetails(reportId);
        window.open(report.viewUrl, '_blank');
    } catch (error) {
        console.error('Error viewing report:', error);
        showError('Failed to open report');
    }
}

async function downloadReport(reportId) {
    try {
        const report = await window.teacherApiService.getReportDownloadUrl(reportId);
        window.location.href = report.downloadUrl;
    } catch (error) {
        console.error('Error downloading report:', error);
        showError('Failed to download report');
    }
}

async function deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report?')) {
        return;
    }
    
    try {
        await window.teacherApiService.deleteReport(reportId);
        showSuccess('Report deleted successfully');
        loadReports();
    } catch (error) {
        console.error('Error deleting report:', error);
        showError('Failed to delete report');
    }
}

function setupEventListeners() {
    // Report type filter change
    document.getElementById('report-type-filter').addEventListener('change', loadReports);
    
    // Date filter change
    document.getElementById('date-filter').addEventListener('change', loadReports);
    
    // Custom date range toggle
    document.getElementById('report-timeframe').addEventListener('change', (e) => {
        const customDateRange = document.getElementById('custom-date-range');
        customDateRange.style.display = e.target.value === 'custom' ? 'block' : 'none';
        
        if (e.target.value === 'custom') {
            document.getElementById('start-date').required = true;
            document.getElementById('end-date').required = true;
        } else {
            document.getElementById('start-date').required = false;
            document.getElementById('end-date').required = false;
        }
    });
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function showLoading(message) {
    // Implementation depends on your loading indicator system
    console.log('Loading:', message);
}

function hideLoading() {
    // Implementation depends on your loading indicator system
    console.log('Loading complete');
}

function showSuccess(message) {
    // Implementation depends on your toast/notification system
    console.log('Success:', message);
}

function showError(message) {
    // Implementation depends on your toast/notification system
    console.error('Error:', message);
} 