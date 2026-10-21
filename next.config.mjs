/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // Old portal URLs now live under /portal. Keep bookmarks and links working.
    return [
      { source: "/login", destination: "/portal/login", permanent: true },
      { source: "/admin", destination: "/portal/admin", permanent: true },
      { source: "/admin/:path*", destination: "/portal/admin/:path*", permanent: true },
      { source: "/teacher", destination: "/portal/teacher", permanent: true },
      { source: "/teacher/:path*", destination: "/portal/teacher/:path*", permanent: true },
      { source: "/student", destination: "/portal/student", permanent: true },
      { source: "/student/:path*", destination: "/portal/student/:path*", permanent: true },
    ];
  },
  images: { remotePatterns: [] },
};

export default nextConfig;
