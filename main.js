import puppeteer from "puppeteer";

import fs from "fs/promises";
//save cookie function
const saveCookie = async (page) => {
  const cookies = await page.cookies();
  const cookieJson = JSON.stringify(cookies, null, 2);
  await fs.writeFile("cookies.json", cookieJson);
};

//load cookie function
const loadCookie = async (page) => {
  const cookieJson = await fs.readFile("cookies.json");
  const cookies = JSON.parse(cookieJson);
  await page.setCookie(...cookies);
};

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await loadCookie(page); //load cookie
  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });
  await page.goto(
    "https://www.google.com/maps/dir/Howth,+Dublin/Phoenix+Park,+Dublin+8/@53.3677705,-6.2622179,12z/data=!3m1!4b1!4m18!4m17!1m5!1m1!1s0x486704e16bbccb97:0xa00c7a997317110!2m2!1d-6.0570132!2d53.3785693!1m5!1m1!1s0x48670da9f174517b:0xa126d82d9add596b!2m2!1d-6.3298133!2d53.3558823!2m3!6e0!7e2!8j1679133600!3e3"
  );

  await page.waitForSelector("input.tactile-searchbox-input");

  let inputs = await page.$$("input.tactile-searchbox-input");
  await inputs[0].click();
  await inputs[0].type("Drumcondra");

  await inputs[1].click();
  await inputs[1].type("D22W9H6");
  await page.keyboard.press("Enter");

  await page.waitForSelector('div[id*="section-directions-trip"]');

  let tripCards = await page.$$('div[id*="section-directions-trip"]');
  let tripCardLength = tripCards.length;

  let tripDetails = Array(tripCardLength);

  for (let i = 0; i < tripCardLength; i++) {
    await page.waitForSelector('div[id*="section-directions-trip"]');
    tripCards = await page.$$('div[id*="section-directions-trip"]');

    let tripCard = tripCards[i];

    i > 0 ? await tripCard.click() : void 0;

    await page.waitForSelector(
      'span[id*="section-directions-trip-details-msg"]'
    );

    let detailsSpan = await tripCard.$(
      'span[id*="section-directions-trip-details-msg"]'
    );
    await detailsSpan.click();
    await page.waitForSelector('button[aria-label*="Back"]');

    let tripInfo = [];

    let tripDetailCards = await page.$$("span[id*='transit_group']");
    for (let j = 1; j < tripDetailCards.length - 1; j++) {
      let tripSubInfo = {
        transportType: "",
        busName: "",
        busStops: [],
      };

      let tripDetailCard = tripDetailCards[j];

      let busBoxElements = await tripDetailCard.$$(
        'span[style*="background-color:#f2ca36"]'
      );

      if (busBoxElements.length === 0) {
        tripSubInfo.transportType = "Walk";
        tripInfo.push(tripSubInfo);
        continue;
      }

      let busName = await busBoxElements[0].evaluate((el) => el.innerText);

      tripSubInfo.transportType = "Bus";
      tripSubInfo.busName = busName;

      let busStopElements = await tripDetailCard.$$(
        'h2[class*="fontHeadlineSmall"]'
      );
      for (let busStopElement of busStopElements) {
        let busStopName = await busStopElement.evaluate((el) => el.innerText);
        tripSubInfo.busStops.push(busStopName);
      }

      tripInfo.push(tripSubInfo);
    }

    tripDetails[i] = tripInfo;
    await page.waitForTimeout(100);

    await page.click('button[aria-label*="Back"]');
  }

  console.dir(tripDetails, { depth: null });

  await saveCookie(page); //save cookie
  await browser.close();
})();
