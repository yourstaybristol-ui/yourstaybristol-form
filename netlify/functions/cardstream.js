// netlify/functions/cardstream.js
const crypto = require("crypto");

const CARDSTREAM_SECRET = process.env.CARDSTREAM_SECRET; // set this in Netlify env vars
const MERCHANT_ID = "283320";
const HOSTED_URL = "https://gateway.cardstream.com/hosted/";

function generateTransactionUnique() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const rand = Math.floor(Math.random() * 1000000);
  return `YSB-UNIQ-${timestamp}-${rand}`;
}

function formEncode(value) {
  return encodeURIComponent(String(value)).replace(/%20/g, "+");
}

function normalizeUrlEncodedNewlines(str) {
  return str
    .replace(/%0D%0A/g, "%0A")
    .replace(/%0A%0D/g, "%0A")
    .replace(/%0D/g, "%0A");
}

function buildEncodedStringForSignature(fields) {
  const keys = Object.keys(fields).filter(k => k !== "signature").sort();
  const encoded = keys.map(k => `${k}=${formEncode(fields[k])}`).join("&");
  return normalizeUrlEncodedNewlines(encoded);
}

function computeSignature(fields, secret) {
  const toHash = buildEncodedStringForSignature(fields) + secret;
  return crypto.createHash("sha512").update(toHash, "utf8").digest("hex");
}

exports.handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const amount = body.amount || "100";
  const orderRef = body.orderRef || "TEST123";

  const tran = {
    merchantID: MERCHANT_ID,
    action: "SALE",
    type: "SALE",
    countryCode: "826",
    currencyCode: "826",
    amount,
    orderRef,
    transactionUnique: generateTransactionUnique(),
    redirectURL: "https://www.yourstaybristol.co.uk/payment-success",
    cancelURL: "https://www.yourstaybristol.co.uk/payment-failed",
    version: "1.00"
  };

  const signature = computeSignature(tran, CARDSTREAM_SECRET);
  tran.signature = signature;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Redirecting…</title></head>
<body>
  <form id="cardstream" action="${HOSTED_URL}" method="POST">
    ${Object.keys(tran)
      .map(k => `<input type="hidden" name="${k}" value="${tran[k]}">`)
      .join("\n    ")}
    <noscript><button type="submit">Continue</button></noscript>
  </form>
  <script>document.getElementById('cardstream').submit();</script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: html
  };
};
