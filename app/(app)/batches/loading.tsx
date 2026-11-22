import { PageSkeleton } from "@/components/ui/states";

// Per-segment boundary: a layout-level one sits above client navigations and does not count.
export default function Loading() {
  return <PageSkeleton variant="list" label="Loading batches" />;
}
