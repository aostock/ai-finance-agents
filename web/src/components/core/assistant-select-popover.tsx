import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { assistants, Assistant } from "@/lib/config";

interface AssistantSelectPopoverProps {
  onSelect: (assistant: Assistant) => void;
  onClose: () => void;
  position: { x: number; y: number };
  query?: string;
}

export function AssistantSelectPopover({
  onSelect,
  onClose,
  position,
  query = "",
}: AssistantSelectPopoverProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Filter assistants based on query
  const filteredAssistants = React.useMemo(() => {
    if (!query) return assistants;
    return assistants.filter(
      (assistant) =>
        assistant.name.toLowerCase().includes(query.toLowerCase()) ||
        assistant.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredAssistants.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredAssistants.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredAssistants.length) % filteredAssistants.length
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        handleSelect(filteredAssistants[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredAssistants, selectedIndex, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSelect = (assistant: Assistant) => {
    onSelect(assistant);
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className="bg-popover absolute z-50 mt-1 max-h-120 w-full max-w-md overflow-y-auto rounded-md border shadow-lg"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="p-1">
        {filteredAssistants.map((assistant, index) => (
          <AssistantSuggestionItem
            key={assistant.name}
            assistant={assistant}
            isSelected={index === selectedIndex}
            ref={index === selectedIndex ? selectedRef : null}
            onClick={() => handleSelect(assistant)}
          />
        ))}
        {filteredAssistants.length === 0 && (
          <div className="py-2 text-center text-muted-foreground">
            No assistants found
          </div>
        )}
      </div>
    </div>
  );
}

interface AssistantSuggestionItemProps {
  assistant: Assistant;
  isSelected: boolean;
  onClick: () => void;
}

const AssistantSuggestionItem = React.forwardRef<
  HTMLDivElement,
  AssistantSuggestionItemProps
>(({ assistant, isSelected, onClick }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex cursor-pointer items-start gap-2 rounded-sm px-2 py-2 text-sm",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50"
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
    >
      <img
        className="mr-2 h-8 w-8 rounded-full"
        src={`/images/assistants/${assistant.name}.png`}
        onError={(e) => {
          // Fallback to a default image if the assistant image doesn't exist
          const target = e.target as HTMLImageElement;
          target.src = "/images/assistants/agent.png";
        }}
      />
      <div>
        <div className="font-medium">
          {assistant.title}
          <span className="text-muted-foreground my-1 ml-2 text-xs">
            @{assistant.name}
          </span>
        </div>
        <div className="text-muted-foreground my-1 text-xs">
          {assistant.description}
        </div>
      </div>
    </div>
  );
});

AssistantSuggestionItem.displayName = "AssistantSuggestionItem";