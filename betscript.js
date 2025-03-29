const { Builder, By, until } = require("selenium-webdriver");
const { io } = require("socket.io-client");
const firefox = require("selenium-webdriver/firefox");
require("dotenv").config();

function removeTrailingSlash(url) {
  if (url.endsWith("/")) {
    return url.slice(0, -1); // Removes the last character, which is the slash
  }
  return url;
}

const weburl = removeTrailingSlash(process.env.WEB_URL);
const STAKE_INPUT_SELECTOR = "#bet-stake-0";
const SOCKET_URL = "http://13.213.28.84:8082";
const MAX_RETRIES = 5;
const RESTART_DELAY = 5000; // 5 seconds
const geckodriverPath = "/data/data/com.termux/files/usr/bin/geckodriver"; // Update path for Termux
// const geckodriverPath = "/opt/homebrew/opt/geckodriver/bin/geckodriver"; // Update path for Linux

async function login(driver) {
  if (weburl === "https://cbtf4.com") {

  console.log("🔑 Logging in...");
  await driver.get(weburl);

  console.log("✅ Page loaded successfully!");

  try {
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
    console.log("✅ Logged in successfully!");
    try {
      let closeButton = await driver.findElement(By.className("closeBTN"));
      if (closeButton) await closeButton.click();
    } catch (err) {
      console.log("No modal to close.");
    }
  } catch (error) {
    console.error("❌ Error logging in:", error);
  }
  } else {
    console.log("🔑 Logging in...");

    // Step 1: Navigate to the website
    await driver.get(weburl); // Ensure `weburl` is the URL you want to visit
    console.log("✅ Page loaded successfully!");

    await driver.sleep(3000); // Adjust sleep time based on how long it takes to load

    try {
      // Step 2: Wait for the phone number/username field to be visible
      const userField = await driver.wait(
        until.elementLocated(By.id("tel")),
        10000
      );

      // Get the username from environment or input
      let username = process.env.USERNAME;

      // Check if the username is numeric or non-numeric
      if (/^\d+$/.test(username)) {
        // If it's numeric, treat it as a phone number
        console.log("Using mobile number as username.");
        await userField.click(); // Focus on the field
        await userField.clear(); // Clear any existing value
        await userField.sendKeys(username); // Enter phone number

        // Step 3: Open the dropdown for mobile selection
        const dropdownButton = await driver.wait(
          until.elementLocated(By.id("dropdownMenuButton")),
          10000
        );
        await dropdownButton.click(); // Open the dropdown

        // Wait for the "Mobile Number" option to be visible and clickable
        const mobileOption = await driver.wait(
          until.elementLocated(
            By.xpath("//a[contains(text(),'Mobile Number')]")
          ),
          10000
        );
        await driver.wait(until.elementIsVisible(mobileOption), 10000);
        await driver.wait(until.elementIsEnabled(mobileOption), 10000);

        // Click on "Mobile Number" option
        await mobileOption.click();
        console.log("✅ Selected 'Mobile Number' option");
      } else {
        // If it's non-numeric, treat it as a username
        console.log("Using username.");
        await userField.click(); // Focus on the field
        await userField.clear(); // Clear any existing value

        // Wait to ensure the field is ready for input
        await driver.wait(until.elementIsVisible(userField), 10000);
        await driver.wait(until.elementIsEnabled(userField), 20000);

        // Step 3: Open the dropdown for username selection
        const dropdownButton = await driver.wait(
          until.elementLocated(By.id("dropdownMenuButton")),
          10000
        );
        await dropdownButton.click(); // Open the dropdown

        // Wait for the "User Name" option to be visible and clickable
        const usernameOption = await driver.wait(
          until.elementLocated(By.xpath("//a[contains(text(),'User Name')]")),
          10000
        );
        await driver.wait(until.elementIsVisible(usernameOption), 10000);
        await driver.wait(until.elementIsEnabled(usernameOption), 10000);

        // Click on "User Name" option
        await usernameOption.click();
        console.log("✅ Selected 'User Name' option");

        const userField1 = await driver.wait(
          until.elementLocated(By.id("username")),
          10000
        );
        // Now enter the username
        await userField1.sendKeys(username); // Enter username
        console.log("✅ Entered username:", username);
      }

      // Step 4: Wait for the password field to be visible and focus on it
      const passwordField = await driver.wait(
        until.elementLocated(By.css("input[formcontrolname='password']")),
        10000
      );
      console.log("✅ Password field located");

      // Focus on the password field and clear any existing value
      await passwordField.click(); // Focus on the password field
      await passwordField.clear(); // Clear any existing value

      // Wait for a brief moment to ensure the field is fully focused
      await driver.sleep(500); // Sleep for half a second to ensure focus is stable

      // Get the password from environment or input
      let password = process.env.PASSWORD;
      await passwordField.sendKeys(password); // Enter the password

      console.log("✅ Password filled");

      // Step 5: Click the login button
      const loginButton = await driver.wait(
        until.elementLocated(By.css("button[name='login']")),
        10000
      );
      await loginButton.click(); // Submit the form
      console.log("✅ Logged in successfully!");

      // Optional: Handle any modal or close button if it appears after login
      try {
        let closeButton = await driver.findElement(By.className("closeBTN"));
        if (closeButton) await closeButton.click();
      } catch (err) {
        console.log("No modal to close.");
      }
    } catch (error) {
      console.error("❌ Error logging in:", error);
    }
  }

  async function placeBet(driver, data) {
    console.log("🎯 Placing bet for:", data);
    await driver.get(`https://cbtf4.com/sport/event-detail/${data.eventId}`);

    try {
      // Wait for event row containing the runner name
      let eventRow = await driver.wait(
        until.elementLocated(
          By.xpath(
            `//div[contains(text(), '${data.runnerName}')]//ancestor::tr`
          )
        ),
        10000
      );

      let oddsElement;

      if (data.betType === "back") {
        // Find all back odds
        let allBackOdds = await eventRow.findElements(
          By.xpath(`.//td[contains(@class, 'back')]//strong`)
        );

        if (allBackOdds.length > 0) {
          // Click the last back odds
          oddsElement = allBackOdds[allBackOdds.length - 1];
          console.log(`🟢 Clicking last Back odds.`);
        } else {
          console.log("⚠️ No Back odds found.");
        }
      } else if (data.betType === "lay") {
        // Find all lay odds
        let allLayOdds = await eventRow.findElements(
          By.xpath(`.//td[contains(@class, 'lay')]//strong`)
        );

        if (allLayOdds.length > 0) {
          // Click the first lay odds
          oddsElement = allLayOdds[0];
          console.log(`🔴 Clicking first Lay odds.`);
        } else {
          console.log("⚠️ No Lay odds found.");
        }
      }

      if (oddsElement) {
        await oddsElement.click();

        // Find the stake input field and enter the stake
        let stakeInput = await driver.findElement(By.css(STAKE_INPUT_SELECTOR));
        await stakeInput.sendKeys(data.stake.toString());

        // Find and click the Place Bet button
        let placeBetButton = await driver.findElement(
          By.xpath("//*[contains(text(), 'Place Bet')]")
        );
        await placeBetButton.click();

        console.log(`✅ Bet placed successfully for event: ${data.eventName}`);
      } else {
        console.log(`⚠️ No valid odds found to click.`);
      }
    } catch (error) {
      console.error(
        `❌ Failed to place bet for event: ${data.eventName}`,
        error
      );
    }
  }
}

