# Copyright (c) ATHRU Technologies Private Limited. License: MIT

import frappe
from frappe import _
from frappe.integrations.utils import make_post_request
from frappe.sessions import get_csrf_token as _get_csrf_token

# Optional forward target. Set in site_config if needed:
# "lead_capture_url": "https://<erp-site>/api/method/<your.whitelisted.method>"
DEFAULT_LEAD_CAPTURE_URL = ""

ALLOWED_KEYS = frozenset(
	(
		"full_name",
		"mobile",
		"business_name",
		"business_type",
		"city",
		"requirement",
		"source",
		"lead_source",
		"custom_referrer",
	)
)


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_csrf_token():
	"""Return current session CSRF token for same-origin website JS calls."""
	return {"csrf_token": _get_csrf_token()}


@frappe.whitelist(allow_guest=True, methods=["POST"])
def submit_lead():
	"""Receive lead from the marketing site (same-origin), create local Lead, optionally forward upstream."""
	data = None

	# 1) Standard JSON request body
	try:
		data = frappe.request.get_json(silent=True)
	except Exception:
		data = None

	# 2) Raw body fallback
	if not isinstance(data, dict):
		raw_body = None
		try:
			raw_body = frappe.request.data
		except Exception:
			raw_body = None

		if raw_body:
			try:
				data = frappe.parse_json(raw_body)
			except Exception:
				data = None

	# 3) Frappe /api/method form_dict fallback (e.g. body nested in `data`)
	if not isinstance(data, dict):
		form_data = frappe.form_dict.get("data")
		if form_data:
			try:
				data = frappe.parse_json(form_data)
			except Exception:
				data = None

	# 4) Last resort: use posted form fields directly
	if not isinstance(data, dict):
		data = {k: v for k, v in frappe.form_dict.items() if k not in ("cmd", "data")}

	if not isinstance(data, dict):
		frappe.throw(_("Invalid request"), frappe.ValidationError)

	payload = {k: data.get(k) for k in ALLOWED_KEYS if k in data}

	if not (payload.get("full_name") or "").strip():
		frappe.throw(_("Name is required"), frappe.ValidationError)
	if not (payload.get("mobile") or "").strip():
		frappe.throw(_("Mobile is required"), frappe.ValidationError)

	lead_name = _create_local_lead(payload)

	# Optional remote forward for integration. Never block user submission.
	url = (frappe.conf.get("lead_capture_url") or DEFAULT_LEAD_CAPTURE_URL or "").strip()
	if url:
		try:
			make_post_request(
				url,
				json=payload,
				headers={
					"Content-Type": "application/json",
					"Accept": "application/json",
					"X-Frappe-CSRF-Token": "fetch",
				},
			)
		except Exception:
			frappe.log_error(frappe.get_traceback(), "Lead capture forward failed")

	return {"ok": True, "lead_name": lead_name}


def _create_local_lead(payload: dict) -> str:
	"""Create Lead in this site so form success is reliable."""
	company = (payload.get("business_name") or "").strip()
	req = (payload.get("requirement") or "").strip()
	business_type = (payload.get("business_type") or "").strip()
	city = (payload.get("city") or "").strip()
	src = (payload.get("source") or "").strip()
	ref = (payload.get("custom_referrer") or "").strip()
	req_title = req[:120] if req else "Website enquiry"

	doc = frappe.get_doc(
		{
			"doctype": "Lead",
			"lead_name": (payload.get("full_name") or "").strip(),
			"company_name": company or None,
			"mobile_no": (payload.get("mobile") or "").strip(),
			"city": city or None,
			"website": ref or None,
			"title": req_title,
		}
	)
	doc.insert(ignore_permissions=True)

	# Add full intake details as a comment (Lead.notes is a child table in this ERPNext version)
	comment_lines = [
		f"Business Type: {business_type}" if business_type else "",
		f"Source: {src}" if src else "",
		f"Requirement: {req}" if req else "",
		f"Referrer: {ref}" if ref else "",
	]
	comment_text = "\n".join([x for x in comment_lines if x]).strip()
	if comment_text:
		doc.add_comment("Comment", comment_text)

	frappe.db.commit()
	return doc.name
