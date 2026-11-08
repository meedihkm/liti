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
    shipping: "Livraison",
    messages: "Messages",
    settings: "Paramètres",
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
    shipping: "التوصيل",
    messages: "الرسائل",
    settings: "الإعدادات",
  },
}

export const admin = {
  fr: { shell: shellFr, ...adminOrders.fr, ...adminCatalog.fr },
  ar: { shell: shellAr, ...adminOrders.ar, ...adminCatalog.ar },
}
