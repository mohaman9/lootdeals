# Amazon Deals — GitHub + jsDelivr + Affiliate Links

This package contains the 5,471 product records from the supplied Excel file.
The records are split into 55 JSON chunks (100 records per chunk) plus `manifest.json`.

## 1. What the architecture does

Visitor -> your website HTML/JS -> jsDelivr CDN -> public GitHub repo

Your VPS does **not** serve the 5,471 JSON records.

The browser downloads the chunks directly from jsDelivr. jsDelivr supports GitHub URLs in the form:

    https://cdn.jsdelivr.net/gh/user/repo@version/file

It supports branches, releases, and exact commit hashes. For production, an exact commit/release is the most cache-stable choice. See the jsDelivr GitHub documentation.

## 2. Create a GitHub repository

Create a new **public** repository, for example:

    amazon-deals

Recommended repository structure:

    amazon-deals/
    └── deals/
        ├── 001.json
        ├── 002.json
        ├── ...
        ├── 055.json
        └── manifest.json

You only need to upload the `deals/` folder to GitHub. The website files (`index.html`, `styles.css`, `app.js`, `deal-loader.js`, `config.js`) remain on your normal website hosting.

## 3. Upload the deals folder

GitHub browser upload works for this package because each JSON file is well below GitHub's browser upload limit. GitHub allows up to 100 files in one browser upload, and this package has 56 JSON files in total (55 chunks + manifest).

Upload:

    deals/001.json
    deals/002.json
    ...
    deals/055.json
    deals/manifest.json

Commit to `main`.

## 4. Configure the website

Open `config.js` and change:

    window.GITHUB_REPO = 'YOUR_GITHUB_USERNAME/amazon-deals';

For example:

    window.GITHUB_REPO = 'irfans/amazon-deals';

Keep:

    window.GITHUB_REF = 'main';

The resulting CDN URL becomes:

    https://cdn.jsdelivr.net/gh/irfans/amazon-deals@main/deals/

## 5. Add your Amazon affiliate tag

In the same `config.js`, change:

    window.AMAZON_AFFILIATE_TAG = 'YOURTAG-21';

to your real Amazon Associates tracking tag, for example:

    window.AMAZON_AFFILIATE_TAG = 'mydeals-21';

**Do not invent a tag. Use the exact tag from your Amazon Associates account.**

The tag is intentionally visible in the final browser URL. That is normal for an Amazon affiliate link. Do not put Amazon account passwords or GitHub tokens in this file.

## 6. How affiliate URLs are generated

Your JSON can keep clean product URLs such as:

    https://www.amazon.in/dp/B0BWS9FY8K

The browser converts the product URL into:

    https://www.amazon.in/dp/B0BWS9FY8K?tag=YOURTAG-21

The code uses the ASIN when available, cleans the product URL to `/dp/ASIN`, removes existing query tracking, and sets the configured `tag` parameter.

The affiliate URL is applied to:

- product image click
- product title click
- Buy Now button

The image URL is **not** given the affiliate tag because it is an image asset, not the product landing link.

## 7. Test jsDelivr before putting the page live

After GitHub upload, open in a browser:

    https://cdn.jsdelivr.net/gh/YOUR_GITHUB_USERNAME/amazon-deals@main/deals/manifest.json

Then:

    https://cdn.jsdelivr.net/gh/YOUR_GITHUB_USERNAME/amazon-deals@main/deals/001.json

If JSON appears, the CDN path is working.

## 8. Upload the website files to your VPS

Upload:

    index.html
    styles.css
    app.js
    deal-loader.js
    config.js

Do **not** upload the 55 JSON files to the VPS web root if your goal is to keep product-data traffic off the VPS.

The browser will request JSON from jsDelivr instead.

## 9. Verify in browser

Open the page and press F12 -> Network -> Fetch/XHR.

You should see requests like:

    cdn.jsdelivr.net/gh/YOUR_GITHUB_USERNAME/amazon-deals@main/deals/manifest.json
    cdn.jsdelivr.net/gh/YOUR_GITHUB_USERNAME/amazon-deals@main/deals/001.json

You should not see product-data requests going back to your VPS.

Click a product and verify the final URL looks like:

    https://www.amazon.in/dp/B0BWS9FY8K?tag=YOURTAG-21

## 10. Updating the data

When you have a new Excel file, regenerate the `deals/` JSON files and replace the files in GitHub.

For the easiest ongoing cache management, use a new commit or release version in `GITHUB_REF` (for example `v2`) after each published dataset. jsDelivr supports branches, releases, and exact commit hashes.

For strict production reproducibility, an exact commit hash is best:

    window.GITHUB_REF = '32b00373b3f42e5cdcb709df53f3b08b7184a944';

Then change it to the new commit hash when publishing a new dataset.

## 11. Important GitHub limitation

Keep each file small. GitHub's documented maximum for an individual Git object is 100 MB (with a 1 MB recommended size), and browser uploads are limited to 25 MiB per file. The JSON chunks in this package are far below those limits.

## 12. Files in this package

    index.html
    styles.css
    config.js
    app.js
    deal-loader.js
    README_GITHUB_JSDELIVR.md
    deals/001.json ... deals/055.json
    deals/manifest.json

## 13. Security

The public JSON contains product/deal data only.

Never put these in the public repo or `config.js`:

- GitHub Personal Access Tokens
- Amazon account passwords
- server passwords
- private API keys
- database credentials

The Amazon Associates tracking tag is not a secret and is expected to appear in links.
