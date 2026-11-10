// Dictionnaire : pages statiques (À propos, Contact, Guide des tailles, légal)
// ⚠️ Fichier propriété du sous-agent D (pages statiques).
//
// Deux modes d'accès prévus :
//  1. Labels simples → t("pages.about.hero.badge") via useI18n (fusion globale).
//  2. Structures riches (paragraphes, sections légales, FAQ, tableaux) →
//     import { pages } from "@/i18n/dict/pages"  puis  pages[lang].legal.cgv.sections
//     (t() ne renvoie que des strings — les arrays se mappent en JSX).

// ── Types des structures riches ────────────────────────────────

export interface LegalSection {
  /** titre de section (h3) */
  h: string
  /** paragraphe(s) — string ou plusieurs paragraphes */
  p: string | string[]
}

interface TitledText {
  title: string
  text: string
}

interface StatItem {
  value: string
  label: string
}

interface FaqItem {
  q: string
  a: string
}

interface SizeRow {
  size: string
  chest: number
  waist: number
  hips: number
}

interface HoursLine {
  days: string
  time: string
}

export interface LegalPage {
  title: string
  sections: LegalSection[]
}

export type MeasurementKey = "chest" | "waist" | "hips" | "length" | "sleeve" | "shoulders"

export interface PagesDict {
  about: {
    hero: { badge: string; titleA: string; titleB: string; subtitle: string }
    story: {
      kicker: string
      title: string
      paragraphs: string[]
      imageAlt: string
      imageCaption: string
      badgeTitle: string
      badgeText: string
    }
    craft: { title: string; subtitle: string; items: TitledText[] }
    values: { title: string; subtitle: string; items: TitledText[] }
    stats: StatItem[]
    cta: { title: string; text: string; catalog: string; whatsapp: string }
  }
  contact: {
    hero: { badge: string; title: string; subtitle: string }
    form: {
      title: string
      subtitle: string
      name: string
      namePlaceholder: string
      errName: string
      phone: string
      phonePlaceholder: string
      errPhone: string
      email: string
      emailPlaceholder: string
      subject: string
      subjectPlaceholder: string
      message: string
      messagePlaceholder: string
      messageHint: string
      errMessage: string
      counter: string
      send: string
      sending: string
      success: string
      disclaimer: string
      privacyLink: string
    }
    infos: {
      title: string
      phoneLabel: string
      emailLabel: string
      whatsappLabel: string
      whatsappCta: string
      addressLabel: string
      hoursLabel: string
      hoursLines: HoursLine[]
      mapTitle: string
      mapCta: string
      socialsLabel: string
      note: string
    }
    faq: { title: string; subtitle: string; items: FaqItem[] }
  }
  sizeGuide: {
    hero: { badge: string; title: string; subtitle: string }
    intro: { title: string; standard: TitledText; custom: TitledText }
    table: {
      title: string
      subtitle: string
      note: string
      size: string
      chest: string
      waist: string
      hips: string
      rows: SizeRow[]
    }
    measure: {
      title: string
      subtitle: string
      rangeLabel: string
      cards: Record<MeasurementKey, TitledText>
    }
    tips: { title: string; items: TitledText[] }
    cta: { title: string; text: string; button: string }
  }
  legal: {
    updated: string
    alsoSee: string
    cgv: LegalPage
    returns: LegalPage
    privacy: LegalPage
  }
}

// ── FRANÇAIS ────────────────────────────────────────────────────

