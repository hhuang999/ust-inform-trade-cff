import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";

import { auth } from "@/lib/auth";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";

import { FeedbackForm } from "./feedback-form";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/feedback");

  return (
    <PageContainer className="max-w-2xl">
      <SectionHeading
        title="反馈与建议"
        description="遇到问题或有想法?直接告诉开发者,我们一起把它变得更好。"
      />
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="size-4" />
            开发者信箱 · 收到后将尽快查看
          </div>
          <FeedbackForm />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
