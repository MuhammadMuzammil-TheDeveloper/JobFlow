export const emailVerificationTemplate = (userObj, otp) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your CareerFlow Account</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f6f7fb;
  font-family: Arial, Helvetica, sans-serif;
  color: #172033;
">

  <div style="
    max-width: 600px;
    margin: 40px auto;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  ">

    <!-- Header -->
    <div style="
      padding: 28px;
      text-align: center;
      background: #ffffff;
      border-bottom: 1px solid #eeeeee;
    ">
      <h1 style="
        margin: 0;
        font-size: 28px;
        color: #4f46e5;
      ">
        Career<span style="color:#172033;">Flow</span>
      </h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 35px;">

      <h2 style="
        margin-top: 0;
        font-size: 24px;
      ">
        Verify your email 👋
      </h2>

      <p style="
        font-size: 16px;
        line-height: 1.6;
        color: #5f6778;
      ">
        Hi ${userObj.fullName},
      </p>

      <p style="
        font-size: 16px;
        line-height: 1.6;
        color: #5f6778;
      ">
        Welcome to CareerFlow! To complete your account setup,
        please verify your email address using the OTP below.
      </p>

      <!-- OTP -->
      <div style="
        margin: 30px 0;
        padding: 22px;
        text-align: center;
        background: #f1f2ff;
        border-radius: 12px;
      ">

        <p style="
          margin: 0 0 8px;
          font-size: 13px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1px;
        ">
          Your verification code
        </p>

        <div style="
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #4f46e5;
        ">
          ${otp}
        </div>

      </div>

      <p style="
        font-size: 14px;
        line-height: 1.6;
        color: #6b7280;
      ">
        This OTP will expire in <strong>10 minutes</strong>.
        Please do not share this code with anyone.
      </p>

      <p style="
        font-size: 16px;
        line-height: 1.6;
        color: #5f6778;
      ">
        If you didn't create a CareerFlow account, you can safely
        ignore this email.
      </p>

      <p style="
        margin-top: 35px;
        font-size: 16px;
        color: #172033;
      ">
        Best regards,<br />
        <strong>CareerFlow Team</strong>
      </p>

    </div>

    <!-- Footer -->
    <div style="
      padding: 22px;
      text-align: center;
      background: #f8f9fc;
      border-top: 1px solid #eeeeee;
    ">

      <p style="
        margin: 0;
        font-size: 12px;
        color: #8a91a1;
      ">
        © 2026 CareerFlow. All rights reserved.
      </p>

      <p style="
        margin: 8px 0 0;
        font-size: 12px;
        color: #8a91a1;
      ">
        Your career. Your applications. One flow.
      </p>

    </div>

  </div>

</body>
</html>
  `;
};