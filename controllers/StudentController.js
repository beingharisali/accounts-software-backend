const Student = require("../models/Student"); // Apna Student model ka path check kar lein
const { StatusCodes } = require("http-status-codes");

// 1. Saare Students ka data hasil karna
const getAllStudents = async (req, res) => {
    const students = await Student.find({}).sort("-createdAt");
    res.status(StatusCodes.OK).json(students);
};

// 2. Bulk Add (Ek saath kaafi students save karna)
const bulkAddStudents = async (req, res) => {
    const studentsData = req.body;

    if (!Array.isArray(studentsData) || studentsData.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Student data missing or invalid" });
    }

    const students = await Student.insertMany(studentsData);
    res.status(StatusCodes.CREATED).json({ count: students.length });
};

// 3. Single Student Update
const updateStudent = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const student = await Student.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!student) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No student with id ${id}` });
    }

    res.status(StatusCodes.OK).json(student);
};

// 4. Student Delete
const deleteStudent = async (req, res) => {
    const { id } = req.params;

    const student = await Student.findByIdAndDelete(id);

    if (!student) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No student with id ${id}` });
    }

    res.status(StatusCodes.OK).json({ message: "Student deleted successfully" });
};

// ============================================================
// NEW: Daily Report (Fix for DD-MM-YYYY string format)
// ============================================================
const getDailyReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        const monthIndex = monthNames.indexOf(month) + 1;
        const formattedMonth = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;

        const report = await Student.aggregate([
            {
                // Regex use kar rahe hain taake "10-02-2026" mein se month aur year match ho sake
                $match: {
                    date: { $regex: `-${formattedMonth}-${year}$` }
                }
            },
            {
                $group: {
                    _id: null,
                    newAdmissions: { $sum: { $cond: [{ $eq: ["$status", "NEW"] }, 1, 0] } },
                    recoveryCount: { $sum: { $cond: [{ $eq: ["$status", "RECOVERY"] }, 1, 0] } },
                    drops: { $sum: { $cond: [{ $eq: ["$status", "DROP"] }, 1, 0] } },
                    totalCollection: { $sum: { $toDouble: "$feeReceived" } },
                    jazzCash: {
                        $sum: { $cond: [{ $eq: [{ $toLower: "$method" }, "jazzcash"] }, { $toDouble: "$feeReceived" }, 0] }
                    },
                    easyPaisa: {
                        $sum: { $cond: [{ $eq: [{ $toLower: "$method" }, "easypaisa"] }, { $toDouble: "$feeReceived" }, 0] }
                    },
                    bankTransfer: {
                        $sum: {
                            $cond: [
                                { $in: [{ $toLower: "$method" }, ["bank", "bank transfer"]] },
                                { $toDouble: "$feeReceived" }, 0
                            ]
                        }
                    },
                    cash: {
                        $sum: { $cond: [{ $eq: [{ $toLower: "$method" }, "cash"] }, { $toDouble: "$feeReceived" }, 0] }
                    }
                }
            }
        ]);

        const result = report.length > 0 ? report[0] : {
            newAdmissions: 0, recoveryCount: 0, drops: 0, totalCollection: 0,
            jazzCash: 0, easyPaisa: 0, bankTransfer: 0, cash: 0
        };

        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
};

// ============================================================
// NEW: Course Breakdown (Fix for DD-MM-YYYY string format)
// ============================================================
const getCourseBreakdown = async (req, res) => {
    try {
        const { month, year } = req.query;
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        const monthIndex = monthNames.indexOf(month) + 1;
        const formattedMonth = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;

        const breakdown = await Student.aggregate([
            {
                $match: {
                    date: { $regex: `-${formattedMonth}-${year}$` }
                }
            },
            {
                $group: {
                    _id: "$course",
                    count: { $sum: 1 },
                    revenue: { $sum: { $toDouble: "$feeReceived" } }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.status(StatusCodes.OK).json(breakdown);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
};

module.exports = {
    getAllStudents,
    bulkAddStudents,
    updateStudent,
    deleteStudent,
    getDailyReport,
    getCourseBreakdown
};