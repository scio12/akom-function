import { Handler } from "@netlify/functions";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export const handler: Handler = async (event, context) => {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath:
      process.env.CHROMIUM_PATH || (await chromium.executablePath),
    headless: true,
  });
  const page = await browser.newPage();

  await page.emulateMediaType("screen");

  const ss = await page.pdf({
    format: "A4",
    preferCSSPageSize: true,
    printBackground: true,
  });

  await browser.close();

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/pdf" },
    body: ss.toString("base64"),
    isBase64Encoded: true,
  };
};
