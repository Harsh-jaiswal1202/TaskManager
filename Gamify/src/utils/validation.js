// Validation utilities for forms

export const validateRequired = (value, fieldName) => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateLength = (value, fieldName, min, max) => {
  if (value && value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  if (value && value.length > max) {
    return `${fieldName} must be less than ${max} characters`;
  }
  return null;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validateTaskForm = (data) => {
  const errors = {};

  // Validate task name
  const nameError = validateRequired(data.name, 'Task name');
  if (nameError) errors.name = nameError;
  else {
    const nameLengthError = validateLength(data.name, 'Task name', 3, 100);
    if (nameLengthError) errors.name = nameLengthError;
  }

  // Validate description
  const descError = validateRequired(data.description, 'Description');
  if (descError) errors.description = descError;
  else {
    const descLengthError = validateLength(data.description, 'Description', 10, 200);
    if (descLengthError) errors.description = descLengthError;
  }

  // Validate details
  const detailsError = validateRequired(data.details, 'Details');
  if (detailsError) errors.details = detailsError;
  else {
    const detailsLengthError = validateLength(data.details, 'Details', 20, 1000);
    if (detailsLengthError) errors.details = detailsLengthError;
  }

  // Validate difficulty
  const validDifficulties = ['Easy', 'Medium', 'Hard', 'Popular', 'Trending'];
  if (!data.difficulty || !validDifficulties.includes(data.difficulty)) {
    errors.difficulty = 'Please select a valid difficulty level';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateCategoryForm = (data) => {
  const errors = {};

  // Validate category name
  const nameError = validateRequired(data.name, 'Category name');
  if (nameError) errors.name = nameError;
  else {
    const nameLengthError = validateLength(data.name, 'Category name', 2, 50);
    if (nameLengthError) errors.name = nameLengthError;
  }

  // Validate emoji
  if (!data.emoji || data.emoji.trim() === '') {
    errors.emoji = 'Please select an emoji';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 