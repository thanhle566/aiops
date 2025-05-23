import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Text, Button, TextInput, Badge, Title, Card } from "@tremor/react";
import { IoMdClose } from "react-icons/io";
import {
  getIcon,
  getTriggerIcon,
  extractTriggerValue,
} from "@/app/(keep)/workflows/[workflow_id]/workflow-execution-table";
import { useWorkflowExecution } from "utils/hooks/useWorkflowExecutions";
import { WorkflowExecutionDetail } from "@/shared/api/workflow-executions";

interface IncidentWorkflowSidebarProps {
  isOpen: boolean;
  toggle: VoidFunction;
  selectedExecution: WorkflowExecutionDetail;
}

const IncidentWorkflowSidebar: React.FC<IncidentWorkflowSidebarProps> = ({
  isOpen,
  toggle,
  selectedExecution,
}) => {
  const { data: workflowExecutionData } = useWorkflowExecution(
    selectedExecution.workflow_id,
    selectedExecution.id
  );

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
              <div className="flex justify-between mb-4">
                <div>
                  <Dialog.Title className="text-3xl font-bold" as={Title}>
                    Workflow Execution Details
                    <Badge
                      className="ml-4 capitalize"
                      color={
                        selectedExecution.status === "error"
                          ? "red"
                          : selectedExecution.status === "success"
                            ? "green"
                            : "orange"
                      }
                    >
                      {selectedExecution.status}
                    </Badge>
                  </Dialog.Title>
                </div>
                <div>
                  <Button onClick={toggle} variant="light">
                    <IoMdClose className="h-6 w-6 text-gray-500" />
                  </Button>
                </div>
              </div>

              <div className="flex-grow space-y-4">
                <Card>
                  <div className="space-y-4">
                    <div>
                      <Text className="block text-sm font-medium text-gray-700 mb-2">
                        Execution ID
                      </Text>
                      <TextInput value={selectedExecution.id} readOnly />
                    </div>
                    <div>
                      <Text className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </Text>
                      <div className="flex items-center">
                        {getIcon(selectedExecution.status)}
                        <span className="ml-2 capitalize">
                          {selectedExecution.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Text className="block text-sm font-medium text-gray-700 mb-2">
                        Triggered By
                      </Text>
                      <Button
                        className="px-3 py-0.5 bg-white text-black border-2 inline-flex items-center gap-2 font-bold hover:bg-white"
                        variant="secondary"
                        tooltip={selectedExecution.triggered_by ?? ""}
                        icon={getTriggerIcon(
                          extractTriggerValue(selectedExecution.triggered_by)
                        )}
                      >
                        <div>
                          {extractTriggerValue(selectedExecution.triggered_by)}
                        </div>
                      </Button>
                    </div>
                    <div>
                      <Text className="block text-sm font-medium text-gray-700 mb-2">
                        Execution Time
                      </Text>
                      <TextInput
                        value={
                          selectedExecution.execution_time
                            ? `${selectedExecution.execution_time} seconds`
                            : "N/A"
                        }
                        readOnly
                      />
                    </div>
                    <div>
                      <Text className="block text-sm font-medium text-gray-700 mb-2">
                        Started At
                      </Text>
                      <TextInput value={selectedExecution.started} readOnly />
                    </div>
                  </div>
                </Card>

                <Card>
                  <Text className="block text-sm font-medium text-gray-700 mb-2">
                    Execution Logs
                  </Text>
                  <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                    <pre className="whitespace-pre-wrap">
                      {Array.isArray(workflowExecutionData?.logs)
                        ? workflowExecutionData.logs.map((log, index) => (
                            <div key={index}>
                              {log.timestamp} - {log.message}
                            </div>
                          ))
                        : workflowExecutionData?.logs || "No logs available"}
                    </pre>
                  </div>
                </Card>
              </div>
            </Dialog.Panel>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
};

export default IncidentWorkflowSidebar;
