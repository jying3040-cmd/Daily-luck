import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { TextCipher } from './crypto.js'
import type { Profile, Report } from './fortune.js'

/** 数据库层：建表迁移、档案读写、运势缓存。SQL 集中在这里，路由层不直接接触。 */

interface ProfileRow {
  name_enc: string
  iv_name: string
  birth_date: string
  birth_time: string
  gender: Profile['gender']
  blood_type: Profile['bloodType']
  phone_tail_enc: string
  iv_phone: string
}

function initializeDatabase(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_reports (
      date TEXT NOT NULL,
      jitter INTEGER NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (date, jitter)
    );
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name_enc TEXT NOT NULL,
      iv_name TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      birth_time TEXT NOT NULL DEFAULT '',
      gender TEXT NOT NULL DEFAULT 'unknown',
      blood_type TEXT NOT NULL DEFAULT '',
      phone_tail_enc TEXT NOT NULL DEFAULT '',
      iv_phone TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const primaryKey = db
    .prepare('PRAGMA table_info(daily_reports)')
    .all()
    .map((column) => column as { name: string; pk: number })
    .filter((column) => column.pk > 0)
    .sort((a, b) => a.pk - b.pk)
    .map((column) => column.name)

  if (primaryKey.join(',') === 'date,jitter') return

  db.exec(`
    BEGIN;
    ALTER TABLE daily_reports RENAME TO daily_reports_legacy;
    CREATE TABLE daily_reports (
      date TEXT NOT NULL,
      jitter INTEGER NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (date, jitter)
    );
    INSERT OR REPLACE INTO daily_reports (date, jitter, payload, created_at)
      SELECT date, jitter, payload, created_at FROM daily_reports_legacy;
    DROP TABLE daily_reports_legacy;
    COMMIT;
  `)
}

/** 打开数据库并确保表结构与迁移到位；`:memory:` 之外的路径会自动建目录。 */
export function openDatabase(databaseFile: string): DatabaseSync {
  if (databaseFile !== ':memory:') mkdirSync(dirname(databaseFile), { recursive: true })
  const db = new DatabaseSync(databaseFile)
  initializeDatabase(db)
  return db
}

export interface ProfileStore {
  load(): Profile | null
  save(profile: Profile): void
}

/** 档案仓库：姓名与手机尾号加密落库；保存后清空运势缓存。 */
export function openProfileStore(db: DatabaseSync, textCipher: TextCipher): ProfileStore {
  const select = db.prepare('SELECT * FROM profile WHERE id = 1')
  const upsert = db.prepare(`
    INSERT INTO profile (
      id, name_enc, iv_name, birth_date, birth_time, gender, blood_type, phone_tail_enc, iv_phone, updated_at
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name_enc = excluded.name_enc,
      iv_name = excluded.iv_name,
      birth_date = excluded.birth_date,
      birth_time = excluded.birth_time,
      gender = excluded.gender,
      blood_type = excluded.blood_type,
      phone_tail_enc = excluded.phone_tail_enc,
      iv_phone = excluded.iv_phone,
      updated_at = excluded.updated_at
  `)

  return {
    load(): Profile | null {
      const row = select.get() as ProfileRow | undefined
      if (!row) return null
      return {
        name: textCipher.decrypt(row.name_enc, row.iv_name),
        birthDate: row.birth_date,
        birthTime: row.birth_time,
        gender: row.gender,
        bloodType: row.blood_type,
        phoneTail: textCipher.decrypt(row.phone_tail_enc, row.iv_phone),
      }
    },
    save(profile: Profile): void {
      const encryptedName = textCipher.encrypt(profile.name)
      const encryptedPhone = textCipher.encrypt(profile.phoneTail)
      upsert.run(
        encryptedName.value,
        encryptedName.iv,
        profile.birthDate,
        profile.birthTime,
        profile.gender,
        profile.bloodType,
        encryptedPhone.value,
        encryptedPhone.iv,
      )
      db.exec('DELETE FROM daily_reports')
    },
  }
}

export interface ReportCache {
  get(date: string, jitter: boolean): Report | undefined
  put(date: string, jitter: boolean, report: Report): void
}

/** 运势缓存：按 (日期, 是否扰动) 键控的读写。 */
export function openReportCache(db: DatabaseSync): ReportCache {
  const select = db.prepare('SELECT payload FROM daily_reports WHERE date = ? AND jitter = ?')
  const upsert = db.prepare(`
    INSERT INTO daily_reports (date, jitter, payload) VALUES (?, ?, ?)
    ON CONFLICT(date, jitter) DO UPDATE SET payload = excluded.payload
  `)

  return {
    get(date: string, jitter: boolean): Report | undefined {
      const row = select.get(date, jitter ? 1 : 0) as { payload: string } | undefined
      return row ? (JSON.parse(row.payload) as Report) : undefined
    },
    put(date: string, jitter: boolean, report: Report): void {
      upsert.run(date, jitter ? 1 : 0, JSON.stringify(report))
    },
  }
}
