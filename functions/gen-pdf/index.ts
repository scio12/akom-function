import { Handler } from "@netlify/functions";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

import { requestBodySchema } from "../../lib/schema/gen-pdf";

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === "POST") {
    const parsedBody = JSON.parse(event.body);
    const testedBody = await requestBodySchema.safeParseAsync(parsedBody);

    if (!testedBody.success)
      return {
        statusCode: 403,
        body: JSON.stringify(testedBody),
      };

    const url = new URL(testedBody.data.userInfo["next-auth.callback-url"]);

    const cookies = Object.keys(testedBody.data.userInfo).map((name) => ({
      name,
      value: testedBody.data.userInfo[name],
      domain: url.hostname,
    }));

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath:
        process.env.CHROMIUM_PATH || (await chromium.executablePath),
      headless: true,
    });
    const page = await browser.newPage();

    await page.setCookie(...cookies);

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
  }

  return {
    statusCode: 404,
    body: "Only support POST method!",
  };
};
