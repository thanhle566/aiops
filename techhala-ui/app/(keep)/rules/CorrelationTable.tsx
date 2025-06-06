import {
  Badge,
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
import { useEffect, useMemo, useState } from "react";
import { Rule } from "utils/hooks/useRules";
import {
  CorrelationSidebar,
  DEFAULT_CORRELATION_FORM_VALUES,
} from "./CorrelationSidebar";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DefaultRuleGroupType } from "react-querybuilder";
import { parseCEL } from "react-querybuilder/parseCEL";
import { useRouter, useSearchParams } from "next/navigation";
import { FormattedQueryCell } from "./FormattedQueryCell";
import { DeleteRuleCell } from "./CorrelationSidebar/DeleteRule";
import { CorrelationFormType } from "./CorrelationSidebar/types";
import { PageSubtitle, PageTitle } from "@/shared/ui";
import { PlusIcon } from "@heroicons/react/20/solid";

const TIMEFRAME_UNITS_FROM_SECONDS = {
  seconds: (amount: number) => amount,
  minutes: (amount: number) => amount / 60,
  hours: (amount: number) => amount / 3600,
  days: (amount: number) => amount / 86400,
} as const;

const columnHelper = createColumnHelper<Rule>();

type CorrelationTableProps = {
  rules: Rule[];
};

export const CorrelationTable = ({ rules }: CorrelationTableProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedId = searchParams ? searchParams.get("id") : null;
  const selectedRule = rules.find((rule) => rule.id === selectedId);
  const correlationFormFromRule: CorrelationFormType = useMemo(() => {
    if (selectedRule) {
      const query = parseCEL(selectedRule.definition_cel);
      const anyCombinator = query.rules.some((rule) => "combinator" in rule);

      const queryInGroup: DefaultRuleGroupType = {
        ...query,
        rules: anyCombinator
          ? query.rules
          : [
              {
                combinator: "and",
                rules: query.rules,
              },
            ],
      };

      const timeunit = selectedRule.timeunit ?? "seconds";

      return {
        name: selectedRule.name,
        description: selectedRule.group_description ?? "",
        timeAmount: TIMEFRAME_UNITS_FROM_SECONDS[timeunit](
          selectedRule.timeframe
        ),
        timeUnit: timeunit,
        groupedAttributes: selectedRule.grouping_criteria,
        requireApprove: selectedRule.require_approve,
        resolveOn: selectedRule.resolve_on,
        createOn: selectedRule.create_on,
        query: queryInGroup,
        incidents: selectedRule.incidents,
        incidentNameTemplate: selectedRule.incident_name_template || "",
        incidentPrefix: selectedRule.incident_prefix || "",
      };
    }

    return DEFAULT_CORRELATION_FORM_VALUES;
  }, [selectedRule]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const onCorrelationClick = () => {
    setIsSidebarOpen(true);
  };

  const onCloseCorrelation = () => {
    setIsSidebarOpen(false);
    router.replace("/rules");
  };

  useEffect(() => {
    if (selectedRule) {
      onCorrelationClick();
    } else {
      router.replace("/rules");
    }
  }, [selectedRule, router]);

  const CORRELATION_TABLE_COLS = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Policy Name",
      }),
      columnHelper.accessor("incident_name_template", {
        header: "Incident Name Template",
        cell: (context) => {
          const template = context.getValue();
          return template ? (
            <Badge color="red">{template}</Badge>
          ) : (
            <Badge color="gray">default</Badge>
          );
        },
      }),
      columnHelper.accessor("incident_prefix", {
        header: "Incident Prefix",
        cell: (context) =>
          context.getValue() && (
            <Badge color="red">{context.getValue()}</Badge>
          ),
      }),
      columnHelper.accessor("definition_cel", {
        header: "Description",
        cell: (context) => (
          <FormattedQueryCell query={parseCEL(context.getValue())} />
        ),
      }),
      columnHelper.accessor("grouping_criteria", {
        header: "Grouped by",
        cell: (context) =>
          context.getValue().map((group, index) => (
            <>
              <Badge color="red" key={group}>
                {group}
              </Badge>
              {context.getValue().length !== index + 1 && (
                <Icon icon={PlusIcon} size="xs" color="slate" />
              )}
            </>
          )),
      }),
      columnHelper.accessor("incidents", {
        header: "Incidents",
        cell: (context) => context.getValue(),
      }),
      columnHelper.display({
        id: "menu",
        cell: (context) => <DeleteRuleCell ruleId={context.row.original.id} />,
      }),
    ],
    []
  );

  const table = useReactTable({
    getRowId: (row) => row.id,
    data: rules,
    columns: CORRELATION_TABLE_COLS,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="h-full flex flex-col gap-0 bg-[#fff] border border-[#e5e7eb]">
      <div className="page-header flex justify-between items-center bg-white h-16">
        <div>
          <PageTitle>
            Correlations <span className="text-gray-400">({rules.length})</span>
          </PageTitle>
          <PageSubtitle>
          Define Policies/Rules to link alerts
          </PageSubtitle>
        </div>
        <Button
          className="btn-primary"
          size="md"
          variant="primary"
          onClick={() => onCorrelationClick()}
          icon={PlusIcon}
        >
          Create
        </Button>
      </div>
      <Card className="p-0">
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-[#e5e7eb]"
              >
                {headerGroup.headers.map((header) => (
                  <TableHeaderCell key={header.id} className="border-r border-[#e5e7eb] last:border-r-0">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHeaderCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-slate-50 group border-b border-[#e5e7eb]"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="border-r border-[#e5e7eb] last:border-r-0"
                    onClick={() => router.push(`?id=${cell.row.original.id}`)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <CorrelationSidebar
        isOpen={isSidebarOpen}
        toggle={onCloseCorrelation}
        defaultValue={correlationFormFromRule}
      />
    </div>
  );
};
