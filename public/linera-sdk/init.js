/**
 * Initialize Linera SDK from import map
 * This loads the SDK without bundling, keeping build times fast
 */

(function() {
  console.log('[Linera Init] Loading SDK from import map...');
  console.log('[Linera Init] crossOriginIsolated:', crossOriginIsolated);
  console.log('[Linera Init] SharedArrayBuffer available:', typeof SharedArrayBuffer !== 'undefined');
  
  // Import the SDK modules
  import('/linera-sdk/linera.js')
    .then(async (module) => {
      console.log('[Linera Init] SDK loaded, initializing WASM...');
      
      try {
        // Initialize WASM with threading support
        await module.default('/linera-sdk/linera_bg.wasm');
        
        // Expose SDK to window
        window.linera = module;
        window.lineraReady = true;
        
        console.log('[Linera Init] ✅ SDK ready with threading support');
        
        // Dispatch custom event
        window.dispatchEvent(new Event('lineraReady'));
      } catch (error) {
        console.error('[Linera Init] ❌ Failed to initialize with threading:', error);
        console.log('[Linera Init] This likely means COOP/COEP headers are not set correctly');
        console.log('[Linera Init] Please check Response Headers in Network tab for:');
        console.log('[Linera Init]   - Cross-Origin-Opener-Policy: same-origin');
        console.log('[Linera Init]   - Cross-Origin-Embedder-Policy: require-corp');
        throw error;
      }
    })
    .catch((error) => {
      console.error('[Linera Init] ❌ Failed to load SDK:', error);
      console.error('[Linera Init] Stack:', error.stack);
    });
})();
