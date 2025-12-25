import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import '../components/CustomerDisplay.css'

function CustomerDisplayPopup() {
  const [currentScreen, setCurrentScreen] = useState('transaction')
  const [cart, setCart] = useState([])
  const [subtotal, setSubtotal] = useState(0)
  const [tax, setTax] = useState(0)
  const [total, setTotal] = useState(0)
  const [totalWithTip, setTotalWithTip] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [originalPaymentMethod, setOriginalPaymentMethod] = useState(null) // Store the payment method used for the original payment
  const [selectedTip, setSelectedTip] = useState(0)
  const [tipSuggestions, setTipSuggestions] = useState([15, 18, 20, 25])
  const [tipEnabled, setTipEnabled] = useState(false)
  const [tipAfterPayment, setTipAfterPayment] = useState(false)
  const [amountDue, setAmountDue] = useState(0)
  const [cardStatus, setCardStatus] = useState('waiting')
  const [receiptType, setReceiptType] = useState(null)
  const [receiptContact, setReceiptContact] = useState('')
  const [socket, setSocket] = useState(null)
  const [transactionId, setTransactionId] = useState(null)
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  // Listen for messages from parent window
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'UPDATE_CART') {
        const data = event.data.data
        setCart(data.cart || [])
        setSubtotal(data.subtotal || 0)
        setTax(data.tax || 0)
        setTotal(data.total || 0)
        setTotalWithTip(data.totalWithTip || (data.total || 0) + (data.tip || 0))
        if (data.tip !== undefined) {
          setSelectedTip(data.tip || 0)
        }
        setPaymentMethod(data.paymentMethod)
        setAmountPaid(data.amountPaid || '')
        setPaymentCompleted(data.paymentCompleted || false)
        if (data.transactionId) {
          setTransactionId(data.transactionId)
        }
        
        // Auto-advance to payment method selection when payment form opens
        if (data.paymentMethod && !data.paymentCompleted) {
          if (currentScreen === 'transaction' || currentScreen === 'idle') {
            // Payment form is open, go to payment method selection
            setCurrentScreen('payment')
          }
        }
      } else if (event.data && event.data.type === 'PAYMENT_COMPLETED') {
        setPaymentCompleted(true)
        // Store the payment method that was used (from POS or from event data)
        if (event.data.data?.payment_method) {
          setOriginalPaymentMethod(event.data.data.payment_method)
        } else if (selectedPaymentMethod) {
          setOriginalPaymentMethod(selectedPaymentMethod)
        }
        // If we're on card screen, show approved
        if (currentScreen === 'card') {
          setCardStatus('approved')
          setTimeout(() => {
            setCurrentScreen('receipt')
          }, 2000)
        } else {
          // Otherwise go straight to receipt
          setCurrentScreen('receipt')
        }
      }
    }

    window.addEventListener('message', handleMessage)
    
    // Request initial data from parent
    if (window.opener) {
      window.opener.postMessage({ type: 'REQUEST_DATA' }, '*')
    }
    
    return () => window.removeEventListener('message', handleMessage)
  }, [currentScreen, tipEnabled, selectedTip])

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
        setPaymentCompleted(true)
        // Store the payment method that was used
        if (selectedPaymentMethod) {
          setOriginalPaymentMethod(selectedPaymentMethod)
        }
        setTimeout(() => {
          setCurrentScreen('receipt')
        }, 2000)
      }
    })
    
    newSocket.on('payment_success', () => {
      setPaymentCompleted(true)
      // Store the payment method that was used
      if (selectedPaymentMethod) {
        setOriginalPaymentMethod(selectedPaymentMethod)
      }
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
    const newTotalWithTip = total + selectedTip
    setTotalWithTip(newTotalWithTip)
    setAmountDue(newTotalWithTip)
  }, [total, selectedTip])

  // Auto-advance when payment is completed
  useEffect(() => {
    if (paymentCompleted) {
      if (currentScreen === 'card') {
        setCardStatus('approved')
        setTimeout(() => {
          setCurrentScreen('receipt')
        }, 2000)
      } else if (currentScreen === 'transaction' || currentScreen === 'payment' || currentScreen === 'tip') {
        setCurrentScreen('receipt')
      }
    }
  }, [paymentCompleted, currentScreen])

  const loadDisplaySettings = async () => {
    try {
      const response = await fetch('/api/customer-display/settings')
      const result = await response.json()
      if (result.success) {
        // Properly handle integer 0/1 from database
        const tipEnabledValue = result.data.tip_enabled === 1 || result.data.tip_enabled === true
        const tipAfterPaymentValue = result.data.tip_after_payment === 1 || result.data.tip_after_payment === true
        setTipEnabled(tipEnabledValue)
        setTipAfterPayment(tipAfterPaymentValue)
        if (result.data.tip_suggestions) {
          setTipSuggestions(Array.isArray(result.data.tip_suggestions) 
            ? result.data.tip_suggestions 
            : [15, 18, 20, 25])
        }
        // Debug logging
        console.log('Tip settings loaded:', {
          tipEnabled: tipEnabledValue,
          tipAfterPayment: tipAfterPaymentValue,
          raw: result.data
        })
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
    // Always go to payment method selection first
    setCurrentScreen('payment')
  }

  const selectTip = (percent) => {
    const tipAmount = (total * percent / 100).toFixed(2)
    const newTip = parseFloat(tipAmount)
    setSelectedTip(newTip)
    setAmountDue(total + newTip)
    
    // Notify POS about the selected tip
    if (window.opener) {
      window.opener.postMessage({
        type: 'TIP_SELECTED',
        data: { tip: newTip }
      }, '*')
    }
    
    // Proceed to payment processing with the selected payment method
    if (selectedPaymentMethod) {
      // Card payments (includes all card types)
      if (selectedPaymentMethod.method_type === 'card' || selectedPaymentMethod.requires_terminal) {
        setCurrentScreen('card')
        setCardStatus('waiting')
      } 
      // Cash payments
      else if (selectedPaymentMethod.method_type === 'cash') {
        setCurrentScreen('card')
        setCardStatus('waiting')
      }
      // Other payment methods (gift card, store credit)
      else {
        setCurrentScreen('card')
        setCardStatus('waiting')
      }
    } else {
      setCurrentScreen('payment')
    }
  }

  const skipTip = () => {
    setSelectedTip(0)
    setAmountDue(total)
    
    // Notify POS that tip was skipped
    if (window.opener) {
      window.opener.postMessage({
        type: 'TIP_SELECTED',
        data: { tip: 0 }
      }, '*')
    }
    
    // Proceed to payment processing with the selected payment method
    if (selectedPaymentMethod) {
      // Card payments (includes all card types)
      if (selectedPaymentMethod.method_type === 'card' || selectedPaymentMethod.requires_terminal) {
        setCurrentScreen('card')
        setCardStatus('waiting')
      } 
      // Cash payments
      else if (selectedPaymentMethod.method_type === 'cash') {
        setCurrentScreen('card')
        setCardStatus('waiting')
      }
      // Other payment methods (gift card, store credit)
      else {
        setCurrentScreen('card')
        setCardStatus('waiting')
      }
    } else {
      setCurrentScreen('payment')
    }
  }

  const selectPaymentMethod = (method) => {
    setSelectedPaymentMethod(method)
    
    // Debug logging
    console.log('Payment method selected:', {
      method: method.method_name,
      tipEnabled,
      selectedTip,
      willShowTip: tipEnabled && selectedTip === 0
    })
    
    // Show tip screen if enabled and no tip selected yet
    if (tipEnabled && selectedTip === 0) {
      console.log('Showing tip screen')
      setCurrentScreen('tip')
    } else {
      console.log('Skipping tip screen, going to payment processing')
      // Proceed directly to payment processing
      // Card payments (includes all card types)
      if (method.method_type === 'card' || method.requires_terminal) {
        setCurrentScreen('card')
        setCardStatus('waiting')
      } 
      // Cash payments
      else if (method.method_type === 'cash') {
        setCurrentScreen('card')
        setCardStatus('waiting')
      }
      // Other payment methods (gift card, store credit)
      else {
        setCurrentScreen('card')
        setCardStatus('waiting')
      }
    }
  }

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
      // Check if tip after payment is enabled
      if (tipAfterPayment) {
        setCurrentScreen('tip_after_payment')
      } else {
        showSuccessScreen()
      }
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

      // Check if tip after payment is enabled
      if (tipAfterPayment) {
        setCurrentScreen('tip_after_payment')
      } else {
        showSuccessScreen()
      }
    } catch (err) {
      console.error('Error saving receipt preference:', err)
      if (tipAfterPayment) {
        setCurrentScreen('tip_after_payment')
      } else {
        showSuccessScreen()
      }
    }
  }

  const selectTipAfterPayment = async (percent) => {
    const tipAmount = (total * percent / 100).toFixed(2)
    const newTip = parseFloat(tipAmount)
    
    // Process tip as additional payment using the original payment method
    const paymentMethodToUse = originalPaymentMethod || selectedPaymentMethod
    
    if (transactionId && paymentMethodToUse) {
      try {
        const sessionToken = localStorage.getItem('sessionToken') || sessionStorage.getItem('sessionToken')
        const response = await fetch('/api/payment/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({
            transaction_id: transactionId,
            payment_method_id: paymentMethodToUse.payment_method_id,
            amount: newTip,
            tip: newTip
          })
        })
        
        const result = await response.json()
        if (result.success) {
          setSelectedTip(newTip)
          showSuccessScreen()
        } else {
          // Even if tip processing fails, show success
          showSuccessScreen()
        }
      } catch (err) {
        console.error('Error processing tip:', err)
        showSuccessScreen()
      }
    } else {
      // If no payment method available, just show success
      showSuccessScreen()
    }
  }

  const skipTipAfterPayment = () => {
    showSuccessScreen()
  }

  const showSuccessScreen = () => {
    setCurrentScreen('success')
    // Notify parent window that receipt was selected
    if (window.opener) {
      window.opener.postMessage({ type: 'RECEIPT_SELECTED' }, '*')
    }
    setTimeout(() => {
      window.close()
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

  const calculateChange = () => {
    if (paymentMethod === 'cash' && amountPaid) {
      const paid = parseFloat(amountPaid) || 0
      return paid - totalWithTip
    }
    return 0
  }

  return (
    <div className="customer-display-container">
      {/* Transaction Screen */}
      {currentScreen === 'transaction' && (
        <div className="transaction-screen">
          <div className="screen-header">
            <h2>Your Items</h2>
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
              <span>${totalWithTip.toFixed(2)}</span>
            </div>
          </div>

          <button className="btn-primary" onClick={showPaymentScreen}>
            Proceed to Payment
          </button>
        </div>
      )}

      {/* Tip Screen - Shows after payment method selection */}
      {currentScreen === 'tip' && (
        <div className="payment-screen">
          <div className="screen-header">
            <h2>Add a tip?</h2>
            {selectedPaymentMethod && (
              <div style={{ fontSize: '16px', marginTop: '10px', opacity: 0.8 }}>
                Paying with {selectedPaymentMethod.method_name}
              </div>
            )}
            <div style={{ marginTop: '15px', fontSize: '18px', fontWeight: 500 }}>
              <div>Subtotal: ${subtotal.toFixed(2)}</div>
              <div>Tax: ${tax.toFixed(2)}</div>
              <div style={{ marginTop: '10px', fontSize: '20px', color: '#2e7d32' }}>
                Current Total: ${total.toFixed(2)}
              </div>
            </div>
          </div>
          
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
            <div className="tip-option" onClick={skipTip}>
              <div className="tip-percentage">No Tip</div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Selection */}
      {currentScreen === 'payment' && (
        <div className="payment-screen">
          <div className="screen-header">
            <h2>How would you like to pay?</h2>
            <div style={{ marginTop: '10px', fontSize: '14px', opacity: 0.8 }}>
              <div>Subtotal: ${subtotal.toFixed(2)}</div>
              <div>Tax: ${tax.toFixed(2)}</div>
              {selectedTip > 0 && (
                <div style={{ color: '#2e7d32' }}>Tip: ${selectedTip.toFixed(2)}</div>
              )}
            </div>
            <div className="amount-due" style={{ marginTop: '15px', fontSize: '28px' }}>
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
        <div className="card-processing-screen">
          <div className="card-animation">💳</div>
          <div className="card-instruction">
            {selectedPaymentMethod?.method_type === 'cash' 
              ? 'Please give cash to cashier'
              : selectedPaymentMethod?.method_type === 'card'
              ? 'Please insert, tap, or swipe your card'
              : `Processing ${selectedPaymentMethod?.method_name || 'payment'}...`}
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
        <div className="receipt-screen">
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

      {/* Tip After Payment Screen */}
      {currentScreen === 'tip_after_payment' && (
        <div className="payment-screen">
          <div className="screen-header">
            <h2>Add a tip?</h2>
            <div style={{ fontSize: '18px', marginTop: '10px', opacity: 0.9 }}>
              Payment completed successfully
            </div>
          </div>
          
          <div className="tip-options">
            {tipSuggestions.map((percent) => {
              const tipAmount = (total * percent / 100).toFixed(2)
              return (
                <div
                  key={percent}
                  className="tip-option"
                  onClick={() => selectTipAfterPayment(percent)}
                >
                  <div className="tip-percentage">{percent}%</div>
                  <div className="tip-amount">${tipAmount}</div>
                </div>
              )
            })}
            <div className="tip-option" onClick={skipTipAfterPayment}>
              <div className="tip-percentage">No Tip</div>
              <div className="tip-amount" style={{ fontSize: '20px' }}>Skip</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Screen */}
      {currentScreen === 'success' && (
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <div className="success-message">Payment Successful!</div>
          <div className="success-details">Thank you for your purchase</div>
        </div>
      )}
    </div>
  )
}

export default CustomerDisplayPopup

