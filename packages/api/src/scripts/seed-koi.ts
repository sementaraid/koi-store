import assert from "node:assert";

import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  toHandle,
} from "@medusajs/framework/utils";
import {
  AttributeType,
  ProductStatus,
  type CreateOfferDTO,
  type CreateProductDTO,
} from "@mercurjs/types";
import {
  approveSellerWorkflow,
  createOffersWorkflow,
  createProductAttributesWorkflow,
  createProductsWorkflow,
  createSellerAccountWorkflow,
  createSellerShippingOptionsWorkflow,
  createSellerStockLocationsWorkflow,
} from "@mercurjs/core/workflows";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createApiKeysWorkflow,
  createCustomerAccountWorkflow,
  createLocationFulfillmentSetWorkflow,
  createProductCategoriesWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createServiceZonesWorkflow,
  createShippingProfilesWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

/*
 * Koi marketplace seed — the catalog the `storefront-koi` app renders.
 *
 * This is the project's seeder (`bun run seed`). `seed.ts` is kept as a
 * reference only (the upstream footwear demo); it is not wired to a script.
 *
 * Shape of the data:
 * - 30 approved sellers: 20 breeders (`metadata.kind = "farm"`) and 10 supply
 *   shops (`metadata.kind = "shop"`). The storefront's product adapter reads
 *   that key to tell a farm from a reseller.
 * - Koi listings under `/katalog`, pond supplies under `/toko`.
 * - Every seller carries at least one offer, so no seller page renders empty.
 * - Auctions (`/lelang`) are deliberately NOT seeded — bidding is out of scope.
 *
 * Farm names, fish titles and prices are fictional. Koi photos are real,
 * freely-licensed Wikimedia Commons files pinned to a specific path so a
 * re-seed references the same image. Varieties and supplies that have no
 * verified Commons file use a seeded placeholder rather than a guessed URL
 * that would 404.
 */

const COMMONS = "https://upload.wikimedia.org/wikipedia/commons";

/** A seeded placeholder, for items with no verified Commons photo. */
const placeholder = (seed: string) =>
  `https://picsum.photos/seed/${toHandle(seed)}/1200/900`;

const COUNTRY = "id";
const CURRENCY = "idr";
/** Shared by every seeded seller and customer. Dev data only. */
const SEED_PASSWORD = "supersecret";
/** Every seeded login lives on this domain, so test accounts are greppable. */
const EMAIL_DOMAIN = "koi.dev";

// ---------------------------------------------------------------------------
// Attribute vocabularies
// ---------------------------------------------------------------------------

/** Body length in cm — the variant axis koi are actually priced on. */
const KOI_SIZES = ["25", "30", "35", "40", "45", "50", "55", "60", "65", "70"];
/** Net weight — the variant axis for feed and medication. */
const SUPPLY_WEIGHTS = ["250 g", "500 g", "1 kg", "5 kg", "10 kg"];
/** Size grade — the variant axis for hardware, which is not sold by weight. */
const SUPPLY_GRADES = ["S", "M", "L", "Standar"];

const KOI_AGES = [
  "Tosai (1 tahun)",
  "Nisai (2 tahun)",
  "Sansai (3 tahun)",
  "Yonsai (4 tahun)",
  "Gosai (5 tahun)",
];
const KOI_SEXES = ["Jantan", "Betina", "Belum Diketahui"];
const KOI_ORIGINS = [
  "Impor Jepang",
  "Lokal Blitar",
  "Lokal Sukabumi",
  "Lokal Bogor",
  "Lokal Kediri",
];
const KOI_SCALE_TYPES = ["Standar", "Doitsu", "Ginrin"];
const KOI_BLOODLINES = [
  "Sakai",
  "Dainichi",
  "Momotaro",
  "Omosako",
  "Isa",
  "Marudo",
  "Konishi",
  "Maruhiro",
  "Torazo",
  "Bloodline Lokal",
];
const KOI_CERTIFICATES = [
  "ZNA",
  "Sertifikat Breeder",
  "Tanpa Sertifikat",
];
const FEED_TYPES = ["Growth", "Color", "Staple", "Wheatgerm", "Spirulina"];
const PELLET_SIZES = ["2 mm", "3 mm", "5 mm", "7 mm"];

/** `SupplyItem.axis` → the attribute handle it is seeded under, and the
    product-option name a variant on that axis takes. */
const SUPPLY_AXES = {
  berat: { handle: "berat", option: "Berat", values: SUPPLY_WEIGHTS },
  grade: { handle: "varian", option: "Varian", values: SUPPLY_GRADES },
} as const;

/*
 * The global attributes every seeded product attaches to.
 *
 * Only one attribute per product may be a variant axis (`axis: true`), because
 * a variant's `options` must name exactly the axes its product attached: koi
 * are priced by body length, feed and medication by net weight, hardware by
 * size grade. Everything else is a filter, not a price point.
 *
 * Module scope, not inside the seeder, so `assertSeedData` can check that every
 * handle a product attaches actually exists here.
 */
const ATTRIBUTE_DEFS: {
  name: string;
  handle: string;
  values: readonly string[];
  axis?: boolean;
}[] = [
  { name: "Ukuran", handle: "ukuran", values: KOI_SIZES, axis: true },
  { name: "Berat", handle: "berat", values: SUPPLY_WEIGHTS, axis: true },
  { name: "Varian", handle: "varian", values: SUPPLY_GRADES, axis: true },
  { name: "Umur", handle: "umur", values: KOI_AGES },
  { name: "Jenis Kelamin", handle: "jenis-kelamin", values: KOI_SEXES },
  { name: "Asal", handle: "asal", values: KOI_ORIGINS },
  { name: "Tipe Sisik", handle: "tipe-sisik", values: KOI_SCALE_TYPES },
  { name: "Bloodline", handle: "bloodline", values: KOI_BLOODLINES },
  { name: "Sertifikat", handle: "sertifikat", values: KOI_CERTIFICATES },
  { name: "Tipe Pakan", handle: "tipe-pakan", values: FEED_TYPES },
  { name: "Ukuran Butiran", handle: "ukuran-butiran", values: PELLET_SIZES },
];

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/** Two departments, each cut into the shelves the storefront links to. */
const CATEGORY_TREE: Record<string, string[]> = {
  Koi: [
    "Kohaku",
    "Sanke",
    "Showa",
    "Shiro Utsuri",
    "Hi Utsuri",
    "Asagi",
    "Shusui",
    "Tancho",
    "Ogon",
    "Kujaku",
    "Chagoi",
    "Goshiki",
    "Bekko",
  ],
  Perlengkapan: [
    "Pakan",
    "Obat & Perawatan",
    "Filter & Pompa",
    "Peralatan Kolam",
    "Aksesori",
  ],
};

// ---------------------------------------------------------------------------
// Koi catalog — generated from the variety table, two listings per variety
// ---------------------------------------------------------------------------

type KoiVariety = {
  /** Must match a child of `Koi` in {@link CATEGORY_TREE}. */
  category: string;
  /** Verified Commons files, or `[]` to fall back to a placeholder. */
  images: string[];
  /** Rupiah band for a fish at the 45 cm reference size. */
  priceBand: [number, number];
  /** Two listing variants of the variety: a title suffix and its blurb. */
  listings: [string, string][];
};

