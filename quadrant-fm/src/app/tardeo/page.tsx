import { EventPage } from "@/components/EventPage";
import { TARDEO_EVENT } from "@/lib/events";

export default function TardeoPage() {
  return <EventPage config={TARDEO_EVENT} />;
}
