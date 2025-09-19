const express = require('express');
const Error = require('../middleware/error');
const { createUser, getAllUsers, getUserById, updateUser, deleteUser, downloadPDF, generateExcel, addComment } = require('../controller/form.controller');
const upload = require('../middleware/upload');
const router = express.Router();

router.post('/', upload.single('pdfFile'),Error, createUser);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', upload.single('pdfFile'), Error, updateUser);
router.delete('/:id', deleteUser);
router.get('/:id/download-pdf', downloadPDF);
router.get('/download/export-excel', generateExcel);
router.post('/:id/comments', addComment);
module.exports = router;
