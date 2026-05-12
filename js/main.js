document.addEventListener('DOMContentLoaded', function () {
    /* Header/footer load async via load-partials.js — always query menu/toggle at use time */
    function getMobileMenu() {
        return document.querySelector('.mobile-menu');
    }

    function getMobileMenuToggle() {
        return document.querySelector('.mobile-menu-toggle');
    }

    function setMobileMenuOpen(open) {
        var menu = getMobileMenu();
        var toggle = getMobileMenuToggle();
        if (!menu || !toggle) return;
        menu.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('mobile-menu-open', open);
        var use = toggle.querySelector('use');
        if (use) use.setAttribute('href', open ? '#icon-close' : '#icon-menu');
        var backdrop = document.querySelector('.mobile-menu-backdrop');
        if (backdrop) backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    document.body.addEventListener('click', function (e) {
        if (e.target.closest('.mobile-menu-backdrop')) {
            setMobileMenuOpen(false);
            return;
        }
        var t = e.target.closest('.mobile-menu-toggle');
        if (!t) return;
        var menu = getMobileMenu();
        if (!menu || !document.body.contains(menu)) return;
        setMobileMenuOpen(!menu.classList.contains('active'));
    });

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href === '#') return;
            var target = document.querySelector(href);
            if (target) {
                var menu = getMobileMenu();
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (menu && menu.classList.contains('active')) {
                    setMobileMenuOpen(false);
                }
            }
        });
    });

    window.addEventListener('scroll', function () {
        var header = document.querySelector('.header');
        if (!header) return;
        header.classList.toggle('header--scrolled', window.pageYOffset > 80);
    });

    function refreshScrollTopButton() {
        var btn = document.querySelector('.scroll-top');
        if (!btn) return;
        btn.classList.toggle('is-visible', window.scrollY > 360);
    }

    window.addEventListener('scroll', refreshScrollTopButton, { passive: true });
    document.addEventListener('lf88-partials-ready', refreshScrollTopButton);

    document.body.addEventListener('click', function (e) {
        var scrollBtn = e.target.closest('.scroll-top');
        if (!scrollBtn) return;
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        scrollBtn.blur();
    });

    /* Desktop: dropdown is CSS hover. Touch / no-hover: toggle LongFu88 Asia menu on tap. */
    document.body.addEventListener('click', function (e) {
        if (!window.matchMedia('(hover: none)').matches) return;
        var btn = e.target.closest('.nav__link--dropdown');
        var item = e.target.closest('.nav__item--dropdown');
        if (btn && item && item.contains(btn)) {
            e.stopPropagation();
            var open = item.classList.toggle('nav__item--dropdown--open');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            return;
        }
        if (!item) {
            document.querySelectorAll('.nav__item--dropdown--open').forEach(function (el) {
                el.classList.remove('nav__item--dropdown--open');
                var b = el.querySelector('.nav__link--dropdown');
                if (b) b.setAttribute('aria-expanded', 'false');
            });
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var menu = getMobileMenu();
        var toggle = getMobileMenuToggle();
        if (menu && menu.classList.contains('active')) {
            setMobileMenuOpen(false);
            if (toggle) toggle.focus();
            return;
        }
        document.querySelectorAll('.nav__item--dropdown--open').forEach(function (el) {
            el.classList.remove('nav__item--dropdown--open');
            var b = el.querySelector('.nav__link--dropdown');
            if (b) b.setAttribute('aria-expanded', 'false');
        });
    });
});
