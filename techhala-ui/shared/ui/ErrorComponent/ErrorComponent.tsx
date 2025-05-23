// The error.js file convention allows you to gracefully handle unexpected runtime errors.
// The way it does this is by automatically wrap a route segment and its nested children in a React Error Boundary.
// https://nextjs.org/docs/app/api-reference/file-conventions/error
// https://nextjs.org/docs/app/building-your-application/routing/error-handling#how-errorjs-works

"use client";
import { useEffect } from "react";
import { Title, Subtitle } from "@tremor/react";
import { Button, Text } from "@tremor/react";
import { KeepApiError } from "@/shared/api";
import * as Sentry from "@sentry/nextjs";
import { useSignOut } from "@/shared/lib/hooks/useSignOut";
import { KeepApiHealthError } from "@/shared/api/KeepApiError";
import { useHealth } from "@/shared/lib/hooks/useHealth";
import { KeepLogoError } from "@/shared/ui/KeepLogoError";
import { useConfig } from "utils/hooks/useConfig";

export function ErrorComponent({
  error: originalError,
  description,
  reset,
}: {
  error: Error | KeepApiError;
  description?: string;
  reset?: () => void;
}) {
  const signOut = useSignOut();
  const { isHealthy } = useHealth();
  const { data: config } = useConfig();

  const contactUsUrl =
    config?.KEEP_CONTACT_US_URL || "https://slack.techhala.com/";

  useEffect(() => {
    Sentry.captureException(originalError);
  }, [originalError]);

  const error = isHealthy ? originalError : new KeepApiHealthError();
  const subtitle =
    error instanceof KeepApiError
      ? error.proposedResolution || description
      : (description ?? null);

  return (
    <div className="flex min-w-0 w-auto mx-auto shrink flex-col items-center justify-center h-full text-center gap-4">
      <KeepLogoError />
      <div className="max-w-md">
        <Title className="text-xl font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong">
          {error.message || "An error occurred"}
        </Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </div>
      {error && (
        <code className="text-gray-600 text-left bg-gray-100 p-2 rounded-md">
          {error instanceof KeepApiError && (
            <>
              {error.statusCode && <p>Status Code: {error.statusCode}</p>}
              {error.message && <p>Message: {error.message}</p>}
              {error.url && <p>URL: {error.url}</p>}
            </>
          )}
          {error.stack && (
            <details>
              <summary>Stack</summary>
              {error.stack.split("\n").map((line, i) => (
                <div key={`${i}-${line.trim()}`}>{line}</div>
              ))}
            </details>
          )}
        </code>
      )}
      <div className="flex gap-2">
        {error instanceof KeepApiError && error.statusCode === 401 ? (
          <Button onClick={signOut} 
            className="bg-[#243E40] text-white hover:bg-[#34595c] transition-all duration-200 hover:text-white hover:font-medium relative group"
            variant="secondary"
          >
            <Text>Sign Out</Text>
          </Button>
        ) : (
          <Button
            onClick={() => {
              if (reset) {
                reset();
              } else {
                window.location.reload();
              }
            }}
            className="bg-[#243E40] text-white hover:bg-[#34595c] transition-all duration-200 hover:text-white hover:font-medium relative group"
            // color="teal"
            variant="primary"
          >
            Try again
          </Button>
        )}{" "}
        <Button
          className="hover:bg-[#34595c] transition-all duration-200 hover:text-white hover:font-medium relative group"
          variant="secondary"
          onClick={() => window.open(contactUsUrl, "_blank")}
        >
          {contactUsUrl.includes("slack") ? "Slack Us" : "Mail Us"}
        </Button>
      </div>
    </div>
  );
}
