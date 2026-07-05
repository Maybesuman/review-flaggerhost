const fs = require('fs');
const path = require('path');

// Path to the database file
const dbPath = path.join(__dirname, 'db.json');

/**
 * Default database structure
 */
const defaultDb = {
  reviews: [],
  settings: {
    averageRating: 0,
    totalReviews: 0,
    verifiedReviews: 0,
    pinnedReviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  activityLogs: [],
  backups: []
};

/**
 * Initialize database if it doesn't exist
 */
function initDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
      console.log('✓ Database initialized at db.json');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

/**
 * Read the entire database
 * @returns {Object} Database object
 */
function getDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      initDb();
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return defaultDb;
  }
}

/**
 * Write updated data back to database
 * @param {Object} data - Data to write
 */
function saveDb(data) {
  try {
    // Update the updatedAt timestamp
    data.settings.updatedAt = new Date().toISOString();
    
    // Write to file
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving database:', error);
    return false;
  }
}

/**
 * Get all reviews
 * @returns {Array} Array of reviews
 */
function getReviews() {
  const db = getDb();
  return db.reviews || [];
}

/**
 * Get a review by ID
 * @param {String} id - Review UUID
 * @returns {Object|null} Review object or null
 */
function getReviewById(id) {
  const reviews = getReviews();
  return reviews.find(review => review.id === id) || null;
}

/**
 * Add a new review
 * @param {Object} reviewData - Review data
 * @returns {Object} Created review
 */
function addReview(reviewData) {
  const db = getDb();
  const newReview = {
    ...reviewData,
    createdAt: new Date().toISOString(),
    likes: 0,
    dislikes: 0,
    helpfulCount: 0,
    verified: false,
    pinned: false
  };
  
  db.reviews.push(newReview);
  updateSettings(db);
  saveDb(db);
  
  return newReview;
}

/**
 * Update a review
 * @param {String} id - Review UUID
 * @param {Object} updateData - Data to update
 * @returns {Object|null} Updated review or null
 */
function updateReview(id, updateData) {
  const db = getDb();
  const reviewIndex = db.reviews.findIndex(review => review.id === id);
  
  if (reviewIndex === -1) {
    return null;
  }
  
  db.reviews[reviewIndex] = {
    ...db.reviews[reviewIndex],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  updateSettings(db);
  saveDb(db);
  
  return db.reviews[reviewIndex];
}

/**
 * Delete a review
 * @param {String} id - Review UUID
 * @returns {Boolean} Success status
 */
function deleteReview(id) {
  const db = getDb();
  const initialLength = db.reviews.length;
  
  db.reviews = db.reviews.filter(review => review.id !== id);
  
  if (db.reviews.length < initialLength) {
    updateSettings(db);
    saveDb(db);
    return true;
  }
  
  return false;
}

/**
 * Verify a review
 * @param {String} id - Review UUID
 * @returns {Object|null} Updated review or null
 */
function verifyReview(id) {
  return updateReview(id, { verified: true, verifiedAt: new Date().toISOString() });
}

/**
 * Unverify a review
 * @param {String} id - Review UUID
 * @returns {Object|null} Updated review or null
 */
function unverifyReview(id) {
  return updateReview(id, { verified: false, verifiedAt: null });
}

/**
 * Pin a review
 * @param {String} id - Review UUID
 * @returns {Object|null} Updated review or null
 */
function pinReview(id) {
  return updateReview(id, { pinned: true, pinnedAt: new Date().toISOString() });
}

/**
 * Unpin a review
 * @param {String} id - Review UUID
 * @returns {Object|null} Updated review or null
 */
function unpinReview(id) {
  return updateReview(id, { pinned: false, pinnedAt: null });
}

/**
 * Increment likes count
 * @param {String} id - Review UUID
 * @returns {Object|null} Updated review or null
 */
function incrementLikes(id) {
  const review = getReviewById(id);
  if (!review) return null;
  
  return updateReview(id, { likes: (review.likes || 0) + 1 });
}

/**
 * Increment dislikes count
 * @param {String} id - Review UUID
 * @returns {Object|null} Updated review or null
 */
function incrementDislikes(id) {
  const review = getReviewById(id);
  if (!review) return null;
  
  return updateReview(id, { dislikes: (review.dislikes || 0) + 1 });
}

/**
 * Increment helpful count
 * @param {String} id - Review UUID
 * @returns {Object|null} Updated review or null
 */
function incrementHelpful(id) {
  const review = getReviewById(id);
  if (!review) return null;
  
  return updateReview(id, { helpfulCount: (review.helpfulCount || 0) + 1 });
}

/**
 * Update settings (average rating, total reviews, etc)
 * @param {Object} db - Database object
 */
function updateSettings(db) {
  const reviews = db.reviews;
  
  if (reviews.length === 0) {
    db.settings.averageRating = 0;
    db.settings.totalReviews = 0;
    db.settings.verifiedReviews = 0;
  } else {
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    db.settings.averageRating = parseFloat((totalRating / reviews.length).toFixed(2));
    db.settings.totalReviews = reviews.length;
    db.settings.verifiedReviews = reviews.filter(review => review.verified).length;
  }
  
  db.settings.updatedAt = new Date().toISOString();
}

/**
 * Get database settings
 * @returns {Object} Settings object
 */
function getSettings() {
  const db = getDb();
  return db.settings || {};
}

/**
 * Get statistics
 * @returns {Object} Statistics object
 */
function getStats() {
  const reviews = getReviews();
  const settings = getSettings();
  
  // Calculate rating distribution
  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };
  
  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingDistribution[review.rating]++;
    }
  });
  
  return {
    totalReviews: settings.totalReviews,
    averageRating: settings.averageRating,
    verifiedReviews: settings.verifiedReviews,
    ratingDistribution,
    totalLikes: reviews.reduce((sum, review) => sum + (review.likes || 0), 0),
    totalDislikes: reviews.reduce((sum, review) => sum + (review.dislikes || 0), 0),
    totalHelpful: reviews.reduce((sum, review) => sum + (review.helpfulCount || 0), 0)
  };
}

