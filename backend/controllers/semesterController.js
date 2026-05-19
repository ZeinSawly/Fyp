const db = require('../config/db');

// Get all semesters
const getSemesters = async (req, res) => {
    try {
        const [semesters] = await db.promise().query(
            `SELECT * FROM semesters ORDER BY academic_year DESC, 
             FIELD(term, 'Fall', 'Spring', 'Summer')`
        );
        return res.status(200).json({ success: true, data: semesters });
    } catch (error) {
        console.error('Get semesters error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// Get current semester
const getCurrentSemester = async (req, res) => {
    try {
        const [semesters] = await db.promise().query(
            `SELECT * FROM semesters WHERE is_current = TRUE LIMIT 1`
        );
        if (semesters.length === 0) {
            return res.status(200).json({ success: true, data: null, message: 'No current semester set' });
        }
        return res.status(200).json({ success: true, data: semesters[0] });
    } catch (error) {
        console.error('Get current semester error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create new semester
const createSemester = async (req, res) => {
    const { name, code, academic_year, term, start_date, end_date, 
            enrollment_start_date, enrollment_end_date, is_active } = req.body;
    
    if (!name || !code || !academic_year || !term || !start_date || !end_date) {
        return res.status(400).json({ 
            success: false,
            message: 'Missing required fields: name, code, academic_year, term, start_date, end_date' 
        });
    }
    
    try {
        // Check if code already exists
        const [existing] = await db.promise().query(
            `SELECT id FROM semesters WHERE code = ?`, [code]
        );
        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Semester code already exists' 
            });
        }
        
        const [result] = await db.promise().query(
            `INSERT INTO semesters (name, code, academic_year, term, start_date, end_date, 
             enrollment_start_date, enrollment_end_date, is_active, is_current)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
            [name, code, academic_year, term, start_date, end_date, 
             enrollment_start_date || null, enrollment_end_date || null, 
             is_active !== undefined ? is_active : true]
        );
        
        return res.status(201).json({ 
            success: true,
            message: 'Semester created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create semester error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error: ' + error.message 
        });
    }
};

// Update semester
const updateSemester = async (req, res) => {
    const { id } = req.params;
    const { name, academic_year, term, start_date, end_date, 
            enrollment_start_date, enrollment_end_date, is_active } = req.body;
    
    if (!name || !academic_year || !term || !start_date || !end_date) {
        return res.status(400).json({ 
            success: false,
            message: 'Missing required fields' 
        });
    }
    
    try {
        const [result] = await db.promise().query(
            `UPDATE semesters 
             SET name = ?, academic_year = ?, term = ?, start_date = ?, end_date = ?,
                 enrollment_start_date = ?, enrollment_end_date = ?, is_active = ?
             WHERE id = ?`,
            [name, academic_year, term, start_date, end_date, 
             enrollment_start_date || null, enrollment_end_date || null, 
             is_active !== undefined ? is_active : true, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Semester not found' 
            });
        }
        
        return res.status(200).json({ 
            success: true,
            message: 'Semester updated successfully' 
        });
    } catch (error) {
        console.error('Update semester error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error: ' + error.message 
        });
    }
};

// Set current semester (only one can be current)
const setCurrentSemester = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Check if semester exists
        const [semester] = await db.promise().query(
            `SELECT id FROM semesters WHERE id = ?`, [id]
        );
        if (semester.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Semester not found' 
            });
        }
        
        // Remove current flag from all semesters
        await db.promise().query(
            `UPDATE semesters SET is_current = FALSE WHERE is_current = TRUE`
        );
        
        // Set the new current semester
        await db.promise().query(
            `UPDATE semesters SET is_current = TRUE WHERE id = ?`, [id]
        );
        
        return res.status(200).json({ 
            success: true,
            message: 'Current semester updated successfully' 
        });
    } catch (error) {
        console.error('Set current semester error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error: ' + error.message 
        });
    }
};

// Delete semester
const deleteSemester = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Check if semester is current
        const [semester] = await db.promise().query(
            `SELECT is_current FROM semesters WHERE id = ?`, [id]
        );
        if (semester.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Semester not found' 
            });
        }
        
        if (semester[0].is_current) {
            return res.status(400).json({ 
                success: false,
                message: 'Cannot delete the current semester. Set another semester as current first.' 
            });
        }
        
        // Check if any sections use this semester
        const [sections] = await db.promise().query(
            `SELECT id FROM course_sections WHERE semester_id = ? LIMIT 1`, [id]
        );
        if (sections.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Cannot delete semester with existing course sections' 
            });
        }
        
        await db.promise().query(`DELETE FROM semesters WHERE id = ?`, [id]);
        
        return res.status(200).json({ 
            success: true,
            message: 'Semester deleted successfully' 
        });
    } catch (error) {
        console.error('Delete semester error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error: ' + error.message 
        });
    }
};

module.exports = {
    getSemesters,
    getCurrentSemester,
    createSemester,
    updateSemester,
    setCurrentSemester,
    deleteSemester
};