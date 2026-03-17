import React, { useState, useMemo } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { FormLabel, FormField, inputBaseStyle, getInputFocusHandlers, modalOverlayStyle, modalContentStyle } from './FormStyles'

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246'
}

const DEFAULT_TEMPLATES = {
  post_purchase: {
    name: 'Thank‑you after order',
    description: 'Automatically thank customers after each order and invite them back with a small incentive.',
    triggerType: 'after_order',
    delayDays: 0,
    subject: 'Thank you for your order!',
    smsText: 'Thanks for your order at our store. We appreciate you!',
    emailHeadline: 'Thanks for shopping with us',
    emailBody: 'We appreciate your business. Here are the details of your visit and a little something for next time.',
    ctaText: 'View your offer'
  },
  winback: {
    name: 'Win‑back after no orders',
    description: 'Reach out to customers who have not ordered in a while with a comeback offer.',
    triggerType: 'no_orders_for_days',
    delayDays: 30,
    subject: 'We miss you – here’s something for you',
    smsText: 'It’s been a while! Here’s a little offer to welcome you back.',
    emailHeadline: 'It’s been a while – come back and see us',
    emailBody: 'We noticed you haven’t stopped by recently. Use this offer on your next visit.',
    ctaText: 'Redeem comeback offer'
  },
  holiday: {
    name: 'Holiday greetings',
    description: 'Send a warm holiday greeting with an optional perk attached.',
    triggerType: 'holiday',
    delayDays: 0,
    subject: 'Happy holidays from our team',
    smsText: 'Happy holidays from our team – thank you for being our customer!',
    emailHeadline: 'Warm holiday wishes',
    emailBody: 'From all of us, thank you for being part of our community. Wishing you a wonderful holiday season.',
    ctaText: 'See holiday hours'
  },
  unused_points: {
    name: 'Unused points reminder',
    description: 'Remind customers that they have loyalty points waiting to be used.',
    triggerType: 'unused_points',
    delayDays: 0,
    subject: 'You have points waiting for you',
    smsText: 'You’ve earned loyalty points at our store – don’t forget to use them!',
    emailHeadline: 'You have rewards waiting',
    emailBody: 'You’ve built up loyalty points with us. Treat yourself on your next visit.',
    ctaText: 'Use my points'
  }
}

