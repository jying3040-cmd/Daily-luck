import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/** 当前模块所在目录（dev 时 server/src，build 后 server/dist） */
const here = dirname(fileURLToPath(import.meta.url))
const serverDir = dirname(here)

/** 项目根目录（server 的上一级），数据统一放根目录 data/ 下 */
export const PROJECT_ROOT = join(serverDir, '..')

export const DATA_DIR = join(PROJECT_ROOT, 'data')
export const DB_FILE = join(DATA_DIR, 'fortune.db')
export const KEY_FILE = join(DATA_DIR, 'secret.key')
export const FRONTEND_DIST = join(PROJECT_ROOT, 'frontend', 'dist')
