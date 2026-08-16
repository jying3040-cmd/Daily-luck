import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { DATA_DIR, KEY_FILE } from './paths.js'

function loadOrCreateKey(): Buffer {
  mkdirSync(DATA_DIR, { recursive: true })
  if (existsSync(KEY_FILE)) {
    const key = Buffer.from(readFileSync(KEY_FILE, 'utf8').trim(), 'hex')
    if (key.length !== 32) throw new Error(`Invalid encryption key in ${KEY_FILE}`)
    return key
  }
  const key = randomBytes(32)
  writeFileSync(KEY_FILE, key.toString('hex'), { mode: 0o600 })
  return key
}

export interface EncryptedValue {
  value: string
  iv: string
}

export interface TextCipher {
  encrypt(plain: string): EncryptedValue
  decrypt(value: string, iv: string): string
}

export function createTextCipher(key: Buffer): TextCipher {
  if (key.length !== 32) throw new Error('AES-256-GCM requires a 32-byte key')
  return {
    encrypt(plain) {
      const iv = randomBytes(12)
      const cipher = createCipheriv('aes-256-gcm', key, iv)
      const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
      const tag = cipher.getAuthTag()
      return {
        value: `${encrypted.toString('base64')}.${tag.toString('base64')}`,
        iv: iv.toString('base64'),
      }
    },
    decrypt(value, iv) {
      const [data, tag] = value.split('.')
      if (!data || !tag || !iv) throw new Error('Invalid encrypted value')
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'))
      decipher.setAuthTag(Buffer.from(tag, 'base64'))
      return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8')
    },
  }
}

let defaultCipher: TextCipher | undefined

export function getDefaultCipher(): TextCipher {
  defaultCipher ??= createTextCipher(loadOrCreateKey())
  return defaultCipher
}
