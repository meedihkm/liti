// ─────────────────────────────────────────────────────────────
// Abstraction stockage des images uploadées.
// V1 : stockage local (public/uploads). L'interface StorageDriver
// permet de brancher S3/R2 sans toucher au reste du code.
// Sécurité : MIME whitelist, taille max, renommage systématique.
// ─────────────────────────────────────────────────────────────
import { randomBytes } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")
const MAX_SIZE = 5 * 1024 * 1024 // 5 Mo
const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
])

export interface StoredFile {
  url: string // chemin public servi par next/image
  filename: string
  bytes: number
}

export interface StorageDriver {
  save(file: File): Promise<StoredFile>
}

class LocalStorageDriver implements StorageDriver {
  async save(file: File): Promise<StoredFile> {
    const ext = ALLOWED.get(file.type)
    if (!ext) throw new Error("Type de fichier non autorisé (jpg, png, webp, avif)")
    if (file.size > MAX_SIZE) throw new Error("Fichier trop volumineux (max 5 Mo)")
    await mkdir(UPLOAD_DIR, { recursive: true })
    const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(UPLOAD_DIR, filename), buffer)
    return { url: `/uploads/${filename}`, filename, bytes: file.size }
  }
}

let driver: StorageDriver = new LocalStorageDriver()

/** Permet de remplacer le driver (ex : S3Driver en production) */
export function setStorageDriver(d: StorageDriver) {
  driver = d
}

export function getStorage(): StorageDriver {
  return driver
}
