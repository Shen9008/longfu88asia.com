/**
 * Blog article: recent sidebar + related posts from blogs.json (latest-first sort)
 */
(function () {
    'use strict';

    var DATA_URL = '/assets/data/blogs.json';
    var SIDEBAR_RECENT_COUNT = 3;

    function sortBlogsByLatestFirst(a, b) {
        var pb = new Date(b.published_date || 0).getTime();
        var pa = new Date(a.published_date || 0).getTime();
        if (pb !== pa) return pb - pa;
        var ub = new Date(b.cms_updated_at || b.synced_at || 0).getTime();
        var ua = new Date(a.cms_updated_at || a.synced_at || 0).getTime();
        if (ub !== ua) return ub - ua;
        return String(b.slug).localeCompare(String(a.slug));
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function parseRelatedSlugs(raw) {
        if (!raw || typeof raw !== 'string') return [];
        return raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    }

    function fillList(ul, items, emptyMsg) {
        if (!ul) return;
        ul.innerHTML = '';
        if (!items.length) {
            var li = document.createElement('li');
            li.className = 'blog-sidebar-muted';
            li.textContent = emptyMsg || 'None yet.';
            ul.appendChild(li);
            return;
        }
        items.forEach(function (post) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '/blog/' + encodeURIComponent(post.slug || '') + '.html';
            a.textContent = post.title || post.slug;
            li.appendChild(a);
            ul.appendChild(li);
        });
    }

    function init() {
        var slug = document.body.getAttribute('data-blog-slug') || '';
        var relatedRaw = document.body.getAttribute('data-related-slugs') || '';
        var sidebarUl = document.getElementById('sidebar-posts');
        var relatedSection = document.getElementById('related-posts');
        var relatedList = relatedSection ? relatedSection.querySelector('.blog-related-list') : null;
        var relatedPlaceholder = relatedSection ? relatedSection.querySelector('.blog-related-placeholder') : null;

        fetch(DATA_URL, { credentials: 'same-origin' }).then(function (r) {
            if (!r.ok) throw new Error('blogs.json');
            return r.json();
        }).then(function (data) {
            var posts = Array.isArray(data) ? data.slice() : [];
            posts.sort(sortBlogsByLatestFirst);

            var bySlug = {};
            posts.forEach(function (p) { if (p.slug) bySlug[p.slug] = p; });

            var recent = posts.filter(function (p) { return p.slug && p.slug !== slug; }).slice(0, SIDEBAR_RECENT_COUNT);
            fillList(sidebarUl, recent, 'More posts coming soon.');

            var want = parseRelatedSlugs(relatedRaw);
            var relatedPosts = want.map(function (s) { return bySlug[s]; }).filter(Boolean);
            if (relatedList) {
                relatedList.hidden = relatedPosts.length === 0;
                relatedList.innerHTML = '';
                relatedPosts.forEach(function (post) {
                    var li = document.createElement('li');
                    var a = document.createElement('a');
                    a.href = '/blog/' + encodeURIComponent(post.slug || '') + '.html';
                    a.innerHTML = '<span class="blog-related-list__title">' + escapeHtml(post.title || post.slug) + '</span>' +
                        (post.excerpt ? '<span class="blog-related-list__excerpt">' + escapeHtml(post.excerpt) + '</span>' : '');
                    li.appendChild(a);
                    relatedList.appendChild(li);
                });
                if (relatedPlaceholder) {
                    relatedPlaceholder.style.display = relatedPosts.length ? 'none' : 'block';
                    if (!relatedPosts.length) relatedPlaceholder.textContent = 'No related posts listed for this article.';
                }
            }
        }).catch(function () {
            fillList(sidebarUl, [], 'Could not load posts list.');
            if (relatedPlaceholder) {
                relatedPlaceholder.textContent = 'Could not load related posts.';
                relatedPlaceholder.style.display = 'block';
            }
            if (relatedList) relatedList.hidden = true;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
