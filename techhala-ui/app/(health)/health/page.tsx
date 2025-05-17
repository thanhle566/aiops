import { Metadata } from "next";
import ProviderHealthPage from "./check";

export const metadata: Metadata = {
  title: "TechHala – Check your alerts quality",
  description:
    "Easily check the configuration quality of your observability tools such as Datadog, Grafana, Prometheus, and more without the need to sign up.",
};

export default ProviderHealthPage;

