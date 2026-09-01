import { redirect } from "next/navigation";

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/roadmap?open=${encodeURIComponent(decodeURIComponent(id))}`);
}
