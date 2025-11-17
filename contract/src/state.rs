use event_badge::EventCategory;
use linera_sdk::views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext};
use linera_views::views::View;

/// The application state
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct EventBadge {
    /// The name of the event
    pub event_name: RegisterView<String>,
    /// The organizer of the event (as address string)
    pub organizer: RegisterView<String>,
    /// Description of the event
    pub description: RegisterView<String>,
    /// Event date/time (as micros since epoch)
    pub event_date: RegisterView<u64>,
    /// Location of the event
    pub location: RegisterView<String>,
    /// Category of the event
    pub category: RegisterView<EventCategory>,
    /// Metadata URI (IPFS CID or URL) for badge image
    pub badge_metadata_uri: RegisterView<String>,
    /// Maximum number of badges that can be minted
    pub max_supply: RegisterView<u64>,
    /// Current supply of minted badges
    pub minted_count: RegisterView<u64>,
    /// Set of attendees who have claimed badges (address string -> TokenId)
    pub claimed_badges: MapView<String, u64>,
    /// Claim codes for badge claiming (code hash -> is_used)
    pub claim_codes: MapView<String, bool>,
    /// Whether the event is active for claiming
    pub is_active: RegisterView<bool>,
}
