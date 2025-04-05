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
//const geckodriverPath = "/opt/homebrew/opt/geckodriver/bin/geckodriver"; // Update path for Linux

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
}

async function loginAnother_11Team(driver) {
  try {
    console.log("🔑 Navigating to the website...");
    await driver.get(weburl); // Ensure `WEBURL` is set in your .env file
    await driver.sleep(3000); // Adjust if needed

    // Click the LOGIN button to open the modal
    console.log("📌 Clicking the LOGIN button...");
    const loginButton = await driver.wait(
      until.elementLocated(
        By.xpath(
          "//button[contains(text(),'LOGIN') or contains(text(),'LOG IN')]"
        )
      ),
      10000
    );
    await loginButton.click();
    await driver.sleep(2000); // Allow modal to load

    // Enter Username
    console.log("📌 Entering username...");
    const usernameField = await driver.wait(
      until.elementLocated(By.id("username")),
      10000
    );
    await usernameField.click();
    await usernameField.clear();
    await usernameField.sendKeys(process.env.USERNAME);

    // Enter Password
    console.log("📌 Entering password...");
    const passwordField = await driver.wait(
      until.elementLocated(By.css("input[formcontrolname='password']")),
      10000
    );
    await passwordField.click();
    await passwordField.clear();
    await passwordField.sendKeys(process.env.PASSWORD);

    // Click the "LOG IN" button
    console.log("📌 Clicking LOG IN...");
    const submitButton = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(),'LOG IN')]")),
      10000
    );
    await submitButton.click();

    console.log("✅ Logged in successfully!");
  } catch (error) {
    console.error("❌ Error during login:", error);
  } finally {
    // await driver.quit(); // Uncomment if you want to close the browser after execution
  }
}

async function loginIce777(driver) {
  console.log("🔑 Logging in...");
  await driver.get(weburl);

  console.log("✅ Page loaded successfully!");
  try {
    await driver.sleep(2000);
    await driver.findElement(By.css(".loginbtn")).click(); // Adjusted selector
    // await driver.findElement(By.className("fa-angle-down")).click();
    // await driver.findElement(By.className("fa-user")).click();

    const usernameField = await driver.wait(
      until.elementLocated(By.id("username")),
      10000
    );
    await usernameField.sendKeys(`${process.env.USERNAME}`);

    const userPassword = await driver.findElement(
      By.css("input[placeholder='Password']")
    );
    await userPassword.sendKeys(`${process.env.PASSWORD}`);

    // Click the "LOG IN" button
    console.log("📌 Clicking LOG IN...");
    const submitButton = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(),'LOGIN')]")),
      10000
    );
    await submitButton.click();

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
}

