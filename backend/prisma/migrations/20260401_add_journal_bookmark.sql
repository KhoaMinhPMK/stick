-- Add isBookmarked column to Journal table
ALTER TABLE `Journal`
  ADD COLUMN `isBookmarked` TINYINT(1) NOT NULL DEFAULT 0;
