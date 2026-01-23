program attendance_badge.aleo {
    record Badge {
        owner: address,
        event_id: field,
        badge_id: field,
        issued_at: u64,
    }

    @noupgrade
    async constructor() {}

    transition mint(
        recipient: address,
        event_id: field,
        badge_id: field,
        timestamp: u64
    ) -> Badge {
        return Badge {
            owner: recipient,
            event_id: event_id,
            badge_id: badge_id,
            issued_at: timestamp,
        };
    }

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
}