const KOI_VARIETIES: KoiVariety[] = [
  {
    category: "Kohaku",
    images: [
      `${COMMONS}/e/ee/Sandan_Kohaku.jpg`,
      `${COMMONS}/thumb/e/e3/Kohaku_nishikigoi_Konishi_Koi_Farm_Martin_Kammerer_ID7185-.jpg/1280px-Kohaku_nishikigoi_Konishi_Koi_Farm_Martin_Kammerer_ID7185-.jpg`,
      `${COMMONS}/thumb/f/f6/Koi_head_closeup.jpg/1280px-Koi_head_closeup.jpg`,
    ],
    priceBand: [3_200_000, 9_500_000],
    listings: [
      [
        "Maruten Sandan",
        "Kohaku shiro bersih dengan tiga pola hi dan maruten di kepala. Hasil seleksi kolam sendiri, sudah lulus karantina.",
      ],
      [
        "Inazuma Nisai",
        "Pola inazuma yang tegas dari kepala ke ekor. Badan tebal, pertumbuhan stabil di kolam tanah.",
      ],
    ],
  },
  {
    category: "Sanke",
    images: [
      `${COMMONS}/e/e3/4_year_old_Sanke.jpg`,
      `${COMMONS}/thumb/3/3b/Sanke.JPG/1280px-Sanke.JPG`,
      `${COMMONS}/e/e7/Doitsu_Sanke.JPG`,
    ],
    priceBand: [4_100_000, 8_600_000],
    listings: [
      [
        "Sandan Shiro Bersih",
        "Taisho Sanke dengan sumi rapi di punggung dan shiro berkualitas. Cocok untuk koleksi maupun kontes.",
      ],
      [
        "Doitsu Ramping",
        "Sanke bersisik doitsu dengan badan ramping. Sisik cermin berderet rapi di sepanjang gurat sisi.",
      ],
    ],
  },
  {
    category: "Showa",
    images: [
      `${COMMONS}/5/5f/Showa.jpg`,
      `${COMMONS}/8/83/6_year_old_Showa.jpg`,
      `${COMMONS}/0/07/Gin_Rin_Showa.jpg`,
    ],
    priceBand: [5_400_000, 14_500_000],
    listings: [
      [
        "Kindai Sumi Pekat",
        "Showa kindai dengan sumi pekat dan hi yang seimbang. Badan kekar, sirip utuh.",
      ],
      [
        "Gin Rin Kontes",
        "Showa gin rin — sisik metalik berkilau di bawah sumi. Pernah menempati posisi tiga di kontes regional.",
      ],
    ],
  },
  {
    category: "Shiro Utsuri",
    images: [
      `${COMMONS}/0/0d/Shiro_Utsuri.jpg`,
      `${COMMONS}/1/11/One_year_old_shiro-utsuri.jpg`,
      `${COMMONS}/thumb/8/85/Ginrinshiroutsuri.JPG/1280px-Ginrinshiroutsuri.JPG`,
    ],
    priceBand: [3_600_000, 7_400_000],
    listings: [
      [
        "Nidan Sumi Bersih",
        "Shiro Utsuri dengan sumi nidan yang bersih di atas shiro kapas. Pola seimbang kiri-kanan.",
      ],
      [
        "Gin Rin Sansai",
        "Shiro Utsuri gin rin, sumi tebal dengan kilau sisik yang rata di seluruh badan.",
      ],
    ],
  },
  {
    category: "Hi Utsuri",
    images: [
      `${COMMONS}/0/0f/Hi_Utsuri.JPG`,
      `${COMMONS}/thumb/8/85/Ginrinshiroutsuri.JPG/1280px-Ginrinshiroutsuri.JPG`,
    ],
    priceBand: [2_800_000, 5_200_000],
    listings: [
      [
        "Merah Menyala",
        "Hi Utsuri dengan dasar merah menyala dan sumi yang menyebar dari pangkal ekor.",
      ],
      [
        "Doitsu Nisai",
        "Hi Utsuri doitsu, kontras merah dan sumi terlihat tegas tanpa sisik penutup.",
      ],
    ],
  },
  {
    category: "Asagi",
    images: [
      `${COMMONS}/thumb/d/dc/Asagi.JPG/1280px-Asagi.JPG`,
      `${COMMONS}/thumb/2/2a/Koi_asagi.jpg/1280px-Koi_asagi.jpg`,
      `${COMMONS}/1/17/Show_winning_Asagi_from_Nagoshi_Fish_Farm.jpg`,
    ],
    priceBand: [3_100_000, 6_200_000],
    listings: [
      [
        "Matsuba Rapi",
        "Asagi dengan jaring sisik matsuba biru rapi dan hi oranye di pipi serta sirip.",
      ],
      [
        "Konjo Tua",
        "Asagi konjo dengan biru tua merata. Badan panjang, cocok untuk kolam dalam.",
      ],
    ],
  },
  {
    category: "Shusui",
    images: [
      `${COMMONS}/thumb/7/76/Shusui.JPG/1280px-Shusui.JPG`,
      `${COMMONS}/thumb/2/2a/Koi_asagi.jpg/1280px-Koi_asagi.jpg`,
    ],
    priceBand: [2_900_000, 5_600_000],
    listings: [
      [
        "Doitsu Biru",
        "Shusui — versi doitsu dari Asagi. Biru bersih dengan barisan sisik cermin di punggung.",
      ],
      [
        "Hana Shusui",
        "Hana Shusui dengan hi yang menyebar di kedua sisi badan, bukan hanya di gurat sisi.",
      ],
    ],
  },
  {
    category: "Tancho",
    images: [
      `${COMMONS}/thumb/8/85/Tanchosanke.JPG/1280px-Tanchosanke.JPG`,
      `${COMMONS}/thumb/1/10/Ojiya_Nishikigoi_no_Sato_ac_%283%29.jpg/1280px-Ojiya_Nishikigoi_no_Sato_ac_%283%29.jpg`,
    ],
    priceBand: [6_800_000, 13_500_000],
    listings: [
      [
        "Sanke Hi Bulat",
        "Tancho Sanke dengan hi bulat sempurna di kepala. Tanpa hi di badan, pola bersih.",
      ],
      [
        "Kohaku Simetris",
        "Tancho Kohaku, bulatan hi tepat di tengah kepala dan shiro tanpa cacat.",
      ],
    ],
  },
  {
    category: "Ogon",
    images: [],
    priceBand: [1_800_000, 4_400_000],
    listings: [
      [
        "Yamabuki Metalik",
        "Ogon yamabuki dengan warna kuning metalik rata dari kepala sampai ekor.",
      ],
      [
        "Platinum Nisai",
        "Platinum Ogon, putih metalik bersih. Ikan penyeimbang warna untuk kolam campuran.",
      ],
    ],
  },
  {
    category: "Kujaku",
    images: [],
    priceBand: [2_600_000, 6_800_000],
    listings: [
      [
        "Matsuba Metalik",
        "Kujaku dengan jaring matsuba metalik dan hi oranye yang tersusun rapi di punggung.",
      ],
      [
        "Doitsu Kujaku",
        "Kujaku doitsu, kilau metalik lebih terlihat tanpa sisik kecil yang menutup.",
      ],
    ],
  },
  {
    category: "Chagoi",
    images: [],
    priceBand: [1_500_000, 5_200_000],
    listings: [
      [
        "Jinak Pakan Tangan",
        "Chagoi coklat teh, terkenal paling jinak dan cepat besar. Mengajak koi lain makan di permukaan.",
      ],
      [
        "Sansai Badan Tebal",
        "Chagoi sansai dengan badan tebal dan pertumbuhan cepat di kolam tanah.",
      ],
    ],
  },
  {
    category: "Goshiki",
    images: [],
    priceBand: [2_400_000, 6_100_000],
    listings: [
      [
        "Lima Warna Pekat",
        "Goshiki dengan lima warna yang menyatu: hi di atas dasar sumi, shiro, dan jaring biru.",
      ],
      [
        "Gin Rin Goshiki",
        "Goshiki gin rin, kilau sisik membuat jaring birunya lebih dalam.",
      ],
    ],
  },
  {
    category: "Bekko",
    images: [],
    priceBand: [1_900_000, 4_800_000],
    listings: [
      [
        "Shiro Bekko",
        "Shiro Bekko — shiro bersih dengan sumi yang hanya duduk di punggung, tanpa hi.",
      ],
      [
        "Aka Bekko",
        "Aka Bekko dengan dasar merah penuh dan titik sumi yang rapi di punggung.",
      ],
    ],
  },
];

