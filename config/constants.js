/**
 * Application Constants
 * Centralized configuration for the review website
 */

const BAD_WORDS = [
  'badword1',
  'badword2',
  'badword3',
  'inappropriate1',
  'inappropriate2'
  // Add more bad words as needed
];

const RATING_LABELS = {
  5: 'Excellent',
  4: 'Good',
  3: 'Average',
  2: 'Poor',
  1: 'Terrible'
};

const REVIEW_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  FLAGGED: 'flagged'
};

const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  HIGHEST_RATING: 'highest_rating',
  LOWEST_RATING: 'lowest_rating',
  MOST_HELPFUL: 'most_helpful',
  MOST_LIKES: 'most_likes'
};

const FILTER_OPTIONS = {
  ALL: 'all',
  VERIFIED: 'verified',
  PINNED: 'pinned',
  STAR_5: 5,
  STAR_4: 4,
  STAR_3: 3,
  STAR_2: 2,
  STAR_1: 1
};

const ACTIVITY_TYPES = {
  REVIEW_CREATED: 'review_created',
  REVIEW_UPDATED: 'review_updated',
  REVIEW_DELETED: 'review_deleted',
  REVIEW_VERIFIED: 'review_verified',
  REVIEW_UNVERIFIED: 'review_unverified',
  REVIEW_PINNED: 'review_pinned',
  REVIEW_UNPINNED: 'review_unpinned',
  REVIEW_LIKE: 'review_like',
  REVIEW_DISLIKE: 'review_dislike',
  REVIEW_HELPFUL: 'review_helpful',
  IMPORT: 'reviews_imported',
  EXPORT: 'reviews_exported'
};

const ERROR_MESSAGES = {
  INVALID_RATING: 'Rating must be between 1 and 5',
  INVALID_EMAIL: 'Please enter a valid email address',
  MISSING_REQUIRED_FIELDS: 'All required fields must be filled',
  REVIEW_TOO_SHORT: 'Review must be at least {min} characters long',
  REVIEW_TOO_LONG: 'Review must not exceed {max} characters',
  TITLE_TOO_SHORT: 'Title must be at least {min} characters long',
  TITLE_TOO_LONG: 'Title must not exceed {max} characters',
  DUPLICATE_REVIEW: 'A review with similar content already exists',
  SPAM_DETECTED: 'Your review was flagged as potential spam',
  BAD_WORDS_DETECTED: 'Your review contains inappropriate language',
  REVIEW_NOT_FOUND: 'Review not found',
  INVALID_ID: 'Invalid review ID',
  ADMIN_ONLY: 'This action requires admin access',
  INVALID_PASSWORD: 'Invalid admin password',
  UNAUTHORIZED: 'You are not authorized to perform this action'
};

const SUCCESS_MESSAGES = {
  REVIEW_CREATED: 'Your review has been submitted successfully',
  REVIEW_UPDATED: 'Review updated successfully',
  REVIEW_DELETED: 'Review deleted successfully',
  REVIEW_VERIFIED: 'Review verified successfully',
  REVIEW_PINNED: 'Review pinned successfully',
  LIKE_ADDED: 'Like added',
  HELPFUL_MARKED: 'Marked as helpful',
  EXPORT_SUCCESS: 'Reviews exported successfully',
  IMPORT_SUCCESS: 'Reviews imported successfully',
  LOGIN_SUCCESS: 'Logged in successfully'
};

const VALIDATION_RULES = {
  MIN_REVIEW_LENGTH: parseInt(process.env.MIN_REVIEW_LENGTH || 10),
  MAX_REVIEW_LENGTH: parseInt(process.env.MAX_REVIEW_LENGTH || 5000),
  MIN_TITLE_LENGTH: parseInt(process.env.MIN_TITLE_LENGTH || 5),
  MAX_TITLE_LENGTH: parseInt(process.env.MAX_TITLE_LENGTH || 200),
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  DUPLICATE_CHECK_THRESHOLD: 0.8, // 80% similarity
  SPAM_CHECK_ENABLED: process.env.SPAM_CHECK_ENABLED === 'true',
  DUPLICATE_CHECK_ENABLED: process.env.DUPLICATE_CHECK_ENABLED === 'true',
  BAD_WORDS_FILTER_ENABLED: process.env.BAD_WORDS_FILTER_ENABLED === 'true'
};

const PAGINATION = {
  DEFAULT_LIMIT: parseInt(process.env.PAGINATION_LIMIT || 10),
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1
};

const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  NAME: /^[a-zA-Z\s'-]{2,100}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/
};

const CACHE_SETTINGS = {
  STATS_CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  REVIEWS_CACHE_TIME: 1 * 60 * 1000 // 1 minute
};

const RESPONSE_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500
};

const TIME_FORMATS = {
  DISPLAY: 'YYYY-MM-DD HH:mm:ss',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD'
};

const FEATURES = {
  DARK_MODE: process.env.ENABLE_DARK_MODE === 'true',
  EXPORT: process.env.ENABLE_REVIEWS_EXPORT === 'true',
  IMPORT: process.env.ENABLE_REVIEWS_IMPORT === 'true',
  ANALYTICS: process.env.ENABLE_ANALYTICS === 'true'
};

module.exports = {
  BAD_WORDS,
  RATING_LABELS,
  REVIEW_STATUS,
  SORT_OPTIONS,
  FILTER_OPTIONS,
  ACTIVITY_TYPES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES,
  PAGINATION,
  REGEX_PATTERNS,
  CACHE_SETTINGS,
  RESPONSE_CODES,
  TIME_FORMATS,
  FEATURES
};
