import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Home directory has stray lockfiles; pin the app root so Turbopack doesn't walk past this project.
  turbopack: {
    root: path.join(__dirname),
  },
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
