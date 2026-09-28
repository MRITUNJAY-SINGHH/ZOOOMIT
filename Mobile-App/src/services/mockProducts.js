export const MOCK_PRODUCTS = [
  {
    _id: '6abae5ec37d8a3328729315a',
    name: 'Onion (Pyaaz)',
    slug: 'onion-pyaaz',
    subtitle: 'Zero Sprouting, Zero Smut',
    category: {
      _id: '6abae5eb37d8a33287293152',
      name: 'Fresh Vegetables',
      slug: 'fresh-vegetables'
    },
    subcategory: {
      _id: '6abae5eb37d8a33287293153',
      name: 'Fresh Vegetables',
      slug: 'fresh-vegetables-main'
    },
    sellingPrice: 67,
    mrp: 90,
    baseUnit: 'KG',
    sellingUnit: 'kg',
    minSaleQty: 1,
    maxSaleQty: 20,
    qtyStep: 1,
    stock: 250,
    isTrackInventory: true,
    isVeg: true,
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      {
        _id: 'v_onion_1kg',
        name: '1 kg',
        sellingPrice: 67,
        mrp: 90,
        conversionFactor: 1,
        conversionUnit: 'kg',
        stock: 150
      },
      {
        _id: 'v_onion_3x1kg',
        name: '3 x 1 kg',
        sellingPrice: 198,
        mrp: 270,
        conversionFactor: 3,
        conversionUnit: 'kg',
        stock: 50
      },
      {
        _id: 'v_onion_3kg',
        name: '3 kg',
        sellingPrice: 198,
        mrp: 250,
        conversionFactor: 3,
        conversionUnit: 'kg',
        stock: 50
      }
    ],
    highlights: [
      { key: 'Included In The Box', value: '1 x Onion (1 kg)' },
      { key: 'Pack Size', value: '1 kg' },
      { key: 'Packaging Type', value: 'Tubular Soft Net Bags' },
      { key: 'Special Feature', value: 'Rich in Antioxidants' }
    ],
    description: 'Farm-fresh, crisp, and pungent Indian onions directly sourced from verified farms in Nashik and Maharashtra. Each bulb is cleaned, sorted, and packed to ensure zero sprouting and zero smut.',
    healthBenefits: 'Rich in vitamin C, flavonoids, and dietary fiber. Known to support cardiovascular health, boost immunity, and regulate blood sugar levels naturally.',
    storageInfo: 'Store in a cool, well-ventilated, dry place away from direct sunlight. Do not store in plastic bags or inside the refrigerator before cutting.',
    sellerDetails: {
      name: 'PJIT TECHNOLOGIES PVT LTD',
      fssaiNumber: '12725052000372',
      address: 'Kuiklo Fulfillment Center, Sector 62, Noida, Uttar Pradesh'
    },
    countryOfOrigin: 'India',
    ean: '2116'
  },
  {
    _id: '6abae5ec37d8a33287293162',
    name: 'Indian Tomato (Tamatar)',
    slug: 'indian-tomato-tamatar',
    subtitle: 'Juicy, Tangy & Freshly Plucked',
    category: {
      _id: '6abae5eb37d8a33287293152',
      name: 'Fresh Vegetables',
      slug: 'fresh-vegetables'
    },
    sellingPrice: 34,
    mrp: 46,
    baseUnit: 'GM',
    sellingUnit: '500 g',
    minSaleQty: 1,
    maxSaleQty: 15,
    qtyStep: 1,
    stock: 200,
    isVeg: true,
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1546470427-e26264be0b11?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      {
        _id: 'v_tomato_500g',
        name: '500 g',
        sellingPrice: 34,
        mrp: 46,
        conversionFactor: 0.5,
        conversionUnit: 'kg',
        stock: 120
      },
      {
        _id: 'v_tomato_1kg',
        name: '1 kg',
        sellingPrice: 65,
        mrp: 90,
        conversionFactor: 1,
        conversionUnit: 'kg',
        stock: 80
      },
      {
        _id: 'v_tomato_2x500g',
        name: '2 x 500 g',
        sellingPrice: 65,
        mrp: 92,
        conversionFactor: 1,
        conversionUnit: 'kg',
        stock: 50
      }
    ],
    highlights: [
      { key: 'Included In The Box', value: '1 x Indian Tomato (500 g)' },
      { key: 'Pack Size', value: '500 g' },
      { key: 'Packaging Type', value: 'Perforated Punnet' },
      { key: 'Special Feature', value: 'Rich in Lycopene' }
    ],
    description: 'Fresh local country tomatoes with a vibrant tangy flavor, ideal for Indian gravies, rasam, and fresh salads.',
    healthBenefits: 'Loaded with lycopene, vitamin C, potassium, and folate.',
    storageInfo: 'Store at room temperature until ripe. Refrigerate only once fully ripe.',
    sellerDetails: {
      name: 'PJIT TECHNOLOGIES PVT LTD',
      fssaiNumber: '12725052000372'
    },
    countryOfOrigin: 'India',
    ean: '2117'
  },
  {
    _id: '6abae5ec37d8a3328729316a',
    name: 'Potato (Aloo)',
    slug: 'potato-aloo',
    subtitle: 'Golden Skin, Firm & Earthy',
    category: {
      _id: '6abae5eb37d8a33287293152',
      name: 'Fresh Vegetables',
      slug: 'fresh-vegetables'
    },
    sellingPrice: 22,
    mrp: 30,
    baseUnit: 'KG',
    sellingUnit: '1 kg',
    minSaleQty: 1,
    maxSaleQty: 25,
    qtyStep: 1,
    stock: 300,
    isVeg: true,
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      {
        _id: 'v_potato_1kg',
        name: '1 kg',
        sellingPrice: 22,
        mrp: 30,
        conversionFactor: 1,
        conversionUnit: 'kg',
        stock: 200
      },
      {
        _id: 'v_potato_3kg',
        name: '3 kg',
        sellingPrice: 62,
        mrp: 85,
        conversionFactor: 3,
        conversionUnit: 'kg',
        stock: 100
      },
      {
        _id: 'v_potato_3x1kg',
        name: '3 x 1 kg',
        sellingPrice: 64,
        mrp: 90,
        conversionFactor: 3,
        conversionUnit: 'kg',
        stock: 50
      },
      {
        _id: 'v_potato_500g',
        name: '500 g',
        sellingPrice: 12,
        mrp: 18,
        conversionFactor: 0.5,
        conversionUnit: 'kg',
        stock: 100
      }
    ],
    highlights: [
      { key: 'Included In The Box', value: '1 x Potato (1 kg)' },
      { key: 'Pack Size', value: '1 kg' },
      { key: 'Packaging Type', value: 'Ventilated Mesh Bag' },
      { key: 'Special Feature', value: 'Low Sugar & Starch-Rich' }
    ],
    description: 'Versatile, firm, unsprouted potatoes sourced directly from Agra and Punjab farms. Perfect for curries, fries, and roasting.',
    healthBenefits: 'Good source of dietary potassium, fiber, and vitamin B6.',
    storageInfo: 'Store in a dry, dark, well-ventilated spot away from onions.',
    sellerDetails: {
      name: 'PJIT TECHNOLOGIES PVT LTD',
      fssaiNumber: '12725052000372'
    },
    countryOfOrigin: 'India',
    ean: '2118'
  },
  {
    _id: '6abae5ed37d8a33287293173',
    name: 'Ooty Carrot (Gajar)',
    slug: 'ooty-carrot-gajar',
    subtitle: 'Crunchy, Sweet & Vibrant Orange',
    category: {
      _id: '6abae5eb37d8a33287293152',
      name: 'Fresh Vegetables',
      slug: 'fresh-vegetables'
    },
    sellingPrice: 25,
    mrp: 35,
    baseUnit: 'GM',
    sellingUnit: '250 g',
    minSaleQty: 1,
    maxSaleQty: 15,
    qtyStep: 1,
    stock: 180,
    isVeg: true,
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      {
        _id: 'v_carrot_250g',
        name: '250 g',
        sellingPrice: 25,
        mrp: 35,
        conversionFactor: 0.25,
        conversionUnit: 'kg',
        stock: 100
      },
      {
        _id: 'v_carrot_2x250g',
        name: '2 x 250 g',
        sellingPrice: 48,
        mrp: 70,
        conversionFactor: 0.5,
        conversionUnit: 'kg',
        stock: 60
      },
      {
        _id: 'v_carrot_500g',
        name: '500 g',
        sellingPrice: 48,
        mrp: 68,
        conversionFactor: 0.5,
        conversionUnit: 'kg',
        stock: 80
      }
    ],
    highlights: [
      { key: 'Included In The Box', value: '1 x Ooty Carrot (250 g)' },
      { key: 'Pack Size', value: '250 g' },
      { key: 'Packaging Type', value: 'Fresh-Seal Pouch' },
      { key: 'Special Feature', value: 'High Beta-Carotene' }
    ],
    description: 'Crisp, sweet, and bright Ooty carrots cultivated in Nilgiri hills. Excellent for juices, salads, and cooking.',
    healthBenefits: 'Exceptional source of beta-carotene, lutein, and antioxidants.',
    storageInfo: 'Store in the vegetable crisper drawer of your refrigerator.',
    sellerDetails: {
      name: 'PJIT TECHNOLOGIES PVT LTD',
      fssaiNumber: '12725052000372'
    },
    countryOfOrigin: 'India',
    ean: '2119'
  },
  // DOVE / PERSONAL CARE SHELF (Image 1)
  {
    _id: 'prod_dove_nourish_825',
    name: 'Dove Deeply Nourishing Body Wash',
    slug: 'dove-deeply-nourishing-body-wash-825ml',
    subtitle: 'NutriumMoisture, Soft & Smooth Skin',
    category: { _id: 'cat_personal_care', name: 'Personal Care', slug: 'personal-care' },
    sellingPrice: 404,
    mrp: 580,
    baseUnit: 'ML',
    sellingUnit: '825 ml',
    minSaleQty: 1,
    maxSaleQty: 10,
    qtyStep: 1,
    stock: 120,
    isVeg: true,
    rating: 4.6,
    ratingCount: '4.9k',
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { _id: 'v_dove_825ml', name: '825 ml', sellingPrice: 404, mrp: 580, conversionFactor: 0.825, conversionUnit: 'ltr', stock: 120 },
      { _id: 'v_dove_300ml', name: '300 ml', sellingPrice: 170, mrp: 195, conversionFactor: 0.3, conversionUnit: 'ltr', stock: 80 }
    ],
    highlights: [
      { key: 'Pack Size', value: '825 ml' },
      { key: 'Skin Type', value: 'All Skin Types' },
      { key: 'Fragrance', value: 'Mild Clean Aroma' }
    ],
    description: 'Dove Deeply Nourishing Body Wash creates a rich lather that replenishes your skin’s nutrients while leaving it clean and cared for.',
    healthBenefits: 'Gives softer, smoother skin after just one shower.',
    storageInfo: 'Store in a cool dry place away from direct sunlight.',
    sellerDetails: { name: 'HINDUSTAN UNILEVER LTD', fssaiNumber: '10012011000167' }
  },
  {
    _id: 'prod_dove_nourish_300',
    name: 'Dove Deeply Nourishing Body Wash Bottle',
    slug: 'dove-deeply-nourishing-body-wash-bottle-300ml',
    subtitle: 'Hydrating Cleanser with Micro-Moisture',
    category: { _id: 'cat_personal_care', name: 'Personal Care', slug: 'personal-care' },
    sellingPrice: 170,
    mrp: 195,
    baseUnit: 'ML',
    sellingUnit: '300 ml',
    minSaleQty: 1,
    stock: 95,
    isVeg: true,
    rating: 4.6,
    ratingCount: '4.8k',
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80',
    variants: [
      { _id: 'v_dove_b_300ml', name: '300 ml', sellingPrice: 170, mrp: 195, conversionFactor: 0.3, conversionUnit: 'ltr', stock: 95 }
    ]
  },
  {
    _id: 'prod_dove_sandalwood_375',
    name: 'Dove Sandalwood Bar for Glowing Skin',
    slug: 'dove-sandalwood-bar-glowing-skin-375g',
    subtitle: 'Nourishing Beauty Bathing Soap Bar',
    category: { _id: 'cat_personal_care', name: 'Personal Care', slug: 'personal-care' },
    sellingPrice: 264,
    mrp: 330,
    baseUnit: 'GM',
    sellingUnit: '375 g',
    minSaleQty: 1,
    stock: 140,
    isVeg: true,
    rating: 4.6,
    ratingCount: '2.7k',
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1607006314187-c729227f2904?auto=format&fit=crop&w=800&q=80',
    variants: [
      { _id: 'v_dove_sand_375g', name: '375 g (3 x 125g)', sellingPrice: 264, mrp: 330, conversionFactor: 0.375, conversionUnit: 'kg', stock: 140 }
    ]
  },
  {
    _id: 'prod_dove_cream_beauty_375',
    name: 'Dove Cream Beauty Bar',
    slug: 'dove-cream-beauty-bar-375g',
    subtitle: '1/4 Moisturising Cream Formula',
    category: { _id: 'cat_personal_care', name: 'Personal Care', slug: 'personal-care' },
    sellingPrice: 253,
    mrp: 270,
    baseUnit: 'GM',
    sellingUnit: '375 g',
    minSaleQty: 1,
    stock: 110,
    isVeg: true,
    rating: 4.6,
    ratingCount: '4.8k',
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    variants: [
      { _id: 'v_dove_cream_375g', name: '375 g (3 x 125g)', sellingPrice: 253, mrp: 270, conversionFactor: 0.375, conversionUnit: 'kg', stock: 110 }
    ]
  },

  // CLEANING ESSENTIALS SHELF (Image 1)
  {
    _id: 'prod_ariel_top_load_32',
    name: 'Ariel Power Gel Liquid Detergent Top Load',
    slug: 'ariel-power-gel-liquid-detergent-top-load-32kg',
    subtitle: 'Tough Stain Removal in 1 Wash',
    category: { _id: 'cat_household', name: 'Household & Lifestyle', slug: 'household-lifestyle' },
    sellingPrice: 516,
    mrp: 629,
    baseUnit: 'KG',
    sellingUnit: '3.2 kg',
    minSaleQty: 1,
    stock: 75,
    isVeg: true,
    rating: 4.6,
    ratingCount: '3k',
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=800&q=80',
    variants: [
      { _id: 'v_ariel_32kg', name: '3.2 kg', sellingPrice: 516, mrp: 629, conversionFactor: 3.2, conversionUnit: 'kg', stock: 75 },
      { _id: 'v_ariel_1kg', name: '1 kg', sellingPrice: 185, mrp: 215, conversionFactor: 1, conversionUnit: 'kg', stock: 60 }
    ]
  },
  {
    _id: 'prod_ariel_front_load_32',
    name: 'Ariel Power Gel Liquid Detergent Front Load',
    slug: 'ariel-power-gel-liquid-detergent-front-load-32ltr',
    subtitle: 'Brilliant Whites & Colors Protection',
    category: { _id: 'cat_household', name: 'Household & Lifestyle', slug: 'household-lifestyle' },
    sellingPrice: 590,
    mrp: 719,
    baseUnit: 'LTR',
    sellingUnit: '3.2 ltr',
    minSaleQty: 1,
    stock: 60,
    isVeg: true,
    rating: 4.5,
    ratingCount: '2.2k',
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=800&q=80',
    variants: [
      { _id: 'v_ariel_front_32ltr', name: '3.2 ltr', sellingPrice: 590, mrp: 719, conversionFactor: 3.2, conversionUnit: 'ltr', stock: 60 }
    ]
  },
  {
    _id: 'prod_ariel_matic_2kg',
    name: 'Ariel Matic Liquid Detergent Top Load',
    slug: 'ariel-matic-liquid-detergent-top-load-2kg',
    subtitle: 'Deep Cleaning Active Micro-boosters',
    category: { _id: 'cat_household', name: 'Household & Lifestyle', slug: 'household-lifestyle' },
    sellingPrice: 347,
    mrp: 365,
    baseUnit: 'KG',
    sellingUnit: '2 kg',
    minSaleQty: 1,
    stock: 90,
    isVeg: true,
    rating: 4.6,
    ratingCount: '5.7k',
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80',
    variants: [
      { _id: 'v_ariel_matic_2kg', name: '2 kg', sellingPrice: 347, mrp: 365, conversionFactor: 2, conversionUnit: 'kg', stock: 90 }
    ]
  },
  {
    _id: 'prod_safewash_18',
    name: 'Safewash Liquid Detergent Top Load',
    slug: 'safewash-liquid-detergent-top-load-18ltr',
    subtitle: '7X Gentle Fabric Care Formula',
    category: { _id: 'cat_household', name: 'Household & Lifestyle', slug: 'household-lifestyle' },
    sellingPrice: 215,
    mrp: 430,
    baseUnit: 'LTR',
    sellingUnit: '1.8 ltr',
    minSaleQty: 1,
    stock: 85,
    isVeg: true,
    rating: 4.6,
    ratingCount: '3.7k',
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=800&q=80',
    variants: [
      { _id: 'v_safewash_18ltr', name: '1.8 ltr', sellingPrice: 215, mrp: 430, conversionFactor: 1.8, conversionUnit: 'ltr', stock: 85 }
    ]
  },

  // FRESH FRUITS SHELF (Image 1)
  {
    _id: 'prod_apple_red_1kg',
    name: 'Apple - Red',
    slug: 'apple-red-delicious-1kg',
    subtitle: 'Sweet, Crispy & Wax-Free',
    category: { _id: 'cat_fruits', name: 'Fruits', slug: 'fruits' },
    sellingPrice: 89,
    mrp: 120,
    baseUnit: 'KG',
    sellingUnit: '1 kg',
    minSaleQty: 1,
    stock: 140,
    isVeg: true,
    rating: 4.7,
    ratingCount: '1.2k',
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
    variants: [
      { _id: 'v_apple_1kg', name: '1 kg', sellingPrice: 89, mrp: 120, conversionFactor: 1, conversionUnit: 'kg', stock: 140 },
      { _id: 'v_apple_2kg', name: '2 kg', sellingPrice: 169, mrp: 240, conversionFactor: 2, conversionUnit: 'kg', stock: 60 }
    ]
  },
  {
    _id: 'prod_banana_robusta_1kg',
    name: 'Banana - Robusta',
    slug: 'banana-robusta-1kg',
    subtitle: 'Naturally Ripened, Rich in Potassium',
    category: { _id: 'cat_fruits', name: 'Fruits', slug: 'fruits' },
    sellingPrice: 45,
    mrp: 60,
    baseUnit: 'KG',
    sellingUnit: '1 kg',
    minSaleQty: 1,
    stock: 180,
    isVeg: true,
    rating: 4.8,
    ratingCount: '5.1k',
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
    variants: [
      { _id: 'v_banana_1kg', name: '1 kg', sellingPrice: 45, mrp: 60, conversionFactor: 1, conversionUnit: 'kg', stock: 180 }
    ]
  },
  {
    _id: 'prod_orange_imported_1kg',
    name: 'Orange - Imported',
    slug: 'orange-imported-1kg',
    subtitle: 'Juicy, Vitamin-C Rich Citrus',
    category: { _id: 'cat_fruits', name: 'Fruits', slug: 'fruits' },
    sellingPrice: 79,
    mrp: 110,
    baseUnit: 'KG',
    sellingUnit: '1 kg',
    minSaleQty: 1,
    stock: 120,
    isVeg: true,
    rating: 4.6,
    ratingCount: '890',
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=800&q=80',
    variants: [
      { _id: 'v_orange_1kg', name: '1 kg', sellingPrice: 79, mrp: 110, conversionFactor: 1, conversionUnit: 'kg', stock: 120 }
    ]
  },
  {
    _id: 'prod_grapes_green_500g',
    name: 'Grapes - Green',
    slug: 'grapes-green-500g',
    subtitle: 'Crisp, Sweet & Seedless Table Grapes',
    category: { _id: 'cat_fruits', name: 'Fruits', slug: 'fruits' },
    sellingPrice: 69,
    mrp: 90,
    baseUnit: 'GM',
    sellingUnit: '500 g',
    minSaleQty: 1,
    stock: 130,
    isVeg: true,
    rating: 4.5,
    ratingCount: '2.4k',
    deliveryTime: '17 MINS',
    featuredImage: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=800&q=80',
    variants: [
      { _id: 'v_grapes_500g', name: '500 g', sellingPrice: 69, mrp: 90, conversionFactor: 0.5, conversionUnit: 'kg', stock: 130 }
    ]
  }
];

// Attach similarProducts circular references
MOCK_PRODUCTS.forEach(p => {
  p.similarProducts = MOCK_PRODUCTS.filter(other => other._id !== p._id);
});

export const findMockProduct = (idOrSlug) => {
  if (!idOrSlug) return MOCK_PRODUCTS[0];
  const queryStr = idOrSlug.toString().toLowerCase().trim();

  // 1. Direct ID match
  const byId = MOCK_PRODUCTS.find(p => p._id === queryStr);
  if (byId) return byId;

  // 2. Direct Slug match
  const bySlug = MOCK_PRODUCTS.find(p => p.slug === queryStr);
  if (bySlug) return bySlug;

  // 3. Keyword fuzzy match
  const byKeyword = MOCK_PRODUCTS.find(p => 
    p.slug.includes(queryStr) || 
    p.name.toLowerCase().includes(queryStr) ||
    queryStr.includes(p.slug)
  );
  if (byKeyword) return byKeyword;

  // 4. Default to first product (Onion)
  return MOCK_PRODUCTS[0];
};
