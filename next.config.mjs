/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for the Docker self-host deployment (same pattern as
  // Dragon's Ledger): `node .next/standalone/server.js` serves the app.
  output: "standalone",
  reactStrictMode: true,
};

export default nextConfig;
