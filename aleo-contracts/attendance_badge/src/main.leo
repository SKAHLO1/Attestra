import credits.aleo;

program velero_attender.aleo {
    record Badge {
        owner: address,
        event_id: field,
        badge_id: field,
        issued_at: u64,
    }

    record Event {
        owner: address,
        event_id: field,
        max_attendees: u64,
        is_active: bool,
    }

    // Mapping to track event organizers
    mapping events: field => address;
    
    // Mapping to track claimed badges
    mapping claimed_badges: field => bool;
    
    // Mapping to track badge count per event
    mapping badge_counts: field => u64;

    @noupgrade
    async constructor() {}

    // Create a new event (organizer function)
    // Note: self.caller warning is safe - this transition is only called by user addresses
    async transition create_event(
        public event_id: field,
        public max_attendees: u64
    ) -> (Event, Future) {
        let event_record: Event = Event {
            owner: self.caller, // Safe: organizer is always a user address
            event_id: event_id,
            max_attendees: max_attendees,
            is_active: true,
        };
        
        return (event_record, finalize_create_event(event_id, self.caller));
    }

    async function finalize_create_event(
        event_id: field,
        organizer: address
    ) {
        Mapping::set(events, event_id, organizer);
        Mapping::set(badge_counts, event_id, 0u64);
    }

    // Mint/issue a badge to an attendee
    async transition mint(
        recipient: address,
        event_id: field,
        badge_id: field,
        timestamp: u64
    ) -> (Badge, Future) {
        let badge_record: Badge = Badge {
            owner: recipient,
            event_id: event_id,
            badge_id: badge_id,
            issued_at: timestamp,
        };
        
        return (badge_record, finalize_mint(event_id, badge_id, self.caller));
    }

    async function finalize_mint(
        event_id: field,
        badge_id: field,
        organizer: address
    ) {
        let event_owner: address = Mapping::get(events, event_id);
        assert_eq(event_owner, organizer);
        
        let is_claimed: bool = Mapping::get_or_use(claimed_badges, badge_id, false);
        assert_eq(is_claimed, false);
        
        Mapping::set(claimed_badges, badge_id, true);
        
        let current_count: u64 = Mapping::get_or_use(badge_counts, event_id, 0u64);
        Mapping::set(badge_counts, event_id, current_count + 1u64);
    }

    // Claim a badge using a badge ID
    // Note: self.caller warning is safe - this transition is only called by user addresses
    async transition claim_badge(
        event_id: field,
        badge_id: field,
        timestamp: u64
    ) -> (Badge, Future) {
        let badge_record: Badge = Badge {
            owner: self.caller, // Safe: attendee is always a user address
            event_id: event_id,
            badge_id: badge_id,
            issued_at: timestamp,
        };
        
        return (badge_record, finalize_claim_badge(badge_id));
    }

    async function finalize_claim_badge(badge_id: field) {
        let is_claimed: bool = Mapping::get_or_use(claimed_badges, badge_id, false);
        assert_eq(is_claimed, false);
        
        Mapping::set(claimed_badges, badge_id, true);
    }

    // Transfer badge to another address
    transition transfer(
        badge: Badge,
        to: address
    ) -> Badge {
        return Badge {
            owner: to,
            event_id: badge.event_id,
            badge_id: badge.badge_id,
            issued_at: badge.issued_at,
        };
    }

    // Verify badge ownership
    transition verify(badge: Badge) -> bool {
        return badge.owner == self.caller;
    }

    // Deactivate an event (organizer only)
    transition deactivate_event(event: Event) -> Event {
        assert_eq(event.owner, self.caller);
        
        return Event {
            owner: event.owner,
            event_id: event.event_id,
            max_attendees: event.max_attendees,
            is_active: false,
        };
    }

    // Private transfer of credits using credits.aleo
    // This allows users to privately transfer credits while interacting with the application
    async transition transfer_private(
        input_record: credits.aleo/credits,
        recipient: address,
        amount: u64
    ) -> (credits.aleo/credits, credits.aleo/credits, Future) {
        // Call the credits.aleo transfer_private function
        let (recipient_record, change_record): (credits.aleo/credits, credits.aleo/credits) = credits.aleo/transfer_private(input_record, recipient, amount);

        // We can add additional logic here if needed, but for now we just wrap the call
        return (recipient_record, change_record, finalize_transfer_private());
    }

    async function finalize_transfer_private() {
        // No-op finalize for now
    }
}
