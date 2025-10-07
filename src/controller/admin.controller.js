const User = require('../models/user.model');
const Company = require('../models/company.model');
const City = require('../models/city.model');
const emailService = require('../services/email.service');

// Create new user (sub-admin or sub-user)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    if (!['sub-admin', 'sub-user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only sub-admin or sub-user allowed'
      });
    }

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create and save user
    const newUser = new User({ name, email, password, role });
    const savedUser = await newUser.save();

    // Remove password before sending response
    const safeUser = await User.findById(savedUser._id).select('-password');

    res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      data: safeUser
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Get all sub-admins
const getAllSubAdmins = async (req, res) => {
  try {
    const subAdmins = await User.find({ role: 'sub-admin' })
      .select('-password') // Exclude password
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Sub-admins retrieved successfully',
      data: subAdmins
    });

  } catch (error) {
    console.error('Error fetching sub-admins:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all sub-users
const getAllSubUsers = async (req, res) => {
  try {
    const subUsers = await User.find({ role: 'sub-user' })
      .select('-password') // Exclude password
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Sub-users retrieved successfully',
      data: subUsers
    });

  } catch (error) {
    console.error('Error fetching sub-users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get sub-admin by ID
const getSubAdminById = async (req, res) => {
  try {
    const subAdmin = await User.findOne({
      _id: req.params.id,
      role: 'sub-admin'
    }).select('-password'); // Exclude password

    if (!subAdmin) {
      return res.status(404).json({ success: false, message: 'Sub-admin not found' });
    }

    res.json({ success: true, message: 'Sub-admin retrieved successfully', data: subAdmin });

  } catch (error) {
    console.error('Error fetching sub-admin:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get sub-user by ID
const getSubUserById = async (req, res) => {
  try {
    const subUser = await User.findOne({
      _id: req.params.id,
      role: 'sub-user'
    }).select('-password'); // Exclude password

    if (!subUser) {
      return res.status(404).json({ success: false, message: 'Sub-user not found' });
    }

    res.json({ success: true, message: 'Sub-user retrieved successfully', data: subUser });

  } catch (error) {
    console.error('Error fetching sub-user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create new sub-admin
const createSubAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: 'User with this email already exists' });

    const newSubAdmin = new User({ email, password, role: 'sub-admin' });
    const savedSubAdmin = await newSubAdmin.save();

    const safeSubAdmin = await User.findById(savedSubAdmin._id).select('-password'); // Exclude password
    res.status(201).json({ success: true, message: 'Sub-admin created successfully', data: safeSubAdmin });

  } catch (error) {
    console.error('Error creating sub-admin:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Create new sub-user
const createSubUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: 'User with this email already exists' });

    const newSubUser = new User({ email, password, role: 'sub-user' });
    const savedSubUser = await newSubUser.save();

    const safeSubUser = await User.findById(savedSubUser._id).select('-password'); // Exclude password
    res.status(201).json({ success: true, message: 'Sub-user created successfully', data: safeSubUser });

  } catch (error) {
    console.error('Error creating sub-user:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Update sub-admin
const updateSubAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const subAdmin = await User.findOne({ _id: req.params.id, role: 'sub-admin' });
    if (!subAdmin) return res.status(404).json({ success: false, message: 'Sub-admin not found' });

    if (email && email !== subAdmin.email) {
      const duplicateUser = await User.findOne({ email, _id: { $ne: subAdmin._id } });
      if (duplicateUser) return res.status(409).json({ success: false, message: 'Another user with this email already exists' });
      subAdmin.email = email;
    }

    if (password) subAdmin.password = password; // Will be hashed

    const updatedSubAdmin = await subAdmin.save();
    const safeSubAdmin = await User.findById(updatedSubAdmin._id).select('-password'); // Exclude password
    res.json({ success: true, message: 'Sub-admin updated successfully', data: safeSubAdmin });

  } catch (error) {
    console.error('Error updating sub-admin:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update sub-user
const updateSubUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const subUser = await User.findOne({ _id: req.params.id, role: 'sub-user' });
    if (!subUser) return res.status(404).json({ success: false, message: 'Sub-user not found' });

    if (email && email !== subUser.email) {
      const duplicateUser = await User.findOne({ email, _id: { $ne: subUser._id } });
      if (duplicateUser) return res.status(409).json({ success: false, message: 'Another user with this email already exists' });
      subUser.email = email;
    }

    if (password) subUser.password = password; // Will be hashed

    const updatedSubUser = await subUser.save();
    const safeSubUser = await User.findById(updatedSubUser._id).select('-password'); // Exclude password
    res.json({ success: true, message: 'Sub-user updated successfully', data: safeSubUser });

  } catch (error) {
    console.error('Error updating sub-user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete sub-admin
const deleteSubAdmin = async (req, res) => {
  try {
    const subAdmin = await User.findOne({ _id: req.params.id, role: 'sub-admin' });
    if (!subAdmin) return res.status(404).json({ success: false, message: 'Sub-admin not found' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Sub-admin deleted successfully' });

  } catch (error) {
    console.error('Error deleting sub-admin:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete sub-user
const deleteSubUser = async (req, res) => {
  try {
    const subUser = await User.findOne({ _id: req.params.id, role: 'sub-user' });
    if (!subUser) return res.status(404).json({ success: false, message: 'Sub-user not found' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Sub-user deleted successfully' });

  } catch (error) {
    console.error('Error deleting sub-user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Admin dashboard statistics
const getAdminStats = async (req, res) => {
  try {
    const totalSubAdmins = await User.countDocuments({ role: 'sub-admin' });
    const totalSubUsers = await User.countDocuments({ role: 'sub-user' });
    const totalUsers = await User.countDocuments({ role: 'user' });

    res.json({
      success: true,
      message: 'Admin statistics retrieved successfully',
      data: {
        totalSubAdmins,
        totalSubUsers,
        totalUsers,
        totalManagedUsers: totalSubAdmins + totalSubUsers + totalUsers
      }
    });

  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create company
const createCompany = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    const existingCompany = await Company.findOne({ name: name.toUpperCase() });
    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: 'Company with this name already exists'
      });
    }

    const newCompany = new Company({ name, description });
    const savedCompany = await newCompany.save();

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: savedCompany
    });

  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Get all companies
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json(companies); // ✅ return only array
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Get company by ID
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.json({ success: true, message: 'Company retrieved successfully', data: company });

  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update company
const updateCompany = async (req, res) => {
  try {
    const { name, description } = req.body;
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    if (name && name.toUpperCase() !== company.name) {
      const duplicateCompany = await Company.findOne({ name: name.toUpperCase(), _id: { $ne: company._id } });
      if (duplicateCompany) return res.status(409).json({ success: false, message: 'Another company with this name already exists' });
      company.name = name.toUpperCase();
    }

    if (description !== undefined) company.description = description;

    const updatedCompany = await company.save();
    res.json({ success: true, message: 'Company updated successfully', data: updatedCompany });

  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete company
const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    await Company.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Company deleted successfully' });

  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create state
const createState = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'State name is required'
      });
    }

    const existingState = await State.findOne({ name: name.toUpperCase() });
    if (existingState) {
      return res.status(409).json({
        success: false,
        message: 'State with this name already exists'
      });
    }

    const newState = new State({ name, description });
    const savedState = await newState.save();

    res.status(201).json({
      success: true,
      message: 'State created successfully',
      data: savedState
    });

  } catch (error) {
    console.error('Error creating state:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all states
const getAllStates = async (req, res) => {
  try {
    const states = await State.find().sort({ name: 1 });
    res.json({
      success: true,
      message: 'States retrieved successfully',
      data: states
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get state by ID
const getStateById = async (req, res) => {
  try {
    const state = await State.findById(req.params.id);

    if (!state) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }

    res.json({ success: true, message: 'State retrieved successfully', data: state });

  } catch (error) {
    console.error('Error fetching state:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update state
const updateState = async (req, res) => {
  try {
    const { name, description } = req.body;
    const state = await State.findById(req.params.id);
    if (!state) return res.status(404).json({ success: false, message: 'State not found' });

    if (name && name.toUpperCase() !== state.name) {
      const duplicateState = await State.findOne({ name: name.toUpperCase(), _id: { $ne: state._id } });
      if (duplicateState) return res.status(409).json({ success: false, message: 'Another state with this name already exists' });
      state.name = name.toUpperCase();
    }

    if (description !== undefined) state.description = description;

    const updatedState = await state.save();
    res.json({ success: true, message: 'State updated successfully', data: updatedState });

  } catch (error) {
    console.error('Error updating state:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete state
const deleteState = async (req, res) => {
  try {
    const state = await State.findById(req.params.id);
    if (!state) return res.status(404).json({ success: false, message: 'State not found' });

    // Check if state has cities
    const citiesCount = await City.countDocuments({ state: req.params.id });
    if (citiesCount > 0) {
      return res.status(409).json({ success: false, message: 'Cannot delete state with existing cities' });
    }

    await State.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'State deleted successfully' });

  } catch (error) {
    console.error('Error deleting state:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create city
const createCity = async (req, res) => {
  try {
    // 1. Get the city name and state name from the request body.
    // Your frontend sends the state name in a field named 'stateId'.
    const { name, stateId: state } = req.body;

    // 2. Validate that both fields were provided.
    if (!name || !state) {
      return res.status(400).json({
        success: false,
        message: 'City name and state name are required'
      });
    }

    // 3. Create a new city document using your City model.
    // We no longer check for a State model because it's not needed.
    const newCity = new City({ name, state });
    const savedCity = await newCity.save();

    // 4. Send a success response.
    res.status(201).json({
      success: true,
      message: 'City created successfully',
      data: savedCity
    });

  } catch (error) {
    console.error('Error creating city:', error);
    
    // This part correctly handles cases where the city already exists in that state.
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'This city already exists in the selected state'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};


// Get all cities
const getAllCities = async (req, res) => {
  try {
    const cities = await City.find().populate('state', 'name').sort({ name: 1 });
    res.json({
      success: true,
      message: 'Cities retrieved successfully',
      data: cities
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get cities by state
const getCitiesByState = async (req, res) => {
  try {
    const cities = await City.find({ state: req.params.stateId }).sort({ name: 1 });
    res.json({
      success: true,
      message: 'Cities retrieved successfully',
      data: cities
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get city by ID
const getCityById = async (req, res) => {
  try {
    const city = await City.findById(req.params.id).populate('state', 'name');

    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    res.json({ success: true, message: 'City retrieved successfully', data: city });

  } catch (error) {
    console.error('Error fetching city:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update city
const updateCity = async (req, res) => {
  try {
    const { name, stateId } = req.body;
    const city = await City.findById(req.params.id);
    if (!city) return res.status(404).json({ success: false, message: 'City not found' });

    if (stateId) {
      const state = await State.findById(stateId);
      if (!state) return res.status(404).json({ success: false, message: 'State not found' });
      city.state = stateId;
    }

    if (name) city.name = name.toUpperCase();

    const updatedCity = await city.save();
    res.json({ success: true, message: 'City updated successfully', data: updatedCity });

  } catch (error) {
    console.error('Error updating city:', error);
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'City with this name already exists in the selected state'
      });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

// Delete city
const deleteCity = async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) return res.status(404).json({ success: false, message: 'City not found' });

    await City.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'City deleted successfully' });

  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  createUser,
  getAllSubAdmins,
  getAllSubUsers,
  getSubAdminById,
  getSubUserById,
  createSubAdmin,
  createSubUser,
  updateSubAdmin,
  updateSubUser,
  deleteSubAdmin,
  deleteSubUser,
  getAdminStats,
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getAllStates,
  getStateById,
  updateState,
  deleteState,
  createCity,
  getAllCities,
  getCitiesByState,
  getCityById,
  updateCity,
  deleteCity
};
