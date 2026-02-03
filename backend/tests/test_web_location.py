import os
import unittest


class WebLocationExtractionTests(unittest.TestCase):
    def test_extract_meta_geo_position(self):
        from app.modules.visual_location.web_location import extract_from_html

        html = """
        <html><head>
          <meta name="geo.position" content="41.0082; 28.9784" />
        </head></html>
        """
        cands = extract_from_html(html, url="https://example.com/x")
        self.assertTrue(len(cands) >= 1)
        best = cands[0]
        self.assertEqual(best.source, "meta_tag")
        self.assertAlmostEqual(best.location.latitude, 41.0082, places=3)
        self.assertAlmostEqual(best.location.longitude, 28.9784, places=3)

    def test_extract_jsonld_geo(self):
        from app.modules.visual_location.web_location import extract_from_html

        html = """
        <html><head>
          <script type="application/ld+json">
            {"@type":"Place","geo":{"latitude":48.8566,"longitude":2.3522}}
          </script>
        </head></html>
        """
        cands = extract_from_html(html, url="https://example.com/y")
        self.assertTrue(any(c.source == "jsonld" for c in cands))


if __name__ == "__main__":
    unittest.main()

