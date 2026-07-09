import { EventPage } from "@/components/EventPage";
import { GATZARA_EVENT } from "@/lib/events";

export default function GatzaraPage() {
  return <EventPage config={GATZARA_EVENT} />;
}
