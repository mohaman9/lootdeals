// ============================================================
// GitHub + jsDelivr CDN DATA LOADER
// ============================================================
const DEAL_CHUNK_SIZE = 100;
const dealChunkCache = new Map();

function getCdnBase() {
  const base = String(window.DEAL_CDN_BASE || '').trim();
  if (!base || base.includes('YOUR_GITHUB_USERNAME')) {
    throw new Error('Set GITHUB_REPO in config.js to your public GitHub repo.');
  }
  return base.replace(/\/+$/, '') + '/';
}

function getChunkUrl(chunkNo) {
  return `${getCdnBase()}${String(chunkNo).padStart(3, '0')}.json`;
}

function chunkNumberForSL(sl) {
  return Math.floor((Number(sl) - 1) / DEAL_CHUNK_SIZE) + 1;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    cache: 'force-cache'
  });
  if (!response.ok) throw new Error(`CDN request failed: ${response.status}`);
  return response.json();
}

async function fetchManifest() {
  return fetchJson(`${getCdnBase()}manifest.json`);
}

async function fetchChunk(chunkNo) {
  if (dealChunkCache.has(chunkNo)) return dealChunkCache.get(chunkNo);
  const promise = fetchJson(getChunkUrl(chunkNo));
  dealChunkCache.set(chunkNo, promise);
  try {
    const records = await promise;
    dealChunkCache.set(chunkNo, Promise.resolve(records));
    return records;
  } catch (error) {
    dealChunkCache.delete(chunkNo);
    throw error;
  }
}

async function getDeal(sl) {
  sl = Number(sl);
  if (!Number.isInteger(sl) || sl < 1) throw new Error('Invalid SL number');
  const records = await fetchChunk(chunkNumberForSL(sl));
  return records.find(row => Number(row.sl) === sl) || null;
}

async function getDealsRange(startSL, endSL) {
  startSL = Number(startSL);
  endSL = Number(endSL);
  const first = chunkNumberForSL(startSL);
  const last = chunkNumberForSL(endSL);
  const chunkNumbers = [];
  for (let n = first; n <= last; n++) chunkNumbers.push(n);

  // Small concurrency keeps initial rendering fast without hammering the edge.
  const concurrency = 6;
  const result = [];
  for (let i = 0; i < chunkNumbers.length; i += concurrency) {
    const batch = chunkNumbers.slice(i, i + concurrency);
    const chunks = await Promise.all(batch.map(fetchChunk));
    for (const records of chunks) {
      for (const row of records) {
        const sl = Number(row.sl);
        if (sl >= startSL && sl <= endSL) result.push(row);
      }
    }
  }
  result.sort((a, b) => Number(a.sl) - Number(b.sl));
  return result;
}
