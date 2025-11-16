/**
 * Linera SDK Loader
 * 
 * This script loads the Linera WASM client from the official source
 * and makes it available globally as window.linera
 */

(async function() {
  console.log('[Linera SDK] Initializing...');
  
  try {
    // Option 1: Try loading from official CDN (when available)
    // For now, we'll use a mock implementation since the package isn't published yet
    
    const LINERA_TESTNET_FAUCET = 'https://faucet.testnet-conway.linera.net';
    
    // Mock Linera SDK implementation for testing
    // This will be replaced with the real SDK when it's published
    const LineraSDK = {
      // Initialize WASM (mock)
      default: async function() {
        console.log('[Linera SDK] WASM initialized (mock mode)');
        return true;
      },
      
      // Faucet class for creating wallets
      Faucet: class {
        constructor(url) {
          this.url = url || LINERA_TESTNET_FAUCET;
          console.log('[Linera SDK] Faucet initialized:', this.url);
        }
        
        async createWallet() {
          console.log('[Linera SDK] Creating wallet via faucet...');
          
          // In production, this would make an actual API call to the faucet
          try {
            const response = await fetch(`${this.url}/api/createWallet`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
              const data = await response.json();
              return new LineraSDK.Wallet(data);
            }
          } catch (error) {
            console.warn('[Linera SDK] Faucet unavailable, using mock wallet');
          }
          
          // Fallback to mock wallet for testing
          const mockWallet = {
            json: JSON.stringify({
              chains: ['linera_' + Math.random().toString(36).substr(2, 16)],
              publicKey: 'pub_' + Math.random().toString(36).substr(2, 32),
              privateKey: 'priv_' + Math.random().toString(36).substr(2, 32)
            })
          };
          
          return new LineraSDK.Wallet(mockWallet);
        }
        
        async claimChain(client) {
          console.log('[Linera SDK] Claiming chain from faucet...');
          
          // Mock chain ID
          const chainId = 'e476187f6ddfeb9d588c7e2d2c33e66b' + 
                         Math.random().toString(16).substr(2, 16);
          
          try {
            const response = await fetch(`${this.url}/api/claimChain`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                walletAddress: client.wallet?.address || 'mock'
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              return data.chainId || chainId;
            }
          } catch (error) {
            console.warn('[Linera SDK] Using mock chain ID');
          }
          
          return chainId;
        }
      },
      
      // Wallet class
      Wallet: class {
        constructor(data) {
          this.data = data;
          this.json = data.json || JSON.stringify(data);
          this.address = data.chains?.[0] || 'linera_mock_address';
        }
        
        static async fromJson(jsonString) {
          const data = JSON.parse(jsonString);
          return new LineraSDK.Wallet(data);
        }
        
        defaultChain() {
          return this.address;
        }
        
        toJson() {
          return this.json;
        }
      },
      
      // Client class for interacting with applications
      Client: class {
        constructor(wallet) {
          this.wallet = wallet;
          this.applications = new Map();
          console.log('[Linera SDK] Client created for wallet:', wallet.address);
        }
        
        frontend() {
          return {
            application: async (applicationId) => {
              console.log('[Linera SDK] Connecting to application:', applicationId);
              
              return {
                // Query method for GraphQL queries
                query: async (queryString) => {
                  console.log('[Linera SDK] Executing query:', queryString);
                  
                  // Parse the query to determine what to return
                  const query = JSON.parse(queryString).query;
                  
                  // Mock responses based on query type
                  if (query.includes('eventInfo')) {
                    return JSON.stringify({
                      data: {
                        eventInfo: {
                          eventName: "Test Event",
                          organizer: this.wallet?.address || "organizer",
                          description: "A test event on Linera",
                          eventDate: Date.now() * 1000,
                          location: "Virtual",
                          category: "Meetup",
                          badgeMetadataUri: "ipfs://default",
                          maxSupply: 100,
                          mintedCount: 0,
                          isActive: true
                        }
                      }
                    });
                  }
                  
                  if (query.includes('allBadges')) {
                    return JSON.stringify({
                      data: {
                        allBadges: []
                      }
                    });
                  }
                  
                  if (query.includes('badgeByOwner')) {
                    return JSON.stringify({
                      data: {
                        badgeByOwner: null
                      }
                    });
                  }
                  
                  // Default response
                  return JSON.stringify({ data: {} });
                },
                
                // Mutation/operation method
                mutate: async (mutation) => {
                  console.log('[Linera SDK] Executing mutation:', mutation);
                  return JSON.stringify({ data: { success: true } });
                }
              };
            }
          };
        }
      }
    };
    
    // Make SDK available globally
    window.linera = LineraSDK;
    window.lineraReady = true;
    
    console.log('[Linera SDK] Ready! (Mock mode for testing)');
    console.log('[Linera SDK] Note: This is a placeholder. Replace with official SDK when published.');
    
    // Dispatch event to notify the app
    window.dispatchEvent(new Event('lineraReady'));
    
  } catch (error) {
    console.error('[Linera SDK] Failed to load:', error);
    window.lineraReady = false;
  }
})();
