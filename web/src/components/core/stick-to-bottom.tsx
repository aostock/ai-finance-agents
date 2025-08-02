import { ReactNode } from "react";
import {
  StickToBottom as OriginalStickToBottom,
  useStickToBottomContext,
} from "use-stick-to-bottom";
import { Button } from "../ui/button";
import { ArrowDown } from "lucide-react";

function StickyToBottomContent({
  children,
  footer,
  className,
  contentClassName,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={className}
    >
      <div
        ref={context.contentRef}
        className={contentClassName}
      >
        {children}
      </div>

      {footer}
    </div>
  );
}

function ScrollToBottom({
  className,
  position = "bottom-right",
}: {
  className?: string;
  position?: "bottom-right" | "inside-input";
}) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  const baseClasses = "z-10";
  const positionClasses =
    position === "bottom-right"
      ? "fixed bottom-4 right-4"
      : "absolute right-2 top-[-40px]";

  const combinedClasses = `${baseClasses} ${positionClasses} ${className || ""}`;

  return (
    <Button
      variant="outline"
      size={position === "inside-input" ? "sm" : "default"}
      className={combinedClasses}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
    </Button>
  );
}

export {
  OriginalStickToBottom as StickToBottom,
  StickyToBottomContent,
  ScrollToBottom,
  useStickToBottomContext,
};
