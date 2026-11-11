// ─────────────────────────────────────────────────────────────
// Dictionnaires i18n pour le module de mesures
// ─────────────────────────────────────────────────────────────

export const measurementsFr = {
  wizard: {
    title: "Prise de mesures",
    progress: "{current} sur {total} mesures",
  },
  step0: {
    title: "Avant de commencer",
    forWho: {
      title: "Pour qui prenez-vous ces mesures ?",
      self: "Moi",
      daughter: "Ma fille",
      sister: "Ma sœur",
      other: "Autre personne",
      namePlaceholder: "Prénom",
    },
    method: {
      title: "Comment voulez-vous mesurer ?",
      tape: "Avec un mètre ruban",
      tapeDesc: "Recommandé, le plus précis",
      dress: "À partir d'une robe existante",
      dressDesc: "Posez une robe qui vous va bien à plat",
      estimation: "Estimation taille/poids",
      estimationDesc: "Indicatif, vous ajusterez ensuite",
    },
    fit: {
      title: "Coupe souhaitée",
      fitted: "Près du corps",
      comfortable: "Confortable",
      loose: "Ample",
    },
    units: {
      cm: "Centimètres",
      inches: "Pouces",
    },
    next: "Commencer",
  },
  step1: {
    title: "Zones à mesurer",
    subtitle: "Tapez sur une zone pour commencer",
    measure: "Mesurer",
    next: "Suivant",
  },
  step2: {
    range: "Plage conseillée : {min}–{max} cm",
    keyboard: "Saisir au clavier",
    keyboardTitle: "Entrez la valeur",
    keyboardPlaceholder: "Exemple : 92",
    cancel: "Annuler",
    confirm: "Confirmer",
    previous: "Précédent",
    next: "Suivant",
  },
  step3: {
    title: "Aperçu en temps réel",
    subtitle: "La silhouette s'adapte à vos mesures",
  },
  step4: {
    title: "Vérification",
    subtitle: "Quelques mesures semblent inhabituelles",
    unusual: "Cette mesure est inhabituelle.",
    check: "Je vérifie",
    correct: "C'est correct",
    allGood: "Prêt !",
    allGoodDesc: "Toutes les mesures semblent cohérentes",
    continue: "Continuer",
  },
  step5: {
    title: "Récapitulatif",
    subtitle: "Vérifiez vos mesures avant de valider",
    fit: "Ajustement",
    units: "Unités",
    note: "Note (optionnel)",
    notePlaceholder: "Ex : épaule droite légèrement plus large",
    validate: "Valider",
    saving: "Sauvegarde...",
  },
};

export const measurementsAr = {
  wizard: {
    title: "أخذ القياسات",
    progress: "{current} من {total} قياسات",
  },
  step0: {
    title: "قبل البدء",
    forWho: {
      title: "لمن تأخذين هذه القياسات؟",
      self: "لنفسي",
      daughter: "لابنتي",
      sister: "لأختي",
      other: "لشخص آخر",
      namePlaceholder: "الاسم",
    },
    method: {
      title: "كيف تريدين القياس؟",
      tape: "بشريط قياس",
      tapeDesc: "موصى به، الأكثر دقة",
      dress: "من فستان موجود",
      dressDesc: "ضعي فستاناً يناسبك بشكل مسطح",
      estimation: "تقدير الطول/الوزن",
      estimationDesc: "تقريبي، ستعدلين لاحقاً",
    },
    fit: {
      title: "القصة المطلوبة",
      fitted: "ملاصق للجسم",
      comfortable: "مريح",
      loose: "واسع",
    },
    units: {
      cm: "سنتيمتر",
      inches: "بوصة",
    },
    next: "البدء",
  },
  step1: {
    title: "المناطق المطلوب قياسها",
    subtitle: "اضغطي على منطقة للبدء",
    measure: "قياس",
    next: "التالي",
  },
  step2: {
    range: "المدى الموصى به: {min}–{max} سم",
    keyboard: "إدخال بلوحة المفاتيح",
    keyboardTitle: "أدخلي القيمة",
    keyboardPlaceholder: "مثال: 92",
    cancel: "إلغاء",
    confirm: "تأكيد",
    previous: "التالي",
    next: "السابق",
  },
  step3: {
    title: "معاينة مباشرة",
    subtitle: "الصورة تتكيف مع قياساتك",
  },
  step4: {
    title: "التحقق",
    subtitle: "بعض القياسات تبدو غير عادية",
    unusual: "هذا القياس غير عادي.",
    check: "سأتحقق",
    correct: "هذا صحيح",
    allGood: "جاهزة!",
    allGoodDesc: "جميع القياسات تبدو جيدة",
    continue: "المتابعة",
  },
  step5: {
    title: "الملخص",
    subtitle: "تحققي من قياساتك قبل التأكيد",
    fit: "التعديل",
    units: "الوحدات",
    note: "ملاحظة (اختياري)",
    notePlaceholder: "مثال: الكتف الأيمن أعرض قليلاً",
    validate: "تأكيد",
    saving: "...جارٍ الحفظ",
  },
};

export type MeasurementsDict = typeof measurementsFr;
