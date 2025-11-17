#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use self::state::EventBadge;
use event_badge::{EventBadgeAbi, Message, Operation, OperationResponse};
use linera_sdk::{
    abi::WithContractAbi,
    Contract, ContractRuntime,
};
use linera_views::views::View;

linera_sdk::contract!(EventBadgeContract);

pub struct EventBadgeContract {
    state: EventBadge,
    runtime: ContractRuntime<Self>,
}

impl Contract for EventBadgeContract {
    type Message = Message;
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = EventBadge::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        EventBadgeContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // Application is instantiated with default values
        self.runtime.application_parameters();
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
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
                // Get the caller as the organizer
                let owner = format!("{}", self.runtime.authenticated_signer().unwrap());
                
                self.state.event_name.set(event_name);
                self.state.organizer.set(owner);
                self.state.description.set(description);
                self.state.event_date.set(event_date);
                self.state.location.set(location);
                self.state.category.set(category);
                self.state.badge_metadata_uri.set(badge_metadata_uri);
                self.state.max_supply.set(max_supply);
                self.state.minted_count.set(0);
                self.state.is_active.set(true);
                
                OperationResponse::Ok
            }

            Operation::ClaimBadge { claim_code } => {
                // Hash the claim code
                let code_hash = event_badge::hash_claim_code(&claim_code);
                
                // Check if event is active
                if !*self.state.is_active.get() {
                    return OperationResponse::Error("Event is not active".to_string());
                }
                
                // Check if claim code exists and is unused
                let is_used = self.state.claim_codes.get(&code_hash).await
                    .expect("Failed to check claim code");
                
                if let Some(used) = is_used {
                    if used {
                        return OperationResponse::Error("Claim code already used".to_string());
                    }
                } else {
                    return OperationResponse::Error("Invalid claim code".to_string());
                }
                
                // Get the authenticated user
                let owner = format!("{}", self.runtime.authenticated_signer().unwrap());
                
                // Check if user already claimed
                let already_claimed = self.state.claimed_badges.get(&owner).await
                    .expect("Failed to check if already claimed");
                
                if already_claimed.is_some() {
                    return OperationResponse::Error("Already claimed".to_string());
                }
                
                // Check max supply
                let minted = *self.state.minted_count.get();
                let max_supply = *self.state.max_supply.get();
                if minted >= max_supply {
                    return OperationResponse::Error("Max supply reached".to_string());
                }
                
                // Mint the badge
                let token_id = minted + 1;
                self.state.claimed_badges.insert(&owner, token_id)
                    .expect("Failed to insert badge");
                self.state.claim_codes.insert(&code_hash, true)
                    .expect("Failed to mark claim code as used");
                self.state.minted_count.set(token_id);
                
                OperationResponse::BadgeClaimed { token_id }
            }

            Operation::AddClaimCodes { codes } => {
                // Check if caller is the organizer
                let caller = format!("{}", self.runtime.authenticated_signer().unwrap());
                let organizer = self.state.organizer.get();
                
                if caller != *organizer {
                    return OperationResponse::Error("Not authorized".to_string());
                }
                
                // Add the claim codes
                for code in codes {
                    let code_hash = event_badge::hash_claim_code(&code);
                    self.state.claim_codes.insert(&code_hash, false)
                        .expect("Failed to insert claim code");
                }
                
                OperationResponse::Ok
            }

            Operation::SetEventActive { is_active } => {
                // Check if caller is the organizer
                let caller = format!("{}", self.runtime.authenticated_signer().unwrap());
                let organizer = self.state.organizer.get();
                
                if caller != *organizer {
                    return OperationResponse::Error("Not authorized".to_string());
                }
                
                self.state.is_active.set(is_active);
                OperationResponse::Ok
            }

            Operation::TransferBadge { token_id, new_owner } => {
                let caller = format!("{}", self.runtime.authenticated_signer().unwrap());
                
                // Check if caller owns the badge
                let current_token = self.state.claimed_badges.get(&caller).await
                    .expect("Failed to get badge");
                
                match current_token {
                    Some(tid) if tid == token_id => {
                        // Remove from current owner
                        self.state.claimed_badges.remove(&caller)
                            .expect("Failed to remove badge");
                        // Add to new owner
                        self.state.claimed_badges.insert(&new_owner, token_id)
                            .expect("Failed to transfer badge");
                        OperationResponse::Ok
                    }
                    _ => OperationResponse::Error("Badge not found or not owned".to_string()),
                }
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::BadgeMinted { token_id, owner, event_name } => {
                // Handle cross-chain badge minted notification
                // For now, just log it (in production, you might want to track this)
                let _ = (token_id, owner, event_name);
            }
        }
    }

    async fn store(mut self) {

    }
}

impl WithContractAbi for EventBadgeContract {
    type Abi = EventBadgeAbi;
}
