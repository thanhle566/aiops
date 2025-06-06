"use client";

import { ApplicationCard } from "./application-card";
import { Button } from "@/components/ui";
import { useCallback, useState } from "react";
import {
  useTopologyApplications,
  TopologyApplication,
} from "@/app/(keep)/topology/model";
import { Card, Subtitle, Title } from "@tremor/react";
import {
  TopologySearchContext,
  useTopologySearchContext,
} from "../../TopologySearchContext";
import { ApplicationModal } from "@/app/(keep)/topology/ui/applications/application-modal";
import { EmptyStateCard, showErrorToast } from "@/shared/ui";
import { PlusIcon, RectangleGroupIcon } from "@heroicons/react/20/solid";

type ModalState = {
  isOpen: boolean;
  actionType: "create" | "edit";
  application?: TopologyApplication;
};

const initialModalState: ModalState = {
  isOpen: false,
  actionType: "create",
  application: undefined,
};

export function ApplicationsList({
  applications: initialApplications,
}: {
  applications?: TopologyApplication[];
}) {
  const { applications, addApplication, removeApplication, updateApplication } =
    useTopologyApplications({
      initialData: initialApplications,
    });
  const { setSelectedObjectId, setSelectedApplicationIds } =
    useTopologySearchContext();
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    actionType: "create",
    application: undefined,
  });

  const handleEditApplication = (application: TopologyApplication) => {
    setModalState({
      isOpen: true,
      actionType: "edit",
      application,
    });
  };

  const handleCreateApplication = useCallback(
    async (applicationValues: Omit<TopologyApplication, "id">) => {
      const application = await addApplication(applicationValues);
      setModalState(initialModalState);
    },
    [addApplication]
  );

  const handleUpdateApplication = useCallback(
    async (updatedApplication: TopologyApplication) => {
      setModalState(initialModalState);
      updateApplication(updatedApplication).then(
        () => {},
        (error) => {
          showErrorToast(error, "Failed to update application");
        }
      );
    },
    [updateApplication]
  );

  const handleRemoveApplication = useCallback(
    async (applicationId: string) => {
      try {
        removeApplication(applicationId);
        setModalState(initialModalState);
      } catch (error) {
        showErrorToast(error, "Failed to delete application");
      }
    },
    [removeApplication]
  );

  function renderEmptyState() {
    return (
      <>
        <EmptyStateCard
          icon={RectangleGroupIcon}
          title="No applications yet"
          description="Group services that work together into applications for easier management and monitoring"
        >
          <Button
            variant="primary"
            className="btn-primary"
            onClick={() => {
              setModalState({
                isOpen: true,
                actionType: "create",
                application: undefined,
              });
            }}
          >
            Create Application
          </Button>
        </EmptyStateCard>
      </>
    );
  }

  return (
    <>
      {applications.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <div className="flex w-full items-center justify-between mb-4">
            <div>
              <Title>Applications</Title>
              <Subtitle>
                Group services that work together into applications for easier
                management and monitoring
              </Subtitle>
            </div>
            <div>
              <Button
                variant="primary"
                className="btn-primary"
                onClick={() => {
                  setModalState({ ...initialModalState, isOpen: true });
                }}
                icon={PlusIcon}
              >
                Add Application
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                actionButtons={
                  <div className="flex gap-4">
                    <Button
                      variant="light"
                      className="btn-primary p-2"
                      onClick={() => {
                        setSelectedApplicationIds([application.id]);
                        setSelectedObjectId(application.id);
                      }}
                    >
                      Show on map
                    </Button>
                    <Button
                      variant="secondary"
                      className="btn-primary"
                      onClick={() => handleEditApplication(application)}
                    >
                      Edit
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        </>
      )}
      {modalState.actionType === "create" ? (
        <ApplicationModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState(initialModalState)}
          actionType={modalState.actionType}
          application={modalState.application}
          onSubmit={handleCreateApplication}
        />
      ) : (
        <ApplicationModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState(initialModalState)}
          actionType={modalState.actionType}
          application={modalState.application!}
          onSubmit={handleUpdateApplication}
          onDelete={() => handleRemoveApplication(modalState.application!.id)}
        />
      )}
    </>
  );
}
