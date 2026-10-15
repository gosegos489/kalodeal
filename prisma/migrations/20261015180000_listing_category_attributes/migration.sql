-- Prepared offline from local schemas. NOT applied. No category/status backfill.
-- Review deployment locks for ALTER TABLE and the listing price index.
-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND', 'ROOM', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyParking" AS ENUM ('NONE', 'COVERED', 'UNCOVERED', 'GARAGE');

-- CreateEnum
CREATE TYPE "PropertyFurnishing" AS ENUM ('UNFURNISHED', 'PART_FURNISHED', 'FURNISHED');

-- CreateEnum
CREATE TYPE "PropertyEnergyRating" AS ENUM ('A_PLUS', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'EXEMPT');

-- CreateEnum
CREATE TYPE "PropertyAmenity" AS ENUM ('POOL', 'GARDEN', 'ELEVATOR', 'ALARM', 'FIREPLACE', 'BALCONY', 'PLAYROOM', 'ATTIC_LOFT', 'STORAGE_ROOM');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'MOTORCYCLE', 'VAN');

-- CreateEnum
CREATE TYPE "VehicleFuel" AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'PLUG_IN_HYBRID', 'ELECTRIC', 'LPG', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleTransmission" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "VehicleBodyType" AS ENUM ('HATCHBACK', 'SALOON', 'ESTATE', 'SUV', 'COUPE', 'CONVERTIBLE', 'PICKUP', 'PANEL_VAN', 'MINIBUS', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('NEW', 'USED', 'DAMAGED');

-- CreateEnum
CREATE TYPE "VehicleColor" AS ENUM ('BLACK', 'WHITE', 'SILVER', 'GREY', 'BLUE', 'RED', 'GREEN', 'BROWN', 'BEIGE', 'YELLOW', 'ORANGE', 'PURPLE', 'GOLD', 'OTHER');

-- CreateEnum
CREATE TYPE "ListingPricePeriod" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- AlterTable
ALTER TABLE "listing" ADD COLUMN     "priceNegotiable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pricePeriod" "ListingPricePeriod";

-- CreateTable
CREATE TABLE "property_details" (
    "listingId" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "plotArea" DECIMAL(12,2),
    "propertyArea" DECIMAL(10,2),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "constructionYear" INTEGER,
    "parking" "PropertyParking",
    "airConditioning" BOOLEAN,
    "furnishing" "PropertyFurnishing",
    "petsAllowed" BOOLEAN,
    "onlineViewing" BOOLEAN,
    "energyRating" "PropertyEnergyRating",
    "postalCode" VARCHAR(16),
    "amenities" "PropertyAmenity"[] NOT NULL DEFAULT ARRAY[]::"PropertyAmenity"[],

    CONSTRAINT "property_details_pkey" PRIMARY KEY ("listingId")
);

-- CreateTable
CREATE TABLE "vehicle_details" (
    "listingId" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "make" VARCHAR(40),
    "model" VARCHAR(60),
    "year" INTEGER,
    "mileage" INTEGER,
    "fuel" "VehicleFuel",
    "transmission" "VehicleTransmission",
    "bodyType" "VehicleBodyType",
    "engineCapacity" INTEGER,
    "seats" INTEGER,
    "doors" INTEGER,
    "condition" "VehicleCondition",
    "color" "VehicleColor",

    CONSTRAINT "vehicle_details_pkey" PRIMARY KEY ("listingId")
);

-- CreateIndex
CREATE INDEX "property_details_propertyType_bedrooms_propertyArea_listing_idx" ON "property_details"("propertyType", "bedrooms", "propertyArea", "listingId");

-- CreateIndex
CREATE INDEX "vehicle_details_vehicleType_make_model_year_listingId_idx" ON "vehicle_details"("vehicleType", "make", "model", "year", "listingId");

-- CreateIndex
CREATE INDEX "listing_status_categoryId_currency_price_id_idx" ON "listing"("status", "categoryId", "currency", "price", "id");

-- AddForeignKey
ALTER TABLE "property_details" ADD CONSTRAINT "property_details_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_details" ADD CONSTRAINT "vehicle_details_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Static storage bounds. The shared TS schema also limits years to next year
-- and validates category applicability and catalogue make/model membership.
ALTER TABLE "property_details"
    ADD CONSTRAINT "property_details_plot_area_check" CHECK ("plotArea" BETWEEN 0.01 AND 1000000000),
    ADD CONSTRAINT "property_details_property_area_check" CHECK ("propertyArea" BETWEEN 0.01 AND 1000000),
    ADD CONSTRAINT "property_details_bedrooms_check" CHECK ("bedrooms" BETWEEN 0 AND 100),
    ADD CONSTRAINT "property_details_bathrooms_check" CHECK ("bathrooms" BETWEEN 0 AND 100),
    ADD CONSTRAINT "property_details_construction_year_check" CHECK ("constructionYear" BETWEEN 1000 AND 2100),
    ADD CONSTRAINT "property_details_postal_code_check" CHECK ("postalCode" ~ '^[A-Za-z0-9]+([ -][A-Za-z0-9]+)*$'),
    ADD CONSTRAINT "property_details_amenities_check" CHECK (array_position("amenities", NULL) IS NULL);

ALTER TABLE "vehicle_details"
    ADD CONSTRAINT "vehicle_details_year_check" CHECK ("year" BETWEEN 1886 AND 2100),
    ADD CONSTRAINT "vehicle_details_mileage_check" CHECK ("mileage" BETWEEN 0 AND 10000000),
    ADD CONSTRAINT "vehicle_details_engine_capacity_check" CHECK ("engineCapacity" BETWEEN 1 AND 100000),
    ADD CONSTRAINT "vehicle_details_seats_check" CHECK ("seats" BETWEEN 1 AND 100),
    ADD CONSTRAINT "vehicle_details_doors_check" CHECK ("doors" BETWEEN 1 AND 10),
    ADD CONSTRAINT "vehicle_details_make_check" CHECK ("make" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT "vehicle_details_model_check" CHECK ("model" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND ("model" IS NULL OR "make" IS NOT NULL)),
    ADD CONSTRAINT "vehicle_details_motorcycle_check" CHECK ("vehicleType" <> 'MOTORCYCLE' OR ("doors" IS NULL AND "bodyType" IS NULL AND ("seats" IS NULL OR "seats" <= 2))),
    ADD CONSTRAINT "vehicle_details_electric_engine_check" CHECK ("fuel" <> 'ELECTRIC' OR "engineCapacity" IS NULL);