export default function AutomationCampaignModal({ open, onClose, templateKey }) {
  const template = templateKey ? DEFAULT_TEMPLATES[templateKey] : null
  const { themeColor, themeMode } = useTheme()
  const isDarkMode = themeMode === 'dark'
  const themeColorRgb = hexToRgb(themeColor)
  const { show: showToast } = useToast()

  const [channel, setChannel] = useState('email') // 'email' | 'sms'
  const [saving, setSaving] = useState(false)

  const [config, setConfig] = useState(() => ({
    name: template?.name || 'Automation',
    enabled: true,
    triggerType: template?.triggerType || 'after_order',
    delayDays: template?.delayDays ?? 0,
    lastOrderDays: template?.delayDays ?? 30,
    holidayName: '',
    minPoints: 0,
    subject: template?.subject || '',
    smsText: template?.smsText || '',
    emailHeadline: template?.emailHeadline || '',
    emailBody: template?.emailBody || '',
    ctaText: template?.ctaText || '',
    discountType: 'percent', // 'percent' | 'amount' | 'points' | 'none'
    discountValue: '',
    discountItem: '',
    discountNote: ''
  }))

  const triggerSummary = useMemo(() => {
    if (config.triggerType === 'after_order') {
      return 'Sends automatically a short time after each completed order.'
    }
    if (config.triggerType === 'no_orders_for_days') {
      return `Sends when a customer has no orders for ${config.lastOrderDays || 30} days.`
    }
    if (config.triggerType === 'holiday') {
      return `Sends on the selected holiday${config.holidayName ? ` (${config.holidayName})` : ''}.`
    }
    if (config.triggerType === 'unused_points') {
      return `Sends to customers with at least ${config.minPoints || 0} unused points.`
    }
    return ''
  }, [config])

  const discountSummary = useMemo(() => {
    if (config.discountType === 'none') return 'No discount attached – this message is informational only.'
    if (!config.discountValue) return 'Discount is enabled – add a value to finalize.'
    const base =
      config.discountType === 'percent'
        ? `${config.discountValue}% off`
        : config.discountType === 'amount'
          ? `$${config.discountValue} off`
          : `${config.discountValue} bonus points`
    const item = config.discountItem ? ` on ${config.discountItem}` : ''
    return `${base}${item}.`
  }, [config])

  const handleSave = () => {
    setSaving(true)
    try {
      // For now, just log config + channel and show toast.
      // Backend integration can later persist automation rules.
      // eslint-disable-next-line no-console
      console.log('Automation campaign config:', { templateKey, channel, config })
      showToast('Automation saved (front‑end only for now).', 'success')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const overlayStyle = modalOverlayStyle(isDarkMode, 1002)
  const contentOverrides = {
    maxWidth: '860px',
    width: '96%',
    padding: '20px'
  }

  return (
    <div style={overlayStyle} onClick={() => !saving && onClose()}>
      <div
        style={modalContentStyle(isDarkMode, contentOverrides)}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontFamily: '"Product Sans", sans-serif' }}>
              {template?.name || 'Edit automation'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
              Configure when this automation sends and what customers see.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{ color: '#6b7280' }}>Preview as</span>
            <div style={{ display: 'inline-flex', padding: '2px', borderRadius: '999px', backgroundColor: isDarkMode ? '#020617' : '#e5e7eb' }}>
              <button
                type="button"
                onClick={() => setChannel('email')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: channel === 'email' ? (isDarkMode ? '#0f172a' : '#ffffff') : 'transparent',
                  color: channel === 'email' ? (isDarkMode ? '#e5e7eb' : '#111827') : '#6b7280'
                }}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setChannel('sms')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: channel === 'sms' ? (isDarkMode ? '#0f172a' : '#ffffff') : 'transparent',
                  color: channel === 'sms' ? (isDarkMode ? '#e5e7eb' : '#111827') : '#6b7280'
                }}
              >
                SMS
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.1fr)', gap: '20px', alignItems: 'flex-start' }}>
          {/* Left: automation config */}
          <div>
            <FormField>
              <FormLabel isDarkMode={isDarkMode}>Automation name</FormLabel>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))}
                style={inputBaseStyle(isDarkMode, themeColorRgb)}
                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
              />
            </FormField>

            <FormField>
              <FormLabel isDarkMode={isDarkMode}>Trigger</FormLabel>
              <select
                value={config.triggerType}
                onChange={(e) => setConfig((c) => ({ ...c, triggerType: e.target.value }))}
                style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), paddingRight: '28px' }}
              >
                <option value="after_order">After every order</option>
                <option value="no_orders_for_days">No orders for X days</option>
                <option value="holiday">On a holiday</option>
                <option value="unused_points">Has unused points</option>
              </select>
            </FormField>

            {config.triggerType === 'no_orders_for_days' && (
              <FormField>
                <FormLabel isDarkMode={isDarkMode}>Days since last order</FormLabel>
                <input
                  type="number"
                  value={config.lastOrderDays}
                  onChange={(e) => setConfig((c) => ({ ...c, lastOrderDays: e.target.value ? Number(e.target.value) : '' }))}
                  style={inputBaseStyle(isDarkMode, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                />
              </FormField>
            )}

            {config.triggerType === 'holiday' && (
              <FormField>
                <FormLabel isDarkMode={isDarkMode}>Holiday name</FormLabel>
                <input
                  type="text"
                  value={config.holidayName}
                  onChange={(e) => setConfig((c) => ({ ...c, holidayName: e.target.value }))}
                  placeholder="e.g. New Year’s Day, Thanksgiving"
                  style={inputBaseStyle(isDarkMode, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                />
              </FormField>
            )}

            {config.triggerType === 'unused_points' && (
              <FormField>
                <FormLabel isDarkMode={isDarkMode}>Minimum points</FormLabel>
                <input
                  type="number"
                  value={config.minPoints}
                  onChange={(e) => setConfig((c) => ({ ...c, minPoints: e.target.value ? Number(e.target.value) : 0 }))}
                  style={inputBaseStyle(isDarkMode, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                />
              </FormField>
            )}

            <p style={{ margin: '4px 0 12px', fontSize: '12px', color: '#6b7280' }}>{triggerSummary}</p>

            <FormField>
              <FormLabel isDarkMode={isDarkMode}>Discount / incentive</FormLabel>
              <select
                value={config.discountType}
                onChange={(e) => setConfig((c) => ({ ...c, discountType: e.target.value }))}
                style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), paddingRight: '28px' }}
              >
                <option value="percent">Percentage off</option>
                <option value="amount">Amount off</option>
                <option value="points">Bonus points</option>
                <option value="none">No discount (message only)</option>
              </select>
            </FormField>

            {config.discountType !== 'none' && (
              <>
                <FormField style={{ marginBottom: '16px' }}>
                  <FormLabel isDarkMode={isDarkMode}>
                    {config.discountType === 'points' ? 'Points amount' : 'Discount value'}
                  </FormLabel>
                  <input
                    type="number"
                    value={config.discountValue}
                    onChange={(e) => setConfig((c) => ({ ...c, discountValue: e.target.value }))}
                    style={inputBaseStyle(isDarkMode, themeColorRgb)}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <FormField style={{ marginBottom: '16px' }}>
                  <FormLabel isDarkMode={isDarkMode}>Specific item or category (optional)</FormLabel>
                  <input
                    type="text"
                    value={config.discountItem}
                    onChange={(e) => setConfig((c) => ({ ...c, discountItem: e.target.value }))}
                    placeholder="e.g. Any dessert, House coffee, Category name"
                    style={inputBaseStyle(isDarkMode, themeColorRgb)}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <FormField style={{ marginBottom: '10px' }}>
                  <FormLabel isDarkMode={isDarkMode}>Internal note (optional)</FormLabel>
                  <input
                    type="text"
                    value={config.discountNote}
                    onChange={(e) => setConfig((c) => ({ ...c, discountNote: e.target.value }))}
                    placeholder="How this ties into your promotion"
                    style={inputBaseStyle(isDarkMode, themeColorRgb)}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#6b7280' }}>{discountSummary}</p>
              </>
            )}

            <FormField>
              <FormLabel isDarkMode={isDarkMode}>Subject (for email)</FormLabel>
              <input
                type="text"
                value={config.subject}
                onChange={(e) => setConfig((c) => ({ ...c, subject: e.target.value }))}
                placeholder="What appears in the email subject line"
                style={inputBaseStyle(isDarkMode, themeColorRgb)}
                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
              />
            </FormField>

            <FormField>
              <FormLabel isDarkMode={isDarkMode}>Message headline</FormLabel>
              <input
                type="text"
                value={config.emailHeadline}
                onChange={(e) => setConfig((c) => ({ ...c, emailHeadline: e.target.value }))}
                style={inputBaseStyle(isDarkMode, themeColorRgb)}
                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
              />
            </FormField>

            <FormField>
              <FormLabel isDarkMode={isDarkMode}>Message body</FormLabel>
              <textarea
                rows={4}
                value={config.emailBody}
                onChange={(e) => setConfig((c) => ({ ...c, emailBody: e.target.value }))}
                style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), resize: 'vertical' }}
                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
              />
            </FormField>

            <FormField>
              <FormLabel isDarkMode={isDarkMode}>Button text (for email)</FormLabel>
              <input
                type="text"
                value={config.ctaText}
                onChange={(e) => setConfig((c) => ({ ...c, ctaText: e.target.value }))}
                style={inputBaseStyle(isDarkMode, themeColorRgb)}
                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
              />
            </FormField>

            <FormField>
              <FormLabel isDarkMode={isDarkMode}>SMS text</FormLabel>
              <textarea
                rows={3}
                value={config.smsText}
                onChange={(e) => setConfig((c) => ({ ...c, smsText: e.target.value }))}
                style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), resize: 'vertical' }}
                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
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
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '6px 16px',
                  borderRadius: '999px',
                  border: `1px solid rgba(${themeColorRgb}, 0.7)`,
                  backgroundColor: `rgba(${themeColorRgb}, 0.9)`,
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: `0 4px 14px rgba(${themeColorRgb}, 0.35)`
                }}
              >
                {saving ? 'Saving…' : 'Save automation'}
              </button>
            </div>
          </div>

          {/* Right: live preview */}
          <div
            aria-label="Message preview"
            style={{
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              background: isDarkMode ? 'linear-gradient(145deg, #020617, #0f172a)' : 'linear-gradient(145deg, #f9fafb, #e5e7eb)',
              padding: '16px',
              boxShadow: isDarkMode ? '0 10px 40px rgba(15,23,42,0.9)' : '0 10px 40px rgba(148,163,184,0.5)',
              fontSize: '13px'
            }}
          >
            {channel === 'email' ? (
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
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>to customer</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#111827' }}>{config.subject || 'Subject preview'}</div>
                </div>

                <div style={{ padding: '18px' }}>
                  {config.discountType !== 'none' && (
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
                      {discountSummary}
                    </div>
                  )}

                  <h2 style={{ margin: '0 0 8px', fontSize: '18px', lineHeight: 1.3, color: '#111827' }}>
                    {config.emailHeadline || 'Email headline goes here'}
                  </h2>
                  <p style={{ margin: '0 0 12px', color: '#4b5563', fontSize: '13px', lineHeight: 1.5 }}>
                    {config.emailBody || 'Write a short, friendly message explaining why the customer is receiving this and what to do next.'}
                  </p>

                  {config.discountType !== 'none' && (
                    <div style={{ margin: '10px 0 6px', fontSize: '12px', color: '#4b5563' }}>
                      Show this email in‑store or tap the button below to redeem the offer.
                    </div>
                  )}

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
                      {config.ctaText || 'View offer'}
                    </button>
                  </div>

                  <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                    This message is sent automatically based on your store’s automation rules.
                  </p>
                </div>

                <div style={{ padding: '10px 18px 14px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '11px', color: '#9ca3af' }}>
                  You are receiving this because you are a customer of this store.
                </div>
              </div>
            ) : (
              <div
                style={{
                  maxWidth: '320px',
                  margin: '0 auto',
                  borderRadius: '24px',
                  padding: '14px 12px',
                  backgroundColor: isDarkMode ? '#020617' : '#0f172a',
                  color: '#e5e7eb',
                  boxShadow: '0 18px 40px rgba(15,23,42,0.85)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '11px', opacity: 0.9 }}>
                  <span>Customer</span>
                  <span>Now</span>
                </div>
                <div
                  style={{
                    backgroundColor: '#111827',
                    borderRadius: '18px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    lineHeight: 1.45,
                    border: '1px solid rgba(148,163,184,0.6)'
                  }}
                >
                  {config.smsText || 'Your SMS message preview will appear here.'}
                </div>
                {config.discountType !== 'none' && (
                  <div style={{ marginTop: '10px', fontSize: '11px', color: '#9ca3af' }}>
                    Includes: {discountSummary}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

