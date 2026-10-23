import json
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple, List
from sqlalchemy.orm import Session
from app.models.audit import AuditEvent

class AuditService:
    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    @staticmethod
    def canonical_json(data: Any) -> str:
        """Serializes dictionary/data into canonical JSON with sorted keys to ensure deterministic hashing."""
        return json.dumps(data, sort_keys=True, separators=(',', ':'), default=str)

    @classmethod
    def calculate_event_hash(
        cls,
        event_id: str,
        timestamp_str: str,
        actor_id: str,
        actor_role: str,
        action: str,
        entity_type: str,
        entity_id: str,
        canonical_metadata: str,
        previous_event_hash: str
    ) -> str:
        payload = (
            f"{event_id}|{timestamp_str}|{actor_id}|{actor_role}|"
            f"{action}|{entity_type}|{entity_id}|{canonical_metadata}|{previous_event_hash}"
        )
        hasher = hashlib.sha256()
        hasher.update(payload.encode('utf-8'))
        return hasher.hexdigest()

    @classmethod
    def record_event(
        cls,
        db: Session,
        actor_id: str,
        actor_role: str,
        action: str,
        entity_type: str,
        entity_id: str,
        metadata: Dict[str, Any]
    ) -> AuditEvent:
        """
        Appends a new tamper-evident audit event to the hash chain.
        """
        # Fetch latest event to get previous_event_hash
        latest_event = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
        prev_hash = latest_event.event_hash if latest_event else cls.GENESIS_HASH

        event_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")
        canonical_metadata_str = cls.canonical_json(metadata)

        event_hash = cls.calculate_event_hash(
            event_id=event_id,
            timestamp_str=timestamp_str,
            actor_id=str(actor_id),
            actor_role=actor_role,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            canonical_metadata=canonical_metadata_str,
            previous_event_hash=prev_hash
        )

        audit_entry = AuditEvent(
            event_id=event_id,
            timestamp=now,
            actor_id=str(actor_id),
            actor_role=actor_role,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            metadata_json=canonical_metadata_str,
            previous_event_hash=prev_hash,
            event_hash=event_hash
        )

        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry

    @classmethod
    def verify_chain_integrity(cls, db: Session) -> Tuple[bool, int, Optional[str]]:
        """
        Validates the entire audit chain from genesis to head.
        Returns: (is_valid, total_events_checked, error_explanation)
        """
        events = db.query(AuditEvent).order_by(AuditEvent.id.asc()).all()
        if not events:
            return True, 0, None

        expected_prev_hash = cls.GENESIS_HASH

        for idx, event in enumerate(events):
            # Check previous hash link
            if event.previous_event_hash != expected_prev_hash:
                return (
                    False,
                    idx,
                    f"Audit broken at event #{event.id} ({event.event_id}). "
                    f"Expected prev_hash '{expected_prev_hash}', got '{event.previous_event_hash}'."
                )

            # Recompute hash
            recomputed = cls.calculate_event_hash(
                event_id=event.event_id,
                timestamp_str=event.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                actor_id=event.actor_id,
                actor_role=event.actor_role,
                action=event.action,
                entity_type=event.entity_type,
                entity_id=event.entity_id,
                canonical_metadata=event.metadata_json,
                previous_event_hash=event.previous_event_hash
            )

            if recomputed != event.event_hash:
                return (
                    False,
                    idx,
                    f"Hash signature tampering detected at event #{event.id} ({event.event_id}). "
                    f"Stored hash '{event.event_hash}' != recomputed '{recomputed}'."
                )

            expected_prev_hash = event.event_hash

        return True, len(events), None

audit_service = AuditService()
