const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const cors = require('cors');

// Enable CORS for all routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Create CSV file if it doesn't exist
const csvPath = path.join(__dirname, 'event_requests.csv');
if (!fs.existsSync(csvPath)) {
    const headers = 'Club Name,Event Title,Event Description,Event Date,Event Time,Classroom/Venue,Estimated Funds,Purpose of Event,Submission Date,Status\n';
    fs.writeFileSync(csvPath, headers);
}

// Function to read CSV file and parse data
function readCSVFile() {
    try {
        const fileContent = fs.readFileSync(csvPath, 'utf8');
        const rows = fileContent.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',').map(h => h.trim());
        return {
            headers,
            data: rows.slice(1).map(row => {
                const values = row.split(',').map(val => val.replace(/^"|"$/g, '').trim());
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index] || '';
                    return obj;
                }, {});
            })
        };
    } catch (error) {
        console.error('Error reading CSV:', error);
        throw error;
    }
}

// Function to write data back to CSV
function writeCSVFile(headers, data) {
    try {
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => 
                    `"${(row[header] || '').replace(/"/g, '""')}"`
                ).join(',')
            )
        ].join('\n');
        fs.writeFileSync(csvPath, csvContent);
    } catch (error) {
        console.error('Error writing CSV:', error);
        throw error;
    }
}

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Endpoint to get all events
app.get('/api/get-events', (req, res) => {
    try {
        const { data } = readCSVFile();
        res.json(data);
    } catch (error) {
        console.error('Error reading events:', error);
        res.status(500).json({ error: 'Failed to read events' });
    }
});

// Endpoint to update event status
app.post('/api/update-status', (req, res) => {
    try {
        console.log('Received status update request:', req.body);
        const { clubName, eventTitle, status } = req.body;

        if (!clubName || !eventTitle || !status) {
            throw new Error('Missing required fields');
        }

        const { headers, data } = readCSVFile();
        
        // Find and update the event
        const eventIndex = data.findIndex(event => 
            event['Club Name'].trim() === clubName.trim() && 
            event['Event Title'].trim() === eventTitle.trim()
        );

        if (eventIndex === -1) {
            throw new Error('Event not found');
        }

        // Update status
        data[eventIndex].Status = status;
        
        // Write back to CSV
        writeCSVFile(headers, data);

        res.json({ 
            success: true, 
            message: 'Status updated successfully',
            data: data[eventIndex]
        });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to update status' 
        });
    }
});

// Endpoint to append new event
app.post('/api/update-csv', (req, res) => {
    try {
        const data = req.body;
        console.log('Received new event:', data);

        // Validate required fields
        const requiredFields = ['clubName', 'eventTitle', 'eventDescription', 'eventDate', 
                              'eventTime', 'eventClassroom', 'eventFunds', 'eventPurpose'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Create CSV row with status
        const csvRow = [
            `"${data.clubName.replace(/"/g, '""')}"`,
            `"${data.eventTitle.replace(/"/g, '""')}"`,
            `"${data.eventDescription.replace(/"/g, '""')}"`,
            `"${data.eventDate}"`,
            `"${data.eventTime}"`,
            `"${data.eventClassroom.replace(/"/g, '""')}"`,
            `"${data.eventFunds}"`,
            `"${data.eventPurpose.replace(/"/g, '""')}"`,
            `"${data.submissionDate}"`,
            `"Pending"`
        ].join(',');

        // Append to CSV file
        fs.appendFileSync(csvPath, '\n' + csvRow);

        res.json({ 
            success: true, 
            message: 'Event added successfully',
            data: {...data, status: 'Pending'}
        });
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to add event' 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CSV file path: ${csvPath}`);
}); 