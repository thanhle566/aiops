"use client";

import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TableCellsIcon,
} from "@heroicons/react/16/solid";
import { Button, Text } from "@tremor/react";
import type { Table } from "@tanstack/react-table";
import type { GroupBase, SingleValueProps } from "react-select";
import { components } from "react-select";
import { Select } from "@/shared/ui";
import { INCIDENT_PAGINATION_OPTIONS } from "@/entities/incidents/model/models";

type Props = {
  table: Table<any>;
};

interface OptionType {
  value: string;
  label: string;
}

const SingleValue = ({
  children,
  ...props
}: SingleValueProps<OptionType, false, GroupBase<OptionType>>) => (
  <components.SingleValue {...props}>
    {children}
    <TableCellsIcon className="w-4 h-4 ml-2" />
  </components.SingleValue>
);

export function TablePagination({ table }: Props) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, table.getRowCount());
  const baseBtn =
    "w-9 h-9 text-sm rounded flex items-center justify-center border transition";
  const activeBtn =
    "bg-slate-800 text-white border-slate-800 font-semibold";
  const inactiveBtn =
    "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";

  const renderPages = () => {
    const pages: (number | "...")[] = [];

    if (pageCount <= 5) {
      for (let i = 0; i < pageCount; i++) pages.push(i);
    } else {
      if (pageIndex < 3) {
        pages.push(0, 1, 2, "...", pageCount - 1);
      } else if (pageIndex >= pageCount - 3) {
        pages.push(0, "...", pageCount - 3, pageCount - 2, pageCount - 1);
      } else {
        pages.push(0, "...", pageIndex, "...", pageCount - 1);
      }
    }

    return pages.map((p, i) =>
      p === "..." ? (
        <span key={i} className="px-2 text-gray-400">…</span>
      ) : (
        <button
          key={i}
          onClick={() => table.setPageIndex(p)}
          className={`${baseBtn} ${p === pageIndex ? activeBtn : inactiveBtn}`}
        >
          {p + 1}
        </button>
      )
    );
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 z-10">
      <Text className="text-sm text-gray-600 dark:text-gray-400">
      Page {pageIndex + 1} of {pageCount} — Showing {from} to {to} rows
      </Text>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          icon={ChevronDoubleLeftIcon}
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          size="xs"
          variant="secondary"
          className="w-9 h-9"
        />
        <Button
          icon={ChevronLeftIcon}
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          size="xs"
          variant="secondary"
          className="w-9 h-9"
        />

        <div className="flex items-center gap-1">
          {renderPages()}
        </div>

        <Button
          icon={ChevronRightIcon}
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          size="xs"
          variant="secondary"
          className="w-9 h-9"
        />
        <Button
          icon={ChevronDoubleRightIcon}
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
          size="xs"
          variant="secondary"
          className="w-9 h-9"
        />

        {/* <Select
          components={{ SingleValue }}
          value={{
            value: pageSize.toString(),
            label: pageSize.toString(),
          }}
          onChange={(selectedOption) =>
            table.setPageSize(Number(selectedOption!.value))
          }
          options={INCIDENT_PAGINATION_OPTIONS}
          className="min-w-[64px] h-8 text-sm"
          menuPlacement="top"
        /> */}
      </div>
    </div>
  );
}