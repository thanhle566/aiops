"use client";

import { use } from "react";
import { LogViewer } from "@/components/LogViewer";
import { getIcon } from "@/app/(keep)/workflows/[workflow_id]/workflow-execution-table";
import { useEnrichmentEvent } from "@/utils/hooks/useEnrichmentEvents";
import { useMappings } from "@/utils/hooks/useMappingRules";
import { Link } from "@/components/ui";
import { ArrowRightIcon } from "@heroicons/react/16/solid";

export default function MappingExecutionDetailsPage(props: {
  params: Promise<{ rule_id: string; execution_id: string }>;
}) {
  const params = use(props.params);
  const { execution, isLoading } = useEnrichmentEvent({
    ruleId: params.rule_id,
    executionId: params.execution_id,
  });

  const { data: mappings } = useMappings();
  const rule = mappings?.find((m) => m.id === parseInt(params.rule_id));

  if (isLoading || !execution) return null;

  const alertFilterUrl = `/alerts/feed?cel=${encodeURIComponent(
    `id=="${execution.enrichment_event.alert_id}" || id=="${execution.enrichment_event.alert_id.replace("-", "")}"`
  )}`;

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 flex flex-wrap items-center gap-1">
        <Link href="/mapping" className="hover:underline text-gray-500">
          All Rules
        </Link>
        <ArrowRightIcon className="w-4 h-4" />
        <span>{rule?.name || `Rule ${params.rule_id}`}</span>
        <ArrowRightIcon className="w-4 h-4" />
        <Link
          href={`/mapping/${params.rule_id}/executions`}
          className="hover:underline text-gray-500"
        >
          Executions
        </Link>
        <ArrowRightIcon className="w-4 h-4" />
        <span className="text-gray-600 font-medium">{execution.enrichment_event.id}</span>
      </nav>

      {/* Page Title + Status */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">Execution Details</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Status:</span>
          {getIcon(execution.enrichment_event.status)}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs */}
        <section className="lg:col-span-2 bg-white border border-gray-200 p-4 shadow-sm">
          <h2 className="text-lg font-medium text-gray-800 mb-2">Logs</h2>
          <LogViewer logs={execution.logs || []} />
        </section>

        {/* Enriched Fields */}
        <section className="bg-white border border-gray-200 p-4 shadow-sm space-y-4">
          <div className="text-xs text-gray-500">
            Alert ID:{" "}
            <Link
              href={alertFilterUrl}
              className="text-blue-600 hover:underline"
            >
              {execution.enrichment_event.alert_id}
            </Link>
          </div>

          <h2 className="text-lg font-medium text-gray-800">Enriched Fields</h2>
          <div className="space-y-3">
            {Object.entries(execution.enrichment_event.enriched_fields || {}).map(
              ([key, value]) => (
                <div key={key}>
                  <div className="inline-block text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded">
                    {key}
                  </div>
                  <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">
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
