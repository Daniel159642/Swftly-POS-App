import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

function Settings() {
  const { themeMode, themeColor } = useTheme()
  const [workflowSettings, setWorkflowSettings] = useState({
    workflow_mode: 'simple',
    auto_add_to_inventory: 'true'
  })
  const [receiptSettings, setReceiptSettings] = useState({
    receipt_type: 'traditional',
    store_name: 'Store',
    store_address: '',
    store_city: '',
    store_state: '',
    store_zip: '',
    store_phone: '',
    store_email: '',
    store_website: '',
    footer_message: 'Thank you for your business!',
    return_policy: '',
    show_tax_breakdown: true,
    show_payment_method: true,
    show_signature: false
  })
  const [activeTab, setActiveTab] = useState('workflow') // 'workflow', 'receipt', 'location', 'display', 'rewards', 'pos', 'sms', or 'cash'
  const [posSettings, setPosSettings] = useState({
    num_registers: 1,
    register_type: 'one_screen'
  })
  const [storeLocationSettings, setStoreLocationSettings] = useState({
    store_name: 'Store',
    latitude: null,
    longitude: null,
    address: '',
    allowed_radius_meters: 100.0,
    require_location: true
  })
  const [displaySettings, setDisplaySettings] = useState({
    tip_enabled: false,
    tip_after_payment: false,
    tip_suggestions: [15, 18, 20, 25]
  })
  const [rewardsSettings, setRewardsSettings] = useState({
    enabled: false,
    require_email: false,
    require_phone: false,
    require_both: false,
    reward_type: 'points',
    points_per_dollar: 1.0,
    percentage_discount: 0.0,
    fixed_discount: 0.0,
    minimum_spend: 0.0
  })
  const [smsSettings, setSmsSettings] = useState({
    sms_provider: 'email',
    smtp_server: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_use_tls: 1,
    aws_access_key_id: '',
    aws_secret_access_key: '',
    aws_region: 'us-east-1',
    business_name: '',
    auto_send_rewards_earned: 1,
    auto_send_rewards_redeemed: 1
  })
  const [smsMessages, setSmsMessages] = useState([])
  const [smsTemplates, setSmsTemplates] = useState([])
  const [smsStores, setSmsStores] = useState([])
  const [selectedSmsStore, setSelectedSmsStore] = useState(1)
  const [showSendSmsModal, setShowSendSmsModal] = useState(false)
  const [sendSmsForm, setSendSmsForm] = useState({ phone_number: '', message_text: '' })
  const [cashSettings, setCashSettings] = useState({
    register_id: 1,
    cash_mode: 'total',
    total_amount: 200.00,
    denominations: {
      '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
      '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
    }
  })
  const [dailyCount, setDailyCount] = useState({
    register_id: 1,
    count_date: new Date().toISOString().split('T')[0],
    count_type: 'drop',
    total_amount: 0,
    denominations: {
      '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
      '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
    },
    notes: ''
  })
  const [dailyCounts, setDailyCounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }

  const themeColorRgb = hexToRgb(themeColor)
  const isDarkMode = document.documentElement.classList.contains('dark-theme')

  useEffect(() => {
    loadSettings()
    loadReceiptSettings()
    loadStoreLocationSettings()
    loadDisplaySettings()
    loadRewardsSettings()
    loadPosSettings()
    loadSmsSettings()
    loadSmsStores()
    loadCashSettings()
    loadDailyCounts()
  }, [])

  useEffect(() => {
    if (activeTab === 'sms') {
      loadSmsSettings()
      loadSmsMessages()
      loadSmsTemplates()
    }
  }, [activeTab, selectedSmsStore])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/shipment-verification/settings')
      const data = await response.json()
      if (data.success && data.settings) {
        setWorkflowSettings(data.settings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const loadReceiptSettings = async () => {
    try {
      const response = await fetch('/api/receipt-settings')
      const data = await response.json()
      if (data.success && data.settings) {
        setReceiptSettings({
          ...data.settings,
          receipt_type: data.settings.receipt_type || 'traditional',
          return_policy: data.settings.return_policy || '',
          show_tax_breakdown: data.settings.show_tax_breakdown === 1,
          show_payment_method: data.settings.show_payment_method === 1,
          show_signature: data.settings.show_signature === 1
        })
      }
    } catch (error) {
      console.error('Error loading receipt settings:', error)
    }
  }

  const loadStoreLocationSettings = async () => {
    try {
      const response = await fetch('/api/store-location-settings')
      const data = await response.json()
      if (data.success && data.settings) {
        setStoreLocationSettings({
          ...data.settings,
          require_location: data.settings.require_location === 1
        })
      }
    } catch (error) {
      console.error('Error loading store location settings:', error)
    }
  }

  const loadDisplaySettings = async () => {
    try {
      const response = await fetch('/api/customer-display/settings')
      const data = await response.json()
      if (data.success) {
        setDisplaySettings({
          tip_enabled: data.data.tip_enabled === 1 || data.data.tip_enabled === true,
          tip_after_payment: data.data.tip_after_payment === 1 || data.data.tip_after_payment === true,
          tip_suggestions: data.data.tip_suggestions || [15, 18, 20, 25]
        })
      }
    } catch (error) {
      console.error('Error loading display settings:', error)
    }
  }

  const loadRewardsSettings = async () => {
    try {
      const response = await fetch('/api/customer-rewards-settings')
      const data = await response.json()
      if (data.success && data.settings) {
        setRewardsSettings({
          enabled: data.settings.enabled === 1 || data.settings.enabled === true,
          require_email: data.settings.require_email === 1 || data.settings.require_email === true,
          require_phone: data.settings.require_phone === 1 || data.settings.require_phone === true,
          require_both: data.settings.require_both === 1 || data.settings.require_both === true,
          reward_type: data.settings.reward_type || 'points',
          points_per_dollar: data.settings.points_per_dollar || 1.0,
          percentage_discount: data.settings.percentage_discount || 0.0,
          fixed_discount: data.settings.fixed_discount || 0.0,
          minimum_spend: data.settings.minimum_spend || 0.0
        })
      }
    } catch (error) {
      console.error('Error loading rewards settings:', error)
    }
  }

  const loadPosSettings = async () => {
    try {
      const response = await fetch('/api/pos-settings')
      const data = await response.json()
      if (data.success && data.settings) {
        setPosSettings({
          num_registers: data.settings.num_registers || 1,
          register_type: data.settings.register_type || 'one_screen'
        })
      }
    } catch (error) {
      console.error('Error loading POS settings:', error)
    }
  }

  const loadSmsSettings = async () => {
    try {
      const response = await fetch(`/api/sms/settings/${selectedSmsStore}`)
      const data = await response.json()
      setSmsSettings({
        sms_provider: data.sms_provider || 'email',
        smtp_server: data.smtp_server || 'smtp.gmail.com',
        smtp_port: data.smtp_port || 587,
        smtp_user: data.smtp_user || '',
        smtp_password: data.smtp_password === '***' ? '' : (data.smtp_password || ''),
        smtp_use_tls: data.smtp_use_tls !== undefined ? data.smtp_use_tls : 1,
        aws_access_key_id: data.aws_access_key_id || '',
        aws_secret_access_key: data.aws_secret_access_key === '***' ? '' : (data.aws_secret_access_key || ''),
        aws_region: data.aws_region || 'us-east-1',
        business_name: data.business_name || '',
        auto_send_rewards_earned: data.auto_send_rewards_earned !== undefined ? data.auto_send_rewards_earned : 1,
        auto_send_rewards_redeemed: data.auto_send_rewards_redeemed !== undefined ? data.auto_send_rewards_redeemed : 1
      })
    } catch (error) {
      console.error('Error loading SMS settings:', error)
    }
  }

  const loadSmsStores = async () => {
    try {
      const response = await fetch('/api/sms/stores')
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        setSmsStores(data)
        setSelectedSmsStore(data[0].store_id)
      }
    } catch (error) {
      console.error('Error loading SMS stores:', error)
    }
  }

  const loadSmsMessages = async () => {
    try {
      const response = await fetch(`/api/sms/messages?store_id=${selectedSmsStore}&limit=50`)
      const data = await response.json()
      if (Array.isArray(data)) {
        setSmsMessages(data)
      }
    } catch (error) {
      console.error('Error loading SMS messages:', error)
    }
  }

  const loadSmsTemplates = async () => {
    try {
      const response = await fetch(`/api/sms/templates?store_id=${selectedSmsStore}`)
      const data = await response.json()
      if (Array.isArray(data)) {
        setSmsTemplates(data)
      }
    } catch (error) {
      console.error('Error loading SMS templates:', error)
    }
  }

  const saveSmsSettings = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const response = await fetch(`/api/sms/settings/${selectedSmsStore}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          ...smsSettings,
          session_token: sessionToken
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'SMS settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
        loadSmsSettings()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save SMS settings' })
      }
    } catch (error) {
      console.error('Error saving SMS settings:', error)
      setMessage({ type: 'error', text: 'Failed to save SMS settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleSendSms = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          ...sendSmsForm,
          store_id: selectedSmsStore,
          session_token: sessionToken
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'SMS sent successfully!' })
        setShowSendSmsModal(false)
        setSendSmsForm({ phone_number: '', message_text: '' })
        loadSmsMessages()
      } else {
        setMessage({ type: 'error', text: data.message || data.error || 'Failed to send SMS' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error sending SMS: ' + error.message })
    } finally {
      setSaving(false)
    }
  }

  const loadCashSettings = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const response = await fetch(`/api/register/cash-settings?register_id=${cashSettings.register_id}&session_token=${sessionToken}`)
      const data = await response.json()
      if (data.success && data.data) {
        if (Array.isArray(data.data) && data.data.length > 0) {
          setCashSettings({
            register_id: data.data[0].register_id || 1,
            cash_mode: data.data[0].cash_mode || 'total',
            total_amount: data.data[0].total_amount || 200.00,
            denominations: data.data[0].denominations || {
              '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
              '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
            }
          })
        } else if (!Array.isArray(data.data)) {
          setCashSettings({
            register_id: data.data.register_id || 1,
            cash_mode: data.data.cash_mode || 'total',
            total_amount: data.data.total_amount || 200.00,
            denominations: data.data.denominations || {
              '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
              '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
            }
          })
        }
      }
    } catch (error) {
      console.error('Error loading cash settings:', error)
    }
  }

  const saveCashSettings = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const payload = {
        session_token: sessionToken,
        register_id: cashSettings.register_id,
        cash_mode: cashSettings.cash_mode,
        total_amount: cashSettings.cash_mode === 'total' ? parseFloat(cashSettings.total_amount) : null,
        denominations: cashSettings.cash_mode === 'denominations' ? cashSettings.denominations : null
      }

      const response = await fetch('/api/register/cash-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Cash settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
        loadCashSettings()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save cash settings' })
      }
    } catch (error) {
      console.error('Error saving cash settings:', error)
      setMessage({ type: 'error', text: 'Failed to save cash settings' })
    } finally {
      setSaving(false)
    }
  }

  const loadDailyCounts = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/register/daily-count?count_date=${today}&session_token=${sessionToken}`)
      const data = await response.json()
      if (data.success && data.data) {
        setDailyCounts(data.data)
      }
    } catch (error) {
      console.error('Error loading daily counts:', error)
    }
  }

  const saveDailyCount = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      
      // Calculate total from denominations if in denominations mode
      let total = parseFloat(dailyCount.total_amount) || 0
      if (dailyCount.denominations) {
        const calculated = Object.entries(dailyCount.denominations).reduce((sum, [denom, count]) => {
          return sum + (parseFloat(denom) * parseInt(count || 0))
        }, 0)
        if (calculated > 0) {
          total = calculated
        }
      }

      const payload = {
        session_token: sessionToken,
        register_id: dailyCount.register_id,
        count_date: dailyCount.count_date,
        count_type: dailyCount.count_type,
        total_amount: total,
        denominations: dailyCount.denominations,
        notes: dailyCount.notes
      }

      const response = await fetch('/api/register/daily-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Daily cash count saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
        loadDailyCounts()
        // Reset form
        setDailyCount({
          register_id: 1,
          count_date: new Date().toISOString().split('T')[0],
          count_type: 'drop',
          total_amount: 0,
          denominations: {
            '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
            '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
          },
          notes: ''
        })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save daily count' })
      }
    } catch (error) {
      console.error('Error saving daily count:', error)
      setMessage({ type: 'error', text: 'Failed to save daily count' })
    } finally {
      setSaving(false)
    }
  }

  const calculateTotalFromDenominations = (denoms) => {
    return Object.entries(denoms).reduce((sum, [denom, count]) => {
      return sum + (parseFloat(denom) * parseInt(count || 0))
    }, 0)
  }

  const saveRewardsSettings = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const response = await fetch('/api/customer-rewards-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          session_token: sessionToken,
          enabled: rewardsSettings.enabled ? 1 : 0,
          require_email: rewardsSettings.require_email ? 1 : 0,
          require_phone: rewardsSettings.require_phone ? 1 : 0,
          require_both: rewardsSettings.require_both ? 1 : 0,
          reward_type: rewardsSettings.reward_type,
          points_per_dollar: parseFloat(rewardsSettings.points_per_dollar) || 1.0,
          percentage_discount: parseFloat(rewardsSettings.percentage_discount) || 0.0,
          fixed_discount: parseFloat(rewardsSettings.fixed_discount) || 0.0,
          minimum_spend: parseFloat(rewardsSettings.minimum_spend) || 0.0
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Customer rewards settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save rewards settings' })
      }
    } catch (error) {
      console.error('Error saving rewards settings:', error)
      setMessage({ type: 'error', text: 'Failed to save rewards settings' })
    } finally {
      setSaving(false)
    }
  }

  const savePosSettings = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/pos-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          num_registers: parseInt(posSettings.num_registers) || 1,
          register_type: posSettings.register_type || 'one_screen'
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'POS settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save POS settings' })
      }
    } catch (error) {
      console.error('Error saving POS settings:', error)
      setMessage({ type: 'error', text: 'Failed to save POS settings' })
    } finally {
      setSaving(false)
    }
  }

  const saveDisplaySettings = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const response = await fetch('/api/customer-display/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          tip_enabled: displaySettings.tip_enabled ? 1 : 0,
          tip_after_payment: displaySettings.tip_after_payment ? 1 : 0,
          tip_suggestions: displaySettings.tip_suggestions
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Display settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save display settings' })
      }
    } catch (error) {
      console.error('Error saving display settings:', error)
      setMessage({ type: 'error', text: 'Failed to save display settings' })
    } finally {
      setSaving(false)
    }
  }

  const saveStoreLocationSettings = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const token = localStorage.getItem('sessionToken')
      const response = await fetch('/api/store-location-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token
        },
        body: JSON.stringify({
          session_token: token,
          ...storeLocationSettings,
          require_location: storeLocationSettings.require_location ? 1 : 0
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Store location settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save store location settings' })
      }
    } catch (error) {
      console.error('Error saving store location settings:', error)
      setMessage({ type: 'error', text: 'Failed to save store location settings' })
    } finally {
      setSaving(false)
    }
  }

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          // Try to get address from coordinates (reverse geocoding)
          let address = null
          try {
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            )
            const geoData = await geoResponse.json()
            if (geoData && geoData.display_name) {
              address = geoData.display_name
            }
          } catch (err) {
            console.warn('Could not get address from coordinates:', err)
          }
          
          resolve({ latitude, longitude, address })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  const handleSetCurrentLocation = async () => {
    try {
      setMessage({ type: 'info', text: 'Getting your current location...' })
      const location = await getCurrentLocation()
      setStoreLocationSettings({
        ...storeLocationSettings,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || storeLocationSettings.address
      })
      setMessage({ type: 'success', text: 'Location set successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to get location: ${error.message}` })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/shipment-verification/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowSettings)
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const saveReceiptSettings = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/receipt-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...receiptSettings,
          receipt_type: receiptSettings.receipt_type || 'traditional',
          return_policy: receiptSettings.return_policy || '',
          show_tax_breakdown: receiptSettings.show_tax_breakdown ? 1 : 0,
          show_payment_method: receiptSettings.show_payment_method ? 1 : 0,
          show_signature: receiptSettings.show_signature ? 1 : 0
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Receipt settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save receipt settings' })
      }
    } catch (error) {
      console.error('Error saving receipt settings:', error)
      setMessage({ type: 'error', text: 'Failed to save receipt settings' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#333' }}>
        <div>Loading settings...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ 
        marginBottom: '24px', 
        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
        fontSize: '28px',
        fontWeight: 600
      }}>
        Settings
      </h1>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: `2px solid ${isDarkMode ? 'var(--border-light, #333)' : '#e0e0e0'}`
      }}>
        <button
          onClick={() => setActiveTab('workflow')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'workflow' ? `3px solid rgba(${themeColorRgb}, 0.7)` : '3px solid transparent',
            color: activeTab === 'workflow' 
              ? (isDarkMode ? 'var(--text-primary, #fff)' : '#333')
              : (isDarkMode ? 'var(--text-tertiary, #999)' : '#666'),
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'workflow' ? 600 : 400,
            transition: 'all 0.2s ease'
          }}
        >
          Shipment Verification
        </button>
        <button
          onClick={() => setActiveTab('receipt')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'receipt' ? `3px solid rgba(${themeColorRgb}, 0.7)` : '3px solid transparent',
            color: activeTab === 'receipt' 
              ? (isDarkMode ? 'var(--text-primary, #fff)' : '#333')
              : (isDarkMode ? 'var(--text-tertiary, #999)' : '#666'),
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'receipt' ? 600 : 400,
            transition: 'all 0.2s ease'
          }}
        >
          Receipt Settings
        </button>
        <button
          onClick={() => setActiveTab('location')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'location' ? `3px solid rgba(${themeColorRgb}, 0.7)` : '3px solid transparent',
            color: activeTab === 'location' 
              ? (isDarkMode ? 'var(--text-primary, #fff)' : '#333')
              : (isDarkMode ? 'var(--text-tertiary, #999)' : '#666'),
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'location' ? 600 : 400,
            transition: 'all 0.2s ease'
          }}
        >
          Store Location
        </button>
        <button
          onClick={() => setActiveTab('display')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'display' ? `3px solid rgba(${themeColorRgb}, 0.7)` : '3px solid transparent',
            color: activeTab === 'display' 
              ? (isDarkMode ? 'var(--text-primary, #fff)' : '#333')
              : (isDarkMode ? 'var(--text-tertiary, #999)' : '#666'),
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'display' ? 600 : 400,
            transition: 'all 0.2s ease'
          }}
        >
          Display Settings
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'rewards' ? `3px solid rgba(${themeColorRgb}, 0.7)` : '3px solid transparent',
            color: activeTab === 'rewards' 
              ? (isDarkMode ? 'var(--text-primary, #fff)' : '#333')
              : (isDarkMode ? 'var(--text-tertiary, #999)' : '#666'),
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'rewards' ? 600 : 400,
            transition: 'all 0.2s ease'
          }}
        >
          Customer Rewards
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'pos' ? `3px solid rgba(${themeColorRgb}, 0.7)` : '3px solid transparent',
            color: activeTab === 'pos' 
              ? (isDarkMode ? 'var(--text-primary, #fff)' : '#333')
              : (isDarkMode ? 'var(--text-tertiary, #999)' : '#666'),
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'pos' ? 600 : 400,
            transition: 'all 0.2s ease'
          }}
        >
          POS Settings
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'sms' ? `3px solid rgba(${themeColorRgb}, 0.7)` : '3px solid transparent',
            color: activeTab === 'sms' 
              ? (isDarkMode ? 'var(--text-primary, #fff)' : '#333')
              : (isDarkMode ? 'var(--text-tertiary, #999)' : '#666'),
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'sms' ? 600 : 400,
            transition: 'all 0.2s ease'
          }}
        >
          SMS
        </button>
        <button
          onClick={() => setActiveTab('cash')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'cash' ? `3px solid rgba(${themeColorRgb}, 0.7)` : '3px solid transparent',
            color: activeTab === 'cash' 
              ? (isDarkMode ? 'var(--text-primary, #fff)' : '#333')
              : (isDarkMode ? 'var(--text-tertiary, #999)' : '#666'),
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'cash' ? 600 : 400,
            transition: 'all 0.2s ease'
          }}
        >
          Cash Register
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' 
            ? (isDarkMode ? 'rgba(76, 175, 80, 0.2)' : '#e8f5e9')
            : (isDarkMode ? 'rgba(244, 67, 54, 0.2)' : '#ffebee'),
          color: message.type === 'success' ? '#4caf50' : '#f44336',
          border: `1px solid ${message.type === 'success' ? '#4caf50' : '#f44336'}`
        }}>
          {message.text}
        </div>
      )}

      {activeTab === 'workflow' && (
      <div style={{
        backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Workflow Mode Setting */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            marginBottom: '12px',
            fontSize: '18px',
            fontWeight: 600,
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
          }}>
            Workflow Mode
          </h2>
          <p style={{
            marginBottom: '16px',
            fontSize: '14px',
            color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666'
          }}>
            Choose how shipment verification works:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Simple Workflow */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',
              border: `2px solid ${workflowSettings.workflow_mode === 'simple' ? `rgba(${themeColorRgb}, 0.7)` : (isDarkMode ? 'var(--border-light, #333)' : '#e0e0e0')}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: workflowSettings.workflow_mode === 'simple' 
                ? (isDarkMode ? `rgba(${themeColorRgb}, 0.1)` : `rgba(${themeColorRgb}, 0.05)`)
                : 'transparent',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="radio"
                name="workflow_mode"
                value="simple"
                checked={workflowSettings.workflow_mode === 'simple'}
                onChange={(e) => setWorkflowSettings({ ...workflowSettings, workflow_mode: e.target.value })}
                style={{ marginTop: '4px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Simple Workflow
                </div>
                <div style={{
                  fontSize: '14px',
                  color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                  lineHeight: '1.5'
                }}>
                  Verify items, input prices → Automatically add to inventory when complete. 
                  Fast and straightforward for quick processing.
                </div>
              </div>
            </label>

            {/* Three-Step Workflow */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',
              border: `2px solid ${workflowSettings.workflow_mode === 'three_step' ? `rgba(${themeColorRgb}, 0.7)` : (isDarkMode ? 'var(--border-light, #333)' : '#e0e0e0')}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: workflowSettings.workflow_mode === 'three_step' 
                ? (isDarkMode ? `rgba(${themeColorRgb}, 0.1)` : `rgba(${themeColorRgb}, 0.05)`)
                : 'transparent',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="radio"
                name="workflow_mode"
                value="three_step"
                checked={workflowSettings.workflow_mode === 'three_step'}
                onChange={(e) => setWorkflowSettings({ ...workflowSettings, workflow_mode: e.target.value })}
                style={{ marginTop: '4px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Three-Step Workflow
                </div>
                <div style={{
                  fontSize: '14px',
                  color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                  lineHeight: '1.5',
                  marginBottom: '8px'
                }}>
                  Step-by-step verification process:
                </div>
                <ol style={{
                  margin: '0 0 0 16px',
                  padding: 0,
                  fontSize: '14px',
                  color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                  lineHeight: '1.8'
                }}>
                  <li><strong>Step 1:</strong> Verify items arrived and input prices</li>
                  <li><strong>Step 2:</strong> Review and confirm all pricing</li>
                  <li><strong>Step 3:</strong> Add items to inventory (put on shelf)</li>
                </ol>
              </div>
            </label>
          </div>
        </div>

        {/* Auto-add to Inventory (only for simple mode) */}
        {workflowSettings.workflow_mode === 'simple' && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              marginBottom: '12px',
              fontSize: '18px',
              fontWeight: 600,
              color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
            }}>
              Auto-Add to Inventory
            </h2>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={workflowSettings.auto_add_to_inventory === 'true'}
                onChange={(e) => setWorkflowSettings({
                  ...workflowSettings,
                  auto_add_to_inventory: e.target.checked ? 'true' : 'false'
                })}
              />
              <span style={{
                fontSize: '14px',
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Automatically add items to inventory when verification is complete
              </span>
            </label>
            <p style={{
              marginTop: '8px',
              marginLeft: '32px',
              fontSize: '13px',
              color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
              fontStyle: 'italic'
            }}>
              When unchecked, you'll need to manually add items to inventory after verification.
            </p>
          </div>
        )}

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={
              activeTab === 'workflow' ? saveSettings :
              activeTab === 'receipt' ? saveReceiptSettings :
              activeTab === 'location' ? saveStoreLocationSettings :
              activeTab === 'rewards' ? saveRewardsSettings :
              activeTab === 'pos' ? savePosSettings :
              saveDisplaySettings
            }
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: saving ? (isDarkMode ? '#3a3a3a' : '#ccc') : `rgba(${themeColorRgb}, 0.7)`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              boxShadow: saving ? 'none' : `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
              transition: 'all 0.3s ease',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving 
              ? (activeTab === 'workflow' ? 'Saving...' : activeTab === 'receipt' ? 'Saving Receipt Settings...' : activeTab === 'location' ? 'Saving Location Settings...' : activeTab === 'rewards' ? 'Saving Rewards Settings...' : activeTab === 'pos' ? 'Saving POS Settings...' : 'Saving Display Settings...')
              : (activeTab === 'workflow' ? 'Save Settings' : activeTab === 'receipt' ? 'Save Receipt Settings' : activeTab === 'location' ? 'Save Location Settings' : activeTab === 'rewards' ? 'Save Rewards Settings' : activeTab === 'pos' ? 'Save POS Settings' : 'Save Display Settings')
            }
          </button>
        </div>
      </div>
      )}

      {/* Receipt Settings Tab */}
      {activeTab === 'receipt' && (
        <div style={{
          backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            marginBottom: '24px',
            fontSize: '20px',
            fontWeight: 600,
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
          }}>
            Receipt Customization
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Receipt Type */}
            <div>
              <h3 style={{
                marginBottom: '12px',
                fontSize: '16px',
                fontWeight: 600,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Receipt Type
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  border: `2px solid ${receiptSettings.receipt_type === 'traditional' ? `rgba(${themeColorRgb}, 0.7)` : (isDarkMode ? 'var(--border-light, #333)' : '#e0e0e0')}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: receiptSettings.receipt_type === 'traditional' 
                    ? (isDarkMode ? `rgba(${themeColorRgb}, 0.1)` : `rgba(${themeColorRgb}, 0.05)`)
                    : 'transparent',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="receipt_type"
                    value="traditional"
                    checked={receiptSettings.receipt_type === 'traditional'}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, receipt_type: e.target.value })}
                    style={{ marginTop: '4px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 600,
                      marginBottom: '4px',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                    }}>
                      Traditional Receipt
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                      lineHeight: '1.5'
                    }}>
                      Standard thermal printer format (80mm width, black & white, compact layout)
                    </div>
                  </div>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  border: `2px solid ${receiptSettings.receipt_type === 'custom' ? `rgba(${themeColorRgb}, 0.7)` : (isDarkMode ? 'var(--border-light, #333)' : '#e0e0e0')}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: receiptSettings.receipt_type === 'custom' 
                    ? (isDarkMode ? `rgba(${themeColorRgb}, 0.1)` : `rgba(${themeColorRgb}, 0.05)`)
                    : 'transparent',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="receipt_type"
                    value="custom"
                    checked={receiptSettings.receipt_type === 'custom'}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, receipt_type: e.target.value })}
                    style={{ marginTop: '4px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 600,
                      marginBottom: '4px',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                    }}>
                      Custom Receipt
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                      lineHeight: '1.5'
                    }}>
                      Full customization with all information, return policy, and detailed formatting
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Store Information */}
            <div>
              <h3 style={{
                marginBottom: '12px',
                fontSize: '16px',
                fontWeight: 600,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Store Information
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Store Name"
                  value={receiptSettings.store_name}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, store_name: e.target.value })}
                  style={{
                    padding: '10px',
                    border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                    borderRadius: '6px',
                    backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Street Address"
                  value={receiptSettings.store_address}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, store_address: e.target.value })}
                  style={{
                    padding: '10px',
                    border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                    borderRadius: '6px',
                    backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                    fontSize: '14px'
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="City"
                    value={receiptSettings.store_city}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, store_city: e.target.value })}
                    style={{
                      padding: '10px',
                      border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={receiptSettings.store_state}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, store_state: e.target.value })}
                    style={{
                      padding: '10px',
                      border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={receiptSettings.store_zip}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, store_zip: e.target.value })}
                    style={{
                      padding: '10px',
                      border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Phone"
                  value={receiptSettings.store_phone}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, store_phone: e.target.value })}
                  style={{
                    padding: '10px',
                    border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                    borderRadius: '6px',
                    backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={receiptSettings.store_email}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, store_email: e.target.value })}
                  style={{
                    padding: '10px',
                    border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                    borderRadius: '6px',
                    backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Website"
                  value={receiptSettings.store_website}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, store_website: e.target.value })}
                  style={{
                    padding: '10px',
                    border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                    borderRadius: '6px',
                    backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Footer Message */}
            <div>
              <h3 style={{
                marginBottom: '12px',
                fontSize: '16px',
                fontWeight: 600,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Footer Message
              </h3>
              <textarea
                placeholder="Thank you for your business!"
                value={receiptSettings.footer_message}
                onChange={(e) => setReceiptSettings({ ...receiptSettings, footer_message: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Return Policy */}
            <div>
              <h3 style={{
                marginBottom: '12px',
                fontSize: '16px',
                fontWeight: 600,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Return Policy
              </h3>
              <textarea
                placeholder="Enter your store's return policy (e.g., 'Returns accepted within 30 days with receipt')"
                value={receiptSettings.return_policy}
                onChange={(e) => setReceiptSettings({ ...receiptSettings, return_policy: e.target.value })}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <p style={{
                marginTop: '8px',
                fontSize: '13px',
                color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                fontStyle: 'italic'
              }}>
                This will appear at the bottom of receipts
              </p>
            </div>

            {/* Display Options */}
            <div>
              <h3 style={{
                marginBottom: '12px',
                fontSize: '16px',
                fontWeight: 600,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Display Options
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={receiptSettings.show_tax_breakdown}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, show_tax_breakdown: e.target.checked })}
                  />
                  <span style={{
                    fontSize: '14px',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    Show tax breakdown on receipt
                  </span>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={receiptSettings.show_payment_method}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, show_payment_method: e.target.checked })}
                  />
                  <span style={{
                    fontSize: '14px',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    Show payment method on receipt
                  </span>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={receiptSettings.show_signature}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, show_signature: e.target.checked })}
                  />
                  <span style={{
                    fontSize: '14px',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    Show signature on receipt
                  </span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`
            }}>
              <button
                onClick={saveReceiptSettings}
                disabled={saving}
                style={{
                  padding: '12px 32px',
                  backgroundColor: saving ? (isDarkMode ? '#3a3a3a' : '#ccc') : `rgba(${themeColorRgb}, 0.7)`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  boxShadow: saving ? 'none' : `0 4px 15px rgba(${themeColorRgb}, 0.3)`,
                  transition: 'all 0.3s ease',
                  opacity: saving ? 0.6 : 1,
                  minWidth: '150px'
                }}
              >
                {saving ? 'Saving...' : 'Save Receipt Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store Location Settings Tab */}
      {activeTab === 'location' && (
        <div style={{
          backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            marginBottom: '24px',
            fontSize: '20px',
            fontWeight: 600,
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
          }}>
            Store Location Settings
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <p style={{
                marginBottom: '16px',
                fontSize: '14px',
                color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666',
                lineHeight: '1.6'
              }}>
                Set your store's GPS location and allowed radius. When employees clock in or out, 
                the system will collect their location and verify they are within the specified radius 
                of the store. This prevents employees from clocking in from home or other unauthorized locations.
              </p>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: 500,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Store Name
              </label>
              <input
                type="text"
                value={storeLocationSettings.store_name}
                onChange={(e) => setStoreLocationSettings({ ...storeLocationSettings, store_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: 500,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Store Address
              </label>
              <input
                type="text"
                value={storeLocationSettings.address}
                onChange={(e) => setStoreLocationSettings({ ...storeLocationSettings, address: e.target.value })}
                placeholder="Enter store address"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  GPS Coordinates
                </label>
                <button
                  onClick={handleSetCurrentLocation}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  📍 Use Current Location
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '12px',
                    color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666'
                  }}>
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={storeLocationSettings.latitude || ''}
                    onChange={(e) => setStoreLocationSettings({ 
                      ...storeLocationSettings, 
                      latitude: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder="e.g., 40.7128"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '12px',
                    color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666'
                  }}>
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={storeLocationSettings.longitude || ''}
                    onChange={(e) => setStoreLocationSettings({ 
                      ...storeLocationSettings, 
                      longitude: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder="e.g., -74.0060"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
              {storeLocationSettings.latitude && storeLocationSettings.longitude && (
                <p style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                  fontStyle: 'italic'
                }}>
                  Location set: {storeLocationSettings.latitude.toFixed(6)}, {storeLocationSettings.longitude.toFixed(6)}
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: 500,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Allowed Radius (meters)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={storeLocationSettings.allowed_radius_meters}
                onChange={(e) => setStoreLocationSettings({ 
                  ...storeLocationSettings, 
                  allowed_radius_meters: parseFloat(e.target.value) || 100.0 
                })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  fontSize: '14px'
                }}
              />
              <p style={{
                marginTop: '6px',
                fontSize: '12px',
                color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666'
              }}>
                Employees must be within this distance (in meters) from the store to clock in/out.
                Default: 100 meters (~328 feet)
              </p>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={storeLocationSettings.require_location}
                  onChange={(e) => setStoreLocationSettings({ 
                    ...storeLocationSettings, 
                    require_location: e.target.checked 
                  })}
                />
                <span style={{
                  fontSize: '14px',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Require location verification for clock in/out
                </span>
              </label>
              <p style={{
                marginTop: '6px',
                marginLeft: '32px',
                fontSize: '12px',
                color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                fontStyle: 'italic'
              }}>
                When enabled, employees must be within the allowed radius to clock in/out. 
                When disabled, location is still recorded but not validated.
              </p>
            </div>

            {/* Save Button */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`
            }}>
              <button
                onClick={saveStoreLocationSettings}
                disabled={saving}
                style={{
                  padding: '12px 32px',
                  backgroundColor: saving ? (isDarkMode ? '#3a3a3a' : '#ccc') : `rgba(${themeColorRgb}, 0.7)`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  boxShadow: saving ? 'none' : `0 4px 15px rgba(${themeColorRgb}, 0.3)`,
                  transition: 'all 0.3s ease',
                  opacity: saving ? 0.6 : 1,
                  minWidth: '150px'
                }}
              >
                {saving ? 'Saving...' : 'Save Location Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'display' && (
        <div style={{
          backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            marginBottom: '20px',
            fontSize: '18px',
            fontWeight: 600,
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
          }}>
            Customer Display Settings
          </h2>
          
          <div style={{ marginTop: '20px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '20px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={displaySettings.tip_enabled}
                onChange={(e) => setDisplaySettings({ ...displaySettings, tip_enabled: e.target.checked })}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ 
                fontSize: '14px',
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Enable tip prompts before payment
              </span>
            </label>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '20px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={displaySettings.tip_after_payment}
                onChange={(e) => setDisplaySettings({ ...displaySettings, tip_after_payment: e.target.checked })}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ 
                fontSize: '14px',
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Enable tip option after payment completion
              </span>
            </label>

            {/* Save Button */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`
            }}>
              <button
                onClick={saveDisplaySettings}
                disabled={saving}
                style={{
                  padding: '12px 32px',
                  backgroundColor: saving ? (isDarkMode ? '#3a3a3a' : '#ccc') : `rgba(${themeColorRgb}, 0.7)`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  boxShadow: saving ? 'none' : `0 4px 15px rgba(${themeColorRgb}, 0.3)`,
                  transition: 'all 0.3s ease',
                  opacity: saving ? 0.6 : 1,
                  minWidth: '150px'
                }}
              >
                {saving ? 'Saving...' : 'Save Display Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Rewards Settings Tab */}
      {activeTab === 'rewards' && (
        <div style={{
          backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            marginBottom: '24px',
            fontSize: '20px',
            fontWeight: 600,
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
          }}>
            Customer Rewards Program
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Enable Rewards */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={rewardsSettings.enabled}
                  onChange={(e) => setRewardsSettings({ ...rewardsSettings, enabled: e.target.checked })}
                />
                <span style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Enable Customer Rewards Program
                </span>
              </label>
            </div>

            {rewardsSettings.enabled && (
              <>
                {/* Customer Info Requirements */}
                <div>
                  <h3 style={{
                    marginBottom: '12px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    Customer Information Requirements
                  </h3>
                  <p style={{
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666'
                  }}>
                    Choose what customer information is required to participate in the rewards program:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="customer_info_requirement"
                        checked={!rewardsSettings.require_email && !rewardsSettings.require_phone && !rewardsSettings.require_both}
                        onChange={() => setRewardsSettings({
                          ...rewardsSettings,
                          require_email: false,
                          require_phone: false,
                          require_both: false
                        })}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}>
                        No requirements (optional)
                      </span>
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="customer_info_requirement"
                        checked={rewardsSettings.require_email && !rewardsSettings.require_both}
                        onChange={() => setRewardsSettings({
                          ...rewardsSettings,
                          require_email: true,
                          require_phone: false,
                          require_both: false
                        })}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}>
                        Require email
                      </span>
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="customer_info_requirement"
                        checked={rewardsSettings.require_phone && !rewardsSettings.require_both}
                        onChange={() => setRewardsSettings({
                          ...rewardsSettings,
                          require_email: false,
                          require_phone: true,
                          require_both: false
                        })}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}>
                        Require phone number
                      </span>
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="customer_info_requirement"
                        checked={rewardsSettings.require_both}
                        onChange={() => setRewardsSettings({
                          ...rewardsSettings,
                          require_email: true,
                          require_phone: true,
                          require_both: true
                        })}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}>
                        Require both email and phone number
                      </span>
                    </label>
                  </div>
                </div>

                {/* Reward Type */}
                <div>
                  <h3 style={{
                    marginBottom: '12px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    Reward Type
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="reward_type"
                        value="points"
                        checked={rewardsSettings.reward_type === 'points'}
                        onChange={(e) => setRewardsSettings({ ...rewardsSettings, reward_type: e.target.value })}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}>
                        Points (earn points per dollar spent)
                      </span>
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="reward_type"
                        value="percentage"
                        checked={rewardsSettings.reward_type === 'percentage'}
                        onChange={(e) => setRewardsSettings({ ...rewardsSettings, reward_type: e.target.value })}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}>
                        Percentage discount
                      </span>
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="reward_type"
                        value="fixed"
                        checked={rewardsSettings.reward_type === 'fixed'}
                        onChange={(e) => setRewardsSettings({ ...rewardsSettings, reward_type: e.target.value })}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}>
                        Fixed discount amount
                      </span>
                    </label>
                  </div>
                </div>

                {/* Reward Configuration */}
                {rewardsSettings.reward_type === 'points' && (
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                    }}>
                      Points per Dollar Spent
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={rewardsSettings.points_per_dollar}
                      onChange={(e) => setRewardsSettings({
                        ...rewardsSettings,
                        points_per_dollar: parseFloat(e.target.value) || 1.0
                      })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                        borderRadius: '6px',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                )}

                {rewardsSettings.reward_type === 'percentage' && (
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                    }}>
                      Percentage Discount (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={rewardsSettings.percentage_discount}
                      onChange={(e) => setRewardsSettings({
                        ...rewardsSettings,
                        percentage_discount: parseFloat(e.target.value) || 0.0
                      })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                        borderRadius: '6px',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                )}

                {rewardsSettings.reward_type === 'fixed' && (
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                    }}>
                      Fixed Discount Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rewardsSettings.fixed_discount}
                      onChange={(e) => setRewardsSettings({
                        ...rewardsSettings,
                        fixed_discount: parseFloat(e.target.value) || 0.0
                      })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                        borderRadius: '6px',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                )}

                {/* Minimum Spend */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    Minimum Spend to Earn Rewards ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rewardsSettings.minimum_spend}
                    onChange={(e) => setRewardsSettings({
                      ...rewardsSettings,
                      minimum_spend: parseFloat(e.target.value) || 0.0
                    })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                      fontSize: '14px'
                    }}
                  />
                  <p style={{
                    marginTop: '6px',
                    fontSize: '12px',
                    color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666'
                  }}>
                    Customers must spend this amount or more to earn rewards (0 = no minimum)
                  </p>
                </div>

                {/* Save Button */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '24px',
                  paddingTop: '24px',
                  borderTop: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`
                }}>
                  <button
                    onClick={saveRewardsSettings}
                    disabled={saving}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: saving ? (isDarkMode ? '#3a3a3a' : '#ccc') : `rgba(${themeColorRgb}, 0.7)`,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 600,
                      boxShadow: saving ? 'none' : `0 4px 15px rgba(${themeColorRgb}, 0.3)`,
                      transition: 'all 0.3s ease',
                      opacity: saving ? 0.6 : 1,
                      minWidth: '150px'
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Rewards Settings'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* POS Settings Tab */}
      {activeTab === 'pos' && (
        <div style={{
          backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            marginBottom: '24px',
            fontSize: '20px',
            fontWeight: 600,
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
          }}>
            POS Setup
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Number of Registers */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: 500,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Number of Registers
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={posSettings.num_registers}
                onChange={(e) => setPosSettings({
                  ...posSettings,
                  num_registers: parseInt(e.target.value) || 1
                })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  fontSize: '14px'
                }}
              />
              <p style={{
                marginTop: '6px',
                fontSize: '12px',
                color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666'
              }}>
                How many registers or checkout stations do you have?
              </p>
            </div>

            {/* Register Type */}
            <div>
              <h3 style={{
                marginBottom: '12px',
                fontSize: '16px',
                fontWeight: 600,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Register Type
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="register_type"
                    value="one_screen"
                    checked={posSettings.register_type === 'one_screen'}
                    onChange={(e) => setPosSettings({ ...posSettings, register_type: e.target.value })}
                  />
                  <span style={{
                    fontSize: '14px',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    One Screen Register
                  </span>
                </label>
                <p style={{
                  marginLeft: '24px',
                  fontSize: '12px',
                  color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                  marginTop: '-8px'
                }}>
                  Single display screen for both cashier and customer view.
                </p>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="register_type"
                    value="two_screen"
                    checked={posSettings.register_type === 'two_screen'}
                    onChange={(e) => setPosSettings({ ...posSettings, register_type: e.target.value })}
                  />
                  <span style={{
                    fontSize: '14px',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    Two Screen Register
                  </span>
                </label>
                <p style={{
                  marginLeft: '24px',
                  fontSize: '12px',
                  color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                  marginTop: '-8px'
                }}>
                  Separate displays for cashier and customer.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`
            }}>
              <button
                onClick={savePosSettings}
                disabled={saving}
                style={{
                  padding: '12px 32px',
                  backgroundColor: saving ? (isDarkMode ? '#3a3a3a' : '#ccc') : `rgba(${themeColorRgb}, 0.7)`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  boxShadow: saving ? 'none' : `0 4px 15px rgba(${themeColorRgb}, 0.3)`,
                  transition: 'all 0.3s ease',
                  opacity: saving ? 0.6 : 1,
                  minWidth: '150px'
                }}
              >
                {saving ? 'Saving...' : 'Save POS Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Settings Tab */}
      {activeTab === 'sms' && (
        <div style={{
          backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{
              marginBottom: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
            }}>
              SMS CRM Settings
            </h2>
            {smsStores.length > 0 && (
              <select
                value={selectedSmsStore}
                onChange={(e) => {
                  setSelectedSmsStore(parseInt(e.target.value))
                  loadSmsSettings()
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}
              >
                {smsStores.map(store => (
                  <option key={store.store_id} value={store.store_id}>
                    {store.store_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* SMS Provider Selection */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '16px',
                fontWeight: 600,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                SMS Provider
              </label>
              <select
                value={smsSettings.sms_provider || 'email'}
                onChange={(e) => setSmsSettings({...smsSettings, sms_provider: e.target.value})}
                style={{
                  padding: '10px',
                  width: '100%',
                  maxWidth: '300px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  fontSize: '14px'
                }}
              >
                <option value="email">Email-to-SMS (FREE)</option>
                <option value="aws_sns">AWS SNS (~$0.006/SMS)</option>
              </select>
              <p style={{
                marginTop: '8px',
                fontSize: '13px',
                color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666'
              }}>
                {smsSettings.sms_provider === 'email' 
                  ? 'Free but limited reliability. Good for testing.'
                  : 'Low cost, high reliability. Recommended for production.'}
              </p>
            </div>

            {/* Email Settings */}
            {smsSettings.sms_provider === 'email' && (
              <>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    SMTP Server
                  </label>
                  <input
                    type="text"
                    value={smsSettings.smtp_server || 'smtp.gmail.com'}
                    onChange={(e) => setSmsSettings({...smsSettings, smtp_server: e.target.value})}
                    style={{
                      padding: '10px',
                      width: '100%',
                      maxWidth: '400px',
                      border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={smsSettings.smtp_port || 587}
                    onChange={(e) => setSmsSettings({...smsSettings, smtp_port: parseInt(e.target.value)})}
                    style={{
                      padding: '10px',
                      width: '100%',
                      maxWidth: '200px',
                      border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    Email Address (Gmail)
                  </label>
                  <input
                    type="email"
                    value={smsSettings.smtp_user || ''}
                    onChange={(e) => setSmsSettings({...smsSettings, smtp_user: e.target.value})}
                    placeholder="yourstore@gmail.com"
                    style={{
                      padding: '10px',
                      width: '100%',
                      maxWidth: '400px',
                      border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                      fontSize: '14px'
                    }}
                  />
                  <p style={{
                    marginTop: '4px',
                    fontSize: '12px',
                    color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666'
                  }}>
                    For Gmail: Enable 2FA and create an App Password
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    App Password
                  </label>
                  <input
                    type="password"
                    value={smsSettings.smtp_password || ''}
                    onChange={(e) => setSmsSettings({...smsSettings, smtp_password: e.target.value})}
                    placeholder="Enter app password"
                    style={{
                      padding: '10px',
                      width: '100%',
                      maxWidth: '400px',
                      border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </>
            )}

            {/* AWS Settings */}
            {smsSettings.sms_provider === 'aws_sns' && (
              <>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    AWS Access Key ID
                  </label>
                  <input
                    type="text"
                    value={smsSettings.aws_access_key_id || ''}
                    onChange={(e) => setSmsSettings({...smsSettings, aws_access_key_id: e.target.value})}
                    placeholder="AKIA..."
                    style={{
                      padding: '10px',
                      width: '100%',
                      maxWidth: '400px',
                      border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    AWS Secret Access Key
                  </label>
                  <input
                    type="password"
                    value={smsSettings.aws_secret_access_key || ''}
                    onChange={(e) => setSmsSettings({...smsSettings, aws_secret_access_key: e.target.value})}
                    placeholder="Enter secret key"
                    style={{
                      padding: '10px',
                      width: '100%',
                      maxWidth: '400px',
                      border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    AWS Region
                  </label>
                  <input
                    type="text"
                    value={smsSettings.aws_region || 'us-east-1'}
                    onChange={(e) => setSmsSettings({...smsSettings, aws_region: e.target.value})}
                    placeholder="us-east-1"
                    style={{
                      padding: '10px',
                      width: '100%',
                      maxWidth: '200px',
                      border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </>
            )}

            {/* Business Name */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Business Name
              </label>
              <input
                type="text"
                value={smsSettings.business_name || ''}
                onChange={(e) => setSmsSettings({...smsSettings, business_name: e.target.value})}
                placeholder="Your Store Name"
                style={{
                  padding: '10px',
                  width: '100%',
                  maxWidth: '400px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Auto-send Options */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={smsSettings.auto_send_rewards_earned || false}
                  onChange={(e) => setSmsSettings({...smsSettings, auto_send_rewards_earned: e.target.checked ? 1 : 0})}
                />
                <span style={{
                  fontSize: '14px',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Auto-send SMS when customers earn rewards
                </span>
              </label>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={smsSettings.auto_send_rewards_redeemed || false}
                  onChange={(e) => setSmsSettings({...smsSettings, auto_send_rewards_redeemed: e.target.checked ? 1 : 0})}
                />
                <span style={{
                  fontSize: '14px',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Auto-send SMS when customers redeem rewards
                </span>
              </label>
            </div>

            {/* Quick Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`
            }}>
              <button
                onClick={() => setShowSendSmsModal(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Send Test SMS
              </button>
            </div>

            {/* Save Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`
            }}>
              <button
                onClick={saveSmsSettings}
                disabled={saving}
                style={{
                  padding: '12px 32px',
                  backgroundColor: saving ? (isDarkMode ? '#3a3a3a' : '#ccc') : `rgba(${themeColorRgb}, 0.7)`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  boxShadow: saving ? 'none' : `0 4px 15px rgba(${themeColorRgb}, 0.3)`,
                  transition: 'all 0.3s ease',
                  opacity: saving ? 0.6 : 1,
                  minWidth: '150px'
                }}
              >
                {saving ? 'Saving...' : 'Save SMS Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send SMS Modal */}
      {showSendSmsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2 style={{
              marginTop: 0,
              color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
            }}>
              Send Test SMS
            </h2>
            <form onSubmit={handleSendSms}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Phone Number:
                </label>
                <input
                  type="tel"
                  value={sendSmsForm.phone_number}
                  onChange={(e) => setSendSmsForm({...sendSmsForm, phone_number: e.target.value})}
                  placeholder="(555) 123-4567"
                  required
                  style={{
                    padding: '10px',
                    width: '100%',
                    border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                    borderRadius: '6px',
                    backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Message:
                </label>
                <textarea
                  value={sendSmsForm.message_text}
                  onChange={(e) => setSendSmsForm({...sendSmsForm, message_text: e.target.value})}
                  rows={5}
                  required
                  style={{
                    padding: '10px',
                    width: '100%',
                    resize: 'vertical',
                    border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                    borderRadius: '6px',
                    backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                    fontSize: '14px'
                  }}
                />
                <p style={{
                  fontSize: '12px',
                  color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                  marginTop: '4px'
                }}>
                  {sendSmsForm.message_text.length}/160 characters
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  {saving ? 'Sending...' : 'Send'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSendSmsModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'cash' && (
        <div style={{
          backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            marginBottom: '24px',
            fontSize: '20px',
            fontWeight: 600,
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
          }}>
            Cash Register Settings
          </h2>

          {/* Register Cash Configuration */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              marginBottom: '16px',
              fontSize: '16px',
              fontWeight: 500,
              color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
            }}>
              Base Cash Configuration
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Register ID
              </label>
              <input
                type="number"
                min="1"
                value={cashSettings.register_id}
                onChange={(e) => setCashSettings({...cashSettings, register_id: parseInt(e.target.value) || 1})}
                style={{
                  padding: '10px',
                  width: '100%',
                  maxWidth: '200px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Cash Mode
              </label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="cash_mode"
                    value="total"
                    checked={cashSettings.cash_mode === 'total'}
                    onChange={(e) => setCashSettings({...cashSettings, cash_mode: e.target.value})}
                  />
                  <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Total Amount</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="cash_mode"
                    value="denominations"
                    checked={cashSettings.cash_mode === 'denominations'}
                    onChange={(e) => setCashSettings({...cashSettings, cash_mode: e.target.value})}
                  />
                  <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Denominations</span>
                </label>
              </div>
            </div>

            {cashSettings.cash_mode === 'total' ? (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Total Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashSettings.total_amount}
                  onChange={(e) => setCashSettings({...cashSettings, total_amount: parseFloat(e.target.value) || 0})}
                  style={{
                    padding: '10px',
                    width: '100%',
                    maxWidth: '200px',
                    border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                    borderRadius: '6px',
                    backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                    fontSize: '14px'
                  }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Bill and Coin Counts
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px'
                }}>
                  {Object.entries(cashSettings.denominations).map(([denom, count]) => (
                    <div key={denom}>
                      <label style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '12px',
                        color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666'
                      }}>
                        ${denom}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={count}
                        onChange={(e) => setCashSettings({
                          ...cashSettings,
                          denominations: {
                            ...cashSettings.denominations,
                            [denom]: parseInt(e.target.value) || 0
                          }
                        })}
                        style={{
                          padding: '8px',
                          width: '100%',
                          border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                          borderRadius: '6px',
                          backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                          color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : '#f5f5f5',
                  borderRadius: '6px'
                }}>
                  <strong style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                    Total: ${calculateTotalFromDenominations(cashSettings.denominations).toFixed(2)}
                  </strong>
                </div>
              </div>
            )}

            <button
              onClick={saveCashSettings}
              disabled={saving}
              style={{
                padding: '10px 20px',
                backgroundColor: themeColor,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {saving ? 'Saving...' : 'Save Cash Settings'}
            </button>
          </div>

          {/* Daily Cash Count */}
          <div style={{
            marginTop: '32px',
            paddingTop: '32px',
            borderTop: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`
          }}>
            <h3 style={{
              marginBottom: '16px',
              fontSize: '16px',
              fontWeight: 500,
              color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
            }}>
              Daily Cash Count / Drop
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Count Type
              </label>
              <select
                value={dailyCount.count_type}
                onChange={(e) => setDailyCount({...dailyCount, count_type: e.target.value})}
                style={{
                  padding: '10px',
                  width: '100%',
                  maxWidth: '200px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  fontSize: '14px'
                }}
              >
                <option value="drop">Drop</option>
                <option value="opening">Opening</option>
                <option value="closing">Closing</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Date
              </label>
              <input
                type="date"
                value={dailyCount.count_date}
                onChange={(e) => setDailyCount({...dailyCount, count_date: e.target.value})}
                style={{
                  padding: '10px',
                  width: '100%',
                  maxWidth: '200px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Total Amount ($) - or count denominations below
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={dailyCount.total_amount}
                onChange={(e) => setDailyCount({...dailyCount, total_amount: parseFloat(e.target.value) || 0})}
                style={{
                  padding: '10px',
                  width: '100%',
                  maxWidth: '200px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: 500,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Bill and Coin Counts
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px'
              }}>
                {Object.entries(dailyCount.denominations).map(([denom, count]) => (
                  <div key={denom}>
                    <label style={{
                      display: 'block',
                      marginBottom: '4px',
                      fontSize: '12px',
                      color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666'
                    }}>
                      ${denom}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={count}
                      onChange={(e) => {
                        const newDenoms = {
                          ...dailyCount.denominations,
                          [denom]: parseInt(e.target.value) || 0
                        }
                        setDailyCount({
                          ...dailyCount,
                          denominations: newDenoms,
                          total_amount: calculateTotalFromDenominations(newDenoms)
                        })
                      }}
                      style={{
                        padding: '8px',
                        width: '100%',
                        border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                        borderRadius: '6px',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : '#f5f5f5',
                borderRadius: '6px'
              }}>
                <strong style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                  Calculated Total: ${calculateTotalFromDenominations(dailyCount.denominations).toFixed(2)}
                </strong>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}>
                Notes (optional)
              </label>
              <textarea
                value={dailyCount.notes}
                onChange={(e) => setDailyCount({...dailyCount, notes: e.target.value})}
                style={{
                  padding: '10px',
                  width: '100%',
                  minHeight: '80px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : 'white',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="Additional notes about this count..."
              />
            </div>

            <button
              onClick={saveDailyCount}
              disabled={saving}
              style={{
                padding: '10px 20px',
                backgroundColor: themeColor,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {saving ? 'Saving...' : 'Save Daily Count'}
            </button>

            {/* Recent Counts */}
            {dailyCounts.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h4 style={{
                  marginBottom: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Recent Counts
                </h4>
                <div style={{
                  display: 'grid',
                  gap: '8px'
                }}>
                  {dailyCounts.slice(0, 5).map((count, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : '#f5f5f5',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>{count.count_type}</strong> - {count.count_date}</span>
                        <span>${parseFloat(count.total_amount || 0).toFixed(2)}</span>
                      </div>
                      {count.counted_by_name && (
                        <div style={{ fontSize: '12px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666', marginTop: '4px' }}>
                          Counted by: {count.counted_by_name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings

