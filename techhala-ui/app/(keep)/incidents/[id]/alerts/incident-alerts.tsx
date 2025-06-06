"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  Button,
  Card,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import { AlertDto } from "@/entities/alerts/model";
import {
  useIncidentAlerts,
  usePollIncidentAlerts,
} from "utils/hooks/useIncidents";
import { AlertName } from "@/entities/alerts/ui";
import React, { useEffect, useMemo, useState } from "react";
import type { IncidentDto } from "@/entities/incidents/model";
import {
  EmptyStateCard,
  getCommonPinningStylesAndClassNames,
  UISeverity,
} from "@/shared/ui";
import { useRouter } from "next/navigation";
import {
  TableIndeterminateCheckbox,
  TablePagination,
  TableSeverityCell,
} from "@/shared/ui";
import { getStatusIcon, getStatusColor } from "@/shared/lib/status-utils";
import TimeAgo from "react-timeago";
import clsx from "clsx";
import { IncidentAlertsTableBodySkeleton } from "./incident-alert-table-body-skeleton";
import { IncidentAlertsActions } from "./incident-alert-actions";
import { DynamicImageProviderIcon } from "@/components/ui";
import { ViewAlertModal } from "@/app/(keep)/alerts/ViewAlertModal";
import { IncidentAlertActionTray } from "./incident-alert-action-tray";
import { useApi } from "@/shared/lib/hooks/useApi";
import { BellAlertIcon } from "@heroicons/react/24/outline";
interface Props {
  incident: IncidentDto;
}

interface Pagination {
  limit: number;
  offset: number;
}

const columnHelper = createColumnHelper<AlertDto>();

export default function IncidentAlerts({ incident }: Props) {
  const [alertsPagination, setAlertsPagination] = useState<Pagination>({
    limit: 20,
    offset: 0,
  });

  const [pagination, setTablePagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const api = useApi();

  const {
    data: alerts,
    isLoading: _alertsLoading,
    error: alertsError,
    mutate: mutateAlerts,
  } = useIncidentAlerts(
    incident.id,
    alertsPagination.limit,
    alertsPagination.offset
  );

  // TODO: Load data on server side
  // Loading state is true if the data is not loaded and there is no error for smoother loading state on initial load
  const isLoading = _alertsLoading || (!alerts && !alertsError);
  const isTopologyIncident = incident.incident_type === "topology";

  useEffect(() => {
    if (alerts && alerts.limit != pagination.pageSize) {
      setAlertsPagination({
        limit: pagination.pageSize,
        offset: 0,
      });
    }
    const currentOffset = pagination.pageSize * pagination.pageIndex;
    if (alerts && alerts.offset != currentOffset) {
      setAlertsPagination({
        limit: pagination.pageSize,
        offset: currentOffset,
      });
    }
  }, [alerts, pagination]);
  usePollIncidentAlerts(incident.id);

  // Add new state for the ViewAlertModal
  const [viewAlertModal, setViewAlertModal] = useState<AlertDto | null>(null);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "severity",
        header: () => <></>,
        cell: (context) => (
          <TableSeverityCell
            severity={context.row.original.severity as unknown as UISeverity}
          />
        ),
        size: 4,
        minSize: 4,
        maxSize: 4,
        meta: {
          tdClassName: "p-0",
          thClassName: "p-0",
        },
      }),
      columnHelper.display({
        id: "selected",
        minSize: 32,
        maxSize: 32,
        header: (context) => (
          <TableIndeterminateCheckbox
            checked={context.table.getIsAllRowsSelected()}
            indeterminate={context.table.getIsSomeRowsSelected()}
            onChange={context.table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: (context) => (
          <TableIndeterminateCheckbox
            checked={context.row.getIsSelected()}
            indeterminate={context.row.getIsSomeSelected()}
            onChange={context.row.getToggleSelectedHandler()}
          />
        ),
      }),
      columnHelper.display({
        id: "name",
        header: "Name",
        minSize: 100,
        cell: (context) => (
          <div className="max-w-[300px] group relative">
            <AlertName alert={context.row.original} />
          </div>
        ),
      }),
      columnHelper.accessor("description", {
        id: "description",
        header: "Description",
        minSize: 100,
        cell: (context) => (
          <div title={context.getValue()}>
            <div className="truncate whitespace-pre-wrap line-clamp-3">
              {context.getValue()}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        id: "status",
        minSize: 100,
        header: "Status",
        cell: (context) => (
          <span className="flex items-center gap-1 capitalize">
            <Icon
              icon={getStatusIcon(context.getValue())}
              size="sm"
              color={getStatusColor(context.getValue())}
              className="!p-0"
            />
            {context.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("is_created_by_ai", {
        id: "is_created_by_ai",
        header: "Correlation",
        minSize: 50,
        cell: (context) => {
          if (isTopologyIncident) {
            return <div title="Correlated with topology">🌐 Topology</div>;
          }
          return (
            <>
              {context.getValue() ? (
                <div title="Correlated with AI">🤖 AI</div>
              ) : (
                <div title="Correlated manually">👨‍💻 Manually</div>
              )}
            </>
          );
        },
      }),
      columnHelper.accessor("lastReceived", {
        id: "lastReceived",
        header: "Last Event Time",
        minSize: 100,
        // data is a ISO string
        cell: (context) => <TimeAgo date={context.getValue()} />,
      }),
      columnHelper.accessor("source", {
        id: "source",
        header: "Source",
        maxSize: 100,
        cell: (context) =>
          (context.getValue() ?? []).map((source, index) => (
            <DynamicImageProviderIcon
              className={`inline-block ${index == 0 ? "" : "-ml-2"}`}
              key={`source-${source}-${index}`}
              alt={source}
              height={24}
              width={24}
              title={source}
              src={`/icons/${source}-icon.png`}
            />
          )),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        maxSize: 110,
        cell: (context) => (
          <div className="opacity-0 group-hover/row:opacity-100">
            <IncidentAlertActionTray
              alert={context.row.original}
              onViewAlert={setViewAlertModal}
              onUnlink={(alert) => {
                if (!incident.is_candidate) {
                  if (confirm("Are you sure you want to unlink this alert?")) {
                    api
                      .post(`/incidents/${incident.id}/unlink`, {
                        fingerprints: [alert.fingerprint],
                      })
                      .then(() => {
                        mutateAlerts();
                      });
                  }
                }
              }}
              isCandidate={!incident.is_candidate}
            />
          </div>
        ),
        meta: {
          tdClassName: "w-[110px] p-0",
        },
      }),
    ],
    [incident.id, incident.is_candidate, api, mutateAlerts]
  );

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data: alerts?.items ?? [],
    columns: columns,
    rowCount: alerts?.count ?? 0,
    getRowId: (row) => row.fingerprint,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      pagination,
      columnPinning: {
        left: ["severity", "selected", "name"],
        right: ["actions"],
      },
    },
    onPaginationChange: setTablePagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const router = useRouter();

  if (!isLoading && (alerts?.items ?? []).length === 0) {
    return (
      <EmptyStateCard
        className="w-full"
        title="No alerts yet"
        description="Alerts will show up here as they are correlated into this incident."
        icon={BellAlertIcon}
      >
        <div className="flex gap-2">
          <Button
            className="btn-secondary"
            variant="secondary"
            size="md"
            onClick={() => {
              router.push(`/alerts/feed`);
            }}
          >
            Add Alerts Manually
          </Button>
          <Button
            className="btn-primary"
            variant="primary"
            size="md"
            onClick={() => {
              router.push(`/alerts/feed?createIncidentsFromLastAlerts=50`);
            }}
          >
            Try AI Correlation
          </Button>
        </div>
      </EmptyStateCard>
    );
  }

  const selectedFingerprints = Object.keys(rowSelection);


  function renderRows() {
    // This trick handles cases when rows have duplicated ids
    // It shouldn't happen, but the API currently returns duplicated ids
    // And in order to mitigate this issue, we append the rowIndex to the key for duplicated keys
    const visitedIds = new Set<string>();

    return table.getRowModel().rows.map((row, rowIndex) => {
      let renderingKey = row.id;

      if (visitedIds.has(renderingKey)) {
        renderingKey = `${renderingKey}-${rowIndex}`;
      } else {
        visitedIds.add(renderingKey);
      }

      return (
        <TableRow
          key={`row-${row.id}-${rowIndex}`}
          className="group/row hover:bg-gray-50"
        >
          {row.getVisibleCells().map((cell, index) => {
            const { style, className } = getCommonPinningStylesAndClassNames(
              cell.column,
              table.getState().columnPinning.left?.length,
              table.getState().columnPinning.right?.length
            );
            return (
              <TableCell
                key={`cell-${cell.id}-${index}`}
                style={style}
                className={clsx(
                  cell.column.columnDef.meta?.tdClassName,
                  className
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            );
          })}
        </TableRow>
      );
    });
  }

  return (
    <>
      <IncidentAlertsActions
        incidentId={incident.id}
        selectedFingerprints={selectedFingerprints}
        resetAlertsSelection={() => table.resetRowSelection()}
      />
      <Card className="p-0 overflow-x-auto h-[calc(100vh-30rem)]">
        <Table className="[&>table]:table-fixed group">
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-tremor-border dark:border-dark-tremor-border"
              >
                {headerGroup.headers.map((header, index) => {
                  const { style, className } =
                    getCommonPinningStylesAndClassNames(
                      header.column,
                      table.getState().columnPinning.left?.length,
                      table.getState().columnPinning.right?.length
                    );
                  return (
                    <TableHeaderCell
                      key={`header-${header.id}-${index}`}
                      style={style}
                      className={clsx(
                        header.column.columnDef.meta?.thClassName,
                        className
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHeaderCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          {alerts && alerts?.items?.length > 0 && (
            <TableBody>{renderRows()}</TableBody>
          )}
          {isLoading && (
            <IncidentAlertsTableBodySkeleton
              table={table}
              pageSize={pagination.pageSize - 10}
            />
          )}
        </Table>
      </Card>

      <div className="mt-4 mb-8">
        <TablePagination table={table} />
      </div>

      <ViewAlertModal
        alert={viewAlertModal}
        handleClose={() => setViewAlertModal(null)}
        mutate={mutateAlerts}
      />
    </>
  );
}
