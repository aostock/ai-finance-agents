import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatTimeAgo } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { ChevronDownIcon } from "lucide-react";

/*{
            "ticker": "AAPL",
            "exchange": "NMS",
            "industry_link": "https://finance.yahoo.com/sector/technology",
            "industry_name": "Technology",
            "quote_type": "equity",
            "rank": 32698,
            "regular_market_change": 1.2999999523162842,
            "regular_market_percent_change": 0.61558997631073,
            "regular_market_price": 212.47999572753906,
            "short_name": "Apple Inc.",
            "time": "2025-07-23T18:37:38Z"
}*/
interface TickerProps {
  ticker: string;
  exchange: string;
  industry_link: string;
  industry_name: string;
  quote_type: string;
  rank: number;
  regular_market_change: number;
  regular_market_percent_change: number;
  regular_market_price: number;
  short_name: string;
  time: string;
}

const TickerItem = ({
  ticker,
  exchange,
  industry_link,
  industry_name,
  quote_type,
  rank,
  regular_market_change,
  regular_market_percent_change,
  regular_market_price,
  short_name,
  time,
}: TickerProps) => {
  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>{ticker}</CardTitle>
        <CardDescription>{short_name}</CardDescription>
        <CardAction>{exchange}</CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <CardTitle className="text-2xl font-bold">
          {regular_market_price.toFixed(4).replace(/\.?0+$/, "")}
        </CardTitle>
        <CardDescription className="text-center">
          {formatTimeAgo(time)}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex justify-between border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
            >
              Switch
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align="start"
          ></DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm">Start Analysis</Button>
      </CardFooter>
    </Card>
  );
};

export const TickerSelect = (code: string) => {
  let list: TickerProps[] = [];
  try {
    list = JSON.parse(code);
  } catch (e) {
    console.error(e);
  }
  console.log("list", list);
  const stream = useStreamContext();
  const values = stream.values as Record<string, any>;
  if (values && values.ticker) {
    const ticker = values.ticker as TickerProps;
    return (
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>{ticker.ticker}</CardTitle>
          <CardDescription>{ticker.short_name}</CardDescription>
          <CardAction>{ticker.exchange}</CardAction>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            {ticker.regular_market_price.toFixed(4).replace(/\.?0+$/, "")}
          </CardTitle>
          <CardDescription className="text-center">
            {formatTimeAgo(ticker.time)}
          </CardDescription>
        </CardContent>
        <CardFooter className="flex justify-between border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
              >
                Switch
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              align="start"
            >
              {list.map((item) => (
                <>
                  <DropdownMenuItem
                    key={item.ticker}
                    className="flex-col items-start"
                  >
                    <div className="flex w-full items-center justify-between">
                      {item.ticker}
                      <DropdownMenuShortcut>
                        {item.exchange}
                      </DropdownMenuShortcut>
                    </div>
                    <p className="text-muted-foreground text-sx">
                      {item.short_name}
                    </p>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm">Start Analysis</Button>
        </CardFooter>
      </Card>
    );
  }
};
