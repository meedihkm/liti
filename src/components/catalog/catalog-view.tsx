"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown, Loader2, SearchX } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePublicData } from "@/components/providers/public-data-provider";
import { useRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { ProductCard } from "./product-card";
import { BerberDivider } from "@/components/layout/berber-divider";
import { OCCASIONS } from "@/lib/constants";
import type { ProductListDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Catalogue — grille + filtres (catégorie, tissu, couleur, prix,
// occasion) + tri + chargement progressif. Mobile : filtres repliés
// dans une barre collante ; desktop : panneau latéral.
// ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 12

type SortKey = "newest" | "price-asc" | "price-desc" | "featured"

export function CatalogView() {
  const { t, lang, L } = useI18n()
  const { query, navigate } = useRouter()
  const { categories, fabrics, colors } = usePublicData()

  const [category, setCategory] = useState(query.get("category") ?? "")
  const [fabric, setFabric] = useState(query.get("fabric") ?? "")
  const [color, setColor] = useState(query.get("color") ?? "")
  const [occasion, setOccasion] = useState(query.get("occasion") ?? "")
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")
  const [sort, setSort] = useState<SortKey>("newest")

  const [page, setPage] = useState(1)
  const [data, setData] = useState<ProductListDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const firstLoad = useRef(true)

  const activeFilters =
    (category ? 1 : 0) + (fabric ? 1 : 0) + (color ? 1 : 0) + (occasion ? 1 : 0) +
    (priceMin ? 1 : 0) + (priceMax ? 1 : 0)

  const fetchProducts = useCallback(
    async (targetPage: number, append: boolean) => {
      const params = new URLSearchParams()
      if (category) params.set("category", category)
      if (fabric) params.set("fabric", fabric)
      if (color) params.set("color", color)
      if (occasion) params.set("occasion", occasion)
      if (priceMin) params.set("min", priceMin)
      if (priceMax) params.set("max", priceMax)
      params.set("sort", sort)
      params.set("page", String(targetPage))
      params.set("limit", String(PAGE_SIZE))
      try {
        const res = await api<ProductListDTO>(`/api/products?${params.toString()}`)
        setData((prev) =>
          append && prev ? { ...res, products: [...prev.products, ...res.products] } : res
        )
      } catch {
        if (!append) setData({ products: [], total: 0, page: 1, pages: 1 })
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [category, fabric, color, occasion, priceMin, priceMax, sort]
  )

  // (Re)chargement quand filtres/tri changent
  useEffect(() => {
    setPage(1)
    setLoading(true)
    fetchProducts(1, false)
    // Met à jour l'URL pour partager/filtrer depuis l'accueil
    if (!firstLoad.current) {
      const params = new URLSearchParams()
      if (category) params.set("category", category)
      if (fabric) params.set("fabric", fabric)
      if (color) params.set("color", color)
      if (occasion) params.set("occasion", occasion)
      const qs = params.toString()
      window.history.replaceState(null, "", `#/catalog${qs ? `?${qs}` : ""}`)
    }
    firstLoad.current = false
  }, [fetchProducts, category, fabric, color, occasion, sort])

  const loadMore = () => {
    if (!data || page >= data.pages) return
    setLoadingMore(true)
    const next = page + 1
    setPage(next)
    fetchProducts(next, true)
  }

  const clearAll = () => {
    setCategory("")
    setFabric("")
    setColor("")
    setOccasion("")
    setPriceMin("")
    setPriceMax("")
    setSort("newest")
  }

  const selectCls =
    "h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground transition-colors focus:border-gold/60"

  const filterPanel = (
    <div className="space-y-4">
      {/* Catégorie */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="f-cat">
          {t("catalog.filters.category")}
        </label>
        <select id="f-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
          <option value="">{t("catalog.filters.any")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {L(c, "name")}
            </option>
          ))}
        </select>
      </div>
      {/* Occasion */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="f-occ">
          {t("catalog.filters.occasion")}
        </label>
        <select id="f-occ" value={occasion} onChange={(e) => setOccasion(e.target.value)} className={selectCls}>
          <option value="">{t("catalog.filters.any")}</option>
          {OCCASIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {lang === "ar" ? o.ar : o.fr}
            </option>
          ))}
        </select>
      </div>
      {/* Tissu */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="f-fab">
          {t("catalog.filters.fabric")}
        </label>
        <select id="f-fab" value={fabric} onChange={(e) => setFabric(e.target.value)} className={selectCls}>
          <option value="">{t("catalog.filters.any")}</option>
          {fabrics.map((f) => (
            <option key={f.id} value={f.id}>
              {L(f, "name")}
            </option>
          ))}
        </select>
      </div>
      {/* Couleur */}
      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("catalog.filters.color")}
        </span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("catalog.filters.color")}>
          <button
            onClick={() => setColor("")}
            className={cn(
              "flex h-9 items-center rounded-full border px-3 text-xs transition-all",
              !color ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/40"
            )}
          >
            {t("catalog.filters.any")}
          </button>
          {colors.map((c) => (
            <button
              key={c.id}
              onClick={() => setColor(color === c.id ? "" : c.id)}
              title={L(c, "name")}
              aria-label={L(c, "name")}
              aria-pressed={color === c.id}
              className={cn(
                "h-9 w-9 rounded-full border-2 transition-all hover:scale-110",
                color === c.id ? "border-gold shadow-[0_0_0_3px_color-mix(in_oklab,var(--gold)_25%,transparent)]" : "border-border"
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>
      {/* Prix */}
      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("catalog.filters.price")} (DA)
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={t("catalog.filters.priceMin")}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value.replace(/\D/g, ""))}
            className={selectCls}
            aria-label={t("catalog.filters.priceMin")}
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={t("catalog.filters.priceMax")}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value.replace(/\D/g, ""))}
            className={selectCls}
            aria-label={t("catalog.filters.priceMax")}
          />
        </div>
      </div>
      {(activeFilters > 0 || sort !== "newest") && (
        <button
          onClick={clearAll}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium text-muted-foreground transition-colors hover:border-gold/50 hover:text-gold"
        >
          <X className="h-4 w-4" />
          {t("catalog.clearFilters")}
        </button>
      )}
    </div>
  )

  const products = data?.products ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="text-center"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">ⵣ</span>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{t("catalog.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("catalog.subtitle")}</p>
      </motion.div>

      <div className="mx-auto mt-6 max-w-md">
        <BerberDivider variant="zigzag" className="opacity-50" />
      </div>

      {/* Barre de contrôle : tri + filtres (mobile) */}
      <div className="sticky top-16 z-30 -mx-4 mt-6 bg-background/80 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="glass flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold sm:hidden"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("catalog.filters.title")}
            {activeFilters > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-bold text-primary-foreground">
                {activeFilters}
              </span>
            )}
            <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
          </button>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="hidden text-xs text-muted-foreground sm:block">
              {t("catalog.sort.label")} :
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm"
              aria-label={t("catalog.sort.label")}
            >
              <option value="newest">{t("catalog.sort.newest")}</option>
              <option value="price-asc">{t("catalog.sort.priceAsc")}</option>
              <option value="price-desc">{t("catalog.sort.priceDesc")}</option>
              <option value="featured">{t("catalog.sort.featured")}</option>
            </select>
          </div>
          {data && (
            <span className="ms-auto hidden whitespace-nowrap text-sm text-muted-foreground lg:block">
              {t("catalog.results", { count: data.total })}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Panneau filtres desktop */}
        <aside className="hidden lg:block" aria-label={t("catalog.filters.title")}>
          <div className="glass sticky top-36 rounded-2xl p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider">
              <SlidersHorizontal className="h-4 w-4 text-gold" />
              {t("catalog.filters.title")}
            </h2>
            {filterPanel}
          </div>
        </aside>

        {/* Filtres mobiles dépliés */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="glass rounded-2xl p-5 lg:hidden"
          >
            {filterPanel}
          </motion.div>
        )}

        {/* Grille produits */}
        <div>
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass aspect-[3/4] animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="glass flex flex-col items-center rounded-2xl px-6 py-20 text-center">
              <SearchX className="h-12 w-12 text-gold/50" aria-hidden="true" />
              <p className="mt-4 font-display text-lg font-semibold">{t("catalog.noResults")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("catalog.noResultsHint")}</p>
              <button
                onClick={clearAll}
                className="mt-6 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                {t("catalog.clearFilters")}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i % PAGE_SIZE} />
                ))}
              </div>
              {data && page < data.pages && (
                <div className="mt-10 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="glass glow-gold-hover inline-flex h-12 items-center gap-2 rounded-full px-8 font-semibold disabled:opacity-60"
                  >
                    {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("catalog.loadMore")}
                  </button>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("catalog.showing", { shown: products.length, total: data.total })}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
