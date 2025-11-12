#!/bin/bash
# Deploy Event Badge Contract to Linera Network

set -e

echo "🚀 Deploying Event Badge Contract to Linera..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build the contract
echo -e "${BLUE}📦 Building Rust contract...${NC}"
cd contract
cargo build --release --target wasm32-unknown-unknown

# Check if build was successful
if [ ! -f "target/wasm32-unknown-unknown/release/event_badge_contract.wasm" ]; then
    echo "❌ Contract build failed!"
    exit 1
fi

echo -e "${GREEN}✅ Contract built successfully${NC}"

# Step 2: Publish the application
echo -e "${BLUE}📤 Publishing application to Linera...${NC}"
cd ..

# Publish the bytecode
APPLICATION_ID=$(linera publish-bytecode \
    contract/target/wasm32-unknown-unknown/release/event_badge_contract.wasm \
    contract/target/wasm32-unknown-unknown/release/event_badge_service.wasm \
    --json-argument '{}' \
    --json-parameters '{}')

echo -e "${GREEN}✅ Application published!${NC}"
echo -e "${YELLOW}Application ID: ${APPLICATION_ID}${NC}"

# Step 3: Create initial microchain (optional)
read -p "Do you want to create an initial event microchain? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${BLUE}🔗 Creating initial microchain...${NC}"
    
    # Create chain
    CHAIN_ID=$(linera create-chain --json)
    
    echo -e "${GREEN}✅ Microchain created!${NC}"
    echo -e "${YELLOW}Chain ID: ${CHAIN_ID}${NC}"
    
    # Save to config file
    cat > deployment-config.json <<EOF
{
  "applicationId": "${APPLICATION_ID}",
  "chainId": "${CHAIN_ID}",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "network": "local"
}
EOF
    
    echo -e "${GREEN}✅ Configuration saved to deployment-config.json${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your frontend .env file with the Application ID"
echo "2. Run 'npm run dev' to start the frontend"
echo "3. Connect your Linera wallet"
echo "4. Create your first event!"
