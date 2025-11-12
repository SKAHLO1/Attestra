use linera_sdk::base::ContractAbi;

/// The ABI for the Event Badge application
pub struct EventBadgeAbi;

impl ContractAbi for EventBadgeAbi {
    type InitializationArgument = ();
    type Parameters = ();
    type ApplicationCall = ();
    type Operation = crate::Operation;
    type Message = crate::Message;
    type Response = ();
    type SessionCall = ();
    type SessionState = ();
}
