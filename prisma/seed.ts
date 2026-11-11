// ─────────────────────────────────────────────────────────────
// Seed Taqendurt — données de démonstration
// Exécution : `bun prisma/seed.ts` (script npm : db:seed)
// Idempotent : wipe complet puis insertion.
// ─────────────────────────────────────────────────────────────
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { WILAYAS, DEFAULT_SHIPPING } from "@/lib/constants"
import { DEFAULT_SETTINGS } from "@/lib/settings"

const DAY = 24 * 3600 * 1000
const now = Date.now()
const daysAgo = (d: number) => new Date(now - d * DAY)

/** Corps du seed — appelé par le CLI (`bun prisma/seed.ts`) OU par
 *  l'auto-seed serveur (src/lib/auto-seed.ts) si la base est vide. */
export async function runSeed() {
  console.log("🌱 Seed Taqendurt — wipe complet…")

  // Ordre des dépendances : enfants d'abord
  await db.mailLog.deleteMany()
  await db.orderStatusHistory.deleteMany()
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.contactMessage.deleteMany()
  await db.session.deleteMany()
  await db.user.deleteMany()
  await db.productImage.deleteMany()
  await db.productFabric.deleteMany()
  await db.productColor.deleteMany()
  await db.productEmbroidery.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.fabric.deleteMany()
  await db.color.deleteMany()
  await db.embroideryOption.deleteMany()
  await db.shippingRate.deleteMany()
  await db.siteSetting.deleteMany()

  // ── Comptes ────────────────────────────────────────────────
  await db.user.create({
    data: {
      email: "admin@taqendurt.dz",
      name: "Amina Admin",
      role: "admin",
      passwordHash: await hashPassword("Admin!2026"),
    },
  })
  await db.user.create({
    data: {
      email: "staff@taqendurt.dz",
      name: "Karim Employé",
      role: "staff",
      passwordHash: await hashPassword("Staff!2026"),
    },
  })
  console.log("✓ Comptes : admin@taqendurt.dz / staff@taqendurt.dz")

  // ── Catégories ─────────────────────────────────────────────
  const catRobes = await db.category.create({
    data: {
      slug: "robes-kabyles",
      name: "Robes kabyles",
      nameAr: "فساتين قبائلية",
      description: "Les taqendurt traditionnelles, brodées main selon les motifs de chaque village.",
      descriptionAr: "تاقندورت التقليدية المطرزة يدويًا بنقوش كل قرية.",
      image: "/images/products/p1.jpg",
      order: 1,
    },
  })
  const catKarakou = await db.category.create({
    data: {
      slug: "karakou-ceremonie",
      name: "Karakou & cérémonie",
      nameAr: "كاراكو وحفلات",
      description: "Karakou d'or, robes de mariée et tenues de grande occasion.",
      descriptionAr: "كاراكو ذهبي، فساتين زفاف وأزياء المناسبات الكبرى.",
      image: "/images/products/p3.jpg",
      order: 2,
    },
  })
  const catGandouras = await db.category.create({
    data: {
      slug: "gandouras-modernes",
      name: "Gandouras & modernes",
      nameAr: "قنادر وعصري",
      description: "Gandouras confortables et robes kabyles au design contemporain.",
      descriptionAr: "قنادر مريحة وفساتين قبائلية بتصميم عصري.",
      image: "/images/products/p5.jpg",
      order: 3,
    },
  })
  const catEnfants = await db.category.create({
    data: {
      slug: "enfants",
      name: "Tenues enfants",
      nameAr: "أزياء الأطفال",
      description: "Les petites robes kabyles pour vos fiertés, dès 4 ans.",
      descriptionAr: "فساتين قبائلية صغيرة لفخراتكم، من سن 4 سنوات.",
      image: "/images/products/p7.jpg",
      order: 4,
    },
  })
  console.log("✓ 4 catégories")

  // ── Tissus ─────────────────────────────────────────────────
  const satin = await db.fabric.create({
    data: { name: "Satin", nameAr: "ساتان", image: "/images/fabrics/satin.jpg", priceExtra: 0 },
  })
  const soie = await db.fabric.create({
    data: { name: "Soie naturelle", nameAr: "حرير طبيعي", image: "/images/fabrics/soie.jpg", priceExtra: 2500 },
  })
  const mlifa = await db.fabric.create({
    data: { name: "Mlifa", nameAr: "مليفة", image: "/images/fabrics/mlifa.jpg", priceExtra: 1500 },
  })
  const velours = await db.fabric.create({
    data: { name: "Velours", nameAr: "مخمل", image: "/images/fabrics/velours.jpg", priceExtra: 3000 },
  })
  const mousseline = await db.fabric.create({
    data: { name: "Mousseline", nameAr: "موسلين", image: "/images/fabrics/mousseline.jpg", priceExtra: 800 },
  })
  console.log("✓ 5 tissus")

  // ── Couleurs ───────────────────────────────────────────────
  const colors = {
    rouge: await db.color.create({ data: { name: "Rouge grenat", nameAr: "أحمر عنابي", hex: "#B3282D" } }),
    or: await db.color.create({ data: { name: "Or antique", nameAr: "ذهبي عتيق", hex: "#C9A227" } }),
    vert: await db.color.create({ data: { name: "Vert émeraude", nameAr: "أخضر زمردي", hex: "#0E8A5F" } }),
    bleu: await db.color.create({ data: { name: "Bleu électrique", nameAr: "أزرق كهربائي", hex: "#2E6FDB" } }),
    noir: await db.color.create({ data: { name: "Noir profond", nameAr: "أسود عميق", hex: "#1C1B1A" } }),
    creme: await db.color.create({ data: { name: "Crème ivoire", nameAr: "كريمي عاجي", hex: "#F2EAD3" } }),
    rose: await db.color.create({ data: { name: "Rose poudré", nameAr: "وردي باهت", hex: "#E8B4B8" } }),
    bordeaux: await db.color.create({ data: { name: "Bordeaux", nameAr: "بوردو", hex: "#6B1F2E" } }),
  }
  console.log("✓ 8 couleurs")

  // ── Broderies ──────────────────────────────────────────────
  const embComplete = await db.embroideryOption.create({
    data: { name: "Broderie traditionnelle complète", nameAr: "تطريز تقليدي كامل", priceExtra: 3500 },
  })
  const embPoignets = await db.embroideryOption.create({
    data: { name: "Broderie poignets & col", nameAr: "تطريز الأكمام والياقة", priceExtra: 1500 },
  })
  const embPerles = await db.embroideryOption.create({
    data: { name: "Perles & franges", nameAr: "خرز وشراشيب", priceExtra: 2500 },
  })
  const embMotif = await db.embroideryOption.create({
    data: { name: "Motif personnalisé", nameAr: "نقش حسب الطلب", priceExtra: 2800 },
  })
  console.log("✓ 4 broderies")

  const ALL_EMBROIDERIES = [embComplete, embPoignets, embPerles, embMotif]

  // ── Produits ───────────────────────────────────────────────
  interface SeedProduct {
    title: string
    titleAr: string
    description: string
    descriptionAr: string
    basePrice: number
    categoryId: string
    occasion: string
    leadTimeDays: number
    customSizeFee: number
    featured?: boolean
    hasCustomLength?: boolean
    images: string[]
    fabrics: { fabric: { id: string; name: string }; priceExtra: number }[]
    colorIds: string[]
    embroideryIds: string[]
  }

  const productSeeds: SeedProduct[] = [
    {
      title: "Taqendurt Tamazirt",
      titleAr: "تاقندورت تامازيغت",
      description:
        "La robe kabyle par excellence : velours grenat, plastron brodé de motifs amazighs fil d'or, ceinture hmai assortie. Chaque pièce est coupée et brodée dans notre atelier.",
      descriptionAr:
        "فستان القبائل بامتياز: مخمل عنابي وصدر مطرز بنقوش أمازيغية بخيط ذهبي مع حزام حمّاي. كل قطعة تُقصّ وتُطرّز في ورشتنا.",
      basePrice: 12500,
      categoryId: catRobes.id,
      occasion: "fete",
      leadTimeDays: 14,
      customSizeFee: 1500,
      featured: true,
      images: ["/images/products/p1.jpg", "/images/products/p1-detail.jpg"],
      fabrics: [
        { fabric: satin, priceExtra: 0 },
        { fabric: soie, priceExtra: 2000 },
        { fabric: mlifa, priceExtra: 1500 },
        { fabric: velours, priceExtra: 3000 },
        { fabric: mousseline, priceExtra: 800 },
      ],
      colorIds: [colors.rouge.id, colors.or.id, colors.noir.id, colors.creme.id, colors.bordeaux.id, colors.vert.id],
      embroideryIds: ALL_EMBROIDERIES.map((e) => e.id),
    },
    {
      title: "Robe Azul",
      titleAr: "فستان أزول",
      description:
        "Élégance bleu électrique : broderie argent et or sur satin fluide, franges perlées aux manches. Une kabyle moderne qui tourne les têtes.",
      descriptionAr:
        "أناقة بالأزرق الكهربائي: تطريز فضي وذهبي على ساتان انسيابي وشراشيب خرزية عند الأكمام.",
      basePrice: 13800,
      categoryId: catRobes.id,
      occasion: "fete",
      leadTimeDays: 14,
      customSizeFee: 1500,
      images: ["/images/products/p2.jpg", "/images/products/p2-detail.jpg"],
      fabrics: [
        { fabric: satin, priceExtra: 0 },
        { fabric: soie, priceExtra: 2000 },
        { fabric: mousseline, priceExtra: 800 },
      ],
      colorIds: [colors.bleu.id, colors.noir.id, colors.creme.id],
      embroideryIds: ALL_EMBROIDERIES.map((e) => e.id),
    },
    {
      title: "Karakou El Djazaïr",
      titleAr: "كاراكو الجزائر",
      description:
        "L'ensemble cérémoniel algérois : veste karakou en velours noir, broderie au fil d'or (katt el ward) réalisée main sur plus de 80 heures, robe intérieure dorée.",
      descriptionAr:
        "طقم حفلات جزائري: سترة كاراكو من المخمل الأسود بتطريز خيط ذهبي يدوي يتجاوز 80 ساعة عمل، وفستان داخلي ذهبي.",
      basePrice: 38000,
      categoryId: catKarakou.id,
      occasion: "mariage",
      leadTimeDays: 30,
      customSizeFee: 2000,
      images: ["/images/products/p3.jpg"],
      fabrics: [{ fabric: velours, priceExtra: 3000 }],
      colorIds: [colors.noir.id, colors.or.id, colors.bordeaux.id],
      embroideryIds: [embComplete.id, embMotif.id],
    },
    {
      title: "Robe de Mariée Tislit",
      titleAr: "فستان تيسليت",
      description:
        "Notre création d'exception : ivoire et or, perles nacrées cousues une à une, traîne majestueuse. Sur-mesure obligatoire pour un tombé parfait.",
      descriptionAr:
        "إبداعنا الاستثنائي: عاجي وذهبي مع لآلئ تُخاط واحدة واحدة وذيل مهيب. الخياطة حسب القياس إلزامية لوقعة مثالية.",
      basePrice: 65000,
      categoryId: catKarakou.id,
      occasion: "mariage",
      leadTimeDays: 45,
      customSizeFee: 2500,
      featured: true,
      images: ["/images/products/p4.jpg", "/images/products/p4-detail.jpg"],
      fabrics: [
        { fabric: soie, priceExtra: 4000 },
        { fabric: satin, priceExtra: 1500 },
        { fabric: mousseline, priceExtra: 1000 },
      ],
      colorIds: [colors.creme.id, colors.or.id],
      embroideryIds: [embComplete.id, embPerles.id, embMotif.id],
    },
    {
      title: "Gandoura Timimoun",
      titleAr: "قندورة تيميمون",
      description:
        "La gandoura du quotidien qui fait la différence : lin lavé crème, rayures tissées rouge/vert/or aux épaules et à l'ourlet. Légère et lumineuse.",
      descriptionAr:
        "قندورة يومية مميزة: كتان مغسول كريمي مع خطوط منسوجة حمراء وخضراء وذهبية عند الكتفين والحاشية.",
      basePrice: 9800,
      categoryId: catGandouras.id,
      occasion: "quotidien",
      leadTimeDays: 10,
      customSizeFee: 1200,
      images: ["/images/products/p5.jpg"],
      fabrics: [
        { fabric: mousseline, priceExtra: 0 },
        { fabric: soie, priceExtra: 1200 },
      ],
      colorIds: [colors.creme.id, colors.vert.id, colors.rose.id],
      embroideryIds: [embPoignets.id],
    },
    {
      title: "Amazigh Chic",
      titleAr: "أمازيغ شيك",
      description:
        "La kabyle courte revisitée : crépe noir, motifs géométriques or lumineux, manches évasées. Disponible courte, mi-longue ou longue.",
      descriptionAr:
        "القبائلية القصيرة بروح جديدة: كريب أسود بنقوش هندسية ذهبية لامعة وأكمام واسعة. متوفرة قصيرة أو متوسطة أو طويلة.",
      basePrice: 11200,
      categoryId: catGandouras.id,
      occasion: "fete",
      leadTimeDays: 12,
      customSizeFee: 1500,
      hasCustomLength: true,
      images: ["/images/products/p6.jpg"],
      fabrics: [
        { fabric: satin, priceExtra: 0 },
        { fabric: mlifa, priceExtra: 1000 },
        { fabric: velours, priceExtra: 2500 },
      ],
      colorIds: [colors.noir.id, colors.or.id, colors.rouge.id],
      embroideryIds: [embPoignets.id, embMotif.id],
    },
    {
      title: "Ticcwayen Petite Robe",
      titleAr: "تيكوايين الصغيرة",
      description:
        "La robe kabyle des petites fiertés : rouge & or, broderies légères, coupe confortable qui laisse courir et danser.",
      descriptionAr: "فستان القبائل للصغيرات: أحمر وذهبي بتطريز خفيف وقصة مريحة تسمح بالجري والرقص.",
      basePrice: 7500,
      categoryId: catEnfants.id,
      occasion: "fete",
      leadTimeDays: 10,
      customSizeFee: 1000,
      images: ["/images/products/p7.jpg"],
      fabrics: [
        { fabric: satin, priceExtra: 0 },
        { fabric: mousseline, priceExtra: 0 },
      ],
      colorIds: [colors.rouge.id, colors.or.id, colors.rose.id, colors.bleu.id, colors.vert.id],
      embroideryIds: [embPoignets.id],
    },
    {
      title: "Robe Farah",
      titleAr: "فستان فرح",
      description:
        "Pour le jour où tout commence : émeraude profond, perles argentées, broderie or discret, coupe sirène. La robe de fiançailles dont on se souvient.",
      descriptionAr:
        "لليوم الذي يبدأ فيه كل شيء: زمردي عميق بلآلئ فضية وتطريز ذهبي راقٍ بقصة حورية البحر.",
      basePrice: 27500,
      categoryId: catKarakou.id,
      occasion: "fiancailles",
      leadTimeDays: 21,
      customSizeFee: 2000,
      featured: true,
      images: ["/images/products/p8.jpg", "/images/products/p8-detail.jpg"],
      fabrics: [
        { fabric: satin, priceExtra: 0 },
        { fabric: soie, priceExtra: 2500 },
        { fabric: velours, priceExtra: 3500 },
      ],
      colorIds: [colors.vert.id, colors.creme.id, colors.or.id],
      embroideryIds: ALL_EMBROIDERIES.map((e) => e.id),
    },
  ]

  const createdProducts: Record<string, { id: string; title: string; image: string; customSizeFee: number }> = {}
  for (const p of productSeeds) {
    const product = await db.product.create({
      data: {
        title: p.title,
        titleAr: p.titleAr,
        description: p.description,
        descriptionAr: p.descriptionAr,
        basePrice: p.basePrice,
        customSizeFee: p.customSizeFee,
        leadTimeDays: p.leadTimeDays,
        featured: p.featured ?? false,
        visible: true,
        hasCustomLength: p.hasCustomLength ?? false,
        occasion: p.occasion,
        categoryId: p.categoryId,
        images: {
          create: p.images.map((url, index) => ({ url, alt: p.title, order: index })),
        },
        fabrics: {
          create: p.fabrics.map((f) => ({
            fabricId: f.fabric.id,
            priceExtra: f.priceExtra,
            colorsJson: JSON.stringify([]), // [] = toutes les couleurs du produit
          })),
        },
        colors: { create: p.colorIds.map((colorId) => ({ colorId })) },
        embroideries: { create: p.embroideryIds.map((embroideryId) => ({ embroideryId })) },
      },
    })
    createdProducts[p.title] = {
      id: product.id,
      title: product.title,
      image: p.images[0],
      customSizeFee: p.customSizeFee,
    }
  }
  console.log("✓ 8 produits")

  // ── Grille de livraison : 58 wilayas ───────────────────────
  await db.shippingRate.createMany({
    data: WILAYAS.map((w) => ({
      wilayaCode: w.code,
      homePrice: DEFAULT_SHIPPING[w.code],
      active: true,
    })),
  })
  console.log("✓ 58 tarifs de livraison")

  // ── Paramètres du site ─────────────────────────────────────
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.siteSetting.create({
      data: { key, value: typeof value === "boolean" ? String(value) : String(value) },
    })
  }
  console.log("✓ Paramètres du site")

  // ── Commandes de démonstration ─────────────────────────────
  const wilayaName = (code: number) => WILAYAS.find((w) => w.code === code)?.name ?? String(code)

  // 1. RK-2026-0001 — livrée (produit 1, velours grenat, taille M)
  {
    const p = createdProducts["Taqendurt Tamazirt"]
    const unitPrice = 12500 + 3000 + 3500 // 19 000
    const subtotal = unitPrice * 1
    await db.order.create({
      data: {
        number: "RK-2026-0001",
        status: "delivered",
        fullName: "Lynda Amrani",
        phone: "0550112233",
        email: "",
        wilayaCode: 16,
        wilayaName: wilayaName(16),
        commune: "Bab Ezzouar",
        address: "Cité 1200 logements, Bt 4, Bab Ezzouar",
        deliveryMode: "home",
        shippingFee: 400,
        subtotal,
        total: subtotal + 400,
        note: "",
        createdAt: daysAgo(20),
        items: {
          create: [
            {
              productId: p.id,
              productName: p.title,
              productImage: p.image,
              fabricName: "Velours",
              colorName: "Rouge grenat",
              colorHex: colors.rouge.hex,
              embroideryJson: JSON.stringify([
                { name: embComplete.name, nameAr: embComplete.nameAr, priceExtra: embComplete.priceExtra },
              ]),
              size: "M",
              measurementsJson: JSON.stringify({}),
              length: "",
              quantity: 1,
              unitPrice,
              lineTotal: unitPrice,
              note: "Cadeau pour l'anniversaire de ma mère",
            },
          ],
        },
        history: {
          create: [
            { status: "pending", note: "Commande reçue", actor: "system", createdAt: daysAgo(20) },
            { status: "validated", note: "Commande validée", actor: "Amina Admin", createdAt: daysAgo(19) },
            { status: "crafting", note: "Confection en cours à l'atelier", actor: "Karim Employé", createdAt: daysAgo(15) },
            { status: "ready", note: "Robe prête, en attente d'expédition", actor: "Karim Employé", createdAt: daysAgo(8) },
            { status: "shipped", note: "Colis remis au transporteur", actor: "Karim Employé", createdAt: daysAgo(4) },
            { status: "delivered", note: "Colis livré et signé", actor: "Amina Admin", createdAt: daysAgo(2) },
          ],
        },
      },
    })
  }

  // 2. RK-2026-0002 — en confection (produit 4, soie ivoire, sur-mesure)
  {
    const p = createdProducts["Robe de Mariée Tislit"]
    const measurements = { chest: 92, waist: 74, hips: 102, length: 145, sleeve: 58, shoulders: 39 }
    const unitPrice = 65000 + 4000 + 3500 + 2500 + 2500 // 77 500
    const subtotal = unitPrice * 1
    await db.order.create({
      data: {
        number: "RK-2026-0002",
        status: "crafting",
        fullName: "Nadjia Haddad",
        phone: "0661445566",
        email: "",
        wilayaCode: 6,
        wilayaName: wilayaName(6),
        commune: "Amizour",
        address: "Rue des Oliviers, Amizour",
        deliveryMode: "home",
        shippingFee: 500,
        subtotal,
        total: subtotal + 500,
        note: "",
        createdAt: daysAgo(6),
        items: {
          create: [
            {
              productId: p.id,
              productName: p.title,
              productImage: p.image,
              fabricName: "Soie naturelle",
              colorName: "Crème ivoire",
              colorHex: colors.creme.hex,
              embroideryJson: JSON.stringify([
                { name: embComplete.name, nameAr: embComplete.nameAr, priceExtra: embComplete.priceExtra },
                { name: embPerles.name, nameAr: embPerles.nameAr, priceExtra: embPerles.priceExtra },
              ]),
              size: "sur-mesure",
              measurementsJson: JSON.stringify(measurements),
              length: "",
              quantity: 1,
              unitPrice,
              lineTotal: unitPrice,
              note: "",
            },
          ],
        },
        history: {
          create: [
            { status: "pending", note: "Commande reçue", actor: "system", createdAt: daysAgo(6) },
            { status: "validated", note: "Acompte reçu, tissus commandés", actor: "Amina Admin", createdAt: daysAgo(5) },
            { status: "crafting", note: "Confection en cours à l'atelier", actor: "Karim Employé", createdAt: daysAgo(2) },
          ],
        },
      },
    })
  }

  // 3. RK-2026-0003 — en attente (produit 8, satin émeraude, taille L, pickup)
  {
    const p = createdProducts["Robe Farah"]
    const eventDate = new Date(now + 45 * DAY).toISOString().slice(0, 10)
    const unitPrice = 27500 + 1500 // 29 000
    const subtotal = unitPrice * 1
    await db.order.create({
      data: {
        number: "RK-2026-0003",
        status: "pending",
        fullName: "Sarah Belkacem",
        phone: "0770998877",
        email: "",
        wilayaCode: 31,
        wilayaName: wilayaName(31),
        commune: "Bir El Djir",
        address: "",
        deliveryMode: "pickup",
        shippingFee: 0,
        subtotal,
        total: subtotal,
        note: "",
        createdAt: daysAgo(1),
        items: {
          create: [
            {
              productId: p.id,
              productName: p.title,
              productImage: p.image,
              fabricName: "Satin",
              colorName: "Vert émeraude",
              colorHex: colors.vert.hex,
              embroideryJson: JSON.stringify([
                { name: embPoignets.name, nameAr: embPoignets.nameAr, priceExtra: embPoignets.priceExtra },
              ]),
              size: "L",
              measurementsJson: JSON.stringify({}),
              length: "longue",
              quantity: 1,
              unitPrice,
              lineTotal: unitPrice,
              note: `Boutons fermés dans le dos si possible — Événement le ${eventDate}`,
            },
          ],
        },
        history: {
          create: [
            { status: "pending", note: "Commande reçue", actor: "system", createdAt: daysAgo(1) },
          ],
        },
      },
    })
  }
  console.log("✓ 3 commandes de démonstration")

  // ── Messages de contact ────────────────────────────────────
  await db.contactMessage.create({
    data: {
      name: "Yasmine M.",
      phone: "0552334455",
      email: "yasmine@example.dz",
      subject: "Robe sur mesure",
      message: "Bonjour, je voudrais une robe kabyle rouge sur mesure pour le 20 juin, est-ce possible ?",
      status: "new",
      createdAt: daysAgo(3),
    },
  })
  await db.contactMessage.create({
    data: {
      name: "Meriem T.",
      phone: "0667788990",
      email: "",
      subject: "Délai livraison",
      message: "Salam, quel est le délai de livraison vers Constantine ?",
      status: "read",
      createdAt: daysAgo(2),
    },
  })
  await db.contactMessage.create({
    data: {
      name: "Hanane B.",
      phone: "0771122334",
      email: "hanane@example.dz",
      subject: "Prix karakou",
      message: "Quel serait le prix d'un karakou enfant en velours vert ?",
      status: "handled",
      createdAt: daysAgo(1),
    },
  })
  console.log("✓ 3 messages de contact")

  console.log("🎉 Seed terminé : 2 comptes, 4 catégories, 5 tissus, 8 couleurs,")
  console.log("   4 broderies, 8 produits, 58 tarifs, paramètres, 3 commandes, 3 messages.")
}

