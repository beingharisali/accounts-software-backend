const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// 1. Bulk Add & Recovery Logic
router.post('/bulk-add', async (req, res) => {
    try {
        const studentsData = req.body;
        const processedResults = [];

        // Check if data is an array
        if (!Array.isArray(studentsData)) {
            return res.status(400).json({
                success: false,
                message: "Data format invalid. Array expected."
            });
        }

        for (const data of studentsData) {
            // Logic: Agar status RECOVERY hai toh CNIC aur BATCH match karke update karo
            if (data.status === 'RECOVERY') {
                const existingStudent = await Student.findOneAndUpdate(
                    {
                        cnic: data.cnic,
                        batch: data.batch
                    },
                    {
                        $inc: { feeReceived: Number(data.feeReceived) || 0 }, // Purani fee mein add karo
                        $set: {
                            pending: Number(data.pending) || 0,
                            // Agar pending 0 ya usse kam hai toh FULL PAID, warna RECOVERY
                            status: (Number(data.pending) || 0) <= 0 ? 'FULL PAID' : 'RECOVERY',
                            method: data.method,
                            paymentId: data.paymentId,
                            receiptId: data.receiptId,
                            lastPaidDate: new Date().toISOString().split('T')[0]
                        }
                    },
                    { new: true, runValidators: true }
                );

                if (existingStudent) {
                    processedResults.push(existingStudent);
                } else {
                    // Agar RECOVERY entry hai par student nahi mila, toh as a new record create kar do
                    const newStudent = await Student.create(data);
                    processedResults.push(newStudent);
                }
            } else {
                // Agar status NEW, DROP, etc hai toh simple entry create karo
                const newStudent = await Student.create(data);
                processedResults.push(newStudent);
            }
        }

        res.status(201).json({
            success: true,
            message: `${processedResults.length} entries processed successfully`,
            count: processedResults.length
        });

    } catch (error) {
        console.error("Bulk Add Error:", error);
        res.status(400).json({
            success: false,
            message: error.code === 11000 ? "Duplicate Entry: CNIC already exists in this batch" : "Database error",
            error: error.message
        });
    }
});

// 2. Get All Students (Latest entries first)
router.get('/all', async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not fetch students",
            error: error.message
        });
    }
});

// 3. Update Single Student (Admin Edit)
router.put('/update/:id', async (req, res) => {
    try {
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedStudent) {
            return res.status(404).json({ success: false, message: "Student record not found" });
        }

        res.status(200).json(updatedStudent);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// 4. Delete Student
router.delete('/delete/:id', async (req, res) => {
    try {
        const deleted = await Student.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Student record not found" });
        }
        res.status(200).json({ success: true, message: "Student entry deleted successfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;