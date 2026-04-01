/**
 * LongFu88 Asia — load header, footer, optional CTA after first main section.
 * body[data-page] sets active nav. Works from site root (add ../ for subfolders later).
 */
(function () {
    'use strict';

    var pathname = window.location.pathname || '';
    var base = pathname.split('/').length > 2 && pathname.indexOf('/news/') !== -1 ? '../' : '';

    function rewriteLinks(html) {
        var isSub = base === '../';
        if (!isSub) return html;
        var rootPages = ['index.html', 'slots.html', 'live-casino.html', 'sports-betting.html', 'promotions.html', 'payments.html', 'licensing.html', 'about.html', 'responsible-gambling.html', 'help.html', 'terms.html', 'privacy.html', 'longfu88-malaysia.html', 'longfu88-vietnam.html', 'longfu88-indonesia.html', 'longfu88-thailand.html', 'longfu88-singapore.html'];
        html = html.replace(/\shref="(?!https?:\/\/|#|mailto:|\.\.\/)([^"]+)"/g, function (_, href) {
            if (rootPages.indexOf(href) !== -1) return ' href="../' + href + '"';
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
        wrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;" aria-hidden="true" id="svg-sprite"><defs>' +
            '<symbol id="icon-menu" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></symbol>' +
            '<symbol id="icon-close" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></symbol>' +
            '</defs></svg>';
        document.body.insertBefore(wrap.firstChild, document.body.firstChild);
    }

    function run() {
        injectSprite();
        Promise.all([
            fetch(base + 'partials/header.html').then(function (r) { return r.text(); }),
            fetch(base + 'partials/footer.html').then(function (r) { return r.text(); })
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

            var main = document.getElementById('main-content');
            if (main) {
                fetch(base + 'partials/cta-banner.html').then(function (r) { return r.text(); }).then(function (html) {
                    var first = main.querySelector('section');
                    if (first) first.insertAdjacentHTML('afterend', rewriteLinks(html));
                }).catch(function () {});
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
