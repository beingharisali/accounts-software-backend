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

    // Yahan aap validation logic bhi laga sakte hain (e.g. CNIC check)
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

module.exports = {
    getAllStudents,
    bulkAddStudents,
    updateStudent,
    deleteStudent,
};