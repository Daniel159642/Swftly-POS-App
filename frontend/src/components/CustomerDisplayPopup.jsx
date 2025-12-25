import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import './CustomerDisplay.css'

function CustomerDisplayPopup({ cart, subtotal, tax, total, tip: propTip, paymentMethod, amountPaid, onClose, onPaymentMethodSelect, onTipSelect, onReceiptSelect, onProceedToPayment, showSummary, employeeId, paymentCompleted, transactionId: propTransactionId }) {
  const [currentScreen, setCurrentScreen] = useState('transaction') // transaction, tip, payment, card, receipt, success
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [selectedTip, setSelectedTip] = useState(propTip || 0)
  const [tipSuggestions, setTipSuggestions] = useState([15, 18, 20, 25])
  const [tipEnabled, setTipEnabled] = useState(false)
  const [amountDue, setAmountDue] = useState(total)
  const [cardStatus, setCardStatus] = useState('waiting')
  const [receiptType, setReceiptType] = useState(null)
  const [receiptContact, setReceiptContact] = useState('')
  const [socket, setSocket] = useState(null)
  const [transactionId, setTransactionId] = useState(propTransactionId || null)
  const [showCustomTip, setShowCustomTip] = useState(false)
  const [customTipAmount, setCustomTipAmount] = useState('')

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io({
      transports: ['websocket', 'polling'],
      path: '/socket.io/'
    })
    
    newSocket.on('connect', () => {
      console.log('Customer display connected to Socket.IO')
      newSocket.emit('join', { room: 'customer_display' })
    })
    
    newSocket.on('disconnect', () => {
      console.log('Customer display disconnected')
    })
    
    newSocket.on('payment_processed', (data) => {
      if (data.success) {
        setCardStatus('approved')
        setTimeout(() => {
          setCurrentScreen('receipt')
        }, 2000)
      }
    })
    
    newSocket.on('payment_success', () => {
      setCurrentScreen('receipt')
    })
    
    newSocket.on('payment_error', () => {
      setCardStatus('declined')
    })
    
    setSocket(newSocket)
    
    return () => {
      newSocket.close()
    }
  }, [])

  useEffect(() => {
    loadDisplaySettings()
    loadPaymentMethods()
  }, [])

  useEffect(() => {
    // Update amount due when total or tip changes
    setAmountDue(total + selectedTip)
  }, [total, selectedTip])

  // Sync tip from props
  useEffect(() => {
    if (propTip !== undefined) {
      setSelectedTip(propTip)
    }
  }, [propTip])

  // Sync props to state when used inline (not as popup)
  useEffect(() => {
    // Don't interfere if we're already in payment flow
    if (currentScreen === 'payment' || currentScreen === 'card' || currentScreen === 'receipt' || currentScreen === 'success') {
      return
    }
    
    if (showSummary) {
      // Show tip screen first if enabled and no tip selected, otherwise show summary
      if (tipEnabled && selectedTip === 0 && currentScreen !== 'tip') {
        setCurrentScreen('tip')
      } else if (currentScreen !== 'tip') {
        setCurrentScreen('transaction')
      }
    } else if (cart && cart.length > 0) {
      // Cart has items, show transaction screen if we're on idle
      if (currentScreen === 'idle' || (!currentScreen && cart.length > 0)) {
        setCurrentScreen('transaction')
      }
    } else if (cart && cart.length === 0) {
      // Cart is empty, reset to transaction screen
      setCurrentScreen('transaction')
    }
  }, [cart, currentScreen, showSummary, tipEnabled, selectedTip])

  useEffect(() => {
    // Only show payment screens for card payments
    // Don't interfere if we're already on payment screen or in payment flow
    if (currentScreen === 'payment' || currentScreen === 'card' || currentScreen === 'receipt' || currentScreen === 'success') {
      return
    }
    
    if (paymentMethod === 'credit_card' && currentScreen === 'transaction' && !showSummary) {
      // Payment form opened for card, move to payment screen
      setCurrentScreen('payment')
    } else if (!paymentMethod && currentScreen === 'payment' && cart && cart.length > 0 && !showSummary) {
      // Payment form closed, go back to transaction (only if not in summary flow)
      setCurrentScreen('transaction')
    }
    // For cash payments, don't show customer display during payment - only at end for receipt
  }, [paymentMethod, currentScreen, cart, showSummary])

  useEffect(() => {
    if (paymentCompleted) {
      // For cash payments, show receipt screen immediately
      // For card payments, show approved then receipt
      if (paymentMethod === 'cash') {
        // Cash payment completed - show receipt screen
        setCurrentScreen('receipt')
      } else if (currentScreen === 'card') {
        // Card payment - show approved then receipt
        setCardStatus('approved')
        setTimeout(() => {
          setCurrentScreen('receipt')
        }, 2000)
      } else if (currentScreen === 'transaction' || currentScreen === 'payment' || currentScreen === 'tip') {
        // Otherwise go straight to receipt
        setCurrentScreen('receipt')
      }
    }
  }, [paymentCompleted, currentScreen, paymentMethod])

  useEffect(() => {
    if (propTransactionId) {
      setTransactionId(propTransactionId)
    }
  }, [propTransactionId])


  const loadDisplaySettings = async () => {
    try {
      const response = await fetch('/api/customer-display/settings')
      const result = await response.json()
      if (result.success) {
        setTipEnabled(result.data.tip_enabled || false)
        if (result.data.tip_suggestions) {
          setTipSuggestions(Array.isArray(result.data.tip_suggestions) 
            ? result.data.tip_suggestions 
            : [15, 18, 20, 25])
        }
      }
    } catch (err) {
      console.error('Error loading display settings:', err)
    }
  }

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods')
      const result = await response.json()
      if (result.success) {
        setPaymentMethods(result.data)
      }
    } catch (err) {
      console.error('Error loading payment methods:', err)
    }
  }

  const showPaymentScreen = () => {
    setAmountDue(total + selectedTip)
    // Notify POS that we're proceeding to payment (this will set showSummary to false)
    if (onProceedToPayment) {
      onProceedToPayment()
    }
    // Show payment method selection screen
    setCurrentScreen('payment')
  }

  const selectTip = (percent) => {
    const tipAmount = (total * percent / 100).toFixed(2)
    setSelectedTip(parseFloat(tipAmount))
    // After selecting tip, show summary screen
    setCurrentScreen('transaction')
    setAmountDue(total + parseFloat(tipAmount))
    setShowCustomTip(false)
    setCustomTipAmount('')
    if (onTipSelect) {
      onTipSelect(parseFloat(tipAmount))
    }
  }

  const skipTip = () => {
    setSelectedTip(0)
    // After skipping tip, show summary screen
    setCurrentScreen('transaction')
    setAmountDue(total)
    setShowCustomTip(false)
    setCustomTipAmount('')
    if (onTipSelect) {
      onTipSelect(0)
    }
  }

  const handleCustomTipInput = (value) => {
    // Only allow numbers and one decimal point
    const cleaned = value.replace(/[^0-9.]/g, '')
    // Ensure only one decimal point
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      return // Invalid input, don't update
    }
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return // Too many decimal places, don't update
    }
    setCustomTipAmount(cleaned)
  }

  const applyCustomTip = () => {
    const tipValue = parseFloat(customTipAmount) || 0
    if (tipValue > 0) {
      setSelectedTip(tipValue)
      setAmountDue(total + tipValue)
      setShowCustomTip(false)
      setCustomTipAmount('')
      // After selecting custom tip, show summary screen
      setCurrentScreen('transaction')
      if (onTipSelect) {
        onTipSelect(tipValue)
      }
    }
  }

  const selectPaymentMethod = async (method) => {
    setSelectedPaymentMethod(method)
    if (onPaymentMethodSelect) {
      onPaymentMethodSelect(method)
    }
    
    if (method.requires_terminal || method.method_type === 'card') {
      setCurrentScreen('card')
      setCardStatus('waiting')
      
      // For card payments, wait for POS to process
      // The POS will trigger payment processing
    } else if (method.method_type === 'cash') {
      setCurrentScreen('card')
      setCardStatus('waiting')
      // For cash, hide customer display - cashier handles everything
      // Customer display will show again at end for receipt
      // The onPaymentMethodSelect callback will handle hiding the display
    }
  }

  // Process payment when cashier completes it
  const processPayment = async () => {
    if (!selectedPaymentMethod || !transactionId) return
    
    setCardStatus('processing')
    
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          payment_method_id: selectedPaymentMethod.payment_method_id,
          amount: paymentMethod === 'cash' ? parseFloat(amountPaid) : (total + selectedTip),
          tip: selectedTip
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.data.success) {
        setCardStatus('approved')
        setTimeout(() => {
          setCurrentScreen('receipt')
        }, 2000)
      } else {
        setCardStatus('declined')
      }
    } catch (err) {
      console.error('Payment processing error:', err)
      setCardStatus('declined')
    }
  }

  // Auto-advance when payment is completed from POS
  useEffect(() => {
    if (paymentCompleted) {
      // If we're on card screen, show approved and move to receipt
      if (currentScreen === 'card') {
        setCardStatus('approved')
        setTimeout(() => {
          setCurrentScreen('receipt')
        }, 2000)
      }
      // If we're still on transaction or payment screen, skip to receipt
      else if (currentScreen === 'transaction' || currentScreen === 'payment' || currentScreen === 'tip') {
        setCurrentScreen('receipt')
      }
    }
  }, [paymentCompleted, currentScreen])

  const selectReceipt = (type) => {
    setReceiptType(type)
    if (type === 'email' || type === 'sms') {
      // Show input field (handled in render)
    } else {
      submitReceiptPreference(type)
    }
  }

  const submitReceiptPreference = async (type = receiptType, contact = receiptContact) => {
    if (!transactionId) {
      // If no transaction ID, just call the callback
      if (onReceiptSelect) {
        onReceiptSelect(type, contact)
      }
      showSuccessScreen()
      return
    }

    try {
      await fetch('/api/receipt/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          receipt_type: type,
          email: type === 'email' ? contact : null,
          phone: type === 'sms' ? contact : null
        })
      })

      if (onReceiptSelect) {
        onReceiptSelect(type, contact)
      }
      showSuccessScreen()
    } catch (err) {
      console.error('Error saving receipt preference:', err)
      showSuccessScreen()
    }
  }

  const showSuccessScreen = () => {
    setCurrentScreen('success')
    setTimeout(() => {
      if (onClose) {
        onClose()
      }
    }, 3000)
  }

  const paymentMethodIcons = {
    'card': '💳',
    'cash': '💵',
    'mobile_wallet': '📱',
    'gift_card': '🎁',
    'store_credit': '💰',
    'check': '📝'
  }

  // Calculate change for cash payments
  const calculateChange = () => {
    if (paymentMethod === 'cash' && amountPaid) {
      const paid = parseFloat(amountPaid) || 0
      return paid - (total + selectedTip)
    }
    return 0
  }

  return (
    <div style={{ 
      height: '100vh', 
      width: '100%', 
      overflow: 'auto',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="customer-display-popup-container" style={{ 
        maxWidth: '100%', 
        maxHeight: '100%', 
        borderRadius: '0', 
        padding: '20px',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>
        {/* Transaction Screen - Summary before payment */}
        {currentScreen === 'transaction' && (
          <div className="transaction-screen-popup">
            <div className="screen-header">
              <h2>Review Your Order</h2>
              <p style={{ fontSize: '18px', opacity: 0.9, marginTop: '10px' }}>Please review your items before proceeding to payment</p>
            </div>
            
            <div className="items-list">
              {cart.map((item, idx) => (
                <div key={idx} className="item-row">
                  <span className="item-name">{item.product_name}</span>
                  <span className="item-quantity">× {item.quantity}</span>
                  <span className="item-price">${(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="totals-section">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              {selectedTip > 0 && (
                <div className="total-row" style={{ color: '#2e7d32' }}>
                  <span>Tip:</span>
                  <span>${selectedTip.toFixed(2)}</span>
                </div>
              )}
              <div className="total-row final">
                <span>Total:</span>
                <span>${(total + selectedTip).toFixed(2)}</span>
              </div>
            </div>

            <button className="btn-primary" onClick={showPaymentScreen} style={{ marginTop: '20px' }}>
              Proceed to Payment
            </button>
          </div>
        )}

        {/* Tip Screen */}
        {currentScreen === 'tip' && (
          <div className="payment-screen-popup">
            <div className="screen-header">
              <h2>Add a tip?</h2>
            </div>
            
            {!showCustomTip ? (
              <>
                <div className="tip-options">
                  {tipSuggestions.map((percent) => {
                    const tipAmount = (total * percent / 100).toFixed(2)
                    return (
                      <div
                        key={percent}
                        className="tip-option"
                        onClick={() => selectTip(percent)}
                      >
                        <div className="tip-percentage">{percent}%</div>
                        <div className="tip-amount">${tipAmount}</div>
                      </div>
                    )
                  })}
                  <div className="tip-option" onClick={() => setShowCustomTip(true)}>
                    <div className="tip-percentage">Custom</div>
                    <div className="tip-amount" style={{ fontSize: '20px' }}>Enter Amount</div>
                  </div>
                  <div className="tip-option" onClick={skipTip}>
                    <div className="tip-percentage">No Tip</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                <div style={{ 
                  fontSize: '24px', 
                  marginBottom: '20px',
                  color: '#333'
                }}>
                  Enter custom tip amount
                </div>
                <div style={{
                  width: '100%',
                  marginBottom: '20px'
                }}>
                  <input
                    type="text"
                    value={customTipAmount}
                    onChange={(e) => handleCustomTipInput(e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '20px',
                      fontSize: '32px',
                      fontFamily: 'monospace',
                      textAlign: 'center',
                      border: '3px solid rgba(102, 126, 234, 0.5)',
                      borderRadius: '15px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: '#333',
                      fontWeight: 600
                    }}
                    autoFocus
                  />
                  {customTipAmount && parseFloat(customTipAmount) > 0 && (
                    <div style={{
                      marginTop: '10px',
                      fontSize: '18px',
                      color: '#333',
                      textAlign: 'center'
                    }}>
                      Tip: ${parseFloat(customTipAmount || 0).toFixed(2)}
                    </div>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  width: '100%'
                }}>
                  <button
                    onClick={() => {
                      setShowCustomTip(false)
                      setCustomTipAmount('')
                    }}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      border: '2px solid white'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={applyCustomTip}
                    disabled={!customTipAmount || parseFloat(customTipAmount) <= 0}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      backgroundColor: parseFloat(customTipAmount) > 0 ? 'white' : 'rgba(255, 255, 255, 0.3)',
                      color: parseFloat(customTipAmount) > 0 ? '#667eea' : 'white',
                      cursor: parseFloat(customTipAmount) > 0 ? 'pointer' : 'not-allowed',
                      opacity: parseFloat(customTipAmount) > 0 ? 1 : 0.5
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Method Selection */}
        {currentScreen === 'payment' && (
          <div className="payment-screen-popup">
            <div className="screen-header">
              <h2>How would you like to pay?</h2>
              <div style={{ marginTop: '10px', fontSize: '16px', opacity: 0.9 }}>
                <div>Subtotal: ${subtotal.toFixed(2)}</div>
                <div>Tax: ${tax.toFixed(2)}</div>
                {selectedTip > 0 && (
                  <div style={{ color: '#2e7d32' }}>Tip: ${selectedTip.toFixed(2)}</div>
                )}
              </div>
              <div className="amount-due" style={{ marginTop: '15px', fontSize: '36px' }}>
                Total: ${amountDue.toFixed(2)}
              </div>
            </div>
            
            <div className="payment-methods">
              {paymentMethods.map((method) => (
                <div
                  key={method.payment_method_id}
                  className={`payment-method ${selectedPaymentMethod?.payment_method_id === method.payment_method_id ? 'selected' : ''}`}
                  onClick={() => selectPaymentMethod(method)}
                >
                  <div className="payment-method-icon">
                    {paymentMethodIcons[method.method_type] || '💳'}
                  </div>
                  <div className="payment-method-name">{method.method_name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card Processing Screen */}
        {currentScreen === 'card' && (
          <div className="card-processing-screen-popup">
            <div className="card-animation">💳</div>
            <div className="card-instruction">
              {selectedPaymentMethod?.method_type === 'cash' 
                ? 'Please give cash to cashier'
                : 'Please insert, tap, or swipe your card'}
            </div>
            <div className="card-status">
              {cardStatus === 'waiting' && 'Waiting for card...'}
              {cardStatus === 'reading' && 'Reading card...'}
              {cardStatus === 'processing' && 'Processing payment...'}
              {cardStatus === 'approved' && 'Payment approved!'}
              {cardStatus === 'declined' && 'Payment declined. Please try again.'}
            </div>
            {selectedPaymentMethod?.method_type === 'cash' && amountPaid && (
              <div style={{ marginTop: '30px', fontSize: '24px', fontWeight: 600 }}>
                Amount Paid: ${parseFloat(amountPaid || 0).toFixed(2)}
                {calculateChange() >= 0 && (
                  <div style={{ color: '#2e7d32', marginTop: '10px' }}>
                    Change: ${calculateChange().toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Receipt Screen */}
        {currentScreen === 'receipt' && (
          <div className="receipt-screen-popup">
            <div className="screen-header">
              <h2>Would you like a receipt?</h2>
            </div>
            
            <div className="receipt-options">
              <div className="receipt-option" onClick={() => selectReceipt('printed')}>
                <div className="receipt-icon">🖨️</div>
                <div className="receipt-label">Print Receipt</div>
              </div>
              
              <div className="receipt-option" onClick={() => selectReceipt('email')}>
                <div className="receipt-icon">📧</div>
                <div className="receipt-label">Email Receipt</div>
              </div>
              
              <div className="receipt-option" onClick={() => selectReceipt('sms')}>
                <div className="receipt-icon">📱</div>
                <div className="receipt-label">Text Receipt</div>
              </div>
              
              <div className="receipt-option" onClick={() => selectReceipt('none')}>
                <div className="receipt-icon">🚫</div>
                <div className="receipt-label">No Receipt</div>
              </div>
            </div>
            
            {(receiptType === 'email' || receiptType === 'sms') && (
              <div className="receipt-input">
                <input
                  type={receiptType === 'email' ? 'email' : 'tel'}
                  placeholder={receiptType === 'email' ? 'Enter your email' : 'Enter your phone number'}
                  value={receiptContact}
                  onChange={(e) => setReceiptContact(e.target.value)}
                />
                <button className="btn-primary" onClick={() => submitReceiptPreference()}>
                  Submit
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success Screen */}
        {currentScreen === 'success' && (
          <div className="success-screen-popup">
            <div className="success-icon">✓</div>
            <div className="success-message">Payment Successful!</div>
            <div className="success-details">Thank you for your purchase</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerDisplayPopup

