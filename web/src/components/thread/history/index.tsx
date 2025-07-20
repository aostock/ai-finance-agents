import { Button } from "@/components/ui/button";
import { useThreads } from "@/providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect } from "react";

import { getContentString } from "../utils";
import { useQueryState, parseAsBoolean } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PanelRightOpen,
  PanelRightClose,
  Plus,
  Delete,
  RemoveFormattingIcon,
  DeleteIcon,
  Archive,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Logo } from "@/components/core/logo";
import { cn } from "@/lib/utils";

function ThreadList({
  threads,
  archiveThread,
  onThreadClick,
}: {
  threads: Thread[];
  archiveThread: (threadId: string) => Promise<void>;
  onThreadClick?: (threadId: string | null) => void;
}) {
  const [threadId, setThreadId] = useQueryState("threadId");

  return (
    <div className="flex h-full flex-col items-start justify-start gap-2 overflow-x-hidden overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      <div
        key={null}
        className="w-full px-1"
      >
        <Button
          variant="ghost"
          className={cn(
            threadId === null ? "bg-muted border" : "",
            "w-full items-start justify-start text-left font-normal",
          )}
          onClick={(e) => {
            e.preventDefault();
            onThreadClick?.(null);
            if (null === threadId) return;
            setThreadId(null);
          }}
        >
          <Plus />
          <p className="truncate text-ellipsis">New Chat</p>
        </Button>
      </div>
      {threads.map((t) => {
        let itemText = t.thread_id;
        if (
          typeof t.values === "object" &&
          t.values &&
          "messages" in t.values &&
          Array.isArray(t.values.messages) &&
          t.values.messages?.length > 0
        ) {
          const firstMessage = t.values.messages[0];
          itemText = getContentString(firstMessage.content);
        }
        return (
          <div
            key={t.thread_id}
            className="w-full px-1"
          >
            <Button
              variant="ghost"
              className={cn(
                threadId === t.thread_id ? "bg-muted border" : "",
                "flex w-full items-start justify-between text-left font-normal",
              )}
              onClick={(e) => {
                e.preventDefault();
                onThreadClick?.(t.thread_id);
                if (t.thread_id === threadId) return;
                setThreadId(t.thread_id);
              }}
            >
              <p className="w-0 flex-1 flex-grow truncate">{itemText}</p>
              <div
                className="cursor-pointer rounded-full p-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  archiveThread(t.thread_id);
                  if (t.thread_id === threadId) setThreadId(null);
                }}
              >
                <Archive />
              </div>
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function ThreadHistoryLoading() {
  return (
    <div className="flex h-full flex-col items-start justify-start gap-2 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {Array.from({ length: 30 }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i}`}
          className="h-10"
        />
      ))}
    </div>
  );
}

export default function ThreadHistory() {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );

  const {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
    archiveThread,
  } = useThreads();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  }, []);

  return (
    <>
      <div className="hidden h-screen shrink-0 flex-col items-start justify-start gap-6 border-r-[1px] border-slate-300 lg:flex">
        <div className="flex items-center justify-between px-4 pt-4.5">
          <h1 className="text-xl font-semibold tracking-tight">
            <Logo />
          </h1>
        </div>
        <div className="w-full pl-1.5">
          {threadsLoading ? (
            <ThreadHistoryLoading />
          ) : (
            <ThreadList
              threads={threads}
              archiveThread={archiveThread}
            />
          )}
        </div>
      </div>
      <div className="lg:hidden">
        <Sheet
          open={!!chatHistoryOpen && !isLargeScreen}
          onOpenChange={(open) => {
            if (isLargeScreen) return;
            setChatHistoryOpen(open);
          }}
        >
          <SheetContent
            side="left"
            className="flex lg:hidden"
          >
            <SheetHeader>
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <ThreadList
              threads={threads}
              archiveThread={archiveThread}
              onThreadClick={() => setChatHistoryOpen((o) => !o)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
