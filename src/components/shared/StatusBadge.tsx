import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  active: "bg-secondary/15 text-secondary",
  inactive: "bg-muted/15 text-muted",
  warning: "bg-warning/15 text-warning-foreground",
  critical: "bg-destructive/15 text-destructive",
  info: "bg-primary/10 text-primary",
};

const StatusBadge = ({ status, label }: { status: string; label: string }) => (
  <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold", variants[status] || variants.info)}>
    {label}
  </span>
);

export default StatusBadge;
