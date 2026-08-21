# First Pacific Bank - Secure APK Distribution Repository

Place your production-ready compiled APK files (e.g., `First-Pacific-Bank-Secure-v1.2.apk`) in this directory.

During the production deployment (`npm run build`), the build system copies everything in the `public` folder to the `dist` distribution folder. The Express web server (`server.ts`) will then securely serve these files to your clients.

## Current Configuration URL
The application is pre-configured to look for updates at:
`https://<your-deployed-domain>/download/First-Pacific-Bank-Secure-v1.2.apk`

When you release a new version of the APK:
1. Update `/public/apk-version.json` with the new version code, description, and APK name.
2. Build and sign your APK with your Keystore.
3. Drop the signed APK file right here into `/public/download/`.
4. Deploy the updated server build.
