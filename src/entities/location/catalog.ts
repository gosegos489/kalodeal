// Fixed product catalogue. Slugs are persisted identifiers; keep them stable when changing labels.
export const CYPRUS_LOCATIONS = [
  {
    slug: 'nicosia',
    name: 'Nicosia District',
    areas: [
      ['nicosia-city-centre', 'Nicosia City Centre'],
      ['strovolos', 'Strovolos'],
      ['lakatamia', 'Lakatamia'],
      ['aglantzia', 'Aglantzia'],
      ['engomi', 'Engomi'],
      ['agios-dometios', 'Agios Dometios'],
      ['latsia', 'Latsia'],
      ['geri', 'Geri'],
      ['tseri', 'Tseri'],
      ['dali', 'Dali'],
      ['kokkinotrimithia', 'Kokkinotrimithia'],
      ['kaimakli', 'Kaimakli'],
      ['pallouriotissa', 'Pallouriotissa'],
      ['acropolis', 'Acropolis'],
      ['archangelos', 'Archangelos'],
      ['anthoupoli', 'Anthoupoli'],
      ['deftera', 'Deftera'],
      ['lythrodontas', 'Lythrodontas'],
      ['kakopetria', 'Kakopetria']
    ]
  },
  {
    slug: 'limassol',
    name: 'Limassol District',
    areas: [
      ['limassol-city-centre', 'Limassol City Centre'],
      ['germasogeia', 'Germasogeia'],
      ['agios-athanasios', 'Agios Athanasios'],
      ['mesa-geitonia', 'Mesa Geitonia'],
      ['ypsonas', 'Ypsonas'],
      ['kato-polemidia', 'Kato Polemidia'],
      ['pano-polemidia', 'Pano Polemidia'],
      ['mouttagiaka', 'Mouttagiaka'],
      ['parekklisia', 'Parekklisia'],
      ['pyrgos', 'Pyrgos'],
      ['agios-tychonas', 'Agios Tychonas'],
      ['kolossi', 'Kolossi'],
      ['erimi', 'Erimi'],
      ['episkopi', 'Episkopi'],
      ['pissouri', 'Pissouri'],
      ['zakaki', 'Zakaki'],
      ['neapolis', 'Neapolis'],
      ['agia-fyla', 'Agia Fyla'],
      ['platres', 'Platres'],
      ['agros', 'Agros'],
      ['akrotiri', 'Akrotiri'],
      ['trachoni', 'Trachoni'],
      ['moni', 'Moni'],
      ['souni', 'Souni']
    ]
  },
  {
    slug: 'larnaca',
    name: 'Larnaca District',
    areas: [
      ['larnaca-city-centre', 'Larnaca City Centre'],
      ['aradippou', 'Aradippou'],
      ['livadia', 'Livadia'],
      ['oroklini', 'Oroklini'],
      ['pyla', 'Pyla'],
      ['kiti', 'Kiti'],
      ['pervolia', 'Pervolia'],
      ['dromolaxia', 'Dromolaxia'],
      ['meneou', 'Meneou'],
      ['tersefanou', 'Tersefanou'],
      ['mazotos', 'Mazotos'],
      ['athienou', 'Athienou'],
      ['lefkara', 'Lefkara'],
      ['xylotymvou', 'Xylotymvou'],
      ['xylofagou', 'Xylofagou'],
      ['ormideia', 'Ormideia'],
      ['kornos', 'Kornos'],
      ['zygi', 'Zygi'],
      ['mackenzie', 'Mackenzie'],
      ['finikoudes', 'Finikoudes'],
      ['skala', 'Skala'],
      ['kalavasos', 'Kalavasos']
    ]
  },
  {
    slug: 'paphos',
    name: 'Paphos District',
    areas: [
      ['paphos-city-centre', 'Paphos City Centre'],
      ['kato-paphos', 'Kato Paphos'],
      ['geroskipou', 'Geroskipou'],
      ['peyia', 'Peyia'],
      ['chloraka', 'Chloraka'],
      ['emba', 'Emba'],
      ['tala', 'Tala'],
      ['kissonerga', 'Kissonerga'],
      ['konia', 'Konia'],
      ['mesogi', 'Mesogi'],
      ['tsada', 'Tsada'],
      ['polis-chrysochous', 'Polis Chrysochous'],
      ['latchi', 'Latchi'],
      ['argaka', 'Argaka'],
      ['kouklia', 'Kouklia'],
      ['timi', 'Timi'],
      ['mandria', 'Mandria'],
      ['anavargos', 'Anavargos'],
      ['universal', 'Universal'],
      ['tombs-of-the-kings', 'Tombs of the Kings'],
      ['tremithousa', 'Tremithousa'],
      ['kathikas', 'Kathikas']
    ]
  },
  {
    slug: 'famagusta',
    name: 'Famagusta District',
    areas: [
      ['paralimni', 'Paralimni'],
      ['ayia-napa', 'Ayia Napa'],
      ['protaras', 'Protaras'],
      ['deryneia', 'Deryneia'],
      ['sotira', 'Sotira'],
      ['frenaros', 'Frenaros'],
      ['liopetri', 'Liopetri'],
      ['avgorou', 'Avgorou'],
      ['kapparis', 'Kapparis'],
      ['pernera', 'Pernera'],
      ['agia-thekla', 'Agia Thekla'],
      ['agia-triada', 'Agia Triada'],
      ['vrysoulles', 'Vrysoulles'],
      ['dasaki-achnas', 'Dasaki Achnas'],
      ['cape-greco', 'Cape Greco']
    ]
  }
] as const

export type DistrictSlug = (typeof CYPRUS_LOCATIONS)[number]['slug']
export type AreaSlug = (typeof CYPRUS_LOCATIONS)[number]['areas'][number][0]
export type ListingLocation = { district: string | null; area: string | null }

export function getDistrict(slug: unknown) {
  return CYPRUS_LOCATIONS.find((district) => district.slug === slug)
}

export function getAreas(district: unknown): { value: AreaSlug; label: string }[] {
  return getDistrict(district)?.areas.map(([value, label]) => ({ value, label })) ?? []
}

export function isAreaInDistrict(district: unknown, area: unknown) {
  return getDistrict(district)?.areas.some(([slug]) => slug === area) ?? false
}

// Also formats a district-only search. Unknown/legacy values never expose raw slugs.
export function formatLocation({ district, area }: ListingLocation) {
  const selectedDistrict = getDistrict(district)
  if (!selectedDistrict) return null
  const selectedArea = selectedDistrict.areas.find(([slug]) => slug === area)
  return selectedArea ? `${selectedArea[1]}, ${selectedDistrict.name}` : selectedDistrict.name
}
