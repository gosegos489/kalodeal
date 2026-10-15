import type { VehicleType } from '@/generated/prisma/enums'

export type VehicleModel = {
  readonly key: string
  readonly label: string
  readonly vehicleTypes: readonly VehicleType[]
  readonly aliases?: readonly string[]
}
export type VehicleMake = {
  readonly key: string
  readonly label: string
  readonly models: readonly VehicleModel[]
}

type ModelEntry = readonly [key: string, label: string, aliases?: readonly string[]]
const models = (vehicleTypes: readonly VehicleType[], entries: readonly ModelEntry[]): VehicleModel[] =>
  entries.map(([key, label, aliases]) => ({ key, label, vehicleTypes, ...(aliases ? { aliases } : {}) }))

// Keys are persisted identifiers. Extend this catalogue without removing or
// renaming them. Aliases group common import names without duplicate model rows.
// This is a curated new/used model list, not a year/engine/trim compatibility DB.
// CAR/VAN overlap covers passenger/cargo versions and existing pickup categories.
// Sources checked 2026-10-15: manufacturer ranges/archives, Cyprus distributors:
// https://newsroom.toyota.eu/line-up/
// https://www.toyota-global.com/company/history_of_toyota/75years/vehicle_lineage/car/id60017505/index.html
// https://www.nissan.com.cy/range/crossovers.html
// https://www.honda.co.jp/customer/auto-archive/
// https://www.mazda.com.cy/home
// https://www.bmw.com.cy/en/all-models.html
// https://www.mercedes-benz.com.cy/vans/
// https://www.volkswagen-vans.co.uk/en/new-vehicles.html
// https://www.yamaha-motor.eu/gb/en/motorcycles/
// https://www.kawasaki.eu/en/Motorcycles.html
// https://www.sym.com.cy/scooters/
// https://www.piaggio.com/en_EN/models/nrg/
export const VEHICLE_CATALOG_VERSION = 2
export const OTHER_VEHICLE_MAKE = 'other'
export const OTHER_VEHICLE_MODEL = 'other'
export const VEHICLE_CATALOG = [
  {
    key: 'toyota',
    label: 'Toyota',
    models: [
      ...models(
        ['CAR'],
        [
          ['yaris', 'Yaris / Vitz', ['Vitz']],
          ['yaris-cross', 'Yaris Cross'],
          ['aygo', 'Aygo'],
          ['aygo-x', 'Aygo X'],
          ['corolla', 'Corolla'],
          ['corolla-cross', 'Corolla Cross'],
          ['auris', 'Auris'],
          ['avensis', 'Avensis'],
          ['prius', 'Prius'],
          ['aqua', 'Aqua'],
          ['c-hr', 'C-HR'],
          ['rav4', 'RAV4'],
          ['camry', 'Camry'],
          ['land-cruiser', 'Land Cruiser'],
          ['iq', 'iQ'],
          ['gt86', 'GT86'],
          ['supra', 'Supra']
        ]
      ),
      ...models(['CAR', 'VAN'], [['hilux', 'Hilux']]),
      ...models(
        ['VAN'],
        [
          ['hiace', 'Hiace'],
          ['proace', 'Proace'],
          ['proace-city', 'Proace City']
        ]
      )
    ]
  },
  {
    key: 'nissan',
    label: 'Nissan',
    models: [
      ...models(
        ['CAR'],
        [
          ['micra', 'Micra / March', ['March']],
          ['note', 'Note'],
          ['juke', 'Juke'],
          ['qashqai', 'Qashqai'],
          ['x-trail', 'X-Trail'],
          ['leaf', 'Leaf'],
          ['pulsar', 'Pulsar'],
          ['almera', 'Almera'],
          ['tiida', 'Tiida'],
          ['sunny', 'Sunny'],
          ['serena', 'Serena'],
          ['ariya', 'Ariya'],
          ['370z', '370Z'],
          ['gt-r', 'GT-R']
        ]
      ),
      ...models(['CAR', 'VAN'], [['navara', 'Navara']]),
      ...models(
        ['VAN'],
        [
          ['nv200', 'NV200 / e-NV200', ['e-NV200']],
          ['nv300', 'NV300'],
          ['nv400', 'NV400'],
          ['townstar', 'Townstar'],
          ['primastar', 'Primastar'],
          ['interstar', 'Interstar']
        ]
      )
    ]
  },
  {
    key: 'bmw',
    label: 'BMW',
    models: [
      ...models(
        ['CAR'],
        [
          ['1-series', '1 Series'],
          ['2-series', '2 Series'],
          ['3-series', '3 Series'],
          ['4-series', '4 Series'],
          ['5-series', '5 Series'],
          ['6-series', '6 Series'],
          ['7-series', '7 Series'],
          ['8-series', '8 Series'],
          ['x1', 'X1'],
          ['x2', 'X2'],
          ['x3', 'X3'],
          ['x4', 'X4'],
          ['x5', 'X5'],
          ['x6', 'X6'],
          ['x7', 'X7'],
          ['i3', 'i3'],
          ['i4', 'i4'],
          ['i7', 'i7'],
          ['i8', 'i8'],
          ['ix', 'iX'],
          ['ix1', 'iX1']
        ]
      ),
      ...models(
        ['MOTORCYCLE'],
        [
          ['g-310-r', 'G 310 R'],
          ['g-310-gs', 'G 310 GS'],
          ['f-750-gs', 'F 750 GS'],
          ['f-850-gs', 'F 850 GS'],
          ['f-900-r', 'F 900 R'],
          ['f-900-xr', 'F 900 XR'],
          ['r-1200-gs', 'R 1200 GS'],
          ['r-1250-gs', 'R 1250 GS'],
          ['r-1300-gs', 'R 1300 GS'],
          ['s-1000-rr', 'S 1000 RR'],
          ['s-1000-r', 'S 1000 R'],
          ['c-400-x', 'C 400 X'],
          ['c-400-gt', 'C 400 GT'],
          ['c-650-gt', 'C 650 GT'],
          ['r-ninet', 'R nineT']
        ]
      )
    ]
  },
  {
    key: 'mercedes-benz',
    label: 'Mercedes-Benz',
    models: [
      ...models(
        ['CAR'],
        [
          ['a-class', 'A-Class'],
          ['b-class', 'B-Class'],
          ['c-class', 'C-Class'],
          ['e-class', 'E-Class'],
          ['s-class', 'S-Class'],
          ['cla', 'CLA'],
          ['cls', 'CLS'],
          ['gla', 'GLA'],
          ['glb', 'GLB'],
          ['glc', 'GLC'],
          ['gle', 'GLE'],
          ['gls', 'GLS'],
          ['g-class', 'G-Class'],
          ['sl', 'SL'],
          ['slk', 'SLK'],
          ['eqa', 'EQA'],
          ['eqb', 'EQB'],
          ['eqc', 'EQC'],
          ['eqe', 'EQE'],
          ['v-class', 'V-Class']
        ]
      ),
      ...models(
        ['VAN'],
        [
          ['vito', 'Vito'],
          ['sprinter', 'Sprinter'],
          ['citan', 'Citan']
        ]
      )
    ]
  },
  {
    key: 'audi',
    label: 'Audi',
    models: [
      ...models(
        ['CAR'],
        [
          ['a1', 'A1'],
          ['a3', 'A3'],
          ['a4', 'A4'],
          ['a5', 'A5'],
          ['a6', 'A6'],
          ['a7', 'A7'],
          ['a8', 'A8'],
          ['q2', 'Q2'],
          ['q3', 'Q3'],
          ['q5', 'Q5'],
          ['q7', 'Q7'],
          ['q8', 'Q8'],
          ['tt', 'TT'],
          ['r8', 'R8'],
          ['e-tron', 'e-tron'],
          ['q4-e-tron', 'Q4 e-tron']
        ]
      )
    ]
  },
  {
    key: 'volkswagen',
    label: 'Volkswagen',
    models: [
      ...models(
        ['CAR'],
        [
          ['up', 'up!'],
          ['polo', 'Polo'],
          ['golf', 'Golf'],
          ['passat', 'Passat'],
          ['arteon', 'Arteon'],
          ['tiguan', 'Tiguan'],
          ['t-roc', 'T-Roc'],
          ['t-cross', 'T-Cross'],
          ['touareg', 'Touareg'],
          ['id3', 'ID.3'],
          ['id4', 'ID.4'],
          ['id5', 'ID.5'],
          ['beetle', 'Beetle'],
          ['scirocco', 'Scirocco'],
          ['touran', 'Touran'],
          ['sharan', 'Sharan'],
          ['multivan', 'Multivan']
        ]
      ),
      ...models(
        ['CAR', 'VAN'],
        [
          ['caddy', 'Caddy'],
          ['amarok', 'Amarok']
        ]
      ),
      ...models(
        ['VAN'],
        [
          ['transporter', 'Transporter'],
          ['crafter', 'Crafter']
        ]
      )
    ]
  },
  {
    key: 'hyundai',
    label: 'Hyundai',
    models: [
      ...models(
        ['CAR'],
        [
          ['i10', 'i10'],
          ['i20', 'i20'],
          ['i30', 'i30'],
          ['i40', 'i40'],
          ['atos', 'Atos'],
          ['accent', 'Accent'],
          ['elantra', 'Elantra'],
          ['tucson', 'Tucson'],
          ['kona', 'Kona'],
          ['santa-fe', 'Santa Fe'],
          ['ioniq', 'Ioniq'],
          ['ioniq-5', 'Ioniq 5'],
          ['ioniq-6', 'Ioniq 6'],
          ['getz', 'Getz']
        ]
      ),
      ...models(
        ['CAR', 'VAN'],
        [
          ['h1', 'H-1 / i800', ['i800']],
          ['staria', 'Staria']
        ]
      ),
      ...models(['VAN'], [['h350', 'H350']])
    ]
  },
  {
    key: 'kia',
    label: 'Kia',
    models: [
      ...models(
        ['CAR'],
        [
          ['picanto', 'Picanto'],
          ['rio', 'Rio'],
          ['ceed', 'Ceed'],
          ['cerato', 'Cerato'],
          ['sportage', 'Sportage'],
          ['sorento', 'Sorento'],
          ['stonic', 'Stonic'],
          ['niro', 'Niro'],
          ['soul', 'Soul'],
          ['optima', 'Optima'],
          ['stinger', 'Stinger'],
          ['ev3', 'EV3'],
          ['ev6', 'EV6'],
          ['ev9', 'EV9']
        ]
      )
    ]
  },
  {
    key: 'honda',
    label: 'Honda',
    models: [
      ...models(
        ['CAR'],
        [
          ['civic', 'Civic'],
          ['jazz', 'Jazz / Fit', ['Fit']],
          ['accord', 'Accord'],
          ['cr-v', 'CR-V'],
          ['hr-v', 'HR-V / Vezel', ['Vezel']],
          ['insight', 'Insight'],
          ['cr-z', 'CR-Z'],
          ['freed', 'Freed'],
          ['stepwgn', 'Step WGN', ['Stepwgn']],
          ['odyssey', 'Odyssey'],
          ['stream', 'Stream'],
          ['city', 'City'],
          ['e', 'Honda e']
        ]
      ),
      ...models(
        ['MOTORCYCLE'],
        [
          ['cb125r', 'CB125R'],
          ['cb500f', 'CB500F'],
          ['cb500x', 'CB500X'],
          ['cb650r', 'CB650R'],
          ['cbr650r', 'CBR650R'],
          ['cbr1000rr', 'CBR1000RR'],
          ['africa-twin', 'Africa Twin'],
          ['nc750x', 'NC750X'],
          ['forza-125', 'Forza 125'],
          ['forza-350', 'Forza 350'],
          ['pcx125', 'PCX125'],
          ['sh125i', 'SH125i'],
          ['gold-wing', 'Gold Wing']
        ]
      ),
      ...models(['VAN'], [['acty', 'Acty']])
    ]
  },
  {
    key: 'mazda',
    label: 'Mazda',
    models: [
      ...models(
        ['CAR'],
        [
          ['mazda2', 'Mazda2 / Demio', ['Demio']],
          ['mazda3', 'Mazda3 / Axela', ['Axela']],
          ['mazda6', 'Mazda6 / Atenza', ['Atenza']],
          ['cx-3', 'CX-3'],
          ['cx-30', 'CX-30'],
          ['cx-5', 'CX-5'],
          ['cx-60', 'CX-60'],
          ['cx-7', 'CX-7'],
          ['cx-9', 'CX-9'],
          ['mx-5', 'MX-5'],
          ['rx-8', 'RX-8']
        ]
      ),
      ...models(['VAN'], [['bongo', 'Bongo']])
    ]
  },
  {
    key: 'mitsubishi',
    label: 'Mitsubishi',
    models: [
      ...models(
        ['CAR'],
        [
          ['colt', 'Colt'],
          ['lancer', 'Lancer'],
          ['asx', 'ASX'],
          ['outlander', 'Outlander'],
          ['eclipse-cross', 'Eclipse Cross'],
          ['pajero', 'Pajero / Shogun', ['Shogun']],
          ['space-star', 'Space Star / Mirage', ['Mirage']],
          ['grandis', 'Grandis']
        ]
      ),
      ...models(['CAR', 'VAN'], [['l200', 'L200 / Triton', ['Triton']]]),
      ...models(['VAN'], [['l300', 'L300']])
    ]
  },
  {
    key: 'ford',
    label: 'Ford',
    models: [
      ...models(
        ['CAR'],
        [
          ['fiesta', 'Fiesta'],
          ['focus', 'Focus'],
          ['mondeo', 'Mondeo'],
          ['puma', 'Puma'],
          ['kuga', 'Kuga'],
          ['ecosport', 'EcoSport'],
          ['s-max', 'S-Max'],
          ['galaxy', 'Galaxy'],
          ['b-max', 'B-Max'],
          ['c-max', 'C-Max'],
          ['mustang', 'Mustang'],
          ['mustang-mach-e', 'Mustang Mach-E'],
          ['tourneo-connect', 'Tourneo Connect'],
          ['tourneo-custom', 'Tourneo Custom']
        ]
      ),
      ...models(['CAR', 'VAN'], [['ranger', 'Ranger']]),
      ...models(
        ['VAN'],
        [
          ['transit', 'Transit'],
          ['transit-custom', 'Transit Custom'],
          ['transit-connect', 'Transit Connect'],
          ['transit-courier', 'Transit Courier']
        ]
      )
    ]
  },
  {
    key: 'opel',
    label: 'Opel',
    models: [
      ...models(
        ['CAR'],
        [
          ['corsa', 'Corsa'],
          ['astra', 'Astra'],
          ['insignia', 'Insignia'],
          ['mokka', 'Mokka'],
          ['crossland', 'Crossland'],
          ['grandland', 'Grandland'],
          ['adam', 'Adam'],
          ['meriva', 'Meriva'],
          ['zafira', 'Zafira'],
          ['vectra', 'Vectra']
        ]
      ),
      ...models(['CAR', 'VAN'], [['combo', 'Combo']]),
      ...models(
        ['VAN'],
        [
          ['vivaro', 'Vivaro'],
          ['movano', 'Movano']
        ]
      )
    ]
  },
  {
    key: 'peugeot',
    label: 'Peugeot',
    models: [
      ...models(
        ['CAR'],
        [
          ['107', '107'],
          ['108', '108'],
          ['206', '206'],
          ['207', '207'],
          ['208', '208'],
          ['307', '307'],
          ['308', '308'],
          ['407', '407'],
          ['508', '508'],
          ['2008', '2008'],
          ['3008', '3008'],
          ['5008', '5008'],
          ['rcz', 'RCZ'],
          ['rifter', 'Rifter']
        ]
      ),
      ...models(
        ['VAN'],
        [
          ['partner', 'Partner'],
          ['expert', 'Expert'],
          ['boxer', 'Boxer']
        ]
      )
    ]
  },
  {
    key: 'renault',
    label: 'Renault',
    models: [
      ...models(
        ['CAR'],
        [
          ['clio', 'Clio'],
          ['megane', 'Megane'],
          ['scenic', 'Scenic'],
          ['captur', 'Captur'],
          ['kadjar', 'Kadjar'],
          ['koleos', 'Koleos'],
          ['twingo', 'Twingo'],
          ['zoe', 'Zoe'],
          ['laguna', 'Laguna'],
          ['arkana', 'Arkana'],
          ['austral', 'Austral']
        ]
      ),
      ...models(['CAR', 'VAN'], [['kangoo', 'Kangoo']]),
      ...models(
        ['VAN'],
        [
          ['trafic', 'Trafic'],
          ['master', 'Master']
        ]
      )
    ]
  },
  {
    key: 'suzuki',
    label: 'Suzuki',
    models: [
      ...models(
        ['CAR'],
        [
          ['swift', 'Swift'],
          ['vitara', 'Vitara'],
          ['grand-vitara', 'Grand Vitara'],
          ['jimny', 'Jimny'],
          ['ignis', 'Ignis'],
          ['baleno', 'Baleno'],
          ['sx4', 'SX4'],
          ['s-cross', 'S-Cross'],
          ['alto', 'Alto'],
          ['wagon-r', 'Wagon R']
        ]
      ),
      ...models(
        ['MOTORCYCLE'],
        [
          ['gsx-r600', 'GSX-R600'],
          ['gsx-r750', 'GSX-R750'],
          ['gsx-r1000', 'GSX-R1000'],
          ['gsx-8s', 'GSX-8S'],
          ['gsx-s750', 'GSX-S750'],
          ['gsx-s1000', 'GSX-S1000'],
          ['sv650', 'SV650'],
          ['v-strom-650', 'V-Strom 650'],
          ['v-strom-800', 'V-Strom 800'],
          ['hayabusa', 'Hayabusa'],
          ['burgman-125', 'Burgman 125'],
          ['burgman-400', 'Burgman 400']
        ]
      ),
      ...models(['VAN'], [['carry', 'Carry']])
    ]
  },
  {
    key: 'lexus',
    label: 'Lexus',
    models: [
      ...models(
        ['CAR'],
        [
          ['ct', 'CT'],
          ['is', 'IS'],
          ['es', 'ES'],
          ['gs', 'GS'],
          ['ls', 'LS'],
          ['ux', 'UX'],
          ['nx', 'NX'],
          ['rx', 'RX'],
          ['rc', 'RC'],
          ['lc', 'LC'],
          ['rz', 'RZ'],
          ['lbx', 'LBX']
        ]
      )
    ]
  },
  {
    key: 'land-rover',
    label: 'Land Rover',
    models: [
      ...models(
        ['CAR'],
        [
          ['range-rover', 'Range Rover'],
          ['range-rover-sport', 'Range Rover Sport'],
          ['range-rover-evoque', 'Range Rover Evoque'],
          ['range-rover-velar', 'Range Rover Velar'],
          ['discovery', 'Discovery'],
          ['discovery-sport', 'Discovery Sport'],
          ['defender', 'Defender'],
          ['freelander', 'Freelander']
        ]
      )
    ]
  },
  {
    key: 'skoda',
    label: 'Skoda',
    models: [
      ...models(
        ['CAR'],
        [
          ['fabia', 'Fabia'],
          ['octavia', 'Octavia'],
          ['superb', 'Superb'],
          ['rapid', 'Rapid'],
          ['scala', 'Scala'],
          ['kamiq', 'Kamiq'],
          ['karoq', 'Karoq'],
          ['kodiaq', 'Kodiaq'],
          ['yeti', 'Yeti'],
          ['citigo', 'Citigo'],
          ['enyaq', 'Enyaq']
        ]
      )
    ]
  },
  {
    key: 'volvo',
    label: 'Volvo',
    models: [
      ...models(
        ['CAR'],
        [
          ['v40', 'V40'],
          ['v60', 'V60'],
          ['v70', 'V70'],
          ['v90', 'V90'],
          ['s40', 'S40'],
          ['s60', 'S60'],
          ['s80', 'S80'],
          ['s90', 'S90'],
          ['xc40', 'XC40'],
          ['xc60', 'XC60'],
          ['xc90', 'XC90'],
          ['ex30', 'EX30'],
          ['ex40', 'EX40'],
          ['ec40', 'EC40']
        ]
      )
    ]
  },
  {
    key: 'citroen',
    label: 'Citroën',
    models: [
      ...models(
        ['CAR'],
        [
          ['c1', 'C1'],
          ['c2', 'C2'],
          ['c3', 'C3'],
          ['c3-aircross', 'C3 Aircross'],
          ['c4', 'C4'],
          ['c4-cactus', 'C4 Cactus'],
          ['c4-picasso', 'C4 Picasso'],
          ['c5', 'C5'],
          ['c5-aircross', 'C5 Aircross']
        ]
      ),
      ...models(['CAR', 'VAN'], [['berlingo', 'Berlingo']]),
      ...models(
        ['VAN'],
        [
          ['dispatch', 'Dispatch / Jumpy', ['Jumpy']],
          ['relay', 'Relay / Jumper', ['Jumper']]
        ]
      )
    ]
  },
  {
    key: 'fiat',
    label: 'Fiat',
    models: [
      ...models(
        ['CAR'],
        [
          ['500', '500'],
          ['500l', '500L'],
          ['500x', '500X'],
          ['panda', 'Panda'],
          ['punto', 'Punto'],
          ['tipo', 'Tipo'],
          ['bravo', 'Bravo']
        ]
      ),
      ...models(['CAR', 'VAN'], [['doblo', 'Doblò']]),
      ...models(
        ['VAN'],
        [
          ['fiorino', 'Fiorino'],
          ['scudo', 'Scudo'],
          ['ducato', 'Ducato']
        ]
      )
    ]
  },
  {
    key: 'dacia',
    label: 'Dacia',
    models: [
      ...models(
        ['CAR'],
        [
          ['sandero', 'Sandero'],
          ['duster', 'Duster'],
          ['logan', 'Logan'],
          ['jogger', 'Jogger'],
          ['spring', 'Spring']
        ]
      ),
      ...models(['CAR', 'VAN'], [['dokker', 'Dokker']])
    ]
  },
  {
    key: 'seat',
    label: 'SEAT',
    models: [
      ...models(
        ['CAR'],
        [
          ['ibiza', 'Ibiza'],
          ['leon', 'Leon'],
          ['arona', 'Arona'],
          ['ateca', 'Ateca'],
          ['tarraco', 'Tarraco'],
          ['alhambra', 'Alhambra'],
          ['toledo', 'Toledo'],
          ['mii', 'Mii']
        ]
      )
    ]
  },
  {
    key: 'mini',
    label: 'MINI',
    models: [
      ...models(
        ['CAR'],
        [
          ['hatch', 'Hatch / Cooper', ['Cooper']],
          ['clubman', 'Clubman'],
          ['countryman', 'Countryman'],
          ['convertible', 'Convertible'],
          ['paceman', 'Paceman']
        ]
      )
    ]
  },
  {
    key: 'porsche',
    label: 'Porsche',
    models: [
      ...models(
        ['CAR'],
        [
          ['911', '911'],
          ['boxster', 'Boxster'],
          ['cayman', 'Cayman'],
          ['cayenne', 'Cayenne'],
          ['macan', 'Macan'],
          ['panamera', 'Panamera'],
          ['taycan', 'Taycan']
        ]
      )
    ]
  },
  {
    key: 'tesla',
    label: 'Tesla',
    models: [
      ...models(
        ['CAR'],
        [
          ['model-3', 'Model 3'],
          ['model-y', 'Model Y'],
          ['model-s', 'Model S'],
          ['model-x', 'Model X']
        ]
      )
    ]
  },
  {
    key: 'mg',
    label: 'MG',
    models: [
      ...models(
        ['CAR'],
        [
          ['mg3', 'MG3'],
          ['mg4', 'MG4'],
          ['mg5', 'MG5'],
          ['zs', 'ZS'],
          ['hs', 'HS'],
          ['mg6', 'MG6'],
          ['cyberster', 'Cyberster']
        ]
      )
    ]
  },
  {
    key: 'smart',
    label: 'Smart',
    models: [
      ...models(
        ['CAR'],
        [
          ['fortwo', 'Fortwo'],
          ['forfour', 'Forfour'],
          ['1', 'Smart #1'],
          ['3', 'Smart #3']
        ]
      )
    ]
  },
  {
    key: 'byd',
    label: 'BYD',
    models: [
      ...models(
        ['CAR'],
        [
          ['atto-3', 'Atto 3'],
          ['dolphin', 'Dolphin'],
          ['seal', 'Seal'],
          ['seal-u', 'Seal U'],
          ['tang', 'Tang'],
          ['han', 'Han']
        ]
      )
    ]
  },
  {
    key: 'subaru',
    label: 'Subaru',
    models: [
      ...models(
        ['CAR'],
        [
          ['impreza', 'Impreza'],
          ['forester', 'Forester'],
          ['outback', 'Outback'],
          ['legacy', 'Legacy'],
          ['xv', 'XV / Crosstrek', ['Crosstrek']],
          ['wrx', 'WRX'],
          ['brz', 'BRZ'],
          ['levorg', 'Levorg'],
          ['solterra', 'Solterra']
        ]
      )
    ]
  },
  {
    key: 'isuzu',
    label: 'Isuzu',
    models: [...models(['CAR', 'VAN'], [['d-max', 'D-Max']])]
  },
  {
    key: 'iveco',
    label: 'Iveco',
    models: [...models(['VAN'], [['daily', 'Daily']])]
  },
  {
    key: 'maxus',
    label: 'Maxus',
    models: [
      ...models(
        ['VAN'],
        [
          ['deliver-9', 'Deliver 9'],
          ['e-deliver-3', 'eDeliver 3'],
          ['e-deliver-9', 'eDeliver 9']
        ]
      )
    ]
  },
  {
    key: 'yamaha',
    label: 'Yamaha',
    models: [
      ...models(
        ['MOTORCYCLE'],
        [
          ['mt-03', 'MT-03'],
          ['mt-07', 'MT-07'],
          ['mt-09', 'MT-09'],
          ['mt-10', 'MT-10'],
          ['yzf-r1', 'YZF-R1'],
          ['yzf-r3', 'YZF-R3'],
          ['yzf-r6', 'YZF-R6'],
          ['yzf-r7', 'YZF-R7'],
          ['tracer-7', 'Tracer 7'],
          ['tracer-9', 'Tracer 9'],
          ['tenere-700', 'Ténéré 700'],
          ['xmax-300', 'XMAX 300'],
          ['tmax', 'TMAX'],
          ['nmax-125', 'NMAX 125'],
          ['delight', "D'elight"]
        ]
      )
    ]
  },
  {
    key: 'kawasaki',
    label: 'Kawasaki',
    models: [
      ...models(
        ['MOTORCYCLE'],
        [
          ['ninja-400', 'Ninja 400'],
          ['ninja-650', 'Ninja 650'],
          ['ninja-zx-6r', 'Ninja ZX-6R'],
          ['ninja-zx-10r', 'Ninja ZX-10R'],
          ['z400', 'Z400'],
          ['z650', 'Z650'],
          ['z900', 'Z900'],
          ['z1000', 'Z1000'],
          ['versys-650', 'Versys 650'],
          ['versys-1000', 'Versys 1000'],
          ['vulcan-s', 'Vulcan S']
        ]
      )
    ]
  },
  {
    key: 'ktm',
    label: 'KTM',
    models: [
      ...models(
        ['MOTORCYCLE'],
        [
          ['125-duke', '125 Duke'],
          ['390-duke', '390 Duke'],
          ['790-duke', '790 Duke'],
          ['890-duke', '890 Duke'],
          ['1290-super-duke-r', '1290 Super Duke R'],
          ['390-adventure', '390 Adventure'],
          ['790-adventure', '790 Adventure'],
          ['890-adventure', '890 Adventure'],
          ['1290-super-adventure', '1290 Super Adventure'],
          ['690-smc-r', '690 SMC R']
        ]
      )
    ]
  },
  {
    key: 'ducati',
    label: 'Ducati',
    models: [
      ...models(
        ['MOTORCYCLE'],
        [
          ['monster', 'Monster'],
          ['scrambler', 'Scrambler'],
          ['multistrada', 'Multistrada'],
          ['panigale-v2', 'Panigale V2'],
          ['panigale-v4', 'Panigale V4'],
          ['streetfighter', 'Streetfighter'],
          ['diavel', 'Diavel'],
          ['hypermotard', 'Hypermotard'],
          ['supersport', 'SuperSport']
        ]
      )
    ]
  },
  {
    key: 'piaggio',
    label: 'Piaggio',
    models: [
      ...models(
        ['MOTORCYCLE'],
        [
          ['liberty', 'Liberty'],
          ['beverly', 'Beverly'],
          ['medley', 'Medley'],
          ['mp3', 'MP3'],
          ['zip', 'Zip'],
          ['fly', 'Fly']
        ]
      )
    ]
  },
  {
    key: 'sym',
    label: 'SYM',
    models: [
      ...models(
        ['MOTORCYCLE'],
        [
          ['symphony', 'Symphony'],
          ['symphony-st', 'Symphony ST'],
          ['jet-14', 'Jet 14'],
          ['jet-x', 'Jet X'],
          ['joyride', 'Joyride'],
          ['maxsym', 'Maxsym'],
          ['maxsym-tl', 'Maxsym TL'],
          ['cruisym', 'Cruisym'],
          ['fiddle', 'Fiddle'],
          ['orbit', 'Orbit']
        ]
      )
    ]
  },
  {
    key: 'kymco',
    label: 'Kymco',
    models: [
      ...models(
        ['MOTORCYCLE'],
        [
          ['agility', 'Agility'],
          ['people-s', 'People S'],
          ['downtown', 'Downtown'],
          ['x-town', 'X-Town'],
          ['xciting', 'Xciting'],
          ['ak-550', 'AK 550'],
          ['like', 'Like'],
          ['super-8', 'Super 8']
        ]
      )
    ]
  },
  {
    key: 'aprilia',
    label: 'Aprilia',
    models: [
      ...models(
        ['MOTORCYCLE'],
        [
          ['rs-125', 'RS 125'],
          ['rs-660', 'RS 660'],
          ['rsv4', 'RSV4'],
          ['tuono-660', 'Tuono 660'],
          ['tuono-v4', 'Tuono V4'],
          ['tuareg-660', 'Tuareg 660'],
          ['sr-gt', 'SR GT'],
          ['scarabeo', 'Scarabeo']
        ]
      )
    ]
  },
  {
    key: 'triumph',
    label: 'Triumph',
    models: [
      ...models(
        ['MOTORCYCLE'],
        [
          ['street-triple', 'Street Triple'],
          ['speed-triple', 'Speed Triple'],
          ['trident', 'Trident'],
          ['tiger', 'Tiger'],
          ['bonneville', 'Bonneville'],
          ['street-twin', 'Street Twin'],
          ['scrambler', 'Scrambler'],
          ['daytona', 'Daytona'],
          ['rocket-3', 'Rocket 3']
        ]
      )
    ]
  },
  {
    key: 'vespa',
    label: 'Vespa',
    models: [
      ...models(
        ['MOTORCYCLE'],
        [
          ['primavera', 'Primavera'],
          ['sprint', 'Sprint'],
          ['gts', 'GTS'],
          ['gtv', 'GTV'],
          ['lx', 'LX'],
          ['px', 'PX']
        ]
      )
    ]
  },
  {
    key: 'cfmoto',
    label: 'CFMoto',
    models: [
      ...models(
        ['MOTORCYCLE'],
        [
          ['300nk', '300NK'],
          ['450nk', '450NK'],
          ['450sr', '450SR'],
          ['650nk', '650NK'],
          ['700cl-x', '700CL-X'],
          ['800mt', '800MT']
        ]
      )
    ]
  },
  {
    key: 'royal-enfield',
    label: 'Royal Enfield',
    models: [
      ...models(
        ['MOTORCYCLE'],
        [
          ['classic-350', 'Classic 350'],
          ['meteor-350', 'Meteor 350'],
          ['himalayan', 'Himalayan'],
          ['interceptor-650', 'Interceptor 650'],
          ['continental-gt-650', 'Continental GT 650']
        ]
      )
    ]
  }
] as const satisfies readonly VehicleMake[]

