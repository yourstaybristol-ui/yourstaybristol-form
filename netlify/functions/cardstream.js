const crypto = require("crypto");
const querystring = require("querystring");

exports.handler = async (event) => {
  // Parse form-encoded body
  const { amount, orderRef } = querystring.parse(event.body || "");

  const merchantID = "testmerchant";
  const secret = process.env.CARDSTREAM_SECRET;
  const currencyCode = "826"; // GBP
  const action = "SALE";

  const request = {
    merchantID,
    action,
    amount,
    currencyCode,
    orderRef,
    type: "card",
    countryCode: "826",
    transactionUnique: orderRef,
    redirectURL: "https://yourstaybristol-form.netlify.app/thanks.html",
    callbackURL: "https://yourstaybristol-form.netlify.app/callback",
  };

  // Create signature
  const signatureString = Object.keys(request)
    .sort()
    .map((key) => `${key}=${request[key]}`)
    .join("&");

  const signature = crypto
    .createHmac("sha512", secret)
    .update(signatureString)
    .digest("hex");

  request.signature = signature;

  // Build auto-submitting form
  const formFields = Object.entries(request)
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${key}" value="${value}" />`
    )
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
