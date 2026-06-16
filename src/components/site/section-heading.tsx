import * as React from "react";

/** Section heading: serif title, optional muted description, trailing action. */
export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" +
        (className ? " " + className : "")
      }
    >
      <div className="space-y-1">
        <h2 className="font-serif text-2xl font-bold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
