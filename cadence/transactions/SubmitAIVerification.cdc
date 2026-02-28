// SubmitAIVerification.cdc
// Transaction for the AI oracle to submit a verification proof on-chain

import AttendanceBadge from "../contracts/AttendanceBadge.cdc"

transaction(eventId: String, proofHash: String, filecoinCid: String) {
    prepare(signer: auth(Storage) &Account) {
        AttendanceBadge.submitAIVerification(
            eventId: eventId,
            proofHash: proofHash,
            filecoinCid: filecoinCid,
            oracle: signer.address
        )
    }

    execute {
        log("AI verification submitted for event: ".concat(eventId))
    }
}
