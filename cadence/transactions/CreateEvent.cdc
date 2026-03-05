// CreateEvent.cdc
// Transaction to create a new event on Attestra
// Charges a fixed 100 FLOW creation fee transferred to the contract deployer

import AttendanceBadge from "../contracts/AttendanceBadge.cdc"
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

transaction(eventId: String, maxAttendees: UInt64, filecoinCid: String, feeReceiver: Address) {
    let paymentVault: @{FungibleToken.Vault}

    prepare(signer: auth(Storage) &Account) {
        let fee: UFix64 = 100.0

        // Withdraw 100 FLOW from the signer's FlowToken vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault. Ensure you have at least 100 FLOW.")

        self.paymentVault <- vaultRef.withdraw(amount: fee)

        AttendanceBadge.createEvent(
            eventId: eventId,
            maxAttendees: maxAttendees,
            filecoinCid: filecoinCid,
            organizer: signer.address
        )
    }

    execute {
        // Deposit the fee into the feeReceiver account (passed as argument)
        let receiverRef = getAccount(feeReceiver)
            .capabilities
            .get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            .borrow()
            ?? panic("Could not borrow FlowToken receiver from fee receiver account.")

        receiverRef.deposit(from: <-self.paymentVault)
        log("Attestra event created: ".concat(eventId).concat(" | Fee: 100.0 FLOW paid"))
    }
}
