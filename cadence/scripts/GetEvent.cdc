// GetEvent.cdc
// Query a specific event record stored on-chain

import AttendanceBadge from "../contracts/AttendanceBadge.cdc"

access(all) fun main(eventId: String): AttendanceBadge.EventRecord? {
    return AttendanceBadge.getEvent(eventId: eventId)
}
