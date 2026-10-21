# Free GitHub release hosting

The current unsigned preview is now published at https://github.com/muhammadfarhan138223-cmyk/saras-next-downloads/releases/tag/v0.2.0-dev.10. The website manifest points to the verified single Setup asset. The preparation instructions below describe the owner release workspace and are for future releases; hosting scripts are supplied in SARAS-Release-Hosting-Tools.zip, not required by end users.

The owner accepted an unsigned preview. Windows may show Unknown publisher or SmartScreen warnings. No antivirus exception is installed or recommended.

Run work/Prepare GitHub Release.cmd from the workspace. Browser authorization is required. It verifies the final installer and prepares a private saras-next-downloads repository and draft prerelease. Nothing is published automatically.

After reviewing the evidence and approving publication, make the repository public and publish the draft. Copy the public EXE asset URL. Run Configure Download.cmd in this website folder and paste that URL. The script downloads the entire asset and verifies its exact SHA-256 and size before enabling the public download link. Then deploy the existing website to Vercel after approval, with SITE_URL set to the final HTTPS domain. Download requires no login; email updates are optional.

Use the actual unsigned-preview Setup EXE, never the internal developer payload ZIP. Binaries are hosted on GitHub, separately from the small Vercel project. The local preview can serve the verified local EXE; that override is ignored on Vercel. API and binary downloads are excluded from the offline cache.

Users install one Setup EXE. Python and dependencies are bundled. Users enter their own AI credentials. Windows English speech is available; other languages require supported installed Windows voices. Personal voice models are not bundled. Phone control requires private networking or a supported HTTPS backend plus authenticated pairing and permissions; installing the marketing PWA alone grants no PC access.

Separate clean Windows, real microphone/phone/provider acceptance and independent review remain external checks. This is an unsigned preview, not a certified stable release. Uninstall removes code and local paired access while retaining chats/provider settings.
