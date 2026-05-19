const jwt = require('jsonwebtoken');
const db = require('../config/db');


const verifyToken = async (req, res, next) => {
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({message: 'Access denied. No token provided'});
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user is still active in DB
        const [rows] = await db.promise().query(
            `SELECT id, role, status FROM users WHERE id = ?`,
            [decoded.id]
        );
    
        if (rows.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }
    
        req.user = decoded
        next();
    }catch (err){
        console.log('JWT Error:', err.message);
        return res.status(403).json({message: 'Invalid or expired token'});
    }
};

module.exports = {verifyToken};