/**
 * Add activity log
 * @param {Object} logData - Log data
 */
function addActivityLog(logData) {
  const db = getDb();
  
  if (!db.activityLogs) {
    db.activityLogs = [];
  }
  
  db.activityLogs.push({
    ...logData,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 1000 logs
  if (db.activityLogs.length > 1000) {
    db.activityLogs = db.activityLogs.slice(-1000);
  }
  
  saveDb(db);
}

/**
 * Get activity logs
 * @param {Number} limit - Number of logs to return
 * @returns {Array} Activity logs
 */
function getActivityLogs(limit = 50) {
  const db = getDb();
  const logs = db.activityLogs || [];
  return logs.slice(-limit).reverse();
}

/**
 * Export reviews to JSON
 * @returns {String} JSON string
 */
function exportReviews() {
  const db = getDb();
  return JSON.stringify(db.reviews, null, 2);
}

/**
 * Import reviews from JSON
 * @param {String} jsonData - JSON string
 * @returns {Boolean} Success status
 */
function importReviews(jsonData) {
  try {
    const importedReviews = JSON.parse(jsonData);
    
    if (!Array.isArray(importedReviews)) {
      return false;
    }
    
    const db = getDb();
    db.reviews = importedReviews;
    updateSettings(db);
    saveDb(db);
    
    return true;
  } catch (error) {
    console.error('Error importing reviews:', error);
    return false;
  }
}

/**
 * Create a backup of the database
 * @returns {Boolean} Success status
 */
function createBackup() {
  try {
    const db = getDb();
    const backupPath = path.join(__dirname, 'backups', `backup-${Date.now()}.json`);
    
    // Create backups directory if it doesn't exist
    const backupsDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    fs.writeFileSync(backupPath, JSON.stringify(db, null, 2));
    
    // Track backup in database
    db.backups = db.backups || [];
    db.backups.push({
      file: backupPath,
      createdAt: new Date().toISOString(),
      reviewCount: db.reviews.length
    });
    
    // Keep only last 10 backups
    if (db.backups.length > 10) {
      const oldBackup = db.backups.shift();
      if (fs.existsSync(oldBackup.file)) {
        fs.unlinkSync(oldBackup.file);
      }
    }
    
    saveDb(db);
    return true;
  } catch (error) {
    console.error('Error creating backup:', error);
    return false;
  }
}

/**
 * Clear all reviews (use with caution)
 * @returns {Boolean} Success status
 */
function clearReviews() {
  try {
    const db = getDb();
    db.reviews = [];
    updateSettings(db);
    saveDb(db);
    return true;
  } catch (error) {
    console.error('Error clearing reviews:', error);
    return false;
  }
}

// Initialize database on module load
initDb();

// Export all functions
module.exports = {
  // Basic operations
  getDb,
  saveDb,
  initDb,
  
  // Review operations
  getReviews,
  getReviewById,
  addReview,
  updateReview,
  deleteReview,
  
  // Review status operations
  verifyReview,
  unverifyReview,
  pinReview,
  unpinReview,
  
  // Interaction operations
  incrementLikes,
  incrementDislikes,
  incrementHelpful,
  
  // Settings and stats
  getSettings,
  updateSettings,
  getStats,
  
  // Activity logs
  addActivityLog,
  getActivityLogs,
  
  // Import/Export
  exportReviews,
  importReviews,
  
  // Backup
  createBackup,
  
  // Utility
  clearReviews
};
