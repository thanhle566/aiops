"use client";

import { use } from "react";
import { LogViewer } from "@/components/LogViewer";
import { getIcon } from "@/app/(keep)/workflows/[workflow_id]/workflow-execution-table";
import { useEnrichmentEvent } from "@/utils/hooks/useEnrichmentEvents";
import { useExtractions } from "@/utils/hooks/useExtractionRules";
import { Link } from "@/components/ui";
import { ArrowRightIcon } from "@heroicons/react/16/solid";

export default function ExtractionExecutionDetailsPage({
  params: paramsPromise,
}: {
  params: Promise<{ rule_id: string; execution_id: string }>;
}) {
  const params = use(paramsPromise);
  const { execution, isLoading } = useEnrichmentEvent({
    ruleId: params.rule_id,
    executionId: params.execution_id,
  });

  const { data: extractions } = useExtractions();
  const rule = extractions?.find((m) => m.id === parseInt(params.rule_id));

  if (isLoading || !execution) return null;

  const alertFilterUrl = `/alerts/feed?cel=${encodeURIComponent(
    `id=="${execution.enrichment_event.alert_id}" || id=="${execution.enrichment_event.alert_id.replace("-", "")}"`
  )}`;

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm mb-1">
        <ol className="flex flex-wrap items-center gap-1 text-gray-400">
          <li>
            <Link href="/extraction" className="text-gray-900 font-medium hover:underline">
              All Rules
            </Link>
            <span className="px-1">/</span>
          </li>
          <li>
            <span>{rule?.name || `Rule ${params.rule_id}`}</span>
            <span className="px-1">/</span>
          </li>
          <li>
            <Link
              href={`/extraction/${params.rule_id}/executions`}
              className="hover:underline text-gray-500"
            >
              Executions
            </Link>
            <span className="px-1">/</span>
          </li>
          <li className="text-gray-500">{execution.enrichment_event.id}</li>
        </ol>
      </nav>
      {/* Page title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          Extraction Execution Details
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Status:</span>
          {getIcon(execution.enrichment_event.status)}
        </div>
      </div>

      {/* Content layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs Section */}
        <section className="lg:col-span-2 bg-white border border-gray-200 shadow-sm p-4">
          <h2 className="text-lg font-medium text-gray-800 mb-3">Logs</h2>
          <LogViewer logs={execution.logs || []} />
        </section>

        {/* Extracted Fields Section */}
        <section className="bg-white border border-gray-200 shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-2">
            Alert ID:{" "}
            <Link
              href={alertFilterUrl}
              className="text-blue-600 hover:underline"
            >
              {execution.enrichment_event.alert_id}
            </Link>
          </div>

          <h2 className="text-lg font-medium text-gray-800">Extracted Fields</h2>
          <div className="mt-4 space-y-4">
            {Object.entries(execution.enrichment_event.enriched_fields || {}).map(
              ([key, value]) => (
                <div key={key}>
                  <div className="inline-block bg-red-500 text-white text-xs font-semibold px-2 py-0.5">
                    {key}
                  </div>
                  <div className="mt-1 text-sm text-gray-700 break-all whitespace-pre-wrap">
                    {JSON.stringify(value, null, 2)}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
