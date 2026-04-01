document.addEventListener('DOMContentLoaded', function () {
    document.body.addEventListener('click', function (e) {
        var toggle = e.target.closest('.mobile-menu-toggle');
        if (!toggle) return;
        var menu = document.querySelector('.mobile-menu');
        if (!menu) return;
        menu.classList.toggle('active');
        var use = toggle.querySelector('use');
        if (use) use.setAttribute('href', menu.classList.contains('active') ? '#icon-close' : '#icon-menu');
    });

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href === '#') return;
            var target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                var menu = document.querySelector('.mobile-menu');
                if (menu && menu.classList.contains('active')) {
                    menu.classList.remove('active');
                    var t = document.querySelector('.mobile-menu-toggle use');
                    if (t) t.setAttribute('href', '#icon-menu');
                }
            }
        });
    });

    var header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', function () {
            header.classList.toggle('header--scrolled', window.pageYOffset > 80);
        });
    }

    if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('[data-reveal]').forEach(function (el) {
            obs.observe(el);
        });
    }
});
