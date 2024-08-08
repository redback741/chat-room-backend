/*
  Warnings:

  - You are about to drop the `Friendsip` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Friendsip` DROP FOREIGN KEY `Friendsip_friendId_fkey`;

-- DropForeignKey
ALTER TABLE `Friendsip` DROP FOREIGN KEY `Friendsip_userId_fkey`;

-- DropTable
DROP TABLE `Friendsip`;

-- CreateTable
CREATE TABLE `Friendship` (
    `userId` INTEGER NOT NULL,
    `friendId` INTEGER NOT NULL,

    PRIMARY KEY (`userId`, `friendId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Friendship` ADD CONSTRAINT `Friendship_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Friendship` ADD CONSTRAINT `Friendship_friendId_fkey` FOREIGN KEY (`friendId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
