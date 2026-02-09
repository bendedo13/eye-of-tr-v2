"""AI-powered blog content generator service"""
import json
import logging
import random
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional

import httpx
import openai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.cms import BlogPost, SiteSetting

logger = logging.getLogger(__name__)

# Default SEO keyword pools
DEFAULT_SEO_KEYWORDS = {
    "tr": [
        "yüz tanıma teknolojisi", "ters görsel arama", "OSINT nedir",
        "dolandırıcılık tespiti", "fake hesap bulma", "dijital kimlik doğrulama",
        "KVKK ve biyometrik veri", "siber güvenlik", "yapay zeka etiği",
        "sosyal medya güvenliği", "catfish tespiti", "online dolandırıcılık",
        "yüz arama motoru", "biyometrik güvenlik", "deepfake tespiti",
        "kişisel veri güvenliği", "siber istihbarat", "dijital soruşturma",
        "açık kaynak istihbarat", "profil doğrulama", "kimlik hırsızlığı",
        "internet güvenliği", "veri gizliliği", "yapay zeka yüz tanıma",
    ],
    "en": [
        "face recognition technology", "reverse image search", "OSINT guide",
        "fraud detection", "fake profile detection", "digital identity verification",
        "GDPR biometric data", "cybersecurity awareness", "AI ethics",
        "social media safety", "catfishing prevention", "online scam detection",
        "face search engine", "biometric security", "deepfake detection",
        "personal data protection", "cyber intelligence", "digital investigation",
        "open source intelligence", "profile verification", "identity theft",
        "internet safety", "data privacy", "AI facial recognition",
    ],
}


