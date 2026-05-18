require('dotenv').config();
const assert = require('node:assert/strict');
const { before, after, describe, it } = require('mocha');
const { By, until } = require('selenium-webdriver');
const getDriver = require('../utils/webdriver');

describe('Navigasi di Web IoT - Kalimantan Station 1', function () {
  this.timeout(40000); // Increased overall timeout for the describe block
  let driver;
  const stationUrl = process.env.BASE_URL + '/kalimantan/station1';
  const downloadPageUrl = process.env.BASE_URL + '/kalimantan/download';

  before(async () => {
    console.log(`[Navigation Test] Attempting to initialize driver and navigate to: ${stationUrl}`);
    driver = await getDriver();
    await driver.get(stationUrl);
    
    console.log(`[Navigation Test] Waiting for main title on initial load: "Environment Status Station 1"`);
    try {
      await driver.wait(
        until.elementLocated(By.xpath("//h1[contains(text(),'Environment Status Station 1')]")),
        20000, // Timeout for initial page load check
        "Judul utama 'Environment Status Station 1' tidak ditemukan pada setup awal navigasi."
      );
      console.log("[Navigation Test] Main title found on initial load.");
    } catch (error) {
      console.error("[Navigation Test] Error in 'before' hook while waiting for H1 title:", error.message);
      const currentUrl = await driver.getCurrentUrl();
      console.error(`[Navigation Test] Current URL at time of error: ${currentUrl}`);
      throw error;
    }
  });

  after(async () => {
    if (driver) {
      console.log("[Navigation Test] Quitting driver.");
      await driver.quit();
    }
  });

  it('Klik logo atau judul kembali ke dashboard utama station 1', async () => {
    console.log("[Navigation Test] Test: Klik logo atau judul kembali ke dashboard utama station 1 - START");
    
    console.log("[Navigation Test] Finding logo link...");
    const logoLink = await driver.wait(
      until.elementLocated(By.xpath("//header//a[.//img[@alt='logo'] and .//span[contains(text(),'IOT Dashboard')]]")),
      15000, // Increased timeout for finding logo
      "Logo/Brand link tidak ditemukan"
    );
    console.log("[Navigation Test] Logo link found. Clicking logo link...");
    await logoLink.click();
    console.log("[Navigation Test] Logo link clicked. Waiting for URL to be station URL...");

    await driver.wait(until.urlIs(stationUrl), 15000, `URL tidak kembali ke ${stationUrl} setelah klik logo.`); // Increased timeout
    const currentUrl = await driver.getCurrentUrl();
    console.log(`[Navigation Test] Current URL after click: ${currentUrl}`);
    assert.strictEqual(currentUrl, stationUrl);

    console.log("[Navigation Test] Verifying title after logo click...");
    const title = await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(text(),'Environment Status Station 1')]")),
      15000, // Increased timeout
      "Judul Dashboard 'Environment Status Station 1' tidak ditemukan setelah klik logo"
    );
    assert.ok((await title.getText()).includes('Environment Status Station 1'));
    console.log("[Navigation Test] Test: Klik logo atau judul kembali ke dashboard utama station 1 - END");
  });

  it('Navigasi ke halaman Download melalui sidebar', async () => {
    console.log("[Navigation Test] Test: Navigasi ke halaman Download melalui sidebar - START");

    console.log("[Navigation Test] Finding 'Download' link in sidebar...");
    const downloadNav = await driver.wait(
      until.elementLocated(By.xpath(`//nav//a[@href='/kalimantan/download']`)),
      15000, // Increased timeout
      "Link navigasi 'Download' di sidebar tidak ditemukan"
    );
    console.log("[Navigation Test] 'Download' link found. Clicking link...");
    await driver.actions().move({origin: downloadNav}).click().perform();
    console.log("[Navigation Test] 'Download' link clicked. Waiting for URL to be download page URL...");

    await driver.wait(until.urlIs(downloadPageUrl), 15000, `URL tidak berubah ke ${downloadPageUrl} setelah klik navigasi download.`); // Increased timeout
    console.log(`[Navigation Test] Current URL is now: ${await driver.getCurrentUrl()}`);
    
    const downloadPageTitle = await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'download data')]")),
      10000,
      "Judul halaman download tidak ditemukan"
    );
    assert.ok((await downloadPageTitle.getText()).toLowerCase().includes('download data'));

    const downloadBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[normalize-space(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'))='download data']")),
      10000,
      "Tombol 'Download Data' di halaman Download tidak ditemukan"
    );
    assert.ok((await downloadBtn.getText()).toLowerCase().includes('download data'));
    console.log("[Navigation Test] Test: Navigasi ke halaman Download melalui sidebar - END");
  });
});
