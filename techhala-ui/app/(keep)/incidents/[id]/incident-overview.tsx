import { IncidentDto } from "@/entities/incidents/model";
import { useIncident, useIncidentAlerts } from "@/utils/hooks/useIncidents";
import { useIncidentActions } from "@/entities/incidents/model";
import { useRouter } from "next/navigation";
import { Badge } from "@tremor/react";
import { IncidentChangeStatusSelect } from "@/features/change-incident-status";
import { IncidentChangeSeveritySelect } from "@/features/change-incident-severity";
import { DateTimeField, FieldHeader } from "@/shared/ui";
import { RootCauseAnalysis } from "@/components/ui/RootCauseAnalysis";
import { SameIncidentField, FollowingIncidents } from "@/features/same-incidents-in-the-past/";
import { DynamicImageProviderIcon, Link } from "@/components/ui";
import { MergedCallout } from "./merged-callout";
import { Summary } from "./summary";
import { IncidentOverviewSkeleton } from "../incident-overview-skeleton";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-none p-4 bg-white shadow-sm space-y-2">
      <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
      <div className="text-sm text-gray-900">{children}</div>
    </div>
  );
}

export function IncidentOverview({ incident: initialIncidentData }: { incident: IncidentDto }) {
  const router = useRouter();
  const { data: fetchedIncident } = useIncident(initialIncidentData.id, {
    fallbackData: initialIncidentData,
    revalidateOnMount: false,
  });

  const incident = fetchedIncident || initialIncidentData;
  const summary = incident.user_summary || incident.generated_summary;
  const { assignIncident } = useIncidentActions();

  const {
    data: alerts,
    isLoading: alertsLoading,
  } = useIncidentAlerts(incident.id, 20, 0);

  const notNullServices = incident.services.filter((service) => service !== "null");
  const environments = Array.from(new Set(alerts?.items
    .filter(alert => alert.environment && alert.environment !== "undefined" && alert.environment !== "default")
    .map(alert => alert.environment)));

  const repositories = Array.from(new Set(
    alerts?.items
      .filter((alert) => (alert as any).repository)
      .map((alert) => (alert as any).repository as string)
  ));

  const filterBy = (key: string, value: string) => {
    router.push(`/alerts/feed?cel=${key}%3D%3D${encodeURIComponent(`"${value}"`)}`);
  };

  if (!alerts || alertsLoading) {
    return <IncidentOverviewSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-sm text-gray-800 my-4">
      <Card title="Summary">
        <Summary
          title="Summary"
          summary={summary}
          alerts={alerts.items}
          incident={incident}
        />
        {incident.merged_into_incident_id && (
          <MergedCallout
            className="inline-block mt-2"
            merged_into_incident_id={incident.merged_into_incident_id}
          />
        )}
        <div className="mt-2">
          <SameIncidentField incident={incident} />
        </div>
      </Card>

      <Card title="Services">
        {notNullServices.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {notNullServices.map((service) => (
              <Badge
                key={service}
                color="red"
                size="sm"
                className="cursor-pointer"
                onClick={() => filterBy("service", service)}
              >
                {service}
              </Badge>
            ))}
          </div>
        ) : (
          <p>No services involved</p>
        )}
      </Card>

      <Card title="Environments">
        {environments.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {environments.map((env) => (
              <Badge
                key={env}
                color="red"
                size="sm"
                className="cursor-pointer"
                onClick={() => filterBy("environment", env)}
              >
                {env}
              </Badge>
            ))}
          </div>
        ) : (
          <p>No environments involved</p>
        )}
      </Card>

      <Card title="External Incident">
        {incident.enrichments?.incident_id && incident.enrichments?.incident_url ? (
          <Badge
            size="sm"
            color="red"
            icon={
              incident.enrichments.incident_provider
                ? (props) => (
                    <DynamicImageProviderIcon
                      providerType={incident.enrichments.incident_provider}
                      src={`/icons/${incident.enrichments.incident_provider}-icon.png`}
                      height="24"
                      width="24"
                      {...props}
                    />
                  )
                : undefined
            }
            className="cursor-pointer"
            onClick={() => window.open(incident.enrichments.incident_url, "_blank")}
          >
            {incident.enrichments.incident_title ?? incident.user_generated_name}
          </Badge>
        ) : (
          <p>No external incidents</p>
        )}
      </Card>

      <Card title="Repositories">
        {repositories.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {repositories.map((repo) => {
              const repoName = repo.split("/").pop();
              return (
                <Badge
                  key={repo}
                  color="red"
                  size="sm"
                  icon={(props) => (
                    <DynamicImageProviderIcon
                      providerType="github"
                      src={`/icons/github-icon.png`}
                      height="24"
                      width="24"
                      {...props}
                    />
                  )}
                  className="cursor-pointer"
                  onClick={() => window.open(repo, "_blank")}
                >
                  {repoName}
                </Badge>
              );
            })}
          </div>
        ) : (
          <p>No repositories</p>
        )}
      </Card>

      <Card title="Assignee">
        {incident.assignee ? (
          <p>{incident.assignee}</p>
        ) : (
          <p>No assignee yet</p>
        )}
        <span
          className="text-xs text-blue-600 cursor-pointer underline mt-1 inline-block"
          onClick={() => {
            if (confirm("Are you sure you want to assign this incident to yourself?")) {
              assignIncident(incident.id);
            }
          }}
        >
          Assign to me
        </span>
      </Card>

      <Card title="Status">
        <IncidentChangeStatusSelect incidentId={incident.id} value={incident.status} />
      </Card>

      <Card title="Severity">
        <IncidentChangeSeveritySelect incidentId={incident.id} value={incident.severity} />
      </Card>

      {incident.start_time && (
        <Card title="Started at">
          <DateTimeField date={incident.start_time} />
        </Card>
      )}

      {incident.last_seen_time && (
        <Card title="Last seen at">
          <DateTimeField date={incident.last_seen_time} />
        </Card>
      )}

      {incident?.enrichments?.rca_points && (
        <Card title="Root Cause Analysis">
          <RootCauseAnalysis points={incident.enrichments.rca_points} />
        </Card>
      )}

      <Card title="Resolve on">
        <Badge
          size="sm"
          color="red"
          className="cursor-help"
          tooltip={
            incident.resolve_on === "all_resolved"
              ? "Incident will be resolved when all its alerts are resolved"
              : "Incident will resolve only when manually set to resolved"
          }
        >
          {incident.resolve_on}
        </Badge>
      </Card>

      <Card title="Following Incidents">
        <FollowingIncidents incident={incident} />
      </Card>
    </div>
  );
}
