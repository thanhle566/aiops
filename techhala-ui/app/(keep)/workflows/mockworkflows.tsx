"use client";

import React, { useState } from "react";
import {
  MockStep,
  MockWorkflow,
  WorkflowTemplate,
} from "@/shared/api/workflows";
import { Button, Card } from "@tremor/react";
import { useRouter } from "next/navigation";
import { TiArrowRight } from "react-icons/ti";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import useSWR from "swr";
import { useApi } from "@/shared/lib/hooks/useApi";
import { ErrorComponent } from "@/shared/ui";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { DynamicImageProviderIcon } from "@/components/ui";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

export function WorkflowSteps({ workflow }: { workflow: MockWorkflow }) {
  const isStepPresent =
    !!workflow?.steps?.length &&
    workflow?.steps?.find((step: MockStep) => step?.provider?.type);

  return (
    <div className="container flex gap-1 items-center flex-wrap">
      {workflow?.steps?.map((step: any, index: number) => {
        const provider = step?.provider;
        if (["threshold", "assert", "foreach"].includes(provider?.type)) {
          return null;
        }
        return provider ? (
          <div
            key={`step-${step.id}-${index}`}
            className="flex items-center gap-1 flex-shrink-0"
          >
            {index > 0 && <TiArrowRight size={24} className="text-gray-500" />}
            <DynamicImageProviderIcon
              src={`/icons/${provider?.type}-icon.png`}
              width={24}
              height={24}
              alt={provider?.type}
              className="flex-shrink-0"
            />
          </div>
        ) : null;
      })}
      {workflow?.actions?.map((action: any, index: number) => {
        const provider = action?.provider;
        if (["threshold", "assert", "foreach"].includes(provider?.type)) {
          return null;
        }
        return provider ? (
          <div
            key={`action-${action.id}-${index}`}
            className="flex items-center gap-1 flex-shrink-0"
          >
            {(index > 0 || isStepPresent) && (
              <TiArrowRight size={24} className="text-gray-500" />
            )}
            <DynamicImageProviderIcon
              src={`/icons/${provider?.type}-icon.png`}
              width={24}
              height={24}
              alt={provider?.type}
              className="flex-shrink-0"
            />
          </div>
        ) : null;
      })}
    </div>
  );
}

export function WorkflowTemplates() {
  const api = useApi();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const {
    data: mockWorkflows,
    error: mockError,
    isLoading: mockLoading,
    mutate: refresh,
  } = useSWR<WorkflowTemplate[]>(
    api.isReady() ? `/workflows/random-templates` : null,
    (url: string) => api.get(url),
    {
      revalidateOnFocus: false,
    }
  );

  const getNameFromId = (id: string) => {
    if (!id) return "";
    return id.split("-").join(" ");
  };

  const handlePreview = (template: WorkflowTemplate) => {
    setLoadingId(template.workflow_raw_id);
    localStorage.setItem("preview_workflow", JSON.stringify(template));
    router.push(`/workflows/preview/${template.workflow_raw_id}`);
  };

  return (
    <div className="w-full flex flex-col gap-0 p-2">
      <div className="flex gap-2 justify-between items-baseline">
        <h2 className="text-xl font-semibold">Discover workflow templates</h2>
        <div className="flex justify-end items-center my-2">
          <Button
            icon={ArrowPathIcon}
            className="btn-primary"
            size="sm"
            onClick={() => refresh()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {mockError && <ErrorComponent error={mockError} reset={refresh} />}
      {!mockLoading && !mockError && mockWorkflows?.length === 0 && (
        <p className="text-center m-auto">No workflow templates found</p>
      )}

      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={16}
        autoplay={{ delay: 1500, disableOnInteraction: false }}
        breakpoints={{
          320: { slidesPerView: 1.2 },
          640: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
          1280: { slidesPerView: 5 },
        }}
        className="!overflow-visible max-w-full"
      >
        {mockLoading &&
          Array.from({ length: 8 }).map((_, index) => (
            <SwiperSlide key={`skeleton-${index}`}>
              <Skeleton className="w-full h-48 rounded-md" />
            </SwiperSlide>
          ))}

        {!mockLoading &&
          mockWorkflows?.map((template, index) => {
            const workflow = template.workflow;
            return (
              <SwiperSlide key={index} className="h-full">
                <Card
                  className="p-4 flex flex-col justify-between h-full border-2 border-transparent hover:border-primary-500 gap-2 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePreview(template);
                  }}
                >
                  <div className="min-h-36">
                    <WorkflowSteps workflow={workflow} />
                    <h3 className="text-lg sm:text-xl font-semibold line-clamp-2">
                      {getNameFromId(workflow.id)}
                    </h3>
                    <p className="mt-2 text-sm sm:text-base line-clamp-3">
                      {workflow.description}
                    </p>
                  </div>
                  <div>
                    <Button
                      variant="secondary"
                      disabled={!!(loadingId && loadingId !== workflow.id)}
                      loading={loadingId === workflow.id}
                    >
                      Preview
                    </Button>
                  </div>
                </Card>
              </SwiperSlide>
            );
          })}
      </Swiper>
    </div>
  );
}
