console.clear();
const { plugin } = require("puppeteer-with-fingerprints");
const fs = require("fs");
const { GetEmail, GetMessage } = require("./Utils/EmailHandler");
const config = require("./config");
const log = require("./Utils/log");
const sleep = require("./Utils/sleep");

async function Start() {
  log("Info", "Fetching Fingerprint...", "yellow");
  const fingerprint = await plugin.fetch("", {
    tags: ["Microsoft Windows", "Chrome"],
  });
  log("Info", "Applying Fingerprint...", "yellow");
  await plugin.useFingerprint(fingerprint);

  log("Info", "Fingerprint fetched and applied", "blue");

  if (config.UseProxy) {
    plugin.useProxy(
      `${config.ProxyUsername}:${config.ProxyPassword}@${config.ProxyIp}:${config.ProxyPort}`,
      {
        detectExternalIP: true,
        changeGeolocation: true,
        changeBrowserLanguage: false,
        changeTimezone: true,
        changeWebRTC: true,
      }
    );
    log("Info", "Proxy settings applied", "blue");
  }
  await log("Info", "Launching Browser", "green");
  const browser = await plugin.launch({ headless: false });

  const page = await browser.newPage();
  await page.setDefaultTimeout(3600000);
  await page.setViewport({
    width: config.BrowserWidth,
    height: config.BrowserHeight,
  });

  log(
    "Info",
    `Browser launched (Height: ${config.BrowserHeight} Width: ${config.BrowserWidth})`,
    "green"
  );
  await CreateAccount(page);

  await browser.close();
  log("Info", "Browser closed", "green");
  process.exit(0);
}

async function CreateAccount(page) {
  log("Info", "Navigating to Outlook sign-up page", "blue");
  await page.goto("https://outlook.live.com/owa/?nlp=1&signup=1");
  await page.waitForSelector(Selectors.UsernameInput);

  const personalInfo = await GeneratePersonalInfo();
  log("Info", `Generated username: ${personalInfo.username}`, "yellow");

  await page.type(Selectors.UsernameInput, personalInfo.username);
  await sleep(100);
  await page.keyboard.press("Enter");

  const password = await GeneratePassword();
  log("Info", `Generated password: ${password}`, "yellow");

  await page.waitForSelector(Selectors.PasswordInput);
  await page.type(Selectors.PasswordInput, password);
  await sleep(100);
  await page.keyboard.press("Enter");

  await page.waitForSelector(Selectors.FirstNameInput);
  await page.type(Selectors.FirstNameInput, personalInfo.randomFirstName);
  await page.type(Selectors.LastNameInput, personalInfo.randomLastName);
  log(
    "Info",
    `Generated name: ${personalInfo.randomFirstName} ${personalInfo.randomLastName}`,
    "yellow"
  );
  await sleep(100);
  await page.keyboard.press("Enter");

  await page.waitForSelector(Selectors.BirthDayInput);
  await sleep(1000);
  await page.select(Selectors.BirthDayInput, personalInfo.birthDay);
  await page.select(Selectors.BirthMonthInput, personalInfo.birthMonth);
  await page.type(Selectors.BirthYearInput, personalInfo.birthYear);
  log(
    "Info",
    `Generated Birthday. (Day: ${personalInfo.birthDay} Month: ${personalInfo.birthMonth} Year: ${personalInfo.birthYear})`,
    "yellow"
  );
  await sleep(100);
  await page.keyboard.press("Enter");

  const email = await page.$eval(
    Selectors.EmailDisplay,
    (el) => el.textContent
  );
  log("Info", `Created email: ${email}`, "green");

  log("Info", "Please Solve The Captcha.", "blue");
  await page.waitForSelector(Selectors.DeclineButton);
  log("Info", "Captcha solved!", "green");
  await page.click(Selectors.DeclineButton);
  await page.waitForSelector(Selectors.OutlookPage);

  if (config.AddRecoveryEmail) {
    log("Info", "Adding recovery email", "blue");
    await page.goto("https://account.live.com/proofs/Manage");
    await page.waitForSelector(Selectors.RecoveryEmailInput);

    const recoveryEmail = await GetEmail();
    log("Info", `Recovery email: ${recoveryEmail.email}`, "yellow");

    await page.type(Selectors.RecoveryEmailInput, recoveryEmail.email);
    await sleep(100);
    await page.keyboard.press("Enter");
    await page.waitForSelector(Selectors.EmailCodeInput);
    await page.type(Selectors.EmailCodeInput, await GetMessage(recoveryEmail));
    await sleep(100);
    await page.keyboard.press("Enter");
    await page.waitForSelector(Selectors.AfterCode);

    await page.click(Selectors.AfterCode);
    await page.waitForSelector(Selectors.DoubleVerifyEmail);
    await page.type(Selectors.DoubleVerifyEmail, recoveryEmail.email);
    await sleep(100);
    await page.keyboard.press("Enter");
    await page.waitForSelector(Selectors.DoubleVerifyCode);
    await page.type(
      Selectors.DoubleVerifyCode,
      await GetMessage(recoveryEmail)
    );
    await sleep(100);
    await page.keyboard.press("Enter");
    await page.waitForSelector(Selectors.InterruptContainer);
    log("Info", "Recovery email added and verified", "green");
  }

  await WriteCredentials(email, password);
}

async function WriteCredentials(email, password) {
  const account = `\nEmail: ${email}\nPassword: ${password}\n`;
  log("Info", `Saving credentials: ${account}`, "blue");

  await fs.appendFile(config.AccountsFile, `\n${account}`, (err) => {
    if (err) log("Error", err.message, "red");
  });
  log("Info", `Saved credentials`, "blue");
}

async function GeneratePersonalInfo() {
  const names = fs.readFileSync(config.NamesFile, "utf8").split("\n");
  const randomFirstName =
    names[Math.floor(Math.random() * names.length)].trim();
  const randomLastName = names[Math.floor(Math.random() * names.length)].trim();
  const username =
    randomFirstName + randomLastName + Math.floor(Math.random() * 9999);
  const birthDay = (Math.floor(Math.random() * 28) + 1).toString();
  const birthMonth = (Math.floor(Math.random() * 12) + 1).toString();
  const birthYear = (Math.floor(Math.random() * 10) + 1990).toString();

  return {
    username,
    randomFirstName,
    randomLastName,
    birthDay,
    birthMonth,
    birthYear,
  };
}

async function GeneratePassword() {
  const words = fs.readFileSync(config.WordsFile, "utf8").split("\n");
  const firstWord = words[Math.floor(Math.random() * words.length)].trim();
  const secondWord = words[Math.floor(Math.random() * words.length)].trim();
  return `${firstWord}${secondWord}${Math.floor(Math.random() * 9999)}!`;
}

const Selectors = {
  UsernameInput: "#usernameInput",
  PasswordInput: "#Password",
  FirstNameInput: "#firstNameInput",
  LastNameInput: "#lastNameInput",
  BirthDayInput: "#BirthDay",
  BirthMonthInput: "#BirthMonth",
  BirthYearInput: "#BirthYear",
  RecoveryEmailInput: "#EmailAddress",
  EmailDisplay: "#userDisplayName",
  EmailCodeInput: "#iOttText",
  DoubleVerifyEmail: "#idTxtBx_SAOTCS_ProofConfirmation",
  DoubleVerifyCode: "#idTxtBx_SAOTCC_OTC",
  AfterCode: "#idDiv_SAOTCS_Proofs_Section",
  DeclineButton: "#declineButton",
  InterruptContainer: "#interruptContainer",
  OutlookPage: "#mainApp",
};

log("Info", "Starting...", "green");
Start();
