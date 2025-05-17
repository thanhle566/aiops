import { Status } from "@/entities/incidents/model";
import { Icon, IconProps } from "@tremor/react";
import {
  Flame,
  CheckSquare,
  Eye,
  GitFork,
  XCircle
} from "lucide-react";
import React from "react";
import { capitalize } from "@/utils/helpers";

export const STATUS_COLORS = {
  [Status.Firing]: "red",
  [Status.Resolved]: "green",
  [Status.Acknowledged]: "gray",
  [Status.Merged]: "purple",
};

export const STATUS_ICONS = {
  [Status.Firing]: (
    <Icon
      icon={Flame}
      tooltip={capitalize(Status.Firing)}
      color="red"
      className="w-4 h-4 !p-0.5"
    />
  ),
  [Status.Resolved]: (
    <Icon
      icon={CheckSquare}
      tooltip={capitalize(Status.Resolved)}
      color="green"
      className="w-4 h-4 !p-0.5"
    />
  ),
  [Status.Acknowledged]: (
    <Icon
      icon={Eye}
      tooltip={capitalize(Status.Acknowledged)}
      color="gray"
      className="w-4 h-4 !p-0.5"
    />
  ),
  [Status.Merged]: (
    <Icon
      icon={GitFork}
      tooltip={capitalize(Status.Merged)}
      color="purple"
      className="w-4 h-4 !p-0.5"
    />
  ),
  [Status.Deleted]: (
    <Icon
      icon={XCircle}
      tooltip={capitalize(Status.Deleted)}
      color="gray"
      className="w-4 h-4 !p-0.5"
    />
  ),
};

export function StatusIcon({
  status,
  ...props
}: { status: Status } & Omit<IconProps, "icon" | "color">) {
  switch (status) {
    default:
    case Status.Firing:
      return <Icon icon={Flame} color="red" className="!p-0.5" {...props} />;
    case Status.Resolved:
      return <Icon icon={CheckSquare} color="green" className="!p-0.5" {...props} />;
    case Status.Acknowledged:
      return <Icon icon={Eye} color="gray" className="!p-0.5" {...props} />;
    case Status.Merged:
      return <Icon icon={GitFork} color="purple" className="!p-0.5" {...props} />;
  }
}
