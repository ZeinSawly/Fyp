require('dotenv').config();
const express = require('express');
const cors = require('cors'); 
const { verifyToken } = require('./middlewares/authMiddleware');

const authRoutes = require('./routes/authenticationRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const quizRoutes = require('./routes/quizRoutes');
const financeRoutes = require('./routes/financeRoutes');
const commonRoutes = require('./routes/commonRoutes');



const app = express();

app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

app.use(express.json());

app.use('/api', authRoutes);

app.use('/api/common', verifyToken, commonRoutes);

app.use('/api/students', verifyToken, studentRoutes);

app.use('/api/admin', verifyToken, adminRoutes);

app.use('/api/instructors', verifyToken, instructorRoutes);

app.use('/api/quiz', verifyToken, quizRoutes);

app.use('/api/finance', verifyToken, financeRoutes);


app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});