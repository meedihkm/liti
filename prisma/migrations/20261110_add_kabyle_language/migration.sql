-- AlterTable
ALTER TABLE "Product" ADD COLUMN "nameKab" TEXT;
ALTER TABLE "Product" ADD COLUMN "descriptionKab" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "nameKab" TEXT;
ALTER TABLE "Category" ADD COLUMN "descriptionKab" TEXT;

-- AlterTable
ALTER TABLE "Fabric" ADD COLUMN "nameKab" TEXT;
ALTER TABLE "Fabric" ADD COLUMN "descriptionKab" TEXT;

-- AlterTable
ALTER TABLE "Color" ADD COLUMN "nameKab" TEXT;

-- AlterTable
ALTER TABLE "EmbroideryOption" ADD COLUMN "nameKab" TEXT;
ALTER TABLE "EmbroideryOption" ADD COLUMN "descriptionKab" TEXT;

-- AlterTable
ALTER TABLE "Gallery" ADD COLUMN "titleKab" TEXT;
ALTER TABLE "Gallery" ADD COLUMN "descriptionKab" TEXT;

-- AlterTable
ALTER TABLE "GalleryImage" ADD COLUMN "captionKab" TEXT;

-- AlterTable
ALTER TABLE "ContentBlock" ADD COLUMN "titleKab" TEXT;
ALTER TABLE "ContentBlock" ADD COLUMN "contentKab" TEXT;

-- AlterTable
ALTER TABLE "OrderAdvancement" ADD COLUMN "titleKab" TEXT;
ALTER TABLE "OrderAdvancement" ADD COLUMN "descriptionKab" TEXT;

-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN "titleKab" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "excerptKab" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "contentKab" TEXT;
