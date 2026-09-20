import { DaziwuApp } from "@/components/daziwu-app";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

export default function Home() {
  return (
    <>
      <DaziwuApp />
      <ServiceWorkerRegistration />
    </>
  );
}
