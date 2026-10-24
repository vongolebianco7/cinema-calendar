from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class BoxOfficeDomesticForeignTests(unittest.TestCase):
    def test_boxoffice_uses_official_domestic_foreign_split(self):
        text = (ROOT / "rankings.html").read_text(encoding="utf-8")
        self.assertIn('const regions=["すべて","国内","国外"]', text)
        self.assertIn('if(row.region==="邦画")return "国内"', text)
        self.assertIn('if(row.region==="洋画")return "国外"', text)
        self.assertNotIn('const regions=["すべて","日本","アメリカ","アジア","ヨーロッパ","その他"]', text)
        self.assertNotIn('const regions=["すべて","日本","海外"', text)
        self.assertIn('日本市場のみ（海外映画も日本での収入） · 邦画/洋画は公式資料の区分', text)

if __name__ == "__main__":
    unittest.main()
