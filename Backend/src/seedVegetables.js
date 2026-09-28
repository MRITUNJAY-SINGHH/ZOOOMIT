import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import ProductVariant from './models/ProductVariant.js';

dotenv.config();

const slugify = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const seedVegetables = async () => {
  try {
    await connectDB();
    console.log('🌱 Ensuring Fresh Vegetables & Quick-Commerce Catalog...');

    // 1. Root Category: Fresh Vegetables
    let rootCat = await Category.findOne({ slug: 'fresh-vegetables' });
    if (!rootCat) {
      rootCat = new Category({
        name: 'Fresh Vegetables',
        slug: 'fresh-vegetables',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        description: 'Farm-fresh, crisp, and nutrient-rich seasonal vegetables delivered in minutes.',
        parentCategory: null,
        status: 'Active'
      });
      await rootCat.save();
      console.log('✅ Created root category: Fresh Vegetables');
    }

    // 2. Subcategories matching the visual reference sidebar
    const subcategoryData = [
      {
        name: 'Fresh Vegetables',
        slug: 'fresh-vegetables-main',
        image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80',
        description: 'Daily kitchen staple vegetables'
      },
      {
        name: 'Leafy & Seasonal',
        slug: 'leafy-seasonal',
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80',
        description: 'Fresh leafy greens and seasonal herbs'
      },
      {
        name: 'Exotic Vegetables',
        slug: 'exotic-vegetables',
        image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?auto=format&fit=crop&w=400&q=80',
        description: 'Broccoli, bell peppers, zucchini and imported greens'
      },
      {
        name: 'Premium Produce',
        slug: 'premium-produce',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80',
        description: 'Hand-picked premium mushrooms, baby corn and cherry tomatoes'
      },
      {
        name: 'Pooja & Festive',
        slug: 'pooja-festive',
        image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=400&q=80',
        description: 'Fresh marigold, banana leaves, betel leaves and coconut'
      },
      {
        name: 'Certified Organics',
        slug: 'certified-organics',
        image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=400&q=80',
        description: 'Naturally grown, pesticide-free certified organic produce'
      },
      {
        name: 'Frozen Vegetables',
        slug: 'frozen-vegetables',
        image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80',
        description: 'Snap-frozen sweet corn, green peas and mixed veg'
      }
    ];

    const subcategoryMap = {};
    for (const sub of subcategoryData) {
      let subDoc = await Category.findOne({ slug: sub.slug });
      if (!subDoc) {
        subDoc = new Category({
          name: sub.name,
          slug: sub.slug,
          image: sub.image,
          description: sub.description,
          parentCategory: rootCat._id,
          status: 'Active'
        });
        await subDoc.save();
        console.log(`✅ Created subcategory: ${sub.name}`);
      } else {
        subDoc.parentCategory = rootCat._id;
        subDoc.status = 'Active';
        if (!subDoc.image) subDoc.image = sub.image;
        await subDoc.save();
      }
      subcategoryMap[sub.slug] = subDoc;
    }

    // 3. Products matching reference screenshots
    const productsData = [
      {
        name: 'Onion (Pyaaz)',
        slug: 'onion-pyaaz',
        brand: 'Farm Fresh',
        category: rootCat._id,
        subcategory: subcategoryMap['fresh-vegetables-main']._id,
        productType: 'WEIGHT',
        baseUnit: 'KG',
        minSaleQty: 1,
        maxSaleQty: 10,
        qtyStep: 1,
        sellingPrice: 67,
        mrp: 90,
        costPrice: 45,
        stock: 120,
        description: 'Fresh, firm, and hand-selected onions. Sourced directly from local farmers with zero sprouting and zero smut.',
        subtitle: 'Zero Sprouting, Zero Smut',
        deliveryTime: '17 MINS',
        isVeg: true,
        featuredImage: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80'
        ],
        highlights: [
          { key: 'Included In The Box', value: '1 x Onion (1 kg)' },
          { key: 'Pack Size', value: '1 kg' },
          { key: 'Packaging Type', value: 'Tubular Soft Net Bags' },
          { key: 'Special Feature', value: 'Rich in Antioxidants & Flavonoids' }
        ],
        healthBenefits: 'Onions are loaded with immune-boosting Vitamin C, sulfur compounds, and dietary fiber that support gut health and regulate blood sugar.',
        storageInfo: 'Store in a cool, well-ventilated, dry place away from direct sunlight. Do not store in plastic bags.',
        sellerDetails: {
          name: 'PJIT TECHNOLOGIES PVT LTD',
          fssaiNumber: '12725052000372',
          address: 'Kuiklo Fulfillment Center, Sector 62, Noida, UP'
        },
        countryOfOrigin: 'India',
        ean: '8901234567890',
        variants: [
          { name: '1 kg', sku: 'ONION-1KG', mrp: 90, sellingPrice: 67, conversionFactor: 1, conversionUnit: 'kg' },
          { name: '3 x 1 kg', sku: 'ONION-3X1KG', mrp: 270, sellingPrice: 198, conversionFactor: 3, conversionUnit: 'pack' },
          { name: '3 kg', sku: 'ONION-3KG', mrp: 250, sellingPrice: 198, conversionFactor: 3, conversionUnit: 'kg' }
        ]
      },
      {
        name: 'Indian Tomato (Tamatar)',
        slug: 'indian-tomato-tamatar',
        brand: 'Farm Fresh',
        category: rootCat._id,
        subcategory: subcategoryMap['fresh-vegetables-main']._id,
        productType: 'WEIGHT',
        baseUnit: 'KG',
        minSaleQty: 0.5,
        maxSaleQty: 10,
        qtyStep: 0.5,
        sellingPrice: 34,
        mrp: 46,
        costPrice: 20,
        stock: 95,
        description: 'Juicy, naturally ripened country tomatoes with balanced tanginess ideal for curries, gravies, and fresh salads.',
        subtitle: 'Plump & Tangy Country Breed',
        deliveryTime: '17 MINS',
        isVeg: true,
        featuredImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1546470427-0d4db154ceb7?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=800&q=80'
        ],
        highlights: [
          { key: 'Included In The Box', value: '1 x Indian Tomato (500 g)' },
          { key: 'Pack Size', value: '500 g' },
          { key: 'Packaging Type', value: 'Recyclable Punnet' },
          { key: 'Special Feature', value: 'High Lycopene Content' }
        ],
        healthBenefits: 'Excellent source of Lycopene, Vitamin K, Potassium, and Vitamin A for skin and vision health.',
        storageInfo: 'Store at room temperature until ripe. Keep refrigerated once fully ripe.',
        sellerDetails: {
          name: 'PJIT TECHNOLOGIES PVT LTD',
          fssaiNumber: '12725052000372',
          address: 'Kuiklo Fulfillment Center, Sector 62, Noida, UP'
        },
        countryOfOrigin: 'India',
        ean: '8901234567891',
        variants: [
          { name: '500 g', sku: 'TOMATO-500G', mrp: 46, sellingPrice: 34, conversionFactor: 0.5, conversionUnit: 'g' },
          { name: '1 kg', sku: 'TOMATO-1KG', mrp: 92, sellingPrice: 65, conversionFactor: 1, conversionUnit: 'kg' },
          { name: '2 x 500 g', sku: 'TOMATO-2X500G', mrp: 92, sellingPrice: 66, conversionFactor: 1, conversionUnit: 'pack' }
        ]
      },
      {
        name: 'Potato (Aloo)',
        slug: 'potato-aloo',
        brand: 'Farm Fresh',
        category: rootCat._id,
        subcategory: subcategoryMap['fresh-vegetables-main']._id,
        productType: 'WEIGHT',
        baseUnit: 'KG',
        minSaleQty: 1,
        maxSaleQty: 15,
        qtyStep: 1,
        sellingPrice: 22,
        mrp: 30,
        costPrice: 14,
        stock: 150,
        description: 'Grade-A fresh potatoes with thin skin, low sugar, and firm texture perfect for boiling, roasting, or frying.',
        subtitle: 'Thin Skinned, Zero Black Heart',
        deliveryTime: '17 MINS',
        isVeg: true,
        featuredImage: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&w=800&q=80'
        ],
        highlights: [
          { key: 'Included In The Box', value: '1 x Potato (1 kg)' },
          { key: 'Pack Size', value: '1 kg' },
          { key: 'Packaging Type', value: 'Ventilated Jute Pouch' },
          { key: 'Special Feature', value: 'Zero Eyes & Sprouting' }
        ],
        healthBenefits: 'Good source of complex carbohydrates, Vitamin B6, and potassium for steady energy.',
        storageInfo: 'Store in a dark, dry and airy cupboard. Do not store together with onions.',
        sellerDetails: {
          name: 'PJIT TECHNOLOGIES PVT LTD',
          fssaiNumber: '12725052000372',
          address: 'Kuiklo Fulfillment Center, Sector 62, Noida, UP'
        },
        countryOfOrigin: 'India',
        ean: '8901234567892',
        variants: [
          { name: '1 kg', sku: 'POTATO-1KG', mrp: 30, sellingPrice: 22, conversionFactor: 1, conversionUnit: 'kg' },
          { name: '3 kg', sku: 'POTATO-3KG', mrp: 90, sellingPrice: 62, conversionFactor: 3, conversionUnit: 'kg' },
          { name: '3 x 1 kg', sku: 'POTATO-3X1KG', mrp: 90, sellingPrice: 64, conversionFactor: 3, conversionUnit: 'pack' },
          { name: '500 g', sku: 'POTATO-500G', mrp: 16, sellingPrice: 12, conversionFactor: 0.5, conversionUnit: 'g' }
        ]
      },
      {
        name: 'Ooty Carrot (Gajar)',
        slug: 'ooty-carrot-gajar',
        brand: 'Highland Fresh',
        category: rootCat._id,
        subcategory: subcategoryMap['fresh-vegetables-main']._id,
        productType: 'WEIGHT',
        baseUnit: 'KG',
        minSaleQty: 0.25,
        maxSaleQty: 5,
        qtyStep: 0.25,
        sellingPrice: 25,
        mrp: 35,
        costPrice: 16,
        stock: 80,
        description: 'Sweet, vibrant orange carrots harvested from the Nilgiri hills. Crisp, juicy, and perfect for salads or desserts.',
        subtitle: 'Nilgiri Hill-Harvested Sweet Carrots',
        deliveryTime: '17 MINS',
        isVeg: true,
        featuredImage: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=800&q=80'
        ],
        highlights: [
          { key: 'Included In The Box', value: '1 x Ooty Carrot (250 g)' },
          { key: 'Pack Size', value: '250 g' },
          { key: 'Packaging Type', value: 'Perforated Fresh-Pack' },
          { key: 'Special Feature', value: 'Rich in Beta-Carotene' }
        ],
        healthBenefits: 'High in Beta-Carotene, fiber, and Vitamin A supporting eye health and cellular renewal.',
        storageInfo: 'Keep refrigerated in vegetable crisper tray with light wrapping.',
        sellerDetails: {
          name: 'PJIT TECHNOLOGIES PVT LTD',
          fssaiNumber: '12725052000372',
          address: 'Kuiklo Fulfillment Center, Sector 62, Noida, UP'
        },
        countryOfOrigin: 'India',
        ean: '8901234567893',
        variants: [
          { name: '250 g', sku: 'CARROT-250G', mrp: 35, sellingPrice: 25, conversionFactor: 0.25, conversionUnit: 'g' },
          { name: '2 x 250 g', sku: 'CARROT-2X250G', mrp: 70, sellingPrice: 48, conversionFactor: 0.5, conversionUnit: 'pack' }
        ]
      },
      {
        name: "Lady's Finger (Bhindi)",
        slug: 'ladys-finger-bhindi',
        brand: 'Farm Fresh',
        category: rootCat._id,
        subcategory: subcategoryMap['fresh-vegetables-main']._id,
        productType: 'WEIGHT',
        baseUnit: 'KG',
        minSaleQty: 0.25,
        maxSaleQty: 5,
        qtyStep: 0.25,
        sellingPrice: 12,
        mrp: 16,
        costPrice: 8,
        stock: 65,
        description: 'Tender, snap-fresh green okra pods with delicate seeds. Cleaned and hand-graded for quick non-slimy cooking.',
        subtitle: 'Tender Green Snap-Fresh Okra',
        deliveryTime: '17 MINS',
        isVeg: true,
        featuredImage: 'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?auto=format&fit=crop&w=800&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?auto=format&fit=crop&w=800&q=80'
        ],
        highlights: [
          { key: 'Included In The Box', value: "1 x Lady's Finger (250 g)" },
          { key: 'Pack Size', value: '250 g' },
          { key: 'Packaging Type', value: 'Eco Breathable Pouch' },
          { key: 'Special Feature', value: 'Zero Fibrous Toughness' }
        ],
        healthBenefits: 'Rich in dietary mucilage, Folate, and Vitamin C for digestive wellness.',
        storageInfo: 'Store unwashed in a paper bag inside refrigerator crisper.',
        sellerDetails: {
          name: 'PJIT TECHNOLOGIES PVT LTD',
          fssaiNumber: '12725052000372',
          address: 'Kuiklo Fulfillment Center, Sector 62, Noida, UP'
        },
        countryOfOrigin: 'India',
        ean: '8901234567894',
        variants: [
          { name: '250 g', sku: 'BHINDI-250G', mrp: 16, sellingPrice: 12, conversionFactor: 0.25, conversionUnit: 'g' },
          { name: '2 x 250 g', sku: 'BHINDI-2X250G', mrp: 32, sellingPrice: 22, conversionFactor: 0.5, conversionUnit: 'pack' }
        ]
      },
      {
        name: 'Cabbage (Patta Gobi)',
        slug: 'cabbage-patta-gobi',
        brand: 'Farm Fresh',
        category: rootCat._id,
        subcategory: subcategoryMap['fresh-vegetables-main']._id,
        productType: 'PIECE',
        baseUnit: 'PCS',
        minSaleQty: 1,
        maxSaleQty: 5,
        qtyStep: 1,
        sellingPrice: 39,
        mrp: 53,
        costPrice: 24,
        stock: 55,
        description: 'Tightly packed, crisp green cabbage heads. Clean outer leaves, firm heart, and sweet crunchy texture.',
        subtitle: 'Crisp & Tightly Layered Head',
        deliveryTime: '17 MINS',
        isVeg: true,
        featuredImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
        ],
        highlights: [
          { key: 'Included In The Box', value: '1 x Cabbage Head (450-800 g)' },
          { key: 'Pack Size', value: '450 - 800 g' },
          { key: 'Packaging Type', value: 'Cling Film Wrapped' },
          { key: 'Special Feature', value: 'Naturally Insect-Free Graded' }
        ],
        healthBenefits: 'Loaded with Vitamin K, glucosinolates, and low-calorie fiber for metabolic health.',
        storageInfo: 'Store in refrigerator crisper. Once cut, wrap tightly in food wrap.',
        sellerDetails: {
          name: 'PJIT TECHNOLOGIES PVT LTD',
          fssaiNumber: '12725052000372',
          address: 'Kuiklo Fulfillment Center, Sector 62, Noida, UP'
        },
        countryOfOrigin: 'India',
        ean: '8901234567895',
        variants: [
          { name: '450 - 800 g', sku: 'CABBAGE-1PC', mrp: 53, sellingPrice: 39, conversionFactor: 1, conversionUnit: 'pc' }
        ]
      },
      {
        name: 'Hybrid Tomato (Tamatar)',
        slug: 'hybrid-tomato-tamatar',
        brand: 'Farm Fresh',
        category: rootCat._id,
        subcategory: subcategoryMap['fresh-vegetables-main']._id,
        productType: 'WEIGHT',
        baseUnit: 'KG',
        minSaleQty: 0.5,
        maxSaleQty: 10,
        qtyStep: 0.5,
        sellingPrice: 30,
        mrp: 40,
        costPrice: 18,
        stock: 110,
        description: 'Smooth, firm hybrid tomatoes with thick flesh and long shelf life. Less acidic and great for slicing, sandwiches, and soup.',
        subtitle: 'Thick-Fleshed Long Life Variety',
        deliveryTime: '17 MINS',
        isVeg: true,
        featuredImage: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb7?auto=format&fit=crop&w=800&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1546470427-0d4db154ceb7?auto=format&fit=crop&w=800&q=80'
        ],
        highlights: [
          { key: 'Included In The Box', value: '1 x Hybrid Tomato (500 g)' },
          { key: 'Pack Size', value: '500 g' },
          { key: 'Packaging Type', value: 'Cushioned Punnet' },
          { key: 'Special Feature', value: 'Longer Shelf Life' }
        ],
        healthBenefits: 'High Vitamin C, Lycopene, and mineral content for cardiovascular wellness.',
        storageInfo: 'Store in cool place. Refrigerate once softened.',
        sellerDetails: {
          name: 'PJIT TECHNOLOGIES PVT LTD',
          fssaiNumber: '12725052000372',
          address: 'Kuiklo Fulfillment Center, Sector 62, Noida, UP'
        },
        countryOfOrigin: 'India',
        ean: '8901234567896',
        variants: [
          { name: '500 g', sku: 'HYBRID-TOMATO-500G', mrp: 40, sellingPrice: 30, conversionFactor: 0.5, conversionUnit: 'g' },
          { name: '1 kg', sku: 'HYBRID-TOMATO-1KG', mrp: 80, sellingPrice: 58, conversionFactor: 1, conversionUnit: 'kg' },
          { name: '2 x 500 g', sku: 'HYBRID-TOMATO-2X500G', mrp: 80, sellingPrice: 59, conversionFactor: 1, conversionUnit: 'pack' }
        ]
      },
      // Leafy & Seasonal
      {
        name: 'Palak (Spinach)',
        slug: 'palak-spinach',
        brand: 'Farm Fresh',
        category: rootCat._id,
        subcategory: subcategoryMap['leafy-seasonal']._id,
        productType: 'WEIGHT',
        baseUnit: 'GM',
        minSaleQty: 250,
        maxSaleQty: 2000,
        qtyStep: 250,
        sellingPrice: 18,
        mrp: 24,
        costPrice: 10,
        stock: 45,
        description: 'Fresh hydroponic tender green spinach leaves. Washed and trimmed of roots, ready to cook.',
        subtitle: 'Tender Cleaned Green Leaves',
        deliveryTime: '17 MINS',
        isVeg: true,
        featuredImage: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
        galleryImages: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80'],
        highlights: [
          { key: 'Included In The Box', value: '1 x Spinach Bunch (250 g)' },
          { key: 'Pack Size', value: '250 g' },
          { key: 'Packaging Type', value: 'Moisture Lock Seal' }
        ],
        healthBenefits: 'Loaded with Iron, Vitamin A, and folate.',
        sellerDetails: { name: 'PJIT TECHNOLOGIES PVT LTD', fssaiNumber: '12725052000372' },
        countryOfOrigin: 'India',
        variants: [{ name: '250 g', sku: 'PALAK-250G', mrp: 24, sellingPrice: 18, conversionFactor: 0.25, conversionUnit: 'g' }]
      },
      // Exotic Vegetables
      {
        name: 'Fresh Green Broccoli',
        slug: 'fresh-green-broccoli',
        brand: 'Highland Farms',
        category: rootCat._id,
        subcategory: subcategoryMap['exotic-vegetables']._id,
        productType: 'WEIGHT',
        baseUnit: 'GM',
        minSaleQty: 250,
        maxSaleQty: 1000,
        qtyStep: 250,
        sellingPrice: 48,
        mrp: 65,
        costPrice: 32,
        stock: 35,
        description: 'Dense, dark green florets of fresh broccoli. High in antioxidants and ideal for steam roasts, pasta, and healthy salads.',
        subtitle: 'Crisp Green Florets',
        deliveryTime: '17 MINS',
        isVeg: true,
        featuredImage: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?auto=format&fit=crop&w=800&q=80',
        galleryImages: ['https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?auto=format&fit=crop&w=800&q=80'],
        highlights: [
          { key: 'Included In The Box', value: '1 x Broccoli (250-400 g)' },
          { key: 'Pack Size', value: '250 g' }
        ],
        healthBenefits: 'Sulforaphane and Vitamin C rich superfood.',
        sellerDetails: { name: 'PJIT TECHNOLOGIES PVT LTD', fssaiNumber: '12725052000372' },
        countryOfOrigin: 'India',
        variants: [{ name: '250 g', sku: 'BROC-250G', mrp: 65, sellingPrice: 48, conversionFactor: 0.25, conversionUnit: 'g' }]
      }
    ];

    for (const pData of productsData) {
      const { variants, ...prodFields } = pData;
      let product = await Product.findOne({ slug: prodFields.slug });
      if (!product) {
        product = new Product({
          ...prodFields,
          baseSku: `KUIK-${slugify(prodFields.name).toUpperCase().slice(0, 10)}`,
          isActive: true
        });
        await product.save();
        console.log(`✅ Created product: ${prodFields.name}`);
      } else {
        Object.assign(product, prodFields);
        product.isActive = true;
        await product.save();
      }

      // Sync variants
      if (variants && variants.length > 0) {
        for (const v of variants) {
          let variant = await ProductVariant.findOne({ sku: v.sku });
          if (!variant) {
            variant = new ProductVariant({
              product: product._id,
              name: v.name,
              sku: v.sku,
              mrp: v.mrp,
              sellingPrice: v.sellingPrice,
              conversionFactor: v.conversionFactor,
              conversionUnit: v.conversionUnit,
              stock: 50,
              isActive: true
            });
            await variant.save();
          } else {
            variant.product = product._id;
            variant.name = v.name;
            variant.mrp = v.mrp;
            variant.sellingPrice = v.sellingPrice;
            variant.isActive = true;
            await variant.save();
          }
        }
      }
    }

    console.log('🎉 Successfully seeded Fresh Vegetables and quick-commerce catalog!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding vegetables:', err);
    process.exit(1);
  }
};

seedVegetables();
