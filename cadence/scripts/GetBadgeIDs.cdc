// GetBadgeIDs.cdc
// Query the badge IDs owned by an account

import AttendanceBadge from "../contracts/AttendanceBadge.cdc"

access(all) fun main(account: Address): [UInt64] {
    let acct = getAccount(account)
    let cap = acct.capabilities.get<&AttendanceBadge.Collection>(
        AttendanceBadge.CollectionPublicPath
    )
    if !cap.check() {
        return []
    }
    return cap.borrow()!.getBadgeIDs()
}
