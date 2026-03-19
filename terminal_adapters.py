"""
Terminal Adapters — abstract payment terminal interface

Each adapter wraps a specific hardware/software payment terminal so the
POS payment flow is hardware-agnostic.  web_viewer.py routes payment
requests to the active adapter based on `payment_settings.terminal_type`.

Supported adapters
------------------
stripe_terminal   — Stripe Terminal (BBPOS WisePad 3, Verifone P400, BBPOS WisePos E, Stripe Reader S700)
pax               — PAX Technology terminals (A920, A35, IM30, etc.) via PAX SDK / HTTP bridge
manual            — Manual / software entry: Stripe Elements form in the browser (no hardware needed)
cash              — Cash / no-card-processing (always succeeds, amount tracked only)
"""

from __future__ import annotations

import os
import abc
from typing import Any, Optional

# ---------------------------------------------------------------------------
# Abstract base
# ---------------------------------------------------------------------------

class TerminalAdapter(abc.ABC):
    """Abstract payment terminal adapter."""

    adapter_type: str = ''

    @abc.abstractmethod
    def create_payment(
        self,
        amount_cents: int,
        currency: str = 'usd',
        description: str = '',
        metadata: Optional[dict] = None,
    ) -> dict:
        """
        Initiate a payment for *amount_cents*.

        Returns a dict with at minimum:
          success      bool
          adapter      str   — which adapter handled this
          client_secret str | None  — Stripe PaymentIntent client_secret (if applicable)
          payment_intent_id str | None
          reader_id     str | None
          error         str | None
        """

    @abc.abstractmethod
    def capture_payment(self, payment_intent_id: str) -> dict:
        """Capture a previously authorised PaymentIntent."""

    @abc.abstractmethod
    def cancel_payment(self, payment_intent_id: str) -> dict:
        """Cancel / abort an in-progress payment."""


# ---------------------------------------------------------------------------
# Stripe Terminal adapter
# ---------------------------------------------------------------------------

