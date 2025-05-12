"use client";

import { useState } from "react";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import Markdown from "react-markdown";
import clsx from "clsx";
import { Disclosure } from "@headlessui/react";
import { IoChevronDown } from "react-icons/io5";
import { Button } from "@/components/ui";
import { TbSparkles } from "react-icons/tb";
import { useCopilotAction, useCopilotContext, useCopilotReadable, CopilotTask } from "@copilotkit/react-core";
import { useIncidentActions } from "@/entities/incidents/model";
import { IncidentDto } from "@/entities/incidents/model";
import { AlertDto } from "@/entities/alerts/model";

interface SummaryProps {
  title: string;
  summary: string;
  collapsable?: boolean;
  className?: string;
  alerts: AlertDto[];
  incident: IncidentDto;
}

export function Summary({
  title,
  summary,
  collapsable,
  className,
  alerts,
  incident,
}: SummaryProps) {
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const { updateIncident } = useIncidentActions();
  const context = useCopilotContext();

  useCopilotReadable({ description: "The incident alerts", value: alerts });
  useCopilotReadable({
    description: "The incident title",
    value: incident.user_generated_name ?? incident.ai_generated_name,
  });

  useCopilotAction({
    name: "setGeneratedSummary",
    description: "Set the generated summary",
    parameters: [
      { name: "summary", type: "string", description: "The generated summary" },
    ],
    handler: async ({ summary }) => {
      await updateIncident(incident.id, { user_summary: summary }, true);
      setGeneratedSummary(summary);
    },
  });

  const task = new CopilotTask({
    instructions:
      "Generate a short concise summary of the incident based on the context of the alerts and the title of the incident. Don't repeat prompt.",
  });

  const executeTask = async () => {
    setGeneratingSummary(true);
    await task.run(context);
    setGeneratingSummary(false);
  };

  const formatted = (
    <div className="prose prose-slate max-w-none [&>p]:!my-1 [&>ul]:!my-1 [&>ol]:!my-1">
      <Markdown
        remarkPlugins={[remarkGfm, remarkRehype]}
        rehypePlugins={[rehypeRaw]}
      >
        {summary ?? generatedSummary}
      </Markdown>
    </div>
  );

  if (collapsable) {
    return (
      <Disclosure as="div" className={clsx("space-y-1", className)}>
        <Disclosure.Button>
          {({ open }) => (
            <h4 className="text-gray-500 text-sm inline-flex justify-between items-center gap-1">
              <span>{title}</span>
              <IoChevronDown
                className={clsx({ "rotate-180": open }, "text-slate-400")}
              />
            </h4>
          )}
        </Disclosure.Button>
        <Disclosure.Panel as="div" className="space-y-2 relative">
          {formatted}
        </Disclosure.Panel>
      </Disclosure>
    );
  }

  return (
    <div>
      {formatted}
      <Button
        variant="secondary"
        onClick={executeTask}
        className="mt-2.5"
        disabled={generatingSummary}
        loading={generatingSummary}
        icon={TbSparkles}
        size="xs"
      >
        AI Summary
      </Button>
    </div>
  );
}
