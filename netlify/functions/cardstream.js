const crypto = require("crypto");
const querystring = require("querystring");

exports.handler = async (event) => {
  // Parse form-encoded body (amount=100&orderRef=YSB-TEST-001)
  const { amount, orderRef } = querystring.parse(event.body || "");

  // Replace with your actual merchant ID
  const merchantID = "283320"; 
  const secret = process.env.CARDSTREAM_SECRET; // set in Netlify env vars
  const currencyCode = "826"; // GBP
  const action = "SALE";

  // Build request payload
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

  // Build signature string from sorted keys
  const signatureString = Object.keys(request)
    .sort()
    .map((key) => `${key}=${request[key]}`)
    .join("&");

  // Generate signature
  const signature = crypto
    .createHmac("sha512", secret)
    .update(signatureString)
    .digest("hex");

  // Add signature to request
  request.signature = signature;

  // Debug block to show payload before redirect
  const debugBlock = `
    <h2>Debug Payload Preview</h2>
    <pre style="font-size: 14px; background: #f4f4f4; padding: 1em; border: 1px solid #ccc;">
${Object.entries(request).map(([k,v]) => `${k}=${v}`).join("\n")}
    </pre>
    <p>Redirecting to Cardstream in 5 seconds…</p>
    <script>
      setTimeout(() => {
        document.forms[0].submit();
      }, 5000);
    </script>
  `;

  // Build auto-submitting form
  const formFields = Object.entries(request)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
    .join("");

  const html = `
    <html>
      <body>
        ${debugBlock}
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