// ---------------------------------------------------------------------------
// Supplies catalog — everything under `/toko`
// ---------------------------------------------------------------------------

type SupplyItem = {
  title: string;
  /** Must match a child of `Perlengkapan` in {@link CATEGORY_TREE}. */
  category: string;
  /** Which axis this item is sold on. Feed/medication by weight, rest by grade.
      Maps to an attribute through {@link SUPPLY_AXES}, not by name. */
  axis: "berat" | "grade";
  /** Values from {@link SUPPLY_WEIGHTS} or {@link SUPPLY_GRADES}. */
  variants: string[];
  /** Rupiah, for the first listed variant. */
  basePrice: number;
  description: string;
  /** Feed only — drives the `tipe-pakan` / `ukuran-butiran` attributes. */
  feed?: { type: string; pellet: string };
};

const SUPPLY_CATALOG: SupplyItem[] = [
  {
    title: "Pakan Growth Protein 40%",
    category: "Pakan",
    axis: "berat",
    variants: ["500 g", "1 kg", "5 kg"],
    basePrice: 68_000,
    description:
      "Pakan pertumbuhan protein 40% untuk koi muda. Butiran mengapung, tidak cepat membuat air keruh.",
    feed: { type: "Growth", pellet: "3 mm" },
  },
  {
    title: "Pakan Color Spirulina",
    category: "Pakan",
    axis: "berat",
    variants: ["500 g", "1 kg", "5 kg"],
    basePrice: 94_000,
    description:
      "Pakan penajam warna dengan spirulina. Menguatkan hi dan beni tanpa menguningkan shiro.",
    feed: { type: "Spirulina", pellet: "5 mm" },
  },
  {
    title: "Pakan Staple Harian",
    category: "Pakan",
    axis: "berat",
    variants: ["1 kg", "5 kg", "10 kg"],
    basePrice: 52_000,
    description:
      "Pakan harian untuk koi dewasa. Seimbang untuk pemberian sepanjang tahun.",
    feed: { type: "Staple", pellet: "5 mm" },
  },
  {
    title: "Pakan Wheatgerm Musim Hujan",
    category: "Pakan",
    axis: "berat",
    variants: ["1 kg", "5 kg"],
    basePrice: 76_000,
    description:
      "Wheatgerm untuk suhu air rendah. Mudah dicerna saat nafsu makan koi turun.",
    feed: { type: "Wheatgerm", pellet: "3 mm" },
  },
  {
    title: "Pakan Bibit Butiran Halus",
    category: "Pakan",
    axis: "berat",
    variants: ["250 g", "500 g", "1 kg"],
    basePrice: 44_000,
    description:
      "Butiran 2 mm untuk burayak dan tosai kecil. Tenggelam lambat agar terjangkau ikan kecil.",
    feed: { type: "Growth", pellet: "2 mm" },
  },
  {
    title: "Obat Anti Jamur & Bakteri",
    category: "Obat & Perawatan",
    axis: "berat",
    variants: ["250 g", "500 g"],
    basePrice: 85_000,
    description:
      "Perawatan untuk luka sirip dan infeksi jamur. Dosis per 1.000 liter tertera di kemasan.",
  },
  {
    title: "Garam Ikan Karantina",
    category: "Obat & Perawatan",
    axis: "berat",
    variants: ["1 kg", "5 kg", "10 kg"],
    basePrice: 28_000,
    description:
      "Garam non-iodium untuk kolam karantina. Menurunkan stres ikan baru datang.",
  },
  {
    title: "Obat Kutu & Parasit Kolam",
    category: "Obat & Perawatan",
    axis: "berat",
    variants: ["250 g", "500 g"],
    basePrice: 112_000,
    description:
      "Mengatasi kutu jarum dan parasit kulit. Aman untuk filter biologis pada dosis anjuran.",
  },
  {
    title: "Bakteri Starter Filter",
    category: "Obat & Perawatan",
    axis: "berat",
    variants: ["500 g", "1 kg"],
    basePrice: 96_000,
    description:
      "Bakteri pengurai amonia untuk mematangkan filter baru dalam dua minggu.",
  },
  {
    title: "Pompa Kolam Hemat Daya",
    category: "Filter & Pompa",
    axis: "grade",
    variants: ["S", "M", "L"],
    basePrice: 850_000,
    description:
      "Pompa sirkulasi hemat daya untuk kolam 3–15 m³. Dapat dipakai terus menerus.",
  },
  {
    title: "Media Filter Bioball",
    category: "Filter & Pompa",
    axis: "grade",
    variants: ["M", "L"],
    basePrice: 320_000,
    description:
      "Bioball sebagai rumah bakteri di ruang filter. Luas permukaan tinggi, mudah dibersihkan.",
  },
  {
    title: "Lampu UV Penjernih Air",
    category: "Filter & Pompa",
    axis: "grade",
    variants: ["S", "M", "L"],
    basePrice: 540_000,
    description:
      "Lampu UV untuk menekan alga hijau. Dipasang setelah pompa, sebelum kembali ke kolam.",
  },
  {
    title: "Jaring Koi Tangkai Panjang",
    category: "Peralatan Kolam",
    axis: "grade",
    variants: ["M", "L"],
    basePrice: 185_000,
    description:
      "Jaring halus tanpa simpul agar sisik dan sirip tidak tersangkut saat memindahkan ikan.",
  },
  {
    title: "Bowl Penilaian Koi",
    category: "Peralatan Kolam",
    axis: "grade",
    variants: ["M", "L", "Standar"],
    basePrice: 240_000,
    description:
      "Bowl biru untuk menilai pola dan warna koi. Dipakai juga saat transaksi dan kontes.",
  },
  {
    title: "Test Kit Air 5 Parameter",
    category: "Peralatan Kolam",
    axis: "grade",
    variants: ["Standar"],
    basePrice: 165_000,
    description:
      "Mengukur pH, amonia, nitrit, nitrat, dan kesadahan. Pegangan dasar sebelum menambah ikan.",
  },
  {
    title: "Kantong Transport Oksigen",
    category: "Aksesori",
    axis: "grade",
    variants: ["M", "L"],
    basePrice: 45_000,
    description:
      "Kantong dobel untuk pengiriman ikan. Kuat untuk perjalanan sampai 24 jam.",
  },
  {
    title: "Termometer Kolam Apung",
    category: "Aksesori",
    axis: "grade",
    variants: ["Standar"],
    basePrice: 38_000,
    description:
      "Termometer apung untuk memantau suhu air harian, penting saat musim berganti.",
  },
];

