/**
 * Blog index: loads assets/data/blogs.json, renders cards, client-side pagination (?page=)
 */
(function () {
    'use strict';

    var PAGE_SIZE = 6;
    var MAX_PAGE = 99;
    var MAX_POSTS = PAGE_SIZE * MAX_PAGE;
    var DATA_URL = '/assets/data/blogs.json';
    var DEFAULT_BLOG_IMAGE = '/images/blog-default.png';
    /** Subtle gradient accents on thumbnails (helps when many posts share the default art). */
    var CARD_ACCENT_HUES = [352, 28, 48, 200, 265];

    function postFeaturedImageSrc(post) {
        var u = post && post.image;
        if (!u || !String(u).trim()) return DEFAULT_BLOG_IMAGE;
        u = String(u).trim();
        if (/^https?:\/\//i.test(u)) return u;
        return u.indexOf('/') === 0 ? u : '/' + u;
    }

    function sortBlogsByLatestSyncFirst(a, b) {
        var tb = new Date(b.synced_at || b.published_date || 0).getTime();
        var ta = new Date(a.synced_at || a.published_date || 0).getTime();
        if (tb !== ta) return tb - ta;
        return String(b.slug).localeCompare(String(a.slug));
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getPageFromQuery() {
        var m = /[?&]page=(\d+)/.exec(window.location.search);
        if (!m) return 1;
        var n = parseInt(m[1], 10);
        return isNaN(n) || n < 1 ? 1 : n;
    }

    function setPageInUrl(page, push) {
        var url = new URL(window.location.href);
        if (page <= 1) url.searchParams.delete('page');
        else url.searchParams.set('page', String(page));
        var path = url.pathname + (url.search || '') + url.hash;
        if (push) window.history.pushState({ blogPage: page }, '', path);
        else window.history.replaceState({ blogPage: page }, '', path);
    }

    function scrollToGrid() {
        var el = document.querySelector('.blog-posts-wrap');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function buildPageList(totalPages, current) {
        var delta = 1;
        var pages = [];
        var range = [];
        var i;
        for (i = Math.max(2, current - delta); i <= Math.min(totalPages - 1, current + delta); i++) {
            range.push(i);
        }
        if (current - delta > 2) pages.push(1, '…');
        else pages.push(1);
        pages = pages.concat(range);
        if (current + delta < totalPages - 1) pages.push('…', totalPages);
        else if (totalPages > 1) {
            if (pages.indexOf(totalPages) === -1) pages.push(totalPages);
        }
        var seen = {};
        var out = [];
        for (i = 0; i < pages.length; i++) {
            var p = pages[i];
            var key = String(p);
            if (seen[key]) continue;
            seen[key] = true;
            out.push(p);
        }
        return out;
    }

    function renderPagination(navEl, truncatedEl, totalPages, current) {
        if (!navEl) return;
        if (totalPages <= 1) {
            navEl.hidden = true;
            navEl.innerHTML = '';
            return;
        }
        navEl.hidden = false;
        var parts = [];
        var list = buildPageList(totalPages, current);

        function link(page, label, ariaCurrent) {
            var cls = 'blog-pagination__link';
            if (ariaCurrent) cls += ' blog-pagination__link--current';
            var u = page <= 1 ? './' : './?page=' + page;
            return '<a class="' + cls + '" href="' + u + '"' +
                (ariaCurrent ? ' aria-current="page"' : '') + '>' + escapeHtml(label) + '</a>';
        }

        parts.push('<div class="blog-pagination__bar">');

        parts.push(current > 1
            ? '<a class="blog-pagination__nav-btn blog-pagination__nav-btn--prev" href="./' +
            (current === 2 ? '' : '?page=' + (current - 1)) +
            '" aria-label="Previous page">' +
            '<span class="blog-pagination__nav-icon" aria-hidden="true">\u2190</span>' +
            '<span class="blog-pagination__nav-text">Previous</span></a>'
            : '<span class="blog-pagination__nav-btn blog-pagination__nav-btn--prev blog-pagination__nav-btn--disabled"' +
            ' aria-disabled="true" tabindex="-1" aria-label="Previous page (disabled)">' +
            '<span class="blog-pagination__nav-icon" aria-hidden="true">\u2190</span>' +
            '<span class="blog-pagination__nav-text">Previous</span></span>');


        parts.push('<span class="blog-pagination__numbers" role="group" aria-label="Pages">');
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (item === '…') {
                parts.push('<span class="blog-pagination__ellipsis" aria-hidden="true">&hellip;</span>');
            } else {
                parts.push(link(item, String(item), item === current));
            }
        }
        parts.push('</span>');

        parts.push(current < totalPages
            ? '<a class="blog-pagination__nav-btn blog-pagination__nav-btn--next" href="./?page=' + (current + 1) +
            '" aria-label="Next page">' +
            '<span class="blog-pagination__nav-text">Next</span>' +
            '<span class="blog-pagination__nav-icon" aria-hidden="true">\u2192</span></a>'
            : '<span class="blog-pagination__nav-btn blog-pagination__nav-btn--next blog-pagination__nav-btn--disabled"' +
            ' aria-disabled="true" tabindex="-1" aria-label="Next page (disabled)">' +
            '<span class="blog-pagination__nav-text">Next</span>' +
            '<span class="blog-pagination__nav-icon" aria-hidden="true">\u2192</span></span>');

        parts.push('</div>');
        parts.push('<p class="blog-pagination__status">Page <strong>' + current + '</strong> of <strong>' + totalPages + '</strong></p>');
        navEl.innerHTML = parts.join('\n');

        navEl.querySelectorAll('a.blog-pagination__link, a.blog-pagination__nav-btn').forEach(function (a) {
            if (a.classList.contains('blog-pagination__nav-btn--disabled')) return;
            a.addEventListener('click', function (ev) {
                var href = a.getAttribute('href');
                if (!href || href.indexOf('?page=') === -1 && href !== './' && href.indexOf('./') !== 0) return;
                ev.preventDefault();
                var nextPage = 1;
                var mq = /page=(\d+)/.exec(href);
                if (mq) nextPage = parseInt(mq[1], 10);
                else if (a.classList.contains('blog-pagination__nav-btn--prev')) nextPage = current - 1;
                else if (a.classList.contains('blog-pagination__nav-btn--next')) nextPage = current + 1;
                setPageInUrl(nextPage, true);
                renderBlog(window.__lfBlogPostsAll || [], nextPage, navEl, truncatedEl);
                scrollToGrid();
            });
        });

        if (truncatedEl) {
            truncatedEl.hidden = !(window.__lfBlogTruncated);
            if (window.__lfBlogTruncated) {
                truncatedEl.textContent = 'Showing the ' + MAX_POSTS + ' most recently synced posts. Older entries are still on the site via direct links and search.';
            }
        }
    }

    function renderBlog(allPosts, page, navEl, truncatedEl) {
        var grid = document.getElementById('blog-posts-grid');
        if (!grid) return;

        var totalPages = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE));
        var clamped = Math.min(Math.max(1, page), totalPages);
        if (clamped !== page) setPageInUrl(clamped, false);

        var start = (clamped - 1) * PAGE_SIZE;
        var slice = allPosts.slice(start, start + PAGE_SIZE);

        if (slice.length === 0) {
            grid.innerHTML = '<p class="blog-empty">No articles yet. Check back soon.</p>';
            if (navEl) navEl.hidden = true;
            return;
        }

        grid.innerHTML = slice.map(function (post, idx) {
            var slugRaw = post.slug || '';
            var slugEnc = encodeURIComponent(slugRaw);
            var titleRaw = post.title || slugRaw || 'Article';
            var title = escapeHtml(titleRaw);
            var excerpt = escapeHtml(post.excerpt || post.meta_description || '');
            var cat = escapeHtml(post.category || 'Blog');
            var date = escapeHtml(post.published_date || '');
            var imgSrc = escapeHtml(postFeaturedImageSrc(post));
            var hue = CARD_ACCENT_HUES[(start + idx) % CARD_ACCENT_HUES.length];
            var ariaLabel = escapeHtml('Read article: ' + titleRaw);
            var imgAlt = escapeHtml(titleRaw.length > 100 ? titleRaw.slice(0, 97) + '…' : titleRaw);
            return (
                '<article class="blog-card" style="--blog-card-accent-hue:' + hue + '">' +
                '<a class="blog-card__link" href="/blog/' + slugEnc + '.html" aria-label="' + ariaLabel + '">' +
                '<div class="blog-card__visual">' +
                '<img class="blog-card__img" src="' + imgSrc + '" alt="' + imgAlt + '" width="1200" height="630"' +
                ' loading="lazy" decoding="async">' +
                '</div>' +
                '<div class="blog-card__body">' +
                '<p class="blog-card__meta">' + cat + (date ? ' &middot; ' + date : '') + '</p>' +
                '<h2 class="blog-card__title">' + title + '</h2>' +
                '<p class="blog-card__excerpt">' + excerpt + '</p>' +
                '<span class="blog-card__cta">' +
                '<span class="blog-card__cta-text">Read more</span>' +
                '<span class="blog-card__cta-arrow" aria-hidden="true">&rarr;</span>' +
                '</span>' +
                '</div></a></article>'
            );
        }).join('');

        renderPagination(navEl, truncatedEl, totalPages, clamped);
    }

    function init() {
        var grid = document.getElementById('blog-posts-grid');
        var navEl = document.getElementById('blog-pagination');
        var truncatedEl = document.getElementById('blog-pagination-truncated');
        if (!grid) return;

        fetch(DATA_URL, { credentials: 'same-origin' }).then(function (r) {
            if (!r.ok) throw new Error('blogs.json');
            return r.json();
        }).then(function (data) {
            var posts = Array.isArray(data) ? data.slice() : [];
            posts.sort(sortBlogsByLatestSyncFirst);
            window.__lfBlogTruncated = posts.length > MAX_POSTS;
            var visible = posts.slice(0, MAX_POSTS);
            window.__lfBlogPostsAll = visible;
            var page = getPageFromQuery();
            renderBlog(visible, page, navEl, truncatedEl);
        }).catch(function () {
            grid.innerHTML = '<p class="blog-empty">We couldn\'t load the article list. Please try again later.</p>';
            if (navEl) navEl.hidden = true;
        });

        window.addEventListener('popstate', function () {
            var page = getPageFromQuery();
            renderBlog(window.__lfBlogPostsAll || [], page, navEl, truncatedEl);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
