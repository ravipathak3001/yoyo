const { Builder, By, until } = require("selenium-webdriver");
const { io } = require("socket.io-client");
const firefox = require("selenium-webdriver/firefox");
require('dotenv').config()

const LOGIN_URL = "https://cbtf4.com";
const STAKE_INPUT_SELECTOR = "#bet-stake-0";
const SOCKET_URL = "http://13.213.28.84:8082";
const MAX_RETRIES = 5;
const RESTART_DELAY = 5000; // 5 seconds
 const geckodriverPath = "/data/data/com.termux/files/usr/bin/geckodriver"; // Update path for Termux
//const geckodriverPath = "/opt/homebrew/opt/geckodriver/bin/geckodriver"; // Update path for Linux

async function login(driver) {
  console.log("🔑 Logging in...");
  await driver.get(LOGIN_URL);

  console.log("✅ Page loaded successfully!");
  await driver.findElement(By.css(".fa-sign-in")).click(); // Adjusted selector
  await driver.findElement(By.className("fa-angle-down")).click();
  await driver.findElement(By.className("fa-user")).click();

  const usernameField = await driver.wait(
    until.elementLocated(By.id("username")),
    10000
  );
  await usernameField.sendKeys(`${process.env.USERNAME}`);

  const userPassword = await driver.findElement(
    By.css("input[placeholder='Password']")
  );
  await userPassword.sendKeys(`${process.env.PASSWORD}`);
  const loginButton = await driver.wait(
    until.elementLocated(By.css("button.loginBtn")),
    10000
  );
  await loginButton.click();
  try {
    let closeButton = await driver.findElement(By.className("closeBTN"));
    if (closeButton) await closeButton.click();
  } catch (err) {
    console.log("No modal to close.");
  }

  console.log("✅ Logged in successfully!");
}

async function placeBet(driver, data) {
  console.log("🎯 Placing bet for:", data);
  await driver.get(`https://cbtf4.com/sport/event-detail/${data.eventId}`);

  // Normalize the odds text to handle spaces and format inconsistencies

  try {
    // Use `contains(text(), ...)` instead of exact match to avoid format issues
    let oddsElement = await driver.wait(
      until.elementLocated(By.xpath(`//*[contains(normalize-space(), '${data.odds}')]`)),
      10000
    );
    await oddsElement.click();

    let stakeInput = await driver.findElement(By.css(STAKE_INPUT_SELECTOR));
    await stakeInput.sendKeys(data.stake.toString());

    let placeBetButton = await driver.findElement(By.xpath("//*[contains(text(), 'Place Bet')]"));
    await placeBetButton.click();

    console.log(`✅ Bet placed successfully for odds: ${data.odds}`);
  } catch (error) {
    console.error(`❌ Failed to place bet for odds: ${data.odds}`, error);
  }
}


async function startScript(retries = 0) {
  console.log("🚀 Starting Selenium script...");

  const options = new firefox.Options();
  options.setPreference("dom.webnotifications.enabled", false); // Disable notifications if needed

  // Use the correct geckodriver path on Termux
  const driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(geckodriverPath)) // Use the geckodriver path
    .build();
  try {
    await login(driver);

    console.log("📡 Connecting to WebSocket...");
    const socket = io(SOCKET_URL);

    socket.on("connect", () => console.log("✅ Connected to WebSocket!"));
    socket.on("disconnect", () => console.log("🔌 WebSocket disconnected."));
    socket.on("connect_error", (err) =>
      console.error("❌ WebSocket error:", err)
    );

    socket.on("new-payload", async (data) => {
      console.log("📩 WebSocket message received:", data);
      try {
        if (data.runnerName && data.odds && data.stake) {
          await placeBet(driver, data);
        } else {
          console.error("⚠️ Invalid data received:", data);
        }
      } catch (error) {
        console.error("❌ Error processing WebSocket message:", error);
      }
    });
  } catch (error) {
    console.error("❌ Script Error:", error);
    // if (retries < MAX_RETRIES) {
    //   console.log(
    //     `🔄 Restarting script in ${RESTART_DELAY / 1000} seconds... (Attempt ${retries + 1}/${MAX_RETRIES})`
    //   );
    //   setTimeout(() => startScript(retries + 1), RESTART_DELAY);
    // } else {
    //   console.log("❌ Max retries reached. Exiting.");
    // }
  }
}

startScript();
