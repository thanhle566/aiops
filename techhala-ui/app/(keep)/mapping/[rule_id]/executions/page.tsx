"use client";

import { Fragment, useState, use } from "react";
import { MappingExecutionTable } from "../mapping-execution-table";
import { useEnrichmentEvents } from "@/utils/hooks/useEnrichmentEvents";
import { Link } from "@/components/ui";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/16/solid";
import { useMappings } from "@/utils/hooks/useMappingRules";

interface Pagination {
  limit: number;
  offset: number;
}

export default function MappingExecutionsPage({
  params: paramsPromise,
}: {
  params: Promise<{ rule_id: string }>;
}) {
  const params = use(paramsPromise);
  const [pagination, setPagination] = useState<Pagination>({ limit: 20, offset: 0 });
  const [isDataPreviewExpanded, setIsDataPreviewExpanded] = useState(false);

  const { data: mappings } = useMappings();
  const rule = mappings?.find((m) => m.id === parseInt(params.rule_id));

  const { executions, totalCount, isLoading } = useEnrichmentEvents({
    ruleId: params.rule_id,
    limit: pagination.limit,
    offset: pagination.offset,
  });

  if (isLoading || !rule) return null;

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
        <span className="text-gray-600 font-medium">Executions</span>
      </nav>

      {/* Page Title */}
      <h1 className="text-2xl font-semibold text-gray-900">
        Mapping Rule Executions
      </h1>

      {/* Main Table */}
      <section className="bg-white border border-gray-200 shadow-sm p-4">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Execution List</h2>
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

      {/* Data Preview */}
      {rule.type === "csv" && rule.rows && rule.rows.length > 0 && (
        <section className="bg-white border border-gray-200 shadow-sm p-4">
          <button
            className="w-full flex justify-between items-center text-left text-base font-medium text-gray-800"
            onClick={() => setIsDataPreviewExpanded(!isDataPreviewExpanded)}
          >
            Data Preview
            {isDataPreviewExpanded ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {isDataPreviewExpanded && (
            <div className="mt-4 max-h-96 overflow-auto">
              <table className="min-w-full border border-gray-200 text-sm text-left">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {Object.keys(rule.rows[0]).map((key) => (
                      <th
                        key={key}
                        className="px-3 py-2 border-b border-gray-200 font-medium text-gray-700"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rule.rows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      {Object.values(row).map((value: any, i) => (
                        <td key={i} className="px-3 py-2 text-gray-800">
                          {JSON.stringify(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