// async function placeBet(driver, data) {
//   console.log("🎯 Placing bet for:", data);
//   await driver.get(`https://cbtf4.com/sport/event-detail/${data.eventId}`);

//   try {
//     // Wait for event row containing the runner name
//     let eventRow = await driver.wait(
//       until.elementLocated(
//         By.xpath(`//div[contains(text(), '${data.runnerName}')]//ancestor::tr`)
//       ),
//       10000
//     );

//     let oddsElement;

//     if (data.betType === "back") {
//       let allBackOdds = await eventRow.findElements(
//         By.xpath(`.//td[contains(@class, 'back')]//strong`)
//       );
//       if (allBackOdds.length > 0) {
//         oddsElement = allBackOdds[allBackOdds.length - 1];
//       }
//     } else if (data.betType === "lay") {
//       let allLayOdds = await eventRow.findElements(
//         By.xpath(`.//td[contains(@class, 'lay')]//strong`)
//       );
//       if (allLayOdds.length > 0) {
//         oddsElement = allLayOdds[0];
//       }
//     }

//     if (oddsElement) {
//       await oddsElement.click();

//       await driver.wait(until.elementLocated(By.css(".apl-form")), 5000);

//       let oddsInput = await driver.findElement(
//         By.css(".odds-field input[type='text']")
//       );
//       await oddsInput.clear();
//       await oddsInput.sendKeys(data.odds.toString());

//       let stakeInput = await driver.findElement(
//         By.css(".betslip__input input[type='number']")
//       );
//       await stakeInput.clear();
//       await stakeInput.sendKeys(data.stake.toString());

//       let confirmCheckbox = await driver.findElements(
//         By.xpath("//label[contains(@class, 'confirmation-checkbox')]/input")
//       );
//       if (confirmCheckbox.length > 0) {
//         await confirmCheckbox[0].click();
//       }

//       let placeBetButton = await driver.findElement(
//         By.xpath("//button[contains(text(), 'Place Bet')]")
//       );
//       await placeBetButton.click();

