const state = {
  manifest: null,
  nextSL: 1,
  loaded: [],
  loading: false,
  allLoaded: false,
  allRecords: null,
  searchTimer: null,
  pageSize: Number(window.DEAL_CONFIG?.pageSize || 24),
};

const grid = document.getElementById('grid');
const sentinel = document.getElementById('sentinel');
const count = document.getElementById('count');
const search = document.getElementById('search');
const category = document.getElementById('category');
const loadAllBtn = document.getElementById('loadAll');
const tpl = document.getElementById('card-template');

const money = value => {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

const pct = value => {
  const n = Number(value || 0);
  return `${Math.round(n <= 1 ? n * 100 : n)}% OFF`;
};

function cleanText(value) {
  return String(value || '')
    .replace(/Â°/g, '°')
    .replace(/Â®/g, '®')
    .replace(/Â©/g, '©')
    .replace(/Â/g, '');
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(String(value).slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function imageFor(row) {
  if (row.image_url) return row.image_url;
  if (row.asin) return `https://images.amazon.com/images/P/${encodeURIComponent(row.asin)}.01_SL110_.jpg`;
  return '';
}

function isAmazonProductUrl(value) {
  try {
    const u = new URL(value, window.location.href);
    const hostOk = /^([a-z0-9-]+\.)*amazon\./i.test(u.hostname);
    const pathOk = /\/(dp|gp\/product|gp\/aw\/d)\//i.test(u.pathname);
    return hostOk && pathOk;
  } catch {
    return false;
  }
}

function affiliateUrlFor(row) {
  const raw = String(row['Landing Page'] || '').trim();
  if (!raw) return '#';

  const tag = String(window.AMAZON_AFFILIATE_TAG || '').trim();
  if (!tag || !isAmazonProductUrl(raw)) return raw;

  try {
    const u = new URL(raw);

    // Prefer a clean /dp/ASIN URL when ASIN is known. This removes
    // unwanted tracking parameters while retaining the Amazon domain.
    if (row.asin) {
      const asin = String(row.asin).trim().toUpperCase();
      if (/^[A-Z0-9]{10}$/.test(asin)) {
        u.pathname = `/dp/${asin}`;
        u.search = '';
        u.hash = '';
      }
    }

    u.searchParams.set(
      window.DEAL_CONFIG?.affiliateParam || 'tag',
      tag
    );

    return u.toString();
  } catch {
    return raw;
  }
}

function productCard(row) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  const url = affiliateUrlFor(row);
  const img = imageFor(row);
  const title = cleanText(row['Product Name']);

  node.querySelector('.discount').textContent = pct(row.Discount);

  const imageLink = node.querySelector('.image-box');
  imageLink.href = url;
  const image = node.querySelector('img');
  if (img) {
    image.src = img;
  } else {
    image.removeAttribute('src');
  }
  image.alt = title;
  image.onerror = () => {
    image.removeAttribute('src');
    image.classList.add('failed');
    image.alt = 'Image unavailable';
  };

  const titleLink = node.querySelector('.title');
  titleLink.href = url;
  titleLink.textContent = title;
  node.querySelector('.mrp').textContent = money(row['List Price']);
  node.querySelector('.deal').textContent = money(row['Deal Price']);

  const start = formatDate(row['Start Date']);
  const end = formatDate(row['End Date']);
  node.querySelector('.validity').textContent =
    start && end ? `Valid: ${start} – ${end}` : (start ? `Valid from ${start}` : '');

  const buy = node.querySelector('.buy');
  buy.href = url;
  if (url === '#') buy.setAttribute('aria-disabled', 'true');

  return node;
}

function appendRows(rows) {
  const frag = document.createDocumentFragment();
  for (const row of rows) frag.appendChild(productCard(row));
  grid.appendChild(frag);
}

function refreshCount(visibleCount = state.loaded.length) {
  if (state.manifest) {
    count.textContent = `${visibleCount.toLocaleString('en-IN')} deals shown · ${state.manifest.total_records.toLocaleString('en-IN')} total`;
  }
}

function populateCategories() {
  const categories = Array.isArray(state.manifest?.categories)
    ? state.manifest.categories
    : [];
  for (const name of categories) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    category.appendChild(option);
  }
}

async function loadNextPage() {
  if (state.loading || state.allLoaded || state.allRecords) return;
  state.loading = true;
  sentinel.textContent = 'Loading…';
  try {
    const start = state.nextSL;
    const end = Math.min(start + state.pageSize - 1, state.manifest.total_records);
    const rows = await getDealsRange(start, end);
    appendRows(rows);
    state.loaded.push(...rows);
    state.nextSL = end + 1;
    if (state.nextSL > state.manifest.total_records) state.allLoaded = true;
    refreshCount();
    sentinel.textContent = state.allLoaded ? 'All deals loaded' : 'Scroll for more';
  } catch (err) {
    sentinel.textContent = `Unable to load data: ${err.message}`;
  } finally {
    state.loading = false;
  }
}

async function loadAll() {
  if (state.allRecords) return state.allRecords;
  loadAllBtn.disabled = true;
  loadAllBtn.textContent = 'Loading…';
  try {
    state.allRecords = await getDealsRange(1, state.manifest.total_records);
    state.allLoaded = true;
    loadAllBtn.textContent = 'All loaded';
    return state.allRecords;
  } catch (error) {
    loadAllBtn.disabled = false;
    loadAllBtn.textContent = 'Load all';
    throw error;
  }
}

function renderFiltered(rows) {
  grid.replaceChildren();
  const limit = Number(window.DEAL_CONFIG?.maxSearchResults || 250);
  appendRows(rows.slice(0, limit));
  count.textContent = `${Math.min(rows.length, limit).toLocaleString('en-IN')} matching deals`;
  sentinel.textContent = rows.length > limit ? `Showing first ${limit} matches` : 'No more matches';
}

async function applyFilters() {
  const q = search.value.trim().toLowerCase();
  const cat = category.value;

  if (!q && !cat) {
    grid.replaceChildren();
    state.loaded = [];
    state.nextSL = 1;
    state.allLoaded = false;
    refreshCount(0);
    return loadNextPage();
  }

  sentinel.textContent = 'Searching CDN data…';
  try {
    const rows = await loadAll();
    const filtered = rows.filter(row => {
      const haystack = [row['Product Name'], row['Category Name'], row.asin, row['GL/PL'], row['Key Callout']]
        .join(' ')
        .toLowerCase();
      return (!q || haystack.includes(q)) && (!cat || row['Category Name'] === cat);
    });
    renderFiltered(filtered);
  } catch (error) {
    sentinel.textContent = `Search failed: ${error.message}`;
  }
}

async function init() {
  state.manifest = await fetchManifest();
  populateCategories();
  await loadNextPage();

  const observer = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) loadNextPage();
  }, { rootMargin: '900px 0px' });
  observer.observe(sentinel);
}

search.addEventListener('input', () => {
  clearTimeout(state.searchTimer);
  state.searchTimer = setTimeout(applyFilters, 250);
});
category.addEventListener('change', applyFilters);
loadAllBtn.addEventListener('click', async () => {
  try {
    const rows = await loadAll();
    if (!search.value && !category.value) {
      grid.replaceChildren();
      appendRows(rows);
      count.textContent = `${rows.length.toLocaleString('en-IN')} deals shown`;
      sentinel.textContent = 'All deals loaded';
    } else {
      await applyFilters();
    }
  } catch (error) {
    sentinel.textContent = `Unable to load data: ${error.message}`;
  }
});

init().catch(err => {
  grid.innerHTML = `<div class="error">Could not load deals: ${String(err.message).replace(/[<>]/g, '')}</div>`;
  sentinel.textContent = '';
});
