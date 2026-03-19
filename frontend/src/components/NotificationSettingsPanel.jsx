/**
 * NotificationSettingsPanel – simple, manager-friendly UI for configuring
 * Email, SMS, and In-app notifications. Used in Settings > Notifications tab.
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquare, Bell, ChevronDown, ChevronRight, User, CheckCircle2, Send, Save, ShieldCheck, Factory, Banknote, Calendar, Clock, ArrowRight, ArrowLeft } from 'lucide-react'
import { FormLabel, inputBaseStyle, compactPrimaryButtonStyle, compactCancelButtonStyle } from './FormStyles'
import { playNewOrderSound, NOTIFICATION_SOUND_OPTIONS } from '../utils/notificationSound'
import { cachedFetch } from '../services/offlineSync'

const CATEGORIES = [
  { id: 'orders', label: 'Orders', desc: 'New orders from DoorDash, Shopify, UberEats and in-house.', icon: <Factory size={18} /> },
  { id: 'clockins', label: 'Clock-In / Clock-Out Notifications', desc: 'Receive alerts when employees clock in or out.', icon: <Clock size={18} /> },
  { id: 'register', label: 'Register Activity', desc: 'Get notified when cash is moved or registers are opened/closed.', icon: <Banknote size={18} /> },
  { id: 'scheduling', label: 'Scheduling', desc: 'Get notified for schedule updates.', icon: <Calendar size={18} /> }
]

/* Toggle uses checkbox-wrapper-2 (same as POS Settings) – styles in index.css */
const Toggle = ({ checked, onChange, isDarkMode, disabled }) => (
  <div className="checkbox-wrapper-2" style={{ flexShrink: 0, marginTop: '2px', opacity: disabled ? 0.5 : 1 }}>
    <input
      type="checkbox"
      className="sc-gJwTLC ikxBAC"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  </div>
)

const CHEVRON_SPACER_WIDTH = 26
const SettingsRow = ({ label, description, children, isDarkMode, last, hasChevron, onClick }) => (
  <div
    onClick={onClick}
    style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: '12px 0',
    borderBottom: last ? 'none' : (isDarkMode ? '1px solid #333' : '1px solid #f1f5f9'),
    gap: '12px',
    ...(onClick && { cursor: 'pointer' })
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: 500, color: isDarkMode ? '#fff' : '#1a1a1a' }}>{label}</div>
      {description && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{description}</div>}
    </div>
    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 86 }}>
      {children}
      {!hasChevron && <span style={{ width: CHEVRON_SPACER_WIDTH + 8, flexShrink: 0 }} />}
    </div>
  </div>
)

const SOURCES = [
  { id: 'all', label: 'All Sources' },
  { id: 'doordash', label: 'DoorDash' },
  { id: 'shopify', label: 'Shopify' },
  { id: 'ubereats', label: 'Uber Eats' },
  { id: 'pos', label: 'In-Store POS' }
]

const ORDER_TYPES = [
  { id: 'in_house', label: 'In-house' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'pickup', label: 'Pickup' },
  { id: 'doordash', label: 'DoorDash' },
  { id: 'ubereats', label: 'Uber Eats' },
  { id: 'shopify', label: 'Shopify' }
]

const allOrderTypeIds = ['pos', 'delivery', 'pickup', 'doordash', 'ubereats', 'shopify']

