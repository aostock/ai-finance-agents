import Link from "next/link";
import { Button } from "../ui/button";
import { TitleTooltip } from "./title-tooltip";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "./theme-toggle";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { PanelRightClose, PanelRightOpen, SquarePen } from "lucide-react";
import { motion } from "framer-motion";
// import { TooltipIconButton } from "../thread/tooltip-icon-button";
import { LangGraphLogoSVG } from "../icons/langgraph";
// import { useArtifactContext, useArtifactOpen } from "../thread/artifact";

export function PageHeader() {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  //   const [artifactContext, setArtifactContext] = useArtifactContext();
  //   const [artifactOpen, closeArtifact] = useArtifactOpen();

  //   const [threadId, _setThreadId] = useQueryState("threadId");
  //   const setThreadId = (id: string | null) => {
  //     _setThreadId(id);

  //     // close artifact and reset artifact context
  //     closeArtifact();
  //     setArtifactContext({});
  //   };
  return (
    <div className="relative z-10 flex items-center justify-between gap-3 p-2">
      <div className="relative flex items-center justify-start gap-2">
        <div className="absolute left-0 z-10">
          <Button
            className="hover:bg-muted"
            variant="ghost"
            onClick={() => setChatHistoryOpen((p) => !p)}
          >
            {chatHistoryOpen ? (
              <PanelRightOpen className="size-5" />
            ) : (
              <PanelRightClose className="size-5" />
            )}
          </Button>
        </div>
        {/* <motion.button
          className="flex cursor-pointer items-center gap-2"
          onClick={() => setThreadId(null)}
          animate={{
            marginLeft: !chatHistoryOpen ? 48 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          <LangGraphLogoSVG
            width={32}
            height={32}
          />
          <span className="text-xl font-semibold tracking-tight">
            Agent Chat
          </span>
        </motion.button> */}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <PageHeaderRight />
        </div>
        {/* <TooltipIconButton
          size="lg"
          className="p-4"
          tooltip="New thread"
          variant="ghost"
          onClick={() => setThreadId(null)}
        >
          <SquarePen className="size-5" />
        </TooltipIconButton> */}
      </div>

      <div className="from-background to-background/0 absolute inset-x-0 top-full h-5 bg-gradient-to-b" />
    </div>
  );
}

export function PageHeaderRight() {
  return (
    <div className="flex items-center">
      <div className="mr-2">
        <ThemeToggle />
      </div>
      <TitleTooltip title="Open GitHub repo">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="group relative z-10 border-0"
        >
          <Link
            href="https://github.com/aostock/ai-finance-agents"
            target="_blank"
          >
            <GitHubLogoIcon className="size-4" />
          </Link>
        </Button>
      </TitleTooltip>
    </div>
  );
}