// ---------------------------------------------------------------------------
// Sellers — 20 breeders, 10 supply shops
// ---------------------------------------------------------------------------

type SellerConfig = {
  name: string;
  /** `farm` breeds its own koi; `shop` resells supplies. */
  kind: "farm" | "shop";
  city: string;
  province: string;
  address_1: string;
  speciality: string;
  rating: number;
  premium: boolean;
};

const FARMS: Omit<SellerConfig, "kind">[] = [
  { name: "Sakura Koi Farm", city: "Bogor", province: "Jawa Barat", address_1: "Jl. Raya Cibinong 12", speciality: "Kohaku, Sanke", rating: 4.8, premium: true },
  { name: "Nusantara Nishikigoi", city: "Blitar", province: "Jawa Timur", address_1: "Jl. Raya Kanigoro 45", speciality: "Showa, Shiro Utsuri", rating: 4.6, premium: true },
  { name: "Kolam Jaya Koi", city: "Bandung", province: "Jawa Barat", address_1: "Jl. Setiabudi 88", speciality: "Asagi, Shusui", rating: 4.4, premium: false },
  { name: "Tirta Mas Koi", city: "Sukabumi", province: "Jawa Barat", address_1: "Jl. Cisaat 21", speciality: "Kohaku, Tancho", rating: 4.7, premium: true },
  { name: "Blitar Nishikigoi Center", city: "Blitar", province: "Jawa Timur", address_1: "Jl. Tanjung 7", speciality: "Showa, Sanke", rating: 4.5, premium: false },
  { name: "Mustika Koi Farm", city: "Kediri", province: "Jawa Timur", address_1: "Jl. Pare Raya 103", speciality: "Kujaku, Ogon", rating: 4.3, premium: false },
  { name: "Banyu Urip Koi", city: "Sleman", province: "DI Yogyakarta", address_1: "Jl. Kaliurang Km 12", speciality: "Chagoi, Bekko", rating: 4.2, premium: false },
  { name: "Pandawa Koi", city: "Malang", province: "Jawa Timur", address_1: "Jl. Tlogomas 56", speciality: "Goshiki, Showa", rating: 4.6, premium: true },
  { name: "Cahaya Koi Nusantara", city: "Tulungagung", province: "Jawa Timur", address_1: "Jl. Boyolangu 18", speciality: "Kohaku, Hi Utsuri", rating: 4.4, premium: false },
  { name: "Gunung Salak Koi", city: "Cianjur", province: "Jawa Barat", address_1: "Jl. Pacet 9", speciality: "Asagi, Goshiki", rating: 4.1, premium: false },
  { name: "Rajawali Nishikigoi", city: "Semarang", province: "Jawa Tengah", address_1: "Jl. Gombel Lama 31", speciality: "Shiro Utsuri, Bekko", rating: 4.5, premium: false },
  { name: "Sentra Koi Klaten", city: "Klaten", province: "Jawa Tengah", address_1: "Jl. Jatinom 64", speciality: "Kohaku, Sanke", rating: 4.0, premium: false },
  { name: "Mina Tirta Koi", city: "Boyolali", province: "Jawa Tengah", address_1: "Jl. Ampel 22", speciality: "Chagoi, Ogon", rating: 4.2, premium: false },
  { name: "Puri Koi Magelang", city: "Magelang", province: "Jawa Tengah", address_1: "Jl. Bandongan 77", speciality: "Tancho, Kohaku", rating: 4.6, premium: true },
  { name: "Arwana Koi Depok", city: "Depok", province: "Jawa Barat", address_1: "Jl. Sawangan 41", speciality: "Shusui, Asagi", rating: 3.9, premium: false },
  { name: "Lestari Koi Farm", city: "Purwokerto", province: "Jawa Tengah", address_1: "Jl. Baturaden 15", speciality: "Showa, Kujaku", rating: 4.3, premium: false },
  { name: "Samudra Koi Solo", city: "Solo", province: "Jawa Tengah", address_1: "Jl. Mojosongo 29", speciality: "Hi Utsuri, Bekko", rating: 4.1, premium: false },
  { name: "Mekar Sari Koi", city: "Tangerang", province: "Banten", address_1: "Jl. Legok 53", speciality: "Kohaku, Goshiki", rating: 4.0, premium: false },
  { name: "Bumi Koi Surabaya", city: "Surabaya", province: "Jawa Timur", address_1: "Jl. Rungkut 112", speciality: "Sanke, Tancho", rating: 4.4, premium: false },
  { name: "Karya Koi Bekasi", city: "Bekasi", province: "Jawa Barat", address_1: "Jl. Jatiasih 6", speciality: "Ogon, Chagoi", rating: 3.8, premium: false },
];

const SHOPS: Omit<SellerConfig, "kind">[] = [
  { name: "Koi Supply Indonesia", city: "Jakarta Selatan", province: "DKI Jakarta", address_1: "Jl. Fatmawati 90", speciality: "Pakan, Obat", rating: 4.7, premium: true },
  { name: "Aquatic Pro Shop", city: "Surabaya", province: "Jawa Timur", address_1: "Jl. Kertajaya 38", speciality: "Filter, Pompa", rating: 4.5, premium: false },
  { name: "Toko Pakan Koi Jaya", city: "Blitar", province: "Jawa Timur", address_1: "Jl. Sudanco Supriadi 11", speciality: "Pakan", rating: 4.3, premium: false },
  { name: "Pond Tech Nusantara", city: "Bandung", province: "Jawa Barat", address_1: "Jl. Buah Batu 74", speciality: "Filter, Lampu UV", rating: 4.4, premium: false },
  { name: "Sehat Koi Veteriner", city: "Bogor", province: "Jawa Barat", address_1: "Jl. Pajajaran 50", speciality: "Obat, Perawatan", rating: 4.6, premium: true },
  { name: "Kolam Kita Equipment", city: "Semarang", province: "Jawa Tengah", address_1: "Jl. Majapahit 143", speciality: "Peralatan Kolam", rating: 4.1, premium: false },
  { name: "Mitra Filter Koi", city: "Sidoarjo", province: "Jawa Timur", address_1: "Jl. Waru 27", speciality: "Filter, Media", rating: 4.0, premium: false },
  { name: "Grosir Koi Yogyakarta", city: "Yogyakarta", province: "DI Yogyakarta", address_1: "Jl. Magelang Km 5", speciality: "Pakan, Aksesori", rating: 4.2, premium: false },
  { name: "Nirwana Aquatics", city: "Denpasar", province: "Bali", address_1: "Jl. Mahendradatta 62", speciality: "Aksesori, Peralatan", rating: 3.9, premium: false },
  { name: "Prima Koi Hardware", city: "Medan", province: "Sumatera Utara", address_1: "Jl. Gatot Subroto 201", speciality: "Pompa, Peralatan", rating: 4.0, premium: false },
];

