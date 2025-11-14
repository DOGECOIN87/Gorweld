<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ifSQDa2bYpxmDmNqouqOG5teOk5TwiPg

Official docs: https://docs.gorbagana.wtf/

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Gorbagana testnet configuration

The Three.js landfill scene, network console, and launch overlays are pre-wired for the Gorbagana testnet.  If you need to double-check the values surfaced inside the UI, here are the authoritative settings used throughout the codebase:

| Setting | Value |
| --- | --- |
| Network | Gorbagana Testnet |
| Chain ID | `19011` |
| RPC | `https://rpc.gorbagana.wtf` |
| Explorer | `https://scan.testnet.gorbagana.org` |
| Faucet | `https://faucet.gorbagana.org` |
| NFT Contract | `0xa8E205Bba819F5f149048393c5AA3afc39B1CDC1` |
| Treasury / Funding Wallet | `0x7Bb4de61a63fDB142A0B305d5eCdbeDB9342D0D4` |

The funding wallet above is the address that needs to be topped up with testnet $GOR before you trigger a deployment or run a fresh mint session.

## Deploying / sharing

1. Run `npm run build` to produce a static bundle under `dist/`.
2. Deploy the contents of `dist/` to your preferred static host (Cloudflare Pages, Vercel, etc.).
3. Before going live, make sure the Gorbagana faucet transaction hits `0x7Bb4de61a63fDB142A0B305d5eCdbeDB9342D0D4` so the network overlays can report a fueled launch site.
