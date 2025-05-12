import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Badge, Button, Title } from "@tremor/react";
import { IoMdClose } from "react-icons/io";
import * as Frigade from "@frigade/react";

interface OnboardingProps {
  isOpen: boolean;
  toggle: () => void;
  variables?: Record<string, unknown>;
}

export default function Onboarding({
  isOpen,
  toggle,
  variables,
}: OnboardingProps) {
  return (
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
            <Dialog.Panel className="w-full max-w-3xl max-h-[90vh] bg-white shadow-xl overflow-auto">
              <Frigade.Checklist.Collapsible
                flowId="flow_FHDz1hit"
                sequential={true}
                variables={variables}
              />
            </Dialog.Panel>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
