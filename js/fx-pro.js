(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* Ambient cursor glow */
    if (finePointer && !reducedMotion) {
        var glow = document.createElement('div');
        glow.className = 'fx-cursor-glow';
        glow.setAttribute('aria-hidden', 'true');
        document.body.appendChild(glow);
        document.body.classList.add('lf-cursor-active');

        var gx = window.innerWidth / 2;
        var gy = window.innerHeight / 2;
        var tx = gx;
        var ty = gy;
        var raf = null;

        function tick() {
            gx += (tx - gx) * 0.12;
            gy += (ty - gy) * 0.12;
            glow.style.left = gx + 'px';
            glow.style.top = gy + 'px';
            raf = requestAnimationFrame(tick);
        }

        document.addEventListener('mousemove', function (e) {
            tx = e.clientX;
            ty = e.clientY;
            if (!raf) raf = requestAnimationFrame(tick);
        }, { passive: true });
    }

    /* Subtle 3D tilt on interactive cards */
    if (finePointer && !reducedMotion) {
        var tiltSel = '.feature-card:not(.feature-card--visual), .game-tile, .hero__panel, .stat-pill';
        document.body.addEventListener('mousemove', function (e) {
            var card = e.target.closest(tiltSel);
            document.querySelectorAll(tiltSel + '.lf-tilt-active').forEach(function (el) {
                if (el !== card) {
                    el.classList.remove('lf-tilt-active');
                    el.style.transform = '';
                }
            });
            if (!card) return;
            var rect = card.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width - 0.5;
            var y = (e.clientY - rect.top) / rect.height - 0.5;
            card.classList.add('lf-tilt-active');
            card.style.transform = 'perspective(800px) rotateX(' + (-y * 6) + 'deg) rotateY(' + (x * 6) + 'deg) translateY(-4px)';
        }, { passive: true });

        document.body.addEventListener('mouseleave', function () {
            document.querySelectorAll(tiltSel + '.lf-tilt-active').forEach(function (el) {
                el.classList.remove('lf-tilt-active');
                el.style.transform = '';
            });
        });
    }

    /* Highlight stat pills when hero panel is visible */
    if ('IntersectionObserver' in window) {
        document.querySelectorAll('.hero__panel .stat-pill').forEach(function (pill, i) {
            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        setTimeout(function () {
                            pill.classList.add('lf-stat--lit');
                        }, 120 * i);
                    }
                });
            }, { threshold: 0.5 });
            obs.observe(pill);
        });
    }

    /* Magnetic pull on primary CTAs */
    if (finePointer && !reducedMotion) {
        document.querySelectorAll('.btn--gold').forEach(function (btn) {
            btn.addEventListener('mousemove', function (e) {
                var r = btn.getBoundingClientRect();
                var x = e.clientX - r.left - r.width / 2;
                var y = e.clientY - r.top - r.height / 2;
                btn.style.transform = 'translate(' + (x * 0.15) + 'px,' + (y * 0.15) + 'px) scale(1.02)';
            });
            btn.addEventListener('mouseleave', function () {
                btn.style.transform = '';
            });
        });
    }
})();
