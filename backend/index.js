const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const cors = require('cors');

connectDB();

const app = express();
app.use(express.json());

// CORS configuration
const corsOptions = {
    origin: 'http://localhost:5173',  // Frontend URL
    credentials: true,                // Allow cookies and headers like Authorization
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.use('/api/auth', authRoutes);
app.use('/api', availabilityRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
