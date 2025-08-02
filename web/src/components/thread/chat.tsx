import { ReactNode, useEffect, useRef, useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { v4 as uuidv4 } from "uuid";
import { Button } from "../ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import { ArrowDown, LoaderCircle, ArrowUp, Paperclip } from "lucide-react";
import { useQueryState, parseAsBoolean } from "nuqs";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

import { useFileUpload } from "@/hooks/use-file-upload";
import { ContentBlocksPreview } from "./ContentBlocksPreview";
import {
  useArtifactOpen,
  ArtifactContent,
  ArtifactTitle,
  useArtifactContext,
} from "./artifact";

import { PageHeader } from "../core/page-header";
import { Logo } from "../core/logo";
import { AssistantList } from "../core/assistants";
import { TitleTooltip } from "../core/title-tooltip";
import { Suggestions } from "./messages/suggestions";
import {
  StickToBottom,
  StickyToBottomContent,
  ScrollToBottom,
} from "../core/stick-to-bottom";

export function Chat() {
  const [artifactContext, setArtifactContext] = useArtifactContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();

  const [threadId, _setThreadId] = useQueryState("threadId");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const [hideToolCalls, setHideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false),
  );
  const [input, setInput] = useState("");
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks,
    dragOver,
    handlePaste,
  } = useFileUpload();
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;
  const messageMetadatas = [];
  for (const message of messages) {
    messageMetadatas.push(stream.getMessagesMetadata(message));
  }
  if (
    messages.length > 0 &&
    stream.isLoading &&
    messages[messages.length - 1].type === "ai"
  ) {
    const lastMessage = messages[messages.length - 1];
    console.log("lastMessage", messages, lastMessage);
  }
  const lastError = useRef<string | undefined>(undefined);

  const setThreadId = (id: string | null) => {
    _setThreadId(id);

    // close artifact and reset artifact context
    closeArtifact();
    setArtifactContext({});
  };

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // TODO: this should be part of the useStream hook
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }

    prevMessageLength.current = messages.length;
  }, [messages]);

  const sendMessage = (text: string) => {
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        ...(text.trim().length > 0 ? [{ type: "text", text: text }] : []),
        ...contentBlocks,
      ] as Message["content"],
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    const context =
      Object.keys(artifactContext).length > 0 ? artifactContext : undefined;

    stream.submit(
      { messages: [...toolMessages, newHumanMessage], context },
      {
        streamMode: ["values"],
        optimisticValues: (prev) => ({
          ...prev,
          context,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );
    setContentBlocks([]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim().length === 0 && contentBlocks.length === 0) || isLoading)
      return;
    sendMessage(input);
    setInput("");
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
    });
  };

  const chatStarted = !!threadId || !!messages.length;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );

  const leftWidth = 260;

  const isMessageShow = (message: Message) => {
    const response_metadata = message.response_metadata;
    if (response_metadata && response_metadata.hide) {
      return false;
    }
    return true;
  };

  return (
    <div
      className={cn(
        "grid h-full w-full grid-cols-[1fr_0fr] transition-all duration-500",
        artifactOpen && "grid-cols-[3fr_2fr]",
      )}
    >
      <motion.div
        className={cn(
          "relative flex min-w-0 flex-1 flex-col overflow-hidden",
          !chatStarted && "grid-rows-[1fr]",
        )}
        layout={isLargeScreen}
        transition={
          isLargeScreen
            ? { type: "spring", stiffness: leftWidth, damping: 30 }
            : { duration: 0 }
        }
      >
        <PageHeader />

        <StickToBottom className="relative flex-1 overflow-hidden">
          <StickyToBottomContent
            className={cn(
              "absolute inset-0 overflow-x-hidden overflow-y-scroll px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
              !chatStarted && "mt-[25vh] flex flex-col items-stretch",
              chatStarted && "grid grid-rows-[1fr_auto]",
            )}
            contentClassName="pt-8 pb-16  max-w-3xl mx-auto flex flex-col gap-4 w-full"
            content={
              <>
                {messages
                  .filter(
                    (m) =>
                      !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX) &&
                      isMessageShow(m),
                  )
                  .map((message, index) =>
                    message.type === "human" ? (
                      <HumanMessage
                        key={message.id || `${message.type}-${index}`}
                        message={message}
                        isLoading={isLoading}
                      />
                    ) : (
                      <AssistantMessage
                        key={message.id || `${message.type}-${index}`}
                        message={message}
                        isLoading={isLoading}
                        handleRegenerate={handleRegenerate}
                      />
                    ),
                  )}
                {/* Special rendering case where there are no AI/tool messages, but there is an interrupt.
                  We need to render it outside of the messages list, since there are no messages to render */}
                {hasNoAIOrToolMessages && !!stream.interrupt && (
                  <AssistantMessage
                    key="interrupt-msg"
                    message={undefined}
                    isLoading={isLoading}
                    handleRegenerate={handleRegenerate}
                  />
                )}
                {isLoading && !firstTokenReceived && (
                  <AssistantMessageLoading />
                )}
              </>
            }
            footer={
              <div className="sticky bottom-0 flex flex-col items-center gap-6">
                {!chatStarted && (
                  <div className="flex flex-col items-center gap-3">
                    <Logo
                      logoSize={9}
                      textSize="text-3xl"
                    />
                    <AssistantList />
                  </div>
                )}

                <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />
                <Suggestions onSubmit={sendMessage} />
                <div
                  ref={dropRef}
                  className={cn(
                    "bg-muted relative z-10 mx-auto mb-8 w-full max-w-3xl rounded-2xl border shadow-xs transition-all",
                    dragOver ? "border-primary border-dotted" : "border-solid",
                  )}
                >
                  <form
                    onSubmit={handleSubmit}
                    className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2"
                  >
                    <ContentBlocksPreview
                      blocks={contentBlocks}
                      onRemove={removeBlock}
                    />
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onPaste={handlePaste}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          !e.metaKey &&
                          !e.nativeEvent.isComposing
                        ) {
                          e.preventDefault();
                          const el = e.target as HTMLElement | undefined;
                          const form = el?.closest("form");
                          form?.requestSubmit();
                        }
                      }}
                      placeholder="Type your message to search a ticker ..."
                      className="field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                    />

                    <div className="flex items-center gap-6 p-2 pt-4">
                      {/* <div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="render-tool-calls"
                            checked={hideToolCalls ?? false}
                            onCheckedChange={setHideToolCalls}
                          />
                          <Label
                            htmlFor="render-tool-calls"
                            className="text-sm"
                          >
                            Hide Tools
                          </Label>
                        </div>
                      </div> */}

                      <Label
                        htmlFor="file-input"
                        className="hover:bg-background flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
                      >
                        {/* <Plus className="size-5" /> */}
                        <TitleTooltip title="Upload image or PDF file">
                          {/* <Upload className="size-5" /> */}
                          <Paperclip className="size-5" />
                        </TitleTooltip>
                      </Label>

                      <input
                        id="file-input"
                        type="file"
                        onChange={handleFileUpload}
                        multiple
                        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                        className="hidden"
                      />
                      {stream.isLoading ? (
                        <Button
                          key="stop"
                          onClick={() => stream.stop()}
                          className="ml-auto rounded-full"
                        >
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          id="chat-submit-btn"
                          className="ml-auto w-9 rounded-full shadow-md transition-all"
                          disabled={
                            isLoading ||
                            (!input.trim() && contentBlocks.length === 0)
                          }
                        >
                          <ArrowUp size={32} />
                        </Button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            }
          />
        </StickToBottom>
      </motion.div>
      <div className="relative flex flex-col border-l">
        <div className="absolute inset-0 flex min-w-[30vw] flex-col">
          <div className="grid grid-cols-[1fr_auto] border-b p-4">
            <ArtifactTitle className="truncate overflow-hidden" />
            <button
              onClick={closeArtifact}
              className="cursor-pointer"
            >
              <ArrowDown className="size-5" />
            </button>
          </div>
          <ArtifactContent className="relative flex-grow" />
        </div>
      </div>
    </div>
  );
}
