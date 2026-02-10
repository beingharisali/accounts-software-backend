const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Helper function to get today's date in DD-MM-YYYY format
const getTodayString = () => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
};

// ==========================================
// 1. DASHBOARD STATS (Main Cards on Home)
// ==========================================
router.get('/stats', async (req, res) => {
    try {
        const todayStr = getTodayString();

        const stats = await Student.aggregate([
            {
                $facet: {
                    totals: [
                        {
                            $group: {
                                _id: null,
                                totalStudents: { $sum: 1 },
                                totalReceived: { $sum: { $toDouble: "$feeReceived" } },
                                totalPending: { $sum: { $toDouble: "$pending" } }
                            }
                        }
                    ],
                    statusWise: [
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ],
                    todayCollection: [
                        { $match: { date: todayStr } },
                        { $group: { _id: null, amount: { $sum: { $toDouble: "$feeReceived" } } } }
                    ]
                }
            }
        ]);

        const data = {
            totalStudents: stats[0].totals[0]?.totalStudents || 0,
            totalReceived: stats[0].totals[0]?.totalReceived || 0,
            totalPending: stats[0].totals[0]?.totalPending || 0,
            todayCollection: stats[0].todayCollection[0]?.amount || 0,
            recoveryCount: stats[0].statusWise.find(s => s._id === 'RECOVERY')?.count || 0,
            fullPaidCount: stats[0].statusWise.find(s => s._id === 'FULL PAID')?.count || 0,
        };

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// 2. DAILY REPORT (Cards & Breakdown Sync)
// ==========================================
router.get('/daily-report', async (req, res) => {
    try {
        const { month, year } = req.query;
        const monthMap = {
            "January": "01", "February": "02", "March": "03", "April": "04",
            "May": "05", "June": "06", "July": "07", "August": "08",
            "September": "09", "October": "10", "November": "11", "December": "12"
        };

        const targetMonth = monthMap[month];
        if (!targetMonth) return res.status(400).json({ message: "Invalid Month" });

        // Regex to match "-MM-YYYY" at the end of your string date "10-02-2026"
        const dateRegex = `-${targetMonth}-${year}$`;

        const report = await Student.aggregate([
            { $match: { date: { $regex: dateRegex } } },
            {
                $facet: {
                    mainStats: [
                        {
                            $group: {
                                _id: null,
                                newAdmissions: { $sum: { $cond: [{ $eq: ["$status", "NEW"] }, 1, 0] } },
                                recoveryCount: { $sum: { $cond: [{ $eq: ["$status", "RECOVERY"] }, 1, 0] } },
                                drops: { $sum: { $cond: [{ $eq: ["$status", "DROP"] }, 1, 0] } },
                                totalCollection: { $sum: { $toDouble: "$feeReceived" } }
                            }
                        }
                    ],
                    methodWise: [
                        { $group: { _id: { $toLower: "$method" }, total: { $sum: { $toDouble: "$feeReceived" } } } }
                    ]
                }
            }
        ]);

        const stats = report[0].mainStats[0] || {};
        const methods = report[0].methodWise || [];

        res.status(200).json({
            newAdmissions: stats.newAdmissions || 0,
            recoveryCount: stats.recoveryCount || 0,
            drops: stats.drops || 0,
            totalCollection: stats.totalCollection || 0,
            jazzCash: methods.find(m => m._id === 'jazzcash')?.total || 0,
            easyPaisa: methods.find(m => m._id === 'easypaisa')?.total || 0,
            bankTransfer: methods.find(m => m._id === 'bank transfer' || m._id === 'bank')?.total || 0,
            cash: methods.find(m => m._id === 'cash')?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// 3. COURSE BREAKDOWN (Fix for Course Analysis)
// ==========================================
router.get('/course-breakdown', async (req, res) => {
    try {
        const { course, month, year } = req.query;
        let matchQuery = {};

        if (course && course !== 'All') {
            matchQuery.course = course;
        }

        if (month && year) {
            const monthMap = { "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06", "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12" };
            matchQuery.date = { $regex: `-${monthMap[month]}-${year}$` };
        }

        const breakdown = await Student.aggregate([
            { $match: matchQuery },
            {
                $facet: {
                    stats: [
                        {
                            $group: {
                                _id: null,
                                totalStudents: { $sum: 1 },
                                fullPaidCount: { $sum: { $cond: [{ $eq: ["$status", "FULL PAID"] }, 1, 0] } },
                                revenue: { $sum: { $toDouble: "$feeReceived" } },
                                pending: { $sum: { $toDouble: "$pending" } }
                            }
                        }
                    ],
                    statusCounts: [
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ]
                }
            }
        ]);

        const result = {
            totalStudents: breakdown[0].stats[0]?.totalStudents || 0,
            fullPaid: breakdown[0].stats[0]?.fullPaidCount || 0,
            revenue: breakdown[0].stats[0]?.revenue || 0,
            pending: breakdown[0].stats[0]?.pending || 0,
            newCount: breakdown[0].statusCounts.find(s => s._id === 'NEW')?.count || 0,
            recoveryCount: breakdown[0].statusCounts.find(s => s._id === 'RECOVERY')?.count || 0,
            dropCount: breakdown[0].statusCounts.find(s => s._id === 'DROP')?.count || 0,
            freezeCount: breakdown[0].statusCounts.find(s => s._id === 'FREEZE')?.count || 0,
            fullPaidStatusCount: breakdown[0].statusCounts.find(s => s._id === 'FULL PAID')?.count || 0,
        };

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// 4. GET ALL STUDENTS (Search & Table Filter)
// ==========================================
router.get('/all', async (req, res) => {
    try {
        const { search, status, batch } = req.query;
        let queryObject = {};

        if (search) {
            queryObject.$or = [
                { name: { $regex: search, $options: 'i' } },
                { cnic: { $regex: search, $options: 'i' } },
                { number: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'All') queryObject.status = status;
        if (batch && batch !== 'All') queryObject.batch = batch;

        const students = await Student.find(queryObject).sort({ createdAt: -1 });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// 5. BULK ADD & RECOVERY (Excel Upload Logic)
// ==========================================
router.post('/bulk-add', async (req, res) => {
    try {
        const studentsData = req.body;
        const processedResults = [];
        const todayStr = getTodayString();

        if (!Array.isArray(studentsData)) {
            return res.status(400).json({ success: false, message: "Data format invalid. Array expected." });
        }

        for (const data of studentsData) {
            if (data.status === 'RECOVERY') {
                const existingStudent = await Student.findOneAndUpdate(
                    { cnic: data.cnic, batch: data.batch },
                    {
                        $inc: { feeReceived: Number(data.feeReceived) || 0 },
                        $set: {
                            pending: Number(data.pending) || 0,
                            status: (Number(data.pending) || 0) <= 0 ? 'FULL PAID' : 'RECOVERY',
                            method: data.method,
                            paymentId: data.paymentId,
                            receiptId: data.receiptId,
                            date: todayStr // Updating your custom date field
                        }
                    },
                    { new: true, runValidators: true }
                );

                if (existingStudent) {
                    processedResults.push(existingStudent);
                } else {
                    processedResults.push(await Student.create(data));
                }
            } else {
                processedResults.push(await Student.create(data));
            }
        }
        res.status(201).json({ success: true, count: processedResults.length });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ==========================================
// 6. UPDATE SINGLE STUDENT (Admin Edit)
// ==========================================
router.put('/update/:id', async (req, res) => {
    try {
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!updatedStudent) return res.status(404).json({ success: false, message: "Not found" });
        res.status(200).json(updatedStudent);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ==========================================
// 7. DELETE STUDENT
// ==========================================
router.delete('/delete/:id', async (req, res) => {
    try {
        const deleted = await Student.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Not found" });
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;