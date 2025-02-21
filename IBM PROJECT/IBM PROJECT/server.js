require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// IBM Watson Credentials (Replace with your actual credentials)
const API_KEY = process.env.API_KEY;
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL;

// Function to get IBM IAM Token
async function getIAMToken() {
    try {
        const response = await axios.post(
            'https://iam.cloud.ibm.com/identity/token',
            new URLSearchParams({
                grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
                apikey: API_KEY,
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error obtaining IAM token:', error);
        return null;
    }
}

// API Route for Prediction
app.post('/predict', async (req, res) => {
    const { MonthlyCharges, SeniorCitizen, tenure, TotalCharges } = req.body;

    if (MonthlyCharges === undefined || SeniorCitizen === undefined || tenure === undefined || TotalCharges === undefined) {
        return res.status(400).json({ error: 'Missing input fields' });
    }

    const iamToken = await getIAMToken();
    if (!iamToken) {
        return res.status(401).json({ error: 'Failed to obtain access token' });
    }

    const payload = {
        input_data: [
            {
                fields: ["MonthlyCharges", "SeniorCitizen", "tenure", "TotalCharges"],
                values: [[MonthlyCharges, SeniorCitizen, tenure, TotalCharges]],
            },
        ],
    };

    try {
        const response = await axios.post(DEPLOYMENT_URL, payload, {
            headers: {
                Authorization: `Bearer ${iamToken}`,
                'Content-Type': 'application/json',
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error during prediction:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Prediction failed' });
    }
});

// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


app.get('/dashboard', async (req, res) => {
    try {
        const dashboardData = {
            total_customers: 5000,
            churn_rate: 12.5,  // Example: % of customers leaving
            total_revenue: 1200000  // Example: Total earnings
        };
        res.json(dashboardData);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});
