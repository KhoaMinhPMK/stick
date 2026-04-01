-- Add Spaced Repetition fields to VocabNotebookItem
ALTER TABLE `VocabNotebookItem` ADD COLUMN `nextReviewAt` DATETIME NULL;
ALTER TABLE `VocabNotebookItem` ADD COLUMN `easeFactor` DOUBLE NOT NULL DEFAULT 2.5;
ALTER TABLE `VocabNotebookItem` ADD COLUMN `reviewInterval` INT NOT NULL DEFAULT 0;
ALTER TABLE `VocabNotebookItem` ADD COLUMN `reviewCount` INT NOT NULL DEFAULT 0;

-- Index for efficient "due for review" queries
CREATE INDEX `idx_vocab_review` ON `VocabNotebookItem` (`userId`, `nextReviewAt`);
