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

# Initialize wallet
echo -e "${BLUE}🔐 Checking Linera wallet...${NC}"

# Check if wallet is already initialized
linera wallet show >/dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Initializing new wallet...${NC}"
    linera wallet init --with-new-chain
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Wallet initialized successfully${NC}"
    else
        echo "❌ Failed to initialize wallet"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Wallet already initialized${NC}"
fi

# Get wallet info
echo -e "${BLUE}📊 Wallet Information:${NC}"
linera wallet show

echo ""
echo -e "${GREEN}🎉 Wallet is ready!${NC}"
echo ""
echo "Next steps:"
echo "1. Run './scripts/deploy-contract.sh' to deploy the contract"
echo "2. Start the frontend with 'npm run dev'"
echo ""
echo "To check wallet status:"
echo "  linera wallet show"
