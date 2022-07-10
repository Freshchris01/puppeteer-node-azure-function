const puppeteer = require("puppeteer");

const path = require("path");
const { table } = require("console");
const downloadPath = path.resolve("./");
const SOUNDEO_USER = process.env["SOUNDEO_USER"]
const SOUNDEO_PASSWORD = process.env["SOUNDEO_PASSWORD"]

const downloadSong = async (artist, title) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("https://soundeo.com/");
  page.sned;
  await page._client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadPath,
  });

  const loginbuttonSelector = "#top-menu-account";
  await page.waitForSelector(loginbuttonSelector);
  await page.click(loginbuttonSelector);

  //await page.waitForXPath('//*[contains(text(), "LOGIN TO YOUR ACCOUNT")]', {
  console.log("Login not found");

  const [link] = await page.$x("//a[contains(., 'Login here!')]");
  if (link) {
    await link.click();
  }

  await page.waitForSelector("#UserLogin");
  console.log("Entering username and password.");
  await page.$eval("#UserLogin", (el) => (el.value = SOUNDEO_USER));
  await page.$eval("#UserPassword", (el) => (el.value = SOUNDEO_PASSWORD));
  await page.click(".signin-btn");
  await page.waitForTimeout(2000);
  await page.waitForSelector(".ui-autocomplete-input");
  console.log("Search field found.");

  searchTerm = artist + " " + title;

  await page.$eval(
    ".ui-autocomplete-input",
    (el, searchTerm) => {
      el.value = searchTerm;
    },
    searchTerm
  );
  const [searchButton] = await page.$x("//button[contains(., 'Search')]");
  if (searchButton) {
    await searchButton.click();
  }
  await page.waitForTimeout(1000);
  const [searchResultText] = await page.$x(
    "//h1[contains(., 'Search results')]"
  );
  if (searchResultText) {
    console.log("Search results found.");

    // find the correct search result. The needed result might not be the first one.
    const tracks = await page.$$(".trackitem");
    console.log("Found " + tracks.length + " tracks.");
    for (const track of tracks) {
      const extractedTitle = await track.waitForXPath("//div[1]/strong/a");

      const titleText = await page.evaluate(
        (el) => el.textContent,
        extractedTitle
      );
      console.log(titleText);
      const artistMatch = titleText.toLowerCase().includes(artist);
      const titleMatch = titleText.toLowerCase().includes(title);
      console.log("Artist: " + artistMatch);
      console.log("Title: " + titleMatch);
      console.log("---------------------------------------------------");

      if (titleMatch && artistMatch) {
        console.log("Match found for artist and title.")
        try {
          const downloadButton = await track.waitForXPath("//div[2]/a[1]", {timeout: 1000});
          downloadButton.click();
          console.log("Download link clicked");
          await page.waitForTimeout(5000);
          await browser.close();
          break;
        } catch (e) {
            console.log("Download button not found. The song is either not to download, or downloadable in another release. Please check manually.")
        }
      }
    }
    //page.click(".track-download-lnk");
  }

  await browser.close();
};

module.exports = async function (context, req) {
  context.log("JavaScript HTTP trigger function processed a request.");

  const title = req.body.title;
  const artist = req.body.artist;

  await downloadSong(title, artist);

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: "Automation successful!",
  };
};
