"""
VeriFact AI — Retrieval-Augmented Fact-Checking (RAG) Engine
Retrieves real evidence from Google Fact Check Tools API, NewsAPI, and live web sources.
Classifies stance and domain credibility weights.
"""

from __future__ import annotations

import logging
import re
import urllib.parse
from typing import Dict, Any, List, Optional
import httpx
from bs4 import BeautifulSoup

from app.core.config import get_settings
from app.models.models import EvidenceRelation

logger = logging.getLogger(__name__)
settings = get_settings()

# Domain credibility reputation weights (0.0 to 1.0)
CREDIBILITY_REGISTRY: Dict[str, float] = {
    "reuters.com": 0.98,
    "apnews.com": 0.98,
    "bbc.com": 0.95,
    "bbc.co.uk": 0.95,
    "snopes.com": 0.96,
    "politifact.com": 0.95,
    "factcheck.org": 0.96,
    "fullfact.org": 0.95,
    "nature.com": 0.99,
    "science.org": 0.99,
    "who.int": 0.98,
    "cdc.gov": 0.98,
    "theguardian.com": 0.90,
    "nytimes.com": 0.92,
    "washingtonpost.com": 0.90,
    "afp.com": 0.95,
    "wikipedia.org": 0.85,
}


class FactCheckRetriever:
    """
    Multimodal RAG Evidence Retrieval Engine.
    Queries verified fact check databases and news outlets.
    """

    def __init__(self):
        self.google_key = settings.google_fact_check_api_key
        self.news_key = settings.news_api_key

    async def retrieve_evidence(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve real evidence from available providers."""
        if not query or not query.strip():
            return []

        results: List[Dict[str, Any]] = []

        # 1. Try Google Fact Check Tools API if key configured
        if self.google_key:
            try:
                g_results = await self._query_google_factcheck(query, limit)
                results.extend(g_results)
            except Exception as e:
                logger.warning("Google Fact Check API query failed: %s", e)

        # 2. Try News API if key configured
        if self.news_key and len(results) < limit:
            try:
                n_results = await self._query_news_api(query, limit - len(results))
                results.extend(n_results)
            except Exception as e:
                logger.warning("NewsAPI query failed: %s", e)

        # 3. Live Encyclopedic Evidence: Wikipedia Knowledge Graph (Open API)
        if len(results) < limit:
            try:
                wiki_results = await self._query_wikipedia(query, limit - len(results))
                results.extend(wiki_results)
            except Exception as e:
                logger.warning("Wikipedia retrieval failed: %s", e)

        # 4. Live fallback: DuckDuckGo instant answer / web topics
        if len(results) < limit:
            try:
                ddg_results = await self._query_duckduckgo(query, limit - len(results))
                results.extend(ddg_results)
            except Exception as e:
                logger.warning("DuckDuckGo retrieval failed: %s", e)

        return results[:limit]

    async def _query_google_factcheck(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """Call Google Fact Check Tools claimReview endpoint."""
        url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
        params = {
            "query": query,
            "key": self.google_key,
            "languageCode": "en",
            "pageSize": limit,
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                logger.debug("Google factcheck returned status %s", resp.status_code)
                return []

            data = resp.json()
            claims = data.get("claims", [])
            evidence_items = []

            for c in claims:
                text = c.get("text", "")
                reviews = c.get("claimReview", [])
                for r in reviews:
                    publisher = r.get("publisher", {}).get("name", "Fact Checker")
                    url_link = r.get("url", "")
                    title = r.get("title", text)
                    rating = r.get("textualRating", "").lower()

                    # Classify relation based on rating
                    if any(w in rating for w in ["false", "incorrect", "pants on fire", "hoax", "misleading"]):
                        relation = EvidenceRelation.CONTRADICTS
                    elif any(w in rating for w in ["true", "correct", "accurate", "confirmed"]):
                        relation = EvidenceRelation.SUPPORTS
                    else:
                        relation = EvidenceRelation.RELATED

                    domain = self._extract_domain(url_link)
                    cred = CREDIBILITY_REGISTRY.get(domain, 0.90)

                    evidence_items.append({
                        "source_name": publisher,
                        "publisher": publisher,
                        "source_url": url_link,
                        "title": title,
                        "snippet": f"Rating: {rating.title()}. Claim: {text}",
                        "relation": relation,
                        "relevance_score": cred,
                        "is_fact_check": True,
                        "retrieval_source": "google_fact_check",
                    })

            return evidence_items

    async def _query_news_api(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """Query News API for contemporary coverage."""
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": query[:100],
            "apiKey": self.news_key,
            "language": "en",
            "sortBy": "relevancy",
            "pageSize": limit,
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                return []

            data = resp.json()
            articles = data.get("articles", [])
            items = []

            for art in articles:
                source_name = art.get("source", {}).get("name", "News Outlet")
                url_link = art.get("url", "")
                domain = self._extract_domain(url_link)
                cred = CREDIBILITY_REGISTRY.get(domain, 0.75)

                items.append({
                    "source_name": source_name,
                    "publisher": source_name,
                    "source_url": url_link,
                    "title": art.get("title", "Article"),
                    "snippet": art.get("description") or art.get("content") or "",
                    "relation": EvidenceRelation.RELATED,
                    "relevance_score": cred,
                    "is_fact_check": False,
                    "retrieval_source": "news_api",
                })

            return items

    async def _query_wikipedia(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """Query Wikipedia API for encyclopedic and factual evidence."""
        clean_q = re.sub(r"[^\w\s]", " ", query).strip()
        url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "list": "search",
            "srsearch": clean_q,
            "format": "json",
            "utf8": "1",
            "srlimit": limit,
        }
        headers = {
            "User-Agent": "VeriFactResearchPlatform/1.0 (academic; verification-engine)"
        }
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code != 200:
                return []
            data = resp.json()
            search_items = data.get("query", {}).get("search", [])
            items = []
            for s in search_items:
                raw_snippet = s.get("snippet", "")
                clean_snippet = BeautifulSoup(raw_snippet, "html.parser").get_text()
                title = s.get("title", "")
                page_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
                
                neg_words = {
                    "debunked", "false", "hoax", "incorrect", "disproven", "fictional", "conspiracy",
                    "fabricated", "unfounded", "denied", "no evidence", "misinformation", "disinformation",
                    "pseudoscience", "pseudoscientific", "urban legend", "myth"
                }
                pos_words = {
                    "confirmed", "verified", "discovered", "discovery", "detected", "detection",
                    "found", "established", "demonstrated", "observed", "published", "reports",
                    "reported", "identified", "proven", "confirms"
                }
                text_to_check = f"{title.lower()} {clean_snippet.lower()}"
                
                if any(w in text_to_check for w in neg_words):
                    relation = EvidenceRelation.CONTRADICTS
                elif any(w in text_to_check for w in pos_words):
                    relation = EvidenceRelation.SUPPORTS
                else:
                    relation = EvidenceRelation.RELATED
                
                items.append({
                    "source_name": "Wikipedia Encyclopedia",
                    "publisher": "Wikimedia Foundation",
                    "source_url": page_url,
                    "title": f"{title} (Factual Reference)",
                    "snippet": clean_snippet,
                    "relation": relation,
                    "relevance_score": 0.88,
                    "is_fact_check": False,
                    "retrieval_source": "wikipedia_knowledge_graph",
                })
            return items

    async def _query_duckduckgo(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """Retrieve web topic evidence via DuckDuckGo API (no key required)."""
        url = "https://api.duckduckgo.com/"
        params = {
            "q": query,
            "format": "json",
            "no_html": "1",
            "skip_disambig": "1",
        }
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                return []

            data = resp.json()
            items = []

            abstract = data.get("AbstractText", "")
            source = data.get("AbstractSource", "Reference Library")
            abs_url = data.get("AbstractURL", "")

            if abstract:
                items.append({
                    "source_name": source,
                    "publisher": source,
                    "source_url": abs_url,
                    "title": data.get("Heading", "Factual Reference"),
                    "snippet": abstract,
                    "relation": EvidenceRelation.RELATED,
                    "relevance_score": 0.85,
                    "is_fact_check": False,
                    "retrieval_source": "duckduckgo_instant",
                })

            # Check RelatedTopics
            topics = data.get("RelatedTopics", [])
            for t in topics[:limit]:
                if isinstance(t, dict) and "Text" in t:
                    first_url = t.get("FirstURL", "")
                    items.append({
                        "source_name": self._extract_domain(first_url) or "Web Reference",
                        "publisher": "DuckDuckGo Knowledge",
                        "source_url": first_url,
                        "title": t.get("Text", "")[:60] + "...",
                        "snippet": t.get("Text", ""),
                        "relation": EvidenceRelation.RELATED,
                        "relevance_score": 0.70,
                        "is_fact_check": False,
                        "retrieval_source": "duckduckgo_topics",
                    })

            return items

    def _extract_domain(self, url: str) -> str:
        """Helper to extract root domain from URL."""
        if not url:
            return ""
        try:
            parsed = urllib.parse.urlparse(url)
            netloc = parsed.netloc.lower()
            if netloc.startswith("www."):
                netloc = netloc[4:]
            return netloc
        except Exception:
            return ""
