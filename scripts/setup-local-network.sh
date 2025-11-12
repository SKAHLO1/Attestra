#!/bin/bash
# Setup Local Linera Development Network

set -e

echo "🔧 Setting up Local Linera Network..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Linera CLI is installed
if ! command -v linera &> /dev/null
then
    echo "❌ Linera CLI not found!"
    echo "Please install it first:"
    echo "  cargo install linera --locked"
    exit 1
fi

echo -e "${GREEN}✅ Linera CLI found${NC}"

# Initialize local network
echo -e "${BLUE}🌐 Initializing local Linera network...${NC}"

# Stop any existing network
linera net down 2>/dev/null || true

# Start fresh network with default configuration
linera net up

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Local network started successfully${NC}"
else
    echo "❌ Failed to start local network"
    exit 1
fi

# Get network info
echo -e "${BLUE}📊 Network Information:${NC}"
linera net status

echo ""
echo -e "${GREEN}🎉 Local network is ready!${NC}"
echo ""
echo "Network endpoints:"
echo "  - RPC: http://localhost:8080"
echo "  - GraphQL: http://localhost:8080/graphql"
echo ""
echo "Next steps:"
echo "1. Run './scripts/deploy-contract.sh' to deploy the contract"
echo "2. Start the frontend with 'npm run dev'"
