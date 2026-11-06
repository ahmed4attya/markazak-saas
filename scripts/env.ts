import fs from 'node:fs'
import path from 'node:path'

export function loadLocalEnv() {
  const file = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(file)) return

  const content = fs.readFileSync(file, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, raw] = match
    if (process.env[key] !== undefined) continue
    const value = raw.trim().replace(/^(['"])(.*)\1$/, '$2')
    process.env[key] = value
  }
}