const otherModel = (vehicleType: VehicleType): VehicleModel => ({ key: OTHER_VEHICLE_MODEL, label: 'Other model', vehicleTypes: [vehicleType] })

export function getVehicleModels(make: string, vehicleType: VehicleType): VehicleModel[] {
  if (make === OTHER_VEHICLE_MAKE) return [otherModel(vehicleType)]
  const entry = VEHICLE_CATALOG.find((item) => item.key === make)
  const available = entry?.models.filter((model) => model.vehicleTypes.includes(vehicleType)) ?? []
  return available.length ? [...available, otherModel(vehicleType)] : []
}

export function getVehicleMakes(vehicleType: VehicleType) {
  return [
    ...VEHICLE_CATALOG.filter((make) => make.models.some((model) => model.vehicleTypes.includes(vehicleType))).map(({ key, label }) => ({
      key,
      label
    })),
    { key: OTHER_VEHICLE_MAKE, label: 'Other make' }
  ]
}

export function isVehicleMake(make: string, vehicleType: VehicleType) {
  return (
    make === OTHER_VEHICLE_MAKE ||
    VEHICLE_CATALOG.some((item) => item.key === make && item.models.some((model) => model.vehicleTypes.includes(vehicleType)))
  )
}

export function isVehicleModel(make: string, model: string, vehicleType: VehicleType) {
  return getVehicleModels(make, vehicleType).some((item) => item.key === model)
}
