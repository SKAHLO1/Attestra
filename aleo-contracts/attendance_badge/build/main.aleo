program attendance_badge.aleo;

record Badge:
    owner as address.private;
    event_id as field.private;
    badge_id as field.private;
    issued_at as u64.private;

function mint:
    input r0 as address.private;
    input r1 as field.private;
    input r2 as field.private;
    input r3 as u64.private;
    cast r0 r1 r2 r3 into r4 as Badge.record;
    output r4 as Badge.record;

function transfer:
    input r0 as Badge.record;
    input r1 as address.private;
    cast r1 r0.event_id r0.badge_id r0.issued_at into r2 as Badge.record;
    output r2 as Badge.record;

constructor:
    assert.eq edition 0u16;
