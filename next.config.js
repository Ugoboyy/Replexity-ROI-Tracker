/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Force clean output on every build so stale .next artefacts
     from OneDrive sync never cause compile / HMR errors.        */
  cleanDistDir: true,
};

module.exports = nextConfig;
