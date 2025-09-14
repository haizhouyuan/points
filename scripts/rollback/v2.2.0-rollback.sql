-- Rollback script for Phase 2.2+2.4 Major Refactor
-- Version: v2.2.0-major-refactor
-- Target: v2.1.9-stable
-- Created: 2025-09-13

-- =============================================================================
-- FAMILY MODEL ROLLBACK
-- =============================================================================

-- If family model structure was simplified, restore original structure
-- Note: Backup family collection before running this script
-- mongodump --db vacation_planning --collection families --out backup/

-- Example rollback for family model changes:
-- db.families.updateMany(
--   {},
--   {
--     $unset: { 
--       "newField": "",
--       "refactoredField": "" 
--     },
--     $rename: {
--       "simplifiedField": "originalComplexField"
--     }
--   }
-- );

-- =============================================================================
-- INDEX ROLLBACK
-- =============================================================================

-- Restore original indexes if they were modified
-- db.families.createIndex({ "originalField": 1 });
-- db.users.createIndex({ "parentId": 1, "role": 1 });

-- =============================================================================
-- COLLECTION RESTORATION
-- =============================================================================

-- If collections were dropped, restore from backup:
-- mongorestore --db vacation_planning --collection analytics backup/vacation_planning/analytics.bson
-- mongorestore --db vacation_planning --collection notifications backup/vacation_planning/notifications.bson
-- mongorestore --db vacation_planning --collection social backup/vacation_planning/social.bson

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify rollback success:
-- db.families.countDocuments({});
-- db.users.find({}).limit(5);
-- db.analytics.countDocuments({});

-- =============================================================================
-- ROLLBACK COMPLETION MARKER
-- =============================================================================

-- db.metadata.insertOne({
--   "rollback": {
--     "version": "v2.1.9-stable",
--     "from": "v2.2.0-major-refactor", 
--     "date": new Date(),
--     "status": "completed"
--   }
-- });

print("Rollback script v2.2.0 -> v2.1.9 prepared");
print("IMPORTANT: Create database backup before execution");
print("IMPORTANT: Test on staging environment first");