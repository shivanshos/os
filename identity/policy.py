"""Fail-closed project authorization for the ShivanshOS Workspace Core.

This module is NOT an authentication layer. Only pass VerifiedPrincipal values
constructed by trusted middleware after verifying the token's signature, issuer,
audience, expiry, email verification and authentication assurance.
Directory and resource metadata MUST be read from trusted server-side storage.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime, timezone


ROLE_CEILINGS: dict[str, frozenset[str]] = {
    "owner": frozenset({
        "read", "read_restricted", "create", "update", "delete", "deploy",
        "run_agent", "propose_change", "manage_users", "manage_access",
        "manage_secrets", "view_audit",
    }),
    "administrator": frozenset({
        "read", "read_restricted", "create", "update", "delete", "deploy",
        "run_agent", "propose_change", "manage_users", "manage_access",
        "view_audit",
    }),
    "maintainer": frozenset({
        "read", "create", "update", "run_agent", "propose_change",
        "view_audit",
    }),
    "contributor": frozenset({
        "read", "create", "update", "propose_change",
    }),
    "researcher": frozenset({"read", "create", "propose_change"}),
    "viewer": frozenset({"read"}),
    "auditor": frozenset({"read", "view_audit"}),
    "agent": frozenset({"read", "propose_change"}),
}

APPROVAL_REQUIRED = frozenset({
    "delete", "deploy", "manage_users", "manage_access", "manage_secrets",
})
MFA_REQUIRED = APPROVAL_REQUIRED
KNOWN_CLASSIFICATIONS = frozenset({"public", "internal", "restricted", "secret"})


@dataclass(frozen=True)
class VerifiedPrincipal:
    issuer: str
    subject: str
    email: str
    email_verified: bool
    mfa_verified: bool = False


@dataclass(frozen=True)
class Decision:
    allowed: bool
    reason: str
    user_id: str | None = None


def authorize(
    directory: Mapping,
    principal: VerifiedPrincipal | None,
    project_id: str,
    resource: Mapping,
    action: str,
    *,
    approval_verified: bool = False,
    at: datetime | None = None,
) -> Decision:
    """Authorize one operation; explicit per-project grants never inherit.

    approval_verified MUST originate from a trusted, bound, unexpired approval
    record; never pass a raw client parameter into this argument.
    """
    denied = lambda reason: Decision(False, reason)

    if directory.get("schema_version") != 1:
        return denied("unsupported_directory")
    if not isinstance(principal, VerifiedPrincipal):
        return denied("unauthenticated")
    if not (principal.issuer and principal.subject and principal.email_verified):
        return denied("unverified_identity")
    if not isinstance(principal.email, str) or "@" not in principal.email:
        return denied("invalid_email")
    if not isinstance(project_id, str) or not project_id:
        return denied("invalid_project")
    if not isinstance(resource, Mapping) or resource.get("project_id") != project_id:
        return denied("project_boundary")
    classification = resource.get("classification")
    if classification not in KNOWN_CLASSIFICATIONS:
        return denied("unknown_classification")
    if not isinstance(action, str) or action == "read_restricted":
        return denied("invalid_action")

    users = directory.get("users")
    if not isinstance(users, list):
        return denied("invalid_directory")
    matches = [
        u for u in users
        if isinstance(u, Mapping)
        and u.get("issuer") == principal.issuer
        and u.get("subject") == principal.subject
    ]
    if len(matches) != 1:
        return denied("not_enlisted_or_ambiguous")

    user = matches[0]
    user_id = user.get("user_id")
    if user.get("status") != "active":
        return denied("inactive_user")
    if not isinstance(user_id, str) or not user_id:
        return denied("invalid_user_id")
    registered_email = user.get("email")
    if not isinstance(registered_email, str) or registered_email.casefold() != principal.email.casefold():
        return denied("email_mismatch")

    projects = user.get("projects")
    if not isinstance(projects, Mapping):
        return denied("invalid_grants")
    grant = projects.get(project_id)
    if not isinstance(grant, Mapping) or grant.get("status") != "active":
        return denied("no_project_grant")
    role = grant.get("role")
    allowed_by_role = ROLE_CEILINGS.get(role)
    if allowed_by_role is None or action not in allowed_by_role:
        return denied("role_denied")
    permissions = grant.get("permissions")
    if not isinstance(permissions, list) or action not in permissions:
        return denied("permission_not_granted")
    if action == "read" and classification in {"restricted", "secret"}:
        if "read_restricted" not in permissions or "read_restricted" not in allowed_by_role:
            return denied("restricted_resource")

    expires_at = grant.get("expires_at")
    if expires_at is not None:
        if not isinstance(expires_at, str):
            return denied("invalid_expiry")
        try:
            expires = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        except ValueError:
            return denied("invalid_expiry")
        if expires.tzinfo is None:
            return denied("invalid_expiry")
        current = at if at is not None else datetime.now(timezone.utc)
        if current.tzinfo is None or current >= expires:
            return denied("expired_grant")

    if action in MFA_REQUIRED and not principal.mfa_verified:
        return denied("mfa_required")
    if action in APPROVAL_REQUIRED and not approval_verified:
        return denied("approval_required")
    return Decision(True, "allowed", user_id)
