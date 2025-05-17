import { Callout } from "@tremor/react";
import { useIncident } from "@/utils/hooks/useIncidents";
import { Link } from "@/components/ui";
import { StatusIcon } from "@/entities/incidents/ui/statuses";
import { getIncidentName } from "@/entities/incidents/lib/utils";

export function MergedCallout({
  merged_into_incident_id,
  className,
}: {
  merged_into_incident_id: string;
  className?: string;
}) {
  const { data: mergedIncident } = useIncident(merged_into_incident_id);

  if (!mergedIncident) return null;

  return (
    <Callout
      title="This incident was merged into:"
      color="purple"
      className={className}
    >
      <Link
        icon={() => (
          <StatusIcon className="!p-0" status={mergedIncident.status} />
        )}
        href={`/incidents/${mergedIncident.id}`}
      >
        {getIncidentName(mergedIncident)}
      </Link>
    </Callout>
  );
}
