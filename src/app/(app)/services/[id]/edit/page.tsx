import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  requireVerifiedUser,
  NotAuthenticatedError,
} from "@/lib/permissions";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import ServiceForm, { type ServiceFormInitial } from "@/components/site/service-form";

export const dynamic = "force-dynamic";

export default async function EditServicePage({
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
      redirect(`/login?callbackUrl=/services/${id}/edit`);
    }
    redirect("/settings");
  }

  const service = await prisma.service.findUnique({
    where: { id },
    select: {
      id: true,
      providerId: true,
      status: true,
      title: true,
      description: true,
      qualification: true,
      proofImageKeys: true,
      categories: true,
      formats: true,
      durationTier: true,
      price: true,
      contactInfo: true,
      contactVisibility: true,
    },
  });

  if (!service) notFound();
  if (service.providerId !== user!.id) notFound();
  if (service.status !== "ACTIVE" && service.status !== "PAUSED") notFound();

  const initial: ServiceFormInitial = {
    title: service.title,
    description: service.description,
    qualification: service.qualification,
    proofImageKeys: service.proofImageKeys,
    categories: service.categories,
    formats: service.formats,
    durationTier: service.durationTier ?? null,
    price: service.price,
    contactInfo: service.contactInfo,
    contactVisibility: service.contactVisibility,
  };

  return (
    <PageContainer className="max-w-3xl">
      <div className="space-y-6">
        <SectionHeading title="编辑服务" description="修改信息后保存" />
        <ServiceForm mode="edit" serviceId={service.id} initial={initial} />
      </div>
    </PageContainer>
  );
}
