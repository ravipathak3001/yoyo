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
// const geckodriverPath = "/opt/homebrew/opt/geckodriver/bin/geckodriver"; // Update path for Linux

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


// async function placeBet(driver, data) {
//   console.log("🎯 Placing bet for:", data);
//   await driver.get(`https://cbtf4.com/sport/event-detail/${data.eventId}`);

//   try {
//     // Wait for event row containing the runner name
//     let eventRow = await driver.wait(
//       until.elementLocated(By.xpath(`//div[contains(text(), '${data.runnerName}')]//ancestor::tr`)),
//       10000
//     );

//     let oddsElement;

//     if (data.betType === 'back') {
//       // Find all back odds
//       let allBackOdds = await eventRow.findElements(By.xpath(`.//td[contains(@class, 'back')]//strong`));

//       if (allBackOdds.length > 0) {
//         // Click the last back odds
//         oddsElement = allBackOdds[allBackOdds.length - 1];
//         console.log(`🟢 Clicking last Back odds.`);
//       } else {
//         console.log('⚠️ No Back odds found.');
//       }
//     } else if (data.betType === 'lay') {
//       // Find all lay odds
//       let allLayOdds = await eventRow.findElements(By.xpath(`.//td[contains(@class, 'lay')]//strong`));

//       if (allLayOdds.length > 0) {
//         // Click the first lay odds
//         oddsElement = allLayOdds[0];
//         console.log(`🔴 Clicking first Lay odds.`);
//       } else {
//         console.log('⚠️ No Lay odds found.');
//       }
//     }

//     if (oddsElement) {
//       await oddsElement.click();

//       // Find the stake input field and enter the stake
//       let stakeInput = await driver.findElement(By.css(STAKE_INPUT_SELECTOR));
//       await stakeInput.sendKeys(data.stake.toString());

//       // Find and click the Place Bet button
//       let placeBetButton = await driver.findElement(By.xpath("//*[contains(text(), 'Place Bet')]"));
//       await placeBetButton.click();

//       console.log(`✅ Bet placed successfully for event: ${data.eventName}`);
//     } else {
//       console.log(`⚠️ No valid odds found to click.`);
//     }
//   } catch (error) {
//     console.error(`❌ Failed to place bet for event: ${data.eventName}`, error);
//   }
// }


// async function placeBet(driver, data) {
//   console.log("🎯 Placing bet for:", data);
//   await driver.get(`https://cbtf4.com/sport/event-detail/${data.eventId}`);

//   try {
//     // Wait for event row containing the runner name
//     let eventRow = await driver.wait(
//       until.elementLocated(By.xpath(`//div[contains(text(), '${data.runnerName}')]//ancestor::tr`)),
//       10000
//     );

//     let oddsElement;

//     if (data.betType === 'back') {
//       let allBackOdds = await eventRow.findElements(By.xpath(`.//td[contains(@class, 'back')]//strong`));
//       if (allBackOdds.length > 0) {
//         oddsElement = allBackOdds[allBackOdds.length - 1];
//       }
//     } else if (data.betType === 'lay') {
//       let allLayOdds = await eventRow.findElements(By.xpath(`.//td[contains(@class, 'lay')]//strong`));
//       if (allLayOdds.length > 0) {
//         oddsElement = allLayOdds[0];
//       }
//     }

//     if (oddsElement) {
//       await oddsElement.click();

//       await driver.wait(until.elementLocated(By.css(".apl-form")), 5000);

//       let oddsInput = await driver.findElement(By.css(".odds-field input[type='text']"));
//       await oddsInput.clear();
//       await oddsInput.sendKeys(data.odds.toString());

//       let stakeInput = await driver.findElement(By.css(".betslip__input input[type='number']"));
//       await stakeInput.clear();
//       await stakeInput.sendKeys(data.stake.toString());

//       let confirmCheckbox = await driver.findElements(By.xpath("//label[contains(@class, 'confirmation-checkbox')]/input"));
//       if (confirmCheckbox.length > 0) {
//         await confirmCheckbox[0].click();
//       }

//       let placeBetButton = await driver.findElement(By.xpath("//button[contains(text(), 'Place Bet')]"));
//       await placeBetButton.click();

//       // ✅ Handle optional confirmation modal
//       try {
//         let confirmButton = await driver.wait(
//           until.elementLocated(By.xpath("//button[contains(text(), 'Confirm')]")),
//           3000 // Wait only 3 seconds, if not found, skip
//         );
//         if (confirmButton) {
//           await confirmButton.click();
//           console.log(`✅ Confirmed the bet.`);
//         }
//       } catch (error) {
//         console.log(`⚠️ No confirmation popup detected, bet placed directly.`);
//       }

//       console.log(`✅ Bet placed successfully for event: ${data.eventName}`);
//     } else {
//       console.log(`⚠️ No valid odds found to click.`);
//     }
//   } catch (error) {
//     console.error(`❌ Failed to place bet for event: ${data.eventName}`, error);
//   }
// }


async function placeBet(driver, data) {
  console.log("🎯 Placing bet for:", data);
  await driver.get(`https://cbtf4.com/sport/event-detail/${data.eventId}`);

  try {
    // Wait for event row containing the runner name
    let eventRow = await driver.wait(
      until.elementLocated(By.xpath(`//div[contains(text(), '${data.runnerName}')]//ancestor::tr`)),
      10000
    );

    let oddsElement;

    if (data.betType === 'back') {
      let allBackOdds = await eventRow.findElements(By.xpath(`.//td[contains(@class, 'back')]//strong`));
      if (allBackOdds.length > 0) {
        oddsElement = allBackOdds[allBackOdds.length - 1];
      }
    } else if (data.betType === 'lay') {
      let allLayOdds = await eventRow.findElements(By.xpath(`.//td[contains(@class, 'lay')]//strong`));
      if (allLayOdds.length > 0) {
        oddsElement = allLayOdds[0];
      }
    }

    if (oddsElement) {
      await oddsElement.click();

      await driver.wait(until.elementLocated(By.css(".apl-form")), 5000);

      let oddsInput = await driver.findElement(By.css(".odds-field input[type='text']"));
      await oddsInput.clear();
      await oddsInput.sendKeys(data.odds.toString());

      let stakeInput = await driver.findElement(By.css(".betslip__input input[type='number']"));
      await stakeInput.clear();
      await stakeInput.sendKeys(data.stake.toString());

      // Locate and uncheck the confirmation checkbox (if it exists)
      let confirmCheckbox = await driver.findElements(By.xpath("//label[contains(text(), 'Confirm Bet')]/input"));
      if (confirmCheckbox.length > 0) {
        // Uncheck the checkbox if it's checked
        let isChecked = await confirmCheckbox[0].isSelected();
        if (isChecked) {
          await confirmCheckbox[0].click();  // Uncheck the checkbox
          console.log("🔘 Unchecked the 'Confirm Bet' checkbox to skip confirmation.");
        }
      } else {
        console.log("⚠️ No confirmation checkbox found.");
      }

      // Click on the 'Place Bet' button directly (no confirmation popup)
      let placeBetButton = await driver.findElement(By.xpath("//button[contains(text(), 'Place Bet')]"));
      await placeBetButton.click();

      console.log(`✅ Bet placed successfully for event: ${data.eventName}`);
    } else {
      console.log(`⚠️ No valid odds found to click.`);
    }
  } catch (error) {
    console.error(`❌ Failed to place bet for event: ${data.eventName}`, error);
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
