import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

/** 当前模块所在目录（dev 时 server/src，build 后 server/dist） */
const here = dirname(fileURLToPath(import.meta.url))
const serverDir = dirname(here)

/** 项目资源根目录（server 的上一级），用于定位静态前端资源。 */
export const PROJECT_ROOT = join(serverDir, '..')

/** Packaged Windows builds keep writable profile data outside the executable snapshot. */
const isPackaged = Boolean((process as NodeJS.Process & { pkg?: unknown }).pkg)
const appDataRoot = process.env.LOCALAPPDATA ?? homedir()

export const DATA_DIR = isPackaged
  ? join(appDataRoot, 'DailyLuck', 'data')
  : join(PROJECT_ROOT, 'data')
export const DB_FILE = join(DATA_DIR, 'fortune.db')
export const KEY_FILE = join(DATA_DIR, 'secret.key')
export const FRONTEND_DIST = join(PROJECT_ROOT, 'frontend', 'dist')
