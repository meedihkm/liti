"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, ChevronRight, Sparkles } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { formatDA } from "@/lib/pricing";
import { ProductGallery } from "./product-gallery";
import { Configurator } from "./configurator";
import { ConfiguratorWizard } from "./configurator-wizard";
import { ProductCard } from "@/components/catalog/product-card";
import { BerberDivider } from "@/components/layout/berber-divider";
import { OCCASIONS } from "@/lib/constants";
import type { ProductDTO, ProductListDTO } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Page produit — galerie (zoom + teinte couleur), informations,
// configurateur complet (cœur du projet), produits liés,
// données structurées schema.org/Product (SEO).
// ─────────────────────────────────────────────────────────────

export function ProductView({ id }: { id: string }) {
  const { t, lang, L } = useI18n()
  const { navigate } = useRouter()
  const [product, setProduct] = useState<ProductDTO | null>(null)
  const [error, setError] = useState(false)
  const [related, setRelated] = useState<ProductDTO[]>([])
  const [tintHex, setTintHex] = useState<string | undefined>(undefined)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    api<ProductDTO>(`/api/products/${id}`)
      .then((p) => {
        setProduct(p)
        // Produits liés (même catégorie)
        if (p.category?.slug) {
          api<ProductListDTO>(`/api/products?category=${p.category.slug}&limit=5`)
            .then((res) => setRelated(res.products.filter((r) => r.id !== p.id).slice(0, 4)))
            .catch(() => {})
        }
      })
      .catch(() => setError(true))
  }, [id])

  // Données structurées Product (schema.org) pour le SEO
  useEffect(() => {
    if (!product) return
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.id = "product-jsonld"
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: L(product, "title"),
      description: L(product, "description"),
      image: product.images.map((i) => i.url),
      category: product.category?.name,
      brand: { "@type": "Brand", name: "Taqendurt" },
      offers: {
        "@type": "Offer",
        priceCurrency: "DZD",
        price: product.basePrice,
        availability: "https://schema.org/PreOrder",
        itemCondition: "https://schema.org/NewCondition",
      },
    })
    document.head.appendChild(script)
    return () => {
      document.getElementById("product-jsonld")?.remove()
    }
  }, [product, lang])

  if (error) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-bold">{t("common.misc.error404")}</h1>
        <button
          onClick={() => navigate("/catalog")}
          className="mt-6 rounded-full bg-gold px-6 py-3 font-semibold text-primary-foreground"
        >
          {t("common.actions.back")} — {t("catalog.title")}
        </button>
      </section>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <div className="glass aspect-[3/4] animate-pulse rounded-[1.75rem]" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
          <div className="h-5 w-1/3 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-2xl bg-muted" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    )
  }

  const occasion = OCCASIONS.find((o) => o.value === product.occasion)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Fil d'Ariane */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <button onClick={() => navigate("/")} className="hover:text-gold">
          {t("common.nav.home")}
        </button>
        <ChevronRight className="h-3 w-3 rtl:rotate-180" />
        <button onClick={() => navigate("/catalog")} className="hover:text-gold">
          {t("catalog.title")}
        </button>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3 rtl:rotate-180" />
            <button
              onClick={() => navigate(`/catalog?category=${product.category!.slug}`)}
              className="hover:text-gold"
            >
              {L(product.category, "name")}
            </button>
          </>
        )}
        <ChevronRight className="h-3 w-3 rtl:rotate-180" />
        <span className="text-foreground" aria-current="page">
          {L(product, "title")}
        </span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Colonne visuelle */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <ProductGallery
            images={product.images}
            title={L(product, "title")}
            colorHex={tintHex}
            layoutId={`product-image-${product.id}`}
            priority
          />
        </div>

        {/* Colonne infos + configurateur */}
        <div>
          <motion.header
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            {occasion && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
                ✦ {lang === "ar" ? occasion.ar : occasion.fr}
              </span>
            )}
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
              {L(product, "title")}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <p className="font-semibold text-gold">
                <span className="mr-1 text-xs font-normal text-muted-foreground">
                  {t("common.misc.from")}
                </span>
                {formatDA(product.basePrice, lang)}
              </p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4 text-gold/70" />
                {t("product.leadTime", { days: product.leadTimeDays })}
              </p>
            </div>
            <p className="mt-4 leading-relaxed text-muted-foreground">{L(product, "description")}</p>
          </motion.header>

          <div className="mt-6">
            <BerberDivider variant="line" className="opacity-40" />
          </div>

          {/* Configurateur classique + bouton wizard */}
          <div className="mt-6 space-y-4">
            {/* Bouton pour ouvrir le wizard futuriste */}
            <button
              onClick={() => setShowWizard(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-strong py-4 font-display text-lg font-semibold text-primary-foreground shadow-lg shadow-gold/30 transition-transform hover:-translate-y-1 active:scale-98"
            >
              <Sparkles className="h-5 w-5" />
              {t("product.quickConfig")}
            </button>
            
            {/* Configurateur classique */}
            <Configurator product={product} onColorHexChange={setTintHex} />
          </div>

          {/* Wizard plein écran */}
          {showWizard && (
            <ConfiguratorWizard
              product={product}
              onClose={() => setShowWizard(false)}
              onColorHexChange={setTintHex}
            />
          )}
        </div>
      </div>

      {/* Produits liés */}
      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related-title">
          <div className="flex items-center justify-between gap-4">
            <h2 id="related-title" className="font-display text-2xl font-bold">
              {t("home.featured.title")}
            </h2>
            <button
              onClick={() => navigate("/catalog")}
              className="flex items-center gap-1.5 text-sm font-medium text-gold hover:underline"
            >
              {t("common.actions.seeAll")}
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
