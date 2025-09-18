const User = require('../models/form.model');
const { validateUser } = require('../validation/form.validation');
const path = require('path');
const fs = require('fs').promises;
const ExcelJS = require('exceljs')

// Create new user
const createUser = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = validateUser(req.body);
    
    if (error) {
      // If file was uploaded but validation failed, delete the file
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path[0],
          message: detail.message
        }))
      });
    }

    // Check if user with same email or PAN already exists
    const existingUser = await User.findOne({
      $or: [
        { mailId: value.mailId },
        { panNo: value.panNo }
      ]
    });

    if (existingUser) {
      // Delete uploaded file if user already exists
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }

      return res.status(409).json({
        success: false,
        message: 'User with this email or PAN number already exists'
      });
    }

    // Prepare user data
    const userData = { ...value };

    // Add file information if PDF was uploaded
    if (req.file) {
      userData.pdfFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };
    }

    // Create new user
    const newUser = new User(userData);
    const savedUser = await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        mailId: savedUser.mailId,
        dateOfUpload: savedUser.dateOfUpload
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-pdfFile.path') // Exclude file path from response
      .sort({ dateOfUpload: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-pdfFile.path');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { error, value } = validateUser(req.body);
    
    if (error) {
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path[0],
          message: detail.message
        }))
      });
    }

    const userId = req.params.id;
    const existingUser = await User.findById(userId);
    
    if (!existingUser) {
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check for duplicate email or PAN (excluding current user)
    const duplicateUser = await User.findOne({
      _id: { $ne: userId },
      $or: [
        { mailId: value.mailId },
        { panNo: value.panNo }
      ]
    });

    if (duplicateUser) {
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }

      return res.status(409).json({
        success: false,
        message: 'Another user with this email or PAN number already exists'
      });
    }

    const updateData = { ...value };

    // Handle file update
    if (req.file) {
      // Delete old file if it exists
      if (existingUser.pdfFile && existingUser.pdfFile.path) {
        try {
          await fs.unlink(existingUser.pdfFile.path);
        } catch (unlinkError) {
          console.error('Error deleting old file:', unlinkError);
        }
      }

      // Add new file info
      updateData.pdfFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-pdfFile.path');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete associated file if it exists
    if (user.pdfFile && user.pdfFile.path) {
      try {
        await fs.unlink(user.pdfFile.path);
      } catch (unlinkError) {
        console.error('Error deleting user file:', unlinkError);
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Download PDF file
const downloadPDF = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user || !user.pdfFile || !user.pdfFile.path) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const filePath = user.pdfFile.path;
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    res.setHeader('Content-Type', user.pdfFile.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${user.pdfFile.originalName}"`);
    
    res.download(filePath, user.pdfFile.originalName);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};



const generateExcel = async (req, res) => {
  try {
    const users = await User.find().lean();

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found to export",
      });
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    // Define columns
    worksheet.columns = [
      { header: "ID", key: "_id", width: 30 },
      { header: "Uploaded By", key: "uploadedBy", width: 25 },
      { header: "Date Of Upload", key: "dateOfUpload", width: 25 },
      { header: "First Name", key: "firstName", width: 20 },
      { header: "Middle Name", key: "middleName", width: 20 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "Email", key: "mailId", width: 30 },
      { header: "Alternate Email", key: "alternateMailId", width: 30 },
      { header: "Contact No", key: "contactNo", width: 20 },
      { header: "Alternate Contact No", key: "alternateContactNo", width: 20 },
      { header: "Father Name", key: "fatherName", width: 25 },
      { header: "PAN No", key: "panNo", width: 20 },
      { header: "Date of Birth", key: "dateOfBirth", width: 20 },
      { header: "Gender", key: "gender", width: 20 },
      { header: "Current State", key: "currentState", width: 20 },
      { header: "Current City", key: "currentCity", width: 20 },
      { header: "Preferred State", key: "preferredState", width: 20 },
      { header: "Preferred City", key: "preferredCity", width: 20 },
      { header: "Current Employer", key: "currentEmployer", width: 20 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Department", key: "department", width: 20 },
      { header: "CV Link", key: "cvLink", width: 40 },
      { header: "Comment1", key: "comment1", width: 40 },
      { header: "Comment2", key: "comment2", width: 40 },
      { header: "Comment3", key: "comment3", width: 40 },
    ];

    // Add rows
    users.forEach((user) => {
      

      const row = worksheet.addRow({
        ...user,
        cvLink: user.pdfFile?.path || "",
      });

      // CV hyperlink
      if (user.pdfFile?.path) {
        const cell = row.getCell("cvLink");
        cell.value = {
          text: "View CV",
          hyperlink: path.join("https://rbgform-server-ss.onrender.com/", user.pdfFile.path),
        };
        cell.font = { color: { argb: "FF0000FF" }, underline: true };
      }
    });

    // Style headers
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" }, // blue header
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Style all rows (borders + alignment + wrapping)
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      row.height = 25;
    });

    // Freeze header row
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // Send Excel file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=users.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  downloadPDF,
  generateExcel
};