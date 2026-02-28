// GetAIVerification.cdc
// Query the on-chain AI verification record for an event
// Returns nil if no verification has been submitted yet

import AttendanceBadge from "../contracts/AttendanceBadge.cdc"

access(all) fun main(eventId: String): AttendanceBadge.VerificationRecord? {
    return AttendanceBadge.getVerification(eventId: eventId)
}
