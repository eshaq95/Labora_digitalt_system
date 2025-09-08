import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const suppliers = [
  // Utstyr og forbruksvarer
  {
    name: 'Ivar Holte',
    orderMethod: 'EMAIL',
    website: 'https://www.ivar-holte.no/',
    products: 'Engangsutstyr plast(pipetter), vannprøveflasker, stomacherposer, prøvebokser, reagensrørstativ, smittebokser',
    username: null,
    password: null,
    orderEmail: 'benedikte.fjellheim@ivar-holte.no',
    contactPerson: 'Benedicte Fjellheim',
    phone: '90 66 10 37',
    category: 'EQUIPMENT',
    email: 'info@ivar-holte.no',
    notes: 'Mobil 92861581\nTelefon 64838884\n\nBestillinger via epost.\nNettside.\nSpør om produktkataloger, ertatningsvarer, billigere priser.'
  },
  {
    name: 'Labolytic',
    orderMethod: 'WEB',
    website: null,
    products: 'Fast bestilling ligger inne, hver 3. mnd., kluter, PCR kit',
    username: 'kristin@labora.no',
    password: 'Labora2025!!',
    orderEmail: 'bestilling@labolytic.no',
    contactPerson: 'Torill',
    phone: '47 77 77 60',
    category: 'EQUIPMENT',
    email: null,
    notes: 'Har fastbestilling. \nBestiller på nettside. \nEndringer i fastbestilling skjer på epost.\n\nIda Vollen.\nTorill Hagen.',
    agreementUrl: 'https://labora-as.monday.com/protected_static/9106724/resources/293970778/5%20%20Labolytic%20fast%20bestilling%20fom%20juli%202021%20_%20endret%2010.05.21%20%E2%80%93%20.docx'
  },
  {
    name: 'Thermo Fisher Diagnostics',
    orderMethod: 'EMAIL',
    website: 'https://www.thermofisher.com/no/en/home.html',
    products: null,
    username: null,
    password: null,
    orderEmail: 'Orderoxoid.nordic@thermofisher.com',
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: 'Microbiology.customerservice.no@thermofisher.com',
    notes: 'Husk å oppgi fakturareferanse og leveringsadresse.\n\n\nIkke send bestillingen til Trine direkte. Få mail om ordrebekreftelser.'
  },
  {
    name: 'VWR',
    orderMethod: 'WEB',
    website: 'http://no.vwr.com/',
    products: 'Petriskåler, div. medier, div. utstyr, gasspatroner butan, pH-buffer, vaskemiddel(oppvaskmaskin), pipettespisser PCR, petrifilm',
    username: 'kristin@labora.no',
    password: 'Labora2024!!',
    orderEmail: 'talha.goekmen@avantorsciences.com',
    contactPerson: 'Talha Gökmen',
    phone: '46597660',
    category: 'EQUIPMENT',
    email: 'talha.goekmen@avantorsciences.com',
    notes: 'Labforum-avtaler: VWR og FIAS.\nKontakt Øyvind om prisforbedring og leverandøravtaler. \n- Fri frakt ved bestilling over 2500,-\n- Her kan Merck-produkter bestilles billigst.'
  },
  {
    name: 'NorEngros',
    orderMethod: 'WEB',
    website: 'https://www.norengros.no/',
    products: 'Hansker, anti-bac, sprøyter - 1500 for å unngå frakt',
    username: 'kristin@labora.no',
    password: 'Labora2023!!',
    orderEmail: null,
    contactPerson: 'Gøril Nohr',
    phone: null,
    category: 'EQUIPMENT',
    email: 'gorild.nohr@norengros.no',
    notes: null
  },
  {
    name: 'Biomerieux',
    orderMethod: 'EMAIL',
    website: 'https://eshop.biomerieux.com/s/',
    products: 'Kriseleverandør disc. vibriostat. hvis thermofisher ikke k an levere.\nTEMPO - utstyr og serviceavtale.\n\nBestilling på mail.',
    username: 'kristin@labora.no',
    password: 'Labora2025!!',
    orderEmail: 'order.no@biomerieux.com',
    contactPerson: 'Karine Bjerre',
    phone: null,
    category: 'EQUIPMENT',
    email: 'karine.bjerre@biomerieux.com',
    notes: 'kundenummer 1\n066007\nLast ned ordreskjema excel: https://www.biomerieux-nordic.com/contact-info/norge',
    agreementUrl: 'https://labora-as.monday.com/protected_static/9106724/resources/376298714/FO-04-06%20Order%20form%20bioMerieux%20-%20Labora%20Tempo.xls'
  },
  {
    name: 'Montebello diagnostics',
    orderMethod: 'EMAIL',
    website: null,
    products: null,
    username: null,
    password: null,
    orderEmail: null,
    contactPerson: 'Arnhild',
    phone: '22 14 14 90',
    category: 'EQUIPMENT',
    email: 'mail@montebello.no',
    notes: null
  },
  {
    name: 'Merck Life Science - HUSK KODE',
    orderMethod: 'WEB',
    website: 'https://www.sigmaaldrich.com/NO/en',
    products: '- Millipore: trakter, filter til vannfiltrering.',
    username: 'kristin@labora.no',
    password: 'PebE4os=m',
    orderEmail: null,
    contactPerson: 'Beate Aslaksen',
    phone: '81 06 26 45',
    category: 'EQUIPMENT',
    email: 'Beate.Aslaksen@merckgroup.com',
    notes: 'Tilbud: R-439916.25 - referansenr. 09991274\nRabattavtale ligger inn på brukeren vår.\n- Bestill alle andre Merck-produkter enn Millipore-filter fra VWR, for billigst pris og \n fraktfordel.'
  },
  {
    name: 'Sarstedt',
    orderMethod: 'EMAIL',
    website: null,
    products: null,
    username: null,
    password: null,
    orderEmail: 'info.no@sarstedt.com',
    contactPerson: 'Marte Toften',
    phone: null,
    category: 'EQUIPMENT',
    email: 'marte.toften@sarstedt.com',
    notes: 'Miljøgebyr på 150 kr. Dette tilkommer på alle ordre under 1000 kr. Fraktfritt på ordre over 4000,-\nBestiller på mail.'
  },
  {
    name: 'Felleskjøpet, Bodø',
    orderMethod: 'PHONE',
    website: 'https://www.felleskjopet.no/',
    products: 'Virocid',
    username: null,
    password: null,
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: null,
    notes: null
  },
  {
    name: 'BD Norway AS',
    orderMethod: 'EMAIL',
    website: 'https://www.bd.com/no-no/our-products/browse-brands/bd-norway',
    products: 'BHI og medie leverandør, spør Stina.\nplain count agar, heart infusion agar\n\nBestiller på epost',
    username: null,
    password: null,
    orderEmail: 'ordre.no@bd.com',
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: 'ordre.no@bd.com',
    notes: null
  },
  {
    name: '3M Neogen',
    orderMethod: 'WEB',
    website: 'http://www.3m.no/bcom',
    products: 'Medier, petrifilm.\nBestilling via epost, labforum pris?. (Alternativ leverandør Lavendel).\n\nBjørnar har en excel oversikt / kontakt ingrid.lea@labora.no',
    username: 'MikroLabora2021!',
    password: null,
    orderEmail: 'infoemea@neogen.com',
    contactPerson: 'Magnus G',
    phone: '96 90 20 09',
    category: 'EQUIPMENT',
    email: null,
    notes: 'Ingrid Johanne Skjelbred Groenas   IGronas@neogen.com\ninfoemea@neogen.com'
  },
  {
    name: 'Saveen & Werner',
    orderMethod: 'EMAIL',
    website: 'http://www.swab.se',
    products: null,
    username: null,
    password: null,
    orderEmail: 'info@swab.se',
    contactPerson: 'Maria Hylén Olsson',
    phone: null,
    category: 'EQUIPMENT',
    email: 'maria@swab.se',
    notes: 'Bestilling via mail.\nKundenr N5277'
  },
  {
    name: 'Bionordica',
    orderMethod: 'EMAIL',
    website: null,
    products: 'Tromsøs leverandør på Dilucup, bestilles på mail.',
    username: null,
    password: null,
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: null,
    notes: null
  },
  {
    name: 'CCUG',
    orderMethod: 'EMAIL',
    website: 'http://www.ccug.se',
    products: 'mikrobank materiale',
    username: null,
    password: null,
    orderEmail: 'lab@ccug.se',
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: 'lab@ccug.se',
    notes: 'CCUG; CULTURE COLLECTION UNIVERSITY OF GÖTEBORG\nDepartment of Clinical Bacteriology\nGuldhedsgatan 10,  SE-413 46 Göteborg\nTel +46.31-342 47 02\nFax:+46.31-82 96 17\nlab@ccug.se'
  },
  {
    name: 'Nesseplast',
    orderMethod: 'WEB',
    website: 'http://nesseplast.no',
    products: 'Isoporesker',
    username: 'toril@labora.no',
    password: 'Labora2021',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: null,
    notes: null
  },
  {
    name: 'Prosess-styring',
    orderMethod: 'EMAIL',
    website: null,
    products: 'Utstyr til turbidimetre',
    username: null,
    password: null,
    orderEmail: 'ordre@prosess-styring.no',
    contactPerson: 'Roger Mile',
    phone: '32820214',
    category: 'EQUIPMENT',
    email: 'roger@prosess-styring.no',
    notes: null
  },
  {
    name: 'Nerlien Meszansky',
    orderMethod: 'WEB',
    website: 'https://nmas.no/',
    products: 'Ref.mtr. + spisser Gilson',
    username: 'kari@labora.no',
    password: '300714_kem',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: null,
    notes: null
  },
  {
    name: 'Rajapack',
    orderMethod: 'EMAIL',
    website: null,
    products: 'Tape med logo\npriser 2025 - februar\n72 ruller - 66,85 pr rull\n144 ruller - 58,08 pr rull \n+ frakt \n6-8 uker levering',
    username: 'kristin@labora.no',
    password: null,
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: null,
    notes: null
  },
  {
    name: 'Staples',
    orderMethod: 'WEB',
    website: null,
    products: 'Kontorutstyr',
    username: 'toril@labora.no',
    password: 'Labora2021',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: null,
    notes: null
  },
  {
    name: 'Teknolab',
    orderMethod: 'WEB',
    website: 'https://www.teknolab.no/',
    products: null,
    username: 'kristin@labora.no',
    password: 'Labora2024!!',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: null,
    notes: null
  },
  {
    name: 'KiiltoClean AS',
    orderMethod: 'EMAIL',
    website: 'https://www.kiilto.no/',
    products: '600051, rektifisert sprit (men for annen sprit er Norengros er billigere)',
    username: null,
    password: null,
    orderEmail: 'ordre.no@kiilto.com',
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: 'ordre.no@kiilto.com',
    notes: 'Sender e-post til ordre.no@kiilto.com, se bilde'
  },
  {
    name: 'Heger AS',
    orderMethod: 'EMAIL',
    website: 'https://www.heger.no',
    products: 'Petriskåler hovedleverandør',
    username: null,
    password: null,
    orderEmail: 'post@heger.no',
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: null,
    notes: 'Dyr frakt, men mye billigere skåler enn VWR. Lønner seg når vi bestiller 20+ esker'
  },
  {
    name: 'Honeywell',
    orderMethod: 'WEB',
    website: 'https://lab.honeywell.com/',
    products: 'Medie til Kryo',
    username: 'felles@labora.no',
    password: 'Labora2022!',
    orderEmail: null,
    contactPerson: 'Henrik Wielechowski',
    phone: '45830843',
    category: 'EQUIPMENT',
    email: 'henrik@phoenixtrading.no',
    notes: null
  },
  {
    name: 'Elektroimportøren',
    orderMethod: 'WEB',
    website: 'https://www.elektroimportoren.no/',
    products: 'Lysstoffrør til lab og kontor',
    username: 'firmapost@labora.no',
    password: 'Labora22!',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: null,
    notes: 'Kundenummeret: 8936132'
  },
  {
    name: 'AJ produkter',
    orderMethod: 'WEB',
    website: null,
    products: null,
    username: 'ida@labora.no',
    password: 'Labora2022',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: null,
    notes: null
  },
  {
    name: 'Idexx',
    orderMethod: 'EMAIL',
    website: 'https://www.idexx.com/en/water/water-products-services/legiolert/',
    products: 'Leverandør av Legiolert reagenser ( + colilert og pseudoalert)',
    username: null,
    password: null,
    orderEmail: 'wlpdnordics@idexx.com',
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: null,
    notes: 'Kundenummer: 401561. \nPris: Labforumavtale \nKontaktperson: Rita\n\nInnlogging learning center:\ningrid.lea@labora.no\nPO: Labora401561!'
  },
  {
    name: 'JFA',
    orderMethod: null,
    website: 'https://jfa.no/',
    products: 'Pinsett med klo',
    username: 'kristin@labora.no',
    password: 'Labora2023',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'EQUIPMENT',
    email: null,
    notes: null
  },

  // Logistikk
  {
    name: 'Jetpak',
    orderMethod: 'WEB',
    website: null,
    products: null,
    username: 'bjornar@labora.no',
    password: null,
    orderEmail: null,
    contactPerson: 'Tor Strand',
    phone: null,
    category: 'LOGISTICS',
    email: null,
    notes: null
  },
  {
    name: 'Bring',
    orderMethod: 'WEB',
    website: null,
    products: null,
    username: 'toril@labora.no',
    password: 'Labora2020',
    orderEmail: null,
    contactPerson: 'Tomas Arnesen',
    phone: null,
    category: 'LOGISTICS',
    email: null,
    notes: null
  },
  {
    name: 'DHL bestilling',
    orderMethod: 'WEB',
    website: 'https://mydhl.express.dhl/',
    products: null,
    username: 'toril@labora.no',
    password: 'FGpP@??6n7jRFd`',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'LOGISTICS',
    email: null,
    notes: null
  },
  {
    name: 'DHL fakturasystem',
    orderMethod: 'WEB',
    website: 'https://mybill.dhl.com/login/?next=/dashboard/',
    products: null,
    username: 'toril@labora.no',
    password: 'Vinter22',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'LOGISTICS',
    email: null,
    notes: null
  },

  // Service-leverandører
  {
    name: 'Bio-Rad Service EMEA',
    orderMethod: 'EMAIL',
    website: 'http://www.bio-rad.com',
    products: 'Service PCR-utstyr og validering termoblokk',
    username: null,
    password: null,
    orderEmail: null,
    contactPerson: 'Kia Reppling',
    phone: null,
    category: 'SERVICE',
    email: 'nordic_service@bio-rad.com',
    notes: null
  },
  {
    name: 'Dipl. Houm',
    orderMethod: 'EMAIL',
    website: 'https://www.houm.no/',
    products: 'Service autoklav/certoklav, leie av temperaturlogger',
    username: null,
    password: null,
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'SERVICE',
    email: 'post@houm.no',
    notes: null
  },
  {
    name: 'Mettler Toledo',
    orderMethod: 'EMAIL',
    website: 'https://www.mt.com/no/no/home.html',
    products: 'Service og kalibrering av vekter',
    username: 'toril@labora.no',
    password: 'Toril-22mt',
    orderEmail: 'info.mtn@mt.com',
    contactPerson: null,
    phone: null,
    category: 'SERVICE',
    email: null,
    notes: null
  },
  {
    name: 'Denton AS',
    orderMethod: 'EMAIL',
    website: null,
    products: 'Service mikroskop',
    username: null,
    password: null,
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'SERVICE',
    email: null,
    notes: null
  },
  {
    name: 'VWR',
    orderMethod: 'EMAIL',
    website: 'https://no.vwr.com/cms/local_vwr_contact',
    products: 'Pipetteservice',
    username: null,
    password: null,
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'SERVICE',
    email: 'pipetteservice.no@vwr.com',
    notes: null
  },

  // Andre tilganger
  {
    name: 'API web',
    orderMethod: null,
    website: 'https://apiweb.biomerieux.com/identIndex',
    products: null,
    username: 'mikro@labora.no',
    password: 'APImikro',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'OTHER',
    email: null,
    notes: null
  },
  {
    name: 'EcoOnline',
    orderMethod: null,
    website: null,
    products: 'Stoffkartotek og sikkerhetsdatablad',
    username: 'Labora',
    password: 'Labora2020',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'OTHER',
    email: null,
    notes: null
  },
  {
    name: 'NMKL',
    orderMethod: null,
    website: 'https://www.nmkl.org/publications/my-account/',
    products: 'Standarder',
    username: 'ida@labora.no',
    password: 'Labora2022!',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'OTHER',
    email: null,
    notes: null
  },
  {
    name: 'SLV',
    orderMethod: null,
    website: 'https://www2.slv.se/Absint/Home',
    products: 'Ringtest og referansemateriale',
    username: '8628',
    password: '55220',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'OTHER',
    email: null,
    notes: null
  },
  {
    name: 'Biomerieux',
    orderMethod: null,
    website: 'https://www.biomerieux-nordic.com/resources/technical-library',
    products: 'Teknisk bibliotek',
    username: 'LaboraBodo',
    password: '2d10ed7',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'OTHER',
    email: null,
    notes: null
  },
  {
    name: 'LGC Standards',
    orderMethod: null,
    website: 'https://www.lgcstandards.com/NO/en',
    products: null,
    username: 'ann@labora.no',
    password: 'Labora1',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'OTHER',
    email: null,
    notes: 'kunde nummer: 20112199'
  },
  {
    name: 'Healthworkers',
    orderMethod: null,
    website: 'https://www.healthworkers.no/',
    products: 'Arbeidsklær. NB!! Det må alltid bestilles strikk i ben likt antall bukser som bestilles.',
    username: 'ida@labora.no',
    password: 'Labora2022',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'OTHER',
    email: null,
    notes: null
  },
  {
    name: 'AJprodukter',
    orderMethod: null,
    website: 'https://www.ajprodukter.no/',
    products: 'Kontormøbler, traller, hyller, oppbevaring etc.',
    username: 'kristin@labora.no',
    password: 'Labora2023!!',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'OTHER',
    email: null,
    notes: null
  },
  {
    name: 'Standard Norge',
    orderMethod: null,
    website: 'https://standard.no/no/Brukersider/Logg-inn-Standardno/',
    products: 'ISO standarder',
    username: 'ida@labora.no',
    password: 'Labora2021',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'OTHER',
    email: null,
    notes: null
  },
  {
    name: 'Witre',
    orderMethod: null,
    website: 'https://www.witre.no/no/wno',
    products: 'Kontormøbler, traller, hyller, oppbevaring etc.',
    username: 'ida@labora.no',
    password: 'Labora2020',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'OTHER',
    email: null,
    notes: null
  },
  {
    name: 'Elkjøp',
    orderMethod: null,
    website: null,
    products: null,
    username: 'kristin@labora.no',
    password: 'Labora2025!!',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'OTHER',
    email: null,
    notes: null
  },

  // Tidligere leverandører
  {
    name: 'Elektroimportøren',
    orderMethod: null,
    website: 'https://elektroimportoren.no',
    products: 'Lyspærer og annet elektroutstyr',
    username: 'ida@labora.no',
    password: 'Labora22!',
    orderEmail: null,
    contactPerson: null,
    phone: null,
    category: 'FORMER',
    email: null,
    notes: null
  },
  {
    name: 'Lavendel',
    orderMethod: null,
    website: null,
    products: 'Petrifilm, avtale sagt opp 13.03.20, se VWR',
    username: null,
    password: null,
    orderEmail: null,
    contactPerson: 'Øyvind Mathisen',
    phone: '90 85 21 80',
    category: 'FORMER',
    email: null,
    notes: null
  }
]

