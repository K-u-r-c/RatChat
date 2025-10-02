using System.Net;
using System.Text;
using Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Resend;

namespace Infrastructure.Email;

public class EmailSender(IResend resend, IConfiguration configuration) : IEmailSender<User>
{
    public async Task SendConfirmationLinkAsync(User user, string email, string confirmationLink)
    {
        var displayName = GetDisplayName(user, email);
        var subject = "RatChat — Confirm your email";
        var preheader = "Finish setting up your RatChat account.";

        var body = BuildEmailTemplate(
            subject,
            preheader,
            $"Welcome to RatChat, {displayName}!",
            new[]
            {
                $"Hi {displayName},",
                "Thanks for joining RatChat. Confirming your email helps us secure your account and tailor the experience just for you.",
                "Click the button below to verify your email and start exploring your new workspace."
            },
            "Confirm email",
            confirmationLink,
            "If you didn't create this RatChat account, you can safely ignore this message.",
            "RatChat will never ask for your password or security codes over email."
        );

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPasswordResetCodeAsync(User user, string email, string resetCode)
    {
        var displayName = GetDisplayName(user, email);
        var subject = "RatChat — Reset your password";
        var preheader = "Use this link to reset your RatChat password.";

        var resetUrl = $"{configuration["ClientAppUrl"]}/reset-password?email={WebUtility.UrlEncode(email)}&code={WebUtility.UrlEncode(resetCode)}";

        var body = BuildEmailTemplate(
            subject,
            preheader,
            "Reset your RatChat password",
            new[]
            {
                $"Hi {displayName},",
                "We received a request to reset the password for your RatChat account.",
                "Choose a new password using the button below. For your security, this link only works for a limited time."
            },
            "Reset password",
            resetUrl,
            "If you didn't request a password reset, you can safely ignore this email.",
            "RatChat will never ask for your password or security codes over email."
        );

        await SendEmailAsync(email, subject, body);
    }

    public Task SendPasswordResetLinkAsync(User user, string email, string resetLink)
    {
        throw new NotImplementedException();
    }

    private async Task SendEmailAsync(string email, string subject, string body)
    {
        var message = new EmailMessage
        {
            From = "noreply@rat-chat.com",
            Subject = subject,
            HtmlBody = body,
        };
        message.To.Add(email);

        await resend.EmailSendAsync(message);
    }

    private static string GetDisplayName(User user, string fallbackEmail)
    {
        return string.IsNullOrWhiteSpace(user.DisplayName)
            ? fallbackEmail
            : user.DisplayName.Trim();
    }

    private static string BuildEmailTemplate(
        string subject,
        string preheader,
        string headline,
        IEnumerable<string> bodyParagraphs,
        string ctaText,
        string ctaUrl,
        string? secondaryNotice,
        string? footerNote)
    {
        var safeSubject = WebUtility.HtmlEncode(subject);
        var safePreheader = WebUtility.HtmlEncode(preheader);
        var safeHeadline = WebUtility.HtmlEncode(headline);
        var safeCtaText = WebUtility.HtmlEncode(ctaText);
        var safeCtaUrl = WebUtility.HtmlEncode(ctaUrl);

        var sanitizedParagraphs = new List<string>();

        foreach (var paragraph in bodyParagraphs)
        {
            if (string.IsNullOrWhiteSpace(paragraph))
            {
                continue;
            }

            sanitizedParagraphs.Add(WebUtility.HtmlEncode(paragraph.Trim()));
        }

        var footerText = string.IsNullOrWhiteSpace(footerNote)
            ? "RatChat will never ask for your password or security codes over email."
            : footerNote.Trim();
        var safeFooter = WebUtility.HtmlEncode(footerText);

        var template = new StringBuilder();
        template.AppendLine("<!DOCTYPE html>");
        template.AppendLine("<html lang=\"en\">");
        template.AppendLine("  <head>");
        template.AppendLine("    <meta charset=\"utf-8\">");
        template.AppendLine("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">");
        template.Append("    <title>").Append(safeSubject).AppendLine("</title>");
        template.AppendLine("  </head>");
        template.AppendLine("  <body style=\"margin:0;padding:0;background-color:#f3f4f6;\">");
        template
            .Append("    <div style=\"display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;\">")
            .Append(safePreheader)
            .AppendLine("</div>");
        template.AppendLine("    <table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"background-color:#f3f4f6;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;\">");
        template.AppendLine("      <tr>");
        template.AppendLine("        <td align=\"center\" style=\"padding:32px 16px;\">");
        template.AppendLine("          <table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"600\" style=\"max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.18);\">");
        template.AppendLine("            <tr>");
        template.AppendLine("              <td style=\"background:linear-gradient(135deg,#1f2937,#111827);padding:32px;text-align:center;\">");
        template.AppendLine("                <span style=\"display:block;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:4px;text-transform:uppercase;\">RatChat</span>");
        template.Append("                <span style=\"display:block;margin-top:8px;font-size:14px;color:#e5e7eb;\">")
            .Append(safePreheader)
            .AppendLine("</span>");
        template.AppendLine("              </td>");
        template.AppendLine("            </tr>");
        template.AppendLine("            <tr>");
        template.AppendLine("              <td style=\"padding:32px;\">");
        template.Append("                <h1 style=\"margin:0 0 16px;font-size:24px;color:#111827;font-weight:700;\">")
            .Append(safeHeadline)
            .AppendLine("</h1>");

        foreach (var paragraph in sanitizedParagraphs)
        {
            template.Append("                <p style=\"margin:0 0 20px; color:#1f2937; font-size:16px; line-height:1.55;\">")
                .Append(paragraph)
                .AppendLine("</p>");
        }

        template.AppendLine("                <table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin:0 0 32px;\">");
        template.AppendLine("                  <tr>");
        template.AppendLine("                    <td bgcolor=\"#5865f2ff\" style=\"border-radius:12px;\">");
        template.Append("                      <a href=\"").Append(safeCtaUrl).Append("\" style=\"display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;\">")
            .Append(safeCtaText)
            .AppendLine("</a>");
        template.AppendLine("                    </td>");
        template.AppendLine("                  </tr>");
        template.AppendLine("                </table>");

        if (!string.IsNullOrWhiteSpace(secondaryNotice))
        {
            var safeSecondary = WebUtility.HtmlEncode(secondaryNotice.Trim());
            template.Append("                <p style=\"margin:0 0 24px; color:#4b5563; font-size:15px; line-height:1.55;\">")
                .Append(safeSecondary)
                .AppendLine("</p>");
        }

        template.AppendLine("                <p style=\"margin:0 0 12px;color:#6b7280;font-size:14px;\">If the button above does not work, copy and paste the link below into your browser:</p>");
        template.Append("                <p style=\"margin:0 0 32px;font-size:13px;color:#ff6b6b;word-break:break-all;\"><a href=\"")
            .Append(safeCtaUrl)
            .Append("\" style=\"color:#ff6b6b;text-decoration:none;\">")
            .Append(safeCtaUrl)
            .AppendLine("</a></p>");
        template.AppendLine("                <hr style=\"border:none;border-top:1px solid #e5e7eb;margin:32px 0;\"/>");
        template.Append("                <p style=\"margin:0;color:#9ca3af;font-size:12px;line-height:1.6;\">")
            .Append(safeFooter)
            .AppendLine("</p>");
        template.AppendLine("              </td>");
        template.AppendLine("            </tr>");
        template.AppendLine("          </table>");
        template.AppendLine("          <p style=\"margin:24px 0 0;color:#9ca3af;font-size:12px;\">You're receiving this email because you have a RatChat account.</p>");
        template.AppendLine("        </td>");
        template.AppendLine("      </tr>");
        template.AppendLine("    </table>");
        template.AppendLine("  </body>");
        template.AppendLine("</html>");

        return template.ToString();
    }
}
