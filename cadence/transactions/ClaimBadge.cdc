// ClaimBadge.cdc
// Transaction for an attendee to claim a badge on Attestra
// Attendee pays a fixed 3 FLOW redemption fee to the contract deployer

import AttendanceBadge from "../contracts/AttendanceBadge.cdc"
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

transaction(eventId: String, claimCode: String, filecoinCid: String, feeReceiver: Address) {
    let paymentVault: @{FungibleToken.Vault}

    prepare(signer: auth(Storage, Capabilities) &Account) {
        let fee: UFix64 = 3.0

        // Withdraw 3 FLOW redemption fee from the attendee's vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault. Ensure you have at least 3 FLOW.")

        self.paymentVault <- vaultRef.withdraw(amount: fee)

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
        // Deposit redemption fee into the feeReceiver account (passed as argument)
        let receiverRef = getAccount(feeReceiver)
            .capabilities
            .get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            .borrow()
            ?? panic("Could not borrow FlowToken receiver from fee receiver account.")

        receiverRef.deposit(from: <-self.paymentVault)
        log("Badge claimed for event: ".concat(eventId).concat(" | Fee: 3.0 FLOW paid"))
    }
}
