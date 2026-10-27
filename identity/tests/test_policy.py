"""Run: python3 -m unittest discover -s identity/tests -v"""

import unittest
from datetime import datetime, timezone

from identity.policy import VerifiedPrincipal, authorize


def fixture(role="owner", permissions=None, status="active"):
    if permissions is None:
        permissions = ["read", "read_restricted", "update", "deploy"]
    return {
        "schema_version": 1,
        "users": [{
            "user_id": "usr_example",
            "issuer": "https://id.example.invalid/",
            "subject": "auth0|synthetic",
            "email": "owner@example.invalid",
            "persona": "founder",
            "status": status,
            "projects": {
                "OS": {
                    "role": role,
                    "status": "active",
                    "permissions": permissions,
                }
            },
        }],
    }


P = VerifiedPrincipal("https://id.example.invalid/", "auth0|synthetic",
                      "owner@example.invalid", True, True)
RESOURCE = {"project_id": "OS", "classification": "internal"}


class AuthorizationTests(unittest.TestCase):
    def check(self, directory=None, principal=P, resource=RESOURCE,
              action="read", project="OS", **options):
        return authorize(directory if directory is not None else fixture(),
                         principal, project, resource, action, **options)

    def test_explicit_read_granted(self):
        self.assertTrue(self.check().allowed)

    def test_missing_directory_entry_denied(self):
        self.assertFalse(self.check(directory={"schema_version": 1, "users": []}).allowed)

    def test_anonymous_denied(self):
        self.assertFalse(self.check(principal=None).allowed)

    def test_unverified_email_denied(self):
        self.assertFalse(self.check(principal=VerifiedPrincipal(
            P.issuer, P.subject, P.email, False)).allowed)

    def test_subject_mismatch_denied_even_if_email_matches(self):
        self.assertFalse(self.check(principal=VerifiedPrincipal(
            P.issuer, "auth0|other", P.email, True)).allowed)

    def test_email_mismatch_denied_even_if_subject_matches(self):
        self.assertFalse(self.check(principal=VerifiedPrincipal(
            P.issuer, P.subject, "different@example.invalid", True)).allowed)

    def test_revoked_account_denied(self):
        self.assertFalse(self.check(directory=fixture(status="revoked")).allowed)

    def test_cross_project_denied(self):
        self.assertFalse(self.check(project="AIO3", resource={"project_id": "AIO3",
                         "classification": "internal"}).allowed)

    def test_resource_project_mismatch_denied(self):
        self.assertFalse(self.check(resource={"project_id": "AIO3",
                         "classification": "internal"}).allowed)

    def test_viewer_cannot_update_even_with_forged_grant(self):
        self.assertFalse(self.check(directory=fixture(
            role="viewer", permissions=["read", "update"]), action="update").allowed)

    def test_restricted_requires_extra_grant(self):
        self.assertFalse(self.check(directory=fixture(permissions=["read"]),
            resource={"project_id": "OS", "classification": "restricted"}).allowed)
        self.assertTrue(self.check(resource={"project_id": "OS",
            "classification": "restricted"}).allowed)

    def test_deploy_needs_mfa_and_verified_approval(self):
        without_mfa = VerifiedPrincipal(P.issuer, P.subject, P.email, True, False)
        self.assertEqual("mfa_required", self.check(
            principal=without_mfa, action="deploy", approval_verified=True).reason)
        self.assertEqual("approval_required", self.check(action="deploy").reason)
        self.assertTrue(self.check(action="deploy", approval_verified=True).allowed)

    def test_duplicate_subject_denied(self):
        d = fixture()
        d["users"].append(dict(d["users"][0]))
        self.assertFalse(self.check(directory=d).allowed)

    def test_expired_grant_denied(self):
        d = fixture()
        d["users"][0]["projects"]["OS"]["expires_at"] = "2026-01-01T00:00:00Z"
        self.assertFalse(self.check(directory=d, at=datetime(
            2026, 10, 27, tzinfo=timezone.utc)).allowed)

    def test_agent_can_propose_but_cannot_modify(self):
        d = fixture(role="agent", permissions=["read", "propose_change", "update"])
        self.assertTrue(self.check(directory=d, action="propose_change").allowed)
        self.assertFalse(self.check(directory=d, action="update").allowed)

    def test_unknown_classification_denied(self):
        self.assertFalse(self.check(resource={"project_id": "OS"}).allowed)

    def test_missing_permissions_never_inherit_role(self):
        d = fixture()
        del d["users"][0]["projects"]["OS"]["permissions"]
        self.assertFalse(self.check(directory=d).allowed)


if __name__ == "__main__":
    unittest.main()
