import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { CorrelationSidebarHeader } from "./CorrelationSidebarHeader";
import { CorrelationSidebarBody } from "./CorrelationSidebarBody";
import { CorrelationFormType } from "./types";

export const DEFAULT_CORRELATION_FORM_VALUES: CorrelationFormType = {
  name: "",
  description: "",
  timeAmount: 24,
  timeUnit: "hours",
  groupedAttributes: [],
  requireApprove: false,
  resolveOn: "never",
  createOn: "any",
  incidentNameTemplate: "",
  incidentPrefix: "",
  query: {
    combinator: "or",
    rules: [
      {
        combinator: "and",
        rules: [{ field: "source", operator: "=", value: "" }],
      },
      {
        combinator: "and",
        rules: [{ field: "source", operator: "=", value: "" }],
      },
    ],
  },
};

type CorrelationSidebarProps = {
  isOpen: boolean;
  toggle: VoidFunction;
  defaultValue?: CorrelationFormType;
};

export const CorrelationSidebar = ({
  isOpen,
  toggle,
  defaultValue = DEFAULT_CORRELATION_FORM_VALUES,
}: CorrelationSidebarProps) => (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog onClose={toggle}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      </Transition.Child>
      <Transition.Child
        as={Fragment}
        enter="transition ease-in-out duration-300 transform"
        enterFrom="translate-x-full"
        enterTo="translate-x-0"
        leave="transition ease-in-out duration-300 transform"
        leaveFrom="translate-x-0"
        leaveTo="translate-x-full"
      >
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-[800px] max-h-[90vh] bg-white shadow-xl overflow-auto p-4">
            <CorrelationSidebarHeader toggle={toggle} />
            <CorrelationSidebarBody toggle={toggle} defaultValue={defaultValue} />
          </Dialog.Panel>
        </div>
      </Transition.Child>
    </Dialog>
  </Transition>
);
