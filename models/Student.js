const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    date: { type: String },
    status: {
        type: String,
        enum: ['NEW', 'FULL PAID', 'RECOVERY', 'DROP', 'FREEZE'],
        default: 'NEW'
    },
    name: { type: String, required: true },
    course: { type: String },
    batch: { type: String },
    number: { type: String },
    email: { type: String },
    address: { type: String },
    cnic: { type: String, required: true },
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
    timestamps: true // Ye automatically createdAt aur updatedAt fields bana dega
});

module.exports = mongoose.model('Student', StudentSchema);