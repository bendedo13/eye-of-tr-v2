import io
import unittest

from PIL import Image


class ImagePipelineTests(unittest.TestCase):
    def _make_png(self, color=(255, 0, 0)) -> bytes:
        im = Image.new("RGB", (64, 64), color=color)
        buf = io.BytesIO()
        im.save(buf, format="PNG")
        return buf.getvalue()

    def _make_pattern_png(self, left=(255, 255, 255), right=(0, 0, 0)) -> bytes:
        im = Image.new("RGB", (64, 64), color=left)
        for x in range(32, 64):
            for y in range(64):
                im.putpixel((x, y), right)
        buf = io.BytesIO()
        im.save(buf, format="PNG")
        return buf.getvalue()

    def test_validate_image_upload_accepts_png(self):
        from app.services.image_validation import validate_image_upload

        data = self._make_png()
        out = validate_image_upload(filename="a.png", content_type="image/png", data=data)
        self.assertEqual(out.ext, ".png")
        self.assertEqual(out.size_bytes, len(data))
        self.assertEqual(len(out.sha256), 64)

    def test_dual_hash_changes_for_different_images(self):
        from app.services.image_hashing import compute_dual_hash

        a = self._make_pattern_png(left=(255, 255, 255), right=(0, 0, 0))
        b = self._make_pattern_png(left=(0, 0, 0), right=(255, 255, 255))
        ha = compute_dual_hash(a)
        hb = compute_dual_hash(b)
        self.assertTrue(ha.ahash != hb.ahash or ha.phash != hb.phash)


if __name__ == "__main__":
    unittest.main()
