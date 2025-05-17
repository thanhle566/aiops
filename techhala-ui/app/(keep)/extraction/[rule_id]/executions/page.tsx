"use client";

import { use, useState } from "react";
import { useEnrichmentEvents } from "@/utils/hooks/useEnrichmentEvents";
import { useExtractions } from "@/utils/hooks/useExtractionRules";
import { Link } from "@/components/ui";
import { MappingExecutionTable } from "../../../mapping/[rule_id]/mapping-execution-table";

interface Pagination {
  limit: number;
  offset: number;
}

export default function ExtractionExecutionsPage({
  params: paramsPromise,
}: {
  params: Promise<{ rule_id: string }>;
}) {
  const params = use(paramsPromise);
  const [pagination, setPagination] = useState<Pagination>({
    limit: 20,
    offset: 0,
  });

  const { data: extractions } = useExtractions();
  const rule = extractions?.find((m) => m.id === parseInt(params.rule_id));

  const { executions, totalCount, isLoading } = useEnrichmentEvents({
    ruleId: params.rule_id,
    limit: pagination.limit,
    offset: pagination.offset,
    type: "extraction",
  });

  if (isLoading || !rule) return null;

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm mb-1">
        <ol className="flex flex-wrap items-center gap-1 text-gray-400">
          <li>
            <Link
              href="/extraction"
              className="text-gray-900 font-medium hover:underline"
            >
              All Rules
            </Link>
            <span className="px-1">/</span>
          </li>
          <li>
            <span>{rule?.name || `Rule ${params.rule_id}`}</span>
            <span className="px-1">/</span>
          </li>
          <li className="text-gray-500">Executions</li>
        </ol>
      </nav>

      {/* Page Title */}
      <h1 className="text-2xl font-semibold text-gray-900">
        Extraction Rule Executions
      </h1>

      {/* Table Section */}
      <section className="bg-white border border-gray-200 shadow-sm rounded-md p-4">
        <h2 className="text-lg font-medium text-gray-800 mb-4">
          Execution List
        </h2>
        <MappingExecutionTable
          executions={{
            items: executions,
            count: totalCount,
            limit: pagination.limit,
            offset: pagination.offset,
          }}
          setPagination={setPagination}
        />
      </section>
    </div>
  );
}