//       // ✅ Handle optional confirmation modal
//       try {
//         let confirmButton = await driver.wait(
//           until.elementLocated(
//             By.xpath("//button[contains(text(), 'Confirm')]")
//           ),
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

// async function placeBet(driver, data) {
//   console.log("🎯 Placing bet for:", data);
//   await driver.get(`${weburl}/sport/event-detail/${data.eventId}`);

//   try {
//     // Wait for event row containing the runner name
//     let eventRow = await driver.wait(
//       until.elementLocated(
//         By.xpath(`//div[contains(text(), '${data.runnerName}')]//ancestor::tr`)
//       ),
//       10000
//     );

//     let oddsElement;

//     if (data.betType === "back") {
//       let allBackOdds = await eventRow.findElements(
//         By.xpath(`.//td[contains(@class, 'back')]//strong`)
//       );
//       if (allBackOdds.length > 0) {
//         oddsElement = allBackOdds[allBackOdds.length - 1];
//       }
//     } else if (data.betType === "lay") {
//       let allLayOdds = await eventRow.findElements(
//         By.xpath(`.//td[contains(@class, 'lay')]//strong`)
//       );
//       if (allLayOdds.length > 0) {
//         oddsElement = allLayOdds[0];
//       }
//     }

//     if (oddsElement) {
//       await oddsElement.click();

//       await driver.wait(until.elementLocated(By.css(".apl-form")), 5000);

//       let oddsInput = await driver.findElement(
//         By.css(".odds-field input[type='text']")
//       );
//       await oddsInput.clear();
//       await oddsInput.sendKeys(data.odds.toString());

//       let stakeInput = await driver.findElement(
//         By.css(".betslip__input input[type='number']")
//       );
//       await stakeInput.clear();
//       await stakeInput.sendKeys(data.stake.toString());

//       // Locate and uncheck the confirmation checkbox (if it exists)
//       let confirmCheckbox = await driver.findElements(
//         By.xpath("//label[contains(text(), 'Confirm Bet')]/input")
//       );
//       if (confirmCheckbox.length > 0) {
//         // Uncheck the checkbox if it's checked
//         let isChecked = await confirmCheckbox[0].isSelected();
//         if (isChecked) {
//           await confirmCheckbox[0].click(); // Uncheck the checkbox
//           console.log(
//             "🔘 Unchecked the 'Confirm Bet' checkbox to skip confirmation."
//           );
//         }
//       } else {
//         console.log("⚠️ No confirmation checkbox found.");
//       }

//       // Click on the 'Place Bet' button directly (no confirmation popup)
//       let placeBetButton = await driver.findElement(
//         By.xpath("//button[contains(text(), 'Place Bet')]")
//       );
//       await placeBetButton.click();

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

  try {
    // Directly find the event row containing the runner name
    let eventRow = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(text(), '${data.runnerName}')]//ancestor::tr`)
      ),
      10000
    );

    let oddsElement;

    if (data.betType === "back") {
      let allBackOdds = await eventRow.findElements(
        By.xpath(`.//td[contains(@class, 'back')]//strong`)
      );
      if (allBackOdds.length > 0) {
        oddsElement = allBackOdds[allBackOdds.length - 1];
      }
    } else if (data.betType === "lay") {
      let allLayOdds = await eventRow.findElements(
        By.xpath(`.//td[contains(@class, 'lay')]//strong`)
      );
      if (allLayOdds.length > 0) {
        oddsElement = allLayOdds[0];
      }
    }

    if (oddsElement) {
      await oddsElement.click();

      await driver.wait(until.elementLocated(By.css(".apl-form")), 5000);

      let oddsInput = await driver.findElement(
        By.css(".odds-field input[type='text']")
      );
      await oddsInput.clear();
      await oddsInput.sendKeys(data.odds.toString());

      let stakeInput = await driver.findElement(
        By.css(".betslip__input input[type='number']")
      );
      await stakeInput.clear();
      await stakeInput.sendKeys(data.stake.toString());

      // Locate and uncheck the confirmation checkbox (if it exists)
      let confirmCheckbox = await driver.findElements(
        By.xpath("//label[contains(text(), 'Confirm Bet')]/input")
      );
      if (confirmCheckbox.length > 0) {
        let isChecked = await confirmCheckbox[0].isSelected();
        if (isChecked) {
          await confirmCheckbox[0].click(); // Uncheck the checkbox
          console.log(
            "🔘 Unchecked the 'Confirm Bet' checkbox to skip confirmation."
          );
        }
      } else {
        console.log("⚠️ No confirmation checkbox found.");
      }

      // Click on the 'Place Bet' button directly (no confirmation popup)
      let placeBetButton = await driver.findElement(
        By.xpath("//button[contains(text(), 'Place Bet')]")
      );
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
