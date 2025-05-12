import {
  useIncidentActions,
  type IncidentDto,
} from "@/entities/incidents/model";
import { Badge, Button } from "@tremor/react";
import { Link } from "@/components/ui";
import { MdBlock, MdDone, MdModeEdit, MdPlayArrow } from "react-icons/md";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ManualRunWorkflowModal from "@/app/(keep)/workflows/manual-run-workflow-modal";
import { CreateOrUpdateIncidentForm } from "@/features/create-or-update-incident";
import Modal from "@/components/ui/Modal";
import { IncidentSeverityBadge } from "@/entities/incidents/ui";
import { getIncidentName } from "@/entities/incidents/lib/utils";
import { useIncident } from "@/utils/hooks/useIncidents";
import { IncidentOverview } from "./incident-overview";
import { CopilotKit } from "@copilotkit/react-core";
import { TbInfoCircle, TbTopologyStar3 } from "react-icons/tb";

export function IncidentHeader({ incident: initialIncidentData }: { incident: IncidentDto }) {
  const { data: fetchedIncident } = useIncident(initialIncidentData.id, {
    fallbackData: initialIncidentData,
    revalidateOnMount: false,
  });

  const incident = fetchedIncident || initialIncidentData;
  const { deleteIncident, confirmPredictedIncident } = useIncidentActions();

  const router = useRouter();
  const pathname = usePathname();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [runWorkflowModalIncident, setRunWorkflowModalIncident] = useState<IncidentDto | null>(null);

  const handleEdit = () => setIsFormOpen(true);
  const handleCloseEdit = () => setIsFormOpen(false);
  const handleWorkflow = () => setRunWorkflowModalIncident(incident);

  const pathNameCapitalized = pathname.split("/").pop()?.replace(/^[a-z]/, (match) => match.toUpperCase());

  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <header className="mb-6 border-b border-gray-100 pb-4">
        {/* Top: breadcrumb + action */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <nav className="text-xs text-gray-400 flex items-center space-x-1">
              <Link href="/incidents" className="hover:underline">All Incidents</Link>
              <span>/</span>
              <span>{getIncidentName(incident)}</span>
              {pathNameCapitalized && (
                <>
                  <span>/</span>
                  <span>{pathNameCapitalized}</span>
                </>
              )}
            </nav>
            <h1 className="text-2xl font-semibold text-gray-900 mt-1">
              {incident.user_generated_name || incident.ai_generated_name || "Unnamed Incident"}
            </h1>
          </div>

          {!incident.is_candidate && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="xs"
                variant="secondary"
                icon={MdPlayArrow}
                onClick={handleWorkflow}
              >
                Run Workflow
              </Button>
              <Button
                size="xs"
                variant="secondary"
                icon={MdModeEdit}
                onClick={handleEdit}
              >
                Edit
              </Button>
            </div>
          )}
        </div>

        {/* Middle: status badges */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {incident.incident_type === "topology" && (
            <Badge size="xs" color="blue" icon={TbTopologyStar3}>
              Topology
            </Badge>
          )}
          {incident.rule_is_deleted && (
            <Badge size="xs" color="red" icon={TbInfoCircle}>
              Orphaned Rule
            </Badge>
          )}
          <IncidentSeverityBadge severity={incident.severity} />
        </div>

        {/* Bottom: candidate confirmation actions */}
        {incident.is_candidate && (
          <div className="mt-4 flex gap-2">
            <Button
              size="xs"
              variant="primary"
              icon={MdDone}
              onClick={() => confirmPredictedIncident(incident.id!)}
            >
              Confirm Incident
            </Button>
            <Button
              size="xs"
              variant="secondary"
              color="red"
              icon={MdBlock}
              onClick={async () => {
                const success = await deleteIncident(incident.id);
                if (success) router.push("/incidents");
              }}
            >
              Discard
            </Button>
          </div>
        )}
      </header>

      <IncidentOverview incident={incident} />

      {/* Edit modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleCloseEdit}
        className="w-[600px]"
        title="Edit Incident"
      >
        <CreateOrUpdateIncidentForm
          incidentToEdit={incident}
          exitCallback={handleCloseEdit}
        />
      </Modal>

      {/* Workflow modal */}
      <ManualRunWorkflowModal
        incident={runWorkflowModalIncident}
        handleClose={() => setRunWorkflowModalIncident(null)}
      />
    </CopilotKit>
  );
}
