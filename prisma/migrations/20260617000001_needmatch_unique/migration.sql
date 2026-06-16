-- AddUniqueConstraint: one application per (need, provider)
CREATE UNIQUE INDEX "NeedMatch_needId_providerId_key" ON "NeedMatch"("needId", "providerId");
