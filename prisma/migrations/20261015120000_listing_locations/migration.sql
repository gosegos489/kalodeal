-- Add nullable fields so existing listings retain an unspecified location.
ALTER TABLE "listing" ADD COLUMN "district" TEXT, ADD COLUMN "area" TEXT;

-- Offline snapshot of src/entities/location/catalog.ts. No seed or data backfill is needed.
-- Explicit NOT NULL guards prevent SQL CHECK's UNKNOWN result from allowing half-filled pairs.
ALTER TABLE "listing" ADD CONSTRAINT "listing_location_catalog_check" CHECK (
  ("district" IS NULL AND "area" IS NULL) OR
  ("district" IS NOT NULL AND "area" IS NOT NULL AND (
      ("district" = 'nicosia' AND "area" IN ('nicosia-city-centre', 'strovolos', 'lakatamia', 'aglantzia', 'engomi', 'agios-dometios', 'latsia', 'geri', 'tseri', 'dali', 'kokkinotrimithia', 'kaimakli', 'pallouriotissa', 'acropolis', 'archangelos', 'anthoupoli', 'deftera', 'lythrodontas', 'kakopetria')) OR
      ("district" = 'limassol' AND "area" IN ('limassol-city-centre', 'germasogeia', 'agios-athanasios', 'mesa-geitonia', 'ypsonas', 'kato-polemidia', 'pano-polemidia', 'mouttagiaka', 'parekklisia', 'pyrgos', 'agios-tychonas', 'kolossi', 'erimi', 'episkopi', 'pissouri', 'zakaki', 'neapolis', 'agia-fyla', 'platres', 'agros', 'akrotiri', 'trachoni', 'moni', 'souni')) OR
      ("district" = 'larnaca' AND "area" IN ('larnaca-city-centre', 'aradippou', 'livadia', 'oroklini', 'pyla', 'kiti', 'pervolia', 'dromolaxia', 'meneou', 'tersefanou', 'mazotos', 'athienou', 'lefkara', 'xylotymvou', 'xylofagou', 'ormideia', 'kornos', 'zygi', 'mackenzie', 'finikoudes', 'skala', 'kalavasos')) OR
      ("district" = 'paphos' AND "area" IN ('paphos-city-centre', 'kato-paphos', 'geroskipou', 'peyia', 'chloraka', 'emba', 'tala', 'kissonerga', 'konia', 'mesogi', 'tsada', 'polis-chrysochous', 'latchi', 'argaka', 'kouklia', 'timi', 'mandria', 'anavargos', 'universal', 'tombs-of-the-kings', 'tremithousa', 'kathikas')) OR
      ("district" = 'famagusta' AND "area" IN ('paralimni', 'ayia-napa', 'protaras', 'deryneia', 'sotira', 'frenaros', 'liopetri', 'avgorou', 'kapparis', 'pernera', 'agia-thekla', 'agia-triada', 'vrysoulles', 'dasaki-achnas', 'cape-greco'))
  ))
);

-- District-only and district+area browse both retain sortDate/id ordering.
CREATE INDEX "listing_status_district_sortDate_id_idx" ON "listing"("status", "district", "sortDate", "id");
CREATE INDEX "listing_status_district_area_sortDate_id_idx" ON "listing"("status", "district", "area", "sortDate", "id");