const fr: PagesDict = {
  about: {
    hero: {
      badge: "Atelier de couture — Tizi-Ouzou, depuis 2012",
      titleA: "Trois générations,",
      titleB: "un même fil",
      subtitle:
        "Taqendurt confectionne des robes kabyles à la main, héritières d'un savoir-faire transmis de grand-mère en petite-fille. Bienvenue dans notre atelier.",
    },
    story: {
      kicker: "Notre histoire",
      title: "Tout a commencé rue des Artisans",
      paragraphs: [
        "Taqendurt est née en 2012, dans une petite pièce baignée de lumière rue des Artisans, à Tizi-Ouzou. Amina, alors jeune couturière formée auprès de sa mère, y cousait ses premières robes kabyles pour les voisines du quartier. Les commandes passaient de bouche à oreille : une robe de fiançailles ici, un karakou de cérémonie là. Très vite, la petite pièce n'a plus suffi.",
        "Le savoir-faire de la maison remonte bien plus loin que 2012. C'est de sa grand-mère, couturière réputée de son village, qu'Amina tient ses gestes : le point de ruche des broderies kabyles, le montage délicat du velours, l'art de marier le fil d'or et la soie. Trois générations se sont ainsi transmis le même amour du détail — et quand la mère d'Amina a rejoint l'aventure, la boucle s'est refermée, naturellement.",
        "Aujourd'hui, l'atelier réunit une douzaine d'artisanes qui coupent, brodent et assemblent chaque pièce à la main. Nous habillons des clientes dans les 58 wilayas, de la robe du quotidien au fourreau de mariage. Une chose n'a pas changé : chaque robe qui quitte l'atelier emporte avec elle la patience des mains, l'odeur du tissu tendu et la fierté d'un métier qui se transmet.",
      ],
      imageAlt:
        "Mains d'une artisane brodant une robe kabyle au fil d'or dans l'atelier Taqendurt",
      imageCaption: "L'atelier, rue des Artisans — un après-midi de broderie.",
      badgeTitle: "Depuis 2012",
      badgeText: "Tizi-Ouzou, Kabylie",
    },
    craft: {
      title: "Notre savoir-faire",
      subtitle: "Ce que nos mains savent faire, pièce après pièce",
      items: [
        {
          title: "Coupe & montage",
          text: "Chaque patron est tracé à la main et ajusté à votre morphologie avant la première coupe de tissu. Le montage, entièrement fait main, garantit un tombé impeccable, pli après pli.",
        },
        {
          title: "Broderie main",
          text: "Points kabyles traditionnels — ruche, plat, croisé — exécutés au fil de soie ou au fil d'or. Une pièce de cérémonie peut demander plus de trente heures de broderie.",
        },
        {
          title: "Sur-mesure",
          text: "Vous nous confiez vos six mesures : nous conseillons, ajustons et cousons à votre silhouette. Le sur-mesure est offert pour les robes de mariage.",
        },
        {
          title: "Contrôle qualité",
          text: "Chaque robe passe un contrôle en douze points — coutures, broderies, finitions, tombé, emballage — avant de rejoindre son pochon et sa boîte.",
        },
      ],
    },
    values: {
      title: "Nos valeurs",
      subtitle: "Ce qui guide chacun de nos gestes",
      items: [
        {
          title: "L'artisanat d'ici",
          text: "Tout est cousu dans notre atelier de Tizi-Ouzou par des artisanes de la région, justement rémunérées. Ni sous-traitance, ni production en série : des pièces uniques, à leur rythme.",
        },
        {
          title: "La transmission",
          text: "Chaque année, nous formons de jeunes coutirières aux points kabyles et au montage traditionnel. Ce patrimoine ne vit que s'il continue de s'apprendre.",
        },
        {
          title: "La qualité d'abord",
          text: "Velours, satins et mousselines sélectionnés auprès de fournisseurs de confiance, contrôlés couleur par couleur. Une robe Taqendurt se porte des années — et se transmet.",
        },
      ],
    },
    stats: [
      { value: "13", label: "ans d'atelier" },
      { value: "1 500+", label: "robes confectionnées" },
      { value: "58", label: "wilayas livrées" },
    ],
    cta: {
      title: "Et si la prochaine était la vôtre ?",
      text: "Parcourez nos modèles, choisissez tissu, broderies et longueur — ou dites-nous simplement ce que vous imaginez, on s'occupe du reste.",
      catalog: "Découvrir la boutique",
      whatsapp: "Discuter sur WhatsApp",
    },
  },

  contact: {
    hero: {
      badge: "Réponse sous 24 h ouvrées",
      title: "Parlons de votre robe",
      subtitle:
        "Une question sur un modèle, le sur-mesure ou la livraison ? Écrivez-nous ici, ou rejoignez-nous directement sur WhatsApp — l'atelier vous répond du samedi au jeudi.",
    },
    form: {
      title: "Écrivez-nous",
      subtitle: "Nous répondons à chaque message, sans exception.",
      name: "Votre nom *",
      namePlaceholder: "ex. : Lynda Haddad",
      errName: "Merci d'indiquer votre nom (2 caractères minimum).",
      phone: "Téléphone",
      phonePlaceholder: "05 50 12 34 56",
      errPhone: "Numéro algérien invalide (ex. : 0550 12 34 56).",
      email: "Email (optionnel)",
      emailPlaceholder: "vous@exemple.dz",
      subject: "Sujet",
      subjectPlaceholder: "Commande, sur-mesure, délais…",
      message: "Votre message *",
      messagePlaceholder:
        "Décrivez votre demande en quelques mots : modèle souhaité, occasion, date…",
      messageHint: "10 caractères minimum",
      errMessage: "Votre message doit contenir au moins 10 caractères.",
      counter: "{n} / {max} caractères",
      send: "Envoyer le message",
      sending: "Envoi en cours…",
      success: "Message envoyé ! Nous vous répondons dès que possible.",
      disclaimer: "En envoyant ce formulaire, vous acceptez notre",
      privacyLink: "politique de confidentialité",
    },
    infos: {
      title: "Coordonnées",
      phoneLabel: "Téléphone",
      emailLabel: "Email",
      whatsappLabel: "WhatsApp",
      whatsappCta: "Discuter maintenant sur WhatsApp",
      addressLabel: "Adresse de l'atelier",
      hoursLabel: "Horaires d'ouverture",
      hoursLines: [
        { days: "Samedi – Jeudi", time: "9 h – 18 h" },
        { days: "Vendredi", time: "9 h – 12 h · 14 h – 17 h" },
      ],
      mapTitle: "Nous trouver",
      mapCta: "Voir sur Google Maps",
      socialsLabel: "Suivre l'atelier",
      note: "Retrait gratuit à l'atelier sur rendez-vous, du samedi au jeudi.",
    },
    faq: {
      title: "Questions fréquentes",
      subtitle: "Ce que l'on nous demande le plus souvent",
      items: [
        {
          q: "Quels sont les délais de confection et de livraison ?",
          a: "Comptez 10 à 15 jours ouvrés de confection pour une taille standard, et 15 à 25 jours pour une pièce sur mesure ou richement brodée. La livraison ajoute 2 à 4 jours selon votre wilaya. Le délai précis vous est confirmé lors de l'appel de validation, et vous pouvez suivre votre commande à tout moment depuis la page « Suivi commande ».",
        },
        {
          q: "Puis-je commander une robe entièrement sur mesure ?",
          a: "Oui ! Choisissez « Sur-mesure » sur la fiche du modèle, reportez vos mesures comme indiqué dans notre guide des tailles, et nous ajustons la coupe à votre silhouette. Le supplément éventuel est affiché avant validation — et le sur-mesure est offert pour les robes de mariage.",
        },
        {
          q: "Comment se passe le paiement ?",
          a: "Uniquement à la livraison : vous payez en espèces au livreur quand vous recevez votre robe, ou à l'atelier en cas de retrait. Aucun paiement en ligne, aucun numéro de carte demandé, aucun acompte pour les tailles standards.",
        },
      ],
    },
  },

  sizeGuide: {
    hero: {
      badge: "Bien mesurer, bien porter",
      title: "Guide des tailles & mesures",
      subtitle:
        "Taille standard ou sur-mesure : tout ce qu'il faut pour choisir avec confiance, ruban à la main.",
    },
    intro: {
      title: "Quelle option pour vous ?",
      standard: {
        title: "La taille standard",
        text: "Si vos mesures correspondent à l'une des tailles du tableau ci-dessous, choisissez simplement cette taille sur la fiche du modèle. Choix plus simple, confection légèrement plus rapide — et la coupe reste ajustable de quelques centimètres lors de l'essayage.",
      },
      custom: {
        title: "Le sur-mesure",
        text: "Vos mesures s'écartent du tableau, ou vous voulez une coupe exactement ajustée ? Sélectionnez « Sur-mesure » et reportez vos six mesures : nous cousons à votre silhouette. Le supplément éventuel est affiché sur chaque fiche avant validation — et il est offert pour les robes de mariage.",
      },
    },
    table: {
      title: "Nos tailles standards",
      subtitle: "Mensurations en centimètres, prises sur le corps",
      note: "Entre deux tailles ? Choisissez celle qui correspond à votre tour de poitrine et demandez le sur-mesure — ou appelez-nous, nous vous conseillerons avec plaisir.",
      size: "Taille",
      chest: "Tour de poitrine",
      waist: "Tour de taille",
      hips: "Tour de hanches",
      rows: [
        { size: "S", chest: 88, waist: 70, hips: 94 },
        { size: "M", chest: 92, waist: 74, hips: 98 },
        { size: "L", chest: 96, waist: 78, hips: 102 },
        { size: "XL", chest: 102, waist: 84, hips: 108 },
        { size: "XXL", chest: 108, waist: 90, hips: 114 },
      ],
    },
    measure: {
      title: "Comment prendre vos mesures",
      subtitle: "Six mesures suffisent — debout, bien droite, ruban souple sans serrer",
      rangeLabel: "Plage conseillée : {min}–{max} cm",
      cards: {
        chest: {
          title: "Tour de poitrine",
          text: "Passez le ruban à l'endroit le plus fort de la poitrine, bien horizontalement, sous les aisselles. Respirez normalement, sans gonfler le buste.",
        },
        waist: {
          title: "Tour de taille",
          text: "Mesurez au creux naturel de la taille, juste au-dessus du nombril, bras détendus. Ne rentrez pas le ventre : la robe doit rester confortable.",
        },
        hips: {
          title: "Tour de hanches",
          text: "Placez le ruban à l'endroit le plus large des hanches, pieds joints. C'est cette mesure qui garantit le tombé de la jupe.",
        },
        length: {
          title: "Longueur totale",
          text: "Du haut de l'épaule jusqu'à l'ourlet souhaité : au genou, au mollet ou à la cheville. Précisez la longueur si vous choisissez le sur-mesure.",
        },
        sleeve: {
          title: "Longueur de manche",
          text: "Du sommet de l'épaule jusqu'au poignet, bras légèrement plié. Indispensable pour les manches longues et les manches évasées.",
        },
        shoulders: {
          title: "Largeur d'épaules",
          text: "Dans le dos, d'un bout à l'autre des épaules, entre les deux os saillants. Une mesure qui change tout au tombé du buste.",
        },
      },
    },
    tips: {
      title: "Les astuces de l'atelier",
      items: [
        {
          title: "Un ruban posé, pas serré",
          text: "Le mètre ruban doit être plaqué à plat contre le corps, sans serrer : vous devez pouvoir glisser un doigt dessous. Un ruban tendu donne une robe étroite.",
        },
        {
          title: "Mesurez-vous en sous-vêtements",
          text: "Debout, pieds joints, en sous-vêtements ou vêtements très fins — jamais sur un pull ou une ceinture. Demandez de l'aide si possible : c'est plus précis dans le dos.",
        },
        {
          title: "Entre deux tailles ?",
          text: "Choisissez la taille la plus proche de votre tour de poitrine et demandez le sur-mesure — ou envoyez-nous vos mesures : nous les vérifions avec vous avant de couper le tissu.",
        },
      ],
    },
    cta: {
      title: "Vous avez vos mesures ?",
      text: "Elles n'attendent plus que leur modèle — parcourez la boutique et composez votre robe.",
      button: "Découvrir la boutique",
    },
  },

  legal: {
    updated: "Dernière mise à jour : janvier 2026",
    alsoSee: "À consulter également",
    cgv: {
      title: "Conditions générales de vente",
      sections: [
        {
          h: "1. Objet et acceptation",
          p: "Les présentes conditions générales de vente régissent les ventes de robes et d'accessoires confectionnés par l'atelier Taqendurt, Rue des Artisans, Tizi-Ouzou 15000 (Algérie). Toute commande passée sur ce site implique l'acceptation sans réserve des présentes conditions, ainsi que de notre politique d'échange et de confidentialité.",
        },
        {
          h: "2. Commande et validation téléphonique",
          p: "Après l'envoi du formulaire de commande, notre équipe vous appelle sous 24 à 48 heures ouvrées afin de confirmer vos choix — modèle, tissu, couleur, taille ou mesures personnalisées, broderies — ainsi que l'adresse et le mode de livraison. La commande ne devient définitive qu'après cet échange : c'est lui qui garantit que la pièce confectionnée correspond exactement à votre attente.",
        },
        {
          h: "3. Prix",
          p: "Les prix sont indiqués en dinars algériens (DA), toutes taxes comprises, hors frais de livraison. Le prix final de votre pièce — incluant les éventuels suppléments liés au tissu choisi, aux broderies ou au sur-mesure — vous est communiqué avant validation, lors de l'appel téléphonique et dans le récapitulatif de commande. Aucun montant supplémentaire ne peut être exigé après la validation.",
        },
        {
          h: "4. Confection et délais",
          p: "Chaque pièce est confectionnée à la main dans notre atelier de Tizi-Ouzou. Les délais indicatifs sont de 10 à 15 jours ouvrés pour une taille standard et de 15 à 25 jours ouvrés pour une pièce sur mesure ou richement brodée. Ces délais sont confirmés lors de l'appel de validation et peuvent varier selon la période de l'année (Ramadan, saison des mariages). En cas de retard, vous êtes informée par téléphone.",
        },
        {
          h: "5. Livraison",
          p: "Nous livrons dans les 58 wilayas de l'Algérie, à domicile ou au bureau de poste le plus proche selon les localités. Les frais de livraison, qui varient selon la wilaya, s'affichent avant la validation de la commande. Le retrait gratuit à l'atelier de Tizi-Ouzou reste possible sur simple demande.",
        },
        {
          h: "6. Paiement",
          p: "Le paiement s'effectue exclusivement à la livraison — en espèces, au livreur — ou au moment du retrait à l'atelier. Aucun paiement en ligne n'est demandé et aucun acompte n'est exigé pour une taille standard.",
        },
        {
          h: "7. Annulation",
          p: "Vous pouvez annuler votre commande gratuitement tant que la confection n'a pas commencé (statut « Validée »). Passé ce stade, l'annulation est étudiée au cas par cas selon l'avancement de la pièce : gratuite jusqu'à la coupe du tissu, puis soumise à une indemnisation du travail déjà réalisé, dont le montant vous est précisé par téléphone avant toute décision.",
        },
        {
          h: "8. Propriété des créations",
          p: "Les modèles, motifs et broderies présentés sur ce site sont des créations originales de l'atelier Taqendurt. Toute reproduction, même partielle, des visuels, broderies et créations — par quelque procédé que ce soit — est interdite sans notre autorisation écrite préalable.",
        },
      ],
    },
    returns: {
      title: "Échanges & retours",
      sections: [
        {
          h: "1. Délai et conditions d'échange",
          p: "Vous disposez de 7 jours après réception pour demander l'échange d'un article de taille standard, à condition qu'il soit neuf, non porté, non lavé et qu'il conserve son étiquette d'origine ainsi que son emballage. Un article porté, détérioré ou sans étiquette ne peut être repris.",
        },
        {
          h: "2. Articles sur mesure",
          p: "Les pièces confectionnées sur mesures personnalisées ne sont ni reprises ni échangées : elles ont été réalisées exclusivement pour vous, selon vos indications. Cette exclusion ne s'applique pas en cas de défaut de confection avéré (voir point 3).",
        },
        {
          h: "3. Défaut de confection",
          p: "En cas de défaut de confection — couture défaillante, broderie endommagée, mesure non conforme à celles que vous nous avez transmises — nous prenons en charge la réfection ou l'échange de votre pièce gratuitement, y compris les frais d'acheminement, sur simple signalement de votre part.",
        },
        {
          h: "4. Procédure",
          p: "Appelez-nous ou écrivez-nous — WhatsApp, téléphone ou email — en indiquant votre numéro de commande (format RK-AAAA-NNNN) et, si possible, des photos de la pièce. Nous vous orientons alors vers un échange par livraison ou directement à l'atelier, selon ce qui vous arrange le mieux.",
        },
        {
          h: "5. Remboursement",
          p: "Lorsqu'un remboursement est convenu — paiement déjà effectué au livreur et responsabilité de l'atelier engagée — il est versé sous 14 jours, par CCP ou par virement CIB / Edahabia, au choix. Aucun frais de dossier n'est retenu.",
        },
      ],
    },
    privacy: {
      title: "Politique de confidentialité",
      sections: [
        {
          h: "1. Responsable du traitement",
          p: "Le responsable du traitement des données est l'atelier Taqendurt, Rue des Artisans, Tizi-Ouzou 15000, Algérie, joignable à l'adresse contact@taqendurt.dz.",
        },
        {
          h: "2. Données collectées",
          p: "Dans le cadre de vos commandes, nous collectons : votre nom et prénom, votre numéro de téléphone, votre email (facultatif), votre adresse de livraison (wilaya, commune, adresse) et, en cas de sur-mesure, vos mesures corporelles. Les messages que vous nous adressez via le formulaire de contact sont également conservés avec vos coordonnées. Ces données servent exclusivement au traitement, à la validation et au suivi de votre commande.",
        },
        {
          h: "3. Utilisation et non-vente des données",
          p: "Vos données ne sont ni vendues, ni louées, ni transmises à des tiers à des fins commerciales. Seuls nos partenaires de livraison reçoivent les informations strictement nécessaires à l'acheminement de votre colis : nom, téléphone et adresse.",
        },
        {
          h: "4. Durée de conservation",
          p: "Les données relatives aux commandes sont conservées pendant 10 ans afin de satisfaire à nos obligations comptables. Les mesures corporelles communiquées pour un sur-mesure sont supprimées 12 mois après la livraison, sauf demande contraire de votre part.",
        },
        {
          h: "5. Cookies et stockage local",
          p: "Ce site n'utilise aucun cookie publicitaire ni traceur de tiers. Le stockage local de votre navigateur ne conserve que vos préférences : la langue choisie, le thème clair ou sombre, et le contenu de votre panier en cours. Vous pouvez les effacer à tout moment depuis les réglages de votre navigateur.",
        },
        {
          h: "6. Vos droits",
          p: "Vous disposez d'un droit d'accès, de rectification et de suppression des données vous concernant. Une simple demande par email à contact@taqendurt.dz suffit ; nous y répondons dans un délai maximum de 30 jours.",
        },
      ],
    },
  },
}

