const express = require('express');
const router = express.Router();

const {addPayment, markPaymentPaid, getStudentPendingPayments, getFinanceStats, searchStudents, getStudentAccount, recordPayment, previewSemesterBills, generateSemesterBills} = require('../controllers/financeController');

router.post('/payments/add', addPayment);  // Add new payment for a major
router.put('/payments/mark-paid', markPaymentPaid); // Mark a specific transaction as paid

router.get('/students/:student_id/payments/pending', getStudentPendingPayments);  // Get pending payments for a student

router.get('/stats', getFinanceStats); // Get finance statistics

router.get('/students/search', searchStudents);

router.get('/students/:student_id/account', getStudentAccount); 

router.post('/payments/record', recordPayment); 

router.post('/semesters/:id/preview-bills', previewSemesterBills);

router.post('/semesters/:id/generate-bills', generateSemesterBills);

module.exports = router;