class StripeTerminalAdapter(TerminalAdapter):
    """
    Stripe Terminal (physical card readers).

    Covers:
    - BBPOS WisePad 3 (Bluetooth, mobile)
    - BBPOS WisePos E (countertop, Ethernet/WiFi)
    - Verifone P400 (countertop, Ethernet)
    - Stripe Reader S700 (smart terminal, WiFi/LTE)

    Requires:
    - STRIPE_SECRET_KEY env var
    - Terminal readers registered/paired in Stripe Dashboard or via API
    """

    adapter_type = 'stripe_terminal'

    def __init__(self):
        self._stripe_key = os.getenv('STRIPE_SECRET_KEY')
        if not self._stripe_key:
            raise RuntimeError('STRIPE_SECRET_KEY not set — Stripe Terminal unavailable')
        import stripe
        self._stripe = stripe
        self._stripe.api_key = self._stripe_key

    # -- connection token (called by frontend Stripe Terminal JS SDK) --------

    def create_connection_token(self, location_id: Optional[str] = None) -> dict:
        """
        Create a connection token the frontend SDK uses to connect to a reader.
        Should be called fresh each time the terminal app starts.
        """
        try:
            params: dict = {}
            if location_id:
                params['location'] = location_id
            token = self._stripe.terminal.ConnectionToken.create(**params)
            return {'success': True, 'secret': token.secret}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    # -- reader management ---------------------------------------------------

    def list_readers(self, location_id: Optional[str] = None) -> dict:
        try:
            params: dict = {'limit': 100}
            if location_id:
                params['location'] = location_id
            readers = self._stripe.terminal.Reader.list(**params)
            return {
                'success': True,
                'readers': [
                    {
                        'id': r.id,
                        'label': r.label,
                        'status': r.status,
                        'device_type': r.device_type,
                        'location': r.location,
                        'ip_address': getattr(r, 'ip_address', None),
                    }
                    for r in readers.auto_paging_iter()
                ],
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def register_reader(self, registration_code: str, label: str, location_id: Optional[str] = None) -> dict:
        """Register a new reader by pairing code (shown on reader display)."""
        try:
            params: dict = {'registration_code': registration_code, 'label': label}
            if location_id:
                params['location'] = location_id
            reader = self._stripe.terminal.Reader.create(**params)
            return {'success': True, 'reader_id': reader.id, 'label': reader.label, 'status': reader.status}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def delete_reader(self, reader_id: str) -> dict:
        try:
            self._stripe.terminal.Reader.delete(reader_id)
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    # -- payment flow --------------------------------------------------------

    def create_payment(
        self,
        amount_cents: int,
        currency: str = 'usd',
        description: str = '',
        metadata: Optional[dict] = None,
    ) -> dict:
        """
        Create a PaymentIntent for Terminal capture.
        The frontend SDK then uses `terminal.collectPaymentMethod(client_secret)`.
        """
        try:
            intent = self._stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency.lower(),
                payment_method_types=['card_present'],
                capture_method='manual',
                description=description or 'POS sale',
                metadata=metadata or {},
            )
            return {
                'success': True,
                'adapter': self.adapter_type,
                'payment_intent_id': intent.id,
                'client_secret': intent.client_secret,
                'amount': intent.amount,
                'currency': intent.currency,
                'status': intent.status,
                'reader_id': None,
                'error': None,
            }
        except Exception as e:
            return {'success': False, 'adapter': self.adapter_type, 'error': str(e),
                    'client_secret': None, 'payment_intent_id': None, 'reader_id': None}

    def present_to_reader(self, reader_id: str, payment_intent_id: str) -> dict:
        """
        Ask a specific reader to collect a payment for an existing PaymentIntent.
        Used for internet-connected readers (WisePos E, Verifone P400, S700).
        """
        try:
            reader = self._stripe.terminal.Reader.process_payment_intent(
                reader_id,
                payment_intent=payment_intent_id,
            )
            return {
                'success': True,
                'reader_id': reader.id,
                'action_status': reader.action.status if reader.action else 'unknown',
                'payment_intent_id': payment_intent_id,
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def capture_payment(self, payment_intent_id: str) -> dict:
        try:
            intent = self._stripe.PaymentIntent.capture(payment_intent_id)
            return {
                'success': True,
                'payment_intent_id': intent.id,
                'status': intent.status,
                'amount_received': intent.amount_received,
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def cancel_payment(self, payment_intent_id: str) -> dict:
        try:
            intent = self._stripe.PaymentIntent.cancel(payment_intent_id)
            return {'success': True, 'payment_intent_id': intent.id, 'status': intent.status}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def cancel_reader_action(self, reader_id: str) -> dict:
        """Cancel a reader's current action (e.g. waiting for card tap)."""
        try:
            reader = self._stripe.terminal.Reader.cancel_action(reader_id)
            return {'success': True, 'reader_id': reader.id}
        except Exception as e:
            return {'success': False, 'error': str(e)}


# ---------------------------------------------------------------------------
# PAX Terminal adapter
# ---------------------------------------------------------------------------

class PaxTerminalAdapter(TerminalAdapter):
    """
    PAX Technology terminal adapter.

    PAX terminals (A920, A920Pro, A35, IM30, etc.) expose an HTTP bridge
    running on the terminal's LAN IP.  This adapter sends payment commands
    to that HTTP bridge and interprets the response.

    Configuration (all optional, fall back to DB/payment_settings):
      PAX_TERMINAL_IP   — LAN IP of the PAX terminal, e.g. "192.168.1.100"
      PAX_TERMINAL_PORT — port (default 10009)

    Note: PAX HTTP API specifics vary by firmware version and country.
    This adapter targets the POSLINK / PAX HTTP protocol widely used in the US.
    """

    adapter_type = 'pax'

    def __init__(self, terminal_ip: Optional[str] = None, terminal_port: int = 10009):
        self.terminal_ip = terminal_ip or os.getenv('PAX_TERMINAL_IP', '')
        self.terminal_port = terminal_port

    @property
    def _base_url(self) -> str:
        return f'http://{self.terminal_ip}:{self.terminal_port}'

    def create_payment(
        self,
        amount_cents: int,
        currency: str = 'usd',
        description: str = '',
        metadata: Optional[dict] = None,
    ) -> dict:
        if not self.terminal_ip:
            return {'success': False, 'adapter': self.adapter_type,
                    'error': 'PAX_TERMINAL_IP not configured',
                    'client_secret': None, 'payment_intent_id': None, 'reader_id': None}
        try:
            import urllib.request
            import urllib.parse

            # PAX POSLINK Sale command (simplified)
            params = urllib.parse.urlencode({
                'Command': 'T00',          # Sale
                'Version': '1.28',
                'TransType': '01',         # Sale
                'Amount': str(amount_cents),
                'CurrencyCode': '840',     # USD
            })
            url = f'{self._base_url}?{params}'
            with urllib.request.urlopen(url, timeout=60) as resp:
                body = resp.read().decode()

            # PAX responses are pipe-separated: field[0]=status, field[1]=msg, field[4]=approval code
            fields = body.split('\x1c')
            if len(fields) >= 2 and fields[0] == '000000':
                return {
                    'success': True,
                    'adapter': self.adapter_type,
                    'payment_intent_id': fields[4] if len(fields) > 4 else '',
                    'client_secret': None,
                    'reader_id': self.terminal_ip,
                    'approval_code': fields[4] if len(fields) > 4 else '',
                    'error': None,
                }
            else:
                msg = fields[1] if len(fields) > 1 else 'Unknown PAX error'
                return {'success': False, 'adapter': self.adapter_type, 'error': msg,
                        'client_secret': None, 'payment_intent_id': None, 'reader_id': self.terminal_ip}
        except Exception as e:
            return {'success': False, 'adapter': self.adapter_type, 'error': str(e),
                    'client_secret': None, 'payment_intent_id': None, 'reader_id': self.terminal_ip}

    def capture_payment(self, payment_intent_id: str) -> dict:
        # PAX sale is authorise+capture in one shot; no separate capture needed
        return {'success': True, 'payment_intent_id': payment_intent_id, 'note': 'PAX: already captured at sale time'}

    def cancel_payment(self, payment_intent_id: str) -> dict:
        if not self.terminal_ip:
            return {'success': False, 'error': 'PAX_TERMINAL_IP not configured'}
        try:
            import urllib.request
            import urllib.parse
            params = urllib.parse.urlencode({
                'Command': 'T00',
                'Version': '1.28',
                'TransType': '17',  # Void
                'OrigRefNum': payment_intent_id,
            })
            url = f'{self._base_url}?{params}'
            with urllib.request.urlopen(url, timeout=30) as resp:
                body = resp.read().decode()
            fields = body.split('\x1c')
            ok = len(fields) >= 1 and fields[0] == '000000'
            return {'success': ok, 'error': None if ok else (fields[1] if len(fields) > 1 else 'Void failed')}
        except Exception as e:
            return {'success': False, 'error': str(e)}


# ---------------------------------------------------------------------------
# Manual / Software entry adapter (Stripe Elements)
# ---------------------------------------------------------------------------

class ManualEntryAdapter(TerminalAdapter):
    """
    Software card entry via Stripe Elements in the browser.

    No physical hardware required.  The frontend collects the card via
    Stripe.js / Elements and confirms the PaymentIntent client-side.
    Backend only creates the PaymentIntent; confirmation happens on the client.

    Works with Stripe Connect accounts and direct Stripe accounts.
    """

    adapter_type = 'manual'

    def __init__(self, stripe_key: Optional[str] = None, stripe_account_id: Optional[str] = None):
        self._stripe_key = stripe_key or os.getenv('STRIPE_SECRET_KEY')
        if not self._stripe_key:
            raise RuntimeError('STRIPE_SECRET_KEY not set — Manual entry unavailable')
        import stripe
        self._stripe = stripe
        self._stripe.api_key = self._stripe_key
        self._stripe_account_id = stripe_account_id  # for Connect on-behalf-of

    def create_payment(
        self,
        amount_cents: int,
        currency: str = 'usd',
        description: str = '',
        metadata: Optional[dict] = None,
    ) -> dict:
        try:
            kwargs: dict[str, Any] = {
                'amount': amount_cents,
                'currency': currency.lower(),
                'payment_method_types': ['card'],
                'description': description or 'POS sale',
                'metadata': metadata or {},
            }
            if self._stripe_account_id:
                kwargs['stripe_account'] = self._stripe_account_id
            intent = self._stripe.PaymentIntent.create(**kwargs)
            return {
                'success': True,
                'adapter': self.adapter_type,
                'payment_intent_id': intent.id,
                'client_secret': intent.client_secret,
                'amount': intent.amount,
                'currency': intent.currency,
                'status': intent.status,
                'reader_id': None,
                'error': None,
            }
        except Exception as e:
            return {'success': False, 'adapter': self.adapter_type, 'error': str(e),
                    'client_secret': None, 'payment_intent_id': None, 'reader_id': None}

    def capture_payment(self, payment_intent_id: str) -> dict:
        # Manual entry uses automatic capture; client confirms directly
        return {'success': True, 'payment_intent_id': payment_intent_id,
                'note': 'Manual: capture handled client-side via Stripe.js'}

    def cancel_payment(self, payment_intent_id: str) -> dict:
        try:
            intent = self._stripe.PaymentIntent.cancel(payment_intent_id)
            return {'success': True, 'payment_intent_id': intent.id, 'status': intent.status}
        except Exception as e:
            return {'success': False, 'error': str(e)}


# ---------------------------------------------------------------------------
# Cash adapter (no card processing)
# ---------------------------------------------------------------------------

class CashAdapter(TerminalAdapter):
    """
    Cash / no-card-processing adapter.

    Always succeeds immediately.  Amount is tracked for reporting purposes
    only — no actual payment gateway involved.
    """

    adapter_type = 'cash'

    def create_payment(
        self,
        amount_cents: int,
        currency: str = 'usd',
        description: str = '',
        metadata: Optional[dict] = None,
    ) -> dict:
        return {
            'success': True,
            'adapter': self.adapter_type,
            'payment_intent_id': None,
            'client_secret': None,
            'amount': amount_cents,
            'currency': currency,
            'status': 'cash_tendered',
            'reader_id': None,
            'error': None,
        }

    def capture_payment(self, payment_intent_id: str) -> dict:
        return {'success': True, 'note': 'Cash: no capture needed'}

    def cancel_payment(self, payment_intent_id: str) -> dict:
        return {'success': True, 'note': 'Cash: no cancellation needed'}


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

def get_adapter(
    adapter_type: str,
    *,
    stripe_key: Optional[str] = None,
    stripe_account_id: Optional[str] = None,
    pax_ip: Optional[str] = None,
    pax_port: int = 10009,
) -> TerminalAdapter:
    """
    Return an initialised TerminalAdapter for *adapter_type*.

    adapter_type values:
      'stripe_terminal'  → StripeTerminalAdapter
      'pax'              → PaxTerminalAdapter
      'manual'           → ManualEntryAdapter
      'cash'             → CashAdapter (default / fallback)
    """
    if adapter_type == 'stripe_terminal':
        return StripeTerminalAdapter()
    elif adapter_type == 'pax':
        return PaxTerminalAdapter(terminal_ip=pax_ip, terminal_port=pax_port)
    elif adapter_type == 'manual':
        return ManualEntryAdapter(stripe_key=stripe_key, stripe_account_id=stripe_account_id)
    else:
        return CashAdapter()
