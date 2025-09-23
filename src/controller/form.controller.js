const User = require("../models/form.model");
const { validateUser } = require("../validation/form.validation");
const path = require("path");
const fs = require("fs").promises;
const ExcelJS = require("exceljs");
const mongoose = require("mongoose");

// Create new user
const createUser = async (req, res) => {
  try {
    // Format CTC fields if present and are numbers
    if (req.body.minCTC !== undefined) {
      const minCTCValue = parseFloat(req.body.minCTC);
      if (!isNaN(minCTCValue)) {
        req.body.minCTC = Math.round(minCTCValue);
      }
    }

    if (req.body.maxCTC !== undefined) {
      const maxCTCValue = parseFloat(req.body.maxCTC);
      if (!isNaN(maxCTCValue)) {
        req.body.maxCTC = Math.round(maxCTCValue);
      }
    }

    // Validate request body
    const { error, value } = validateUser(req.body);

    if (error) {
      // If file was uploaded but validation failed, delete the file
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting uploaded file:", unlinkError);
        }
      }

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => ({
          field: detail.path[0],
          message: detail.message,
        })),
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
        path: req.file.path,
      };
    }

    // Create new user
    const newUser = new User(userData);
    const savedUser = await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        mailId: savedUser.mailId,
        dateOfUpload: savedUser.dateOfUpload,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);

    // Delete uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all users with pagination and filtering
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Text search across name, email, and phone
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [
        { firstName: searchRegex },
        { middleName: searchRegex },
        { lastName: searchRegex },
        { mailId: searchRegex },
        { alternateMailId: searchRegex },
        { contactNo: searchRegex },
        { alternateContactNo: searchRegex },
        { fatherName: searchRegex },
        { panNo: searchRegex },
      ];
    }

    // Gender filter
    if (req.query.gender && req.query.gender !== "All Genders") {
      filter.gender = req.query.gender;
    }

    // Experience filter (range)
    if (req.query.experience && req.query.experience !== "All Experience") {
      const expValue = req.query.experience;
      if (expValue.includes("+")) {
        // Handle "10+" years case
        const minExp = parseInt(expValue.replace("+", ""));
        filter.totalExperience = { $gte: minExp };
      } else if (expValue.includes("-")) {
        // Handle "5-10" years case
        const [minExp, maxExp] = expValue
          .split("-")
          .map((val) => parseInt(val.trim()));
        filter.totalExperience = { $gte: minExp, $lte: maxExp };
      } else {
        // Handle exact experience
        filter.totalExperience = parseInt(expValue);
      }
    }

    // CTC filter (range) - now using minCTC and maxCTC
    if (req.query.minCTC || req.query.maxCTC) {
      filter.$and = filter.$and || [];

      if (req.query.minCTC && req.query.minCTC !== "0") {
        filter.$and.push({ minCTC: { $gte: parseInt(req.query.minCTC) } });
      }

      if (req.query.maxCTC && req.query.maxCTC !== "All") {
        filter.$and.push({ maxCTC: { $lte: parseInt(req.query.maxCTC) } });
      }
    }

    // Location filters
    if (req.query.currentState && req.query.currentState !== "Current state") {
      filter.currentState = req.query.currentState;
    }

    if (
      req.query.preferredState &&
      req.query.preferredState !== "Preferred state"
    ) {
      filter.preferredState = req.query.preferredState;
    }

    // Job-related filters
    if (req.query.designation && req.query.designation !== "Designation") {
      filter.designation = req.query.designation;
    }

    if (req.query.department && req.query.department !== "Department") {
      filter.department = req.query.department;
    }

    // Current employer filter
    if (req.query.currentEmployer) {
      filter.currentEmployer = new RegExp(req.query.currentEmployer, "i");
    }

    // Date range filters
    if (req.query.startDate || req.query.endDate) {
      filter.dateOfUpload = {};
      if (req.query.startDate) {
        filter.dateOfUpload.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.dateOfUpload.$lte = new Date(req.query.endDate);
      }
    }

    // Uploaded by filter
    if (req.query.uploadedBy) {
      filter.uploadedBy = new RegExp(req.query.uploadedBy, "i");
    }

    const users = await User.find(filter)
      .select("-pdfFile.path") // Exclude file path from response
      .sort({ dateOfUpload: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    // Get filter options for dropdowns
    const [
      genders,
      currentStates,
      preferredStates,
      designations,
      departments,
      currentEmployers,
    ] = await Promise.all([
      User.distinct("gender"),
      User.distinct("currentState"),
      User.distinct("preferredState"),
      User.distinct("designation"),
      User.distinct("department"),
      User.distinct("currentEmployer"),
    ]);

    // Get experience range options - now using minExperience and maxExperience
    const minExperiences = await User.distinct("minExperience");
    const maxExperiences = await User.distinct("maxExperience");

    const minExp = Math.min(...minExperiences.filter((e) => e != null));
    const maxExp = Math.max(...maxExperiences.filter((e) => e != null));

    let minExperienceOptions = ["0"];
    let maxExperienceOptions = ["All"];

    // Generate min experience options
    for (let i = minExp; i <= maxExp; i++) {
      minExperienceOptions.push(i.toString());
    }

    // Generate max experience options
    for (let i = minExp; i <= maxExp; i++) {
      maxExperienceOptions.push(i.toString());
    }

    // Get CTC range options - now using minCTC and maxCTC
    const minCTCValues = await User.distinct("minCTC");
    const maxCTCValues = await User.distinct("maxCTC");

    const minCTC = Math.min(...minCTCValues.filter((c) => c != null));
    const maxCTC = Math.max(...maxCTCValues.filter((c) => c != null));

    let minCTCOptions = ["0"];
    let maxCTCOptions = ["All"];

    // Generate min CTC options (1-5 range)
    for (let i = 1; i <= 5; i++) {
      minCTCOptions.push(i.toString());
    }

    // Generate max CTC options (1-14 range)
    for (let i = 1; i <= 14; i++) {
      maxCTCOptions.push(i.toString());
    }

    // Add permanent details to each user
    const usersWithPermanentDetails = users.map((user) => {
      const userObj = user.toObject();
      userObj.permanentDetails = {
        dateOfBirth: userObj.dateOfBirth,
        gender: userObj.gender,
      };
      return userObj;
    });

    res.json({
      success: true,
      data: usersWithPermanentDetails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      filters: {
        appliedFilters: req.query,
        totalFilteredResults: total,
        filterOptions: {
          genders: ["All Genders", ...genders.filter((g) => g != null)],
          currentStates: [
            "Current state",
            ...currentStates.filter((s) => s != null).sort(),
          ],
          preferredStates: [
            "Preferred state",
            ...preferredStates.filter((s) => s != null).sort(),
          ],
          designations: [
            "Designation",
            ...designations.filter((d) => d != null).sort(),
          ],
          departments: [
            "Department",
            ...departments.filter((d) => d != null).sort(),
          ],
          currentEmployers: [
            ...currentEmployers.filter((e) => e != null).sort(),
          ],
          minExperienceOptions: [...new Set(minExperienceOptions)], // Remove duplicates
          maxExperienceOptions: [...new Set(maxExperienceOptions)], // Remove duplicates
          minCTCOptions: [...new Set(minCTCOptions)], // Remove duplicates
          maxCTCOptions: [...new Set(maxCTCOptions)], // Remove duplicates
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findById(req.params.id).select("-pdfFile.path");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get comments by user ID
const getUserComments = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        comments: user.comments,
        userName: `${user.firstName} ${user.lastName}`,
        userId: user._id,
        totalComments: user.comments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    // Format CTC fields if present and are numbers
    if (req.body.minCTC !== undefined) {
      const minCTCValue = parseFloat(req.body.minCTC);
      if (!isNaN(minCTCValue)) {
        req.body.minCTC = Math.round(minCTCValue);
      }
    }

    if (req.body.maxCTC !== undefined) {
      const maxCTCValue = parseFloat(req.body.maxCTC);
      if (!isNaN(maxCTCValue)) {
        req.body.maxCTC = Math.round(maxCTCValue);
      }
    }

    const { error, value } = validateUser(req.body);

    if (error) {
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting uploaded file:", unlinkError);
        }
      }

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => ({
          field: detail.path[0],
          message: detail.message,
        })),
      });
    }

    const userId = req.params.id;
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting uploaded file:", unlinkError);
        }
      }

      return res.status(404).json({
        success: false,
        message: "User not found",
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
          console.error("Error deleting old file:", unlinkError);
        }
      }

      // Add new file info
      updateData.pdfFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-pdfFile.path");

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);

    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
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
        message: "User not found",
      });
    }

    // Delete associated file if it exists
    if (user.pdfFile && user.pdfFile.path) {
      try {
        await fs.unlink(user.pdfFile.path);
      } catch (unlinkError) {
        console.error("Error deleting user file:", unlinkError);
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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
        message: "File not found",
      });
    }

    const filePath = user.pdfFile.path;

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    res.setHeader("Content-Type", user.pdfFile.mimetype);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${user.pdfFile.originalName}"`
    );

    res.download(filePath, user.pdfFile.originalName);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const generateExcel = async (req, res) => {
  try {
    // Build filter object (same logic as getAllUsers)
    const filter = {};

    // Text search across name, email, and phone
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [
        { firstName: searchRegex },
        { middleName: searchRegex },
        { lastName: searchRegex },
        { mailId: searchRegex },
        { alternateMailId: searchRegex },
        { contactNo: searchRegex },
        { alternateContactNo: searchRegex },
        { fatherName: searchRegex },
        { panNo: searchRegex },
      ];
    }

    // Gender filter
    if (req.query.gender && req.query.gender !== "All Genders") {
      filter.gender = req.query.gender;
    }

    // Experience filter (range) - now using minExperience and maxExperience
    if (req.query.minExperience || req.query.maxExperience) {
      filter.$and = filter.$and || [];

      if (req.query.minExperience && req.query.minExperience !== "0") {
        filter.$and.push({ minExperience: { $gte: parseInt(req.query.minExperience) } });
      }

      if (req.query.maxExperience && req.query.maxExperience !== "All") {
        filter.$and.push({ maxExperience: { $lte: parseInt(req.query.maxExperience) } });
      }
    }

    // CTC filter (range) - now using minCTC and maxCTC
    if (req.query.minCTC || req.query.maxCTC) {
      filter.$and = filter.$and || [];

      if (req.query.minCTC && req.query.minCTC !== "0") {
        filter.$and.push({ minCTC: { $gte: parseInt(req.query.minCTC) } });
      }

      if (req.query.maxCTC && req.query.maxCTC !== "All") {
        filter.$and.push({ maxCTC: { $lte: parseInt(req.query.maxCTC) } });
      }
    }

    // Location filters
    if (req.query.currentState && req.query.currentState !== "Current state") {
      filter.currentState = req.query.currentState;
    }

    if (
      req.query.preferredState &&
      req.query.preferredState !== "Preferred state"
    ) {
      filter.preferredState = req.query.preferredState;
    }

    // Job-related filters
    if (req.query.designation && req.query.designation !== "Designation") {
      filter.designation = req.query.designation;
    }

    if (req.query.department && req.query.department !== "Department") {
      filter.department = req.query.department;
    }

    // Current employer filter
    if (req.query.currentEmployer) {
      filter.currentEmployer = new RegExp(req.query.currentEmployer, "i");
    }

    // Date range filters
    if (req.query.startDate || req.query.endDate) {
      filter.dateOfUpload = {};
      if (req.query.startDate) {
        filter.dateOfUpload.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.dateOfUpload.$lte = new Date(req.query.endDate);
      }
    }

    // Uploaded by filter
    if (req.query.uploadedBy) {
      filter.uploadedBy = new RegExp(req.query.uploadedBy, "i");
    }

    // Limit the number of exported users to 25
    const users = await User.find(filter).limit(25).lean();

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found matching the applied filters to export",
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Filtered Users");

    // Define columns
    worksheet.columns = [
      // ✨ Change 1: Updated the first column to be a serial number instead of the DB ID.
      { header: "Sr. No.", key: "serialNumber", width: 10 },
      { header: "Uploaded By", key: "uploadedBy", width: 25 },
      { header: "Date Of Upload", key: "dateOfUpload", width: 20 },
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
      { header: "Gender", key: "gender", width: 15 },
      { header: "Current State", key: "currentState", width: 20 },
      { header: "Current City", key: "currentCity", width: 20 },
      { header: "Preferred State", key: "preferredState", width: 20 },
      { header: "Preferred City", key: "preferredCity", width: 20 },
      { header: "Current Employer", key: "currentEmployer", width: 25 },
      { header: "Designation", key: "designation", width: 25 },
      { header: "Department", key: "department", width: 25 },
      { header: "Min CTC (Lakhs)", key: "minCTC", width: 15 },
      { header: "Max CTC (Lakhs)", key: "maxCTC", width: 15 },
      { header: "Min Experience (Yrs)", key: "minExperience", width: 15 },
      { header: "Max Experience (Yrs)", key: "maxExperience", width: 15 },
      { header: "CV Link", key: "cvLink", width: 40 },
      { header: "Comment1", key: "comment1", width: 40 },
      { header: "Comment2", key: "comment2", width: 40 },
      { header: "Comment3", key: "comment3", width: 40 },
    ];

    // Add rows with corrected data and hyperlinks
    users.forEach((user, index) => {
      const rowData = {
        // ✨ Change 2: Added the serial number using the loop's index.
        serialNumber: index + 1,
        ...user,
        dateOfUpload: user.dateOfUpload
          ? new Date(user.dateOfUpload).toLocaleDateString("en-IN")
          : "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toLocaleDateString("en-IN")
          : "",
      };

      const row = worksheet.addRow(rowData);

      // Correctly build the hyperlink URL
      if (user.pdfFile && user.pdfFile.filename) {
        const cell = row.getCell("cvLink");
        const serverUrl =
          process.env.VITE_BACKEND_URI ||
          "https://rbgform-server-ss.onrender.com";
        cell.value = {
          text: "Download CV",
          hyperlink: `${serverUrl}/uploads/${user.pdfFile.filename}`,
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
        fgColor: { argb: "4472C4" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Style all data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.alignment = {
            horizontal: "left",
            vertical: "middle",
            wrapText: true,
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }
    });

    // Send Excel file as response
    const appliedFilters = Object.keys(req.query).length > 0 ? "Filtered_" : "";
    const recordCount = users.length > 0 ? `${users.length}_` : "";
    const filename = `${appliedFilters}${recordCount}Users_Data.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel file:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .send("An error occurred while generating the Excel file.");
    }
  }
};

const addComment = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate userId
    if (!userId || userId === "undefined") {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing user ID",
      });
    }

    // Accept both 'text' and 'comment' for backward compatibility
    const text = req.body.text || req.body.comment;
    const addedBy = req.body.addedBy || "unknown";

    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment text is required and must be a non-empty string",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Ensure comments array exists
    if (!Array.isArray(user.comments)) user.comments = [];

    // Add comment object
    user.comments.push({ text, addedBy, date: new Date() });
    await user.save();

    res.json({
      success: true,
      message: "Comment added successfully",
      data: user.comments,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Generate Excel for a SINGLE user with a clickable CV link
const generateSingleUserExcel = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate the user's serial number
    const userCountBefore = await User.countDocuments({
      dateOfUpload: { $lt: user.dateOfUpload },
    });
    const serialNumber = userCountBefore + 1;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("User Details");

    // Define a structured layout
    const data = [
      // ✨ "Database ID" field has been removed.
      { field: "Sr. No.", value: serialNumber },
      { field: "Uploaded By", value: user.uploadedBy },
      {
        field: "Date Of Upload",
        value: user.dateOfUpload
          ? new Date(user.dateOfUpload).toLocaleDateString("en-IN")
          : "N/A",
      },
      { field: "First Name", value: user.firstName },
      { field: "Middle Name", value: user.middleName },
      { field: "Last Name", value: user.lastName },
      { field: "Email", value: user.mailId },
      { field: "Alternate Email", value: user.alternateMailId },
      { field: "Contact No", value: user.contactNo },
      { field: "Alternate Contact No", value: user.alternateContactNo },
      { field: "Father Name", value: user.fatherName },
      { field: "PAN No", value: user.panNo },
      {
        field: "Date of Birth",
        value: user.dateOfBirth
          ? new Date(user.dateOfBirth).toLocaleDateString("en-IN")
          : "N/A",
      },
      { field: "Gender", value: user.gender },
      { field: "Current State", value: user.currentState },
      { field: "Current City", value: user.currentCity },
      { field: "Preferred State", value: user.preferredState },
      { field: "Preferred City", value: user.preferredCity },
      { field: "Current Employer", value: user.currentEmployer },
      { field: "Designation", value: user.designation },
      { field: "Department", value: user.department },
      { field: "Comment 1", value: user.comment1 },
      { field: "Comment 2", value: user.comment2 },
      { field: "Comment 3", value: user.comment3 },
      {
        field: "CV Link",
        value:
          user.pdfFile && user.pdfFile.filename
            ? {
                text: "Download Resume",
                hyperlink: `${
                  process.env.VITE_BACKEND_URI ||
                  "https://rbgform-server-ss.onrender.com"
                }/uploads/${user.pdfFile.filename}`,
              }
            : "No CV Uploaded",
      },
    ];

    // Add headers
    worksheet.columns = [
      { header: "Field", key: "field", width: 30 },
      { header: "Value", key: "value", width: 50 },
    ];

    // Add the data rows
    data.forEach((item) => {
      const row = worksheet.addRow(item);
      if (item.value && item.value.hyperlink) {
        const cell = row.getCell("value");
        cell.font = { color: { argb: "FF0000FF" }, underline: true };
      }
    });

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" },
      };
      cell.alignment = { vertical: "middle" };
    });

    // Set filename
    const filename = `user_${user.firstName || "details"}_${user._id}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating single user Excel:", error);
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
  getUserComments,
  updateUser,
  deleteUser,
  downloadPDF,
  generateExcel,
  addComment,
  generateSingleUserExcel,
};
