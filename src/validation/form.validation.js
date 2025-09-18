const Joi = require('joi');

const formValidationSchema = Joi.object({
  uploadedBy: Joi.string()
    .trim()
    .min(2)
    .max(100)
    //.required()
    .empty('')
    .optional()
    .messages({
      //'string.empty': 'Uploaded by is required',
      'string.min': 'Uploaded by must be at least 2 characters',
      'string.max': 'Uploaded by cannot exceed 100 characters'
    }),

  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z\s]+$/)
    //.required()
    .empty('')
    .optional()
    .messages({
      //'string.empty': 'First name is required',
      'string.pattern.base': 'First name must contain only letters and spaces'
    }),

  middleName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z\s]*$/)
    //.allow('')
    .empty('')
    .optional()
    .messages({
      'string.pattern.base': 'Middle name must contain only letters and spaces'
    }),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z\s]+$/)
    //.required()
    .empty('')
    .optional()
    .messages({
      //'string.empty': 'Last name is required',
      'string.pattern.base': 'Last name must contain only letters and spaces'
    }),

  contactNo: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    //.required()
    .empty('')
    .optional()
    .messages({
      //'string.empty': 'Contact number is required',
      'string.pattern.base': 'Contact number must be a valid 10-digit Indian mobile number'
    }),

  alternateContactNo: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .allow('')
    .empty('')
    .optional()
    .messages({
      'string.pattern.base': 'Alternate contact number must be a valid 10-digit Indian mobile number'
    }),

  mailId: Joi.string()
    .email()
    .lowercase()
    //.required()
    .empty('')
    .optional()
    .messages({
      //'string.empty': 'Email ID is required',
      'string.email': 'Please enter a valid email address'
    }),

  alternateMailId: Joi.string()
    .email()
    .lowercase()
    .allow('')
    .empty('')
    .optional()
    .messages({
      'string.email': 'Please enter a valid alternate email address'
    }),

  fatherName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[A-Za-z\s]+$/)
    //.required()
    .empty('')
    .optional()
    .messages({
      //'string.empty': 'Father name is required',
      'string.pattern.base': 'Father name must contain only letters and spaces'
    }),

  panNo: Joi.string()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .uppercase()
    //.required()
    .empty('')
    .optional()
    .messages({
      // 'string.empty': 'PAN number is required',
      'string.pattern.base': 'PAN number must be in valid format (e.g., ABCDE1234F)'
    }),

  dateOfBirth: Joi.date()
    .max('now')
    //.required()
    .empty('')
    .optional()
    .messages({
      'date.base': 'Date of birth must be a valid date',
      'date.max': 'Date of birth cannot be in the future',
      //'any.required': 'Date of birth is required'
    }),

  gender: Joi.string()
    .valid('Male', 'Female', 'Other')
    //.required()
    .empty('')
    .optional()
    .messages({
      //'any.only': 'Gender must be Male, Female, or Other',
      //'string.empty': 'Gender is required'
    }),

  currentState: Joi.string()
    .trim()
    .min(2)
    .max(100)
    //.required()
    .empty('')
    .optional()
    .messages({
      //'string.empty': 'Current state is required'
    }),

  currentCity: Joi.string()
    .trim()
    .min(2)
    .max(100)
    //.required()
    .empty('')
    .optional()
    .messages({
      //'string.empty': 'Current city is required'
    }),

  preferredState: Joi.string()
    .trim()
    .min(2)
    .max(100)
    //.required()
    .empty('')
    .optional()
    .messages({
      //'string.empty': 'Preferred state is required'
    }),

  preferredCity: Joi.string()
    .trim()
    .min(2)
    .max(100)
    //.required()
    .empty('')
    .optional()
    .messages({
      //'string.empty': 'Preferred city is required'
    }),

  currentEmployer: Joi.string()
    .trim()
    .min(2)
    .max(200)
    //.required()
    .empty('')
    .optional()
    .messages({
      //'string.empty': 'Current employer is required'
    }),

  designation: Joi.string()
    .trim()
    .min(2)
    .max(100)
    //.required()
    .empty('')
    .optional()
    .messages({
      //'string.empty': 'Designation is required'
    }),

  department: Joi.string()
    .trim()
    .min(2)
    .max(100)
    //.required()
    .empty('')
    .optional()
    .messages({
      //'string.empty': 'Department is required'
    }),

  ctcInLakhs: Joi.number()
    .positive()
    .precision(2)
    .max(1000)
    //.required()
    .empty('')
    .optional()
    .messages({
      'number.base': 'CTC must be a valid number',
      'number.positive': 'CTC must be a positive number',
      'number.max': 'CTC cannot exceed 1000 lakhs',
      //'any.required': 'CTC in lakhs is required'
    }),

  totalExperience: Joi.number()
    .min(0)
    .max(50)
    .precision(1)
    //.required()
    .empty('')
    .optional()
    .messages({
      'number.base': 'Total experience must be a valid number',
      'number.min': 'Total experience cannot be negative',
      'number.max': 'Total experience cannot exceed 50 years',
      //'any.required': 'Total experience is required'
    }),

  comment1: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .empty('')
    .optional()
    .messages({
      'string.max': 'Comment 1 cannot exceed 500 characters'
    }),

  comment2: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .empty('')
    .optional()
    .messages({
      'string.max': 'Comment 2 cannot exceed 500 characters'
    }),

  comment3: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .empty('')
    .optional()
    .messages({
      'string.max': 'Comment 3 cannot exceed 500 characters'
    })
});

const validateUser = (userData) => {
  return formValidationSchema.validate(userData, {
    abortEarly: false,
    stripUnknown: true
  });
};

module.exports = {
  validateUser,
  formValidationSchema
};