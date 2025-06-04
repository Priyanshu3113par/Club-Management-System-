// Constants
const API_BASE_URL = 'http://localhost:3000';
const ENDPOINTS = {
    GET_EVENTS: '/api/get-events',
    UPDATE_STATUS: '/api/update-status',
    UPDATE_CSV: '/api/update-csv'
};

// DOM Elements
const eventForm = document.getElementById('eventForm');
const eventsTableBody = document.getElementById('eventsTableBody');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorAlert = document.getElementById('errorAlert');
const successAlert = document.getElementById('successAlert');

// Utility Functions
function showLoading() {
    if (loadingSpinner) loadingSpinner.style.display = 'block';
}

function hideLoading() {
    if (loadingSpinner) loadingSpinner.style.display = 'none';
}

function showError(message) {
    if (errorAlert) {
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    if (successAlert) {
        successAlert.textContent = message;
        successAlert.style.display = 'block';
        setTimeout(() => {
            successAlert.style.display = 'none';
        }, 5000);
    }
}

// API Functions
async function fetchEvents() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.GET_EVENTS}`);
        if (!response.ok) throw new Error('Failed to fetch events');
        const events = await response.json();
        return events;
    } catch (error) {
        console.error('Error fetching events:', error);
        showError('Failed to load events. Please try again.');
        return [];
    } finally {
        hideLoading();
    }
}

async function updateEventStatus(clubName, eventTitle, status) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.UPDATE_STATUS}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clubName, eventTitle, status })
        });

        if (!response.ok) throw new Error('Failed to update status');
        
        const result = await response.json();
        if (result.success) {
            showSuccess('Status updated successfully');
            return true;
        } else {
            throw new Error(result.error || 'Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showError(error.message || 'Failed to update status');
        return false;
    } finally {
        hideLoading();
    }
}

async function submitEvent(eventData) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.UPDATE_CSV}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) throw new Error('Failed to submit event');
        
        const result = await response.json();
        if (result.success) {
            showSuccess('Event submitted successfully');
            return true;
        } else {
            throw new Error(result.error || 'Failed to submit event');
        }
    } catch (error) {
        console.error('Error submitting event:', error);
        showError(error.message || 'Failed to submit event');
        return false;
    } finally {
        hideLoading();
    }
}

// UI Functions
function createStatusButton(event) {
    const button = document.createElement('button');
    button.textContent = event.Status || 'Pending';
    button.className = `btn btn-sm ${getStatusButtonClass(event.Status)}`;
    
    if (event.Status !== 'Approved' && event.Status !== 'Rejected') {
        button.onclick = async () => {
            const newStatus = event.Status === 'Pending' ? 'Approved' : 'Pending';
            const success = await updateEventStatus(event['Club Name'], event['Event Title'], newStatus);
            if (success) {
                event.Status = newStatus;
                button.textContent = newStatus;
                button.className = `btn btn-sm ${getStatusButtonClass(newStatus)}`;
                refreshEventsTable();
            }
        };
    }
    
    return button;
}

function getStatusButtonClass(status) {
    switch (status) {
        case 'Approved': return 'btn-success';
        case 'Rejected': return 'btn-danger';
        default: return 'btn-warning';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'Approved': return 'status-approved';
        case 'Rejected': return 'status-rejected';
        default: return 'status-pending';
    }
}

async function refreshEventsTable() {
    const events = await fetchEvents();
    if (!events || !Array.isArray(events)) return;

    if (eventsTableBody) {
        eventsTableBody.innerHTML = '';
        events.forEach((event, index) => {
            const row = eventsTableBody.insertRow();
            const status = event.Status || 'Pending';
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${event['Club Name'] || ''}</td>
                <td>${event['Event Title'] || ''}</td>
                <td>${event['Event Description'] || ''}</td>
                <td>${formatDate(event['Event Date'])}</td>
                <td>${event['Event Time'] || ''}</td>
                <td>${event['Classroom/Venue'] || ''}</td>
                <td>${event['Estimated Funds'] || ''}</td>
                <td>${event['Purpose of Event'] || ''}</td>
                <td>${formatDate(event['Submission Date'])}</td>
                <td><span class="${getStatusClass(status)}">${status}</span></td>
            `;
        });
    }
}

// Event Listeners
if (eventForm) {
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            clubName: document.getElementById('clubName').value,
            eventTitle: document.getElementById('eventTitle').value,
            eventDescription: document.getElementById('eventDescription').value,
            eventDate: document.getElementById('eventDate').value,
            eventTime: document.getElementById('eventTime').value,
            eventClassroom: document.getElementById('eventClassroom').value,
            eventFunds: document.getElementById('eventFunds').value,
            eventPurpose: document.getElementById('eventPurpose').value,
            submissionDate: new Date().toISOString().split('T')[0]
        };

        const success = await submitEvent(formData);
        if (success) {
            eventForm.reset();
            refreshEventsTable();
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    refreshEventsTable();
}); 