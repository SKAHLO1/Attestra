#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use self::state::EventBadge;
use async_trait::async_trait;
use event_badge::{EventBadgeError, Message, Operation};
use linera_sdk::{
    base::{Owner, SessionId, Timestamp, WithContractAbi},
    contract::system_api,
    ApplicationCallResult, CalleeContext, Contract, ExecutionResult, MessageContext,
    OperationContext, SessionCallResult, ViewStateStorage,
};

linera_sdk::contract!(EventBadge);

impl WithContractAbi for EventBadge {
    type Abi = event_badge::EventBadgeAbi;
}

#[async_trait]
impl Contract for EventBadge {
    type Error = EventBadgeError;
    type Storage = ViewStateStorage<Self>;
    type State = EventBadge;
    type Message = Message;

    async fn initialize(
        &mut self,
        _context: &OperationContext,
        _argument: Self::InitializationArgument,
    ) -> Result<ExecutionResult<Self::Message>, Self::Error> {
        Ok(ExecutionResult::default())
    }

    async fn execute_operation(
        &mut self,
        context: &OperationContext,
        operation: Self::Operation,
    ) -> Result<ExecutionResult<Self::Message>, Self::Error> {
        let mut result = ExecutionResult::default();
        
        match operation {
            Operation::CreateEvent {
                event_name,
                description,
                event_date,
                location,
                category,
                badge_metadata_uri,
                max_supply,
            } => {
                // Ensure the event hasn't been initialized yet
                if !self.event_name.is_empty() {
                    return Err(EventBadgeError::EventNotInitialized);
                }

                self.event_name = event_name;
                self.organizer = context.authenticated_signer.ok_or(EventBadgeError::NotAuthorized)?;
                self.description = description;
                self.event_date = event_date;
                self.location = location;
                self.category = category;
                self.badge_metadata_uri = badge_metadata_uri;
                self.max_supply = max_supply;
                self.minted_count = 0;
                self.is_active = true;
            }

            Operation::ClaimBadge { claim_code } => {
                // Check if event is active
                if !self.is_active {
                    return Err(EventBadgeError::EventNotActive);
                }

                // Get the authenticated signer (attendee)
                let attendee = context
                    .authenticated_signer
                    .ok_or(EventBadgeError::NotAuthorized)?;

                // Check if attendee already claimed
                if self.claimed_badges.contains_key(&attendee) {
                    return Err(EventBadgeError::AlreadyClaimed);
                }

                // Check max supply
                if self.minted_count >= self.max_supply {
                    return Err(EventBadgeError::MaxSupplyReached);
                }

                // Hash and verify claim code
                let code_hash = event_badge::hash_claim_code(&claim_code);
                
                // Check if code exists and is not used
                match self.claim_codes.get(&code_hash) {
                    Some(true) => return Err(EventBadgeError::ClaimCodeUsed),
                    Some(false) => {
                        // Mark code as used
                        self.claim_codes.insert(code_hash, true);
                    }
                    None => return Err(EventBadgeError::InvalidClaimCode),
                }

                // Mint badge
                let token_id = self.minted_count;
                self.minted_count += 1;
                self.claimed_badges.insert(attendee, token_id);

                // Send cross-chain message about minting
                result.messages.push(Message::BadgeMinted {
                    token_id,
                    owner: attendee,
                    event_name: self.event_name.clone(),
                });
            }

            Operation::AddClaimCodes { codes } => {
                // Only organizer can add claim codes
                let signer = context
                    .authenticated_signer
                    .ok_or(EventBadgeError::NotAuthorized)?;
                
                if signer != self.organizer {
                    return Err(EventBadgeError::NotAuthorized);
                }

                // Add claim codes
                for code in codes {
                    let code_hash = event_badge::hash_claim_code(&code);
                    self.claim_codes.insert(code_hash, false);
                }
            }

            Operation::SetEventActive { is_active } => {
                // Only organizer can change event status
                let signer = context
                    .authenticated_signer
                    .ok_or(EventBadgeError::NotAuthorized)?;
                
                if signer != self.organizer {
                    return Err(EventBadgeError::NotAuthorized);
                }

                self.is_active = is_active;
            }

            Operation::TransferBadge { token_id, new_owner } => {
                // Get current owner
                let current_owner = context
                    .authenticated_signer
                    .ok_or(EventBadgeError::NotAuthorized)?;

                // Verify ownership
                match self.claimed_badges.get(&current_owner) {
                    Some(&tid) if tid == token_id => {
                        // Transfer badge
                        self.claimed_badges.remove(&current_owner);
                        self.claimed_badges.insert(new_owner, token_id);
                    }
                    _ => return Err(EventBadgeError::BadgeNotFound),
                }
            }
        }

        Ok(result)
    }

    async fn execute_message(
        &mut self,
        _context: &MessageContext,
        message: Self::Message,
    ) -> Result<ExecutionResult<Self::Message>, Self::Error> {
        let result = ExecutionResult::default();
        
        match message {
            Message::BadgeMinted { token_id, owner, event_name } => {
                // Handle cross-chain badge minting notification
                // This can be used for cross-chain identity aggregation
                log::info!(
                    "Badge #{} minted for {} at event: {}",
                    token_id,
                    owner,
                    event_name
                );
            }
            Message::VerifyBadge { token_id, owner } => {
                // Verify badge ownership
                if let Some(&tid) = self.claimed_badges.get(&owner) {
                    if tid == token_id {
                        log::info!("Badge verified: #{} belongs to {}", token_id, owner);
                    }
                }
            }
        }

        Ok(result)
    }

    async fn handle_application_call(
        &mut self,
        _context: &CalleeContext,
        _call: Self::ApplicationCall,
        _forwarded_sessions: Vec<SessionId>,
    ) -> Result<ApplicationCallResult<Self::Message, Self::Response, Self::SessionState>, Self::Error> {
        Ok(ApplicationCallResult::default())
    }

    async fn handle_session_call(
        &mut self,
        _context: &CalleeContext,
        _session: Self::SessionState,
        _call: Self::SessionCall,
        _forwarded_sessions: Vec<SessionId>,
    ) -> Result<SessionCallResult<Self::Message, Self::Response, Self::SessionState>, Self::Error> {
        Ok(SessionCallResult::default())
    }
}
