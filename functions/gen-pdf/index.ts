import { Handler } from "@netlify/functions";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";
import qs from "qs";

import { requestBodySchema } from "../../lib/schema/gen-pdf";

const corsSettings = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === "POST") {
    const parsedBody = JSON.parse(event.body as string);
    const testedBody = await requestBodySchema.safeParseAsync(parsedBody);

    if (!testedBody.success)
      return {
        statusCode: 403,
        headers: corsSettings,
        body: JSON.stringify(testedBody),
      };

    const stringUrl = testedBody.data.userInfo["next-auth.callback-url"]
      ? (testedBody.data.userInfo["next-auth.callback-url"] as string)
      : (testedBody.data.userInfo["__Secure-next-auth.callback-url"] as string);

    const url = new URL(stringUrl);

    const cookies = Object.keys(testedBody.data.userInfo).map((name) => ({
      name,
      value: testedBody.data.userInfo[name],
      domain: url.hostname,
    }));

    const queryString = qs.stringify(testedBody.data.pdfInfo);

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath:
        process.env.CHROMIUM_PATH || (await chromium.executablePath),
      headless: true,
    });
    const page = await browser.newPage();

    await page.setCookie(...cookies);
    await page.setViewport({
      width: 1366,
      height: 768,
      isLandscape: true,
    });

    await page.goto(`${process.env.MAIN_WEB_ENTRYPOINT}/print?${queryString}`, {
      waitUntil: "networkidle0",
    });

    await page.emulateMediaType("screen");

    const ss = await page.pdf({
      format: "A4",
      preferCSSPageSize: true,
      printBackground: true,
    });

    await browser.close();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/pdf", ...corsSettings },
      body: ss.toString("base64"),
      isBase64Encoded: true,
    };
  }

  return {
    statusCode: 404,
    headers: corsSettings,
    body: "Only support POST method!",
  };
};
