program velero_attender.aleo;

record Badge:
    owner as address.private;
    event_id as field.private;
    badge_id as field.private;
    issued_at as u64.private;

record Event:
    owner as address.private;
    event_id as field.private;
    max_attendees as u64.private;
    is_active as boolean.private;

mapping events:
    key as field.public;
    value as address.public;

mapping claimed_badges:
    key as field.public;
    value as boolean.public;

mapping badge_counts:
    key as field.public;
    value as u64.public;

function create_event:
    input r0 as field.public;
    input r1 as u64.public;
    cast self.caller r0 r1 true into r2 as Event.record;
    async create_event r0 self.caller into r3;
    output r2 as Event.record;
    output r3 as velero_attender.aleo/create_event.future;

finalize create_event:
    input r0 as field.public;
    input r1 as address.public;
    set r1 into events[r0];
    set 0u64 into badge_counts[r0];

function mint:
    input r0 as address.private;
    input r1 as field.private;
    input r2 as field.private;
    input r3 as u64.private;
    cast r0 r1 r2 r3 into r4 as Badge.record;
    async mint r1 r2 self.caller into r5;
    output r4 as Badge.record;
    output r5 as velero_attender.aleo/mint.future;

finalize mint:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as address.public;
    get events[r0] into r3;
    assert.eq r3 r2;
    get.or_use claimed_badges[r1] false into r4;
    assert.eq r4 false;
    set true into claimed_badges[r1];
    get.or_use badge_counts[r0] 0u64 into r5;
    add r5 1u64 into r6;
    set r6 into badge_counts[r0];

function claim_badge:
    input r0 as field.private;
    input r1 as field.private;
    input r2 as u64.private;
    cast self.caller r0 r1 r2 into r3 as Badge.record;
    async claim_badge r1 into r4;
    output r3 as Badge.record;
    output r4 as velero_attender.aleo/claim_badge.future;

finalize claim_badge:
    input r0 as field.public;
    get.or_use claimed_badges[r0] false into r1;
    assert.eq r1 false;
    set true into claimed_badges[r0];

function transfer:
    input r0 as Badge.record;
    input r1 as address.private;
    cast r1 r0.event_id r0.badge_id r0.issued_at into r2 as Badge.record;
    output r2 as Badge.record;

function verify:
    input r0 as Badge.record;
    is.eq r0.owner self.caller into r1;
    output r1 as boolean.private;

function deactivate_event:
    input r0 as Event.record;
    assert.eq r0.owner self.caller;
    cast r0.owner r0.event_id r0.max_attendees false into r1 as Event.record;
    output r1 as Event.record;

constructor:
    assert.eq edition 0u16;
