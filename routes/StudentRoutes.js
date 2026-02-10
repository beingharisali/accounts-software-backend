const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// 1. Bulk Add & Recovery Logic
router.post('/bulk-add', async (req, res) => {
    try {
        const studentsData = req.body;
        const processedResults = [];

        for (const data of studentsData) {
            // Agar status RECOVERY hai toh update logic chalega
            if (data.status === 'RECOVERY') {
                const existingStudent = await Student.findOneAndUpdate(
                    {
                        cnic: data.cnic,
                        batch: data.batch
                    },
                    {
                        $inc: { feeReceived: Number(data.feeReceived) }, // Fee plus kar do
                        $set: {
                            // Pending automatically update karne ke liye total - (purani fee + nayi fee)
                            // Lekin asaan hal ye hai ke frontend se aayi hui pending value set kar dein
                            pending: Number(data.pending),
                            status: Number(data.pending) <= 0 ? 'FULL PAID' : 'RECOVERY',
                            method: data.method,
                            paymentId: data.paymentId,
                            receiptId: data.receiptId,
                            lastPaidDate: new Date().toISOString().split('T')[0]
                        }
                    },
                    { new: true } // Updated data wapis lo
                );

                if (existingStudent) {
                    processedResults.push(existingStudent);
                } else {
                    // Agar RECOVERY entry hai par student nahi mila, toh naya bana do
                    const newStudent = await Student.create(data);
                    processedResults.push(newStudent);
                }
            } else {
                // Agar status NEW, DROP, ya kuch aur hai toh simple create karo
                const newStudent = await Student.create(data);
                processedResults.push(newStudent);
            }
        }

        res.status(201).json({
            success: true,
            message: "Entries processed successfully",
            count: processedResults.length
        });

    } catch (error) {
        console.error("Bulk Add Error:", error);
        res.status(400).json({
            success: false,
            message: "Database error",
            error: error.message
        });
    }
});

// 2. Get All Students (Context ki fetchStudents ke liye)
router.get('/all', async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Update Single Student
router.put('/update/:id', async (req, res) => {
    try {
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.status(200).json(updatedStudent);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// 4. Delete Student
router.delete('/delete/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Student deleted" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;