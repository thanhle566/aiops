const { withSentryConfig } = require("@sentry/nextjs");

const isWithTurbo = process.env.NEXT_TURBO === "true";
const isSentryDisabled =
  process.env.SENTRY_DISABLED === "true" ||
  process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    // Only apply proxy configuration for Node.js server runtime
    if (isServer) {
      console.log(` 🔐 AUTH_TYPE=${process.env.AUTH_TYPE}`);
      console.log(` 🔐 AUTH_DEBUG=${process.env.AUTH_DEBUG}`);
    }
    if (isServer && nextRuntime === "nodejs") {
      // Add environment variables for proxy at build time
      config.plugins.push(
        new webpack.DefinePlugin({
          "process.env.IS_NODEJS_RUNTIME": JSON.stringify(true),
        })
      );
    } else {
      // For edge runtime and client
      config.plugins.push(
        new webpack.DefinePlugin({
          "process.env.IS_NODEJS_RUNTIME": JSON.stringify(false),
        })
      );
    }

    // Ignore warnings about critical dependencies, since they are not critical
    // https://github.com/getsentry/sentry-javascript/issues/12077#issuecomment-2407569917
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /require-in-the-middle/,
        message: /Critical dependency/,
      },
      {
        module: /@opentelemetry\/instrumentation/,
        message: /Critical dependency/,
      },
      {
        module: /@prisma\/instrumentation/,
        message: /Critical dependency/,
      },
    ];
    return config;
  },
  // @auth/core is ESM-only and jest fails to transpile it.
  // https://github.com/nextauthjs/next-auth/issues/6822
  transpilePackages: ["next-auth", "@auth/core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "s.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
      },
    ],
  },
  // compiler is not supported in turbo mode
  compiler: isWithTurbo
    ? undefined
    : {
        removeConsole: false,
      },
  output: "standalone",
  productionBrowserSourceMaps: !isSentryDisabled,
  async redirects() {
    const workflowRawYamlRedirects = [
      {
        source: "/workflows/:path*.yaml",
        destination: "/raw/workflows/:path*.yaml",
        permanent: false,
      },
    ];
    return process.env.DISABLE_REDIRECTS === "true"
      ? []
      : [
          {
            source: "/",
            destination: "/incidents",
            permanent: process.env.ENV === "production",
          },
          ...workflowRawYamlRedirects,
        ];
  },
  async headers() {
    // Allow Keycloak Server as a CORS origin since we use SSO wizard as iframe
    const keycloakIssuer = process.env.KEYCLOAK_ISSUER;
    const keycloakServer = keycloakIssuer
      ? keycloakIssuer.split("/auth")[0]
      : "http://localhost:8181";
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: keycloakServer,
          },
        ],
      },
    ];
  },
  rewrites: async () => {
    // do not leak source-maps in Vercel production deployments
    // but keep them in Vercel preview deployments with generated urls
    // for better dev experience
    // https://stackoverflow.com/a/70989748/12012756
    const isVercelProdDeploy =
      process.env.VERCEL_ENV === "production" ||
      process.env.NODE_ENV === "production";

    if (isVercelProdDeploy) {
      return {
        beforeFiles: [
          {
            source: "/:path*.map",
            destination: "/404",
          },
        ],
      };
    }

    return [];
  },
};

const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "keep-hq",
  project: "techhala-ui",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  sourceMaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
};

// Compose the final config
let config = nextConfig;

// Add Sentry if enabled
if (!isSentryDisabled) {
  config = withSentryConfig(config, sentryConfig);
}

// Add Bundle Analyzer only when analysis is requested
if (process.env.ANALYZE === "true") {
  config = require("@next/bundle-analyzer")({
    enabled: true,
  })(config);
}

module.exports = config;
