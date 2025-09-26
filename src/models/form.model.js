const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    dateOfUpload: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: String,
      // required: true,
      trim: true,
    },
    firstName: {
      type: String,
      // required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      // required: true,
      trim: true,
    },
    contactNo: {
      type: String,
      // required: true,
      trim: true,
    },
    alternateContactNo: {
      type: String,
      trim: true,
    },
    mailId: {
      type: String,
      // required: true,
      lowercase: true,
      trim: true,
    },
    alternateMailId: {
      type: String,
      lowercase: true,
      trim: true,
    },
    fatherName: {
      type: String,
      // required: true,
      trim: true,
    },
    panNo: {
      type: String,
      // required: true,
      uppercase: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      // required: true
    },
    gender: {
      type: String,
      // required: true,
      enum: ["Male", "Female", "Other"],
    },
    currentState: {
      type: String,
      // required: true,
      trim: true,
    },
    currentCity: {
      type: String,
      // required: true,
      trim: true,
    },
    preferredState: {
      type: String,
      // required: true,
      trim: true,
    },
    preferredCity: {
      type: String,
      // required: true,
      trim: true,
    },
    currentEmployer: {
      type: String,
      // required: true,
      trim: true,
    },
    designation: {
      type: String,
      // required: true,
      trim: true,
    },
    department: {
      type: String,
      // required: true,
      trim: true,
    },
    ctcInLakhs: {
      type: Number,
      // required: true,
      min: 0,
      // CTC in lakhs
    },
    totalExperience: {
      type: Number,
      // required: true,
      min: 0,
      // Total years of experience
    },
    pdfFile: {
      data: Buffer, // store actual file bytes
      originalName: String, // original file name
      mimetype: String, // content type
      size: Number, // file size in bytes
    },
    comments: [
      {
        text: String,
        addedBy: String,
        date: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserForm", userSchema);