// ── ARABE ───────────────────────────────────────────────────────

const ar: PagesDict = {
  about: {
    hero: {
      badge: "ورشة خياطة — تيزي وزو، منذ 2012",
      titleA: "ثلاثة أجيال،",
      titleB: "وخيط واحد",
      subtitle:
        "تخيط «تاقندورث» فساتين قبائلية يدوياً، وريثة مهارة تتناقلتها الجدّات والأحفاد. أهلاً بك في ورشتنا.",
    },
    story: {
      kicker: "قصتنا",
      title: "كل شيء بدأ في شارع الصناع التقليديين",
      paragraphs: [
        "وُلدت «تاقندورث» عام 2012 في غرفة صغيرة تفيض بالضوء، في شارع الصناع التقليديين بمدينة تيزي وزو. هناك خاطت أمينة، وهي خيّاطة شابة تدرّبت على يد والدتها، أوّل فساتينها القبائلية لجارات الحيّ. كانت الطلبات تنتقل من فم إلى أذن: فستان خطوبة هنا، وكاراكو حفلة هناك. ولم يمضِ وقت طويل حتى ضاقت الغرفة الصغيرة بكل هذا الإقبال.",
        "إنّ مهارة الدار تعود إلى أبعد من عام 2012. فمن جدّتها، وهي خيّاطة معروفة في قريتها، ورثت أمينة حركات يدها: غرزة قرص النحل في التطريز القبائلي، والتركيب الرقيق للمخمل، وفنّ الجمع بين الخيط الذهبي والحرير. هكذا توارثت ثلاثة أجيال الاهتمام ذاته بأدق التفاصيل — وحين انضمت والدة أمينة إلى المغامرة، اكتملت الدائرة على نحو طبيعي.",
        "اليوم تجتمع في الورشة عشر حرفيات تقصّن ويطرّزن ويلمّن كل قطعة بأيديهن. نُلبّس زبوناتنا في 58 ولاية، من فستان اليوميات إلى فستان الزفاف المطرّز. شيء واحد لم يتغيّر: كل فستان يغادر الورشة يحمل معه صبر الأيدي، ورائحة القماش الممشّط، واعتزازاً بمهنة تُورَّث.",
      ],
      imageAlt: "يدا حرفية تطرّزان فستاناً قبائلياً بالخيط الذهبي في ورشة تاقندورث",
      imageCaption: "الورشة، شارع الصناع التقليديين — بعد ظهر من التطريز.",
      badgeTitle: "منذ 2012",
      badgeText: "تيزي وزو، القبائل",
    },
    craft: {
      title: "حرفتنا",
      subtitle: "ما تجيده أيدينا، قطعةً بعد قطعة",
      items: [
        {
          title: "القصّ والتركيب",
          text: "يُرسم كل باترون يدوياً ويُضبط على قوامك قبل أوّل قصّة للقماش. والتركيب، المصنوع كلياً باليد، يضمن انسدالاً مثالياً، ثنيةً بعد ثنية.",
        },
        {
          title: "التطريز اليدوي",
          text: "غرزات قبائلية تقليدية — قرص النحل والمسطّح والمتقاطع — بخيط الحرير أو الخيط الذهبي. قد تتطلب قطعة الحفل الواحدة أكثر من ثلاثين ساعة من التطريز.",
        },
        {
          title: "الخياطة حسب القياس",
          text: "تودعين لدينا قياساتك الستة، فننصح ونضبط ونخيط على قوامك. والخياطة حسب القياس مجانية لفساتين الزفاف.",
        },
        {
          title: "مراقبة الجودة",
          text: "يمرّ كل فستان بمراقبة في اثنتي عشرة نقطة — الخياطة، التطريز، اللمسات الأخيرة، الانسدال، والتغليف — قبل أن يوضع في غلافه وصندوقه.",
        },
      ],
    },
    values: {
      title: "قيمنا",
      subtitle: "ما يوجّه كل حركاتنا",
      items: [
        {
          title: "الصنعة المحلية",
          text: "كل شيء يُخاط في ورشتنا بتيزي وزو على يد حرفيات من المنطقة، بأجر عادل. لا إسناد إلى الغير، ولا إنتاج بالجملة: قطع فريدة، بإيقاعها الخاص.",
        },
        {
          title: "التوريث",
          text: "كل عام ندرّب خيّاطات شابات على الغرزات القبائلية والتركيب التقليدي. فهذا التراث لا يحيا إلا إذا ظل يُتعلَّم.",
        },
        {
          title: "الجودة أولاً",
          text: "مخمل وساتان وموسلين مختارة من مورّدين موثوقين، ومُراقبة لوناً بلون. فستان «تاقندورث» يُلبس سنوات — ويُورَّث.",
        },
      ],
    },
    stats: [
      { value: "13", label: "سنة من الورشة" },
      { value: "+1500", label: "فساتين خاطتها أيدينا" },
      { value: "58", label: "ولاية نوصل إليها" },
    ],
    cta: {
      title: "ما رأيك أن تكون التالية لك؟",
      text: "تصفّحي تصاميمنا، واختاري القماش والتطريز والطول — أو أخبرينا فقط بما تتخيلين، ونتولّى نحن الباقي.",
      catalog: "تصفّحي المتجر",
      whatsapp: "تحدّثي معنا على واتساب",
    },
  },

  contact: {
    hero: {
      badge: "نردّ خلال 24 ساعة عمل",
      title: "لنتحدّث عن فستانك",
      subtitle:
        "سؤال عن تصميم، أو عن الخياطة حسب القياس، أو عن التوصيل؟ راسلينا هنا، أو انضمي إلينا مباشرة على واتساب — الورشة تجيبك من السبت إلى الخميس.",
    },
    form: {
      title: "راسلينا",
      subtitle: "نردّ على كل رسالة، دون استثناء.",
      name: "اسمك *",
      namePlaceholder: "مثال: ليندة حدّاد",
      errName: "يرجى كتابة اسمك (حرفان على الأقل).",
      phone: "رقم الهاتف",
      phonePlaceholder: "05 50 12 34 56",
      errPhone: "رقم جزائري غير صالح (مثال: 0550 12 34 56).",
      email: "البريد الإلكتروني (اختياري)",
      emailPlaceholder: "you@example.dz",
      subject: "الموضوع",
      subjectPlaceholder: "طلب، خياطة حسب القياس، الآجال…",
      message: "رسالتك *",
      messagePlaceholder: "صفي طلبك في بضع كلمات: التصميم المرغوب، المناسبة، التاريخ…",
      messageHint: "10 أحرف على الأقل",
      errMessage: "يجب أن تحتوي رسالتك على 10 أحرف على الأقل.",
      counter: "{n} / {max} حرفاً",
      send: "إرسال الرسالة",
      sending: "جار الإرسال…",
      success: "تم إرسال رسالتك! سنجيبك في أقرب وقت.",
      disclaimer: "بإرسال هذا الاستمارة، فإنك تقبلين",
      privacyLink: "سياسة الخصوصية",
    },
    infos: {
      title: "معلومات التواصل",
      phoneLabel: "الهاتف",
      emailLabel: "البريد الإلكتروني",
      whatsappLabel: "واتساب",
      whatsappCta: "تحدّثي معنا الآن على واتساب",
      addressLabel: "عنوان الورشة",
      hoursLabel: "أوقات العمل",
      hoursLines: [
        { days: "السبت – الخميس", time: "9:00 – 18:00" },
        { days: "الجمعة", time: "9:00 – 12:00 · 14:00 – 17:00" },
      ],
      mapTitle: "موقعنا",
      mapCta: "اعرضي على خرائط Google",
      socialsLabel: "تابعي الورشة",
      note: "الاستلام المجاني من الورشة بموعد مسبق، من السبت إلى الخميس.",
    },
    faq: {
      title: "أسئلة متكررة",
      subtitle: "أكثر ما يُطرح علينا من أسئلة",
      items: [
        {
          q: "ما هي آجال الخياطة والتوصيل؟",
          a: "احسبي 10 إلى 15 يوماً عملياً للخياطة في المقاس القياسي، و15 إلى 25 يوماً للقطع المخيطة حسب القياس أو الغنيّة بالتطريز. يضيف التوصيل يومين إلى أربعة أيام حسب ولايتك. يُؤكَّد لك الأجل الدقيق أثناء مكالمة المصادقة، ويمكنك تتبّع طلبك في أي وقت من صفحة «تتبع الطلب».",
        },
        {
          q: "هل يمكنني طلب فستان بخياطة كاملة حسب القياس؟",
          a: "نعم! اختاري «حسب القياس» في صفحة التصميم، وأدخلي قياساتك كما هو موضح في دليل المقاسات، وسنضبط القصّة على قوامك. تُعرض الزيادة المحتملة قبل المصادقة — والخياطة حسب القياس مجانية لفساتين الزفاف.",
        },
        {
          q: "كيف تتم عملية الدفع؟",
          a: "حصراً عند التسليم: تدفعين نقداً لعامل التوصيل عند استلام فستانك، أو في الورشة في حال الاستلام من عندها. لا دفع إلكتروني، ولا نطلب أي رقم بطاقة، ولا أي عربون للمقاسات القياسية.",
        },
      ],
    },
  },

  sizeGuide: {
    hero: {
      badge: "قياس دقيق، إطلالة مثالية",
      title: "دليل المقاسات والقياسات",
      subtitle: "مقاس قياسي أو خياطة حسب القياس: كل ما تحتاجينه لتختاري بثقة، ومعك شريط القياس.",
    },
    intro: {
      title: "أي خيار يناسبك؟",
      standard: {
        title: "المقاس القياسي",
        text: "إذا كانت قياساتك تطابق أحد مقاسات الجدول أدناه، اختاري ذلك المقاس مباشرةً في صفحة التصميم. اختيار أسهل، وخياطة أسرع قليلاً — مع إمكانية تعديل القصّة ببضعة سنتيمترات.",
      },
      custom: {
        title: "الخياطة حسب القياس",
        text: "قياساتك خارج الجدول، أو تريدين قصّة مضبوطة تماماً؟ اختاري «حسب القياس» وأدخلي قياساتك الستة: نخيط على قوامك. تُعرض الزيادة المحتملة في كل صفحة قبل المصادقة — وهي مجانية لفساتين الزفاف.",
      },
    },
    table: {
      title: "مقاساتنا القياسية",
      subtitle: "القياسات بالسنتيمتر، مأخوذة على الجسم",
      note: "بين مقاسين؟ اختاري المقاس الأقرب لمحيط صدرك واطلبي الخياطة حسب القياس — أو اتصلي بنا، وسننصحك بكل سرور.",
      size: "المقاس",
      chest: "محيط الصدر",
      waist: "محيط الخصر",
      hips: "محيط الوركين",
      rows: [
        { size: "S", chest: 88, waist: 70, hips: 94 },
        { size: "M", chest: 92, waist: 74, hips: 98 },
        { size: "L", chest: 96, waist: 78, hips: 102 },
        { size: "XL", chest: 102, waist: 84, hips: 108 },
        { size: "XXL", chest: 108, waist: 90, hips: 114 },
      ],
    },
    measure: {
      title: "كيف تأخذين قياساتك",
      subtitle: "ستة قياسات تكفي — واقفة، معتدلة القامة، بشريط مرن دون شدّ",
      rangeLabel: "المدى الموصى به: {min}–{max} سم",
      cards: {
        chest: {
          title: "محيط الصدر",
          text: "مرّري الشريط عند أوسع نقطة من الصدر، أفقياً تماماً وتحت الإبطين. تنفّسي بشكل طبيعي، دون نفخ الصدر.",
        },
        waist: {
          title: "محيط الخصر",
          text: "قيسي عند الخصر الطبيعي، فوق السرّة مباشرة، والذراعان مسترخيتان. لا تشدّي البطن للداخل: يجب أن يبقى الفستان مريحاً.",
        },
        hips: {
          title: "محيط الوركين",
          text: "ضعي الشريط عند أوسع نقطة من الوركين، والقدمان مضمومتان. هذا القياس هو ما يضمن انسدال التنورة.",
        },
        length: {
          title: "الطول الكلي",
          text: "من أعلى الكتف حتى الذيل الذي تريدينه: عند الركبة، أو بطة الساق، أو الكاحل. حدّدي الطول إذا اخترت الخياطة حسب القياس.",
        },
        sleeve: {
          title: "طول الكم",
          text: "من قمة الكتف حتى المعصم، والذراع مثنية قليلاً. قياس لا غنى عنه للأكمام الطويلة والواسعة.",
        },
        shoulders: {
          title: "عرض الكتفين",
          text: "من الخلف، من طرف إلى طرف بين عظمتي الكتف البارزتين. قياس يغيّر الكثير في انسدال الجزء العلوي.",
        },
      },
    },
    tips: {
      title: "نصائح من الورشة",
      items: [
        {
          title: "شريط مرن، لا قيد",
          text: "يجب أن يستقر الشريط مستوياً على الجسم دون شدّ: بحيث يمكنك إدخال إصبع تحته. الشريط المشدود يعطي فستاناً ضيقاً.",
        },
        {
          title: "قيسي بالملابس الداخلية",
          text: "واقفة، والقدمان مضمومتان، بالملابس الداخلية أو بملابس خفيفة جداً — لا فوق سويتر أو حزام. اطلبي المساعدة إن أمكن: القياس من الخلف أدق.",
        },
        {
          title: "بين مقاسين؟",
          text: "اختاري المقاس الأقرب لمحيط صدرك واطلبي الخياطة حسب القياس — أو أرسلي لنا قياساتك: نتحقق منها معك قبل قصّ القماش.",
        },
      ],
    },
    cta: {
      title: "أخذتِ قياساتك؟",
      text: "إنها لا تنتظر سوى تصميمها — تصفّحي المتجر وركّبي فستانك.",
      button: "تصفّحي المتجر",
    },
  },

  legal: {
    updated: "آخر تحديث: جانفي 2026",
    alsoSee: "اطّلعي أيضاً على",
    cgv: {
      title: "الشروط العامة للبيع",
      sections: [
        {
          h: "1. الموضوع والقبول",
          p: "تنظّم هذه الشروط العامة للبيع مبيعات الفساتين والإكسسوارات التي تصنعها ورشة «تاقندورث»، شارع الصناع التقليديين، تيزي وزو 15000 (الجزائر). كل طلب يُقدَّم عبر هذا الموقع يُعدّ قبولاً بلا تحفّظ بهذه الشروط، وبسياسة التبديل وسياسة الخصوصية المرافقتين لها.",
        },
        {
          h: "2. الطلب والمصادقة الهاتفية",
          p: "بعد إرسال استمارة الطلب، يتصل بك فريقنا في غضون 24 إلى 48 ساعة عمل لتأكيد خياراتك — التصميم، القماش، اللون، المقاس أو القياسات الشخصية، والتطريزات — وكذلك العنوان وطريقة التوصيل. لا يصبح الطلب نهائياً إلا بعد هذه المكالمة: فهي ما يضمن أن تكون القطعة المخيطة مطابقة تماماً لما تنتظرينه.",
        },
        {
          h: "3. الأسعار",
          p: "تُعرض الأسعار بالدينار الجزائري (دج)، جميع الرسوم مضمنة، عدا مصاريف التوصيل. يُبلَّغ لك السعر النهائي لقطعتك — بما فيه أي زيادات تتعلق بالقماش المختار أو التطريزات أو الخياطة حسب القياس — قبل المصادقة، أثناء المكالمة الهاتفية وفي ملخّص الطلب. لا يجوز طلب أي مبلغ إضافي بعد المصادقة.",
        },
        {
          h: "4. الخياطة والآجال",
          p: "تُخاط كل قطعة يدوياً في ورشتنا بتيزي وزو. الآجال التقديرية هي 10 إلى 15 يوماً عملياً للمقاس القياسي، و15 إلى 25 يوماً عملياً للقطع المخيطة حسب القياس أو الغنيّة بالتطريز. تُؤكَّد هذه الآجال أثناء مكالمة المصادقة، وقد تختلف حسب فترة السنة (رمضان، موسم الأعراس). وفي حال التأخير، نُبلغك هاتفياً.",
        },
        {
          h: "5. التوصيل",
          p: "نوصل إلى 58 ولاية عبر كامل الجزائر، إلى المنزل أو إلى أقرب مكتب بريد حسب الجهات. تظهر مصاريف التوصيل، المتغيرة حسب الولاية، قبل المصادقة على الطلب. ويبقى الاستلام المجاني من الورشة بتيزي وزو متاحاً بناءً على طلب بسيط.",
        },
        {
          h: "6. الدفع",
          p: "يتم الدفع حصراً عند التسليم — نقداً لعامل التوصيل — أو عند الاستلام من الورشة. لا نطلب أي دفع إلكتروني، ولا أي عربون للمقاسات القياسية.",
        },
        {
          h: "7. الإلغاء",
          p: "يمكنك إلغاء طلبك مجاناً ما دامت الخياطة لم تبدأ بعد (الحالة «مصادق عليها»). بعد ذلك، تُدرَس حالة الإلغاء حسب تقدّم إنجاز القطعة: مجاني حتى قصّ القماش، ثم يخضع لتعويض العمل المنجز، ويُحدَّد مبلغه ويُشرَح لك هاتفياً قبل أي قرار.",
        },
        {
          h: "8. ملكية الإبداعات",
          p: "التصاميم والنقوش والتطريزات المعروضة على هذا الموقع إبداعات أصلية لورشة «تاقندورث». يُمنع إعادة إنتاج الصور والتطريزات والإبداعات، حتى جزئياً وبأي وسيلة كانت، دون إذن كتابي مسبق منّا.",
        },
      ],
    },
    returns: {
      title: "التبديل والإرجاع",
      sections: [
        {
          h: "1. أجل التبديل وشروطه",
          p: "لديك 7 أيام بعد الاستلام لطلب تبديل قطعة بالمقاس القياسي، بشرط أن تكون جديدة، غير مُستهلَكة، غير مغسولة، وأن تحتفظ ببطاقتها الأصلية وتغليفها. لا تُقبل القطعة المُستهلَكة أو التالفة أو من دون بطاقة.",
        },
        {
          h: "2. القطع حسب القياس",
          p: "لا تُستبدَل ولا تُستردّ القطع المخيطة حسب قياسات شخصية: فقد أُنجزت خصيصاً لك ووفق إرشاداتك. لا ينطبق هذا الاستثناء في حال وجود عيب في الخياطة مثبت (انظري النقطة 3).",
        },
        {
          h: "3. عيوب الخياطة",
          p: "في حال وجود عيب في الصنعة — خياطة ضعيفة، تطريز تالف، أو قياس غير مطابق للقياسات التي أرسلتها لنا — نتكفّل بإصلاح القطعة أو تبديلها مجاناً، بما في ذلك مصاريف النقل، بمجرد إبلاغنا من طرفك.",
        },
        {
          h: "4. الإجراء",
          p: "اتصلي بنا أو راسلينا — واتساب أو الهاتف أو البريد الإلكتروني — مع ذكر رقم طلبك (بصيغة RK-AAAA-NNNN)، وصور للقطعة إن أمكن. ثم نوجّهك نحو التبديل عبر التوصيل أو مباشرة في الورشة، حسب ما يناسبك أكثر.",
        },
        {
          h: "5. استرداد المبلغ",
          p: "عند الاتفاق على استرداد المبلغ — إذا كان الدفع قد تمّ لعامل التوصيل وتقرّرت مسؤولية الورشة — يُعاد خلال 14 يوماً، عبر CCP أو التحويل CIB / الذهبية، حسب اختيارك. ولا يُخصم أي مصاريف ملف.",
        },
      ],
    },
    privacy: {
      title: "سياسة الخصوصية",
      sections: [
        {
          h: "1. المسؤول عن المعالجة",
          p: "المسؤول عن معالجة البيانات هو ورشة «تاقندورث»، شارع الصناع التقليديين، تيزي وزو 15000، الجزائر، ويمكن التواصل معه عبر العنوان contact@taqendurt.dz.",
        },
        {
          h: "2. البيانات المجمَّعة",
          p: "في إطار طلباتك، نجمع: اسمك ولقبك، رقم هاتفك، بريدك الإلكتروني (اختياري)، عنوان التوصيل (الولاية، البلدية، العنوان)، وفي حالة الخياطة حسب القياس، قياساتك الجسدية. كما تُحفظ الرسائل التي ترسلينها عبر استمارة الاتصال مع معلوماتك. تُستخدم هذه البيانات حصراً لمعالجة طلبك والمصادقة عليه وتتبّعه.",
        },
        {
          h: "3. الاستخدام وعدم بيع البيانات",
          p: "لا تُباع بياناتك ولا تُؤجَّر ولا تُنقل إلى أي طرف لأغراض تجارية. لا يتلقى شركاؤنا في التوصيل إلا المعلومات الضرورية تماماً لإيصال طردك: الاسم والهاتف والعنوان.",
        },
        {
          h: "4. مدة الحفظ",
          p: "تُحفظ بيانات الطلبات مدة 10 سنوات وفقاً لالتزاماتنا المحاسبية. أما القياسات الجسدية المرسلة للخياطة حسب القياس فتُحذف بعد 12 شهراً من التسليم، إلا إذا طلبتِ خلاف ذلك.",
        },
        {
          h: "5. الكوكيز والتخزين المحلي",
          p: "لا يستخدم هذا الموقع أي كوكيز إعلانية أو أدوات تتبّع من أطراف ثالثة. لا يحتفظ التخزين المحلي لمتصفحك إلا بتفضيلاتك: اللغة المختارة، والمظهر (فاتح/داكن)، ومحتوى سلتك الجارية. ويمكنك محوها في أي وقت من إعدادات متصفحك.",
        },
        {
          h: "6. حقوقك",
          p: "لك حق الوصول إلى بياناتك وتصحيحها وحذفها. يكفي طلب بسيط عبر البريد الإلكتروني إلى contact@taqendurt.dz، ونردّ خلال 30 يوماً كأقصى تقدير.",
        },
      ],
    },
  },
}

