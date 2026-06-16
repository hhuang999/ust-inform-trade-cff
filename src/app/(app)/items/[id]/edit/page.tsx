import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  requireVerifiedUser,
  NotAuthenticatedError,
} from "@/lib/permissions";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import ItemForm, { type ItemFormInitial } from "@/components/site/item-form";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
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
      redirect(`/login?callbackUrl=/items/${id}/edit`);
    }
    redirect("/settings");
  }

  const item = await prisma.item.findUnique({
    where: { id },
    select: {
      id: true,
      sellerId: true,
      status: true,
      title: true,
      description: true,
      category: true,
      condition: true,
      priceMode: true,
      price: true,
      originalPrice: true,
      imageKeys: true,
      tags: true,
      tradeMethods: true,
      pickupLocation: true,
      contactInfo: true,
      contactVisibility: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!item) notFound();
  if (item.sellerId !== user!.id) notFound();
  if (item.status !== "AVAILABLE" && item.status !== "PENDING") notFound();

  const initial: ItemFormInitial = {
    title: item.title,
    description: item.description,
    category: item.category,
    condition: item.condition,
    priceMode: item.priceMode,
    price: item.price ?? undefined,
    originalPrice: item.originalPrice ?? undefined,
    imageKeys: item.imageKeys,
    tags: item.tags,
    tradeMethods: item.tradeMethods,
    pickupLocation: item.pickupLocation ?? "",
    contactInfo: item.contactInfo,
    contactVisibility: item.contactVisibility,
  };

  return (
    <PageContainer className="max-w-3xl">
      <div className="space-y-6">
        <SectionHeading title="编辑物品" description="修改信息后保存" />
        <ItemForm mode="edit" itemId={item.id} initial={initial} />
      </div>
    </PageContainer>
  );
}
