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

// Koi seed — the Indonesian species catalog the `storefront-koi` app renders.
// Complements `seed.ts` (footwear demo) rather than replacing it: different
// seller emails, an Indonesian region in IDR, and koi varieties instead of
// sandals. Both seeds can run against the same database.
//
// Farm names and fish titles are fictional. Product photos are real koi from
// Wikimedia Commons (freely licensed); URLs are pinned to specific files so a
// re-seed always references the same image.
type SeedKoiItem = {
  title: string;
  category: string;
  /** Body length in cm — the variant axis, and the "Ukuran" spec. */
  sizes: string[];
  /** Rupiah, for one fish at the smallest listed size. */
  basePrice: number;
  description: string;
  images: string[];
};

const COMMONS = "https://upload.wikimedia.org/wikipedia/commons";

const seedKoi: SeedKoiItem[] = [
  {
    title: "Kohaku Maruten Sandan",
    category: "Kohaku",
    sizes: ["45", "50", "55", "60"],
    basePrice: 8_500_000,
    description:
      "Kohaku shiro bersih dengan tiga pola hi dan maruten di kepala. Hasil seleksi kolam sendiri, sudah lulus karantina.",
    images: [
      `${COMMONS}/e/ee/Sandan_Kohaku.jpg`,
      `${COMMONS}/thumb/e/e3/Kohaku_nishikigoi_Konishi_Koi_Farm_Martin_Kammerer_ID7185-.jpg/1280px-Kohaku_nishikigoi_Konishi_Koi_Farm_Martin_Kammerer_ID7185-.jpg`,
      `${COMMONS}/thumb/f/f6/Koi_head_closeup.jpg/1280px-Koi_head_closeup.jpg`,
    ],
  },
  {
    title: "Kohaku Inazuma Nisai",
    category: "Kohaku",
    sizes: ["35", "40", "45"],
    basePrice: 3_200_000,
    description:
      "Pola inazuma yang tegas dari kepala ke ekor. Badan tebal, pertumbuhan stabil di kolam tanah.",
    images: [
      `${COMMONS}/thumb/e/ee/Sandan_Kohaku.jpg/1280px-Sandan_Kohaku.jpg`,
      `${COMMONS}/thumb/c/cd/Koi_grazing.jpg/1280px-Koi_grazing.jpg`,
    ],
  },
  {
    title: "Sanke Sandan Shiro Bersih",
    category: "Sanke",
    sizes: ["45", "50", "55", "60"],
    basePrice: 7_800_000,
    description:
      "Taisho Sanke dengan sumi rapi di punggung dan shiro berkualitas. Cocok untuk koleksi maupun kontes.",
    images: [
      `${COMMONS}/e/e3/4_year_old_Sanke.jpg`,
      `${COMMONS}/thumb/3/3b/Sanke.JPG/1280px-Sanke.JPG`,
      `${COMMONS}/e/e7/Doitsu_Sanke.JPG`,
    ],
  },
  {
    title: "Doitsu Sanke Ramping",
    category: "Sanke",
    sizes: ["40", "45", "50"],
    basePrice: 5_400_000,
    description:
      "Sanke bersisik doitsu dengan badan ramping. Sisik cermin berderet rapi di sepanjang gurat sisi.",
    images: [
      `${COMMONS}/e/e7/Doitsu_Sanke.JPG`,
      `${COMMONS}/thumb/3/3b/Sanke.JPG/1280px-Sanke.JPG`,
    ],
  },
  {
    title: "Showa Kindai Sumi Pekat",
    category: "Showa",
    sizes: ["50", "55", "60", "65"],
    basePrice: 9_400_000,
    description:
      "Showa kindai dengan sumi pekat dan hi yang seimbang. Badan kekar, sirip utuh.",
    images: [
      `${COMMONS}/5/5f/Showa.jpg`,
      `${COMMONS}/8/83/6_year_old_Showa.jpg`,
      `${COMMONS}/0/07/Gin_Rin_Showa.jpg`,
    ],
  },
  {
    title: "Gin Rin Showa Kontes",
    category: "Showa",
    sizes: ["50", "55", "60"],
    basePrice: 14_200_000,
    description:
      "Showa gin rin — sisik metalik berkilau di bawah sumi. Pernah menempati posisi tiga di kontes regional.",
    images: [
      `${COMMONS}/0/07/Gin_Rin_Showa.jpg`,
      `${COMMONS}/8/83/6_year_old_Showa.jpg`,
    ],
  },
  {
    title: "Shiro Utsuri Nidan",
    category: "Shiro Utsuri",
    sizes: ["45", "50", "55", "60"],
    basePrice: 6_900_000,
    description:
      "Shiro Utsuri dengan sumi nidan yang bersih di atas shiro kapas. Pola seimbang kiri-kanan.",
    images: [
      `${COMMONS}/0/0d/Shiro_Utsuri.jpg`,
      `${COMMONS}/1/11/One_year_old_shiro-utsuri.jpg`,
      `${COMMONS}/thumb/8/85/Ginrinshiroutsuri.JPG/1280px-Ginrinshiroutsuri.JPG`,
    ],
  },
  {
    title: "Hi Utsuri Merah Menyala",
    category: "Shiro Utsuri",
    sizes: ["40", "45", "50"],
    basePrice: 4_100_000,
    description:
      "Hi Utsuri dengan dasar merah menyala dan sumi yang menyebar dari pangkal ekor.",
    images: [
      `${COMMONS}/0/0f/Hi_Utsuri.JPG`,
      `${COMMONS}/thumb/8/85/Ginrinshiroutsuri.JPG/1280px-Ginrinshiroutsuri.JPG`,
    ],
  },
  {
    title: "Asagi Matsuba Rapi",
    category: "Asagi",
    sizes: ["45", "50", "55"],
    basePrice: 5_600_000,
    description:
      "Asagi dengan jaring sisik matsuba biru rapi dan hi oranye di pipi serta sirip.",
    images: [
      `${COMMONS}/thumb/d/dc/Asagi.JPG/1280px-Asagi.JPG`,
      `${COMMONS}/thumb/2/2a/Koi_asagi.jpg/1280px-Koi_asagi.jpg`,
      `${COMMONS}/1/17/Show_winning_Asagi_from_Nagoshi_Fish_Farm.jpg`,
    ],
  },
  {
    title: "Shusui Doitsu Biru",
    category: "Shusui",
    sizes: ["40", "45", "50"],
    basePrice: 4_800_000,
    description:
      "Shusui — versi doitsu dari Asagi. Biru bersih dengan barisan sisik cermin di punggung.",
    images: [
      `${COMMONS}/thumb/7/76/Shusui.JPG/1280px-Shusui.JPG`,
      `${COMMONS}/thumb/2/2a/Koi_asagi.jpg/1280px-Koi_asagi.jpg`,
    ],
  },
  {
    title: "Tancho Sanke Hi Bulat",
    category: "Tancho",
    sizes: ["45", "50", "55"],
    basePrice: 11_800_000,
    description:
      "Tancho Sanke dengan hi bulat sempurna di kepala. Tanpa hi di badan, pola bersih.",
    images: [
      `${COMMONS}/thumb/8/85/Tanchosanke.JPG/1280px-Tanchosanke.JPG`,
      `${COMMONS}/thumb/1/10/Ojiya_Nishikigoi_no_Sato_ac_%283%29.jpg/1280px-Ojiya_Nishikigoi_no_Sato_ac_%283%29.jpg`,
    ],
  },
  {
    title: "Koi Campuran Pilihan Kolam",
    category: "Kohaku",
    sizes: ["25", "30", "35"],
    basePrice: 850_000,
    description:
      "Paket koi pilihan untuk kolam pemula. Varietas campuran, sehat, sudah melewati karantina.",
    images: [
      `${COMMONS}/9/90/Six_koi.jpg`,
      `${COMMONS}/thumb/6/62/Koi_in_a_garden_pond_in_Tuntorp_3.jpg/1280px-Koi_in_a_garden_pond_in_Tuntorp_3.jpg`,
      `${COMMONS}/thumb/4/48/Koi_in_a_transport_container.jpg/1280px-Koi_in_a_transport_container.jpg`,
    ],
  },
];

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

  const COUNTRY = "id";
  const CURRENCY = "idr";

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

  // Keep whatever the footwear seed set up, and make Rupiah the default this
  // storefront quotes in.
  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        { currency_code: CURRENCY, is_default: true },
        { currency_code: "usd" },
        { currency_code: "eur" },
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
  let publishableApiKey;
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: { type: "publishable" },
  });

  publishableApiKey = data?.[0];

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
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding koi variety categories...");
  const productModule = container.resolve(Modules.PRODUCT);

  // The koi storefront reads a two-level tree: a parent (the department) and
  // its varieties, which are what product cards and /kategori/[category] use.
  const CATEGORY_TREE: Record<string, string[]> = {
    Koi: ["Kohaku", "Sanke", "Showa", "Shiro Utsuri", "Asagi", "Shusui", "Tancho"],
  };
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
  logger.info("Finished seeding koi variety categories.");

  logger.info("Seeding product attributes...");
  // Body length is the one axis a koi is really sold on: the same variety at
  // 45 cm and 60 cm is two price points, so it becomes a variant axis and the
  // product page's picker. Everything else about a fish is an offer's or a
  // listing's business, not the master product's.
  const KOI_SIZES = ["25", "30", "35", "40", "45", "50", "55", "60", "65"];

  type SeededAttribute = {
    id: string;
    handle: string;
    values: { id: string; name: string }[];
  };

  const loadAttributes = async () => {
    const { data } = await query.graph({
      entity: "product_attribute",
      fields: ["id", "handle", "values.id", "values.name"],
      filters: { handle: ["ukuran"], product_id: null },
    });
    return new Map((data as SeededAttribute[]).map((a) => [a.handle, a]));
  };

  let attrByHandle = await loadAttributes();

  if (!attrByHandle.has("ukuran")) {
    await createProductAttributesWorkflow(container).run({
      input: {
        attributes: [
          {
            name: "Ukuran",
            handle: "ukuran",
            type: AttributeType.MULTI_SELECT,
            is_variant_axis: true,
            is_filterable: true,
            rank: 0,
            values: KOI_SIZES.map((name, rank) => ({ name, rank })),
          },
        ],
      },
    });
    attrByHandle = await loadAttributes();
  }

  const sizeAttr = attrByHandle.get("ukuran")!;
  const valueId = (attr: SeededAttribute, name: string) =>
    attr.values.find((v) => v.name === name)?.id;
  logger.info("Finished seeding product attributes.");

  const SELLER_PASSWORD = "supersecret";
  const SELLER_CONFIGS = [
    {
      name: "Sakura Koi Farm",
      email: "sakura@indokoi.dev",
      first_name: "Sakura",
      last_name: "Farm",
      city: "Bogor",
      address_1: "Jl. Raya Cibinong 12",
      location: "Bogor, Jawa Barat",
      speciality: "Kohaku, Sanke",
      rating: 4.8,
      premium: true,
    },
    {
      name: "Nusantara Nishikigoi",
      email: "nusantara@indokoi.dev",
      first_name: "Nusantara",
      last_name: "Nishikigoi",
      city: "Blitar",
      address_1: "Jl. Raya Kanigoro 45",
      location: "Blitar, Jawa Timur",
      speciality: "Showa, Shiro Utsuri",
      rating: 4.6,
      premium: false,
    },
    {
      name: "Kolam Jaya Koi",
      email: "kolamjaya@indokoi.dev",
      first_name: "Jaya",
      last_name: "Kolam",
      city: "Bandung",
      address_1: "Jl. Setiabudi 88",
      location: "Bandung, Jawa Barat",
      speciality: "Asagi, Shusui",
      rating: 4.4,
      premium: false,
    },
  ];
  const PRIMARY_SELLER_EMAIL = SELLER_CONFIGS[0].email;

  const sellerLogo = (name: string) =>
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
  const sellerBanner = (name: string) =>
    `https://picsum.photos/seed/${toHandle(name)}/1200/320`;

  const { data: existingSellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { email: PRIMARY_SELLER_EMAIL },
  });

  if (existingSellers[0]) {
    logger.info(
      "Koi sellers already exist, skipping seller, product and offer seeding."
    );
    logger.info("Finished seeding.");
    return;
  }

  const authModuleService = container.resolve(Modules.AUTH);

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

  type SeededSeller = {
    id: string;
    name: string;
    memberId: string;
    stockLocationId: string;
    shippingProfileId: string;
  };
  const sellers: SeededSeller[] = [];

  for (const [index, sellerConfig] of SELLER_CONFIGS.entries()) {
    logger.info(`Seeding seller "${sellerConfig.name}"...`);

    let authIdentityId: string;
    const registerResponse = await authModuleService.register("emailpass", {
      body: { email: sellerConfig.email, password: SELLER_PASSWORD },
    });

    if (registerResponse.success && registerResponse.authIdentity) {
      authIdentityId = registerResponse.authIdentity.id;
    } else {
      const [providerIdentity] =
        await authModuleService.listProviderIdentities({
          entity_id: sellerConfig.email,
          provider: "emailpass",
        });
      authIdentityId = providerIdentity.auth_identity_id!;
    }

    const { result: seller } = await createSellerAccountWorkflow(
      container
    ).run({
      input: {
        auth_identity_id: authIdentityId,
        member_email: sellerConfig.email,
        first_name: sellerConfig.first_name,
        last_name: sellerConfig.last_name,
        seller: {
          name: sellerConfig.name,
          email: sellerConfig.email,
          currency_code: CURRENCY,
          description: `${sellerConfig.name} — pembudidaya koi di ${sellerConfig.location}.`,
          logo: sellerLogo(sellerConfig.name),
          banner: sellerBanner(sellerConfig.name),
          // The koi storefront reads location/speciality/rating off
          // `seller.metadata` — a public seller record carries no such columns.
          metadata: {
            location: sellerConfig.location,
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
      filters: { email: sellerConfig.email },
    });
    const memberId = members[0].id;

    const { result: stockLocations } =
      await createSellerStockLocationsWorkflow(container).run({
        input: {
          seller_id: seller.id,
          locations: [
            {
              name: `${sellerConfig.name} Kolam`,
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

    const shippingProfileId = sharedShippingProfileId;

    await createSellerShippingOptionsWorkflow(container).run({
      input: {
        seller_id: seller.id,
        shipping_options: [
          {
            name: "Kargo Udara",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: serviceZoneId,
            shipping_profile_id: shippingProfileId,
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
            shipping_profile_id: shippingProfileId,
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
      memberId,
      stockLocationId: stockLocation.id,
      shippingProfileId,
    });
    logger.info(`Finished seeding seller "${sellerConfig.name}".`);
  }

  const primarySeller = sellers[0];
  logger.info(`Finished seeding ${sellers.length} sellers.`);

  logger.info("Seeding koi products...");

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/'/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

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

  const products: CreateProductDTO[] = seedKoi.map((item) => {
    const handle = uniqueHandle(item.title);
    const skuBase = handle.toUpperCase().replace(/-/g, "");
    const images = item.images.map((url) => ({ url }));

    const attributes = [
      {
        id: sizeAttr.id,
        value_ids: item.sizes
          .map((size) => valueId(sizeAttr, size))
          .filter((id): id is string => Boolean(id)),
      },
    ];

    const variants = item.sizes.map((size) => ({
      title: `${size} cm`,
      sku: `${skuBase}-${size}CM`,
      options: { Ukuran: size },
    }));

    return {
      title: item.title,
      category_ids: [catByName.get(item.category)!.id],
      description: item.description,
      handle,
      weight: 2000,
      status: ProductStatus.PUBLISHED,
      thumbnail: images[0].url,
      images,
      attributes,
      variants,
    };
  });

  await createProductsWorkflow(container).run({
    input: {
      created_by: primarySeller.memberId,
      products,
    },
  });
  logger.info(`Finished seeding ${products.length} products.`);

  logger.info("Creating offers across farms...");

  // Deterministic PRNG (mulberry32) so re-seeding produces the same spread.
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

  const priceByHandle = new Map(
    products.map((product, index) => [product.handle, seedKoi[index].basePrice])
  );
  const { data: seededProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku", "variants.title"],
    filters: {
      handle: products
        .map((product) => product.handle)
        .filter((handle): handle is string => Boolean(handle)),
    },
  });

  const offers: CreateOfferDTO[] = [];

  for (const product of seededProducts) {
    const basePrice = priceByHandle.get(product.handle) ?? 1_000_000;

    const shuffledSellers = [...sellers].sort(() => rand() - 0.5);
    const participantCount = randInt(1, sellers.length);
    const participants = shuffledSellers.slice(0, participantCount);

    for (const seller of participants) {
      for (const variant of product.variants as {
        id: string;
        sku: string | null;
        title: string;
      }[]) {
        const offerCount = randInt(1, 2);
        // A longer fish costs more: the base price is per size class, scaled by
        // the variant's own centimetres.
        const cm = Number.parseInt(variant.title, 10) || 40;

        for (let o = 0; o < offerCount; o++) {
          const jitter = 1 + (rand() * 0.3 - 0.15); // ±15%
          const amount = Math.max(
            1,
            Math.round(basePrice * (cm / 45) * jitter)
          );
          const sku = `KOI-${seller.id.slice(-4)}-${variant.sku}-${o + 1}`;
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
                    stocked_quantity: 10,
                  },
                ],
              },
            ],
            prices: [{ amount, currency_code: CURRENCY }],
          });
        }
      }
    }
  }

  await createOffersWorkflow(container).run({ input: { offers } });
  logger.info(
    `Finished creating ${offers.length} offers across ${sellers.length} sellers.`
  );

  logger.info("Finished seeding.");
}
