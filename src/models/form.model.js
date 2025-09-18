const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  dateOfUpload: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: String,
   // required: true,
    trim: true
  },
  firstName: {
    type: String,
   // required: true,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
   // required: true,
    trim: true
  },
  contactNo: {
    type: String,
   // required: true,
    trim: true
  },
  alternateContactNo: {
    type: String,
    trim: true
  },
  mailId: {
    type: String,
   // required: true,
    lowercase: true,
    trim: true
  },
  alternateMailId: {
    type: String,
    lowercase: true,
    trim: true
  },
  fatherName: {
    type: String,
   // required: true,
    trim: true
  },
  panNo: {
    type: String,
   // required: true,
    uppercase: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
   // required: true
  },
  gender: {
    type: String,
   // required: true,
    enum: ['Male', 'Female', 'Other']
  },
  currentState: {
    type: String,
   // required: true,
    trim: true
  },
  currentCity: {
    type: String,
   // required: true,
    trim: true
  },
  preferredState: {
    type: String,
   // required: true,
    trim: true
  },
  preferredCity: {
    type: String,
   // required: true,
    trim: true
  },
  currentEmployer: {
    type: String,
   // required: true,
    trim: true
  },
  designation: {
    type: String,
   // required: true,
    trim: true
  },
  department: {
    type: String,
   // required: true,
    trim: true
  },
  ctcInLakhs: {
    type: Number,
   // required: true,
    min: 0
  },
  totalExperience: {
    type: Number,
   // required: true,
    min: 0
  },
  pdfFile: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  },
  comment1: {
    type: String,
    trim: true
  },
  comment2: {
    type: String,
    trim: true
  },
  comment3: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('UserForm', userSchema);