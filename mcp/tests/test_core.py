import json
import tempfile
import unittest
from pathlib import Path
from os_mcp_registry import core

SEED = Path(__file__).resolve().parents[1] / "catalog/seed.json"

class RegistryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = Path(self.temp.name)/"registry.sqlite3"
        core.seed(SEED,self.db)
    def tearDown(self): self.temp.cleanup()
    def test_seed_idempotent_and_preserves_changes(self):
        x=core.inspect("os.registry",self.db)
        self.assertEqual(x["status"],"planned")
        core.set_status("os.registry","verified",x["revision"],self.db,evidence="mock MCP tools/list")
        result=core.seed(SEED,self.db)
        self.assertEqual(result["added"],0)
        self.assertEqual(core.inspect("os.registry",self.db)["status"],"verified")
    def test_revision_and_evidence(self):
        with self.assertRaises(ValueError):
            core.set_status("github","verified",1,self.db)
        core.set_status("github","configured",1,self.db)
        with self.assertRaises(ValueError):
            core.set_status("github","disabled",1,self.db)
    def test_collection_and_integrations(self):
        groups=core.collections(self.db)
        self.assertGreaterEqual(len(groups),5)
        self.assertIn("os.registry",core.collection("os-core",self.db)["members"])
        self.assertEqual(len(core.list_integrations(self.db)),16)
        self.assertEqual(core.list_integrations(self.db,term="ollama")[0]["id"],"ollama")
        self.assertEqual(core.list_integrations(self.db,status="verified"),[])
    def test_reject_secret_field_and_duplicate(self):
        entry={"id":"test.one","name":"Test","category":"test","adapter":"mcp",
               "host":"spectre","transport":"stdio","status":"planned","permission":"read-only","capabilities":[]}
        core.register(entry,self.db)
        core.attach("os-core","test.one",self.db)
        self.assertIn("test.one", core.collection("os-core",self.db)["members"])
        with self.assertRaises(ValueError):core.register(entry,self.db)
        with self.assertRaises(ValueError):core.register({**entry,"id":"test.two","token":"x"},self.db)
    def test_read_does_not_create_database(self):
        missing=Path(self.temp.name)/"not_here.sqlite3"
        with self.assertRaises(FileNotFoundError):core.list_integrations(missing)
        self.assertFalse(missing.exists())
    def test_export(self):
        idx=core.export_index(self.db)
        self.assertEqual(idx["workspace"],"os")
        self.assertNotIn('password',json.dumps(idx).lower())

if __name__=="__main__":unittest.main()
