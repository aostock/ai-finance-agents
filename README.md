# AI Finance Agents

This is a proof of concept for an AI-powered finance agents. The goal of this project is to explore the use of AI to make trading decisions. This project is for **educational** purposes only and is not intended for real trading or investment.

This system employs several agents working together:

1. Aswath Damodaran Agent - The Dean of Valuation, focuses on story, numbers, and disciplined valuation
2. Ben Graham Agent - The godfather of value investing, only buys hidden gems with a margin of safety
3. Bill Ackman Agent - An activist investor, takes bold positions and pushes for change
4. Cathie Wood Agent - The queen of growth investing, believes in the power of innovation and disruption
5. Charlie Munger Agent - Warren Buffett's partner, only buys wonderful businesses at fair prices
6. Michael Burry Agent - The Big Short contrarian who hunts for deep value
7. Peter Lynch Agent - Practical investor who seeks "ten-baggers" in everyday businesses
8. Phil Fisher Agent - Meticulous growth investor who uses deep "scuttlebutt" research
9. Rakesh Jhunjhunwala Agent - The Big Bull of India
10. Stanley Druckenmiller Agent - Macro legend who hunts for asymmetric opportunities with growth potential
11. Warren Buffett Agent - The oracle of Omaha, seeks wonderful companies at a fair price
12. Valuation Agent - Calculates the intrinsic value of a stock and generates trading signals
13. Sentiment Agent - Analyzes market sentiment and generates trading signals
14. Fundamentals Agent - Analyzes fundamental data and generates trading signals
15. Technicals Agent - Analyzes technical indicators and generates trading signals
16. Risk Manager - Calculates risk metrics and sets position limits
17. Portfolio Manager - Makes final trading decisions and generates orders

## Table of Contents

- [AI Finance Agents](#ai-finance-agents)
  - [Table of Contents](#table-of-contents)
  - [How to Install](#how-to-install)
  - [How to Run](#how-to-run)

## How to Install

Clone the Repository and install dependencies

```bash
git clone https://github.com/aostock/ai-finance-agents.git
cd ai-finance-agents/server
uv sync
cd ../web
pnpm install
```

## How to Run

1. Run the server

```bash
cd server
source .venv/bin/activate
langgraph dev --allow-blocking --debug-port 5678
```

2. Run the web app

```bash
cd web
pnpm dev
```
