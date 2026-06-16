import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Standard page content wrapper: centered, comfortable horizontal padding,
 * vertical rhythm for quiet reading.
 */
export function PageContainer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1200px] px-4 py-8 md:px-8",
        className
      )}
      {...props}
    />
  );
}
