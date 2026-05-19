const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const  login = async (req, res) => {
  const { id, password } = req.body;

  
  const query = `
        SELECT 
        u.id, u.name, u.role, u.dob, u.password, u.email, u.phone, u.status,
        s.enrollment_date, s.completed_credits, s.gpa, s.campus,
        m.name AS major_name,
        m.total_credits_required AS total_credits,
        i.department,
        d.name AS department_name
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN majors m ON s.major_id = m.id
    LEFT JOIN instructors i ON u.id = i.user_id
    LEFT JOIN departments d ON i.department = d.id
    WHERE u.id = ?
  `;

  db.query(query, [id], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (results.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }
    
    const user = results[0];

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Account is deactivated. Please contact the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    try {

      console.log('JWT_SECRET:', process.env.JWT_SECRET);
      
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const responseData = {
      id: user.id,
      name: user.name,
      role: user.role,
      dob: user.dob
    };

    if (user.role === 'student') {
      responseData.email = user.email;
      responseData.phone = user.phone;
      responseData.campus = user.campus
      responseData.enrollment_date = user.enrollment_date;
      responseData.completed_credits = user.completed_credits;
      responseData.gpa = user.gpa;
      responseData.major = user.major_name;
      responseData.total_credits = user.total_credits;
    } else if (user.role === 'instructor') {
      responseData.department = user.department_name;
      responseData.email = user.email;
      responseData.phone = user.phone;
    } else if (user.role === 'finance_officer') {
      responseData.email = user.email;
      responseData.phone = user.phone;
      responseData.office_location = user.office_location;
    }

    res.json({ message: "Login successful", token,  user: responseData });

  } catch (error) {
      console.error("JWT Error:", error); // This will tell you EXACTLY what is wrong
      return res.status(500).json({ message: "Token generation failed" });
  }
  });
};


module.exports = { login };