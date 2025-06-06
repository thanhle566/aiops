import clsx from "clsx";
import { Status } from "@/entities/incidents/model";
import { STATUS_ICONS } from "@/entities/incidents/ui";
import Select, { ClassNamesConfig } from "react-select";
import { useIncidentActions } from "@/entities/incidents/model";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { capitalize } from "@/utils/helpers";

const customClassNames: ClassNamesConfig<any, false, any> = {
  container: () => "inline-flex",
  control: (state) =>
    clsx(
      "p-1 min-w-14 !rounded-full !min-h-0",
      state.isFocused ? "border-[#2C4A4B]" : ""
    ),
  valueContainer: () => "!p-0",
  dropdownIndicator: () => "!p-0",
  indicatorSeparator: () => "hidden",
  menuList: () => "!p-0",
  menu: () => "!p-0 !overflow-hidden min-w-36",
  option: (state) =>
    clsx(
      "!p-1",
      state.isSelected ? "!bg-[#2C4A4B] !text-white [&_svg]:text-white" : "",
      state.isFocused && !state.isSelected ? "!bg-slate-100" : ""
    ),
};

type Props = {
  incidentId: string;
  value: Status;
  onChange?: (status: Status) => void;
  className?: string;
};

export function IncidentChangeStatusSelect({
  incidentId,
  value,
  onChange,
  className,
}: Props) {
  // Use a portal to render the menu outside the table container with overflow: hidden
  const menuPortalTarget = useRef<HTMLElement | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  useEffect(() => {
    menuPortalTarget.current = document.body;
  }, []);

  const { changeStatus } = useIncidentActions();
  const statusOptions = useMemo(
    () =>
      Object.values(Status)
        .filter((status) => status != Status.Deleted || value == Status.Deleted)
        .map((status) => ({
          value: status,
          label: (
            <div className="flex items-center">
              {STATUS_ICONS[status]}
              <span>{capitalize(status)}</span>
            </div>
          ),
        })),
    [value]
  );

  const handleChange = useCallback(
    (option: any) => {
      const _asyncUpdate = async (option: any) => {
        setIsDisabled(true);
        await changeStatus(incidentId, option?.value || null);
        onChange?.(option?.value || null);
        setIsDisabled(false);
      };
      _asyncUpdate(option);
    },
    [incidentId, changeStatus, onChange]
  );

  const selectedOption = useMemo(
    () => statusOptions.find((option) => option.value === value),
    [statusOptions, value]
  );

  return (
    <Select
      instanceId={`incident-status-select-${incidentId}`}
      className={className}
      isSearchable={false}
      options={statusOptions}
      value={selectedOption}
      onChange={handleChange}
      isDisabled={isDisabled}
      placeholder="Status"
      classNames={customClassNames}
      menuPortalTarget={menuPortalTarget.current}
      menuPosition="fixed"
    />
  );
}
