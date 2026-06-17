-- CreateIndex
CREATE UNIQUE INDEX "Friendship_user_pair_key"
ON "Friendship" (
    LEAST("requesterId", "addresseeId"),
    GREATEST("requesterId", "addresseeId")
);
