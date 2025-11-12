use event_badge::{EventBadge as EventBadgeState, EventCategory};
use linera_sdk::views::{MapView, RootView, ViewStorageContext};
use linera_sdk::base::Owner;

/// The application state
#[derive(RootView)]
pub struct EventBadge {
    /// The name of the event
    pub event_name: String,
    /// The organizer of the event
    pub organizer: Owner,
    /// Description of the event
    pub description: String,
    /// Event date/time (as micros since epoch)
    pub event_date: u64,
    /// Location of the event
    pub location: String,
    /// Category of the event
    pub category: EventCategory,
    /// Metadata URI (IPFS CID or URL) for badge image
    pub badge_metadata_uri: String,
    /// Maximum number of badges that can be minted
    pub max_supply: u64,
    /// Current supply of minted badges
    pub minted_count: u64,
    /// Set of attendees who have claimed badges (Owner -> TokenId)
    pub claimed_badges: MapView<Owner, u64>,
    /// Claim codes for badge claiming (code hash -> is_used)
    pub claim_codes: MapView<String, bool>,
    /// Whether the event is active for claiming
    pub is_active: bool,
}
