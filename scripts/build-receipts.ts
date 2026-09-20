/**
 * Build-time ETL for "Receipts of a Life — The Signal Room".
 *
 * VERIFIED AGAINST THE PROVIDED FILES (2026-09-20):
 * - Spotify: spotify_history.csv
 *   Header: spotify_track_uri, ts, platform, ms_played, track_name,
 *   artist_name, album_name, reason_start, reason_end, shuffle, skipped
 *   Encoding: UTF-8 (BOM on the first header); timestamp is
 *   YYYY-MM-DD HH:mm:ss and the data dictionary describes ts as UTC.
 * - Household: Daily Household Transactions.csv
 *   Header: Date, Mode, Category, Subcategory, Note, Amount,
 *   Income/Expense, Currency
 *   Encoding: UTF-8; Date is mixed D/M/YYYY with optional HH:mm:ss.
 * - Card: Augmented_IndiaTransactMultiFacet2024.csv
 *   Header: trans_id, trans_date_trans_time, cc_num, merchant, category,
 *   amt, first, last, gender, street, city, state, lat, long, city_pop,
 *   job, dob, merch_lat, merch_long, is_fraud, customer_id
 *   Encoding: UTF-8; timestamp is M/D/YYYY H:mm.
 *
 * IMPORTANT MAPPING ADJUSTMENTS:
 * - Do not use the old seeded arrays. They were synthetic and did not match
 *   the provided source files.
 * - Spotify `skipped` / `shuffle` are string booleans, not booleans.
 * - Household uses `Income/Expense`, and also contains `Transfer-Out`.
 *   Transfer-Out is normalized to expense for the Receipt union.
 * - Card has a 21-column schema; the previous 5-field null-density shortcut
 *   is not source-grounded. We calculate null density from selected
 *   identity/context fields actually present in the file.
 *
 * Output: /data/receipts.json (240 deterministic, curated receipts).
 * Raw sources live in /data/raw and never ship to the client.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

type Receipt =
  | MusicReceipt
  | LedgerReceipt
  | CardReceipt;

interface BaseReceipt {
  id: string;
  timestamp: string;
  confidence: number;
}

interface MusicReceipt extends BaseReceipt {
  type: 'music';
  title: string;
  artist: string;
  album: string;
  playedMs: number;
  skipped: boolean;
  shuffle: boolean;
  source: 'spotify';
  lateNight: boolean;
}

interface LedgerReceipt extends BaseReceipt {
  type: 'ledger';
  note: string;
  category: string;
  subcategory: string;
  amount: number;
  direction: 'income' | 'expense';
  source: 'household';
}

interface CardReceipt extends BaseReceipt {
  type: 'card';
  merchant: string | null;
  category: string | null;
  amount: number;
  city: string | null;
  isFraud: boolean;
  nullFieldCount: number;
  source: 'transactions';
}

const ROOT = process.cwd();
const RAW = path.join(ROOT, 'data', 'raw');
const OUTPUT = path.join(ROOT, 'data', 'receipts.json');

const SOURCES = {
  spotify: path.join(RAW, 'spotify_history.csv'),
  ledger: path.join(RAW, 'Daily Household Transactions.csv'),
  card: path.join(RAW, 'Augmented_IndiaTransactMultiFacet2024.csv'),
};

function requireFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing source file: ${filePath}`);
  }
}

function clean(value: string | undefined): string {
  return (value ?? '').trim();
}

function nullable(value: string | undefined): string | null {
  const v = clean(value);
  return v === '' ? null : v;
}

function parseBoolean(value: string | undefined): boolean {
  return clean(value).toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, fallback = 0): number {
  const v = clean(value);
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseSpotifyTimestamp(value: string): string {
  const v = clean(value);
  const match = v.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) throw new Error(`Invalid Spotify timestamp: ${value}`);
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`;
}

function parseLedgerTimestamp(value: string): string {
  const v = clean(value);
  const match = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) throw new Error(`Invalid household date: ${value}`);

  const [, day, month, year, hour = '00', minute = '00', second = '00'] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:${second}Z`;
}

function parseCardTimestamp(value: string): string {
  const v = clean(value);
  const match = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error(`Invalid card timestamp: ${value}`);

  const [, month, day, year, hour, minute] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:00Z`;
}

/**
 * Small CSV parser for these three files. It handles quoted commas and
 * doubled quotes without pulling a runtime CSV dependency into the app.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function readCsv(filePath: string): Record<string, string>[] {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const rows = parseCsv(text);
  const headers = rows[0].map((h) => h.trim().replace(/^\uFEFF/, ''));
  return rows.slice(1).map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    return row;
  });
}

function assertHeaders(filePath: string, actual: string[], expected: string[]): void {
  const missing = expected.filter((header) => !actual.includes(header));
  if (missing.length) {
    throw new Error(
      `Schema mismatch in ${path.basename(filePath)}. Missing: ${missing.join(', ')}`
    );
  }
}

function readAndVerifySources(): {
  music: Record<string, string>[];
  ledger: Record<string, string>[];
  card: Record<string, string>[];
} {
  Object.values(SOURCES).forEach(requireFile);

  const music = readCsv(SOURCES.spotify);
  const ledger = readCsv(SOURCES.ledger);
  const card = readCsv(SOURCES.card);

  assertHeaders(SOURCES.spotify, Object.keys(music[0] ?? {}), [
    'spotify_track_uri', 'ts', 'platform', 'ms_played', 'track_name',
    'artist_name', 'album_name', 'reason_start', 'reason_end', 'shuffle', 'skipped',
  ]);

  assertHeaders(SOURCES.ledger, Object.keys(ledger[0] ?? {}), [
    'Date', 'Mode', 'Category', 'Subcategory', 'Note', 'Amount',
    'Income/Expense', 'Currency',
  ]);

  assertHeaders(SOURCES.card, Object.keys(card[0] ?? {}), [
    'trans_id', 'trans_date_trans_time', 'cc_num', 'merchant', 'category',
    'amt', 'first', 'last', 'gender', 'street', 'city', 'state', 'lat',
    'long', 'city_pop', 'job', 'dob', 'merch_lat', 'merch_long', 'is_fraud',
    'customer_id',
  ]);

  console.log('SOURCE CHECK');
  console.log(`  Spotify: ${music.length.toLocaleString()} rows`);
  console.log(`  Household: ${ledger.length.toLocaleString()} rows`);
  console.log(`  Card: ${card.length.toLocaleString()} rows`);
  console.log('  Headers: verified against the provided files.');
  console.log('  Date formats: Spotify UTC; Household D/M/YYYY; Card M/D/YYYY.');

  return { music, ledger, card };
}

function sampleEvenly<T>(rows: T[], count: number): T[] {
  if (rows.length <= count) return [...rows];
  const selected: T[] = [];
  const step = (rows.length - 1) / (count - 1);

  for (let i = 0; i < count; i += 1) {
    selected.push(rows[Math.round(i * step)]);
  }
  return selected;
}

function buildMusic(rows: Record<string, string>[]): MusicReceipt[] {
  const valid = rows
    .filter((r) => clean(r.ts) && clean(r.track_name))
    .sort((a, b) => parseSpotifyTimestamp(a.ts).localeCompare(parseSpotifyTimestamp(b.ts)));

  const skipped = valid.filter((r) => parseBoolean(r.skipped));
  const engaged = valid.filter((r) => !parseBoolean(r.skipped));

  const chosen = [
    ...sampleEvenly(engaged, 60),
    ...sampleEvenly(skipped, 20),
  ].sort((a, b) => parseSpotifyTimestamp(a.ts).localeCompare(parseSpotifyTimestamp(b.ts)));

  return chosen.map((r, index) => {
    const timestamp = parseSpotifyTimestamp(r.ts);
    const hour = Number(timestamp.slice(11, 13));
    const wasSkipped = parseBoolean(r.skipped);

    return {
      id: `mus-${String(index + 1).padStart(3, '0')}`,
      type: 'music',
      timestamp,
      title: clean(r.track_name) || 'Untitled track',
      artist: clean(r.artist_name) || 'Unknown artist',
      album: clean(r.album_name) || 'Unknown album',
      playedMs: Math.max(0, parseNumber(r.ms_played)),
      skipped: wasSkipped,
      shuffle: parseBoolean(r.shuffle),
      confidence: wasSkipped ? 0.5 : 1,
      source: 'spotify',
      lateNight: hour >= 22 || hour <= 4,
    };
  });
}

function buildLedger(rows: Record<string, string>[]): LedgerReceipt[] {
  const valid = rows
    .filter((r) => clean(r.Date) && clean(r.Note))
    .sort((a, b) => parseLedgerTimestamp(a.Date).localeCompare(parseLedgerTimestamp(b.Date)));

  const income = valid.filter((r) => clean(r['Income/Expense']).toLowerCase() === 'income');
  const nonIncome = valid.filter((r) => clean(r['Income/Expense']).toLowerCase() !== 'income');

  const chosen = [
    ...sampleEvenly(nonIncome, 60),
    ...sampleEvenly(income, 20),
  ].sort((a, b) => parseLedgerTimestamp(a.Date).localeCompare(parseLedgerTimestamp(b.Date)));

  return chosen.map((r, index) => {
    const direction = clean(r['Income/Expense']).toLowerCase() === 'income' ? 'income' : 'expense';

    return {
      id: `led-${String(index + 1).padStart(3, '0')}`,
      type: 'ledger',
      timestamp: parseLedgerTimestamp(r.Date),
      note: clean(r.Note),
      category: clean(r.Category) || 'Uncategorized',
      subcategory: clean(r.Subcategory) || 'Unspecified',
      amount: Math.abs(parseNumber(r.Amount)),
      direction,
      confidence: 1,
      source: 'household',
    };
  });
}

function buildCard(rows: Record<string, string>[]): CardReceipt[] {
  const valid = rows
    .filter((r) => clean(r.trans_date_trans_time))
    .sort((a, b) => parseCardTimestamp(a.trans_date_trans_time).localeCompare(parseCardTimestamp(b.trans_date_trans_time)));

  const fraud = valid.filter((r) => ['1', '1.0', 'true'].includes(clean(r.is_fraud).toLowerCase()));
  const nonFraud = valid.filter((r) => clean(r.is_fraud).toLowerCase() === '0' || clean(r.is_fraud) === '0.0');
  const unknown = valid.filter((r) => !clean(r.is_fraud));

  const chosen = [
    ...sampleEvenly(nonFraud, 50),
    ...sampleEvenly(fraud, 20),
    ...sampleEvenly(unknown, 10),
  ].sort((a, b) => parseCardTimestamp(a.trans_date_trans_time).localeCompare(parseCardTimestamp(b.trans_date_trans_time)));

  return chosen.map((r, index) => {
    // Null density is based on actual source context fields, not a made-up
    // five-field mapping: merchant, category, city, job, customer_id.
    const contextFields = ['merchant', 'category', 'city', 'job', 'customer_id'];
    const nullFieldCount = contextFields.filter((key) => !clean(r[key])).length;
    const isFraud = ['1', '1.0', 'true'].includes(clean(r.is_fraud).toLowerCase());

    const confidence = isFraud
      ? 0.2
      : Math.max(0.1, Number((1 - nullFieldCount / contextFields.length).toFixed(2)));

    return {
      id: `crd-${String(index + 1).padStart(3, '0')}`,
      type: 'card',
      timestamp: parseCardTimestamp(r.trans_date_trans_time),
      merchant: nullable(r.merchant),
      category: nullable(r.category),
      amount: Math.abs(parseNumber(r.amt)),
      city: nullable(r.city),
      isFraud,
      nullFieldCount,
      confidence,
      source: 'transactions',
    };
  });
}

function buildReceipts(): Receipt[] {
  const { music, ledger, card } = readAndVerifySources();
  const receipts = [
    ...buildMusic(music),
    ...buildLedger(ledger),
    ...buildCard(card),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  if (receipts.length < 150 || receipts.length > 300) {
    throw new Error(`Curation gate failed: ${receipts.length} receipts.`);
  }

  const counts = receipts.reduce<Record<string, number>>((acc, receipt) => {
    acc[receipt.type] = (acc[receipt.type] ?? 0) + 1;
    return acc;
  }, {});

  if (counts.music !== 80 || counts.ledger !== 80 || counts.card !== 80) {
    throw new Error(`Source-balance gate failed: ${JSON.stringify(counts)}`);
  }

  return receipts;
}

const receipts = buildReceipts();
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(receipts, null, 2)}\n`, 'utf8');

console.log(`BUILD OK: ${receipts.length} receipts → ${OUTPUT}`);
console.log('  Music: 80 | Ledger: 80 | Card: 80');
console.log('  Runtime client payload contains only receipts.json; raw files stay build-time only.');
