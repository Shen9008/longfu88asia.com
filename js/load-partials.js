/**
 * LongFu88 Asia — load header, footer, optional CTA after first main section.
 * body[data-page] sets active nav. Works from site root (add ../ for subfolders later).
 */
(function () {
    'use strict';

    var pathname = window.location.pathname || '';
    var norm = pathname.replace(/\\/g, '/');
    /** True when URLs need `../` on root-relative page links injected into header/footer partials */
    var isBlogOrNewsSection = norm.indexOf('/news/') !== -1 || /\/blog(\/|$)/.test(norm);
    var rewriteBase = isBlogOrNewsSection ? '../' : '';

    function rewriteLinks(html) {
        var isSub = rewriteBase === '../';
        if (!isSub) return html;
        var rootPages = ['index.html', 'slots.html', 'live-casino.html', 'sports-betting.html', 'promotions.html', 'payments.html', 'licensing.html', 'about.html', 'responsible-gambling.html', 'help.html', 'terms.html', 'privacy.html', 'longfu88-malaysia.html', 'longfu88-vietnam.html', 'longfu88-indonesia.html', 'longfu88-thailand.html', 'longfu88-singapore.html', 'blog/index.html'];
        html = html.replace(/\shref="(?!https?:\/\/|#|mailto:|\.\.\/)([^"]+)"/g, function (_, href) {
            var hrefBase = href.split('#')[0];
            if (rootPages.indexOf(hrefBase) !== -1) return ' href="../' + href + '"';
            return ' href="' + href + '"';
        });
        html = html.replace(/\ssrc="images\//g, ' src="../images/');
        return html;
    }

    function setActiveNav() {
        var page = document.body.getAttribute('data-page') || '';
        if (!page) return;
        document.querySelectorAll('[data-nav="' + page + '"]').forEach(function (el) {
            el.classList.add('nav__link--active');
        });
    }

    function injectSprite() {
        if (document.getElementById('svg-sprite')) return;
        var wrap = document.createElement('div');
        var symbols = [
            '<symbol id="icon-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 8h14M5 12h14M5 16h14"/></symbol>',
            '<symbol id="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></symbol>',
            '<symbol id="icon-sparkle" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.4L19 12l-5.2 2.8L12 22l-1.8-5.4L5 12l5.2-2.8L12 2z"/></symbol>',
            '<symbol id="icon-join-cap" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h11M14 9l4 3-4 3"/></symbol>',
            '<symbol id="icon-slots" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4h4v16H5V4zm5 0h4v16h-4V4zm5 0h4v16h-4V4z"/></symbol>',
            '<symbol id="icon-live" viewBox="0 0 24 24" fill="currentColor"><path d="M4 7h11v10H4V7zm13 1.5l5 3.5-5 3.5V8.5z"/></symbol>',
            '<symbol id="icon-sports" viewBox="0 0 24 24" fill="currentColor"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/></symbol>',
            '<symbol id="icon-chart" viewBox="0 0 24 24" fill="currentColor"><path d="M4 19h16v2H4v-2zm2-4h3v4H6v-4zm4-6h3v10h-3V9zm4-4h3v14h-3V5z"/></symbol>',
            '<symbol id="icon-wallet" viewBox="0 0 24 24" fill="currentColor"><path d="M3 7h18v12H3V7zm2 2v8h14V9H5zm11 1h4v6h-4V10z"/></symbol>',
            '<symbol id="icon-globe" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 18.9A8 8 0 014.1 13H8a12 12 0 002 6.9zM4.1 11A8 8 0 0111 3.1a12 12 0 00-2 6.9H4.1zm2 0h4.8a14 14 0 012.1-7.2A8 8 0 006.1 11zm7.8 0H19a8 8 0 00-6.9-7.2A14 14 0 0113.9 11zm0 2a14 14 0 01-2.1 7.2A8 8 0 0019 13h-5.1z"/></symbol>',
            '<symbol id="icon-shield" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 4v6c0 5-3.4 9.5-8 10-4.6-.5-8-5-8-10V6l8-4z"/></symbol>',
            '<symbol id="icon-gift" viewBox="0 0 24 24" fill="currentColor"><path d="M8 4h2v2H8V4zm6 0h2v2h-2V4zM11 3h2v3h-2V3zM4 7h16v2H4V7zM5 9v12h14V9H5zm6 0v12h2V9h-2zM4 13h16v2H4v-2z"/></symbol>',
            '<symbol id="icon-headset" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 00-7 7v4H4v6h3v-6H7V9a5 5 0 0110 0v4h-1v6h3v-6h-1V9a7 7 0 00-7-7z"/></symbol>',
            '<symbol id="icon-check" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></symbol>',
            '<symbol id="icon-arrow-right" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></symbol>',
            '<symbol id="icon-layers" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 4-8 4-8-4 8-4zm0 7l8 4-8 4-8-4 8-4z"/></symbol>',
            '<symbol id="icon-studio" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h7v5H4V6zm9 0h7v12h-7V6zM4 13h7v5H4v-5z"/></symbol>',
            '<symbol id="icon-mobile" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zm5 18a1 1 0 100-2 1 1 0 000 2z"/></symbol>',
            '<symbol id="icon-heart" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></symbol>',
            '<symbol id="icon-book" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h7v16H6a2 2 0 01-2-2V6a2 2 0 012-2zm9 0h5a2 2 0 012 2v14a2 2 0 01-2 2h-5V4z"/></symbol>',
            '<symbol id="icon-clock" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.5 5H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></symbol>',
            '<symbol id="icon-circle-check" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M10.5 14.26L7.24 11l1.41-1.41L10.5 11.44l4.59-4.59L16.41 8.2l-5.91 6.06z"/></symbol>',
            '<symbol id="icon-gamepad-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5h3.5a5 5 0 0 1 0 10h-5.5l-4.015 4.227a2.3 2.3 0 0 1-3.923-2.035l1.634-8.173a5 5 0 0 1 4.904-4.019h3.4z"/><path d="M14 15l4.07 4.284a2.3 2.3 0 0 0 3.925-2.023l-1.6-8.232"/><path d="M8 9v2"/><path d="M7 10h2"/><path d="M14 10h2"/></symbol>',
            '<symbol id="icon-ball-football" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 7l4.76 3.45l-1.76 5.55h-6l-1.76 -5.55z"/><path d="M12 7v-4m3 13l2.5 3m-.74 -8.55l3.74 -1.45m-11.44 7.05l-2.56 2.95m.74 -8.55l-3.74 -1.45"/></symbol>',
            '<symbol id="icon-ball-basketball" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0"/><path d="M5.65 5.65l12.7 12.7"/><path d="M5.65 18.35l12.7-12.7"/><path d="M12 3a9 9 0 0 0 9 9"/><path d="M3 12a9 9 0 0 1 9 9"/></symbol>',
            '<symbol id="icon-cards" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.604 7.197l7.138 -3.109a.96 .96 0 0 1 1.27 .527l4.924 11.902a1 1 0 0 1 -.514 1.304l-7.137 3.109a.96 .96 0 0 1 -1.271 -.527l-4.924 -11.903a1 1 0 0 1 .514 -1.304z"/><path d="M15 4h1a1 1 0 0 1 1 1v3.5"/><path d="M20 6c.264 .112 .52 .217 .768 .315a1 1 0 0 1 .53 1.311l-2.298 5.374"/></symbol>'
        ];
        wrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden;" aria-hidden="true" id="svg-sprite"><defs>' +
            symbols.join('') + '</defs></svg>';
        /* Append sprite so Google Tag Manager <noscript> can remain first in <body> */
        document.body.appendChild(wrap.firstChild);
    }

    function run() {
        injectSprite();
        Promise.all([
            fetch('/partials/header.html').then(function (r) { return r.text(); }),
            fetch('/partials/footer.html').then(function (r) { return r.text(); })
        ]).then(function (parts) {
            var headerHtml = rewriteLinks(parts[0]);
            var footerHtml = rewriteLinks(parts[1]);
            var headerPh = document.getElementById('partial-header');
            var footerPh = document.getElementById('partial-footer');
            if (headerPh) {
                var temp = document.createElement('div');
                temp.innerHTML = headerHtml;
                var parent = headerPh.parentNode;
                while (temp.firstChild) parent.insertBefore(temp.firstChild, headerPh);
                headerPh.remove();
            }
            if (footerPh) footerPh.outerHTML = footerHtml;
            setActiveNav();
            document.dispatchEvent(new CustomEvent('lf88-partials-ready'));

            var main = document.getElementById('main-content');
            if (main) {
                fetch('/partials/cta-banner.html').then(function (r) { return r.text(); }).then(function (html) {
                    var first = main.querySelector('section');
                    if (first) first.insertAdjacentHTML('afterend', rewriteLinks(html));
                }).catch(function () {});

                var explorePartial = document.body.getAttribute('data-explore-partial');
                if (explorePartial) {
                    fetch('/partials/explore-' + explorePartial + '.html').then(function (r) {
                        if (!r.ok) throw new Error('explore');
                        return r.text();
                    }).then(function (html) {
                        main.insertAdjacentHTML('beforeend', rewriteLinks(html));
                    }).catch(function () {});
                }
            }
        }).catch(function () {
            setActiveNav();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
