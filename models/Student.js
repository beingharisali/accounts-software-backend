const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    date: {
        type: String,
        default: () => new Date().toISOString().split('T')[0] // Default aaj ki date
    },
    status: {
        type: String,
        enum: ['NEW', 'FULL PAID', 'RECOVERY', 'DROP', 'FREEZE'],
        default: 'NEW'
    },
    name: {
        type: String,
        required: [true, "Student name is required"],
        trim: true
    },
    course: { type: String, trim: true },
    batch: {
        type: String,
        index: true // Search optimize karne ke liye
    },
    number: { type: String, trim: true },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    address: { type: String },
    cnic: {
        type: String,
        required: [true, "CNIC is required"],
        index: true, // RECOVERY logic ke liye zaroori hai
        trim: true
    },
    totalPayment: { type: Number, default: 0 },
    feeReceived: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    firstInstalDueDate: { type: String },
    secondInstalDueDate: { type: String },
    thirdInstalDueDate: { type: String },
    method: { type: String },
    paymentId: { type: String },
    receiptId: { type: String },
    csrName: { type: String },
    officer: { type: String },
    branch: { type: String },
    lastPaidDate: { type: String }
}, {
    timestamps: true // createdAt aur updatedAt ke liye
});

// Virtual field to ensure frontend 'id' and backend '_id' are interchangeable
StudentSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

StudentSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Student', StudentSchema);