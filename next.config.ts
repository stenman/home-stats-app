import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.68.60"],
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
