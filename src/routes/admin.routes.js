const express = require('express');
const {
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
  deleteCompany
} = require('../controller/admin.controller');

const router = express.Router();

// Admin dashboard routes
router.get('/stats', getAdminStats);

router.post('/create-user', createUser);

// Sub-admin management routes
router.get('/sub-admins', getAllSubAdmins);
router.get('/sub-admins/:id', getSubAdminById);
router.post('/sub-admins', createSubAdmin);
router.put('/sub-admins/:id', updateSubAdmin);
router.delete('/sub-admins/:id', deleteSubAdmin);

// Sub-user management routes
router.get('/sub-users', getAllSubUsers);
router.get('/sub-users/:id', getSubUserById);
router.post('/sub-users', createSubUser);
router.put('/sub-users/:id', updateSubUser);
router.delete('/sub-users/:id', deleteSubUser);

// Company management routes
router.get('/companies', getAllCompanies);
router.get('/companies/:id', getCompanyById);
router.post('/companies', createCompany);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);

module.exports = router;
