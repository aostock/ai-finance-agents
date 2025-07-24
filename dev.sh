cd server
source .venv/bin/activate
langgraph dev --debug-port 5678 --port 8123 --allow-blocking &
cd ../web
pnpm dev &