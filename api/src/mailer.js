import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendConfirmationEmail(to, { fullName, registrationId }) {
  return transporter.sendMail({
    from: `"YAYA65 On Eagle's Wings" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your YAYA65 \"On Eagle's Wings\" Registration ID",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#142a5e;">On Eagle's Wings — Lagos Province 65</h2>
        <p>Hi ${fullName},</p>
        <p>You're registered for the 2026 Youth Convention. Your unique registration ID is:</p>
        <p style="font-size:22px; font-weight:bold; background:#0a1226; color:#f3d48a; padding:14px; border-radius:8px; text-align:center;">${registrationId}</p>
        <p>Please save this ID — you'll need to enter it at the venue check-in point to mark your attendance.</p>
        <p><strong>Dates:</strong> 25th &amp; 26th September, 2026<br/>
        <strong>Venue:</strong> No. 1 Kadiri Street, behind Total Filling Station, by Fadeyi BRT Bus Stop, Fadeyi, Lagos.</p>
        <p>See you there!</p>
      </div>
    `,
  })
}
