import { RoadmapIndexView } from "@/components/placement/roadmap-index-view";

export default async function RoadmapPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const { open } = await searchParams;
  return <RoadmapIndexView initialOpen={open} />;
}