const SELLER_CONFIGS: SellerConfig[] = [
  ...FARMS.map((f) => ({ ...f, kind: "farm" as const })),
  ...SHOPS.map((s) => ({ ...s, kind: "shop" as const })),
];

/** Local part derived from the name, so a seller's login is predictable. */
const sellerEmail = (name: string) =>
  `${toHandle(name).replace(/-/g, ".")}@${EMAIL_DOMAIN}`;

const PRIMARY_SELLER_EMAIL = sellerEmail(SELLER_CONFIGS[0].name);

// ---------------------------------------------------------------------------
// Test customers
// ---------------------------------------------------------------------------

const CUSTOMERS = [
  { first_name: "Budi", last_name: "Santoso", email: `budi@${EMAIL_DOMAIN}`, city: "Jakarta Selatan", address_1: "Jl. Kemang Raya 15", postal_code: "12730" },
  { first_name: "Siti", last_name: "Rahayu", email: `siti@${EMAIL_DOMAIN}`, city: "Bandung", address_1: "Jl. Dago 102", postal_code: "40135" },
  { first_name: "Agus", last_name: "Wijaya", email: `agus@${EMAIL_DOMAIN}`, city: "Surabaya", address_1: "Jl. Darmo 44", postal_code: "60241" },
  { first_name: "Dewi", last_name: "Lestari", email: `dewi@${EMAIL_DOMAIN}`, city: "Yogyakarta", address_1: "Jl. Kaliurang 7", postal_code: "55581" },
  { first_name: "Rian", last_name: "Pratama", email: `rian@${EMAIL_DOMAIN}`, city: "Medan", address_1: "Jl. Sei Batang Hari 9", postal_code: "20154" },
];

// ---------------------------------------------------------------------------
// Self-check — the one runnable check on the data above.
// Runs on every seed, so a bad edit fails before any write happens.
// ---------------------------------------------------------------------------

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function assertSeedData(): void {
  const koiCats = new Set(CATEGORY_TREE.Koi);
  const supplyCats = new Set(CATEGORY_TREE.Perlengkapan);

  assert.equal(SELLER_CONFIGS.length, 30, "expected 30 sellers");
  assert.equal(FARMS.length, 20, "expected 20 breeder sellers");
  assert.equal(SHOPS.length, 10, "expected 10 supply shops");

  const emails = SELLER_CONFIGS.map((s) => sellerEmail(s.name));
  for (const email of [...emails, ...CUSTOMERS.map((c) => c.email)]) {
    assert.ok(
      email.endsWith(`@${EMAIL_DOMAIN}`),
      `seeded login must be on @${EMAIL_DOMAIN}: ${email}`
    );
  }
  assert.equal(new Set(emails).size, emails.length, "seller emails must be unique");
  assert.equal(
    new Set(SELLER_CONFIGS.map((s) => s.name)).size,
    SELLER_CONFIGS.length,
    "seller names must be unique"
  );

  for (const variety of KOI_VARIETIES) {
    assert.ok(
      koiCats.has(variety.category),
      `koi variety "${variety.category}" is not a child of Koi`
    );
    assert.equal(variety.listings.length, 2, `${variety.category}: expected 2 listings`);
    const [min, max] = variety.priceBand;
    assert.ok(min > 0 && max > min, `${variety.category}: bad price band`);
  }

  for (const item of SUPPLY_CATALOG) {
    assert.ok(
      supplyCats.has(item.category),
      `supply "${item.title}" has unknown category ${item.category}`
    );
    assert.ok(item.variants.length > 0, `${item.title}: needs a variant`);
    const allowed: readonly string[] = SUPPLY_AXES[item.axis].values;
    for (const value of item.variants) {
      assert.ok(
        allowed.includes(value),
        `${item.title}: "${value}" is not a value of the ${item.axis} axis`
      );
    }
    if (item.feed) {
      assert.ok(FEED_TYPES.includes(item.feed.type), `${item.title}: bad feed type`);
      assert.ok(PELLET_SIZES.includes(item.feed.pellet), `${item.title}: bad pellet size`);
    }
  }

  /* Every handle the seeder attaches must exist in ATTRIBUTE_DEFS. This is the
     check that was missing when `axis: "grade"` was passed straight through as
     a handle — the attribute is seeded as "varian", so the run died mid-way
     with 30 sellers already written. */
  const attrHandles = new Set(ATTRIBUTE_DEFS.map((a) => a.handle));
  const attachedHandles = [
    "ukuran",
    "umur",
    "jenis-kelamin",
    "asal",
    "tipe-sisik",
    "bloodline",
    "sertifikat",
    "tipe-pakan",
    "ukuran-butiran",
    ...Object.values(SUPPLY_AXES).map((a) => a.handle),
  ];
  for (const handle of attachedHandles) {
    assert.ok(
      attrHandles.has(handle),
      `product attaches attribute "${handle}", which ATTRIBUTE_DEFS does not define`
    );
  }
  assert.equal(
    ATTRIBUTE_DEFS.length,
    new Set(ATTRIBUTE_DEFS.map((a) => a.handle)).size,
    "attribute handles must be unique"
  );
  for (const def of ATTRIBUTE_DEFS) {
    assert.ok(def.values.length > 0, `attribute ${def.handle} has no values`);
  }

  /* A variant axis must carry every value its variants name, since the
     variant's `options` are matched against the attached axis values. */
  for (const axis of Object.values(SUPPLY_AXES)) {
    const def = ATTRIBUTE_DEFS.find((a) => a.handle === axis.handle);
    assert.ok(def?.axis, `${axis.handle} must be a variant axis`);
  }
  const sizeAxis = ATTRIBUTE_DEFS.find((a) => a.handle === "ukuran");
  assert.ok(sizeAxis?.axis, "ukuran must be a variant axis");
  for (const size of KOI_SIZES) {
    assert.ok(
      sizeAxis!.values.includes(size),
      `koi size ${size} missing from the ukuran axis`
    );
  }

  const titles = [
    ...KOI_VARIETIES.flatMap((v) =>
      v.listings.map(([suffix]) => `${v.category} ${suffix}`)
    ),
    ...SUPPLY_CATALOG.map((s) => s.title),
  ];
  const handles = titles.map(slugify);
  assert.equal(
    new Set(handles).size,
    handles.length,
    "product handles must be unique before suffixing"
  );
}

// ---------------------------------------------------------------------------
// Workflow helpers
// ---------------------------------------------------------------------------

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            }
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);

    return new WorkflowResponse(stores);
  }
);

