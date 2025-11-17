use async_graphql::{Enum, Request, Response, SimpleObject};
use linera_sdk::abi::{ContractAbi, ServiceAbi};
use serde::{Deserialize, Serialize};

/// Application Binary Interface
pub struct EventBadgeAbi;

impl ContractAbi for EventBadgeAbi {
    type Operation = Operation;
    type Response = OperationResponse;
}

impl ServiceAbi for EventBadgeAbi {
    type Query = Request;
    type QueryResponse = Response;
}

/// Event categories
#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[derive(Enum)]
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
    pub owner: String,
    pub claimed_at: u64,
    pub image_uri: String,
    pub category: EventCategory,
}

/// Response from operations
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum OperationResponse {
    Ok,
    BadgeClaimed { token_id: u64 },
    Error(String),
}

/// Operations that can be performed on the Event Badge application
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Operation {
    /// Initialize a new event (called by organizer)
    CreateEvent {
        event_name: String,
        description: String,
        event_date: u64,
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
        new_owner: String,
    },
}


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

/// Message type for cross-chain communication
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Message {
    /// Notify that a badge was minted
    BadgeMinted {
        token_id: u64,
        owner: String,
        event_name: String,
    },
}

/// Helper function to hash claim codes
pub fn hash_claim_code(code: &str) -> String {
    // Simple hash for demonstration - in production use proper cryptographic hash
    format!("{:x}", code.bytes().fold(0u64, |acc, b| acc.wrapping_mul(31).wrapping_add(b as u64)))
}
