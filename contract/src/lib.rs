use async_graphql::{Request, Response, SimpleObject};
use linera_sdk::base::{ChainId, Owner, Timestamp};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// Application state for the Event Badge microchain
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct EventBadge {
    /// The name of the event
    pub event_name: String,
    /// The organizer of the event
    pub organizer: Owner,
    /// Description of the event
    pub description: String,
    /// Event date/time
    pub event_date: Timestamp,
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
    pub claimed_badges: HashMap<Owner, u64>,
    /// Claim codes for badge claiming (code hash -> is_used)
    pub claim_codes: HashMap<String, bool>,
    /// Whether the event is active for claiming
    pub is_active: bool,
}

/// Event categories
#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq, SimpleObject)]
pub enum EventCategory {
    Conference,
    Hackathon,
    Meetup,
    Workshop,
}

impl Default for EventCategory {
    fn default() -> Self {
        EventCategory::Meetup
    }
}

/// Badge metadata structure
#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct BadgeMetadata {
    pub token_id: u64,
    pub event_name: String,
    pub owner: Owner,
    pub claimed_at: Timestamp,
    pub image_uri: String,
    pub category: EventCategory,
}

/// Operations that can be performed on the Event Badge application
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Operation {
    /// Initialize a new event (called by organizer)
    CreateEvent {
        event_name: String,
        description: String,
        event_date: Timestamp,
        location: String,
        category: EventCategory,
        badge_metadata_uri: String,
        max_supply: u64,
    },
    /// Claim a badge using a claim code
    ClaimBadge {
        claim_code: String,
    },
    /// Add claim codes to the event (organizer only)
    AddClaimCodes {
        codes: Vec<String>,
    },
    /// Activate or deactivate the event for claiming
    SetEventActive {
        is_active: bool,
    },
    /// Transfer badge to another owner
    TransferBadge {
        token_id: u64,
        new_owner: Owner,
    },
}

/// Messages that can be sent across microchains
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Message {
    /// Notify that a badge was minted
    BadgeMinted {
        token_id: u64,
        owner: Owner,
        event_name: String,
    },
    /// Cross-chain badge verification request
    VerifyBadge {
        token_id: u64,
        owner: Owner,
    },
}

/// GraphQL query interface
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct EventBadgeQuery;

/// GraphQL mutation interface
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct EventBadgeMutation;

/// Response types for queries
#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct EventInfo {
    pub event_name: String,
    pub organizer: String,
    pub description: String,
    pub event_date: u64,
    pub location: String,
    pub category: EventCategory,
    pub badge_metadata_uri: String,
    pub max_supply: u64,
    pub minted_count: u64,
    pub is_active: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct BadgeInfo {
    pub token_id: u64,
    pub owner: String,
    pub event_name: String,
    pub claimed_at: u64,
    pub image_uri: String,
    pub category: EventCategory,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct ClaimResult {
    pub success: bool,
    pub token_id: Option<u64>,
    pub message: String,
}

/// Error types
#[derive(Debug, thiserror::Error)]
pub enum EventBadgeError {
    #[error("Not authorized: only the organizer can perform this action")]
    NotAuthorized,
    
    #[error("Event is not active for claiming")]
    EventNotActive,
    
    #[error("Invalid claim code")]
    InvalidClaimCode,
    
    #[error("Claim code already used")]
    ClaimCodeUsed,
    
    #[error("Badge already claimed by this attendee")]
    AlreadyClaimed,
    
    #[error("Maximum supply reached")]
    MaxSupplyReached,
    
    #[error("Badge not found")]
    BadgeNotFound,
    
    #[error("Event not initialized")]
    EventNotInitialized,
}

/// Helper function to hash claim codes
pub fn hash_claim_code(code: &str) -> String {
    // Simple hash for demonstration - in production use proper cryptographic hash
    format!("{:x}", code.bytes().fold(0u64, |acc, b| acc.wrapping_mul(31).wrapping_add(b as u64)))
}
