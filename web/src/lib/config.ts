export interface Assistant {
  name: string;
  title: string;
  description: string;
}

export const assistants: Assistant[] = [
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
