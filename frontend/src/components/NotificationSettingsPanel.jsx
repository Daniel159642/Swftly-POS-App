/**
 * NotificationSettingsPanel – simple, manager-friendly UI for configuring
 * Email, SMS, and In-app notifications. Used in Settings > Notifications tab.
 */
import { useState, useEffect } from 'react'
import { Mail, MessageSquare, Bell, ChevronDown, ChevronRight, User, Globe, AlertCircle, CheckCircle2, Send, Save, Settings2, ShieldCheck, Factory, Banknote, Calendar, Clock, ArrowRight, ArrowLeft } from 'lucide-react'
import { FormLabel, inputBaseStyle, compactPrimaryButtonStyle, compactCancelButtonStyle } from './FormStyles'
import { playNewOrderSound, NOTIFICATION_SOUND_OPTIONS } from '../utils/notificationSound'
import { cachedFetch } from '../services/offlineSync'

const CATEGORIES = [
  { id: 'orders', label: 'Online & POS Orders', desc: 'New orders from DoorDash, Shopify, and terminal.', icon: <Factory size={18} /> },
  { id: 'clockins', label: 'Clock-In / Clock-Out Notifications', desc: 'Receive email alerts when employees clock in or out, get notified if someone is running late, and flag overtime shifts automatically.', icon: <Clock size={18} /> },
  { id: 'register', label: 'Register Activity Emails', desc: 'Get notified when cash is moved or registers are opened/closed.', icon: <Banknote size={18} /> },
  { id: 'scheduling', label: 'Schedule Publishing & Email Alerts', desc: 'Control how shift assignments are emailed to employees and who gets the full team schedule.', icon: <Calendar size={18} /> },
  { id: 'reports', label: 'Daily & Weekly Reports', desc: 'Business performance and end-of-day summaries.', icon: <AlertCircle size={18} /> },
  { id: 'receipts', label: 'Customer Receipts', desc: 'Automated email receipts for your customers.', icon: <Mail size={18} /> }
]

// Add styling for the custom switches
// iOS-like Switch Styling
const switchStyles = `
  .switch { position: relative; display: inline-block; width: 44px; height: 24px; vertical-align: middle; }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #E9E9EB; transition: .3s; border-radius: 24px; }
  .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 2px; bottom: 2px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  input:checked + .slider { background-color: #007AFF; }
  input:checked + .slider:before { transform: translateX(20px); }
  .dark .slider { background-color: #39393D; }
`

const Toggle = ({ checked, onChange, isDarkMode }) => (
  <label className={`switch ${isDarkMode ? 'dark' : ''}`}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="slider round"></span>
  </label>
)

const SettingsRow = ({ label, description, children, isDarkMode, last }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: '12px 0',
    borderBottom: last ? 'none' : (isDarkMode ? '1px solid #333' : '1px solid #f1f5f9'),
    gap: '12px'
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: 500, color: isDarkMode ? '#fff' : '#1a1a1a' }}>{label}</div>
      {description && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{description}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>
      {children}
    </div>
  </div>
)

const IN_APP_OPTIONS = [
  { id: 'recent_new_order', label: 'New order popup', description: 'Show popup when a new integration order arrives', toastType: 'success', sampleMessage: 'Order #1234 from DoorDash' }
]

