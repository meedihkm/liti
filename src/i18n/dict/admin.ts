// Dictionnaire admin — fusion : shell (fixe) + clés commandes (C1) + clés catalogue (C2)
import { adminOrders } from "./admin-orders"
import { adminCatalog } from "./admin-catalog"

const shellFr = {
  title: "Back-office",
  backToSite: "Retour au site",
  logout: "Déconnexion",
  nav: {
    dashboard: "Tableau de bord",
    orders: "Commandes",
    products: "Catalogue",
    options: "Tissus & options",
    measurements: "Mesures",
    shipping: "Livraison",
    messages: "Messages",
    settings: "Paramètres",
  },
  measurements: {
    noProfiles: "Aucun profil de mesures",
    name: "Nom",
    sets: "Ensembles",
    status: "Statut",
    created: "Créé le",
    validated: "Validé",
    pending: "En attente",
    set: "Ensemble",
    history: "Historique",
    comment: "Commentaire",
    commentPlaceholder: "Ajouter un commentaire (optionnel)...",
    approve: "Approuver",
    reject: "Rejeter",
  },
}

const shellAr = {
  title: "لوحة التحكم",
  backToSite: "العودة للموقع",
  logout: "تسجيل الخروج",
  nav: {
    dashboard: "لوحة القيادة",
    orders: "الطلبات",
    products: "الكتالوج",
    options: "الأقمشة والخيارات",
    measurements: "القياسات",
    shipping: "التوصيل",
    messages: "الرسائل",
    settings: "الإعدادات",
  },
  measurements: {
    noProfiles: "لا توجد ملفات قياسات",
    name: "الاسم",
    sets: "المجموعات",
    status: "الحالة",
    created: "تاريخ الإنشاء",
    validated: "مصادق عليه",
    pending: "قيد الانتظار",
    set: "مجموعة",
    history: "السجل",
    comment: "تعليق",
    commentPlaceholder: "إضافة تعليق (اختياري)...",
    approve: "موافقة",
    reject: "رفض",
  },
}

const shellKab = {
  title: "Tafelwit n usefrek",
  backToSite: "Uɣal ɣer usmel",
  logout: "Ffeɣ",
  nav: {
    dashboard: "Tafelwit n usefrek",
    orders: "Tiwṣiwin",
    products: "Akataluǧ",
    options: "Adduden d yixtiṛiyin",
    measurements: "Tisektayin",
    shipping: "Asiweḍ",
    messages: "Iznan",
    settings: "Iɣewwaṛen",
  },
  measurements: {
    noProfiles: "Ulac imaɣnuten n tsektayin",
    name: "Isem",
    sets: "Tigrawin",
    status: "Addad",
    created: "Yettwarna ass n",
    validated: "Yettwasegger",
    pending: "Irajy",
    set: "Agraw",
    history: "Amazray",
    comment: "Awennit",
    commentPlaceholder: "Rnu awennit (s lextiṛ)...",
    approve: "Qbel",
    reject: "Agi",
  },
}

export const admin = {
  fr: { shell: shellFr, ...adminOrders.fr, ...adminCatalog.fr },
  ar: { shell: shellAr, ...adminOrders.ar, ...adminCatalog.ar },
  kab: { shell: shellKab, ...adminOrders.kab, ...adminCatalog.kab },
}
