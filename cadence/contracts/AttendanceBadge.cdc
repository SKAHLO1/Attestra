// AttendanceBadge.cdc
// Attestra - AI-Verified Proof of Attendance on Flow Blockchain
// Cadence 1.0 smart contract — testnet deployment ready

access(all) contract AttendanceBadge {

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------
    access(all) event EventCreated(eventId: String, organizer: Address, filecoinCid: String)
    access(all) event BadgeMinted(eventId: String, recipient: Address, badgeId: UInt64, filecoinCid: String)
    access(all) event BadgeClaimed(eventId: String, claimer: Address, claimCode: String, filecoinCid: String)
    access(all) event AIVerificationSubmitted(eventId: String, oracle: Address, proofHash: String, filecoinCid: String)

    // -----------------------------------------------------------------------
    // Contract State
    // -----------------------------------------------------------------------
    access(all) var totalBadges: UInt64
    access(all) var totalEvents: UInt64

    // Event registry: eventId -> EventRecord
    access(contract) var events: {String: EventRecord}

    // AI verification records: eventId -> VerificationRecord
    access(contract) var verifications: {String: VerificationRecord}

    // Storage and public paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath

    // -----------------------------------------------------------------------
    // Structs
    // -----------------------------------------------------------------------
    access(all) struct EventRecord {
        access(all) let eventId: String
        access(all) let organizer: Address
        access(all) var maxAttendees: UInt64
        access(all) var totalMinted: UInt64
        access(all) var isActive: Bool
        access(all) let filecoinCid: String
        access(all) let createdAt: UFix64

        init(eventId: String, organizer: Address, maxAttendees: UInt64, filecoinCid: String) {
            self.eventId = eventId
            self.organizer = organizer
            self.maxAttendees = maxAttendees
            self.totalMinted = 0
            self.isActive = true
            self.filecoinCid = filecoinCid
            self.createdAt = getCurrentBlock().timestamp
        }
    }

    access(all) struct VerificationRecord {
        access(all) let eventId: String
        access(all) let oracle: Address
        access(all) let proofHash: String
        access(all) let filecoinCid: String
        access(all) let timestamp: UFix64
        access(all) let verified: Bool

        init(eventId: String, oracle: Address, proofHash: String, filecoinCid: String) {
            self.eventId = eventId
            self.oracle = oracle
            self.proofHash = proofHash
            self.filecoinCid = filecoinCid
            self.timestamp = getCurrentBlock().timestamp
            self.verified = true
        }
    }

    // -----------------------------------------------------------------------
    // NFT Resource
    // -----------------------------------------------------------------------
    access(all) resource NFT {
        access(all) let id: UInt64
        access(all) let eventId: String
        access(all) let eventName: String
        access(all) let recipient: Address
        access(all) let filecoinCid: String
        access(all) let aiVerificationCid: String
        access(all) let mintedAt: UFix64

        init(
            id: UInt64,
            eventId: String,
            eventName: String,
            recipient: Address,
            filecoinCid: String,
            aiVerificationCid: String
        ) {
            self.id = id
            self.eventId = eventId
            self.eventName = eventName
            self.recipient = recipient
            self.filecoinCid = filecoinCid
            self.aiVerificationCid = aiVerificationCid
            self.mintedAt = getCurrentBlock().timestamp
        }
    }

    // -----------------------------------------------------------------------
    // Collection Resource
    // -----------------------------------------------------------------------
    access(all) resource interface CollectionPublic {
        access(all) fun getBadgeIDs(): [UInt64]
        access(all) fun borrowBadge(id: UInt64): &NFT?
    }

    access(all) resource Collection: CollectionPublic {
        access(all) var ownedNFTs: @{UInt64: NFT}

        init() {
            self.ownedNFTs <- {}
        }

        access(all) fun deposit(token: @NFT) {
            let id = token.id
            self.ownedNFTs[id] <-! token
        }

        access(all) fun getBadgeIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) fun borrowBadge(id: UInt64): &NFT? {
            return &self.ownedNFTs[id] as &NFT?
        }
    }

    access(all) fun createEmptyCollection(): @Collection {
        return <- create Collection()
    }

    // -----------------------------------------------------------------------
    // Public Functions
    // -----------------------------------------------------------------------

    access(all) fun createEvent(
        eventId: String,
        maxAttendees: UInt64,
        filecoinCid: String,
        organizer: Address
    ) {
        pre {
            self.events[eventId] == nil: "Event already exists"
            maxAttendees > 0: "Max attendees must be greater than 0"
            filecoinCid.length > 0: "Filecoin CID cannot be empty"
        }

        let record = EventRecord(
            eventId: eventId,
            organizer: organizer,
            maxAttendees: maxAttendees,
            filecoinCid: filecoinCid
        )
        self.events[eventId] = record
        self.totalEvents = self.totalEvents + 1

        emit EventCreated(eventId: eventId, organizer: organizer, filecoinCid: filecoinCid)
    }

    access(all) fun mintBadge(
        eventId: String,
        recipient: Address,
        filecoinCid: String,
        aiVerificationCid: String
    ) {
        pre {
            self.events[eventId] != nil: "Event does not exist"
            self.events[eventId]!.isActive: "Event is not active"
            self.events[eventId]!.totalMinted < self.events[eventId]!.maxAttendees: "Max attendees reached"
        }

        let badgeId = self.totalBadges + 1
        let eventRecord = self.events[eventId]!

        let badge <- create NFT(
            id: badgeId,
            eventId: eventId,
            eventName: eventId,
            recipient: recipient,
            filecoinCid: filecoinCid,
            aiVerificationCid: aiVerificationCid
        )

        self.events[eventId]!.totalMinted = eventRecord.totalMinted + 1
        self.totalBadges = badgeId

        emit BadgeMinted(eventId: eventId, recipient: recipient, badgeId: badgeId, filecoinCid: filecoinCid)

        // Deposit to recipient's collection via capability
        let recipientAccount = getAccount(recipient)
        let collectionCap = recipientAccount
            .capabilities
            .get<&Collection>(AttendanceBadge.CollectionPublicPath)

        if collectionCap.check() {
            collectionCap.borrow()!.deposit(token: <- badge)
        } else {
            destroy badge
        }
    }

    access(all) fun claimBadge(
        eventId: String,
        claimCode: String,
        filecoinCid: String,
        claimer: Address
    ) {
        pre {
            self.events[eventId] != nil: "Event does not exist"
            self.events[eventId]!.isActive: "Event is not active"
            claimCode.length > 0: "Claim code cannot be empty"
        }

        emit BadgeClaimed(eventId: eventId, claimer: claimer, claimCode: claimCode, filecoinCid: filecoinCid)
    }

    access(all) fun submitAIVerification(
        eventId: String,
        proofHash: String,
        filecoinCid: String,
        oracle: Address
    ) {
        pre {
            self.events[eventId] != nil: "Event does not exist"
            proofHash.length > 0: "Proof hash cannot be empty"
            filecoinCid.length > 0: "Filecoin CID cannot be empty"
        }

        let record = VerificationRecord(
            eventId: eventId,
            oracle: oracle,
            proofHash: proofHash,
            filecoinCid: filecoinCid
        )
        self.verifications[eventId] = record

        emit AIVerificationSubmitted(eventId: eventId, oracle: oracle, proofHash: proofHash, filecoinCid: filecoinCid)
    }

    access(all) fun getEvent(eventId: String): EventRecord? {
        return self.events[eventId]
    }

    access(all) fun getVerification(eventId: String): VerificationRecord? {
        return self.verifications[eventId]
    }

    access(all) fun getTotalBadges(): UInt64 {
        return self.totalBadges
    }

    access(all) fun getTotalEvents(): UInt64 {
        return self.totalEvents
    }

    // -----------------------------------------------------------------------
    // Initializer
    // -----------------------------------------------------------------------
    init() {
        self.totalBadges = 0
        self.totalEvents = 0
        self.events = {}
        self.verifications = {}
        self.CollectionStoragePath = /storage/AttestaBadgeCollection
        self.CollectionPublicPath = /public/AttestaBadgeCollection
    }
}