async function placeBetSection_Ice777(driver, data) {
  console.log("🎯 Placing bet for:", data);

  try {
    let currentUrl = await driver.getCurrentUrl();
    let urlToReach = `${weburl}/sport/event-detail/${data.eventId}`;

    // Step 1: Navigate to the event page if not already there
    if (!currentUrl.includes(urlToReach)) {
      console.log("🔍 Navigating to event page...");
      await driver.get(urlToReach);

      // Wait until URL is correct
      await driver.wait(async () => {
        let url = await driver.getCurrentUrl();
        return url.includes(urlToReach);
      }, 15000);

      // Optional: Add a delay after page load
      await driver.sleep(3000);
      console.log("✅ Event page loaded.");
    } else {
      console.log("✅ Event page already open.");
    }

    // Step 2: Locate the card for the runner (team)
    const cardEvent = await driver.wait(
      until.elementLocated(
        By.xpath(
          `//h2[contains(text(), '${data.runnerName}')]/ancestor::div[contains(@class, 'card_event')]`
        )
      ),
      10000
    );

    let oddsCell;

    if (data.betType === "lay") {
      const layCells = await cardEvent.findElements(By.css("li.red"));
      if (layCells.length > 0) {
        oddsCell = layCells[0];
      }
    } else if (data.betType === "back") {
      const backCells = await cardEvent.findElements(By.css("li.blue"));
      if (backCells.length > 0) {
        oddsCell = backCells[backCells.length - 1];
      }
    }

    // Step 3: Click the odds cell if found
    if (oddsCell) {
      await oddsCell.click();
      await driver.wait(until.elementLocated(By.css(".available-bets")), 5000);

      // Step 4: Fill in odds and stake (new DOM structure)
      // Step 4: Fill in odds and stake
      const oddsInput = await driver.findElement(By.id("bet-slip-0"));
      await oddsInput.clear();
      await oddsInput.sendKeys(data.odds.toString());

      const stakeInput = await driver.findElement(By.id("bet-stake-0"));
      await stakeInput.clear();
      await stakeInput.sendKeys(data.stake.toString());

      // Step 5: Uncheck "Accept Any Odds" checkbox if it's checked
      // const acceptAnyOddsCheckbox = await driver.findElement(By.id("accept"));

      const acceptOddsCheckbox = await driver.findElement(
        By.xpath(
          "//div[contains(., 'Accept Any Odds')]/input[@type='checkbox']"
        )
      );

      const isChecked = await acceptOddsCheckbox.isSelected();
      if (!isChecked) {
        await acceptOddsCheckbox.click();
        console.log("🔘 checked the 'Accept Any Odds' checkbox.");
      } else {
        console.log("✅ 'Accept Any Odds' is already checked.");
      }

      await driver.sleep(2000);

      // Step 6: Click the "PLACE BET" button
      // const placeBetButton = await driver.findElement(
      //   By.xpath("//div[contains(@class, 'place-bet')]//button[contains(text(), 'PLACE BET')]")
      // );

      // await placeBetButton.click();
      // console.log("🎯 PLACE BET button clicked.");
      let placeBetButton = await driver.findElement(
        By.xpath(
          "//button[normalize-space(text())='PLACE BET' or contains(., 'PLACE BET')]"
        )
      );
      const isDisplayed = await placeBetButton.isDisplayed();
      const isEnabled = await placeBetButton.isEnabled();
      console.log(`Button is displayed: ${isDisplayed}, enabled: ${isEnabled}`);
      if (isDisplayed && isEnabled) {
        await driver.executeScript(
          "arguments[0].scrollIntoView({block: 'center'});",
          placeBetButton
        );
        await driver.sleep(300);
        await placeBetButton.click();
      } else {
        console.log("Button is either not displayed or not enabled!");
      }

      console.log(`✅ Bet placed successfully for ${data.runnerName}`);
    } else {
      console.log(
        `⚠️ No valid ${data.betType} odds found for ${data.runnerName}`
      );
    }
  } catch (error) {
    console.error(`❌ Failed to place bet for ${data.runnerName}`, error);
  }
}

async function loginAnother_ostgameplay(driver) {
  try {
    console.log("🔑 Navigating to the website...");
    await driver.get(weburl); // Ensure `WEBURL` is set in your .env file
    await driver.sleep(3000); // Adjust if needed

    // Click the LOGIN button to open the modal
    console.log("📌 Clicking the LOGIN button...");
    const loginButton = await driver.wait(
      until.elementLocated(
        By.xpath("//button[contains(normalize-space(), 'Login/Signup')]")
      ),
      10000
    );
    await loginButton.click();

    await driver.sleep(2000); // Allow modal to load

    // 3. Click on the dropdown to switch to Username
    const dropdownToggle = await driver.findElement(
      By.css("button#dropdownMenuButton")
    );
    await dropdownToggle.click();

    const usernameOption = await driver.wait(
      until.elementLocated(By.xpath("//a[contains(text(),'User Name')]")),
      5000
    );
    await usernameOption.click();

    // Enter Username
    console.log("📌 Entering username...");
    const usernameField = await driver.wait(
      until.elementLocated(By.id("usernameOrEmails")),
      10000
    );
    await usernameField.click();
    await usernameField.clear();
    await usernameField.sendKeys(process.env.USERNAME);

    // Enter Password
    console.log("📌 Entering password...");
    const passwordField = await driver.wait(
      until.elementLocated(By.css("input[formcontrolname='password']")),
      10000
    );
    await passwordField.click();
    await passwordField.clear();
    await passwordField.sendKeys(process.env.PASSWORD);

    // Click the "LOG IN" button
    console.log("📌 Clicking LOG IN...");
    const submitButton = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(),'LOGIN')]")),
      10000
    );
    await submitButton.click();

    console.log("✅ Logged in successfully!");
  } catch (error) {
    console.error("❌ Error during login:", error);
  } finally {
    // await driver.quit(); // Uncomment if you want to close the browser after execution
  }
}

