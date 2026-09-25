# backend/app/routes/blog.py
"""
Blog integration: fetches posts from the public Blogger feed
(https://instantresumeai.blogspot.com) server-side, sanitizes the HTML,
and serves it to the frontend as clean JSON. No Google API key needed —
this uses Blogger's public JSON feed, which works for any public blog.
"""

import os
import time
import re
import requests
import bleach
from flask import Blueprint, jsonify

blog_bp = Blueprint('blog', __name__)

BLOGGER_BLOG_URL = os.getenv('BLOGGER_BLOG_URL', 'https://instantresumeai.blogspot.com')
FEED_URL = f"{BLOGGER_BLOG_URL.rstrip('/')}/feeds/posts/default"

# Simple in-memory cache so we don't hit Blogger on every page load.
_cache = {'timestamp': 0, 'posts': []}
CACHE_TTL_SECONDS = 600  # 10 minutes

# Tags/attributes allowed through the sanitizer for post content.
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'blockquote', 'a', 'img', 'span', 'div',
    'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'code', 'pre', 'hr'
]
ALLOWED_ATTRS = {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height'],
    '*': ['class'],
}

# Strip script/style tags AND their inner text before bleach runs — bleach's
# tag-stripping keeps a stripped tag's inner text by default, which would
# otherwise leak raw JS/CSS source into the page as visible text.
_SCRIPT_STYLE_RE = re.compile(r'<(script|style)\b[^>]*>.*?</\1>', re.IGNORECASE | re.DOTALL)


def _extract_id(entry):
    """Blogger's entry id looks like 'tag:blogger.com,1999:blog-123.post-456'.
    We only need the numeric post id at the end."""
    raw = entry.get('id', {}).get('$t', '')
    match = re.search(r'post-(\d+)', raw)
    return match.group(1) if match else raw


def _extract_link(entry):
    for link in entry.get('link', []):
        if link.get('rel') == 'alternate':
            return link.get('href', '')
    return BLOGGER_BLOG_URL


def _extract_thumbnail(entry):
    thumb = entry.get('media$thumbnail', {}).get('url')
    if thumb:
        # Blogger thumbnails default to tiny (72x72) — request a larger crop.
        return re.sub(r'/s72-c/', '/s640/', thumb)
    return None


def _make_excerpt(html_content, length=180):
    text = re.sub(r'<[^>]+>', ' ', html_content or '')
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) <= length:
        return text
    return text[:length].rsplit(' ', 1)[0] + '…'


def _parse_entry(entry):
    title = entry.get('title', {}).get('$t', 'Untitled')
    raw_content = entry.get('content', {}).get('$t', '')
    pre_stripped = _SCRIPT_STYLE_RE.sub('', raw_content)
    clean_content = bleach.clean(pre_stripped, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)
    categories = [c.get('term') for c in entry.get('category', []) if c.get('term')]

    return {
        'id': _extract_id(entry),
        'title': title,
        'published': entry.get('published', {}).get('$t'),
        'updated': entry.get('updated', {}).get('$t'),
        'excerpt': _make_excerpt(pre_stripped),
        'content': clean_content,
        'thumbnail': _extract_thumbnail(entry),
        'url': _extract_link(entry),
        'categories': categories,
    }


def _fetch_posts(force=False):
    now = time.time()
    if not force and _cache['posts'] and (now - _cache['timestamp']) < CACHE_TTL_SECONDS:
        return _cache['posts']

    response = requests.get(
        FEED_URL,
        params={'alt': 'json', 'max-results': 50},
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()
    entries = data.get('feed', {}).get('entry', [])
    posts = [_parse_entry(entry) for entry in entries]

    _cache['posts'] = posts
    _cache['timestamp'] = now
    return posts


@blog_bp.route('/posts', methods=['GET'])
def get_posts():
    """List all blog posts (cards view - excerpt only, no full content needed
    but included anyway since it's cheap; frontend uses `excerpt` for cards)."""
    try:
        posts = _fetch_posts()
        # Don't ship full HTML content in the list view - keeps the payload small.
        summary = [{k: v for k, v in p.items() if k != 'content'} for p in posts]
        return jsonify({'posts': summary}), 200
    except requests.RequestException as e:
        print(f"Blog feed fetch error: {e}")
        return jsonify({'message': 'Unable to load blog posts right now.'}), 502


@blog_bp.route('/posts/<post_id>', methods=['GET'])
def get_post(post_id):
    """Single post with full sanitized content, for the in-app detail page."""
    try:
        posts = _fetch_posts()
        post = next((p for p in posts if p['id'] == post_id), None)
        if not post:
            # Cache might be stale if this is a brand-new post - refetch once.
            posts = _fetch_posts(force=True)
            post = next((p for p in posts if p['id'] == post_id), None)
        if not post:
            return jsonify({'message': 'Post not found.'}), 404
        return jsonify({'post': post}), 200
    except requests.RequestException as e:
        print(f"Blog feed fetch error: {e}")
        return jsonify({'message': 'Unable to load this post right now.'}), 502
