const { VALIDATION_RULES, REGEX_PATTERNS, ERROR_MESSAGES, BAD_WORDS } = require('../config/constants');

/**
 * Validate review data before submission
 * @param {Object} data - Review data to validate
 * @returns {Object} { isValid: boolean, errors: array }
 */
function validateReview(data) {
  const errors = [];

  // Validate name
  if (!data.name || data.name.trim() === '') {
    errors.push('Name is required');
  } else if (data.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  } else if (data.name.length > 100) {
    errors.push('Name must not exceed 100 characters');
  } else if (!REGEX_PATTERNS.NAME.test(data.name)) {
    errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
  }

  // Validate email (optional but if provided, must be valid)
  if (data.email && data.email.trim() !== '') {
    if (!REGEX_PATTERNS.EMAIL.test(data.email)) {
      errors.push(ERROR_MESSAGES.INVALID_EMAIL);
    }
  }

  // Validate rating
  if (!data.rating) {
    errors.push('Rating is required');
  } else {
    const rating = parseInt(data.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      errors.push(ERROR_MESSAGES.INVALID_RATING);
    }
  }

  // Validate title
  if (!data.title || data.title.trim() === '') {
    errors.push('Review title is required');
  } else if (data.title.length < VALIDATION_RULES.MIN_TITLE_LENGTH) {
    errors.push(ERROR_MESSAGES.TITLE_TOO_SHORT.replace('{min}', VALIDATION_RULES.MIN_TITLE_LENGTH));
  } else if (data.title.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
    errors.push(ERROR_MESSAGES.TITLE_TOO_LONG.replace('{max}', VALIDATION_RULES.MAX_TITLE_LENGTH));
  }

  // Validate review content
  if (!data.review || data.review.trim() === '') {
    errors.push('Review content is required');
  } else if (data.review.length < VALIDATION_RULES.MIN_REVIEW_LENGTH) {
    errors.push(ERROR_MESSAGES.REVIEW_TOO_SHORT.replace('{min}', VALIDATION_RULES.MIN_REVIEW_LENGTH));
  } else if (data.review.length > VALIDATION_RULES.MAX_REVIEW_LENGTH) {
    errors.push(ERROR_MESSAGES.REVIEW_TOO_LONG.replace('{max}', VALIDATION_RULES.MAX_REVIEW_LENGTH));
  }

  // Check for bad words
  if (VALIDATION_RULES.BAD_WORDS_FILTER_ENABLED) {
    const reviewText = (data.title + ' ' + data.review).toLowerCase();
    for (const badWord of BAD_WORDS) {
      if (reviewText.includes(badWord.toLowerCase())) {
        errors.push('Your review contains inappropriate language');
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate email address
 * @param {String} email - Email to validate
 * @returns {Boolean} Is valid email
 */
function validateEmail(email) {
  if (!email || email.trim() === '') {
    return true; // Email is optional
  }
  return REGEX_PATTERNS.EMAIL.test(email);
}

/**
 * Validate rating
 * @param {Number} rating - Rating value
 * @returns {Boolean} Is valid rating
 */
function validateRating(rating) {
  const ratingNum = parseInt(rating);
  return !isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5;
}

/**
 * Validate UUID format
 * @param {String} id - UUID to validate
 * @returns {Boolean} Is valid UUID
 */
function validateUUID(id) {
  return REGEX_PATTERNS.UUID.test(id);
}

/**
 * Sanitize input to prevent XSS
 * @param {String} input - Input to sanitize
 * @returns {String} Sanitized input
 */
function sanitizeInput(input) {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize review object
 * @param {Object} review - Review object
 * @returns {Object} Sanitized review
 */
function sanitizeReview(review) {
  return {
    ...review,
    name: sanitizeInput(review.name),
    email: review.email ? review.email.toLowerCase().trim() : '',
    title: sanitizeInput(review.title),
    review: sanitizeInput(review.review)
  };
}

/**
 * Calculate similarity between two strings
 * @param {String} str1 - First string
 * @param {String} str2 - Second string
 * @returns {Number} Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {String} s1 - First string
 * @param {String} s2 - Second string
 * @returns {Number} Edit distance
 */
function getEditDistance(s1, s2) {
  const costs = [];
  
  for (let k = 0; k <= s1.length; k++) {
    let lastValue = k;
    for (let i = 0; i <= s2.length; i++) {
      if (k === 0) {
        costs[i] = i;
      } else if (i > 0) {
        let newValue = costs[i - 1];
        if (s1.charAt(k - 1) !== s2.charAt(i - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[i]) + 1;
        }
        costs[i - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (k > 0) {
      costs[s2.length] = lastValue;
    }
  }
  
  return costs[s2.length];
}

/**
 * Validate admin password
 * @param {String} password - Password to validate
 * @returns {Boolean} Is valid
 */
function validateAdminPassword(password) {
  return password === process.env.ADMIN_PASSWORD;
}

/**
 * Check if review is spam (simple heuristics)
 * @param {Object} review - Review object
 * @returns {Boolean} Is spam
 */
function isSpam(review) {
  if (!VALIDATION_RULES.SPAM_CHECK_ENABLED) return false;
  
  const content = (review.title + ' ' + review.review).toLowerCase();
  
  // Check for excessive links
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 2) return true;
  
  // Check for excessive capitalization
  const capsCount = (content.match(/[A-Z]/g) || []).length;
  if (capsCount > content.length * 0.5) return true;
  
  // Check for excessive punctuation
  const punctCount = (content.match(/[!?]{2,}/g) || []).length;
  if (punctCount > 3) return true;
  
  // Check for repeated characters
  if (/(.)\1{4,}/.test(content)) return true;
  
  return false;
}

/**
 * Middleware to validate review submission
 */
function reviewValidationMiddleware(req, res, next) {
  const { name, email, rating, title, review } = req.body;
  
  const validation = validateReview({
    name,
    email,
    rating,
    title,
    review
  });
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      errors: validation.errors
    });
  }
  
  // Check for spam
  if (isSpam({ title, review })) {
    return res.status(400).json({
      success: false,
      errors: ['Your review was flagged as potential spam']
    });
  }
  
  // Sanitize input
  req.sanitizedData = sanitizeReview({
    name,
    email,
    rating: parseInt(rating),
    title,
    review
  });
  
  next();
}

/**
 * Middleware to validate admin password
 */
function adminAuthMiddleware(req, res, next) {
  const password = req.body.password || req.query.password;
  
  if (!password) {
    return res.status(401).json({
      success: false,
      error: 'Password required'
    });
  }
  
  if (!validateAdminPassword(password)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid admin password'
    });
  }
  
  // Set admin session
  res.locals.isAdmin = true;
  req.session = { isAdmin: true };
  
  next();
}

/**
 * Middleware to check if user is admin
 */
function checkAdminMiddleware(req, res, next) {
  const sessionPassword = req.cookies.adminPassword;
  
  if (!sessionPassword || !validateAdminPassword(sessionPassword)) {
    return res.status(401).redirect('/admin');
  }
  
  res.locals.isAdmin = true;
  next();
}

module.exports = {
  validateReview,
  validateEmail,
  validateRating,
  validateUUID,
  validateAdminPassword,
  sanitizeInput,
  sanitizeReview,
  calculateSimilarity,
  getEditDistance,
  isSpam,
  reviewValidationMiddleware,
  adminAuthMiddleware,
  checkAdminMiddleware
};
