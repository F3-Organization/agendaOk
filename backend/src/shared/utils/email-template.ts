import { env } from "../../infra/config/configs";
import { t, type Locale } from "../i18n";

const BRAND_BLUE = "#1d4ed8";
const BRAND_BLUE_DARK = "#1e3a8a";
const BRAND_GREEN = "#16a34a";

export function buildEmailTemplate(content: string, locale: Locale = "pt"): string {
    const companyName = env.company.name;
    const supportWhatsapp = env.company.supportWhatsapp;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${companyName}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,${BRAND_BLUE_DARK},${BRAND_BLUE});border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                    <span style="font-size:20px;line-height:40px;">⚡</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="font-size:20px;font-weight:700;color:${BRAND_BLUE};letter-spacing:-0.5px;">${companyName}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:40px 36px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 8px;color:#94a3b8;font-size:12px;line-height:1.6;">
              <p style="margin:0 0 4px;">${t(locale, "email.footer.help")}
                <a href="https://wa.me/${supportWhatsapp}" style="color:${BRAND_BLUE};text-decoration:none;font-weight:600;">${t(locale, "email.footer.whatsapp")}</a>.
              </p>
              <p style="margin:0;color:#cbd5e1;">© ${new Date().getFullYear()} ${companyName}. ${t(locale, "email.footer.rights")}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailHeading(text: string): string {
    return `<h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">${text}</h2>`;
}

export function emailText(text: string): string {
    return `<p style="margin:0 0 14px;font-size:15px;color:#475569;line-height:1.65;">${text}</p>`;
}

export function emailInfoBox(rows: Array<[string, string]>): string {
    const rowsHtml = rows.map(([label, value]) =>
        `<tr>
          <td style="padding:6px 0;color:#64748b;font-size:14px;width:40%;">${label}</td>
          <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${value}</td>
        </tr>`
    ).join('');
    return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;">
      <tbody>${rowsHtml}</tbody>
    </table>`;
}

export function emailHighlightBox(text: string, type: 'info' | 'success' | 'warning' = 'info'): string {
    const styles = {
        info:    { bg: '#eff6ff', border: BRAND_BLUE,    icon: 'ℹ️' },
        success: { bg: '#f0fdf4', border: BRAND_GREEN,   icon: '✅' },
        warning: { bg: '#fefce8', border: '#ca8a04',     icon: '⚠️' },
    };
    const s = styles[type];
    return `<div style="margin:20px 0;padding:16px 20px;background:${s.bg};border-left:4px solid ${s.border};border-radius:6px;font-size:14px;color:#334155;line-height:1.6;">
      ${s.icon}&nbsp; ${text}
    </div>`;
}

export function emailButton(label: string, url: string): string {
    return `<div style="margin:24px 0;">
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,${BRAND_BLUE_DARK},${BRAND_BLUE});color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">${label}</a>
    </div>`;
}

export function emailCodeBlock(code: string): string {
    return `<div style="margin:24px 0;text-align:center;">
      <span style="display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;padding:16px 32px;font-size:36px;font-weight:800;letter-spacing:12px;color:${BRAND_BLUE};font-family:monospace;">${code}</span>
    </div>`;
}

export function emailDivider(): string {
    return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;
}
