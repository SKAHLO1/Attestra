#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use self::state::EventBadge;
use async_graphql::{EmptyMutation, EmptySubscription, Object, Request, Response, Schema};
use event_badge::{BadgeInfo, EventBadgeAbi, EventInfo};
use linera_sdk::{
    abi::WithServiceAbi,
    views::View,
    Service, ServiceRuntime,
};
use std::sync::Arc;

linera_sdk::service!(EventBadgeService);

pub struct EventBadgeService {
    state: Arc<EventBadge>,
    runtime: Arc<ServiceRuntime<Self>>,
}

impl Service for EventBadgeService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = EventBadge::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        EventBadgeService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription)
            .data(Arc::clone(&self.state))
            .finish();
        schema.execute(request).await
    }
}

impl WithServiceAbi for EventBadgeService {
    type Abi = EventBadgeAbi;
}

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// Get event information
    async fn event_info(&self, ctx: &async_graphql::Context<'_>) -> async_graphql::Result<EventInfo> {
        let state = ctx.data::<Arc<EventBadge>>()?;
        Ok(EventInfo {
            event_name: state.event_name.get().clone(),
            organizer: state.organizer.get().clone(),
            description: state.description.get().clone(),
            event_date: *state.event_date.get(),
            location: state.location.get().clone(),
            category: *state.category.get(),
            badge_metadata_uri: state.badge_metadata_uri.get().clone(),
            max_supply: *state.max_supply.get(),
            minted_count: *state.minted_count.get(),
            is_active: *state.is_active.get(),
        })
    }

    /// Get badge for a specific owner
    async fn badge(&self, ctx: &async_graphql::Context<'_>, owner: String) -> async_graphql::Result<Option<BadgeInfo>> {
        let state = ctx.data::<Arc<EventBadge>>()?;
        let token_id = state.claimed_badges.get(&owner).await.ok().flatten();
        
        Ok(token_id.map(|token_id| BadgeInfo {
            token_id,
            owner,
            event_name: state.event_name.get().clone(),
            claimed_at: *state.event_date.get(),
            image_uri: state.badge_metadata_uri.get().clone(),
            category: *state.category.get(),
        }))
    }

    /// Check if a claim code is valid and unused
    async fn is_claim_code_valid(&self, ctx: &async_graphql::Context<'_>, claim_code: String) -> async_graphql::Result<bool> {
        let state = ctx.data::<Arc<EventBadge>>()?;
        let code_hash = event_badge::hash_claim_code(&claim_code);
        Ok(match state.claim_codes.get(&code_hash).await {
            Ok(Some(is_used)) => !is_used,
            _ => false,
        })
    }

    /// Get total badges minted
    async fn total_minted(&self, ctx: &async_graphql::Context<'_>) -> async_graphql::Result<u64> {
        let state = ctx.data::<Arc<EventBadge>>()?;
        Ok(*state.minted_count.get())
    }

    /// Check if event is active
    async fn is_active(&self, ctx: &async_graphql::Context<'_>) -> async_graphql::Result<bool> {
        let state = ctx.data::<Arc<EventBadge>>()?;
        Ok(*state.is_active.get())
    }
}
