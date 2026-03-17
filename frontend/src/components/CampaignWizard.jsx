import React, { useState, useMemo } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { FormLabel, FormField, inputBaseStyle, getInputFocusHandlers, modalOverlayStyle, modalContentStyle } from './FormStyles'

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246'
}

export default function CampaignWizard({ open, onClose, initialCustomer }) {
  const { themeColor, themeMode } = useTheme()
  const isDarkMode = themeMode === 'dark'
  const themeColorRgb = hexToRgb(themeColor)
  const { show: showToast } = useToast()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [audience, setAudience] = useState(() => ({
    type: initialCustomer ? 'single' : 'all',
    lastPurchaseDays: 60,
    minTotalSpent: '',
    minPoints: '',
    tag: ''
  }))

  const [offer, setOffer] = useState({
    type: 'percent',
    value: '10',
    minPurchase: '',
    code: '',
    expiresInDays: 7
  })

  const [content, setContent] = useState(() => ({
    subject: initialCustomer ? 'A special thank‑you offer just for you' : 'A special offer for our best customers',
    headline: 'Enjoy a limited‑time discount on your next visit',
    body: 'Thanks for being a loyal customer. Use this offer on your next purchase before it expires.',
    ctaText: 'Redeem your offer'
  }))

  const audienceSummary = useMemo(() => {
    if (audience.type === 'single' && initialCustomer) {
      return `This campaign will send to ${initialCustomer.customer_name || '1 customer'} (${initialCustomer.email || 'no email on file'}).`
    }
    if (audience.type === 'all') return 'This campaign will send to all customers with an email address.'
    if (audience.type === 'filters') {
      const parts = []
      if (audience.lastPurchaseDays) parts.push(`last purchase within ${audience.lastPurchaseDays} days`)
      if (audience.minTotalSpent) parts.push(`total spent ≥ $${audience.minTotalSpent}`)
      if (audience.minPoints) parts.push(`loyalty points ≥ ${audience.minPoints}`)
      if (audience.tag) parts.push(`tagged with “${audience.tag}”`)
      if (!parts.length) return 'No filters selected yet.'
      return `Filters: ${parts.join(', ')}.`
    }
    return ''
  }, [audience, initialCustomer])

  const offerSummary = useMemo(() => {
    if (offer.type === 'percent') {
      return `${offer.value || 0}% off${offer.minPurchase ? ` on orders over $${offer.minPurchase}` : ''}`
    }
    if (offer.type === 'amount') {
      return `$${offer.value || 0} off${offer.minPurchase ? ` on orders over $${offer.minPurchase}` : ''}`
    }
    if (offer.type === 'points') {
      return `${offer.value || 0} bonus loyalty points`
    }
    if (offer.type === 'free_item') {
      return 'Free item with qualifying purchase'
    }
    return 'Custom message'
  }, [offer])

  const handleFinish = () => {
    setSaving(true)
    try {
      // For now, just log the payload and show a success toast.
      // Backend integration can be wired to a /api/marketing/campaigns endpoint later.
      // eslint-disable-next-line no-console
      console.log('Campaign draft:', {
        audience,
        offer,
        content,
        initialCustomerId: initialCustomer?.customer_id ?? null
      })
      showToast('Campaign draft created. Backend sending can be wired next.', 'success')
      onClose()
      setStep(1)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const overlayStyle = modalOverlayStyle(isDarkMode, 1002)
  const contentOverrides = {
    maxWidth: '720px',
    width: '96%',
    padding: '20px'
  }

  return (
    <div style={overlayStyle} onClick={() => !saving && onClose()}>
      <div
        style={modalContentStyle(isDarkMode, contentOverrides)}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontFamily: '"Product Sans", sans-serif' }}>
              {initialCustomer ? 'Send promo to customer' : 'Create customer campaign'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
              Design a simple email campaign in a few steps.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '4px', fontSize: '11px', color: '#6b7280' }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  padding: '4px 8px',
                  borderRadius: '999px',
                  border: s === step ? `1px solid rgba(${themeColorRgb}, 0.6)` : '1px solid #e5e7eb',
                  backgroundColor: s === step ? `rgba(${themeColorRgb}, 0.08)` : 'transparent',
                  fontWeight: s === step ? 600 : 400
                }}
              >
                Step {s}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1.1fr)', gap: '20px', alignItems: 'flex-start' }}>
          <div>
            {step === 1 && (
              <>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>Audience</FormLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    {initialCustomer && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="audienceType"
                          value="single"
                          checked={audience.type === 'single'}
                          onChange={() => setAudience((a) => ({ ...a, type: 'single' }))}
                        />
                        <span>Only this customer ({initialCustomer.customer_name || initialCustomer.email || 'Customer'})</span>
                      </label>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="audienceType"
                        value="all"
                        checked={audience.type === 'all'}
                        onChange={() => setAudience((a) => ({ ...a, type: 'all' }))}
                      />
                      <span>All customers with an email address</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="audienceType"
                        value="filters"
                        checked={audience.type === 'filters'}
                        onChange={() => setAudience((a) => ({ ...a, type: 'filters' }))}
                      />
                      <span>Customers matching simple filters (last visit, total spent, points)</span>
                    </label>
                  </div>
                </FormField>

                {audience.type === 'filters' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginTop: '8px' }}>
                    <FormField style={{ marginBottom: 0 }}>
                      <FormLabel isDarkMode={isDarkMode}>Last purchase within (days)</FormLabel>
                      <input
                        type="number"
                        value={audience.lastPurchaseDays}
                        onChange={(e) => setAudience((a) => ({ ...a, lastPurchaseDays: e.target.value ? Number(e.target.value) : '' }))}
                        style={inputBaseStyle(isDarkMode, themeColorRgb)}
                        {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                      />
                    </FormField>
                    <FormField style={{ marginBottom: 0 }}>
                      <FormLabel isDarkMode={isDarkMode}>Min total spent ($)</FormLabel>
                      <input
                        type="number"
                        value={audience.minTotalSpent}
                        onChange={(e) => setAudience((a) => ({ ...a, minTotalSpent: e.target.value }))}
                        style={inputBaseStyle(isDarkMode, themeColorRgb)}
                        {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                      />
                    </FormField>
                    <FormField style={{ marginBottom: 0 }}>
                      <FormLabel isDarkMode={isDarkMode}>Min loyalty points</FormLabel>
                      <input
                        type="number"
                        value={audience.minPoints}
                        onChange={(e) => setAudience((a) => ({ ...a, minPoints: e.target.value }))}
                        style={inputBaseStyle(isDarkMode, themeColorRgb)}
                        {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                      />
                    </FormField>
                    <FormField style={{ marginBottom: 0 }}>
                      <FormLabel isDarkMode={isDarkMode}>Tag contains</FormLabel>
                      <input
                        type="text"
                        value={audience.tag}
                        onChange={(e) => setAudience((a) => ({ ...a, tag: e.target.value }))}
                        placeholder="e.g. Birthday, VIP"
                        style={inputBaseStyle(isDarkMode, themeColorRgb)}
                        {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                      />
                    </FormField>
                  </div>
                )}

                <p style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>{audienceSummary}</p>
              </>
            )}

            {step === 2 && (
              <>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>Offer type</FormLabel>
                  <select
                    value={offer.type}
                    onChange={(e) => setOffer((o) => ({ ...o, type: e.target.value }))}
                    style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), paddingRight: '28px' }}
                  >
                    <option value="percent">Percentage discount</option>
                    <option value="amount">Amount off</option>
                    <option value="points">Bonus loyalty points</option>
                    <option value="free_item">Free item with purchase</option>
                    <option value="custom">Custom message only</option>
                  </select>
                </FormField>
                {offer.type !== 'custom' && (
                  <FormField>
                    <FormLabel isDarkMode={isDarkMode}>
                      {offer.type === 'points' ? 'Points' : 'Discount value'}
                    </FormLabel>
                    <input
                      type="number"
                      value={offer.value}
                      onChange={(e) => setOffer((o) => ({ ...o, value: e.target.value }))}
                      style={inputBaseStyle(isDarkMode, themeColorRgb)}
                      {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                    />
                  </FormField>
                )}
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>Minimum purchase (optional)</FormLabel>
                  <input
                    type="number"
                    value={offer.minPurchase}
                    onChange={(e) => setOffer((o) => ({ ...o, minPurchase: e.target.value }))}
                    placeholder="e.g. 25"
                    style={inputBaseStyle(isDarkMode, themeColorRgb)}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>Coupon code (optional)</FormLabel>
                  <input
                    type="text"
                    value={offer.code}
                    onChange={(e) => setOffer((o) => ({ ...o, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SPRING10"
                    style={inputBaseStyle(isDarkMode, themeColorRgb)}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>Expires in</FormLabel>
                  <input
                    type="number"
                    value={offer.expiresInDays}
                    onChange={(e) => setOffer((o) => ({ ...o, expiresInDays: e.target.value ? Number(e.target.value) : '' }))}
                    style={inputBaseStyle(isDarkMode, themeColorRgb)}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Days from when the customer receives the email.
                  </p>
                </FormField>
                <p style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                  Summary: {offerSummary}
                </p>
              </>
            )}

            {step === 3 && (
              <>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>Subject line</FormLabel>
                  <input
                    type="text"
                    value={content.subject}
                    onChange={(e) => setContent((c) => ({ ...c, subject: e.target.value }))}
                    style={inputBaseStyle(isDarkMode, themeColorRgb)}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>Headline</FormLabel>
                  <input
                    type="text"
                    value={content.headline}
                    onChange={(e) => setContent((c) => ({ ...c, headline: e.target.value }))}
                    style={inputBaseStyle(isDarkMode, themeColorRgb)}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>Body text</FormLabel>
                  <textarea
                    rows={4}
                    value={content.body}
                    onChange={(e) => setContent((c) => ({ ...c, body: e.target.value }))}
                    style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), resize: 'vertical' }}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>Button text</FormLabel>
                  <input
                    type="text"
                    value={content.ctaText}
                    onChange={(e) => setContent((c) => ({ ...c, ctaText: e.target.value }))}
                    style={inputBaseStyle(isDarkMode, themeColorRgb)}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', gap: '8px' }}>
              <button
                type="button"
                onClick={() => !saving && onClose()}
                disabled={saving}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'transparent',
                  fontSize: '13px',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1 || saving}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    fontSize: '13px',
                    cursor: step === 1 || saving ? 'not-allowed' : 'pointer',
                    opacity: step === 1 ? 0.6 : 1
                  }}
                >
                  Back
                </button>
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(3, s + 1))}
                    disabled={saving}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '999px',
                      border: `1px solid rgba(${themeColorRgb}, 0.6)`,
                      backgroundColor: `rgba(${themeColorRgb}, 0.85)`,
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      boxShadow: `0 4px 10px rgba(${themeColorRgb}, 0.3)`
                    }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={saving}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '999px',
                      border: `1px solid rgba(${themeColorRgb}, 0.6)`,
                      backgroundColor: `rgba(${themeColorRgb}, 0.9)`,
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      boxShadow: `0 4px 14px rgba(${themeColorRgb}, 0.35)`
                    }}
                  >
                    {saving ? 'Saving…' : 'Create campaign draft'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div
            aria-label="Email preview"
            style={{
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              background: isDarkMode ? 'linear-gradient(145deg, #020617, #0f172a)' : 'linear-gradient(145deg, #f9fafb, #e5e7eb)',
              padding: '16px',
              boxShadow: isDarkMode ? '0 10px 40px rgba(15,23,42,0.9)' : '0 10px 40px rgba(148,163,184,0.5)',
              fontSize: '13px'
            }}
          >
            <div
              style={{
                maxWidth: '420px',
                margin: '0 auto',
                backgroundColor: '#fff',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 12px 30px rgba(15,23,42,0.12)'
              }}
            >
              <div style={{ padding: '16px 18px 10px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '999px', backgroundColor: `rgba(${themeColorRgb}, 0.12)` }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>Your store</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>to {initialCustomer ? (initialCustomer.customer_name || initialCustomer.email || 'Customer') : 'customer list'}</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#111827' }}>{content.subject || 'Subject preview'}</div>
              </div>

              <div style={{ padding: '18px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: `rgba(${themeColorRgb}, 0.1)`,
                    color: '#111827',
                    fontSize: '11px',
                    marginBottom: '10px'
                  }}
                >
                  {offerSummary}
                </div>

                <h2 style={{ margin: '0 0 8px', fontSize: '18px', lineHeight: 1.3, color: '#111827' }}>
                  {content.headline || 'Email headline goes here'}
                </h2>
                <p style={{ margin: '0 0 12px', color: '#4b5563', fontSize: '13px', lineHeight: 1.5 }}>
                  {content.body || 'Write a short, friendly message explaining the offer and any important details.'}
                </p>

                <div style={{ marginTop: '14px', marginBottom: '6px' }}>
                  <button
                    type="button"
                    style={{
                      padding: '8px 18px',
                      borderRadius: '999px',
                      border: 'none',
                      backgroundColor: `rgba(${themeColorRgb}, 0.95)`,
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'default',
                      boxShadow: `0 6px 18px rgba(${themeColorRgb}, 0.35)`
                    }}
                  >
                    {content.ctaText || 'Redeem offer'}
                  </button>
                </div>

                <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                  This offer expires in {offer.expiresInDays || 7} days. Show this email at checkout to redeem.
                </p>
              </div>

              <div style={{ padding: '10px 18px 14px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '11px', color: '#9ca3af' }}>
                You are receiving this because you are a customer of this store.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

