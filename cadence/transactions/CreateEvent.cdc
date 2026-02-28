// CreateEvent.cdc
// Transaction to create a new event on Attestra

import AttendanceBadge from "../contracts/AttendanceBadge.cdc"

transaction(eventId: String, maxAttendees: UInt64, filecoinCid: String) {
    prepare(signer: auth(Storage) &Account) {
        AttendanceBadge.createEvent(
            eventId: eventId,
            maxAttendees: maxAttendees,
            filecoinCid: filecoinCid,
            organizer: signer.address
        )
    }

    execute {
        log("Attestra event created: ".concat(eventId))
    }
}
