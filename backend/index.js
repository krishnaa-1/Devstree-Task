const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const cors = require('cors');

connectDB().catch(() => {
    if (require.main === module) {
        process.exit(1);
    }
});

const app = express();
app.use(express.json());

const envOrigins = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGINS,
]
    .filter(Boolean)
    .flatMap((origin) => origin.split(','))
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = [
    'http://localhost:5173',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ...envOrigins,
].filter(Boolean);

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api', availabilityRoutes);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
