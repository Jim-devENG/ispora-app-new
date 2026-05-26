# Ispora Auth Email Branding Setup

Use these settings in **Supabase Dashboard -> Authentication**.

## 1) URL Configuration

- `Site URL`: `https://ispora.app`
- `Additional Redirect URLs`:
  - `https://ispora.app/**`
  - `https://www.ispora.app/**`
  - `http://localhost:5173/**` (optional for local dev)

## 2) SMTP / Sender Branding

In **Authentication -> SMTP Settings**:

- `Sender Name`: `Ispora`
- `Sender Email`: a verified domain email like `no-reply@ispora.app`
- Configure custom SMTP provider (Resend, SES, Postmark, etc.)

Without custom SMTP, messages may still appear with Supabase-default branding and delivery limits.

## 3) Reset Password Template

In **Authentication -> Email Templates -> Reset Password**:

- `Subject`: `Reset your Ispora password`
- `Content`: use `supabase/templates/password-recovery.html`

Important:

- Keep the CTA URL as `{{ .ConfirmationURL }}`.
- Do not replace with `{{ .SiteURL }}`.

`{{ .ConfirmationURL }}` preserves the recovery token and the `redirectTo` value set by the app/backend.
