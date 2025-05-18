"use client";

import { Title } from "@tremor/react";
import { useAIStats, useAIActions } from "utils/hooks/useAI";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import debounce from "lodash.debounce";
import {
  KeepLoader,
  PageSubtitle,
  showErrorToast,
  showSuccessToast,
  PageTitle,
} from "@/shared/ui";
import { AIConfig } from "./model";

function RangeInputWithLabel({
  setting,
  onChange,
}: {
  setting: any;
  onChange: (newValue: number) => void;
}) {
  const [value, setValue] = useState(setting.value);

  const debouncedOnChange = useMemo(
    () => debounce((value: number) => onChange(value), 1000),
    [onChange]
  );

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  return (
    <div className="flex flex-col gap-1 items-end w-full">
      <p className="text-right text-xs text-gray-500">Value: {value}</p>
      <input
        type="range"
        className="w-full appearance-none h-2 bg-gray-200 rounded-full outline-none accent-purple-600
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-purple-500"
        step={(setting.max - setting.min) / 100}
        min={setting.min}
        max={setting.max}
        value={value}
        onChange={(e) => {
          const newValue =
            setting.type === "float"
              ? parseFloat(e.target.value)
              : parseInt(e.target.value, 10);
          setValue(newValue);
          debouncedOnChange(newValue);
        }}
      />
    </div>
  );
}

export function AIPlugins() {
  const {
    data: aistats,
    isLoading,
    mutate: refetchAIStats,
  } = useAIStats({ refreshInterval: 5000 });
  const { updateAISettings } = useAIActions();

  const handleUpdateAISettings = async (
    algorithm_id: string,
    algorithm_config: AIConfig
  ) => {
    try {
      await updateAISettings(algorithm_id, algorithm_config);
      showSuccessToast("Settings updated successfully!");
      refetchAIStats();
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <main className="flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <div>
          <PageTitle>AI Plugins</PageTitle>
          <PageSubtitle>
            For correlation, summarization, and enrichment
          </PageSubtitle>
        </div>
      </header>

      <section className="divide-y divide-gray-200 rounded-md border border-gray-300 shadow-sm bg-white">
        {isLoading && <KeepLoader loadingText="Loading AI settings..." />}

        {aistats?.algorithm_configs?.length === 0 && (
          <div className="flex flex-row p-6">
            <Image
              src="/keep_sleeping.png"
              alt="AI"
              width={300}
              height={300}
              className="mr-4 rounded-lg"
            />
            <div>
              <Title>No AI enabled for this tenant</Title>
              <p className="pt-2">
                AI plugins can correlate, enrich, or summarize your alerts and
                incidents by leveraging the the context within Keep.
              </p>
              <p className="pt-2">
                AI plugins work in air-gapped environments, no external data
                sharing needed.
              </p>
              <p className="pt-2">
                <a
                  href="https://techhala.com/meet-keep"
                  className="text-purple-600 underline"
                >
                  Talk to us to get access!
                </a>
              </p>
            </div>
          </div>
        )}

        {aistats?.algorithm_configs?.map((algorithm_config, index) => (
          <div key={index} className="px-6 py-4">
            <div className="flex flex-col gap-2 mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {algorithm_config.algorithm.name}
              </h3>
              <p className="text-sm text-gray-500">
                {algorithm_config.algorithm.description}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {algorithm_config.settings.map((setting) => (
                <div
                  key={setting.name}
                  className="flex flex-col sm:flex-row items-start gap-2"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{setting.name}</p>
                    <p className="text-xs text-gray-500">
                      {setting.description}
                    </p>
                  </div>

                  {setting.type === "bool" ? (
                    <input
                      type="checkbox"
                      className="mt-1 accent-purple-500"
                      checked={setting.value}
                      onChange={(e) => {
                        setting.value = e.target.checked;
                        handleUpdateAISettings(
                          algorithm_config.algorithm_id,
                          algorithm_config
                        );
                      }}
                    />
                  ) : (
                    <div className="flex-1">
                      <RangeInputWithLabel
                        key={setting.value}
                        setting={setting}
                        onChange={(newValue) => {
                          setting.value = newValue;
                          handleUpdateAISettings(
                            algorithm_config.algorithm_id,
                            algorithm_config
                          );
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {algorithm_config.settings_proposed_by_algorithm &&
              JSON.stringify(algorithm_config.settings) !==
                JSON.stringify(
                  algorithm_config.settings_proposed_by_algorithm
                ) && (
                <div className="bg-gray-50 border-l-4 border-purple-400 p-4 mt-4 rounded-md">
                  <h4 className="font-medium text-purple-700">
                    New Settings Proposed
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    These were recommended during the latest inference.
                  </p>
                  {algorithm_config.settings_proposed_by_algorithm.map(
                    (proposed_setting, idx) => (
                      <p key={idx} className="text-sm text-gray-700 mt-1">
                        <span className="font-semibold">
                          {proposed_setting.name}:
                        </span>{" "}
                        {String(proposed_setting.value)}
                      </p>
                    )
                  )}
                  <button
                    onClick={() => {
                      algorithm_config.settings =
                        algorithm_config.settings_proposed_by_algorithm;
                      handleUpdateAISettings(
                        algorithm_config.algorithm_id,
                        algorithm_config
                      );
                    }}
                    className="mt-3 inline-block px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition"
                  >
                    Apply proposed settings
                  </button>
                </div>
              )}

            <details className="mt-4">
              <summary className="cursor-pointer font-medium text-gray-700">
                View Execution Logs
              </summary>
              <pre className="mt-2 bg-gray-100 p-3 text-sm rounded whitespace-pre-wrap">
                {algorithm_config.feedback_logs ||
                  "Algorithm not executed yet."}
              </pre>
            </details>
          </div>
        ))}
      </section>
    </main>
  );
}