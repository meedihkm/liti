"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// SmartImage : next/image + fond flou qui s'estompe au chargement
// (placeholder blur léger, sans LCP pénalisé). fill + ratio géré
// par le conteneur parent pour éviter tout CLS.
// ─────────────────────────────────────────────────────────────

interface SmartImageProps {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  priority?: boolean
  sizes?: string
  quality?: number
}

export function SmartImage({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  quality = 82,
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={cn("relative overflow-hidden bg-muted/40", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        onLoad={() => setLoaded(true)}
        className={cn(
          "object-cover transition-opacity duration-700",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName
        )}
      />
      {/* Placeholder flou pendant le chargement */}
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/60 to-muted"
          aria-hidden="true"
        />
      )}
    </div>
  )
}
