// ClaimBadge.cdc
// Transaction for an attendee to claim a badge on Attestra

import AttendanceBadge from "../contracts/AttendanceBadge.cdc"

transaction(eventId: String, claimCode: String, filecoinCid: String) {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Ensure the signer has a badge collection; create one if not
        if signer.storage.borrow<&AttendanceBadge.Collection>(from: AttendanceBadge.CollectionStoragePath) == nil {
            let collection <- AttendanceBadge.createEmptyCollection()
            signer.storage.save(<-collection, to: AttendanceBadge.CollectionStoragePath)
            let cap = signer.capabilities.storage.issue<&AttendanceBadge.Collection>(
                AttendanceBadge.CollectionStoragePath
            )
            signer.capabilities.publish(cap, at: AttendanceBadge.CollectionPublicPath)
        }

        AttendanceBadge.claimBadge(
            eventId: eventId,
            claimCode: claimCode,
            filecoinCid: filecoinCid,
            claimer: signer.address
        )
    }

    execute {
        log("Badge claimed for event: ".concat(eventId))
    }
}
