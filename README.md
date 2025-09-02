# CyberSecElite, LLC — Company Website

This repository contains the public website for **CyberSecElite, LLC**, a U.S.-based cybersecurity consulting firm headquartered in **North Dakota, USA**.

---

## 🛡️ What We Do

CyberSecElite helps organizations protect their digital assets, strengthen defenses, and respond effectively to cyber threats. Core services:

- Security Assessments & Penetration Testing
- Application Security Assessments (Web/Mobile, SDLC, code review)
- Compromise Assessments
- Incident Response & Digital Forensics
- Malware Analysis
- Data & Network Security
- Security Training Programs
- Consulting & Advisory

---

## 🌐 Company Profile

- Headquarters: North Dakota, USA
- Founder & CEO: Mr. Diyorbek Juraev
- Mission: Trusted, research‑driven, client‑tailored cybersecurity services

---

## 🗂️ Site Structure

- `index.html` — Home (hero, services overview, industries served)
- `services.html` — Full service catalog (Assessments, AppSec, IR/Forensics, Malware, Data/Network, Training, Advisory)
- `about.html` — Company profile, founder bio, differentiators, core services summary
- `contact.html` — Consultation CTA and contact details
- `blog.html` — Insights pulled from Medium via RSS (rss2json)
- `experience.html`, `projects.html` — Background and case study placeholders
- `css/style.css`, `js/script.js` — Styling and minimal interactivity/animations
- `.well-known/security.txt` — Vulnerability disclosure contact and policy

Hosted via GitHub Pages with custom domain `www.cybersecelite.com` (see `CNAME`).

---

## 🔒 Security Hardening

- Strict Content Security Policy (no inline scripts; `frame-ancestors 'none'`, `base-uri 'none'`, `object-src 'none'`, `upgrade-insecure-requests`)
- Tight Permissions-Policy and `X-Content-Type-Options: nosniff`
- Referrer Policy: `strict-origin-when-cross-origin`
- External resources limited to Google Fonts and Medium image hosts; RSS via `api.rss2json.com`
- `security.txt` published at `/.well-known/security.txt`
- Console debug logging removed from production JS

Theme is permanently dark; the theme toggle was removed to reduce surface area and simplify UX.

To report a security issue, email: `diorjuraev@cybersecelite.com`.

---

## 📫 Contact

- 🌍 Website: [www.cybersecelite.com](https://www.cybersecelite.com)
- 📧 Email: diorjuraev@cybersecelite.com
- 🐙 GitHub: [github.com/diorjuraev](https://github.com/diorjuraev)

## 💻 Local Development

- Open `index.html` directly in a browser, or serve locally:
  - Python: `python3 -m http.server 8080`
  - Node: `npx serve .`
- No build step required. This is a static site using HTML/CSS/JS.

---

## 📄 License

MIT License. See `LICENSE` file for more info.

---

Thanks for stopping by!

**Stay Secure. Stay Elite.**