async function placeBet(driver, data) {
  console.log("🎯 Placing bet for:", data);

  try {
    let currentUrl = await driver.getCurrentUrl();
    let urlToReach = `${weburl}/sport/event-detail/${data.eventId}`;

    // If the betting page is not open, navigate to it and wait for it to load
    if (!currentUrl.includes(urlToReach)) {
      console.log("🔍 Betting page is not open. Navigating to it...");
      await driver.get(urlToReach);

      // Wait until the URL is correct
      await driver.wait(async () => {
        let url = await driver.getCurrentUrl();
        return url.includes(urlToReach);
      }, 15000); // Timeout in 15 seconds

      console.log("✅ Betting page loaded.");
    } else {
      console.log("✅ Betting page is already open.");
    }

    // Find the event row containing the runner name
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
          await confirmCheckbox[0].click();
          console.log("🔘 Unchecked the 'Confirm Bet' checkbox.");
        }
      } else {
        console.log("⚠️ No confirmation checkbox found.");
      }

      // Click on the 'Place Bet' button
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

async function placeBetSection_11Team(driver, data) {
  console.log("🎯 Placing bet for:", data);

  try {
    let currentUrl = await driver.getCurrentUrl();
    let urlToReach = `${weburl}/sport/event-detail/${data.eventId}`;

    if (!currentUrl.includes(urlToReach)) {
      console.log("🔍 Navigating to betting page...");
      await driver.get(urlToReach);
      await driver.wait(
        () => driver.getCurrentUrl().then((url) => url.includes(urlToReach)),
        2000
      );
      console.log("✅ Betting page loaded.");
    }

    // ✅ Scroll down to load elements dynamically
    // await driver.executeScript(
    //   "window.scrollTo(0, document.body.scrollHeight)"
    // );
    // await driver.sleep(2000); // Wait for elements to load

    // ✅ Locate event row by team name
    let eventRow = await driver.wait(
      until.elementLocated(
        By.xpath(
          `//h3[contains(text(), '${data.runnerName}')]/ancestor::div[contains(@class, 'oddsList')]`
        )
      ),
      1000
    );

    let oddsElement;
    if (data.betType === "back") {
      let allBackOdds = await eventRow.findElements(
        By.xpath(`.//li[contains(@class, 'back')]`)
      );
      if (allBackOdds.length > 0)
        oddsElement = allBackOdds[allBackOdds.length - 1]; // Highest back odds
    } else if (data.betType === "lay") {
      let allLayOdds = await eventRow.findElements(
        By.xpath(`.//li[contains(@class, 'lay')]`)
      );
      if (allLayOdds.length > 0) oddsElement = allLayOdds[0]; // Lowest lay odds
    }

    if (oddsElement) {
      await oddsElement.click();
      console.log("✅ Odds clicked, waiting for bet slip...");
      await driver.wait(until.elementLocated(By.css(".bet-slip")), 1000);
      console.log("✅ Bet slip loaded.");

      // 🔹 Enter custom odds
      let oddsInput = await driver.findElement(
        By.xpath(`//input[contains(@id, 'bet-slip-0')]`)
      );
      await oddsInput.clear();
      await oddsInput.sendKeys(data.odds.toString());
      console.log("✅ Custom odds set:", data.odds);

      // 🔹 Enter custom stake
      let stakeInput = await driver.findElement(
        By.xpath(`//input[contains(@id, 'bet-stake-0')]`)
      );
      await stakeInput.clear();
      await stakeInput.sendKeys(data.stake.toString());
      console.log("✅ Custom stake set:", data.stake);

      // 🔹 Click the 'Place Bet' button
      let placeBetButton = await driver.findElement(
        By.xpath(`//input[@type='button' and contains(@value, 'PLACE BET ✓')]`)
      );
      await placeBetButton.click();
      console.log(`✅ Bet placed successfully for event: ${data.eventName}`);
    } else {
      console.log("⚠️ No valid odds found.");
    }
  } catch (error) {
    console.error(`❌ Failed to place bet for event: ${data.eventName}`, error);
    // await driver.takeScreenshot().then((data) => {
    //   require("fs").writeFileSync("debug_screenshot.png", data, "base64");
    // });
  }
}

