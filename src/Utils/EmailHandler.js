const axios = require("axios");
const sleep = require("./sleep");
const log = require("./log");

async function GetKey() {
  try {
    const response = await axios.post(
      "https://smailpro.com/app/key",
      {
        domain: "gmail.com",
        username: "random",
        server: "server-1",
        type: "alias",
      },
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "it-IT,it;q=0.8,en-US;q=0.5,en;q=0.3",
          "Content-Type": "application/json",
          "x-g-token": "",
          "X-XSRF-TOKEN": "",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
        },
        withCredentials: true,
      }
    );

    return response.data.items;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function GetEmail() {
  try {
    const key = await GetKey();
    const response = await axios.get("https://api.sonjj.com/email/gm/get", {
      params: {
        key,
        domain: "gmail.com",
        username: "random",
        server: "server-1",
        type: "alias",
      },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "it-IT,it;q=0.8,en-US;q=0.5,en;q=0.3",
        "x-rapidapi-ua": "RapidAPI-Playground",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
      },
    });

    return response.data.items;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function GetMid(email) {
  await sleep(10000);
  try {
    const key = await GetKey();
    const response = await axios.get("https://api.sonjj.com/email/gm/check", {
      params: {
        key,
        "rapidapi-key": "f871a22852mshc3ccc49e34af1e8p126682jsn734696f1f081",
        email: email.email,
        timestamp: email.timestamp,
      },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "it-IT,it;q=0.8,en-US;q=0.5,en;q=0.3",
        "x-rapidapi-ua": "RapidAPI-Playground",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
      },
    });

    return response.data.items[0].mid;
  } catch (error) {
    return GetMid(email);
  }
}

async function GetMessage(email) {
  try {
    log("Info", "Waiting for Email Code...", "magenta");
    const mid = await GetMid(email);
    log("Info", "Email Code Received!", "magenta");
    const key = await GetKey();
    const response = await axios.get("https://api.sonjj.com/email/gm/read", {
      params: {
        key,
        "rapidapi-key": "f871a22852mshc3ccc49e34af1e8p126682jsn734696f1f081",
        email: email.email,
        message_id: mid,
      },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "it-IT,it;q=0.8,en-US;q=0.5,en;q=0.3",
        "x-rapidapi-ua": "RapidAPI-Playground",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
      },
    });

    const securityCodeMatch = response.data.items.body.match(
      />\s*(\d{6})\s*<\/span>/
    );
    return securityCodeMatch[1];
  } catch (error) {
    console.error("Error:", error);
  }
}

module.exports = { GetEmail, GetMessage };
