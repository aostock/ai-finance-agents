import Link from "next/link";
import { Button } from "../ui/button";
import { TitleTooltip } from "./title-tooltip";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "./theme-toggle";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  ArrowDown,
  ArrowDownIcon,
  ArrowRightCircle,
  ChevronDown,
  PanelRightClose,
  PanelRightOpen,
  SquarePen,
  Sun,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

const assistants = [
  {
    name: "agent",
    title: "Agent",
    description: "common agent",
    icon: (
      <Sun
        size={24}
        className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
      />
    ),
  },
  {
    name: "warren_buffett_agent",
    title: "Warren Buffett Agent",
    description: "Warren Buffett Agent",
    icon: (
      <Sun
        size={24}
        className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
      />
    ),
  },
];

export function AssistantList() {
  const [_, setAssistantId] = useQueryState("assistantId");
  return (
    <div className="mt-10 flex w-3xl gap-4">
      {assistants.map((assistant) => (
        <Card
          className="hover:bg-muted relative w-1/2 cursor-pointer"
          onClick={() => setAssistantId(assistant.name)}
        >
          <Button
            className="absolute right-1 bottom-1"
            variant="ghost"
            size="icon"
          >
            <ArrowRightCircle />
          </Button>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User
                size={18}
                className="mr-2"
              />{" "}
              <p className="flex-1">{assistant.title}</p>
            </CardTitle>
            {/* <CardDescription>{assistant.description}</CardDescription> */}
            {/* <CardAction>Card Action</CardAction> */}
          </CardHeader>
          <CardContent>
            <p>{assistant.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AssistantSelect() {
  const [assistantId, setAssistantId] = useQueryState("assistantId");

  const getAssistant = (id: string | null) => {
    return assistants.find((assistant) => assistant.name === id);
  };

  return (
    <DropdownMenu>
      <TitleTooltip title="Change assistant">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            {getAssistant(assistantId)?.icon}
            <span>{getAssistant(assistantId)?.title}</span>
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
      </TitleTooltip>
      <DropdownMenuContent align="end">
        {assistants.map((assistant) => (
          <DropdownMenuItem
            key={assistant.name}
            onClick={() => setAssistantId(assistant.name)}
          >
            {assistant.icon}
            <span>{assistant.title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
