// ============================================================
// GITHUB + jsDelivr + AMAZON AFFILIATE CONFIGURATION
// ============================================================
// 1) Put the `deals/` folder into your PUBLIC GitHub repository.
// 2) Change GITHUB_REPO to: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
// 3) Change  to your real .
//
// Example:
// window.GITHUB_REPO = 'mohaman9/lootdeals';
// window.GITHUB_REF = 'main';
// window.AMAZON_AFFILIATE_TAG = 'yourtag-21';
//
// IMPORTANT:
// The affiliate tag is intentionally visible in browser links. This is
// normal for Amazon Associates links. Never put GitHub passwords or PATs here.

window.GITHUB_REPO = 'mohaman9/lootdeals';
window.GITHUB_REF = 'main';

// Put your REAL Amazon Associates tag here.
// Example format for India is often: yourtag-21
window.AMAZON_AFFILIATE_TAG = 'YOURTAG-21';

// jsDelivr URL. Public GitHub repo required.
window.DEAL_CDN_BASE =
  `https://cdn.jsdelivr.net/gh/${window.GITHUB_REPO}@${window.GITHUB_REF}/deals/`;

window.DEAL_CONFIG = {
  pageSize: 24,
  preloadChunks: 1,
  maxSearchResults: 250,
  affiliateParam: 'tag'
};