const SOURCES = [
  { id: 'all', label: 'All Sources' },
  { id: 'doordash', label: 'DoorDash' },
  { id: 'shopify', label: 'Shopify' },
  { id: 'ubereats', label: 'Uber Eats' },
  { id: 'pos', label: 'In-Store POS' }
]

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
  
  const [employeesWithEmail, setEmployeesWithEmail] = useState([])
  const [employeesWithPhone, setEmployeesWithPhone] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  const [showTestSmsInput, setShowTestSmsInput] = useState(false)
  const [testSmsInput, setTestSmsInput] = useState('')
  const [testSmsSending, setTestSmsSending] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

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

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', paddingBottom: '40px' }}>
      <style>{switchStyles}</style>
      <p style={{ fontSize: '15px', color: isDarkMode ? 'var(--text-secondary)' : '#64748b', marginBottom: '24px', textAlign: 'center' }}>
        Complete control over your store's notification channels and preferences.
      </p>

      {/* ——— Step 1: Messaging Setup ——— */}
      <div style={{ 
        marginBottom: '12px', 
        borderRadius: '16px', 
        border: isDarkMode ? '1px solid #333' : '1px solid #e2e8f0',
        backgroundColor: isDarkMode ? (expandedCategory === 'setup' ? 'rgba(255,255,255,0.03)' : 'transparent') : (expandedCategory === 'setup' ? '#f8fafc' : '#fff'),
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}>
        <div 
          onClick={() => setExpandedCategory(expandedCategory === 'setup' ? null : 'setup')}
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
        >
          <div style={{ color: '#2563eb' }}><Settings2 size={22} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? 'var(--text-primary)' : '#1e293b' }}>Setup & Distribution Channels</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Configure your Gmail and SMS account details</div>
          </div>
          {expandedCategory === 'setup' ? <ChevronDown size={20} color="#94a3b8" /> : <ChevronRight size={20} color="#94a3b8" />}
        </div>

        {expandedCategory === 'setup' && (
          <div style={{ padding: '0 20px 20px 20px', borderTop: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
              
              <SettingsRow label="Use Custom Gmail SMTP" description="Better for store-specific branding" isDarkMode={isDarkMode}>
                <Toggle checked={channelSettings.email_provider === 'gmail'} onChange={(e) => setChannelSettings({ ...channelSettings, email_provider: e.target.checked ? 'gmail' : 'aws_ses', use_platform_aws: !e.target.checked })} isDarkMode={isDarkMode} />
              </SettingsRow>

              {channelSettings.email_provider === 'gmail' && (
                <div style={{ padding: '16px', backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fcfcfc', borderRadius: '14px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '12px', border: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9' }}>
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

              <SettingsRow label="High-Speed SMS" description="Platform-managed reliability" isDarkMode={isDarkMode}>
                <Toggle checked={channelSettings.sms_provider === 'aws_sns'} onChange={(e) => setChannelSettings({ ...channelSettings, sms_provider: e.target.checked ? 'aws_sns' : 'email', use_platform_aws: true })} isDarkMode={isDarkMode} />
              </SettingsRow>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                 <button type="button" disabled={channelSaving} onClick={onSaveChannel} style={{ ...compactPrimaryButtonStyle(themeColorRgb, channelSaving), padding: '10px 48px', borderRadius: '30px', fontWeight: 600 }}>
                   {channelSaving ? 'Saving…' : 'Update Connection'}
                 </button>
                 <button type="button" onClick={() => setShowTestEmailInput(!showTestEmailInput)} style={{ ...compactCancelButtonStyle(isDarkMode), borderRadius: '30px' }}>Test Connectivity</button>
              </div>

              {showTestEmailInput && (
                <div style={{ marginTop: '16px', padding: '16px', borderRadius: '14px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9' }}>
                   <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Send Test Notification</div>
                   <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Email or Phone number" 
                        value={testEmailInput || ''} 
                        onChange={(e) => {setTestEmailInput(e.target.value); setTestSmsInput(e.target.value)}} 
                        style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), flex: 1, fontSize: '13px' }} 
                      />
                      <button type="button" onClick={handleTestEmail} style={{ ...compactPrimaryButtonStyle(themeColorRgb), padding: '0 16px', borderRadius: '10px' }}>Email</button>
                      <button type="button" onClick={handleTestSms} style={{ ...compactPrimaryButtonStyle(themeColorRgb), padding: '0 16px', borderRadius: '10px' }}>SMS</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ——— Categorized Notifications ——— */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingLeft: '8px' }}>
            <Globe size={20} color={isDarkMode ? '#64748b' : '#475569'} />
            <span style={{ fontSize: '16px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary)' : '#334155' }}>Notification Types</span>
        </div>
        
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
              isEmailOn = true // Clockins are primarily email-based in this UI
              canSave = !clockinNotifSaving
              saveHandler = onSaveClockin
          } else if (cat.id === 'register' && registerNotifSettings) {
              catPrefs = registerNotifSettings
              isEmailOn = true
              canSave = !registerNotifSaving
              saveHandler = onSaveRegister
          } else if (cat.id === 'scheduling' && scheduleNotifSettings) {
              catPrefs = scheduleNotifSettings
              isEmailOn = true
              canSave = !scheduleNotifSaving
              saveHandler = onSaveSchedule
          }
          
          return (
            <div key={cat.id} style={{ 
              marginBottom: '12px', 
              borderRadius: '16px', 
              border: isDarkMode ? '1px solid #333' : '1px solid #e2e8f0',
              backgroundColor: isDarkMode ? (isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent') : (isExpanded ? '#f8fafc' : '#fff'),
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
                <div style={{ 
                    color: (catPrefs.email || catPrefs.sms) ? (isDarkMode ? 'var(--theme-color)' : `rgb(${themeColorRgb})`) : '#94a3b8',
                    transition: 'color 0.2s ease'
                }}>
                    {cat.icon}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary)' : '#1e293b' }}>{cat.label}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{cat.desc}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: isEmailOn ? '#34C759' : '#94a3b8', fontWeight: isEmailOn ? 600 : 400 }}>
                        {isEmailOn ? 'On' : 'Off'}
                    </span>
                    {cat.id !== 'receipts' && cat.id !== 'register' && (
                        <>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                            <span style={{ fontSize: '13px', color: isSmsOn ? '#34C759' : '#94a3b8', fontWeight: isSmsOn ? 600 : 400 }}>
                                SMS {isSmsOn ? 'On' : 'Off'}
                            </span>
                        </>
                    )}
                </div>
                {isExpanded ? <ChevronDown size={20} color="#94a3b8" /> : <ChevronRight size={20} color="#94a3b8" />}
              </div>

              {isExpanded && (
                <div style={{ padding: '0 20px 20px 20px', borderTop: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
                        
                        {/* Main Channel Toggles */}
                        {cat.id !== 'clockins' && cat.id !== 'register' && cat.id !== 'scheduling' && (
                          <SettingsRow label="Enable Email Notifications" isDarkMode={isDarkMode}>
                            <Toggle checked={!!isEmailOn} onChange={() => toggle(cat.id, 'email')} isDarkMode={isDarkMode} />
                          </SettingsRow>
                        )}
                        {cat.id !== 'receipts' && cat.id !== 'register' && cat.id !== 'clockins' && cat.id !== 'scheduling' && (
                          <SettingsRow label="Enable SMS Notifications" isDarkMode={isDarkMode}>
                            <Toggle checked={!!isSmsOn} onChange={() => toggle(cat.id, 'sms')} isDarkMode={isDarkMode} />
                          </SettingsRow>
                        )}

                        {/* Category Specific Logic */}
                        {cat.id === 'clockins' && (
                          <>
                            <SettingsRow label="Email on Clock-In" isDarkMode={isDarkMode}>
                              <Toggle checked={!!catPrefs.notify_admin_on_clockin} onChange={(e) => updatePreference('clockins', 'notify_admin_on_clockin', e.target.checked)} isDarkMode={isDarkMode} />
                            </SettingsRow>
                            <SettingsRow label="Email on Clock-Out" isDarkMode={isDarkMode}>
                              <Toggle checked={!!catPrefs.notify_admin_on_clockout} onChange={(e) => updatePreference('clockins', 'notify_admin_on_clockout', e.target.checked)} isDarkMode={isDarkMode} />
                            </SettingsRow>
                            <SettingsRow label="Notify employee (Selfcc)" isDarkMode={isDarkMode}>
                              <Toggle checked={!!catPrefs.notify_employee_self} onChange={(e) => updatePreference('clockins', 'notify_employee_self', e.target.checked)} isDarkMode={isDarkMode} />
                            </SettingsRow>
                            <SettingsRow label="Late Alert" isDarkMode={isDarkMode} description="Notify admins if employee is late">
                              <Toggle checked={!!catPrefs.late_alert_enabled} onChange={(e) => updatePreference('clockins', 'late_alert_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                            </SettingsRow>
                            {catPrefs.late_alert_enabled && (
                              <div style={{ padding: '4px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                                   <span>Notify after delay</span>
                                   <span>{catPrefs.late_alert_delay_min || 15}m</span>
                                 </div>
                                 <input type="range" min="5" max="60" step="5" value={catPrefs.late_alert_delay_min || 15} onChange={(e) => updatePreference('clockins', 'late_alert_delay_min', e.target.value)} style={{ accentColor: '#34c759', height: '4px' }} />
                              </div>
                            )}

                            <SettingsRow label="Overtime Flag" isDarkMode={isDarkMode} description="Flag shifts exceeding goal">
                              <Toggle checked={!!catPrefs.overtime_alert_enabled} onChange={(e) => updatePreference('clockins', 'overtime_alert_enabled', e.target.checked)} isDarkMode={isDarkMode} />
                            </SettingsRow>
                            {catPrefs.overtime_alert_enabled && (
                              <div style={{ padding: '4px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                                   <span>Shift Goal</span>
                                   <span>{catPrefs.overtime_threshold_hours || 8}h</span>
                                 </div>
                                 <input type="range" min="4" max="16" step="1" value={catPrefs.overtime_threshold_hours || 8} onChange={(e) => updatePreference('clockins', 'overtime_threshold_hours', e.target.value)} style={{ accentColor: '#34c759', height: '4px' }} />
                              </div>
                            )}
                          </>
                        )}

                        {cat.id === 'register' && (
                          <>
                            <SettingsRow label="Register Open alerts" isDarkMode={isDarkMode}>
                              <Toggle checked={!!catPrefs.notify_admin_on_open} onChange={(e) => updatePreference('register', 'notify_admin_on_open', e.target.checked)} isDarkMode={isDarkMode} />
                            </SettingsRow>
                            <SettingsRow label="Register Close alerts" isDarkMode={isDarkMode}>
                              <Toggle checked={!!catPrefs.notify_admin_on_close} onChange={(e) => updatePreference('register', 'notify_admin_on_close', e.target.checked)} isDarkMode={isDarkMode} />
                            </SettingsRow>
                            <SettingsRow label="Cash Drop alerts" isDarkMode={isDarkMode}>
                              <Toggle checked={!!catPrefs.notify_admin_on_drop} onChange={(e) => updatePreference('register', 'notify_admin_on_drop', e.target.checked)} isDarkMode={isDarkMode} />
                            </SettingsRow>
                            <SettingsRow label="Always CC action performer" isDarkMode={isDarkMode}>
                              <Toggle checked={!!catPrefs.notify_employee_self} onChange={(e) => updatePreference('register', 'notify_employee_self', e.target.checked)} isDarkMode={isDarkMode} />
                            </SettingsRow>
                          </>
                        )}

                        {cat.id === 'scheduling' && (
                          <>
                            <SettingsRow label="Notify on shift edits" isDarkMode={isDarkMode}>
                              <Toggle checked={!!catPrefs.notify_on_edit} onChange={(e) => updatePreference('scheduling', 'notify_on_edit', e.target.checked)} isDarkMode={isDarkMode} />
                            </SettingsRow>
                            <SettingsRow label="Email View" description="What details employees receive" isDarkMode={isDarkMode}>
                              <select 
                                value={catPrefs.employee_schedule_view || 'shifts_only'} 
                                onChange={(e) => updatePreference('scheduling', 'employee_schedule_view', e.target.value)}
                                style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), fontSize: '12px', padding: '4px 8px', width: 'auto', border: 'none', background: 'transparent' }}
                              >
                                <option value="shifts_only">Shifts Only</option>
                                <option value="full_schedule">Full Schedule</option>
                              </select>
                            </SettingsRow>
                          </>
                        )}

                        {/* Recipient List as a Nested Inset Group */}
                        {cat.id !== 'receipts' && (
                          <div style={{ marginTop: '16px' }}>
                             <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>
                                Admin Recipients
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fcfcfc', borderRadius: '14px', padding: '4px 16px', border: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9' }}>
                                {employeesWithEmail.length === 0 ? (
                                    <div style={{ padding: '12px 0', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No managers with email found.</div>
                                ) : (
                                    employeesWithEmail.map((emp, idx) => (
                                      <SettingsRow 
                                        key={emp.employee_id} 
                                        label={emp.name} 
                                        description={emp.email} 
                                        isDarkMode={isDarkMode}
                                        last={idx === employeesWithEmail.length - 1}
                                      >
                                        <Toggle 
                                          checked={(catPrefs.admin_email_ids || catPrefs.recipient_employee_ids || []).includes(emp.id || emp.employee_id)} 
                                          onChange={() => toggleRecipient(cat.id, 'email', emp.id || emp.employee_id)} 
                                          isDarkMode={isDarkMode} 
                                        />
                                      </SettingsRow>
                                    ))
                                )}
                             </div>
                          </div>
                        )}
                    </div>

                    {/* Centered Pill Save Button */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                        <button type="button" disabled={!canSave} onClick={saveHandler} style={{ ...compactPrimaryButtonStyle(themeColorRgb, !canSave), padding: '10px 48px', borderRadius: '30px', fontWeight: 600, fontSize: '14px' }}>
                             { ((cat.id === 'clockins' && clockinNotifSaving) || (cat.id === 'register' && registerNotifSaving) || (cat.id === 'scheduling' && scheduleNotifSaving) || channelSaving) ? 'Saving…' : 'Update Settings' }
                        </button>
                    </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ——— Step 3: In-app ——— */}
      <div style={{ 
        marginBottom: '12px', 
        borderRadius: '16px', 
        border: isDarkMode ? '1px solid #333' : '1px solid #e2e8f0',
        backgroundColor: isDarkMode ? (expandedCategory === 'in-app' ? 'rgba(255,255,255,0.03)' : 'transparent') : (expandedCategory === 'in-app' ? '#f8fafc' : '#fff'),
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}>
        <div 
          onClick={() => setExpandedCategory(expandedCategory === 'in-app' ? null : 'in-app')}
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
        >
          <div style={{ color: '#64748b' }}><Bell size={22} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? 'var(--text-primary)' : '#1e293b' }}>In-App Terminal Alerts</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Configure desktop popups and audio sounds</div>
          </div>
          {expandedCategory === 'in-app' ? <ChevronDown size={20} color="#94a3b8" /> : <ChevronRight size={20} color="#94a3b8" />}
        </div>

        {expandedCategory === 'in-app' && (
          <div style={{ padding: '0 20px 20px 20px', borderTop: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
              {IN_APP_OPTIONS.map((opt, idx) => (
                <div key={opt.id}>
                    <SettingsRow label={opt.label} description={opt.description} isDarkMode={isDarkMode} last={idx === IN_APP_OPTIONS.length - 1 && !newOrderToastOptions.play_sound}>
                      <Toggle checked={notificationSettings[opt.id] !== false} onChange={(e) => persistNotificationSettings({ ...notificationSettings, [opt.id]: e.target.checked })} isDarkMode={isDarkMode} />
                    </SettingsRow>
                    
                    {opt.id === 'recent_new_order' && notificationSettings.recent_new_order !== false && (
                      <div style={{ marginLeft: '16px', paddingLeft: '16px', borderLeft: isDarkMode ? '1px solid #333' : '1px solid #f1f5f9' }}>
                         <SettingsRow label="Play notification sound" isDarkMode={isDarkMode}>
                           <Toggle checked={newOrderToastOptions.play_sound} onChange={(e) => persistNewOrderToastOptions({ ...newOrderToastOptions, play_sound: e.target.checked })} isDarkMode={isDarkMode} />
                         </SettingsRow>
                         
                         {newOrderToastOptions.play_sound && (
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#64748b' }}>Alarm Tone</span>
                                <select 
                                  value={newOrderToastOptions.sound_name || 'ding.mp3'} 
                                  onChange={(e) => persistNewOrderToastOptions({ ...newOrderToastOptions, sound_name: e.target.value })}
                                  style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), fontSize: '13px', padding: '4px 8px', width: 'auto', border: 'none', background: 'transparent' }}
                                >
                                  {NOTIFICATION_SOUND_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '13px', color: '#64748b' }}>Volume</span>
                                <input type="range" min="0" max="1" step="0.1" value={newOrderToastOptions.sound_volume ?? 1} onChange={(e) => persistNewOrderToastOptions({ ...newOrderToastOptions, sound_volume: parseFloat(e.target.value) })} style={{ flex: 1, accentColor: '#34d399' }} />
                                <button type="button" onClick={() => playNewOrderSound(newOrderToastOptions.sound_name, newOrderToastOptions.sound_volume)} style={{ ...compactCancelButtonStyle(isDarkMode), padding: '4px 10px', fontSize: '11px' }}>Test</button>
                              </div>
                           </div>
                         )}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