/** Order types in rows of 3. checkedIds: ['all'] or array of mapped ids (pos, delivery, etc). onToggle(typeId) receives ORDER_TYPES id. */
function OrderTypesRow({ checkedIds, onToggle, isDarkMode }) {
  const current = Array.isArray(checkedIds) ? checkedIds : ['all']
  const isAll = current.includes('all') || !current.length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[0, 1].map((rowIdx) => (
        <div key={rowIdx} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {ORDER_TYPES.slice(rowIdx * 3, rowIdx * 3 + 3).map((t) => {
            const mapped = t.id === 'in_house' ? 'pos' : t.id
            const checked = isAll || current.includes(mapped)
            return (
              <label
                key={t.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 8,
                  border: checked ? `1px solid ${isDarkMode ? '#64748b' : '#94a3b8'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                  background: checked ? (isDarkMode ? 'rgba(100,116,139,0.2)' : 'rgba(148,163,184,0.15)') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'),
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(t.id)}
                  style={{ width: 12, height: 12 }}
                />
                <span>{t.label}</span>
              </label>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function NotificationSettingsPanel({
  isDarkMode,
  themeColorRgb,
  showToast,
  channelSettings,
  setChannelSettings,
  onSaveChannel,
  channelSaving,
  showTestEmailInput,
  setShowTestEmailInput,
  testEmailInput,
  setTestEmailInput,
  testEmailSending,
  setTestEmailSending,
  notificationSettings,
  persistNotificationSettings,
  newOrderToastOptions,
  persistNewOrderToastOptions,
  clockinNotifSettings,
  setClockinNotifSettings,
  registerNotifSettings,
  setRegisterNotifSettings,
  scheduleNotifSettings,
  setScheduleNotifSettings,
  clockinNotifSaving,
  registerNotifSaving,
  scheduleNotifSaving,
  onSaveClockin,
  onSaveRegister,
  onSaveSchedule
}) {
  const [emailSetupOpen, setEmailSetupOpen] = useState(false)
  const [smsSetupOpen, setSmsSetupOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [expandedDropdowns, setExpandedDropdowns] = useState({ clockin: true, clockout: true, late_alert: true, overtime: true, orders_app: true, orders_email: true, orders_sms: true, register_open: true, register_close: true, register_drop: true, schedule_notify: true, gmail_config: true })
  const toggleDropdown = (key) => setExpandedDropdowns(prev => ({ ...prev, [key]: !prev[key] }))
  
  const [employeesWithEmail, setEmployeesWithEmail] = useState([])
  const [employeesWithPhone, setEmployeesWithPhone] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  const [showTestSmsInput, setShowTestSmsInput] = useState(false)
  const [testSmsInput, setTestSmsInput] = useState('')
  const [testSmsSending, setTestSmsSending] = useState(false)
  const [soundDropdownOpen, setSoundDropdownOpen] = useState(false)
  const [soundDropdownRect, setSoundDropdownRect] = useState(null)
  const soundDropdownRef = useRef(null)
  const soundDropdownTriggerRef = useRef(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (soundDropdownRef.current && !soundDropdownRef.current.contains(e.target) && soundDropdownTriggerRef.current && !soundDropdownTriggerRef.current.contains(e.target)) {
        setSoundDropdownOpen(false)
      }
    }
    if (soundDropdownOpen) {
      const rect = soundDropdownTriggerRef.current?.getBoundingClientRect()
      if (rect) setSoundDropdownRect(rect)
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    } else {
      setSoundDropdownRect(null)
    }
  }, [soundDropdownOpen])

  const fetchEmployees = async () => {
    setLoadingEmployees(true)
    const token = localStorage.getItem('sessionToken')
    try {
      const [emailRes, phoneRes] = await Promise.all([
        cachedFetch('/api/employees/with-email', { headers: { 'X-Session-Token': token || '' } }),
        cachedFetch('/api/employees/with-phone', { headers: { 'X-Session-Token': token || '' } })
      ])
      const emailData = await emailRes.json()
      const phoneData = await phoneRes.json()
      if (Array.isArray(emailData)) setEmployeesWithEmail(emailData)
      if (Array.isArray(phoneData)) setEmployeesWithPhone(phoneData)
    } catch (e) {
      console.error('Error fetching employees:', e)
    } finally {
      setLoadingEmployees(false)
    }
  }

  const prefs = channelSettings?.notification_preferences || {}

  const handleTestEmail = async () => {
    const email = testEmailInput.trim()
    if (!email) return
    if (channelSettings.email_provider === 'gmail' && (!channelSettings.smtp_user || !channelSettings.smtp_password || channelSettings.smtp_password === '***')) {
      showToast('Enter Gmail address and App Password first', 'error')
      return
    }
    setTestEmailSending(true)
    try {
      const token = localStorage.getItem('sessionToken')
      const res = await cachedFetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': token || '' },
        body: JSON.stringify({
          to_address: email,
          store_id: 1,
          session_token: token,
          email_provider: channelSettings.email_provider,
          smtp_server: channelSettings.smtp_server,
          smtp_port: channelSettings.smtp_port || 587,
          smtp_user: channelSettings.smtp_user,
          smtp_password: channelSettings.smtp_password && channelSettings.smtp_password !== '***' ? channelSettings.smtp_password : undefined,
          business_name: channelSettings.business_name || 'POS'
        })
      })
      const data = await res.json()
      showToast(data.success ? 'Test email sent!' : (data.message || 'Failed to send'), data.success ? 'success' : 'error')
      if (data.success) { setShowTestEmailInput(false); setTestEmailInput('') }
    } catch (e) {
      showToast(e?.message || 'Error sending test email', 'error')
    } finally {
      setTestEmailSending(false)
    }
  }

  const handleTestSms = async () => {
    const phone = testSmsInput.trim()
    if (!phone) return
    setTestSmsSending(true)
    try {
      const token = localStorage.getItem('sessionToken')
      const res = await cachedFetch('/api/notifications/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': token || '' },
        body: JSON.stringify({ 
            phone_number: phone, 
            store_id: 1, 
            session_token: token 
        })
      })
      const data = await res.json()
      showToast(data.success ? 'Test SMS sent!' : (data.message || 'Failed to send'), data.success ? 'success' : 'error')
      if (data.success) { setShowTestSmsInput(false); setTestSmsInput('') }
    } catch (e) {
      showToast(e?.message || 'Error sending test SMS', 'error')
    } finally {
      setTestSmsSending(false)
    }
  }

  const cardStyle = {
    padding: '24px',
    borderRadius: '16px',
    border: isDarkMode ? '1px solid var(--border-light)' : '1px solid #f0f0f0',
    backgroundColor: isDarkMode ? 'var(--bg-secondary)' : '#ffffff',
    marginBottom: '24px',
    boxShadow: isDarkMode ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.2s ease'
  }

  const sectionTitle = (icon, title, color) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
      <div style={{ 
        width: '36px', 
        height: '36px', 
        borderRadius: '10px', 
        backgroundColor: color + '15', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: color
      }}>
        {icon}
      </div>
      <span style={{ fontSize: '18px', fontWeight: 700, color: isDarkMode ? 'var(--text-primary)' : '#1a1a1a' }}>{title}</span>
    </div>
  )

  const toggle = (category, channel) => {
    const next = { ...channelSettings, notification_preferences: { ...prefs } }
    const cat = next.notification_preferences[category] || {}
    next.notification_preferences[category] = { ...cat, [channel]: !cat[channel] }
    setChannelSettings(next)
  }

  const updatePreference = (category, key, value) => {
    if (category === 'clockins' && setClockinNotifSettings) {
      setClockinNotifSettings(prev => ({ ...prev, [key]: value }))
      return
    }
    if (category === 'register' && setRegisterNotifSettings) {
      setRegisterNotifSettings(prev => ({ ...prev, [key]: value }))
      return
    }
    if (category === 'scheduling' && setScheduleNotifSettings) {
      setScheduleNotifSettings(prev => ({ ...prev, [key]: value }))
      return
    }
    const next = { ...channelSettings, notification_preferences: { ...prefs } }
    const cat = next.notification_preferences[category] || {}
    next.notification_preferences[category] = { ...cat, [key]: value }
    setChannelSettings(next)
  }

  const toggleClockinRecipient = (subKey, channel, employeeId) => {
    if (!setClockinNotifSettings) return
    const key = channel === 'email' ? `${subKey}_admin_email_ids` : `${subKey}_admin_sms_ids`
    const current = Array.isArray(clockinNotifSettings[key]) ? clockinNotifSettings[key] : []
    const nextIds = current.includes(employeeId) ? current.filter(id => id !== employeeId) : [...current, employeeId]
    setClockinNotifSettings(prev => ({ ...prev, [key]: nextIds }))
  }

  const toggleRecipient = (category, channel, employeeId) => {
    if ((category === 'clockins' || category === 'register' || category === 'scheduling') && channel === 'email') {
      const setter = category === 'clockins' ? setClockinNotifSettings : 
                     category === 'register' ? setRegisterNotifSettings : 
                     setScheduleNotifSettings
      const settings = category === 'clockins' ? clockinNotifSettings : 
                       category === 'register' ? registerNotifSettings : 
                       scheduleNotifSettings
      
      const current = Array.isArray(settings.admin_email_ids) ? settings.admin_email_ids : []
      const nextIds = current.includes(employeeId) ? current.filter(id => id !== employeeId) : [...current, employeeId]
      setter(prev => ({ ...prev, admin_email_ids: nextIds }))
      return
    }
    if (category === 'register' && channel === 'sms' && setRegisterNotifSettings) {
      const current = Array.isArray(registerNotifSettings.admin_sms_ids) ? registerNotifSettings.admin_sms_ids : []
      const nextIds = current.includes(employeeId) ? current.filter(id => id !== employeeId) : [...current, employeeId]
      setRegisterNotifSettings(prev => ({ ...prev, admin_sms_ids: nextIds }))
      return
    }

    const next = { ...channelSettings, notification_preferences: { ...prefs } }
    const cat = next.notification_preferences[category] || {}
    const key = channel === 'email' ? 'recipient_employee_ids' : 'recipient_employee_ids_sms'
    const current = Array.isArray(cat[key]) ? cat[key] : []
    
    let updated
    if (current.includes(employeeId)) {
      updated = current.filter(id => id !== employeeId)
    } else {
      updated = [...current, employeeId]
    }
    
    next.notification_preferences[category] = { ...cat, [key]: updated }
    setChannelSettings(next)
  }

  const toggleSource = (category, sourceId) => {
    const next = { ...channelSettings, notification_preferences: { ...prefs } }
    const cat = next.notification_preferences[category] || {}
    const current = Array.isArray(cat.source_filter) ? cat.source_filter : ['all']
    
    let updated
    if (sourceId === 'all') {
      updated = ['all']
    } else {
      const filtered = current.filter(id => id !== 'all')
      if (filtered.includes(sourceId)) {
        updated = filtered.filter(id => id !== sourceId)
        if (updated.length === 0) updated = ['all']
      } else {
        updated = [...filtered, sourceId]
      }
    }
    
    next.notification_preferences[category] = { ...cat, source_filter: updated }
    setChannelSettings(next)
  }

  const toggleOrderTypeEmail = (typeId) => {
    const next = { ...channelSettings, notification_preferences: { ...prefs } }
    const cat = next.notification_preferences.orders || {}
    const current = Array.isArray(cat.source_filter) ? cat.source_filter : ['all']
    const mapped = typeId === 'in_house' ? 'pos' : typeId
    const isAll = current.includes('all') || current.length === 0
    let updated
    if (isAll) {
      updated = allOrderTypeIds.filter(id => id !== mapped)
      if (updated.length === 0) updated = ['all']
    } else if (current.includes(mapped)) {
      updated = current.filter(id => id !== mapped)
      if (updated.length === 0) updated = ['all']
    } else {
      updated = [...current, mapped]
      if (updated.length >= allOrderTypeIds.length) updated = ['all']
    }
    next.notification_preferences.orders = { ...cat, source_filter: updated }
    setChannelSettings(next)
  }

  const toggleOrderTypeSms = (typeId) => {
    const next = { ...channelSettings, notification_preferences: { ...prefs } }
    const cat = next.notification_preferences.orders || {}
    const current = Array.isArray(cat.source_filter_sms) ? cat.source_filter_sms : (Array.isArray(cat.source_filter) ? cat.source_filter : ['all'])
    const mapped = typeId === 'in_house' ? 'pos' : typeId
    const isAll = current.includes('all') || current.length === 0
    let updated
    if (isAll) {
      updated = allOrderTypeIds.filter(id => id !== mapped)
      if (updated.length === 0) updated = ['all']
    } else if (current.includes(mapped)) {
      updated = current.filter(id => id !== mapped)
      if (updated.length === 0) updated = ['all']
    } else {
      updated = [...current, mapped]
      if (updated.length >= allOrderTypeIds.length) updated = ['all']
    }
    next.notification_preferences.orders = { ...cat, source_filter_sms: updated }
    setChannelSettings(next)
  }

  const toggleOrderTypeApp = (typeId) => {
    const opts = newOrderToastOptions || {}
    const current = Array.isArray(opts.order_type_filter) ? opts.order_type_filter : ['all']
    const mapped = typeId === 'in_house' ? 'pos' : typeId
    const isAll = current.includes('all') || current.length === 0
    let updated
    if (isAll) {
      updated = allOrderTypeIds.filter(id => id !== mapped)
      if (updated.length === 0) updated = ['all']
    } else if (current.includes(mapped)) {
      updated = current.filter(id => id !== mapped)
      if (updated.length === 0) updated = ['all']
    } else {
      updated = [...current, mapped]
      if (updated.length >= allOrderTypeIds.length) updated = ['all']
    }
    persistNewOrderToastOptions({ ...opts, order_type_filter: updated })
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', paddingBottom: '40px', ...(themeColorRgb && { ['--theme-color']: `rgb(${themeColorRgb})` }) }}>

      {/* Configuration */}
      <div style={{ 
        marginBottom: '12px', 
        borderRadius: '16px', 
        border: isDarkMode ? '1px solid #333' : '1px solid #e2e8f0',
        backgroundColor: '#fff',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}>
        <div 
          onClick={() => setExpandedCategory(expandedCategory === 'setup' ? null : 'setup')}
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? 'var(--text-primary)' : '#1e293b' }}>Configuration</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Configure email, SMS, and optional channels (Telegram, Slack, Discord, WhatsApp).</div>
          </div>
          {expandedCategory === 'setup' ? <ChevronDown size={20} color="#94a3b8" /> : <ChevronRight size={20} color="#94a3b8" />}
        </div>

        {expandedCategory === 'setup' && (
          <div style={{ padding: '0 20px 20px 20px', borderTop: (channelSettings.email_provider === 'gmail' && expandedDropdowns.gmail_config) ? 'none' : (isDarkMode ? '1px solid #333' : '1px solid #f1f5f9') }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
              
              <SettingsRow label="Use Custom Gmail SMTP" description="Better for store-specific branding" isDarkMode={isDarkMode} hasChevron last={!(channelSettings.email_provider === 'gmail' && expandedDropdowns.gmail_config)}>
                <>
                  <Toggle checked={channelSettings.email_provider === 'gmail'} onChange={(e) => setChannelSettings({ ...channelSettings, email_provider: e.target.checked ? 'gmail' : 'aws_ses', use_platform_aws: !e.target.checked })} isDarkMode={isDarkMode} />
                  {channelSettings.email_provider === 'gmail' && (
                    <button type="button" onClick={() => toggleDropdown('gmail_config')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} aria-label={expandedDropdowns.gmail_config ? 'Collapse' : 'Expand'}>
                      <ChevronDown size={18} style={{ transform: expandedDropdowns.gmail_config ? 'rotate(180deg)' : 'none', color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                    </button>
                  )}
                </>
              </SettingsRow>

              {channelSettings.email_provider === 'gmail' && expandedDropdowns.gmail_config && (
                <div style={{ padding: '16px 4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Gmail Address</div>
                    <input type="email" placeholder="e.g. store@gmail.com" value={channelSettings.smtp_user || ''} onChange={(e) => setChannelSettings({...channelSettings, smtp_user: e.target.value})} style={inputBaseStyle(isDarkMode, themeColorRgb)} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>App Password</div>
                    <input type="password" placeholder="•••• •••• •••• ••••" value={channelSettings.smtp_pass || ''} onChange={(e) => setChannelSettings({...channelSettings, smtp_pass: e.target.value})} style={inputBaseStyle(isDarkMode, themeColorRgb)} />
                  </div>
                </div>
              )}

              <div style={{ borderTop: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
                <SettingsRow label="High-Speed SMS" description="Platform-managed reliability" isDarkMode={isDarkMode}>
                <Toggle checked={channelSettings.sms_provider === 'aws_sns'} onChange={(e) => setChannelSettings({ ...channelSettings, sms_provider: e.target.checked ? 'aws_sns' : 'email', use_platform_aws: true })} isDarkMode={isDarkMode} />
              </SettingsRow>

              <SettingsRow label="Telegram" description="Optional messaging channel" isDarkMode={isDarkMode}>
                <Toggle checked={false} onChange={() => {}} isDarkMode={isDarkMode} disabled />
              </SettingsRow>
              <SettingsRow label="Slack" description="Optional team notifications" isDarkMode={isDarkMode}>
                <Toggle checked={false} onChange={() => {}} isDarkMode={isDarkMode} disabled />
              </SettingsRow>
              <SettingsRow label="Discord" description="Optional community alerts" isDarkMode={isDarkMode}>
                <Toggle checked={false} onChange={() => {}} isDarkMode={isDarkMode} disabled />
              </SettingsRow>
              <SettingsRow label="WhatsApp" description="Optional business messaging" isDarkMode={isDarkMode}>
                <Toggle checked={false} onChange={() => {}} isDarkMode={isDarkMode} disabled />
              </SettingsRow>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  className="button-50"
                  role="button"
                  disabled={channelSaving}
                  onClick={onSaveChannel}
                >
                  <span className="button-50__Content">{channelSaving ? 'Saving…' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '24px' }}>
        {CATEGORIES.map((cat) => {
          const isExpanded = expandedCategory === cat.id
          
          let catPrefs = prefs[cat.id] || {}
          let isEmailOn = !!catPrefs.email
          let isSmsOn = !!catPrefs.sms
          let canSave = !channelSaving
          let saveHandler = onSaveChannel

          // Bridge to specific states if provided
          if (cat.id === 'clockins' && clockinNotifSettings) {
              catPrefs = clockinNotifSettings
              isEmailOn = !!(catPrefs.clockin_email_enabled || catPrefs.clockout_email_enabled || catPrefs.late_alert_email_enabled || catPrefs.overtime_email_enabled || catPrefs.notify_admin_on_clockin || catPrefs.notify_admin_on_clockout)
              isSmsOn = !!(catPrefs.clockin_sms_enabled || catPrefs.clockout_sms_enabled || catPrefs.late_alert_sms_enabled || catPrefs.overtime_sms_enabled)
              canSave = !clockinNotifSaving
              saveHandler = onSaveClockin
          } else if (cat.id === 'register' && registerNotifSettings) {
              catPrefs = registerNotifSettings
              const anyEvent = !!(catPrefs.notify_admin_on_open || catPrefs.notify_admin_on_close || catPrefs.notify_admin_on_drop)
              isEmailOn = anyEvent && !!catPrefs.register_email_enabled
              isSmsOn = anyEvent && !!catPrefs.register_sms_enabled
              canSave = !registerNotifSaving
              saveHandler = onSaveRegister
          } else if (cat.id === 'scheduling' && scheduleNotifSettings) {
              catPrefs = scheduleNotifSettings
              isEmailOn = !!(catPrefs.notify_on_edit && catPrefs.schedule_notify_email_enabled)
              isSmsOn = !!(catPrefs.notify_on_edit && catPrefs.schedule_notify_sms_enabled)
              canSave = !scheduleNotifSaving
              saveHandler = onSaveSchedule
          }
          
          return (
            <div key={cat.id} style={{ 
              marginBottom: '12px', 
              borderRadius: '16px', 
              border: isDarkMode ? '1px solid #333' : '1px solid #e2e8f0',
              backgroundColor: (cat.id === 'orders' || cat.id === 'clockins' || cat.id === 'register' || cat.id === 'scheduling') ? '#fff' : (isDarkMode ? (isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent') : (isExpanded ? '#f8fafc' : '#fff')),
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}>
              <div 
                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                style={{ 
                  padding: '16px 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                {(cat.id !== 'orders' && cat.id !== 'clockins' && cat.id !== 'register' && cat.id !== 'scheduling') && (
                <div style={{ 
                    color: (catPrefs.email || catPrefs.sms) ? (isDarkMode ? 'var(--theme-color)' : `rgb(${themeColorRgb})`) : '#94a3b8',
                    transition: 'color 0.2s ease'
                }}>
                    {cat.icon}
                </div>
                )}
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary)' : '#1e293b' }}>{cat.label}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{cat.desc}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {(cat.id === 'orders' || cat.id === 'clockins' || cat.id === 'register' || cat.id === 'scheduling') ? (
                      <>
                        {isEmailOn && <span style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>Email</span>}
                        {isSmsOn && <span style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>SMS</span>}
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '13px', color: isEmailOn ? '#34C759' : '#94a3b8', fontWeight: isEmailOn ? 600 : 400 }}>
                          {isEmailOn ? 'On' : 'Off'}
                        </span>
                        <>
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                          <span style={{ fontSize: '13px', color: isSmsOn ? '#34C759' : '#94a3b8', fontWeight: isSmsOn ? 600 : 400 }}>
                            SMS {isSmsOn ? 'On' : 'Off'}
                          </span>
                        </>
                      </>
                    )}
                </div>
                {isExpanded ? <ChevronDown size={20} color="#94a3b8" /> : <ChevronRight size={20} color="#94a3b8" />}
              </div>

              {isExpanded && (
                <div style={{ padding: (cat.id === 'orders' || cat.id === 'clockins' || cat.id === 'register' || cat.id === 'scheduling') ? '0 20px 8px 20px' : '0 20px 20px 20px', borderTop: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: (cat.id === 'orders' || cat.id === 'clockins' || cat.id === 'register' || cat.id === 'scheduling') ? '4px' : '12px' }}>
                        
                        {/* Main Channel Toggles (skip for orders – has custom layout) */}
                        {cat.id !== 'orders' && cat.id !== 'clockins' && cat.id !== 'register' && cat.id !== 'scheduling' && (
                          <SettingsRow label="Enable Email Notifications" isDarkMode={isDarkMode}>
                            <Toggle checked={!!isEmailOn} onChange={() => toggle(cat.id, 'email')} isDarkMode={isDarkMode} />
                          </SettingsRow>
                        )}
                        {cat.id !== 'orders' && cat.id !== 'register' && cat.id !== 'clockins' && cat.id !== 'scheduling' && (
                          <SettingsRow label="Enable SMS Notifications" isDarkMode={isDarkMode}>
                            <Toggle checked={!!isSmsOn} onChange={() => toggle(cat.id, 'sms')} isDarkMode={isDarkMode} />
                          </SettingsRow>
                        )}

                        {/* Category Specific Logic */}
                        {cat.id === 'clockins' && (
                          <>
                            {/* Alert on Clock-In */}
                            <SettingsRow label="Alert on Clock-In" isDarkMode={isDarkMode} hasChevron>
                              <>
                                <Toggle checked={!!(catPrefs.clockin_email_enabled || catPrefs.clockin_sms_enabled || catPrefs.notify_admin_on_clockin)} onChange={(e) => { const on = e.target.checked; if (setClockinNotifSettings) { setClockinNotifSettings(prev => ({ ...prev, notify_admin_on_clockin: on, ...(on && !prev.clockin_email_enabled && !prev.clockin_sms_enabled ? { clockin_email_enabled: true } : {}), ...(!on ? { clockin_email_enabled: false, clockin_sms_enabled: false } : {}) })); } }} isDarkMode={isDarkMode} />
                                {(catPrefs.clockin_email_enabled || catPrefs.clockin_sms_enabled || catPrefs.notify_admin_on_clockin) && (
                                  <button type="button" onClick={() => toggleDropdown('clockin')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} aria-label={expandedDropdowns.clockin ? 'Collapse' : 'Expand'}>
                                    <ChevronDown size={18} style={{ transform: expandedDropdowns.clockin ? 'rotate(180deg)' : 'none', color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                                  </button>
                                )}
                              </>
                            </SettingsRow>
                            {(catPrefs.clockin_email_enabled || catPrefs.clockin_sms_enabled || catPrefs.notify_admin_on_clockin) && expandedDropdowns.clockin && (
                              <div style={{ borderBottom: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '4px', marginTop: '-4px', paddingLeft: '4px' }}>
                                <SettingsRow label="Email" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!(catPrefs.clockin_email_enabled ?? true)} onChange={(e) => updatePreference('clockins', 'clockin_email_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <SettingsRow label="SMS" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.clockin_sms_enabled} onChange={(e) => updatePreference('clockins', 'clockin_sms_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <SettingsRow label="Notify employee" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.clockin_notify_employee} onChange={(e) => updatePreference('clockins', 'clockin_notify_employee', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <div style={{ marginTop: '8px' }}>
                                  <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>Recipients</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(employeesWithEmail.length > 0 ? employeesWithEmail : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.clockin_admin_email_ids || []).includes(id)
                                      return (
                                        <label key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#38bdf8' : '#0ea5e9'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(8,47,73,0.7)' : '#f0f9ff') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleClockinRecipient('clockin', 'email', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.email ? ` (${emp.email})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {(employeesWithPhone.length > 0 ? employeesWithPhone : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.clockin_admin_sms_ids || []).includes(id)
                                      return (
                                        <label key={`sms-${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#22c55e' : '#16a34a'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(5,46,22,0.7)' : '#ecfdf3') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleClockinRecipient('clockin', 'sms', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.phone ? ` (${emp.phone})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {employeesWithEmail.length === 0 && employeesWithPhone.length === 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>No employees with email or phone</span>}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Alert on Clock-Out */}
                            <SettingsRow label="Alert on Clock-Out" isDarkMode={isDarkMode} hasChevron>
                              <>
                                <Toggle checked={!!(catPrefs.clockout_email_enabled || catPrefs.clockout_sms_enabled || catPrefs.notify_admin_on_clockout)} onChange={(e) => { const on = e.target.checked; if (setClockinNotifSettings) { setClockinNotifSettings(prev => ({ ...prev, notify_admin_on_clockout: on, ...(on && !prev.clockout_email_enabled && !prev.clockout_sms_enabled ? { clockout_email_enabled: true } : {}), ...(!on ? { clockout_email_enabled: false, clockout_sms_enabled: false } : {}) })); } }} isDarkMode={isDarkMode} />
                                {(catPrefs.clockout_email_enabled || catPrefs.clockout_sms_enabled || catPrefs.notify_admin_on_clockout) && (
                                  <button type="button" onClick={() => toggleDropdown('clockout')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} aria-label={expandedDropdowns.clockout ? 'Collapse' : 'Expand'}>
                                    <ChevronDown size={18} style={{ transform: expandedDropdowns.clockout ? 'rotate(180deg)' : 'none', color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                                  </button>
                                )}
                              </>
                            </SettingsRow>
                            {(catPrefs.clockout_email_enabled || catPrefs.clockout_sms_enabled || catPrefs.notify_admin_on_clockout) && expandedDropdowns.clockout && (
                              <div style={{ borderBottom: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '4px', marginTop: '-4px', paddingLeft: '4px' }}>
                                <SettingsRow label="Email" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!(catPrefs.clockout_email_enabled ?? true)} onChange={(e) => updatePreference('clockins', 'clockout_email_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <SettingsRow label="SMS" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.clockout_sms_enabled} onChange={(e) => updatePreference('clockins', 'clockout_sms_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <SettingsRow label="Notify employee" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.clockout_notify_employee} onChange={(e) => updatePreference('clockins', 'clockout_notify_employee', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <div style={{ marginTop: '8px' }}>
                                  <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>Recipients</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(employeesWithEmail.length > 0 ? employeesWithEmail : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.clockout_admin_email_ids || []).includes(id)
                                      return (
                                        <label key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#38bdf8' : '#0ea5e9'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(8,47,73,0.7)' : '#f0f9ff') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleClockinRecipient('clockout', 'email', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.email ? ` (${emp.email})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {(employeesWithPhone.length > 0 ? employeesWithPhone : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.clockout_admin_sms_ids || []).includes(id)
                                      return (
                                        <label key={`sms-${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#22c55e' : '#16a34a'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(5,46,22,0.7)' : '#ecfdf3') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleClockinRecipient('clockout', 'sms', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.phone ? ` (${emp.phone})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {employeesWithEmail.length === 0 && employeesWithPhone.length === 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>No employees with email or phone</span>}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Late Alert */}
                            <SettingsRow label="Late Alert" isDarkMode={isDarkMode} description="Notify when employee is late" hasChevron last={!!(catPrefs.late_alert_enabled && expandedDropdowns.late_alert)}>
                              <>
                                <Toggle checked={!!catPrefs.late_alert_enabled} onChange={(e) => updatePreference('clockins', 'late_alert_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                {catPrefs.late_alert_enabled && (
                                  <button type="button" onClick={() => toggleDropdown('late_alert')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} aria-label={expandedDropdowns.late_alert ? 'Collapse' : 'Expand'}>
                                    <ChevronDown size={18} style={{ transform: expandedDropdowns.late_alert ? 'rotate(180deg)' : 'none', color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                                  </button>
                                )}
                              </>
                            </SettingsRow>
                            {catPrefs.late_alert_enabled && expandedDropdowns.late_alert && (
                              <div style={{ paddingBottom: '12px', marginBottom: '4px', marginTop: '-4px', paddingLeft: '4px' }}>
                                <div style={{ paddingBottom: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                                    <span>Notify after delay</span>
                                    <input type="range" className="notif-sound-slider" min="5" max="60" step="5" value={catPrefs.late_alert_delay_min || 15} onChange={(e) => updatePreference('clockins', 'late_alert_delay_min', parseInt(e.target.value, 10))} style={{ width: 140, flexShrink: 0 }} />
                                    <span style={{ minWidth: 28, textAlign: 'right' }}>{catPrefs.late_alert_delay_min || 15}m</span>
                                  </div>
                                </div>
                                <SettingsRow label="Notify employee" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.late_alert_to_employee} onChange={(e) => updatePreference('clockins', 'late_alert_to_employee', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <SettingsRow label="Email" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!(catPrefs.late_alert_email_enabled ?? true)} onChange={(e) => updatePreference('clockins', 'late_alert_email_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <SettingsRow label="SMS" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.late_alert_sms_enabled} onChange={(e) => updatePreference('clockins', 'late_alert_sms_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <div style={{ marginTop: '8px' }}>
                                  <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>Recipients</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(employeesWithEmail.length > 0 ? employeesWithEmail : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.late_alert_admin_email_ids || []).includes(id)
                                      return (
                                        <label key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#38bdf8' : '#0ea5e9'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(8,47,73,0.7)' : '#f0f9ff') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleClockinRecipient('late_alert', 'email', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.email ? ` (${emp.email})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {(employeesWithPhone.length > 0 ? employeesWithPhone : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.late_alert_admin_sms_ids || []).includes(id)
                                      return (
                                        <label key={`sms-${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#22c55e' : '#16a34a'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(5,46,22,0.7)' : '#ecfdf3') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleClockinRecipient('late_alert', 'sms', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.phone ? ` (${emp.phone})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {employeesWithEmail.length === 0 && employeesWithPhone.length === 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>No employees with email or phone</span>}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Overtime Flag */}
                            <SettingsRow label="Overtime Flag" isDarkMode={isDarkMode} description="Flag shifts exceeding goal" hasChevron last={!!(catPrefs.overtime_alert_enabled && expandedDropdowns.overtime)}>
                              <>
                                <Toggle checked={!!catPrefs.overtime_alert_enabled} onChange={(e) => updatePreference('clockins', 'overtime_alert_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                {catPrefs.overtime_alert_enabled && (
                                  <button type="button" onClick={() => toggleDropdown('overtime')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} aria-label={expandedDropdowns.overtime ? 'Collapse' : 'Expand'}>
                                    <ChevronDown size={18} style={{ transform: expandedDropdowns.overtime ? 'rotate(180deg)' : 'none', color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                                  </button>
                                )}
                              </>
                            </SettingsRow>
                            {catPrefs.overtime_alert_enabled && expandedDropdowns.overtime && (
                              <div style={{ paddingBottom: '12px', marginBottom: '4px', marginTop: '-4px', paddingLeft: '4px' }}>
                                <div style={{ paddingBottom: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                                    <span>Shift Goal</span>
                                    <input type="range" className="notif-sound-slider" min="4" max="16" step="1" value={catPrefs.overtime_threshold_hours || 8} onChange={(e) => updatePreference('clockins', 'overtime_threshold_hours', parseFloat(e.target.value))} style={{ width: 140, flexShrink: 0 }} />
                                    <span style={{ minWidth: 28, textAlign: 'right' }}>{catPrefs.overtime_threshold_hours || 8}h</span>
                                  </div>
                                </div>
                                <SettingsRow label="Notify employee" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.overtime_notify_employee} onChange={(e) => updatePreference('clockins', 'overtime_notify_employee', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <SettingsRow label="Email" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!(catPrefs.overtime_email_enabled ?? true)} onChange={(e) => updatePreference('clockins', 'overtime_email_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <SettingsRow label="SMS" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.overtime_sms_enabled} onChange={(e) => updatePreference('clockins', 'overtime_sms_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <div style={{ marginTop: '8px' }}>
                                  <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>Recipients</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(employeesWithEmail.length > 0 ? employeesWithEmail : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.overtime_admin_email_ids || []).includes(id)
                                      return (
                                        <label key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#38bdf8' : '#0ea5e9'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(8,47,73,0.7)' : '#f0f9ff') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleClockinRecipient('overtime', 'email', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.email ? ` (${emp.email})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {(employeesWithPhone.length > 0 ? employeesWithPhone : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.overtime_admin_sms_ids || []).includes(id)
                                      return (
                                        <label key={`sms-${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#22c55e' : '#16a34a'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(5,46,22,0.7)' : '#ecfdf3') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleClockinRecipient('overtime', 'sms', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.phone ? ` (${emp.phone})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {employeesWithEmail.length === 0 && employeesWithPhone.length === 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>No employees with email or phone</span>}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {cat.id === 'register' && (
                          <>
                            <SettingsRow label="Register Open" isDarkMode={isDarkMode} hasChevron>
                              <>
                                <Toggle checked={!!catPrefs.notify_admin_on_open} onChange={(e) => updatePreference('register', 'notify_admin_on_open', e.target.checked)} isDarkMode={isDarkMode} />
                                {catPrefs.notify_admin_on_open && (
                                  <button type="button" onClick={() => toggleDropdown('register_open')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} aria-label={expandedDropdowns.register_open ? 'Collapse' : 'Expand'}>
                                    <ChevronDown size={18} style={{ transform: expandedDropdowns.register_open ? 'rotate(180deg)' : 'none', color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                                  </button>
                                )}
                              </>
                            </SettingsRow>
                            {catPrefs.notify_admin_on_open && expandedDropdowns.register_open && (
                              <div style={{ borderBottom: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '4px', marginTop: '-4px', paddingLeft: '4px' }}>
                                <SettingsRow label="Email" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.register_email_enabled} onChange={(e) => updatePreference('register', 'register_email_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <SettingsRow label="SMS" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.register_sms_enabled} onChange={(e) => updatePreference('register', 'register_sms_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <div style={{ marginTop: '8px' }}>
                                  <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>Recipients</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(employeesWithEmail.length > 0 ? employeesWithEmail : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.admin_email_ids || []).includes(id)
                                      return (
                                        <label key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#38bdf8' : '#0ea5e9'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(8,47,73,0.7)' : '#f0f9ff') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleRecipient(cat.id, 'email', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.email ? ` (${emp.email})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {(employeesWithPhone.length > 0 ? employeesWithPhone : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.admin_sms_ids || []).includes(id)
                                      return (
                                        <label key={`sms-${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#22c55e' : '#16a34a'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(5,46,22,0.7)' : '#ecfdf3') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleRecipient(cat.id, 'sms', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.phone ? ` (${emp.phone})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {employeesWithEmail.length === 0 && employeesWithPhone.length === 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>No employees with email or phone</span>}
                                  </div>
                                </div>
                              </div>
                            )}

                            <SettingsRow label="Register Close" isDarkMode={isDarkMode} hasChevron>
                              <>
                                <Toggle checked={!!catPrefs.notify_admin_on_close} onChange={(e) => updatePreference('register', 'notify_admin_on_close', e.target.checked)} isDarkMode={isDarkMode} />
                                {catPrefs.notify_admin_on_close && (
                                  <button type="button" onClick={() => toggleDropdown('register_close')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} aria-label={expandedDropdowns.register_close ? 'Collapse' : 'Expand'}>
                                    <ChevronDown size={18} style={{ transform: expandedDropdowns.register_close ? 'rotate(180deg)' : 'none', color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                                  </button>
                                )}
                              </>
                            </SettingsRow>
                            {catPrefs.notify_admin_on_close && expandedDropdowns.register_close && (
                              <div style={{ borderBottom: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '4px', marginTop: '-4px', paddingLeft: '4px' }}>
                                <SettingsRow label="Email" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.register_email_enabled} onChange={(e) => updatePreference('register', 'register_email_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <SettingsRow label="SMS" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.register_sms_enabled} onChange={(e) => updatePreference('register', 'register_sms_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <div style={{ marginTop: '8px' }}>
                                  <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>Recipients</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(employeesWithEmail.length > 0 ? employeesWithEmail : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.admin_email_ids || []).includes(id)
                                      return (
                                        <label key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#38bdf8' : '#0ea5e9'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(8,47,73,0.7)' : '#f0f9ff') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleRecipient(cat.id, 'email', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.email ? ` (${emp.email})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {(employeesWithPhone.length > 0 ? employeesWithPhone : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.admin_sms_ids || []).includes(id)
                                      return (
                                        <label key={`sms-${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#22c55e' : '#16a34a'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(5,46,22,0.7)' : '#ecfdf3') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleRecipient(cat.id, 'sms', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.phone ? ` (${emp.phone})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {employeesWithEmail.length === 0 && employeesWithPhone.length === 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>No employees with email or phone</span>}
                                  </div>
                                </div>
                              </div>
                            )}

                            <SettingsRow label="Cash Drop" isDarkMode={isDarkMode} hasChevron last>
                              <>
                                <Toggle checked={!!catPrefs.notify_admin_on_drop} onChange={(e) => updatePreference('register', 'notify_admin_on_drop', e.target.checked)} isDarkMode={isDarkMode} />
                                {catPrefs.notify_admin_on_drop && (
                                  <button type="button" onClick={() => toggleDropdown('register_drop')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} aria-label={expandedDropdowns.register_drop ? 'Collapse' : 'Expand'}>
                                    <ChevronDown size={18} style={{ transform: expandedDropdowns.register_drop ? 'rotate(180deg)' : 'none', color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                                  </button>
                                )}
                              </>
                            </SettingsRow>
                            {catPrefs.notify_admin_on_drop && expandedDropdowns.register_drop && (
                              <div style={{ paddingBottom: '12px', marginBottom: '4px', marginTop: '-4px', paddingLeft: '4px' }}>
                                <SettingsRow label="Email" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.register_email_enabled} onChange={(e) => updatePreference('register', 'register_email_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <SettingsRow label="SMS" isDarkMode={isDarkMode}>
                                  <Toggle checked={!!catPrefs.register_sms_enabled} onChange={(e) => updatePreference('register', 'register_sms_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <div style={{ marginTop: '8px' }}>
                                  <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>Recipients</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(employeesWithEmail.length > 0 ? employeesWithEmail : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.admin_email_ids || []).includes(id)
                                      return (
                                        <label key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#38bdf8' : '#0ea5e9'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(8,47,73,0.7)' : '#f0f9ff') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleRecipient(cat.id, 'email', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.email ? ` (${emp.email})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {(employeesWithPhone.length > 0 ? employeesWithPhone : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.admin_sms_ids || []).includes(id)
                                      return (
                                        <label key={`sms-${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#22c55e' : '#16a34a'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(5,46,22,0.7)' : '#ecfdf3') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleRecipient(cat.id, 'sms', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.phone ? ` (${emp.phone})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {employeesWithEmail.length === 0 && employeesWithPhone.length === 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>No employees with email or phone</span>}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {cat.id === 'scheduling' && (
                          <>
                            <SettingsRow label="Notify on shift assignment" isDarkMode={isDarkMode} hasChevron last>
                              <>
                                <Toggle checked={!!catPrefs.notify_on_edit} onChange={(e) => updatePreference('scheduling', 'notify_on_edit', e.target.checked)} isDarkMode={isDarkMode} />
                                {catPrefs.notify_on_edit && (
                                  <button type="button" onClick={() => toggleDropdown('schedule_notify')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} aria-label={expandedDropdowns.schedule_notify ? 'Collapse' : 'Expand'}>
                                    <ChevronDown size={18} style={{ transform: expandedDropdowns.schedule_notify ? 'rotate(180deg)' : 'none', color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                                  </button>
                                )}
                              </>
                            </SettingsRow>
                            {catPrefs.notify_on_edit && expandedDropdowns.schedule_notify && (
                              <div style={{ paddingBottom: '4px', marginTop: '-4px', paddingLeft: '4px' }}>
                                <SettingsRow label="Email" isDarkMode={isDarkMode} last>
                                  <Toggle checked={!!catPrefs.schedule_notify_email_enabled} onChange={(e) => updatePreference('scheduling', 'schedule_notify_email_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                                <SettingsRow label="SMS" isDarkMode={isDarkMode} last>
                                  <Toggle checked={!!catPrefs.schedule_notify_sms_enabled} onChange={(e) => updatePreference('scheduling', 'schedule_notify_sms_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                                </SettingsRow>
                              </div>
                            )}
                            <div style={{ borderTop: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
                              <SettingsRow label="Email View" description="What details employees receive" isDarkMode={isDarkMode} last>
                              <select 
                                value={catPrefs.employee_schedule_view || 'shifts_only'} 
                                onChange={(e) => updatePreference('scheduling', 'employee_schedule_view', e.target.value)}
                                style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), fontSize: '12px', padding: '4px 8px', width: 'auto', border: 'none', background: 'transparent' }}
                              >
                                <option value="shifts_only">Shifts Only</option>
                                <option value="full_schedule">Full Schedule</option>
                              </select>
                            </SettingsRow>
                            </div>
                          </>
                        )}

                        {/* Orders: App Notification, Email, SMS – each with its own order types when enabled */}
                        {cat.id === 'orders' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {/* 1. App Notification */}
                            <SettingsRow label="App Notification" isDarkMode={isDarkMode} last={notificationSettings.recent_new_order !== false} hasChevron>
                              <>
                                <Toggle
                                  checked={notificationSettings.recent_new_order !== false}
                                  onChange={(e) => persistNotificationSettings({ ...notificationSettings, recent_new_order: e.target.checked })}
                                  isDarkMode={isDarkMode}
                                />
                                {notificationSettings.recent_new_order !== false && (
                                  <button type="button" onClick={() => toggleDropdown('orders_app')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} aria-label={expandedDropdowns.orders_app ? 'Collapse' : 'Expand'}>
                                    <ChevronDown size={18} style={{ transform: expandedDropdowns.orders_app ? 'rotate(180deg)' : 'none', color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                                  </button>
                                )}
                              </>
                            </SettingsRow>
                            {notificationSettings.recent_new_order !== false && expandedDropdowns.orders_app && (
                              <div style={{ borderBottom: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '4px', marginTop: '-4px' }}>
                                <div style={{ marginBottom: '12px' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 500, color: isDarkMode ? '#fff' : '#1a1a1a', marginBottom: '8px' }}>Order types</div>
                                  <OrderTypesRow
                                    checkedIds={Array.isArray(newOrderToastOptions?.order_type_filter) ? newOrderToastOptions.order_type_filter : ['all']}
                                    onToggle={toggleOrderTypeApp}
                                    isDarkMode={isDarkMode}
                                  />
                                </div>
                                <SettingsRow label="Play until dismiss" isDarkMode={isDarkMode} last>
                                  <Toggle
                                    checked={!!newOrderToastOptions.sound_until_dismiss}
                                    onChange={(e) => persistNewOrderToastOptions({ ...newOrderToastOptions, sound_until_dismiss: e.target.checked })}
                                    isDarkMode={isDarkMode}
                                  />
                                </SettingsRow>
                                <SettingsRow label="Sound" isDarkMode={isDarkMode} last>
                                  <Toggle
                                    checked={newOrderToastOptions.play_sound}
                                    onChange={(e) => persistNewOrderToastOptions({ ...newOrderToastOptions, play_sound: e.target.checked })}
                                    isDarkMode={isDarkMode}
                                  />
                                </SettingsRow>
                                {newOrderToastOptions.play_sound && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                      <span style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b' }}>Volume</span>
                                      <input
                                        type="range"
                                        className="notif-sound-slider"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={newOrderToastOptions.volume ?? 0.5}
                                        onChange={(e) => persistNewOrderToastOptions({ ...newOrderToastOptions, volume: parseFloat(e.target.value) })}
                                        style={{ width: 140, flexShrink: 0 }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                      <button
                                        type="button"
                                        onClick={() => playNewOrderSound({ sound_type: newOrderToastOptions.sound_type, volume: newOrderToastOptions.volume })}
                                        style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                      >
                                        Test
                                      </button>
                                      <div style={{ position: 'relative', display: 'inline-flex' }}>
                                        <button
                                          ref={soundDropdownTriggerRef}
                                          type="button"
                                          onClick={() => setSoundDropdownOpen(!soundDropdownOpen)}
                                          style={{
                                            fontSize: '12px',
                                            padding: '2px 4px 2px 5px',
                                            borderRadius: '4px',
                                            border: isDarkMode ? '1px solid #444' : '1px solid #d1d5db',
                                            background: isDarkMode ? '#1f2937' : '#fff',
                                            color: isDarkMode ? '#e5e7eb' : '#374151',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '2px',
                                            minWidth: 0
                                          }}
                                        >
                                          <span style={{ whiteSpace: 'nowrap' }}>
                                            {NOTIFICATION_SOUND_OPTIONS.find(s => s.value === (newOrderToastOptions.sound_type || 'default'))?.label || 'Default beep'}
                                          </span>
                                          <ChevronDown size={12} style={{ flexShrink: 0, opacity: 0.7 }} />
                                        </button>
                                        {soundDropdownOpen && soundDropdownRect && createPortal(
                                          <div
                                            ref={soundDropdownRef}
                                            className="user-dropdown-menu"
                                            style={{
                                              position: 'fixed',
                                              top: soundDropdownRect.bottom + 4,
                                              right: window.innerWidth - soundDropdownRect.right,
                                              padding: '4px',
                                              borderRadius: '12px',
                                              zIndex: 100000,
                                              width: 'fit-content',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: '2px'
                                            }}
                                          >
                                            {NOTIFICATION_SOUND_OPTIONS.map((s) => (
                                              <button
                                                key={s.value}
                                                type="button"
                                                onClick={() => {
                                                  persistNewOrderToastOptions({ ...newOrderToastOptions, sound_type: s.value })
                                                  setSoundDropdownOpen(false)
                                                }}
                                                style={{
                                                  width: '100%',
                                                  padding: '2px 6px 2px 6px',
                                                  fontSize: '12px',
                                                  textAlign: 'left',
                                                  background: 'none',
                                                  border: 'none',
                                                  color: (newOrderToastOptions.sound_type || 'default') === s.value ? (isDarkMode ? '#60a5fa' : '#2563eb') : (isDarkMode ? '#e5e7eb' : '#374151'),
                                                  cursor: 'pointer',
                                                  whiteSpace: 'nowrap',
                                                  boxSizing: 'border-box'
                                                }}
                                              >
                                                {s.label}
                                              </button>
                                            ))}
                                          </div>,
                                          document.body
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 2. Email */}
                            <div style={{ borderBottom: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9', paddingBottom: isEmailOn ? '12px' : '4px', marginBottom: '4px' }}>
                              <SettingsRow label="Email" isDarkMode={isDarkMode} last hasChevron>
                                <>
                                  <Toggle checked={!!isEmailOn} onChange={() => toggle(cat.id, 'email')} isDarkMode={isDarkMode} />
                                  {isEmailOn && (
                                    <button type="button" onClick={() => toggleDropdown('orders_email')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} aria-label={expandedDropdowns.orders_email ? 'Collapse' : 'Expand'}>
                                      <ChevronDown size={18} style={{ transform: expandedDropdowns.orders_email ? 'rotate(180deg)' : 'none', color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                                    </button>
                                  )}
                                </>
                              </SettingsRow>
                              {isEmailOn && expandedDropdowns.orders_email && (
                                <div style={{ paddingLeft: '4px', marginTop: '4px' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 500, color: isDarkMode ? '#fff' : '#1a1a1a', marginBottom: '8px' }}>Order types</div>
                                  <OrderTypesRow
                                    checkedIds={catPrefs.source_filter}
                                    onToggle={toggleOrderTypeEmail}
                                    isDarkMode={isDarkMode}
                                  />
                                  <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '6px', marginTop: '12px' }}>Recipients</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {(employeesWithEmail.length > 0 ? employeesWithEmail : []).map((emp) => {
                                    const id = emp.id || emp.employee_id
                                    const selected = (catPrefs.recipient_employee_ids || []).includes(id)
                                    return (
                                      <label key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#38bdf8' : '#0ea5e9'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(8,47,73,0.7)' : '#f0f9ff') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={selected} onChange={() => toggleRecipient(cat.id, 'email', id)} style={{ width: 12, height: 12 }} />
                                        <span>{emp.name}{emp.email ? ` (${emp.email})` : ''}</span>
                                      </label>
                                    )
                                  })}
                                  {employeesWithEmail.length === 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>No employees with email</span>}
                                </div>
                              </div>
                              )}
                            </div>

                            {/* 3. SMS */}
                            <div style={isSmsOn ? { borderBottom: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '4px' } : undefined}>
                              <SettingsRow label="SMS" isDarkMode={isDarkMode} last hasChevron>
                                <>
                                  <Toggle checked={!!isSmsOn} onChange={() => toggle(cat.id, 'sms')} isDarkMode={isDarkMode} />
                                  {isSmsOn && (
                                    <button type="button" onClick={() => toggleDropdown('orders_sms')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} aria-label={expandedDropdowns.orders_sms ? 'Collapse' : 'Expand'}>
                                      <ChevronDown size={18} style={{ transform: expandedDropdowns.orders_sms ? 'rotate(180deg)' : 'none', color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                                    </button>
                                  )}
                                </>
                              </SettingsRow>
                              {isSmsOn && expandedDropdowns.orders_sms && (
                                <div style={{ paddingLeft: '4px', marginTop: '4px' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 500, color: isDarkMode ? '#fff' : '#1a1a1a', marginBottom: '8px' }}>Order types</div>
                                  <OrderTypesRow
                                    checkedIds={catPrefs.source_filter_sms ?? catPrefs.source_filter}
                                    onToggle={toggleOrderTypeSms}
                                    isDarkMode={isDarkMode}
                                  />
                                  <div style={{ fontSize: '13px', color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '6px', marginTop: '12px' }}>Recipients</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(employeesWithPhone.length > 0 ? employeesWithPhone : []).map((emp) => {
                                      const id = emp.id || emp.employee_id
                                      const selected = (catPrefs.recipient_employee_ids_sms || []).includes(id)
                                      return (
                                        <label key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: selected ? `1px solid ${isDarkMode ? '#22c55e' : '#16a34a'}` : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, background: selected ? (isDarkMode ? 'rgba(5,46,22,0.7)' : '#ecfdf3') : (isDarkMode ? 'rgba(15,23,42,0.8)' : '#f8fafc'), fontSize: '11px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={selected} onChange={() => toggleRecipient(cat.id, 'sms', id)} style={{ width: 12, height: 12 }} />
                                          <span>{emp.name}{emp.phone ? ` (${emp.phone})` : ''}</span>
                                        </label>
                                      )
                                    })}
                                    {employeesWithPhone.length === 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>No employees with phone</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <div style={{ display: 'flex', justifyContent: (cat.id === 'orders' || cat.id === 'clockins' || cat.id === 'register' || cat.id === 'scheduling') ? 'flex-end' : 'center', marginTop: (cat.id === 'orders' || cat.id === 'clockins' || cat.id === 'register' || cat.id === 'scheduling') ? '8px' : '24px' }}>
                        {(cat.id === 'orders' || cat.id === 'clockins' || cat.id === 'register' || cat.id === 'scheduling') ? (
                          <button
                            type="button"
                            className="button-50"
                            role="button"
                            disabled={!canSave}
                            onClick={saveHandler}
                          >
                            <span className="button-50__Content">{(cat.id === 'clockins' && clockinNotifSaving) || (cat.id === 'orders' && channelSaving) || (cat.id === 'register' && registerNotifSaving) || (cat.id === 'scheduling' && scheduleNotifSaving) ? 'Saving…' : 'Save Settings'}</span>
                          </button>
                        ) : (
                          <button type="button" className="button-50" role="button" disabled={!canSave} onClick={saveHandler}>
                            <span className="button-50__Content">{ ((cat.id === 'clockins' && clockinNotifSaving) || (cat.id === 'register' && registerNotifSaving) || (cat.id === 'scheduling' && scheduleNotifSaving) || channelSaving) ? 'Saving…' : 'Update Settings' }</span>
                          </button>
                        )}
                    </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
