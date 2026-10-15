-- Prepared offline; not applied. Catalogue keys and existing vehicle rows remain
-- unchanged. Names are user content used only with the explicit "other" keys.
ALTER TABLE "vehicle_details"
    ADD COLUMN "otherMake" VARCHAR(60),
    ADD COLUMN "otherModel" VARCHAR(80);

ALTER TABLE "vehicle_details"
    ADD CONSTRAINT "vehicle_details_other_make_check"
        CHECK ((("make" = 'other') IS TRUE) = ("otherMake" IS NOT NULL)),
    ADD CONSTRAINT "vehicle_details_other_model_check"
        CHECK ((("model" = 'other') IS TRUE) = ("otherModel" IS NOT NULL)),
    ADD CONSTRAINT "vehicle_details_other_make_model_check"
        CHECK ("make" IS DISTINCT FROM 'other' OR "model" IS NULL OR "model" = 'other'),
    ADD CONSTRAINT "vehicle_details_other_make_name_check"
        CHECK ("otherMake" IS NULL OR ("otherMake" = btrim("otherMake") AND char_length("otherMake") BETWEEN 1 AND 60 AND "otherMake" !~ '[[:cntrl:]<>]')),
    ADD CONSTRAINT "vehicle_details_other_model_name_check"
        CHECK ("otherModel" IS NULL OR ("otherModel" = btrim("otherModel") AND char_length("otherModel") BETWEEN 1 AND 80 AND "otherModel" !~ '[[:cntrl:]<>]'));
