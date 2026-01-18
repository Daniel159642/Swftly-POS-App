import { useState, useEffect } from 'react'

function SMS() {
  const [messages, setMessages] = useState([])
  const [templates, setTemplates] = useState([])
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState(1)
  const [settings, setSettings] = useState({})
  const [activeTab, setActiveTab] = useState('settings')
  const [showSendModal, setShowSendModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [sendForm, setSendForm] = useState({
    phone_number: '',
    message_text: '',
    customer_id: null
  })
  const [templateForm, setTemplateForm] = useState({
    template_name: '',
    template_text: '',
    category: 'rewards'
  })

  const sessionToken = localStorage.getItem('sessionToken')

  useEffect(() => {
    loadStores()
    loadSettings()
    loadMessages()
    loadTemplates()
  }, [selectedStore])

  const loadStores = async () => {
    try {
      const response = await fetch('/api/sms/stores')
      const data = await response.json()
      if (Array.isArray(data)) {
        setStores(data)
        if (data.length > 0 && !selectedStore) {
          setSelectedStore(data[0].store_id)
        }
      }
    } catch (error) {
      console.error('Error loading stores:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/sms/settings/${selectedStore}`)
      const data = await response.json()
      setSettings(data || {
        sms_provider: 'email',
        smtp_server: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_use_tls: 1,
        auto_send_rewards_earned: 1,
        auto_send_rewards_redeemed: 1
      })
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/sms/messages?store_id=${selectedStore}&limit=50`)
      const data = await response.json()
      if (Array.isArray(data)) {
        setMessages(data)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/sms/templates?store_id=${selectedStore}`)
      const data = await response.json()
      if (Array.isArray(data)) {
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/sms/settings/${selectedStore}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          ...settings,
          session_token: sessionToken
        })
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
        loadSettings()
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSendSMS = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          ...sendForm,
          store_id: selectedStore,
          session_token: sessionToken
        })
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: 'SMS sent successfully!' })
        setShowSendModal(false)
        setSendForm({ phone_number: '', message_text: '', customer_id: null })
        loadMessages()
      } else {
        setMessage({ type: 'error', text: result.message || result.error || 'Failed to send SMS' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error sending SMS: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/sms/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          ...templateForm,
          store_id: selectedStore,
          session_token: sessionToken
        })
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: 'Template created successfully!' })
        setShowTemplateModal(false)
        setTemplateForm({ template_name: '', template_text: '', category: 'rewards' })
        loadTemplates()
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to create template' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating template: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleMigrateToAWS = async () => {
    if (!confirm('Migrate this store from Email to AWS SNS? You will need AWS credentials.')) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/sms/migrate-to-aws/${selectedStore}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          aws_access_key_id: settings.aws_access_key_id,
          aws_secret_access_key: settings.aws_secret_access_key,
          aws_region: settings.aws_region || 'us-east-1',
          session_token: sessionToken
        })
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: 'Migrated to AWS SNS successfully!' })
        loadSettings()
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to migrate' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error migrating: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>SMS CRM</h1>
        {stores.length > 0 && (
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(parseInt(e.target.value))}
            style={{ padding: '8px 12px', fontSize: '16px' }}
          >
            {stores.map(store => (
              <option key={store.store_id} value={store.store_id}>
                {store.store_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'settings' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'settings' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'messages' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'messages' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Messages
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'templates' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'templates' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Templates
        </button>
        <button
          onClick={() => setShowSendModal(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Send SMS
        </button>
      </div>

      {activeTab === 'settings' && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>SMS Settings</h2>
          <form onSubmit={handleSaveSettings}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                SMS Provider:
              </label>
              <select
                value={settings.sms_provider || 'email'}
                onChange={(e) => setSettings({...settings, sms_provider: e.target.value})}
                style={{ padding: '8px', width: '100%', maxWidth: '300px' }}
              >
                <option value="email">Email-to-SMS (FREE)</option>
                <option value="aws_sns">AWS SNS (~$0.006/SMS)</option>
              </select>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {settings.sms_provider === 'email' 
                  ? 'Free but limited reliability. Good for testing.'
                  : 'Low cost, high reliability. Recommended for production.'}
              </p>
            </div>

            {settings.sms_provider === 'email' ? (
              <>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    SMTP Server:
                  </label>
                  <input
                    type="text"
                    value={settings.smtp_server || 'smtp.gmail.com'}
                    onChange={(e) => setSettings({...settings, smtp_server: e.target.value})}
                    style={{ padding: '8px', width: '100%', maxWidth: '400px' }}
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    SMTP Port:
                  </label>
                  <input
                    type="number"
                    value={settings.smtp_port || 587}
                    onChange={(e) => setSettings({...settings, smtp_port: parseInt(e.target.value)})}
                    style={{ padding: '8px', width: '100%', maxWidth: '200px' }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Email Address (Gmail):
                  </label>
                  <input
                    type="email"
                    value={settings.smtp_user || ''}
                    onChange={(e) => setSettings({...settings, smtp_user: e.target.value})}
                    style={{ padding: '8px', width: '100%', maxWidth: '400px' }}
                    placeholder="yourstore@gmail.com"
                  />
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    For Gmail: Enable 2FA and create an App Password
                  </p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    App Password:
                  </label>
                  <input
                    type="password"
                    value={settings.smtp_password === '***' ? '' : (settings.smtp_password || '')}
                    onChange={(e) => setSettings({...settings, smtp_password: e.target.value})}
                    style={{ padding: '8px', width: '100%', maxWidth: '400px' }}
                    placeholder={settings.smtp_password === '***' ? 'Leave blank to keep current' : 'Enter app password'}
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    AWS Access Key ID:
                  </label>
                  <input
                    type="text"
                    value={settings.aws_access_key_id || ''}
                    onChange={(e) => setSettings({...settings, aws_access_key_id: e.target.value})}
                    style={{ padding: '8px', width: '100%', maxWidth: '400px' }}
                    placeholder="AKIA..."
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    AWS Secret Access Key:
                  </label>
                  <input
                    type="password"
                    value={settings.aws_secret_access_key === '***' ? '' : (settings.aws_secret_access_key || '')}
                    onChange={(e) => setSettings({...settings, aws_secret_access_key: e.target.value})}
                    style={{ padding: '8px', width: '100%', maxWidth: '400px' }}
                    placeholder={settings.aws_secret_access_key === '***' ? 'Leave blank to keep current' : 'Enter secret key'}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    AWS Region:
                  </label>
                  <input
                    type="text"
                    value={settings.aws_region || 'us-east-1'}
                    onChange={(e) => setSettings({...settings, aws_region: e.target.value})}
                    style={{ padding: '8px', width: '100%', maxWidth: '200px' }}
                    placeholder="us-east-1"
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Business Name:
              </label>
              <input
                type="text"
                value={settings.business_name || ''}
                onChange={(e) => setSettings({...settings, business_name: e.target.value})}
                style={{ padding: '8px', width: '100%', maxWidth: '400px' }}
                placeholder="Your Store Name"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={settings.auto_send_rewards_earned || false}
                  onChange={(e) => setSettings({...settings, auto_send_rewards_earned: e.target.checked ? 1 : 0})}
                />
                Auto-send SMS when customers earn rewards
              </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={settings.auto_send_rewards_redeemed || false}
                  onChange={(e) => setSettings({...settings, auto_send_rewards_redeemed: e.target.checked ? 1 : 0})}
                />
                Auto-send SMS when customers redeem rewards
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>

              {settings.sms_provider === 'email' && (
                <button
                  type="button"
                  onClick={handleMigrateToAWS}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  Migrate to AWS SNS
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {activeTab === 'messages' && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>Message History</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Message</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Provider</th>
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      No messages yet
                    </td>
                  </tr>
                ) : (
                  messages.map(msg => (
                    <tr key={msg.message_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>
                        {new Date(msg.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px' }}>{msg.phone_number}</td>
                      <td style={{ padding: '12px' }}>{msg.customer_name || '-'}</td>
                      <td style={{ padding: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {msg.message_text.substring(0, 50)}...
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: msg.status === 'sent' ? '#d4edda' : msg.status === 'failed' ? '#f8d7da' : '#fff3cd',
                          color: msg.status === 'sent' ? '#155724' : msg.status === 'failed' ? '#721c24' : '#856404'
                        }}>
                          {msg.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{msg.provider || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Templates</h2>
            <button
              onClick={() => setShowTemplateModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create Template
            </button>
          </div>
          {templates.length === 0 ? (
            <p style={{ color: '#666' }}>No templates yet. Create one to get started.</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {templates.map(tpl => (
                <div key={tpl.template_id} style={{ padding: '15px', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{tpl.template_name}</h3>
                  <p style={{ margin: '0', color: '#666' }}>{tpl.template_text}</p>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '10px',
                    padding: '4px 8px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {tpl.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showSendModal && (
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
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0 }}>Send SMS</h2>
            <form onSubmit={handleSendSMS}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Phone Number:
                </label>
                <input
                  type="tel"
                  value={sendForm.phone_number}
                  onChange={(e) => setSendForm({...sendForm, phone_number: e.target.value})}
                  style={{ padding: '8px', width: '100%' }}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Message:
                </label>
                <textarea
                  value={sendForm.message_text}
                  onChange={(e) => setSendForm({...sendForm, message_text: e.target.value})}
                  rows={5}
                  style={{ padding: '8px', width: '100%', resize: 'vertical' }}
                  placeholder="Enter your message..."
                  required
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {sendForm.message_text.length}/160 characters
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTemplateModal && (
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
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0 }}>Create Template</h2>
            <form onSubmit={handleCreateTemplate}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Template Name:
                </label>
                <input
                  type="text"
                  value={templateForm.template_name}
                  onChange={(e) => setTemplateForm({...templateForm, template_name: e.target.value})}
                  style={{ padding: '8px', width: '100%' }}
                  placeholder="Rewards Earned"
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Message Template:
                </label>
                <textarea
                  value={templateForm.template_text}
                  onChange={(e) => setTemplateForm({...templateForm, template_text: e.target.value})}
                  rows={5}
                  style={{ padding: '8px', width: '100%', resize: 'vertical' }}
                  placeholder="Hi {customer_name}! You earned {points_earned} points!"
                  required
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Use {'{customer_name}'}, {'{points_earned}'}, {'{total_points}'} as variables
                </p>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Category:
                </label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({...templateForm, category: e.target.value})}
                  style={{ padding: '8px', width: '100%' }}
                >
                  <option value="rewards">Rewards</option>
                  <option value="promotion">Promotion</option>
                  <option value="reminder">Reminder</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Creating...' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SMS
