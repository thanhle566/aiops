import React, { useEffect, useMemo, useState } from "react";
import { Facet } from "./facet";
import {
  FacetDto,
  FacetOptionDto,
  FacetOptionsQueries,
  FacetsConfig,
} from "./models";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import "react-loading-skeleton/dist/skeleton.css";
import clsx from "clsx";
import { FilterDropdown } from "./filter-dropdown";
import { IoSearch } from "react-icons/io5";

const transitionClasses = {
  enter: "transition-max-height duration-300 ease-in",
  enterFrom: "max-h-0",
  enterTo: "max-h-[1000px]",
  leave: "transition-max-height duration-300 ease-out",
  leaveFrom: "max-h-[1000px]",
  leaveTo: "max-h-0",
};

type FacetState = {
  [facetId: string]: Set<string>;
};

function buildCel(
  facets: FacetDto[],
  facetOptions: { [key: string]: FacetOptionDto[] },
  facetsState: FacetState
): string {
  if (facetOptions == null) return "";

  const cel = Object.values(facets)
    .filter((facet) => facet.id in facetsState)
    .filter((facet) => facetOptions[facet.id])
    .map((facet) => {
      const notSelectedOptions = Object.values(facetOptions[facet.id])
        .filter((facetOption) =>
          facetsState[facet.id]?.has(facetOption.display_name)
        )
        .map((option) => {
          if (typeof option.value === "string") {
            const optionValue = option.value.replace(/'/g, "\\'");
            return `'${optionValue}'`;
          } else if (option.value == null) {
            return "null";
          }
          return option.value;
        });

      if (!notSelectedOptions.length) return;

      return `!(${facet.property_path} in [${notSelectedOptions.join(", ")}])`;
    })
    .filter(Boolean)
    .join(" && ");

  return cel;
}

export interface FacetsPanelProps {
  panelId: string;
  className: string;
  facets: FacetDto[];
  facetOptions: { [key: string]: FacetOptionDto[] };
  areFacetOptionsLoading?: boolean;
  clearFiltersToken?: string | null;
  facetsConfig?: FacetsConfig;
  renderFacetOptionLabel?: (
    facetName: string,
    optionDisplayName: string
  ) => JSX.Element | string | undefined;
  renderFacetOptionIcon?: (
    facetName: string,
    optionDisplayName: string
  ) => JSX.Element | undefined;
  onCelChange: (cel: string) => void;
  onAddFacet: () => void;
  onDeleteFacet: (facetId: string) => void;
  onLoadFacetOptions: (facetId: string) => void;
  onReloadFacetOptions: (facetsQuery: FacetOptionsQueries) => void;
}

export const FacetsPanel: React.FC<FacetsPanelProps> = ({
  panelId,
  className,
  facets,
  facetOptions,
  areFacetOptionsLoading = false,
  clearFiltersToken,
  facetsConfig,
  onCelChange,
  onAddFacet,
  onDeleteFacet,
  onLoadFacetOptions,
  onReloadFacetOptions,
}) => {
  const defaultStateHandledForFacetIds = useMemo(() => new Set<string>(), []);
  const [facetsState, setFacetsState] = useState<FacetState>({});
  const [clickedFacetId, setClickedFacetId] = useState<string | null>(null);
  const [celState, setCelState] = useState("");
  const [facetOptionQueries, setFacetOptionQueries] = useState<FacetOptionsQueries | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const facetsConfigIdBased = useMemo(() => {
    const result: FacetsConfig = {};
    facets.forEach((facet) => {
      const facetConfig = facetsConfig?.[facet.name];
      const sortCallback = facetConfig?.sortCallback || ((opt: FacetOptionDto) => opt.matches_count);
      const renderOptionIcon = facetConfig?.renderOptionIcon;
      const renderOptionLabel = facetConfig?.renderOptionLabel || ((opt: FacetOptionDto) => <span className="capitalize">{opt.display_name}</span>);
      const uncheckedByDefaultOptionValues = facetConfig?.uncheckedByDefaultOptionValues;
      result[facet.id] = { sortCallback, renderOptionIcon, renderOptionLabel, uncheckedByDefaultOptionValues };
    });
    return result;
  }, [facetsConfig, facets]);

  function getFacetState(facetId: string): Set<string> {
    if (
      !defaultStateHandledForFacetIds.has(facetId) &&
      facetsConfigIdBased[facetId]?.uncheckedByDefaultOptionValues
    ) {
      const facetState = new Set<string>(...(facetsState[facetId] || []));
      facetsConfigIdBased[facetId]?.uncheckedByDefaultOptionValues.forEach((val) => facetState.add(val));
      defaultStateHandledForFacetIds.add(facetId);
      facetsState[facetId] = facetState;
    }
    return facetsState[facetId] || new Set<string>();
  }

  const isOptionSelected = (facet_id: string, option_id: string) => {
    return !facetsState[facet_id] || !facetsState[facet_id].has(option_id);
  };

  useEffect(() => {
    setCelState(buildCel(facets, facetOptions, facetsState));
  }, [facetsState, facetOptions, facets]);

  useEffect(() => {
    if (facetOptionQueries) {
      onReloadFacetOptions?.(facetOptionQueries);
    }
  }, [JSON.stringify(facetOptionQueries)]);

  useEffect(() => {
    const queries: FacetOptionsQueries = {};
    facets.forEach((facet) => {
      const others = facets.filter((f) => f.id !== facet.id);
      queries[facet.id] = buildCel(others, facetOptions, facetsState);
    });
    setFacetOptionQueries(queries);
    onCelChange?.(celState);
  }, [celState]);

  function toggleFacetOption(facetId: string, value: string) {
    setClickedFacetId(facetId);
    const facetState = getFacetState(facetId);
    isOptionSelected(facetId, value) ? facetState.add(value) : facetState.delete(value);
    console.log("facetState", facetState);
    setFacetsState({ ...facetsState, [facetId]: facetState });
  }

  function selectOneFacetOption(facetId: string, optionValue: string) {
    setClickedFacetId(facetId);
    const facetState = getFacetState(facetId);
    facetOptions[facetId].forEach((opt) => {
      opt.display_name === optionValue ? facetState.delete(optionValue) : facetState.add(opt.display_name);
    });
    setFacetsState({ ...facetsState, [facetId]: facetState });
  }

  function selectAllFacetOptions(facetId: string) {
    setClickedFacetId(facetId);
    const facetState = getFacetState(facetId);
    facetOptions[facetId].forEach((opt) => facetState.delete(opt.display_name));
    setFacetsState({ ...facetsState, [facetId]: facetState });
  }

  function clearFilters() {
    Object.keys(facetsState).forEach((id) => facetsState[id].clear());
    defaultStateHandledForFacetIds.clear();
    const newState: FacetState = {};
    facets.forEach((facet) => {
      newState[facet.id] = getFacetState(facet.id);
    });
    setFacetsState(newState);
  }

  useEffect(() => {
    if (clearFiltersToken) {
      clearFilters();
    }
  }, [clearFiltersToken]);

  return (
    <section
      id={`${panelId}-facets`}
      className={clsx("scroll-thin", className)}
      data-testid="facets-panel"
    >
      {/* Collapse Toggle + Action Buttons */}
      <div className="flex items-center justify-between mb-2 px-2 border-b border-[#eaeaea] py-2">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-sm font-semibold px-3 py-1 hover:bg-primary-400 text-gray-600 hover:text-white flex items-center gap-1"
        >
          <IoSearch/> {isOpen ? "Hide Filters" : "Show Filters"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onAddFacet?.()}
            className="p-1 pr-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" /> Add Filter
          </button>
          <button
            onClick={clearFilters}
            className="p-1 pr-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-1"
          >
            <XMarkIcon className="h-4 w-4" /> Clear
          </button>
        </div>
      </div>

      <div
        className={clsx(
          "transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="bg-slate-100 p-4 rounded shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {!facets &&
              [undefined, undefined, undefined].map((_, index) => (
                <FilterDropdown
                  key={index}
                  name=""
                  isStatic
                  isOpenByDefault
                  optionsLoading
                  optionsReloading={false}
                  facetState={new Set()}
                  facetKey={`${index}`}
                />
              ))}

            {facets &&
              facets.map((facet, index) => (
                <FilterDropdown
                  key={facet.id + index}
                  name={facet.name}
                  isStatic={facet.is_static}
                  options={facetOptions?.[facet.id]}
                  optionsLoading={!facetOptions?.[facet.id]}
                  optionsReloading={
                    areFacetOptionsLoading &&
                    !!facet.id &&
                    clickedFacetId !== facet.id
                  }
                  onSelect={(value) => toggleFacetOption(facet.id, value)}
                  onSelectOneOption={(value) => selectOneFacetOption(facet.id, value)}
                  onSelectAllOptions={() => selectAllFacetOptions(facet.id)}
                  facetState={getFacetState(facet.id)}
                  facetKey={facet.id}
                  facetConfig={facetsConfigIdBased[facet.id]}
                  onLoadOptions={() => onLoadFacetOptions?.(facet.id)}
                  onDelete={() => onDeleteFacet?.(facet.id)}
                />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};