export default async function seedKoiData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  assertSeedData();
  logger.info("Seed data self-check passed.");

  logger.info("Seeding koi store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [{ name: "Default Sales Channel" }],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        { currency_code: CURRENCY, is_default: true },
        { currency_code: "usd" },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "Indokoi",
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });

  logger.info("Seeding Indonesia region...");
  const regionModuleService = container.resolve(Modules.REGION);
  const existingRegions = await regionModuleService.listRegions({}, {
    relations: ["countries"],
  });

  let region = existingRegions.find((r) =>
    (r.countries ?? []).some((c) => c.iso_2 === COUNTRY)
  );

  if (!region) {
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Indonesia",
            currency_code: CURRENCY,
            countries: [COUNTRY],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    region = regionResult[0];
    logger.info("Created Indonesia region.");
  } else {
    logger.info("Indonesia region already exists, skipping.");
  }
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  const taxModuleService = container.resolve(Modules.TAX);
  const existingTaxRegions = await taxModuleService.listTaxRegions();
  if (!existingTaxRegions.some((tr) => tr.country_code === COUNTRY)) {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: COUNTRY, provider_id: "tp_system" }],
    });
  } else {
    logger.info("Tax region already exists, skipping.");
  }
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding publishable API key data...");
  const { data: existingKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token"],
    filters: { type: "publishable" },
  });

  // Only the two fields this script uses: `query.graph` and the create
  // workflow return different row shapes, and widening to either one drags in
  // columns (salt, sales_channels_link) the other does not select.
  let publishableApiKey: { id: string; token?: string } | undefined =
    existingKeys?.[0];

  if (!publishableApiKey) {
    const {
      result: [publishableApiKeyResult],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { title: "Koi Webshop", type: "publishable", created_by: "" },
        ],
      },
    });
    publishableApiKey = publishableApiKeyResult;
  }

  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishableApiKey.id,
        add: [defaultSalesChannel[0].id],
      },
    });
  } catch (error: unknown) {
    if (!(error instanceof Error && error.message.includes("already"))) {
      throw error;
    }
    logger.info("Sales channel already linked to API key, skipping.");
  }
  // Printed because both storefronts need it in
  // NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY, and a key from a previous database
  // will 500 the catalog pages.
  logger.info(
    `Publishable API key: ${publishableApiKey.token ?? publishableApiKey.id}`
  );
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding categories...");
  const productModule = container.resolve(Modules.PRODUCT);

  const parentNames = Object.keys(CATEGORY_TREE);
  const childNames = Object.values(CATEGORY_TREE).flat();

  const existingCats = await productModule.listProductCategories({
    name: [...parentNames, ...childNames],
  });
  const catByName = new Map(existingCats.map((c) => [c.name, c]));

  const missingParents = parentNames.filter((name) => !catByName.has(name));
  if (missingParents.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingParents.map((name) => ({
          name,
          is_active: true,
          rank: parentNames.indexOf(name),
        })),
      },
    });
    result.forEach((c) => catByName.set(c.name, c));
  }

  const childInputs: {
    name: string;
    is_active: boolean;
    rank: number;
    parent_category_id: string;
  }[] = [];
  for (const parent of parentNames) {
    CATEGORY_TREE[parent].forEach((childName, rank) => {
      if (!catByName.has(childName)) {
        childInputs.push({
          name: childName,
          is_active: true,
          rank,
          parent_category_id: catByName.get(parent)!.id,
        });
      }
    });
  }
  if (childInputs.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: childInputs },
    });
    result.forEach((c) => catByName.set(c.name, c));
  }
  logger.info(
    `Finished seeding ${parentNames.length} departments and ${childNames.length} shelves.`
  );

  logger.info("Seeding product attributes...");

  type SeededAttribute = {
    id: string;
    handle: string;
    values: { id: string; name: string }[];
  };

  const loadAttributes = async () => {
    const { data } = await query.graph({
      entity: "product_attribute",
      fields: ["id", "handle", "values.id", "values.name"],
      filters: {
        handle: ATTRIBUTE_DEFS.map((a) => a.handle),
        product_id: null,
      },
    });
    return new Map((data as SeededAttribute[]).map((a) => [a.handle, a]));
  };

  let attrByHandle = await loadAttributes();
  const missingAttrs = ATTRIBUTE_DEFS.filter((a) => !attrByHandle.has(a.handle));

  if (missingAttrs.length) {
    await createProductAttributesWorkflow(container).run({
      input: {
        attributes: missingAttrs.map((attr) => ({
          name: attr.name,
          handle: attr.handle,
          type: AttributeType.MULTI_SELECT,
          is_variant_axis: Boolean(attr.axis),
          is_filterable: true,
          rank: ATTRIBUTE_DEFS.findIndex((a) => a.handle === attr.handle),
          values: attr.values.map((name, rank) => ({ name, rank })),
        })),
      },
    });
    attrByHandle = await loadAttributes();
  }

  const attr = (handle: string) => {
    const found = attrByHandle.get(handle);
    if (!found) {
      throw new Error(`Attribute "${handle}" was not seeded`);
    }
    return found;
  };

  /** `{ id, value_ids }` for the named values, dropping any the attribute lacks. */
  const attach = (handle: string, names: string[]) => {
    const a = attr(handle);
    return {
      id: a.id,
      value_ids: names
        .map((name) => a.values.find((v) => v.name === name)?.id)
        .filter((id): id is string => Boolean(id)),
    };
  };
  logger.info(`Finished seeding ${ATTRIBUTE_DEFS.length} product attributes.`);

  const { data: existingSellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { email: PRIMARY_SELLER_EMAIL },
  });

  if (existingSellers[0]) {
    logger.info(
      "Koi sellers already exist, skipping seller, product, offer and customer seeding."
    );
    logger.info("Finished seeding.");
    return;
  }

  // Deterministic PRNG (mulberry32) so a re-seed produces the same spread.
  let rngState = 0x9e3779b9;
  const rand = () => {
    rngState = (rngState + 0x6d2b79f5) | 0;
    let t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const randInt = (min: number, max: number) =>
    min + Math.floor(rand() * (max - min + 1));
  const pick = <T,>(items: T[]) => items[randInt(0, items.length - 1)];

  const authModuleService = container.resolve(Modules.AUTH);

  /** Registers an emailpass identity, tolerating one that already exists. */
  const authIdentityFor = async (email: string) => {
    const registerResponse = await authModuleService.register("emailpass", {
      body: { email, password: SEED_PASSWORD },
    });

    if (registerResponse.success && registerResponse.authIdentity) {
      return registerResponse.authIdentity.id;
    }

    const [providerIdentity] = await authModuleService.listProviderIdentities({
      entity_id: email,
      provider: "emailpass",
    });
    return providerIdentity.auth_identity_id!;
  };

  logger.info("Seeding shared shipping profile...");
  let sharedShippingProfileId: string;
  const { data: existingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: { name: "Marketplace Shipping" },
  });
  if (existingProfiles[0]) {
    sharedShippingProfileId = existingProfiles[0].id as string;
  } else {
    const {
      result: [createdProfile],
    } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Marketplace Shipping", type: "default" }] },
    });
    sharedShippingProfileId = createdProfile.id;
  }

  const sellerLogo = (name: string) =>
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
  const sellerBanner = (name: string) =>
    `https://picsum.photos/seed/${toHandle(name)}/1200/320`;

  type SeededSeller = {
    id: string;
    name: string;
    kind: "farm" | "shop";
    memberId: string;
    stockLocationId: string;
    shippingProfileId: string;
  };
  const sellers: SeededSeller[] = [];

  logger.info(`Seeding ${SELLER_CONFIGS.length} sellers...`);

  for (const [index, sellerConfig] of SELLER_CONFIGS.entries()) {
    const email = sellerEmail(sellerConfig.name);
    const location = `${sellerConfig.city}, ${sellerConfig.province}`;
    const authIdentityId = await authIdentityFor(email);

    const { result: seller } = await createSellerAccountWorkflow(container).run({
      input: {
        auth_identity_id: authIdentityId,
        member_email: email,
        first_name: sellerConfig.name.split(" ")[0],
        last_name: sellerConfig.kind === "farm" ? "Farm" : "Shop",
        seller: {
          name: sellerConfig.name,
          email,
          currency_code: CURRENCY,
          description:
            sellerConfig.kind === "farm"
              ? `${sellerConfig.name} — pembudidaya koi di ${location}.`
              : `${sellerConfig.name} — penyedia perlengkapan kolam koi di ${location}.`,
          logo: sellerLogo(sellerConfig.name),
          banner: sellerBanner(sellerConfig.name),
          /*
           * The koi storefront reads location/speciality/rating/kind off
           * `seller.metadata` — a public seller record carries no such
           * columns. `kind` is what lets a card say "farm" or "shop".
           */
          metadata: {
            kind: sellerConfig.kind,
            location,
            speciality: sellerConfig.speciality,
            rating: sellerConfig.rating,
          },
          is_premium: sellerConfig.premium,
        },
      },
    });

    await approveSellerWorkflow(container).run({
      input: { seller_id: seller.id },
    });

    const { data: members } = await query.graph({
      entity: "member",
      fields: ["id"],
      filters: { email },
    });
    const memberId = members[0].id;

    const { result: stockLocations } =
      await createSellerStockLocationsWorkflow(container).run({
        input: {
          seller_id: seller.id,
          locations: [
            {
              name:
                sellerConfig.kind === "farm"
                  ? `${sellerConfig.name} Kolam`
                  : `${sellerConfig.name} Gudang`,
              address: {
                city: sellerConfig.city,
                country_code: "ID",
                address_1: sellerConfig.address_1,
              },
            },
          ],
        },
      });
    const stockLocation = stockLocations[0];

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    });

    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: stockLocation.id,
        add: [defaultSalesChannel[0].id],
      },
    });

    if (index === 0) {
      await updateStoresWorkflow(container).run({
        input: {
          selector: { id: store.id },
          update: { default_location_id: stockLocation.id },
        },
      });
    }

    await createLocationFulfillmentSetWorkflow(container).run({
      input: {
        location_id: stockLocation.id,
        fulfillment_set_data: {
          name: `${sellerConfig.name} delivery`,
          type: "shipping",
        },
      },
    });

    const {
      data: [locationWithSet],
    } = await query.graph({
      entity: "stock_location",
      fields: ["id", "fulfillment_sets.id"],
      filters: { id: stockLocation.id },
    });
    const fulfillmentSetId = locationWithSet?.fulfillment_sets?.[0]?.id;
    if (!fulfillmentSetId) {
      throw new Error(
        `Fulfillment set was not created for seller "${sellerConfig.name}"`
      );
    }

    const { result: serviceZones } = await createServiceZonesWorkflow(
      container
    ).run({
      input: {
        data: [
          {
            fulfillment_set_id: fulfillmentSetId,
            name: `${sellerConfig.name} Indonesia`,
            geo_zones: [{ country_code: COUNTRY, type: "country" as const }],
          },
        ],
      },
    });
    const serviceZoneId = serviceZones[0].id;

    /*
     * A live koi ships by oxygenated air cargo; a sack of feed goes by regular
     * courier. Both sell in the same cart, so each seller carries both options
     * and the buyer picks at checkout.
     */
    await createSellerShippingOptionsWorkflow(container).run({
      input: {
        seller_id: seller.id,
        shipping_options: [
          {
            name: "Kargo Udara",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: serviceZoneId,
            shipping_profile_id: sharedShippingProfileId,
            type: {
              label: "Kargo Udara",
              description: "Sampai 24 jam, ikan dikemas oksigen.",
              code: "air-cargo",
            },
            prices: [
              { currency_code: CURRENCY, amount: 185_000 },
              { region_id: region.id, amount: 185_000 },
            ],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
          {
            name: "Kurir Darat",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: serviceZoneId,
            shipping_profile_id: sharedShippingProfileId,
            type: {
              label: "Kurir Darat",
              description: "Sampai 3 hari, untuk wilayah pulau Jawa.",
              code: "ground",
            },
            prices: [
              { currency_code: CURRENCY, amount: 65_000 },
              { region_id: region.id, amount: 65_000 },
            ],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
        ],
      },
    });

    sellers.push({
      id: seller.id,
      name: sellerConfig.name,
      kind: sellerConfig.kind,
      memberId,
      stockLocationId: stockLocation.id,
      shippingProfileId: sharedShippingProfileId,
    });

    if ((index + 1) % 10 === 0) {
      logger.info(`  …${index + 1}/${SELLER_CONFIGS.length} sellers seeded.`);
    }
  }

  const farms = sellers.filter((s) => s.kind === "farm");
  const shops = sellers.filter((s) => s.kind === "shop");
  logger.info(
    `Finished seeding ${sellers.length} sellers (${farms.length} farms, ${shops.length} shops).`
  );

  logger.info("Seeding products...");

  const usedHandles = new Set<string>();
  const uniqueHandle = (title: string) => {
    const base = slugify(title);
    let handle = base;
    let n = 2;
    while (usedHandles.has(handle)) {
      handle = `${base}-${n++}`;
    }
    usedHandles.add(handle);
    return handle;
  };

  /** Everything an offer needs to know about the product it hangs off. */
  type PricedProduct = {
    product: CreateProductDTO;
    /** Rupiah at the reference size/first variant. */
    basePrice: number;
    /** Koi scale by body length; supplies take the base price per variant. */
    scaleByCm: boolean;
    /** Which half of the market lists it. */
    soldBy: "farm" | "shop";
  };

  const priced: PricedProduct[] = [];

  // --- Koi -----------------------------------------------------------------
  const SIZE_BANDS: string[][] = [
    ["25", "30", "35"],
    ["35", "40", "45"],
    ["45", "50", "55", "60"],
    ["50", "55", "60", "65"],
    ["55", "60", "65", "70"],
  ];

  for (const variety of KOI_VARIETIES) {
    for (const [suffix, description] of variety.listings) {
      const title = `${variety.category} ${suffix}`;
      const handle = uniqueHandle(title);
      const skuBase = handle.toUpperCase().replace(/-/g, "");
      const sizes = pick(SIZE_BANDS);
      const [minPrice, maxPrice] = variety.priceBand;
      const basePrice = randInt(minPrice, maxPrice);

      const images = (
        variety.images.length ? variety.images : [placeholder(title)]
      ).map((url) => ({ url }));

      const scaleType = suffix.includes("Doitsu")
        ? "Doitsu"
        : suffix.includes("Gin Rin")
          ? "Ginrin"
          : "Standar";

      priced.push({
        basePrice,
        scaleByCm: true,
        soldBy: "farm",
        product: {
          title,
          category_ids: [catByName.get(variety.category)!.id],
          description,
          handle,
          weight: 2000,
          status: ProductStatus.PUBLISHED,
          thumbnail: images[0].url,
          images,
          attributes: [
            attach("ukuran", sizes),
            attach("umur", [pick(KOI_AGES)]),
            attach("jenis-kelamin", [pick(KOI_SEXES)]),
            attach("asal", [pick(KOI_ORIGINS)]),
            attach("tipe-sisik", [scaleType]),
            attach("bloodline", [pick(KOI_BLOODLINES)]),
            attach("sertifikat", [pick(KOI_CERTIFICATES)]),
          ],
          variants: sizes.map((size) => ({
            title: `${size} cm`,
            sku: `${skuBase}-${size}CM`,
            options: { Ukuran: size },
          })),
        },
      });
    }
  }

  // --- Supplies ------------------------------------------------------------
  for (const item of SUPPLY_CATALOG) {
    const handle = uniqueHandle(item.title);
    const skuBase = handle.toUpperCase().replace(/-/g, "");
    const axis = SUPPLY_AXES[item.axis];
    const images = [{ url: placeholder(item.title) }];

    priced.push({
      basePrice: item.basePrice,
      scaleByCm: false,
      soldBy: "shop",
      product: {
        title: item.title,
        category_ids: [catByName.get(item.category)!.id],
        description: item.description,
        handle,
        weight: 1000,
        status: ProductStatus.PUBLISHED,
        thumbnail: images[0].url,
        images,
        attributes: [
          attach(axis.handle, item.variants),
          ...(item.feed
            ? [
                attach("tipe-pakan", [item.feed.type]),
                attach("ukuran-butiran", [item.feed.pellet]),
              ]
            : []),
        ],
        variants: item.variants.map((value) => ({
          title: value,
          sku: `${skuBase}-${slugify(value).toUpperCase()}`,
          options: { [axis.option]: value },
        })),
      },
    });
  }

  await createProductsWorkflow(container).run({
    input: {
      created_by: sellers[0].memberId,
      products: priced.map((p) => p.product),
    },
  });
  logger.info(
    `Finished seeding ${priced.length} products (${
      priced.filter((p) => p.soldBy === "farm").length
    } koi, ${priced.filter((p) => p.soldBy === "shop").length} supplies).`
  );

  logger.info("Creating offers across sellers...");

  const metaByHandle = new Map(
    priced.map((p) => [p.product.handle as string, p])
  );

  const { data: seededProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku", "variants.title"],
    filters: {
      handle: priced
        .map((p) => p.product.handle)
        .filter((handle): handle is string => Boolean(handle)),
    },
  });

  /*
   * Round-robin first, then random extras: the cursor guarantees every seller
   * in its pool gets at least one product before anyone gets a second, so no
   * seeded seller's page renders empty. Random extras on top give the buybox
   * several prices to rank on the busier products.
   */
  const cursors = { farm: 0, shop: 0 };
  const poolFor = (kind: "farm" | "shop") => (kind === "farm" ? farms : shops);
  const nextInRotation = (kind: "farm" | "shop") => {
    const pool = poolFor(kind);
    const seller = pool[cursors[kind] % pool.length];
    cursors[kind] += 1;
    return seller;
  };

  const offers: CreateOfferDTO[] = [];

  for (const product of seededProducts) {
    const meta = metaByHandle.get(product.handle);
    if (!meta) continue;

    const pool = poolFor(meta.soldBy);
    const participants = [nextInRotation(meta.soldBy)];
    const extras = randInt(0, Math.min(3, pool.length - 1));
    for (let i = 0; i < extras; i++) {
      const candidate = pool[randInt(0, pool.length - 1)];
      if (!participants.some((p) => p.id === candidate.id)) {
        participants.push(candidate);
      }
    }

    for (const seller of participants) {
      for (const variant of product.variants as {
        id: string;
        sku: string | null;
        title: string;
      }[]) {
        const jitter = 1 + (rand() * 0.3 - 0.15); // ±15% between sellers
        let amount: number;
        if (meta.scaleByCm) {
          // A longer fish costs more: the band price is quoted at 45 cm.
          const cm = Number.parseInt(variant.title, 10) || 45;
          amount = Math.round(meta.basePrice * (cm / 45) * jitter);
        } else {
          // Feed and hardware scale with the pack, which the variant names.
          const packIndex = Math.max(
            0,
            meta.product.variants!.findIndex((v) => v.title === variant.title)
          );
          amount = Math.round(meta.basePrice * (1 + packIndex * 0.8) * jitter);
        }

        const sku = `${meta.soldBy === "farm" ? "KOI" : "SUP"}-${seller.id.slice(
          -4
        )}-${variant.sku}`;

        offers.push({
          seller_id: seller.id,
          created_by: seller.memberId,
          sku,
          variant_id: variant.id,
          shipping_profile_id: seller.shippingProfileId,
          inventory_items: [
            {
              sku,
              stock_levels: [
                {
                  location_id: seller.stockLocationId,
                  // A named koi is near-unique stock; feed sits in a warehouse.
                  stocked_quantity: meta.scaleByCm
                    ? randInt(1, 4)
                    : randInt(15, 180),
                },
              ],
            },
          ],
          prices: [{ amount: Math.max(1, amount), currency_code: CURRENCY }],
        });
      }
    }
  }

  await createOffersWorkflow(container).run({ input: { offers } });

  const sellersWithOffers = new Set(offers.map((o) => o.seller_id)).size;
  logger.info(
    `Finished creating ${offers.length} offers across ${sellersWithOffers} sellers.`
  );
  // A seller with no offer has an empty storefront page, which looks like a bug
  // rather than seed data — so fail loudly instead of leaving it to be found.
  assert.equal(
    sellersWithOffers,
    sellers.length,
    `every seeded seller must carry an offer (${sellersWithOffers}/${sellers.length} did)`
  );

  logger.info(`Seeding ${CUSTOMERS.length} test customers...`);
  const customerModuleService = container.resolve(Modules.CUSTOMER);

  for (const customer of CUSTOMERS) {
    const authIdentityId = await authIdentityFor(customer.email);

    const { result: created } = await createCustomerAccountWorkflow(
      container
    ).run({
      input: {
        authIdentityId,
        customerData: {
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name,
        },
      },
    });

    await customerModuleService.createCustomerAddresses([
      {
        customer_id: created.id,
        address_name: "Rumah",
        is_default_shipping: true,
        is_default_billing: true,
        first_name: customer.first_name,
        last_name: customer.last_name,
        address_1: customer.address_1,
        city: customer.city,
        postal_code: customer.postal_code,
        country_code: COUNTRY,
      },
    ]);
  }
  logger.info(
    `Finished seeding customers. Every seeded login uses password "${SEED_PASSWORD}".`
  );

  logger.info("Finished seeding.");
}