async function placeBetSection_otsgameplay(driver, data) {
  console.log("🎯 Placing bet for:", data);

  try {
    let currentUrl = await driver.getCurrentUrl();
    let urlToReach = `${weburl}/sport/event-detail/${data.eventId}`;

    if (!currentUrl.includes(urlToReach)) {
      console.log("🔍 Navigating to betting page...");
      await driver.get(urlToReach);
      await driver.wait(
        () => driver.getCurrentUrl().then((url) => url.includes(urlToReach)),
        15000
      );
      console.log("✅ Betting page loaded.");
    }

    // ✅ Scroll down to load elements dynamically
    await driver.executeScript(
      "window.scrollTo(0, document.body.scrollHeight)"
    );
    await driver.sleep(2000); // Wait for elements to load

    // ✅ Locate event row by team name
    let eventRow = await driver.wait(
      until.elementLocated(
        By.xpath(
          `//b[contains(text(), '${data.runnerName}')]/ancestor::div[contains(@class, 'table-row')]`
        )
      ),
      15000
    );

    let oddsElement;
    if (data.betType === "back") {
      let allBackOdds = await eventRow.findElements(
        By.xpath(`.//div[contains(@class, 'back')]`)
      );
      if (allBackOdds.length > 0)
        oddsElement = allBackOdds[allBackOdds.length - 1]; // Highest back odds
    } else if (data.betType === "lay") {
      let allLayOdds = await eventRow.findElements(
        By.xpath(`.//div[contains(@class, 'lay')]`)
      );
      if (allLayOdds.length > 0) oddsElement = allLayOdds[0]; // Lowest lay odds
    }

    if (oddsElement) {
      await oddsElement.click();
      console.log("✅ Odds clicked, waiting for bet slip...");
      await driver.wait(until.elementLocated(By.css(".place-bet")), 5000);
      console.log("✅ Bet slip loaded.");

      // 🔹 Enter custom odds
      let oddsInput = await driver.findElement(
        By.xpath(`//input[contains(@id, 'bet-slip-0')]`)
      );
      await oddsInput.clear();
      await oddsInput.sendKeys(data.odds.toString());
      console.log("✅ Custom odds set:", data.odds);

      // 🔹 Enter custom stake
      let stakeInput = await driver.findElement(
        By.xpath(`//input[contains(@id, 'bet-stake-0')]`)
      );
      await stakeInput.clear();
      await stakeInput.sendKeys(data.stake.toString());
      console.log("✅ Custom stake set:", data.stake);

      const acceptOddsCheckbox = await driver.findElement(
        By.xpath(
          "//div[contains(@class, 'accept-text')]//input[@type='checkbox']"
        )
      );

      const isChecked = await acceptOddsCheckbox.isSelected();
      if (!isChecked) {
        await acceptOddsCheckbox.click();
        console.log("☑️ 'Accept Any Odds' checkbox selected.");
      }

      const placeBetBtn = await driver.findElement(
        By.xpath(
          "//button[contains(@class, 'btn-success') and span[text()='Place Bet']]"
        )
      );
      await placeBetBtn.click();
      console.log(`✅ Bet placed successfully for event: ${data.eventName}`);

      // // 🔹 Click the 'Place Bet' button
      // let placeBetButton = await driver.findElement(
      //   By.xpath(`//input[@type='button' and contains(@value, 'PLACE BET ✓')]`)
      // );
      // await placeBetButton.click();
      // console.log(`✅ Bet placed successfully for event: ${data.eventName}`);
    } else {
      console.log("⚠️ No valid odds found.");
    }
  } catch (error) {
    console.error(`❌ Failed to place bet for event: ${data.eventName}`, error);
    await driver.takeScreenshot().then((data) => {
      require("fs").writeFileSync("debug_screenshot.png", data, "base64");
    });
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
    if (
      weburl === "https://gocric247.com" ||
      weburl === "https://11team.com" ||
      weburl === "https://multicric.com" ||
      weburl === "https://mahi11.com" ||
      weburl === "https://jaddu11.com" ||
      weburl === "https://yolo365.com" ||
      weburl === "https://tnbook247.com" ||
      weburl === "https://r7win.com" ||
      weburl === "https://d3.bajrangi365.com" ||
      weburl === "https://d3.patel247.com" ||
      weburl === "https://ostgameplay.com"
    ) {
      loginAnother_11Team(driver);
    } else if (weburl === "https://ostgameplay.com") {
      loginAnother_ostgameplay(driver);
    } else {
      await login(driver);
    }

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
          // await placeBetSection_Ice777(driver, data);

          if (
            weburl === "https://gocric247.com" ||
            weburl === "https://11team.com" ||
            weburl === "https://multicric.com" ||
            weburl === "https://mahi11.com" ||
            weburl === "https://jaddu11.com" ||
            weburl === "https://yolo365.com" ||
            weburl === "https://tnbook247.com" ||
            weburl === "https://r7win.com" ||
            weburl === "https://d3.bajrangi365.com" ||
            weburl === "https://d3.patel247.com" ||
            weburl === "https://ostgameplay.com"
          ) {
            placeBetSection_11Team(driver, data);
          } else if (weburl === "https://ostgameplay.com") {
            await placeBetSection_otsgameplay(driver, data);
          } else {
            await placeBet(driver, data);
          }
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
