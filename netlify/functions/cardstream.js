const crypto = require("crypto");
const querystring = require("querystring");

exports.handler = async (event) => {
  const { amount, orderRef } = querystring.parse(event.body || "");

  const merchantID = "283320"; // your actual merchant ID
  const secret = process.env.CARDSTREAM_SECRET;
  const currencyCode = "826"; // GBP
  const action = "SALE";

  const request = {
    merchantID,
    action,
    type: "SALE",
    countryCode: "826",
    currencyCode,
    amount,
    orderRef,
    transactionUnique: orderRef,
    redirectURL: "https://www.yourstaybristol.co.uk/payment-success",
    cancelURL: "https://www.yourstaybristol.co.uk/payment-failed",
    version: "2.00"
  };

  // Build signature string
  const signatureString = Object.keys(request)
    .sort()
    .map((key) => `${key}=${request[key]}`)
    .join("&");

  // Create signature
  const signature = crypto
    .createHmac("sha512", secret)
    .update(signatureString)
    .digest("hex");

  // Add signature to request
  request.signature = signature;

  // Build auto-submitting form
  const formFields = Object.entries(request)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
    .join("");

  const html = `
    <html>
      <body onload="document.forms[0].submit()">
        <form action="https://gateway.cardstream.com/hosted/" method="POST">
          ${formFields}
        </form>
      </body>
    </html>
  `;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: html,
  };
};
