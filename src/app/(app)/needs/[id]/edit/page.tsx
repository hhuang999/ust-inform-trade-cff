import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  requireVerifiedUser,
  NotAuthenticatedError,
} from "@/lib/permissions";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import NeedForm, { type NeedFormInitial } from "@/components/site/need-form";

export const dynamic = "force-dynamic";

export default async function EditNeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  const user = session?.user
    ? {
        id: session.user.id,
        role: session.user.role,
        verificationStatus: session.user.verificationStatus,
      }
    : null;

  try {
    requireVerifiedUser(user);
  } catch (e) {
    if (e instanceof NotAuthenticatedError) {
      redirect(`/login?callbackUrl=/needs/${id}/edit`);
    }
    redirect("/settings");
  }

  const need = await prisma.need.findUnique({
    where: { id },
    select: {
      id: true,
      requesterId: true,
      status: true,
      title: true,
      description: true,
      expectedProfile: true,
      reward: true,
      expectedTime: true,
      formatPreference: true,
      category: true,
      contactInfo: true,
      contactVisibility: true,
    },
  });

  if (!need) notFound();
  if (need.requesterId !== user!.id) notFound();
  if (need.status !== "OPEN" && need.status !== "PAUSED") notFound();

  const initial: NeedFormInitial = {
    title: need.title,
    description: need.description,
    expectedProfile: need.expectedProfile ?? "",
    reward: need.reward,
    expectedTime: need.expectedTime as NeedFormInitial["expectedTime"],
    formatPreference: need.formatPreference as NeedFormInitial["formatPreference"],
    category: need.category,
    contactInfo: need.contactInfo,
    contactVisibility: need.contactVisibility,
  };

  return (
    <PageContainer className="max-w-3xl">
      <div className="space-y-6">
        <SectionHeading title="编辑需求" description="修改信息后保存" />
        <NeedForm mode="edit" needId={need.id} initial={initial} />
      </div>
    </PageContainer>
  );
}