export const pages: { fr: PagesDict; ar: PagesDict } = { fr, ar }
  kab: {
    about: {
      title: "Ɣef-nneɣ",
      subtitle: "Lxidma n uxiyyaḍ di Tizi Wezzu",
      story: "Amezruy-nneɣ",
      values: "Tuffriwin-nneɣ",
      team: "Terbaɛt",
      tradition: "Tidet n tezdayin",
      traditionText: "Yal tamenuɣt tettwaggez, tettwaqqec u tettwaṛkaḍ di lxidma-nneɣ s ifassen n tessifiyyin i iḥeggan tamusni i d-serwent teglam.",
      quality: "Taɣara n zzu",
      qualityText: "Nettxirrer addud d yiniten ifazen sɣur imsizzwiren i nezmer. Akk axedim yettwasenqed send ad yeffeɣ seg lxidma.",
      custom: "S teɣzi",
      customText: "Ula yiwet tmenuɣt ur tesser taɣara s wakk i wa ɣef ɣef. Nsenfel yal afaris ɣer tektayin d yismiten-nwen.",
    },
    contact: {
      title: "Nermes-aɣ",
      subtitle: "Ɣur-k isuturen uzzigt? Tqellqeḍ ɣef tewṣa? Tebɣiḍ aḍris uslig?",
      form: "Azen-aɣ-d izen",
      name: "Isem-ik",
      namePh: "Amek ara k-nissiweḍ?",
      email: "Imayl-ik",
      emailPh: "tur@amedya.dz",
      phone: "Tiliɣri (tesmetti)",
      phonePh: "0555 12 34 56",
      subject: "Asentel",
      subjectPh: "Acu ɣef i tebɣiḍ a d-nessiwel?",
      message: "Izen-ik",
      messagePh: "Ini-yaɣ-d…",
      send: "Azen",
      sending: "Tuzna…",
      sent: "Yettwazzen! Ad ak-id-nerr deg kra n tesdatin.",
      error: "Tuccḍa deg tuzna. Ɛreḍ tikelt-nniḍen neɣ nermes-aɣ s tiliɣri.",
      direct: "Nermes-aɣ srid",
      directHint: "Tismettemt ad d-tewwḍeḍ srid?",
    },
    sizeGuide: {
      title: "Amnir n teɣziwin",
      subtitle: "Amek ara tefreḍ teɣzi-k?",
      intro: "Deg-nneɣ, yal tmenuɣt tzemmer ad tettwasenfar s teɣzi-ik. Isefka-a i useqdec n teɣziwin tilɣamin kan.",
      standard: "Tafelwit n teɣziwin tilɣamin",
      table: {
        size: "Teɣzi",
        chest: "Idmaren (cm)",
        waist: "Talalit (cm)",
        hips: "Iqerqiben (cm)",
        height: "Teɣzi (cm)",
      },
      custom: "Axeddim s teɣzi",
      customText: "Ma yella teqqnen gar sin n teɣziwin, neɣ ma tebɣiḍ aseggem amaɣtu, fren « S teɣzi » deg usebter n ufaris. Ad ak-id-nawi tiktayin-ik s tiliɣri send axeddim.",
      howTo: "Amek ara tektaḍ?",
      howToText: "Seqdec ameṭṭu n uxiyyaḍ, mbla ma tseḍḍseḍ. Ḍmen tmenḍawt-ik s lqaɛa.",
    },
  },
}
