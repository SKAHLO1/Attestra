#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use self::state::EventBadge;
use async_graphql::{Context, EmptySubscription, Object, Request, Response, Schema};
use async_trait::async_trait;
use event_badge::{BadgeInfo, EventInfo};
use linera_sdk::{
    base::{Owner, WithServiceAbi},
    graphql::GraphQLMutationRoot,
    views::MapView,
    QueryContext, Service, ServiceRuntime, ViewStateStorage,
};
use futures::StreamExt;
use std::sync::Arc;

linera_sdk::service!(EventBadge);

impl WithServiceAbi for EventBadge {
    type Abi = event_badge::EventBadgeAbi;
}

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// Get event information
    async fn event_info(&self, context: &Context<'_>) -> Result<EventInfo, async_graphql::Error> {
        let state = context.data::<Arc<EventBadge>>()?;
        
        Ok(EventInfo {
            event_name: state.event_name.clone(),
            organizer: state.organizer.to_string(),
            description: state.description.clone(),
            event_date: state.event_date,
            location: state.location.clone(),
            category: state.category,
            badge_metadata_uri: state.badge_metadata_uri.clone(),
            max_supply: state.max_supply,
            minted_count: state.minted_count,
            is_active: state.is_active,
        })
    }

    /// Get badge info by owner
    async fn badge_by_owner(
        &self,
        context: &Context<'_>,
        owner: String,
    ) -> Result<Option<BadgeInfo>, async_graphql::Error> {
        let state = context.data::<Arc<EventBadge>>()?;
        
        // Parse owner string to Owner type
        let owner_parsed = owner.parse::<Owner>()
            .map_err(|e| async_graphql::Error::new(format!("Invalid owner address: {}", e)))?;
        
        // Check if owner has a badge
        if let Some(token_id) = state.claimed_badges.get(&owner_parsed).await? {
            Ok(Some(BadgeInfo {
                token_id: *token_id,
                owner: owner,
                event_name: state.event_name.clone(),
                claimed_at: state.event_date, // In production, track individual claim times
                image_uri: state.badge_metadata_uri.clone(),
                category: state.category,
            }))
        } else {
            Ok(None)
        }
    }

    /// Get all claimed badges
    async fn all_badges(&self, context: &Context<'_>) -> Result<Vec<BadgeInfo>, async_graphql::Error> {
        let state = context.data::<Arc<EventBadge>>()?;
        let mut badges = Vec::new();

        // Iterate through claimed badges
        let mut keys_stream = state.claimed_badges.indices().await?;
        while let Some(owner) = keys_stream.next().await {
            let owner = owner?;
            if let Some(token_id) = state.claimed_badges.get(&owner).await? {
                badges.push(BadgeInfo {
                    token_id: *token_id,
                    owner: owner.to_string(),
                    event_name: state.event_name.clone(),
                    claimed_at: state.event_date,
                    image_uri: state.badge_metadata_uri.clone(),
                    category: state.category,
                });
            }
        }

        Ok(badges)
    }

    /// Check if a claim code is valid and unused
    async fn is_claim_code_valid(
        &self,
        context: &Context<'_>,
        claim_code: String,
    ) -> Result<bool, async_graphql::Error> {
        let state = context.data::<Arc<EventBadge>>()?;
        let code_hash = event_badge::hash_claim_code(&claim_code);
        
        match state.claim_codes.get(&code_hash).await? {
            Some(is_used) => Ok(!*is_used),
            None => Ok(false),
        }
    }

    /// Get total minted count
    async fn minted_count(&self, context: &Context<'_>) -> Result<u64, async_graphql::Error> {
        let state = context.data::<Arc<EventBadge>>()?;
        Ok(state.minted_count)
    }

    /// Check if event is active
    async fn is_active(&self, context: &Context<'_>) -> Result<bool, async_graphql::Error> {
        let state = context.data::<Arc<EventBadge>>()?;
        Ok(state.is_active)
    }
}

#[async_trait]
impl Service for EventBadge {
    type Storage = ViewStateStorage<Self>;
    type Parameters = ();

    async fn new(_parameters: Self::Parameters) -> Self {
        Self {
            event_name: String::new(),
            organizer: Owner::from([0u8; 32]),
            description: String::new(),
            event_date: 0,
            location: String::new(),
            category: event_badge::EventCategory::default(),
            badge_metadata_uri: String::new(),
            max_supply: 0,
            minted_count: 0,
            claimed_badges: MapView::new(),
            claim_codes: MapView::new(),
            is_active: false,
        }
    }

    async fn handle_query(
        self: Arc<Self>,
        _context: &QueryContext,
        request: Request,
    ) -> Response {
        let schema = Schema::build(QueryRoot, GraphQLMutationRoot, EmptySubscription)
            .data(self)
            .finish();
        
        schema.execute(request).await
    }
}
