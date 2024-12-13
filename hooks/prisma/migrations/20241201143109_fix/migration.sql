/*
  Warnings:

  - You are about to drop the column `sortingOrder` on the `AvailableTriggers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "sortingOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "AvailableTriggers" DROP COLUMN "sortingOrder";