async function main() {
  console.log('🚀 Starter import av alle Labora leverandører...')
  
  try {
    // Slett eksisterende data i riktig rekkefølge for å unngå foreign key constraints
    await prisma.supplierItem.deleteMany({})
    console.log('✅ Slettet eksisterende supplier items')

    await prisma.supplier.deleteMany({})
    console.log('✅ Slettet eksisterende leverandører')

    // Sikre at nødvendige SupplierCategory finnes
    const CATEGORY_MAP: Record<string, string> = {
      EQUIPMENT: 'Utstyr og forbruksvarer',
      LOGISTICS: 'Logistikk',
      SERVICE: 'Service-leverandører',
      OTHER: 'Andre tilganger',
      FORMER: 'Tidligere leverandører'
    }

    const categoryNameToId: Record<string, string> = {}
    for (const code of Object.keys(CATEGORY_MAP)) {
      const name = CATEGORY_MAP[code]
      const cat = await prisma.supplierCategory.upsert({
        where: { name },
        update: {},
        create: { name }
      })
      categoryNameToId[name] = cat.id
    }

    let created = 0
    for (const s of suppliers) {
      const categoryName = CATEGORY_MAP[s.category] || 'Andre tilganger'
      const categoryId = categoryNameToId[categoryName]

      // Bevar all informasjon, men mapp til feltene i det nye skjemaet.
      const consolidatedNotes = [
        s.notes ? String(s.notes).trim() : '',
        s.products ? `Produkter: ${s.products}` : ''
      ].filter(Boolean).join('\n\n') || null

      await prisma.supplier.create({
        data: {
          name: s.name,
          categoryId,
          orderMethod: s.orderMethod || null,
          website: s.website || null,
          generalEmail: s.email || null,
          orderEmail: s.orderEmail || null,
          contactPerson: s.contactPerson || null,
          phone: s.phone || null,
          username: s.username || null,
          credentialsNotes: s.password ? `Passord: ${s.password}` : null,
          notes: consolidatedNotes,
          contractUrl: (s as any).agreementUrl || null
        }
      })
      created++
    }

    console.log(`✅ Import fullført! ${created} leverandører importert`)
    console.log('\n📊 Import fullført!')
    console.log(`  Totalt: ${created} leverandører importert`)
    
  } catch (error) {
    console.error('❌ Feil under import:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
