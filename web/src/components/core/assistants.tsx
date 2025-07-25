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
  },
  {
    name: "warren_buffett",
    title: "Warren Buffett",
    description: "Warren Buffett Agent",
  },
];

export function AssistantList() {
  const [_, setAssistantId] = useQueryState("assistantId");
  return (
    <div className="mt-10 flex w-3xl gap-4">
      {assistants.map((assistant) => (
        <Card
          key={assistant.name}
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
              <img
                className="mr-2 h-8 w-8 rounded-full"
                src={`/images/assistants/${assistant.name}.png`}
              />
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
            <img
              className="mr-1 h-6 w-6 rounded-full"
              src={`/images/assistants/${getAssistant(assistantId)?.name}.png`}
            />
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
            className="flex items-start" // 设置 flex 布局并让子元素靠顶部对齐
          >
            <img
              className="mr-2 h-8 w-8 rounded-full"
              src={`/images/assistants/${assistant.name}.png`}
            />
            <div>
              <h6>{assistant.title}</h6>
              <p className="text-muted-foreground my-2">
                {assistant.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