// CLI : `bun prisma/seed.ts` / `bun run db:seed` (pas d'exécution à l'import —
// ce module est aussi chargé par le serveur pour l'auto-seed)
if (process.argv[1] && /seed\.ts$/.test(process.argv[1])) {
  runSeed()
    .then(async () => {
      await db.$disconnect()
    })
    .catch(async (e) => {
      console.error("❌ Seed échoué :", e)
      await db.$disconnect()
      process.exit(1)
    })
}

  // ══════════════════════════════════════════════════════════════
  // PROFILS DE MESURES (demo)
  // ══════════════════════════════════════════════════════════════

  const measurementProfiles = [
    {
      name: "Mes mesures",
      relation: "self",
      sessionId: "demo-session-1",
      measurements: {
        method: "tape",
        values: { chest: 92, waist: 74, hips: 102, length: 145, sleeve: 58, shoulders: 39 },
        fit: "comfortable",
        displayUnit: "cm",
      },
    },
    {
      name: "Amira (ma fille)",
      relation: "daughter",
      sessionId: "demo-session-1",
      measurements: {
        method: "estimation",
        values: { chest: 85, waist: 68, hips: 94, length: 135, sleeve: 54, shoulders: 37 },
        fit: "comfortable",
        displayUnit: "cm",
      },
    },
  ]

  for (const profileData of measurementProfiles) {
    const profile = await db.measurementProfile.create({
      data: {
        name: profileData.name,
        relation: profileData.relation as "self" | "daughter" | "sister" | "other",
        sessionId: profileData.sessionId,
      },
    })

    await db.measurementSet.create({
      data: {
        profileId: profile.id,
        method: profileData.measurements.method as "tape" | "dress" | "estimation",
        valuesJson: JSON.stringify(profileData.measurements.values),
        fit: profileData.measurements.fit as "fitted" | "comfortable" | "loose",
        displayUnit: profileData.measurements.displayUnit as "cm" | "inches",
        confirmedJson: JSON.stringify({}),
        note: "",
      },
    })
  }

  console.log("✓ 2 profils de mesures créés")
