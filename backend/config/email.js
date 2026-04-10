const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

// ── Forgot Password Email Template ────────────────────────────────────────
const sendPasswordResetEmail = async ({ toEmail, toName, resetUrl }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to:   toEmail,
      subject: 'Reset your Excel By PYQ password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

                    <!-- Logo -->
                    <tr>
                      <td align="center" style="padding-bottom:28px;">
                        <div style="display:inline-flex;align-items:center;gap:8px;">
                          <div style="width:36px;height:36px;background:#3b82f6;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
                            <span style="color:white;font-size:18px;font-weight:900;">E</span>
                          </div>
                          <span style="font-size:20px;font-weight:900;color:#1e293b;">
                            Excel By<span style="color:#3b82f6;">PYQ</span>
                          </span>
                        </div>
                      </td>
                    </tr>

                    <!-- Card -->
                    <tr>
                      <td style="background:white;border-radius:20px;padding:40px;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

                        <!-- Icon -->
                        <div style="text-align:center;margin-bottom:24px;">
                          <div style="width:60px;height:60px;background:#eff6ff;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">
                            🔐
                          </div>
                        </div>

                        <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
                          Reset your password
                        </h1>
                        <p style="margin:0 0 24px;color:#64748b;font-size:15px;text-align:center;line-height:1.6;">
                          Hey ${toName}, we received a request to reset your password. Click the button below to create a new one.
                        </p>

                        <!-- Button -->
                        <div style="text-align:center;margin-bottom:24px;">
                          <a
                            href="${resetUrl}"
                            style="display:inline-block;background:#3b82f6;color:white;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;box-shadow:0 4px 12px rgba(59,130,246,0.35);"
                          >
                            Reset Password
                          </a>
                        </div>

                        <!-- Expiry note -->
                        <p style="margin:0 0 24px;color:#94a3b8;font-size:13px;text-align:center;">
                          This link expires in <strong>15 minutes</strong>.
                        </p>

                        <hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 20px;" />

                        <!-- Fallback URL -->
                        <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;line-height:1.6;">
                          If the button doesn't work, copy and paste this link:<br />
                          <a href="${resetUrl}" style="color:#3b82f6;word-break:break-all;">${resetUrl}</a>
                        </p>

                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding-top:24px;text-align:center;">
                        <p style="margin:0;color:#94a3b8;font-size:12px;">
                          If you didn't request this, you can safely ignore this email.<br />
                          © ${new Date().getFullYear()} Excel By PYQ. Made for Indian students.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>

          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('Email send failed:', err)
    return { success: false, error: err }
  }
}

// ── Feedback notification to admin ────────────────────────────────────────
const sendFeedbackNotification = async ({ name, email, type, subject, message }) => {
  try {
    const typeLabels = {
      feedback:   '💬 General Feedback',
      bug:        '🐛 Bug Report',
      suggestion: '💡 Suggestion',
      other:      '📌 Other',
    }

    const { data, error } = await resend.emails.send({
      from:    process.env.EMAIL_FROM,
      to:      process.env.ADMIN_EMAIL || process.env.EMAIL_FROM,
      subject: `[Excel By PYQ] New ${typeLabels[type] || 'Feedback'}: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
              <tr><td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

                  <!-- Logo -->
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <span style="font-size:20px;font-weight:900;color:#1e293b;">
                        Excel By<span style="color:#3b82f6;">PYQ</span>
                        <span style="font-size:13px;color:#64748b;font-weight:500;"> · Admin Notification</span>
                      </span>
                    </td>
                  </tr>

                  <!-- Card -->
                  <tr>
                    <td style="background:white;border-radius:20px;padding:32px;border:1px solid #e2e8f0;">

                      <div style="background:#eff6ff;border-radius:12px;padding:4px 12px;display:inline-block;margin-bottom:20px;">
                        <span style="color:#3b82f6;font-size:13px;font-weight:700;">
                          ${typeLabels[type] || '📌 Feedback'}
                        </span>
                      </div>

                      <h2 style="margin:0 0 4px;font-size:18px;font-weight:800;color:#1e293b;">
                        ${subject}
                      </h2>
                      <p style="margin:0 0 24px;color:#64748b;font-size:13px;">
                        From: <strong>${name}</strong> (${email})
                      </p>

                      <div style="background:#f8fafc;border-radius:12px;padding:16px;border-left:4px solid #3b82f6;margin-bottom:24px;">
                        <p style="margin:0;color:#334155;font-size:14px;line-height:1.7;white-space:pre-wrap;">${message}</p>
                      </div>

                      <p style="margin:0;color:#94a3b8;font-size:12px;">
                        Submitted on ${new Date().toLocaleString('en-IN')}
                      </p>
                    </td>
                  </tr>

                </table>
              </td></tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) return { success: false, error }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err }
  }
}

// ── Feedback confirmation to user ─────────────────────────────────────────
const sendFeedbackConfirmation = async ({ toEmail, toName, subject }) => {
  try {
    const { data, error } = await resend.emails.send({
      from:    process.env.EMAIL_FROM,
      to:      toEmail,
      subject: 'We received your message — Excel By PYQ',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
              <tr><td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <span style="font-size:20px;font-weight:900;color:#1e293b;">
                        Excel By <span style="color:#3b82f6;">PYQ</span>
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td style="background:white;border-radius:20px;padding:36px;border:1px solid #e2e8f0;text-align:center;">
                      <div style="font-size:40px;margin-bottom:16px;">📬</div>
                      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1e293b;">
                        Thanks, ${toName}!
                      </h2>
                      <p style="margin:0 0 16px;color:#64748b;font-size:14px;line-height:1.6;">
                        We've received your message about<br/>
                        <strong style="color:#1e293b;">"${subject}"</strong>
                      </p>
                      <p style="margin:0 0 24px;color:#94a3b8;font-size:13px;line-height:1.6;">
                        Our team will look into it and get back to you if needed. We typically respond within 1–2 business days.
                      </p>
                      <div style="background:#f0fdf4;border-radius:12px;padding:14px;border:1px solid #bbf7d0;">
                        <p style="margin:0;color:#15803d;font-size:13px;font-weight:600;">
                          ✅ Message received successfully
                        </p>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-top:20px;text-align:center;">
                      <p style="margin:0;color:#94a3b8;font-size:11px;">
                        © ${new Date().getFullYear()} Excel By PYQ · Made for Indian students
                      </p>
                    </td>
                  </tr>

                </table>
              </td></tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) return { success: false, error }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err }
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendFeedbackNotification,
  sendFeedbackConfirmation,
}
