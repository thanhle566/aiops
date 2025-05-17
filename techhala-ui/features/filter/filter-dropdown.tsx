import React, { useEffect, useState, Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { TrashIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import classNames from "classnames";
import Skeleton from "react-loading-skeleton";
import { usePathname } from "next/navigation";
import { useLocalStorage } from "utils/hooks/useLocalStorage";
import { FacetConfig, FacetOptionDto } from "./models";

export interface FacetProps {
    name: string;
    isOpenByDefault?: boolean;
    isStatic: boolean;
    options?: FacetOptionDto[];
    optionsLoading: boolean;
    optionsReloading: boolean;
    showIcon?: boolean;
    facetKey: string;
    facetState: Set<string>;
    facetConfig?: FacetConfig;
    onSelectOneOption?: (value: string) => void;
    onSelectAllOptions?: () => void;
    onSelect?: (value: string) => void;
    onLoadOptions?: () => void;
    onDelete?: () => void;
}

export const FilterDropdown: React.FC<FacetProps> = ({
    name,
    isStatic,
    options,
    facetKey,
    optionsLoading,
    optionsReloading,
    showIcon = true,
    facetState,
    facetConfig,
    onSelect,
    onSelectOneOption,
    onSelectAllOptions,
    onDelete,
}) => {
    const pathname = usePathname();
    const presetName = pathname?.split("/").pop() || "default";

    const [filter, setFilter] = useLocalStorage<string>(
        `facet-${presetName}-${facetKey}-filter`,
        ""
    );
    const [excluded, setExcluded] = useState<Set<string>>(new Set());

    useEffect(() => {
        setExcluded(new Set(facetState));
    }, [facetState]);

    const toggleOption = (value: string) => {
        const newSet = new Set(excluded);
        if (newSet.has(value)) {
            newSet.delete(value);
        } else {
            newSet.add(value);
        }
        setExcluded(newSet);
        onSelect?.(value);
    };

    const optionsToRender = (options || [])
        .filter((opt) => opt.display_name.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => b.matches_count - a.matches_count);

    if (facetConfig?.sortCallback) {
        const sorter = facetConfig.sortCallback;
        optionsToRender.sort((a, b) => sorter(b) - sorter(a));
    }

    if (optionsLoading || !options) {
        return <Skeleton height={40} count={1} />;
    }

    return (
        <div data-testid="filter-dropdown" className="w-full max-w-full border-b pb-3 border-gray-200">
            <div className="flex items-center gap-3 px-2 py-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{name}:</span>

                <div className="flex-1 relative">
                    <Listbox value={[]} onChange={() => { }} multiple>
                        <div>
                            <Listbox.Button className="relative w-full cursor-default rounded border border-gray-300 bg-white py-2 pl-3 pr-10 text-left text-sm shadow-sm focus:outline-none">
                                <span className="block truncate">
                                    {options.length - excluded.size} selected
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                                </span>
                            </Listbox.Button>

                            <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <Listbox.Options style={{ zIndex: 9999 }} className="absolute z-100 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    {optionsToRender.map((opt, index) => {
                                        const isExcluded = excluded.has(opt.display_name);
                                        const renderIcon = facetConfig?.renderOptionIcon?.(opt);

                                        return (
                                            <Listbox.Option
                                                key={opt.display_name + index}
                                                className={({ active }) =>
                                                    classNames(
                                                        "relative cursor-pointer select-none py-2 pl-10 pr-4",
                                                        active ? "bg-primary-500 text-white" : "text-gray-900"
                                                    )
                                                }
                                                value={opt.display_name}
                                                onClick={() => toggleOption(opt.display_name)}
                                            >
                                                <div>
                                                    <input
                                                        type="checkbox"
                                                        checked={!isExcluded}
                                                        onChange={() => { }}
                                                        readOnly
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-500 border-gray-300 rounded"
                                                    />
                                                    <span
                                                        className={classNames(
                                                            "block truncate",
                                                            !isExcluded ? "font-medium" : "font-normal"
                                                        )}
                                                    >
                                                        {renderIcon && showIcon && (
                                                            <span className="mr-2 inline-block align-middle">
                                                                {renderIcon}
                                                            </span>
                                                        )}
                                                        {facetConfig?.renderOptionLabel
                                                            ? facetConfig.renderOptionLabel(opt)
                                                            : `${opt.display_name} (${opt.matches_count})`}
                                                    </span>
                                                </div>
                                            </Listbox.Option>
                                        );
                                    })}
                                </Listbox.Options>
                            </Transition>
                        </div>
                    </Listbox>
                </div>

                {!isStatic && (
                    <button
                        data-testid="delete-facet"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete?.();
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {options.length >= 10 && (
                <div className="px-2">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                </div>
            )}
        </div>
    );
};