class BlogGeneratorService:
    """AI-powered SEO blog content generator."""

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.enabled = settings.OPENAI_ENABLED
        self.model = settings.OPENAI_MODEL or "gpt-4o-mini"
        self.min_words = int(getattr(settings, "BLOG_AUTO_MIN_WORDS", 300))

    def _get_client(self) -> openai.AsyncOpenAI:
        return openai.AsyncOpenAI(api_key=self.api_key)

    def get_seo_keywords(self, db: Session, locale: str = "tr") -> List[str]:
        """Load SEO keywords from DB or fall back to defaults."""
        row = db.query(SiteSetting).filter(
            SiteSetting.key == f"blog.seo_keywords.{locale}"
        ).first()
        if row:
            try:
                return json.loads(row.value_json)
            except Exception:
                pass
        return DEFAULT_SEO_KEYWORDS.get(locale, DEFAULT_SEO_KEYWORDS["en"])

    def save_seo_keywords(self, db: Session, locale: str, keywords: List[str]) -> None:
        key = f"blog.seo_keywords.{locale}"
        row = db.query(SiteSetting).filter(SiteSetting.key == key).first()
        if row:
            row.value_json = json.dumps(keywords, ensure_ascii=False)
        else:
            row = SiteSetting(key=key, value_json=json.dumps(keywords, ensure_ascii=False))
            db.add(row)
        db.commit()

    async def generate_daily_topics(
        self, locale: str = "tr", count: int = 5, db: Optional[Session] = None,
    ) -> List[Dict[str, str]]:
        """Generate daily blog topics using AI."""
        keywords = self.get_seo_keywords(db, locale) if db else DEFAULT_SEO_KEYWORDS.get(locale, [])
        sample_kw = random.sample(keywords, min(8, len(keywords)))

        if not self.api_key or not self.enabled:
            return self._fallback_topics(locale, count, sample_kw)

        lang = "Türkçe" if locale == "tr" else "English"
        prompt = f"""Generate {count} unique blog post topics for a facial recognition / OSINT SaaS platform called FaceSeek.
Language: {lang}
SEO keywords to incorporate: {', '.join(sample_kw)}

Rules:
- Each topic must be unique and different from common blog posts
- Topics should be relevant to facial recognition, cybersecurity, OSINT, fraud detection, privacy
- Include trending and current topics
- Make titles SEO-friendly (50-65 chars)

Return a JSON array of objects: [{{"title": "...", "keywords": ["kw1", "kw2", "kw3"]}}]
Return ONLY the JSON array, no other text."""

        try:
            client = self._get_client()
            response = await client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800,
                temperature=0.9,
            )
            text = response.choices[0].message.content.strip()
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
            topics = json.loads(text)
            return topics[:count]
        except Exception as e:
            logger.error(f"Topic generation failed: {e}")
            return self._fallback_topics(locale, count, sample_kw)

    def _fallback_topics(self, locale: str, count: int, keywords: List[str]) -> List[Dict[str, str]]:
        templates_tr = [
            "{kw}: Bilmeniz Gereken Her Şey",
            "{kw} Nedir ve Neden Önemli?",
            "2026'da {kw} Trendleri",
            "{kw} İçin En İyi Uygulamalar",
            "{kw}: Kapsamlı Rehber",
        ]
        templates_en = [
            "Everything You Need to Know About {kw}",
            "What is {kw} and Why Does It Matter?",
            "{kw} Trends in 2026",
            "Best Practices for {kw}",
            "The Complete Guide to {kw}",
        ]
        templates = templates_tr if locale == "tr" else templates_en
        topics = []
        for i in range(min(count, len(keywords))):
            t = templates[i % len(templates)]
            kw = keywords[i].title()
            topics.append({"title": t.format(kw=kw), "keywords": [keywords[i]]})
        return topics

    async def generate_blog_post(
        self, topic: str, locale: str, keywords: List[str],
    ) -> Dict[str, str]:
        """Generate a full SEO-optimized blog post using AI."""
        lang = "Türkçe" if locale == "tr" else "English"

        prompt = f"""You are a professional SaaS blog writer. Write an SEO-optimized blog post in {lang}.

Topic: {topic}
Keywords: {', '.join(keywords)}
Brand: FaceSeek (facial recognition and OSINT platform — https://face-seek.com)

Rules:
- Minimum {self.min_words} words
- HTML format (use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>)
- Do NOT include <html>, <head>, <body>, or <h1> tags — only inner content HTML
- SEO title (max 60 chars)
- Meta description (max 155 chars)
- Excerpt (2-3 sentences summary)
- Naturally reference FaceSeek brand (2-3 times max, not forced)
- Follow Google E-E-A-T standards
- Actionable and engaging content
- Include a conclusion section
- Professional, authoritative tone

Return a JSON object:
{{
  "title": "SEO Title here",
  "excerpt": "2-3 sentence excerpt",
  "meta_description": "155 char max meta desc",
  "content_html": "<h2>...</h2><p>...</p>..."
}}
Return ONLY the JSON object, no other text."""

        if not self.api_key or not self.enabled:
            return self._fallback_post(topic, locale, keywords)

        try:
            client = self._get_client()
            response = await client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2500,
                temperature=0.7,
            )
            text = response.choices[0].message.content.strip()
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
            result = json.loads(text)
            return result
        except Exception as e:
            logger.error(f"Blog generation failed: {e}")
            return self._fallback_post(topic, locale, keywords)

    def _fallback_post(self, topic: str, locale: str, keywords: List[str]) -> Dict[str, str]:
        kw_str = ", ".join(keywords)
        if locale == "tr":
            return {
                "title": topic[:60],
                "excerpt": f"{topic} hakkında kapsamlı bir rehber. FaceSeek ile dijital güvenliğinizi güçlendirin.",
                "meta_description": f"{topic} - FaceSeek platformunun uzman rehberi. {kw_str}"[:155],
                "content_html": f"<h2>{topic}</h2><p>Bu konu hakkında detaylı içerik yakında eklenecektir. FaceSeek ekibi tarafından hazırlanmaktadır.</p><p>Anahtar kelimeler: {kw_str}</p>",
            }
        return {
            "title": topic[:60],
            "excerpt": f"A comprehensive guide about {topic}. Strengthen your digital security with FaceSeek.",
            "meta_description": f"{topic} - Expert guide by FaceSeek platform. {kw_str}"[:155],
            "content_html": f"<h2>{topic}</h2><p>Detailed content on this topic is coming soon. Prepared by the FaceSeek team.</p><p>Keywords: {kw_str}</p>",
        }

    async def enrich_with_image(self, content_html: str, topic: str) -> str:
        """Add a relevant image from Unsplash to the blog content."""
        access_key = getattr(settings, "UNSPLASH_ACCESS_KEY", None)
        if not access_key:
            return content_html

        query = topic.split(":")[0].strip()[:50]
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://api.unsplash.com/search/photos",
                    params={"query": query, "per_page": 1, "orientation": "landscape"},
                    headers={"Authorization": f"Client-ID {access_key}"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("results", [])
                    if results:
                        img = results[0]
                        url = img["urls"].get("regular", img["urls"].get("small", ""))
                        alt = img.get("alt_description", topic)[:100]
                        credit = img.get("user", {}).get("name", "Unsplash")
                        img_html = (
                            f'<figure style="margin:20px 0;text-align:center">'
                            f'<img src="{url}" alt="{alt}" style="max-width:100%;border-radius:8px" loading="lazy"/>'
                            f'<figcaption style="font-size:12px;color:#888;margin-top:6px">Photo by {credit} / Unsplash</figcaption>'
                            f'</figure>'
                        )
                        # Insert after first <h2> or at the beginning
                        if "<h2>" in content_html:
                            parts = content_html.split("</h2>", 1)
                            content_html = parts[0] + "</h2>" + img_html + (parts[1] if len(parts) > 1 else "")
                        else:
                            content_html = img_html + content_html
        except Exception as e:
            logger.warning(f"Unsplash image fetch failed: {e}")

        return content_html

    async def run_generation_cycle(
        self, db: Session, locale: str = "tr", count: int = 5,
    ) -> Dict[str, int]:
        """Run a full generation cycle: topics -> posts -> save to DB."""
        stats = {"generated": 0, "failed": 0, "locale": locale}

        topics = await self.generate_daily_topics(locale, count, db)
        logger.info(f"Blog generation: {len(topics)} topics for locale={locale}")

        for topic_info in topics:
            title = topic_info.get("title", "")
            keywords = topic_info.get("keywords", [])

            try:
                post_data = await self.generate_blog_post(title, locale, keywords)

                # Enrich with image
                content = post_data.get("content_html", "")
                content = await self.enrich_with_image(content, title)

                # Create slug
                slug = self._slugify(post_data.get("title", title))

                # Check duplicate slug
                existing = db.query(BlogPost).filter(
                    BlogPost.locale == locale,
                    BlogPost.slug == slug,
                ).first()
                if existing:
                    slug = f"{slug}-{int(datetime.now(timezone.utc).timestamp())}"

                blog_post = BlogPost(
                    locale=locale,
                    slug=slug,
                    title=post_data.get("title", title)[:255],
                    excerpt=post_data.get("excerpt", "")[:500] if post_data.get("excerpt") else None,
                    content_html=content,
                    author_name="FaceSeek AI",
                    is_published=True,
                    published_at=datetime.now(timezone.utc),
                )
                db.add(blog_post)
                db.commit()
                stats["generated"] += 1
                logger.info(f"Blog generated: {slug} ({locale})")

            except Exception as e:
                logger.error(f"Blog generation failed for '{title}': {e}")
                stats["failed"] += 1

        return stats

    @staticmethod
    def _slugify(text: str) -> str:
        text = text.lower().strip()
        # Turkish character mapping
        tr_map = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")
        text = text.translate(tr_map)
        text = re.sub(r"[^\w\s-]", "", text)
        text = re.sub(r"[\s_]+", "-", text)
        text = re.sub(r"-+", "-", text)
        return text[:200].strip("-")


def get_blog_generator() -> BlogGeneratorService:
    return BlogGeneratorService()
