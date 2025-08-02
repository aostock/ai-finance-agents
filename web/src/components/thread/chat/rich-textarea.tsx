import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { assistants, Assistant } from "@/lib/config";

interface RichTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onMentionSelect?: (assistant: Assistant) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function RichTextarea({
  value,
  onChange,
  onMentionSelect,
  onKeyDown,
  className,
  ...props
}: RichTextareaProps) {
  const [suggestions, setSuggestions] = useState<Assistant[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  // Handle input changes and detect @ mentions
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);

    // Check if we're typing after an @ symbol
    if (
      cursorPos > 0 &&
      inputValue[cursorPos - 1] === "@" &&
      !isComposingRef.current
    ) {
      setSuggestions(assistants);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else if (showSuggestions && cursorPos > 0 && !isComposingRef.current) {
      // Check if we're still in a mention context
      const textBeforeCursor = inputValue.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        if (query.length > 0 && !query.includes(" ")) {
          const filtered = assistants.filter(
            (assistant) =>
              assistant.name.toLowerCase().includes(query.toLowerCase()) ||
              assistant.title.toLowerCase().includes(query.toLowerCase()),
          );
          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        } else if (query.length === 0) {
          setSuggestions(assistants);
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Call the custom onKeyDown handler if provided
    if (!showSuggestions) {
      onKeyDown?.(e);
    }

    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length,
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        selectAssistant(suggestions[selectedIndex], e);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
      }
    } else {
      // Handle backspace to delete entire mentions
      if (e.key === "Backspace" && cursorPosition > 0) {
        // Check if we're at the end of a mention (@username pattern)
        const textBeforeCursor = value.substring(0, cursorPosition);
        // Look for pattern: space@username or start@username
        const mentionPattern = /(?:^|\s)@(\w+)$/;
        const match = textBeforeCursor.match(mentionPattern);

        if (match) {
          e.preventDefault();
          const mentionStart = match.index!;
          const mentionEnd = cursorPosition;
          const newValue =
            value.substring(0, mentionStart) + value.substring(mentionEnd);
          onChange(newValue);
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(mentionStart, mentionStart);
            }
          }, 0);
        }
      }
    }
  };

  // Handle composition events for IME support
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
  };

  // Select an assistant and insert it into the textarea
  const selectAssistant = (assistant: Assistant, e?: React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!textareaRef.current) return;

    const cursorPos = cursorPosition;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);

    // Find the start of the @ mention
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    if (lastAtIndex === -1) return;

    // Replace the @query with the full mention
    const newText =
      textBeforeCursor.substring(0, lastAtIndex) +
      `@${assistant.name} ` +
      textAfterCursor;

    onChange(newText);
    setShowSuggestions(false);

    // Set cursor position after the inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = lastAtIndex + assistant.name.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);

    onMentionSelect?.(assistant);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        className={cn(
          "border-input placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      />

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="bg-popover absolute bottom-full z-50 mb-2 max-h-120 w-full max-w-md overflow-y-auto rounded-md border shadow-lg"
        >
          <div className="p-1">
            {suggestions.map((mention, index) => (
              <div
                key={mention.name}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-sm px-2 py-2 text-sm",
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50",
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  selectAssistant(mention);
                }}
              >
                <img
                  className="mr-2 h-8 w-8 rounded-full"
                  src={`/images/assistants/${mention.name}.png`}
                  onError={(e) => {
                    // Fallback to a default image if the assistant image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/assistants/agent.png";
                  }}
                />
                <div>
                  <div className="font-medium">
                    {mention.title}
                    <span className="text-muted-foreground my-1 ml-2 text-xs">
                      @{mention.name}
                    </span>
                  </div>
                  <div className="text-muted-foreground my-1 text-xs">
                    {mention.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
