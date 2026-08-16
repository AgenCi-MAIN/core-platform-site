import { notFound } from "next/navigation";
import { requireCapability } from "../../../access";
import { CallReviewView } from "../view";

export const dynamic = "force-dynamic";

export default async function CallReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const session = await requireCapability("calls.review", `/portal/calls/review/${rawId}`);

  if (!/^\d+$/.test(rawId)) notFound();
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  return <CallReviewView session={session} id={id} />;
}
