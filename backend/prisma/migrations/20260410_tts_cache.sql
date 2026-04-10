-- TTS Cache: store generated audio so replaying doesn't hit OpenAI again
CREATE TABLE IF NOT EXISTS `TtsCache` (
  `id`          VARCHAR(36)  NOT NULL,
  `textHash`    VARCHAR(64)  NOT NULL,
  `voice`       VARCHAR(20)  NOT NULL DEFAULT 'nova',
  `audioBase64` MEDIUMTEXT   NOT NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `TtsCache_textHash_voice_key` (`textHash`, `voice`),
  KEY `TtsCache_textHash_idx` (`textHash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
