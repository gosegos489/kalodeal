-- Existing names and approved images remain intact. No avatar history is kept.
ALTER TABLE "user"
ADD COLUMN "pendingAvatarKey" TEXT,
ADD COLUMN "avatarCleanupKey" TEXT;
