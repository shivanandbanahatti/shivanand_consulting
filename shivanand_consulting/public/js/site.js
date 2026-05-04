(function () {
	var WHATSAPP_TEL = '919620601250';
	var CALENDLY_URL = 'https://calendly.com/shivanandbanahatti/30min';
	var LEAD_API = '/api/method/shivanand_consulting.api.lead.submit_lead';
	var CSRF_API = '/api/method/shivanand_consulting.api.lead.get_csrf_token';
	var csrfToken = '';

	function initWhatsApp() {
		document.querySelectorAll('a.whatsapp-link').forEach(function (a) {
			var href = a.getAttribute('href') || '';
			if (href.indexOf('wa.me/') !== -1 && href.indexOf('919620601250') !== -1) {
				if (href.indexOf('text=') === -1) {
					a.href = 'https://wa.me/' + WHATSAPP_TEL;
				}
			}
			a.setAttribute('target', '_blank');
			a.setAttribute('rel', 'noopener noreferrer');
		});
		document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
			a.setAttribute('target', '_blank');
			a.setAttribute('rel', 'noopener noreferrer');
		});
	}

	function initCalendly() {
		var cal = document.getElementById('calendly-cta');
		if (cal) {
			cal.href = CALENDLY_URL;
			cal.setAttribute('target', '_blank');
			cal.setAttribute('rel', 'noopener noreferrer');
		}
	}

	function initNavScroll() {
		var nav = document.getElementById('site-nav');
		if (!nav) return;
		var lastY = 0;
		var threshold = 80;
		window.addEventListener('scroll', function () {
			var y = window.scrollY || document.documentElement.scrollTop;
			if (y > lastY && y > threshold) nav.classList.add('nav-hidden');
			else nav.classList.remove('nav-hidden');
			lastY = y;
		}, { passive: true });
	}

	function initMobileNav() {
		var mobile = document.getElementById('mobile-nav');
		var backdrop = document.getElementById('mobile-backdrop');
		var toggle = document.getElementById('nav-toggle');
		var closeBtn = document.getElementById('nav-close');
		if (!mobile || !toggle) return;

		function openNav() {
			mobile.classList.add('open');
			if (backdrop) backdrop.classList.add('open');
			document.body.style.overflow = 'hidden';
		}
		function closeNav() {
			mobile.classList.remove('open');
			if (backdrop) backdrop.classList.remove('open');
			document.body.style.overflow = '';
		}

		toggle.addEventListener('click', function () {
			var isOpen = mobile.classList.contains('open');
			if (isOpen) {
				closeNav();
				toggle.setAttribute('aria-expanded', 'false');
			} else {
				openNav();
				toggle.setAttribute('aria-expanded', 'true');
			}
		});
		if (closeBtn) closeBtn.addEventListener('click', function () {
			closeNav();
			toggle.setAttribute('aria-expanded', 'false');
		});
		if (backdrop) backdrop.addEventListener('click', function () {
			closeNav();
			toggle.setAttribute('aria-expanded', 'false');
		});
		document.querySelectorAll('.mobile-nav-link').forEach(function (link) {
			link.addEventListener('click', function () {
				closeNav();
				toggle.setAttribute('aria-expanded', 'false');
			});
		});
		document.addEventListener('keydown', function (ev) {
			if (ev.key === 'Escape' && mobile.classList.contains('open')) {
				closeNav();
				toggle.setAttribute('aria-expanded', 'false');
			}
		});
	}

	function initReveal() {
		var reveals = document.querySelectorAll('.reveal');
		if (!reveals.length) return;
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (!e.isIntersecting) return;
				e.target.classList.add('visible');
				io.unobserve(e.target);
			});
		}, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
		reveals.forEach(function (el, idx) {
			el.style.transitionDelay = ((idx % 6) * 0.08).toFixed(2) + 's';
			io.observe(el);
		});
	}

	function initServiceCards() {
		var serviceCards = document.querySelectorAll('.service-card');
		if (!serviceCards.length) return;
		var serviceObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.intersectionRatio >= 0.55) entry.target.classList.add('in-focus');
				else entry.target.classList.remove('in-focus');
			});
		}, { threshold: [0.55] });
		serviceCards.forEach(function (card) { serviceObserver.observe(card); });
	}

	function ensureCsrfToken() {
		if (csrfToken) return Promise.resolve(csrfToken);
		return fetch(CSRF_API, { method: 'GET', credentials: 'same-origin' })
			.then(function (r) {
				if (!r.ok) throw new Error('csrf status');
				return r.json();
			})
			.then(function (data) {
				var msg = data && data.message ? data.message : {};
				csrfToken = msg.csrf_token || msg || '';
				return csrfToken;
			})
			.catch(function () { return ''; });
	}

	function initLeadForm() {
		var form = document.getElementById('lead-form');
		if (!form) return;
		var submitBtn = document.getElementById('lead-submit');
		var submitText = document.getElementById('lead-submit-text');
		var submitSpin = document.getElementById('lead-submit-spin');
		var successBox = document.getElementById('lead-success');
		var errorBox = document.getElementById('lead-error');
		if (!submitBtn || !submitText || !submitSpin) return;

		form.addEventListener('submit', function (ev) {
			ev.preventDefault();
			var fd = new FormData(form);
			var mobileRaw = (fd.get('mobile') || '').toString().replace(/\D/g, '');
			var payload = {
				full_name: (fd.get('full_name') || '').toString().trim(),
				mobile: mobileRaw ? '+91' + mobileRaw : '',
				business_name: (fd.get('business_name') || '').toString().trim(),
				business_type: (fd.get('business_type') || '').toString(),
				city: (fd.get('city') || '').toString().trim(),
				requirement: (fd.get('requirement') || '').toString().trim(),
				source: (fd.get('source') || '').toString(),
				lead_source: 'shivanandbanahatti.com',
				custom_referrer: window.location.href
			};

			submitBtn.disabled = true;
			submitText.classList.add('hidden');
			submitSpin.classList.remove('hidden');
			if (errorBox) errorBox.classList.add('hidden');

			ensureCsrfToken()
				.then(function (token) {
					var headers = { 'Content-Type': 'application/json' };
					if (token) headers['X-Frappe-CSRF-Token'] = token;
					return fetch(LEAD_API, {
						method: 'POST',
						credentials: 'same-origin',
						headers: headers,
						body: JSON.stringify(payload)
					});
				})
				.then(function (r) {
					if (!r.ok) throw new Error('bad status');
					return r.json();
				})
				.then(function (data) {
					if (data.exc) throw new Error('server error');
					form.classList.add('hidden');
					if (successBox) successBox.classList.remove('hidden');
				})
				.catch(function () {
					if (errorBox) errorBox.classList.remove('hidden');
				})
				.finally(function () {
					submitBtn.disabled = false;
					submitText.classList.remove('hidden');
					submitSpin.classList.add('hidden');
				});
		});
	}

	initWhatsApp();
	initCalendly();
	initNavScroll();
	initMobileNav();
	initReveal();
	initServiceCards();
	initLeadForm();
})();
