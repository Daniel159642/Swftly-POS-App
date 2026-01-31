import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { 
  Settings as SettingsIcon, 
  MapPin, 
  Monitor, 
  Gift, 
  ShoppingCart, 
  MessageSquare, 
  DollarSign,
  ChevronRight,
  ChevronDown,
  PanelLeft,
  CheckCircle,
  XCircle,
  Printer,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  X
} from 'lucide-react'
import { FormTitle, FormLabel, FormField, inputBaseStyle, getInputFocusHandlers } from '../components/FormStyles'
import Table from '../components/Table'
import '../components/CustomerDisplayButtons.css'

function CustomDropdown({ value, onChange, options, placeholder, required, isDarkMode, themeColorRgb, style = {} }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedOption = options.find(opt => (opt.value ?? opt.id) === value)
  const optionValue = (opt) => opt.value ?? opt.id

  return (
    <div ref={dropdownRef} style={{ position: 'relative', ...style }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: style.padding || '8px 14px',
          border: `1px solid ${isOpen ? `rgba(${themeColorRgb}, 0.5)` : (isDarkMode ? 'var(--border-color, #404040)' : '#ddd')}`,
          borderRadius: '8px',
          fontSize: style.fontSize || '14px',
          ...(style.padding && { padding: style.padding }),
          ...(style.fontSize && { fontSize: style.fontSize }),
          backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
          color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
          transition: 'all 0.2s ease',
          outline: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflow: 'hidden',
          ...(isOpen && { boxShadow: `0 0 0 3px rgba(${themeColorRgb}, 0.1)` })
        }}
        onMouseEnter={(e) => {
            if (!isOpen) {
              e.currentTarget.style.border = `1px solid rgba(${themeColorRgb}, 0.3)`
            }
          }}
        onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.border = isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd'
            }
          }}
      >
        <span style={{
          color: selectedOption ? (isDarkMode ? 'var(--text-primary, #fff)' : '#333') : (isDarkMode ? 'var(--text-tertiary, #999)' : '#999'),
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
          position: 'relative'
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          style={{ 
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
            flexShrink: 0,
            marginLeft: '8px'
          }} 
        />
      </div>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
            border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 99999,
            maxHeight: '200px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {options.map((option) => {
            const val = optionValue(option)
            return (
            <div
              key={val}
              onClick={() => {
                onChange({ target: { value: val } })
                setIsOpen(false)
              }}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '14px',
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                backgroundColor: value === val
                  ? `rgba(${themeColorRgb}, 0.2)`
                  : 'transparent',
                transition: 'background-color 0.15s ease',
                borderLeft: value === val
                  ? `3px solid rgba(${themeColorRgb}, 0.7)`
                  : '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (value !== val) {
                  e.target.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (value !== val) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {option.label}
            </div>
          )
          })}
        </div>
      )}
    </div>
  )
}

const DEFAULT_RECEIPT_TEMPLATE = {
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
  show_signature: false,
  header_alignment: 'center',
  font_family: 'monospace',
  font_size: 12,
  show_item_descriptions: false,
  show_item_skus: true,
  tax_line_display: 'breakdown',
  footer_alignment: 'center',
  receipt_width: 80,
  line_spacing: 1.2,
  bold_item_names: true,
  divider_style: 'dashed',
  template_preset: 'custom',
  store_logo: '',
  store_name_font: 'monospace',
  store_name_bold: true,
  store_name_italic: false,
  store_name_align: 'center',
  store_name_font_size: 14,
  store_address_font: 'monospace',
  store_address_bold: false,
  store_address_italic: false,
  store_address_align: 'center',
  store_address_font_size: 12,
  store_phone_font: 'monospace',
  store_phone_bold: false,
  store_phone_italic: false,
  store_phone_align: 'center',
  store_phone_font_size: 12,
  footer_message_font: 'monospace',
  footer_message_bold: false,
  footer_message_italic: false,
  footer_message_align: 'center',
  footer_message_font_size: 12,
  return_policy_font: 'monospace',
  return_policy_bold: false,
  return_policy_italic: false,
  return_policy_align: 'center',
  return_policy_font_size: 12,
  store_website_font: 'monospace',
  store_website_bold: false,
  store_website_italic: false,
  store_website_align: 'center',
  store_website_font_size: 12,
  store_email_font: 'monospace',
  store_email_bold: false,
  store_email_italic: false,
  store_email_align: 'center',
  store_email_font_size: 12,
  // Body element formatting
  item_name_font: 'monospace',
  item_name_bold: true,
  item_name_italic: false,
  item_name_align: 'left',
  item_name_font_size: 12,
  item_desc_font: 'monospace',
  item_desc_bold: false,
  item_desc_italic: true,
  item_desc_align: 'left',
  item_desc_font_size: 10,
  item_sku_font: 'monospace',
  item_sku_bold: false,
  item_sku_italic: false,
  item_sku_align: 'left',
  item_sku_font_size: 10,
  item_price_font: 'monospace',
  item_price_bold: false,
  item_price_italic: false,
  item_price_align: 'right',
  item_price_font_size: 12,
  subtotal_font: 'monospace',
  subtotal_bold: false,
  subtotal_italic: false,
  subtotal_align: 'right',
  subtotal_font_size: 12,
  tax_font: 'monospace',
  tax_bold: false,
  tax_italic: false,
  tax_align: 'right',
  tax_font_size: 12,
  total_font: 'monospace',
  total_bold: true,
  total_italic: false,
  total_align: 'right',
  total_font_size: 14,
  payment_method_font: 'monospace',
  payment_method_bold: false,
  payment_method_italic: false,
  payment_method_align: 'center',
  payment_method_font_size: 11,
  date_line_font: 'monospace',
  date_line_bold: false,
  date_line_italic: false,
  date_line_align: 'center',
  date_line_font_size: 10,
  show_barcode: true,
  // Signature
  show_signature_title: true,
  signature_title_font: 'monospace',
  signature_title_bold: false,
  signature_title_italic: false,
  signature_title_align: 'left',
  signature_title_font_size: 10,
  // Payment preview: card | cash
  preview_payment_type: 'card',
  show_cash_amount_given: true,
  show_cash_change: true,
  cash_amount_given_font: 'monospace',
  cash_amount_given_bold: false,
  cash_amount_given_italic: false,
  cash_amount_given_align: 'center',
  cash_amount_given_font_size: 11,
  cash_change_font: 'monospace',
  cash_change_bold: false,
  cash_change_italic: false,
  cash_change_align: 'center',
  cash_change_font_size: 11
}

const SAMPLE_LINE_ITEMS = [
  { name: 'Organic Coffee Beans', sku: 'SKU-001', price: 12.99, qty: 2, desc: 'Medium roast' },
  { name: 'Almond Milk', sku: 'SKU-002', price: 4.49, qty: 1 },
  { name: 'Croissant', sku: 'SKU-003', price: 3.50, qty: 3, desc: 'Butter' }
]

// Code 128 Barcode Generator
const CODE128_PATTERNS = {
  '0': '11011001100', '1': '11001101100', '2': '11001100110', '3': '10010011000',
  '4': '10010001100', '5': '10001001100', '6': '10011001000', '7': '10011000100',
  '8': '10001100100', '9': '11001001000', 'A': '11001000100', 'B': '11000100100',
  'C': '10110011100', 'D': '10011011100', 'E': '10011001110', 'F': '10111001100',
  'G': '10011101100', 'H': '10011100110', 'I': '11001110010', 'J': '11001011100',
  'K': '11001001110', 'L': '11011100100', 'M': '11001110100', 'N': '11101101110',
  'O': '11101001100', 'P': '11100101100', 'Q': '11100100110', 'R': '11101100100',
  'S': '11100110100', 'T': '11100110010', 'U': '11011011000', 'V': '11011000110',
  'W': '11000110110', 'X': '10100011000', 'Y': '10001011000', 'Z': '10001000110',
  '-': '10110001000', '.': '10001101000', ' ': '10001100010', '$': '11010001000',
  '/': '11000101000', '+': '11000100010', '%': '10110111000', '*': '11010111000',
  'START': '11010000100', 'STOP': '1100011101011'
}

function generateBarcodeSVG(text, width = 180, height = 40) {
  const orderNum = String(text).toUpperCase()
  let pattern = CODE128_PATTERNS['START']
  
  for (const char of orderNum) {
    pattern += CODE128_PATTERNS[char] || CODE128_PATTERNS['0']
  }
  pattern += CODE128_PATTERNS['STOP']
  
  const barWidth = width / pattern.length
  let bars = []
  let x = 0
  
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      bars.push(`<rect x="${x.toFixed(2)}" y="0" width="${Math.max(barWidth, 1).toFixed(2)}" height="${height}" fill="#000"/>`)
    }
    x += barWidth
  }
  
  return `<svg width="${width}" height="${height + 14}" viewBox="0 0 ${width} ${height + 14}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#fff"/>
    ${bars.join('')}
    <text x="${width / 2}" y="${height + 11}" text-anchor="middle" font-family="monospace" font-size="10" fill="#000">${orderNum}</text>
  </svg>`
}

function TextFormattingToolbar({ 
  font, onFontChange, 
  fontSize, onFontSizeChange, 
  bold, onBoldToggle, 
  italic, onItalicToggle, 
  align, onAlignChange,
  isDarkMode, 
  themeColorRgb 
}) {
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef(null)
  const fontOptions = [
    { value: 'monospace', label: 'Monospace' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Consolas', label: 'Consolas' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' }
  ]
  const selectedFont = fontOptions.find(f => f.value === (font || 'monospace')) || fontOptions[0]

  useEffect(() => {
    if (fontDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      })
    }
  }, [fontDropdownOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fontDropdownOpen && buttonRef.current && !buttonRef.current.contains(event.target)) {
        // Check if click is on dropdown menu
        const dropdown = document.getElementById('font-dropdown-menu')
        if (dropdown && !dropdown.contains(event.target)) {
          setFontDropdownOpen(false)
        }
      }
    }
    if (fontDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [fontDropdownOpen])

  return (
    <div style={{
      position: 'relative',
      marginTop: '6px',
      overflow: 'visible'
    }}>
      <style>{`
        .text-toolbar-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div 
        className="text-toolbar-scroll"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          overflowX: 'auto',
          overflowY: 'visible',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          padding: '0',
          position: 'relative'
        }}
        onScroll={(e) => {
          const el = e.target
          const gradient = el.parentElement?.querySelector('.toolbar-gradient-fade')
          if (gradient) {
            const isAtEnd = el.scrollWidth - el.scrollLeft <= el.clientWidth + 5
            gradient.style.opacity = isAtEnd ? '0' : '1'
          }
        }}
      >
        {/* Font dropdown - rebuilt */}
        <div style={{ position: 'relative', flexShrink: 0, maxWidth: '120px', minWidth: '80px' }}>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
            style={{
              width: '100%',
              padding: '4px 8px',
              fontSize: '11px',
              border: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`,
              borderRadius: '4px',
              backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff',
              color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4px',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              textAlign: 'left'
            }}>
              {selectedFont.label}
            </span>
            <ChevronDown 
              size={12} 
              style={{ 
                transition: 'transform 0.2s ease',
                transform: fontDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                flexShrink: 0
              }} 
            />
          </button>
          {fontDropdownOpen && createPortal(
            <div
              id="font-dropdown-menu"
              style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
                border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                borderRadius: '6px',
                boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 999999,
                maxHeight: '180px',
                overflowY: 'auto',
                overflowX: 'hidden'
              }}
            >
              {fontOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onFontChange({ target: { value: option.value } })
                    setFontDropdownOpen(false)
                  }}
                  style={{
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                    backgroundColor: font === option.value 
                      ? `rgba(${themeColorRgb}, 0.2)` 
                      : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (font !== option.value) {
                      e.target.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (font !== option.value) {
                      e.target.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>,
            document.body
          )}
        </div>
        
        {/* Font size */}
        <input
          type="number"
          min={8}
          max={24}
          value={fontSize ?? 12}
          onChange={onFontSizeChange}
          style={{
            width: '40px',
            height: '23px',
            padding: '2px 4px',
            border: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`,
            borderRadius: '4px',
            fontSize: '11px',
            backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff',
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
            textAlign: 'center',
            flexShrink: 0,
            boxSizing: 'border-box'
          }}
        />
        
        {/* Divider */}
        <div style={{ width: '1px', height: '16px', backgroundColor: isDarkMode ? 'var(--border-color, #404040)' : '#ddd', margin: '0 2px', flexShrink: 0 }} />
        
        {/* Bold button */}
        <button
          type="button"
          onClick={onBoldToggle}
          style={{
            padding: '4px 6px',
            border: `1px solid ${bold ? `rgba(${themeColorRgb}, 0.5)` : (isDarkMode ? 'var(--border-color, #404040)' : '#ddd')}`,
            borderRadius: '4px',
            backgroundColor: bold ? `rgba(${themeColorRgb}, 0.15)` : 'transparent',
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title="Bold"
        >
          <Bold size={14} style={{ fontWeight: bold ? 700 : 400 }} />
        </button>
        
        {/* Italic button */}
        <button
          type="button"
          onClick={onItalicToggle}
          style={{
            padding: '4px 6px',
            border: `1px solid ${italic ? `rgba(${themeColorRgb}, 0.5)` : (isDarkMode ? 'var(--border-color, #404040)' : '#ddd')}`,
            borderRadius: '4px',
            backgroundColor: italic ? `rgba(${themeColorRgb}, 0.15)` : 'transparent',
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title="Italic"
        >
          <Italic size={14} style={{ fontStyle: italic ? 'italic' : 'normal' }} />
        </button>
        
        {/* Divider */}
        <div style={{ width: '1px', height: '16px', backgroundColor: isDarkMode ? 'var(--border-color, #404040)' : '#ddd', margin: '0 2px', flexShrink: 0 }} />
        
        {/* Alignment buttons */}
        <button
          type="button"
          onClick={() => onAlignChange('left')}
          style={{
            padding: '4px 6px',
            border: `1px solid ${align === 'left' ? `rgba(${themeColorRgb}, 0.5)` : (isDarkMode ? 'var(--border-color, #404040)' : '#ddd')}`,
            borderRadius: '4px',
            backgroundColor: align === 'left' ? `rgba(${themeColorRgb}, 0.15)` : 'transparent',
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title="Align Left"
        >
          <AlignLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => onAlignChange('center')}
          style={{
            padding: '4px 6px',
            border: `1px solid ${align === 'center' ? `rgba(${themeColorRgb}, 0.5)` : (isDarkMode ? 'var(--border-color, #404040)' : '#ddd')}`,
            borderRadius: '4px',
            backgroundColor: align === 'center' ? `rgba(${themeColorRgb}, 0.15)` : 'transparent',
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title="Align Center"
        >
          <AlignCenter size={14} />
        </button>
        <button
          type="button"
          onClick={() => onAlignChange('right')}
          style={{
            padding: '4px 6px',
            border: `1px solid ${align === 'right' ? `rgba(${themeColorRgb}, 0.5)` : (isDarkMode ? 'var(--border-color, #404040)' : '#ddd')}`,
            borderRadius: '4px',
            backgroundColor: align === 'right' ? `rgba(${themeColorRgb}, 0.15)` : 'transparent',
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title="Align Right"
        >
          <AlignRight size={14} />
        </button>
      </div>
      {/* Gradient fade overlay */}
      <div 
        className="toolbar-gradient-fade"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '30px',
          height: '100%',
          background: `linear-gradient(to right, transparent, ${isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff'})`,
          pointerEvents: 'none',
          zIndex: 1,
          transition: 'opacity 0.2s ease'
        }} 
      />
    </div>
  )
}

function ReceiptPreview({ settings, id = 'receipt-preview-print', onSectionClick, activeSection, isDarkMode, themeColorRgb }) {
  const fontMap = { monospace: 'monospace', 'Courier New': '"Courier New", monospace', Consolas: 'Consolas, monospace' }
  const font = fontMap[settings.font_family] || 'monospace'
  const width = settings.receipt_width === 58 ? 58 : 80
  const fs = Number(settings.font_size) || 12
  const ls = Number(settings.line_spacing) || 1.2
  const sub = SAMPLE_LINE_ITEMS.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = sub * 0.08
  const total = sub + tax
  const textAlign = (a) => ({ left: 'left', center: 'center', right: 'right' }[a] || 'center')
  const divider = settings.divider_style === 'solid' ? '1px solid #000' : settings.divider_style === 'dashed' ? '1px dashed #000' : 'none'
  const showTax = settings.tax_line_display !== 'none'
  const highlightColor = `rgba(${themeColorRgb}, 0.2)`

  const sectionStyle = (section) => ({
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: '4px',
    margin: '-4px',
    borderRadius: '4px',
    backgroundColor: activeSection === section ? highlightColor : 'transparent',
    border: activeSection === section ? `2px solid rgba(${themeColorRgb}, 0.5)` : '2px solid transparent'
  })

  return (
    <div
      id={id}
      style={{
        width: `${width}mm`,
        maxWidth: '100%',
        fontFamily: font,
        fontSize: `${fs}px`,
        lineHeight: ls,
        background: '#fff',
        color: '#000',
        padding: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        borderRadius: '4px',
        border: '1px solid #e0e0e0'
      }}
    >
      <div 
        onClick={() => onSectionClick && onSectionClick('header')}
        style={sectionStyle('header')}
      >
        <div style={{ textAlign: textAlign(settings.store_name_align || settings.header_alignment || 'center'), marginBottom: '8px' }}>
          {settings.store_logo && (
            typeof settings.store_logo === 'string' && settings.store_logo.startsWith('data:')
              ? <img src={settings.store_logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '40px', marginBottom: '4px', display: 'inline-block' }} />
              : <div style={{ marginBottom: '4px', fontSize: '10px' }}>[Logo]</div>
          )}
          <div style={{
          fontWeight: settings.store_name_bold ? 700 : 400,
          fontStyle: settings.store_name_italic ? 'italic' : 'normal',
          fontSize: `${settings.store_name_font_size || 14}px`,
          fontFamily: settings.store_name_font || 'monospace',
          textAlign: textAlign(settings.store_name_align || settings.header_alignment || 'center')
        }}>{settings.store_name || 'Store'}</div>
          {settings.store_address && <div style={{ whiteSpace: 'pre-wrap', fontSize: `${fs - 1}px` }}>{settings.store_address}</div>}
          {(settings.store_city || settings.store_state || settings.store_zip) && (
            <div style={{ fontSize: `${fs - 1}px` }}>{[settings.store_city, settings.store_state, settings.store_zip].filter(Boolean).join(', ')}</div>
          )}
          {settings.store_phone && <div>{settings.store_phone}</div>}
        </div>
      </div>
      <div style={{ borderTop: divider, margin: '6px 0' }} />
      {/* Body: 1. Line items (products & prices) */}
      <div 
        onClick={() => onSectionClick && onSectionClick('body_items')}
        style={sectionStyle('body_items')}
      >
        <div style={{ marginBottom: '8px' }}>
          {SAMPLE_LINE_ITEMS.map((item, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              <div style={{ 
                fontWeight: settings.item_name_bold ?? settings.bold_item_names ? 700 : 400,
                fontStyle: settings.item_name_italic ? 'italic' : 'normal',
                fontFamily: settings.item_name_font || 'monospace',
                fontSize: `${settings.item_name_font_size || fs}px`,
                textAlign: textAlign(settings.item_name_align || 'left')
              }}>{item.name} {item.qty > 1 ? `x${item.qty}` : ''}</div>
              {(settings.show_item_descriptions && item.desc) && <div style={{ 
                fontSize: `${settings.item_desc_font_size || fs - 2}px`, 
                opacity: 0.9,
                fontWeight: settings.item_desc_bold ? 700 : 400,
                fontStyle: settings.item_desc_italic ? 'italic' : 'normal',
                fontFamily: settings.item_desc_font || 'monospace',
                textAlign: textAlign(settings.item_desc_align || 'left')
              }}>{item.desc}</div>}
              {settings.show_item_skus && <div style={{ 
                fontSize: `${settings.item_sku_font_size || fs - 2}px`,
                fontWeight: settings.item_sku_bold ? 700 : 400,
                fontStyle: settings.item_sku_italic ? 'italic' : 'normal',
                fontFamily: settings.item_sku_font || 'monospace',
                textAlign: textAlign(settings.item_sku_align || 'left')
              }}>{item.sku}</div>}
              <div style={{ 
                textAlign: textAlign(settings.item_price_align || 'right'),
                fontWeight: settings.item_price_bold ? 700 : 400,
                fontStyle: settings.item_price_italic ? 'italic' : 'normal',
                fontFamily: settings.item_price_font || 'monospace',
                fontSize: `${settings.item_price_font_size || fs}px`
              }}>${(item.price * item.qty).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: divider, margin: '6px 0' }} />
      {/* Body: 2. Totals & payment */}
      <div 
        onClick={() => onSectionClick && onSectionClick('body_totals')}
        style={sectionStyle('body_totals')}
      >
        <div style={{ 
          textAlign: textAlign(settings.subtotal_align || 'right'), 
          marginBottom: '2px',
          fontWeight: settings.subtotal_bold ? 700 : 400,
          fontStyle: settings.subtotal_italic ? 'italic' : 'normal',
          fontFamily: settings.subtotal_font || 'monospace',
          fontSize: `${settings.subtotal_font_size || fs}px`
        }}>Subtotal ${sub.toFixed(2)}</div>
        {showTax && settings.tax_line_display === 'breakdown' && <div style={{ 
          textAlign: textAlign(settings.tax_align || 'right'), 
          marginBottom: '2px',
          fontWeight: settings.tax_bold ? 700 : 400,
          fontStyle: settings.tax_italic ? 'italic' : 'normal',
          fontFamily: settings.tax_font || 'monospace',
          fontSize: `${settings.tax_font_size || fs}px`
        }}>Tax (8%) ${tax.toFixed(2)}</div>}
        {showTax && settings.tax_line_display === 'single_line' && <div style={{ 
          textAlign: textAlign(settings.tax_align || 'right'), 
          marginBottom: '2px',
          fontWeight: settings.tax_bold ? 700 : 400,
          fontStyle: settings.tax_italic ? 'italic' : 'normal',
          fontFamily: settings.tax_font || 'monospace',
          fontSize: `${settings.tax_font_size || fs}px`
        }}>Tax ${tax.toFixed(2)}</div>}
        <div style={{ 
          fontWeight: settings.total_bold ?? true ? 700 : 400, 
          textAlign: textAlign(settings.total_align || 'right'), 
          marginTop: '4px',
          fontStyle: settings.total_italic ? 'italic' : 'normal',
          fontFamily: settings.total_font || 'monospace',
          fontSize: `${settings.total_font_size || fs + 2}px`
        }}>Total ${total.toFixed(2)}</div>
        {settings.show_payment_method && (
          <>
            <div style={{ 
              textAlign: textAlign(settings.payment_method_align || 'center'), 
              marginTop: '6px', 
              fontSize: `${settings.payment_method_font_size || fs - 1}px`,
              fontWeight: settings.payment_method_bold ? 700 : 400,
              fontStyle: settings.payment_method_italic ? 'italic' : 'normal',
              fontFamily: settings.payment_method_font || 'monospace'
            }}>{settings.preview_payment_type === 'cash' ? 'Paid with Cash' : 'Paid by Card'}</div>
            {settings.preview_payment_type === 'cash' && settings.show_cash_amount_given && (
              <div style={{ 
                textAlign: textAlign(settings.cash_amount_given_align || 'center'), 
                marginTop: '2px',
                fontSize: `${settings.cash_amount_given_font_size || fs - 1}px`,
                fontWeight: settings.cash_amount_given_bold ? 700 : 400,
                fontStyle: settings.cash_amount_given_italic ? 'italic' : 'normal',
                fontFamily: settings.cash_amount_given_font || 'monospace'
              }}>Amount given: $50.00</div>
            )}
            {settings.preview_payment_type === 'cash' && settings.show_cash_change && (
              <div style={{ 
                textAlign: textAlign(settings.cash_change_align || 'center'), 
                marginTop: '2px',
                fontSize: `${settings.cash_change_font_size || fs - 1}px`,
                fontWeight: settings.cash_change_bold ? 700 : 400,
                fontStyle: settings.cash_change_italic ? 'italic' : 'normal',
                fontFamily: settings.cash_change_font || 'monospace'
              }}>Change: $12.34</div>
            )}
          </>
        )}
      </div>
      <div style={{ borderTop: divider, margin: '8px 0' }} />
      {/* Body: 3. Date & barcode */}
      <div 
        onClick={() => onSectionClick && onSectionClick('body_barcode')}
        style={sectionStyle('body_barcode')}
      >
        <div style={{ 
          fontSize: `${settings.date_line_font_size || fs - 2}px`, 
          textAlign: textAlign(settings.date_line_align || 'center'),
          fontWeight: settings.date_line_bold ? 700 : 400,
          fontStyle: settings.date_line_italic ? 'italic' : 'normal',
          fontFamily: settings.date_line_font || 'monospace'
        }}>{new Date().toLocaleString()}</div>
        {settings.show_barcode !== false && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <div 
              style={{ display: 'inline-block' }}
              dangerouslySetInnerHTML={{ __html: generateBarcodeSVG('ORD-10042', 160, 35) }}
            />
          </div>
        )}
      </div>
      <div style={{ borderTop: divider, margin: '8px 0' }} />
      <div 
        onClick={() => onSectionClick && onSectionClick('footer')}
        style={sectionStyle('footer')}
      >
        <div style={{ textAlign: textAlign(settings.footer_alignment), fontSize: `${fs - 1}px`, whiteSpace: 'pre-wrap' }}>
          {settings.footer_message && <div style={{ marginBottom: '4px' }}>{settings.footer_message}</div>}
          {settings.return_policy && <div style={{ marginBottom: '4px' }}>{settings.return_policy}</div>}
          {(settings.store_website || settings.store_email) && <div>{[settings.store_website, settings.store_email].filter(Boolean).join(' · ')}</div>}
        </div>
        {settings.show_signature && (
          <div style={{ marginTop: '12px', paddingTop: '8px' }}>
            {settings.show_signature_title !== false && (
              <div style={{ 
                fontSize: `${settings.signature_title_font_size || fs - 2}px`, 
                marginBottom: '4px',
                fontWeight: settings.signature_title_bold ? 700 : 400,
                fontStyle: settings.signature_title_italic ? 'italic' : 'normal',
                fontFamily: settings.signature_title_font || 'monospace',
                textAlign: textAlign(settings.signature_title_align || 'left')
              }}>Signature:</div>
            )}
            <div style={{ 
              borderBottom: divider === 'none' ? '1px solid #000' : divider,
              height: '30px', 
              position: 'relative'
            }}>
              <svg width="100" height="28" style={{ position: 'absolute', bottom: '2px', left: '10px' }} viewBox="0 0 100 28">
                <path 
                  d="M5 20 Q10 5 20 15 T35 12 Q45 8 50 18 T65 14 Q75 10 85 16 L95 14" 
                  stroke="#333" 
                  strokeWidth="1.5" 
                  fill="none" 
                  strokeLinecap="round"
                  style={{ opacity: 0.7 }}
                />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const SETTINGS_TAB_IDS = ['location', 'pos', 'cash', 'sms', 'rewards']

function Settings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { themeMode, themeColor } = useTheme()
  const [receiptSettings, setReceiptSettings] = useState(() => ({ ...DEFAULT_RECEIPT_TEMPLATE }))
  const [activeTab, setActiveTab] = useState('location') // 'location', 'pos', 'cash', 'sms', or 'rewards'

  // Open tab from URL ?tab=cash (e.g. from POS "Open Register" toast)
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && SETTINGS_TAB_IDS.includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])
  const [posSettings, setPosSettings] = useState({
    num_registers: 1,
    register_type: 'one_screen'
  })
  const [receiptOptionsOffered, setReceiptOptionsOffered] = useState({
    print: true,
    email: true,
    no_receipt: true
  })
  const [activeReceiptSection, setActiveReceiptSection] = useState(null) // 'header', 'body_items', 'body_totals', 'body_barcode', 'footer', 'styling', null
  const [receiptEditModalOpen, setReceiptEditModalOpen] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState([])
  const [storeLocationSettings, setStoreLocationSettings] = useState({
    store_name: 'Store',
    store_type: '',
    store_logo: '',
    store_phone: '',
    store_email: '',
    store_website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    latitude: null,
    longitude: null,
    allowed_radius_meters: 100.0,
    require_location: true,
    store_hours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: false }
    }
  })
  const [editingStoreHours, setEditingStoreHours] = useState(false)
  const [displaySettings, setDisplaySettings] = useState({
    tip_enabled: false,
    tip_after_payment: false,
    tip_suggestions: [15, 18, 20, 25],
    require_signature: 'not_required'
  })
  const CHECKOUT_BUTTON_STYLES = [
    { value: 'default', label: 'Default (solid)' },
    { value: 'push', label: 'Push (3D shadow)' },
    { value: 'pill', label: 'Pill (rounded gradient)' },
    { value: 'border-bottom', label: 'Border bottom' },
    { value: 'soft-push', label: 'Soft push (3D)' },
    { value: 'inset', label: 'Inset (recessed)' },
    { value: 'bevel', label: 'Bevel (classic 3D)' },
    { value: 'gradient', label: 'Gradient (glossy)' },
    { value: 'gold', label: 'Gold (amber)' }
  ]
  const checkoutUiScreenDefaults = () => ({
    backgroundColor: '#e8f0fe',
    buttonColor: '#4a90e2',
    textColor: '#1a1a1a',
    button_style: 'default',
    title_font: 'system-ui',
    title_font_size: 36,
    title_bold: false,
    title_italic: false,
    title_align: 'center',
    body_font: 'system-ui',
    body_font_size: 24,
    body_bold: false,
    body_italic: false,
    body_align: 'left',
    button_font: 'system-ui',
    button_font_size: 36,
    button_bold: true,
    button_italic: false,
    signature_background: '#ffffff',
    signature_border_width: 2,
    signature_border_color: 'rgba(0,0,0,0.2)',
    signature_ink_color: '#000000'
  })
  const DEFAULT_CHECKOUT_UI = {
    review_order: checkoutUiScreenDefaults(),
    cash_confirmation: { ...checkoutUiScreenDefaults(), title_font_size: 40 },
    receipt: checkoutUiScreenDefaults()
  }
  const [checkoutUiSettings, setCheckoutUiSettings] = useState(() => ({
    review_order: { ...DEFAULT_CHECKOUT_UI.review_order },
    cash_confirmation: { ...DEFAULT_CHECKOUT_UI.cash_confirmation },
    receipt: { ...DEFAULT_CHECKOUT_UI.receipt }
  }))
  const getCheckoutTextStyle = (s, type) => {
    const t = type === 'title' ? 'title' : type === 'button' ? 'button' : 'body'
    const font = s[`${t}_font`] ?? s.fontFamily ?? 'system-ui'
    const size = s[`${t}_font_size`] != null ? s[`${t}_font_size`] : (t === 'title' ? 36 : t === 'button' ? 36 : 24)
    const bold = s[`${t}_bold`] ?? (t === 'button' ? true : false)
    const fw = s.fontWeight ?? '600'
    return {
      fontFamily: font,
      fontSize: `${Number(size)}px`,
      fontWeight: bold ? '700' : (t === 'button' ? fw : '400'),
      fontStyle: s[`${t}_italic`] ? 'italic' : 'normal',
      textAlign: (s[`${t}_align`] || (t === 'title' ? 'center' : 'left'))
    }
  }
  const renderCheckoutPreviewButton = (label, styleId, buttonColor, textStyle, fullWidth = false) => {
    const wrapStyle = { flex: fullWidth ? 'none' : 1, width: fullWidth ? '100%' : undefined, minWidth: 0 }
    const defaultStyle = { flex: fullWidth ? 'none' : 1, width: fullWidth ? '100%' : undefined, height: '100px', padding: '16px', paddingTop: '8px', backgroundColor: buttonColor, color: '#fff', border: 0, borderRadius: '8px', cursor: 'default', boxShadow: 'inset 0 -8px rgb(0 0 0/0.4), 0 2px 4px rgb(0 0 0/0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...textStyle }
    if (!styleId || styleId === 'default') {
      return <button type="button" style={defaultStyle}>{label}</button>
    }
    if (styleId === 'push') {
      return (
        <div className="checkout-btn-wrap" style={wrapStyle}>
          <button type="button" className="checkout-btn--push" style={{ ['--checkout-btn-color']: buttonColor, ...textStyle }}>
            <span className="checkout-btn__shadow" aria-hidden />
            <span className="checkout-btn__edge" aria-hidden />
            <span className="checkout-btn__front">{label}</span>
          </button>
        </div>
      )
    }
    const className = `checkout-btn--${styleId}`
    return (
      <div className={fullWidth ? 'checkout-btn-wrap checkout-btn-wrap--full' : 'checkout-btn-wrap'} style={wrapStyle}>
        <button type="button" className={className} style={{ ['--checkout-btn-color']: buttonColor, ...textStyle }}>
          {styleId === 'soft-push' ? <span className="checkout-btn__text">{label}</span> : label}
        </button>
      </div>
    )
  }
  const [checkoutUiTab, setCheckoutUiTab] = useState('review_order') // 'review_order' | 'cash_confirmation' | 'receipt'
  const [checkoutUiEditModalOpen, setCheckoutUiEditModalOpen] = useState(false)
  const [checkoutUiUndoStack, setCheckoutUiUndoStack] = useState([])
  const [checkoutUiRedoStack, setCheckoutUiRedoStack] = useState([])
  const setCheckoutUiSettingsWithUndo = (updater) => {
    setCheckoutUiSettings(prev => {
      setCheckoutUiUndoStack(u => [...u, JSON.parse(JSON.stringify(prev))])
      setCheckoutUiRedoStack([])
      return typeof updater === 'function' ? updater(prev) : updater
    })
  }
  const handleCheckoutUiUndo = () => {
    if (checkoutUiUndoStack.length === 0) return
    const toRestore = checkoutUiUndoStack[checkoutUiUndoStack.length - 1]
    setCheckoutUiSettings(prev => {
      setCheckoutUiRedoStack(r => [...r, JSON.parse(JSON.stringify(prev))])
      return JSON.parse(JSON.stringify(toRestore))
    })
    setCheckoutUiUndoStack(u => u.slice(0, -1))
  }
  const handleCheckoutUiRedo = () => {
    if (checkoutUiRedoStack.length === 0) return
    const toRestore = checkoutUiRedoStack[checkoutUiRedoStack.length - 1]
    setCheckoutUiSettings(prev => {
      setCheckoutUiUndoStack(u => [...u, JSON.parse(JSON.stringify(prev))])
      return JSON.parse(JSON.stringify(toRestore))
    })
    setCheckoutUiRedoStack(r => r.slice(0, -1))
  }
  useEffect(() => {
    if (checkoutUiEditModalOpen) {
      setCheckoutUiUndoStack([])
      setCheckoutUiRedoStack([])
    }
  }, [checkoutUiEditModalOpen])
  const [rewardsSettings, setRewardsSettings] = useState({
    enabled: false,
    require_email: false,
    require_phone: false,
    require_both: false,
    reward_type: 'points',
    points_enabled: true,
    percentage_enabled: false,
    fixed_enabled: false,
    points_per_dollar: 1.0,
    points_redemption_value: 0.01,
    percentage_discount: 0.0,
    fixed_discount: 0.0,
    minimum_spend: 0.0
  })
  const [rewardsCampaigns, setRewardsCampaigns] = useState(() => {
    try {
      const s = localStorage.getItem('rewards_campaigns')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false)
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'promo_discount', discount_value: '', product_id: null, buy_qty: 1, get_qty: 1 })
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
  const [sendSmsForm, setSendSmsForm] = useState({ phone_number: '', message_text: '', carrier_preference: '' })
  const [registers, setRegisters] = useState(() => {
    // Load from localStorage or default to one register
    const saved = localStorage.getItem('cash_registers')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return [{ id: 1, name: 'Register 1' }]
      }
    }
    return [{ id: 1, name: 'Register 1' }]
  })
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
    adjustment_type: 'none', // 'none', 'add', 'take_out'
    adjustment_mode: 'total', // 'total' or 'denominations'
    adjustment_amount: 0,
    adjustment_denominations: {
      '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
      '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
    },
    notes: ''
  })
  const [dailyCounts, setDailyCounts] = useState([])
  const [registerSessions, setRegisterSessions] = useState([])
  const [registerTransactions, setRegisterTransactions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showTakeOutModal, setShowTakeOutModal] = useState(false)
  const [showCountDropModal, setShowCountDropModal] = useState(false)
  const [openRegisterForm, setOpenRegisterForm] = useState({
    register_id: 1,
    cash_mode: 'total',
    total_amount: 0,
    denominations: {
      '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
      '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
    },
    adjustment_type: 'none', // 'none', 'add', 'take_out'
    adjustment_mode: 'total', // 'total' or 'denominations'
    adjustment_amount: 0,
    adjustment_denominations: {
      '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
      '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
    },
    expected_amount: 0,
    notes: ''
  })
  const [closeRegisterForm, setCloseRegisterForm] = useState({
    cash_mode: 'total',
    total_amount: 0,
    denominations: {
      '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
      '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
    },
    adjustment_type: 'none', // 'none', 'add', 'take_out'
    adjustment_mode: 'total', // 'total' or 'denominations'
    adjustment_amount: 0,
    adjustment_denominations: {
      '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
      '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
    },
    notes: ''
  })
  const [lastClosedSession, setLastClosedSession] = useState(null)
  const [takeOutForm, setTakeOutForm] = useState({
    amount: 0,
    reason: '',
    notes: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [toast, setToast] = useState(null) // { message, type: 'success' | 'error' }
  const [sidebarMinimized, setSidebarMinimized] = useState(false)
  const [hoveringSettings, setHoveringSettings] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const settingsHeaderRef = useRef(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [isInitialMount, setIsInitialMount] = useState(true)
  const sidebarRef = useRef(null)
  const contentRef = useRef(null)
  
  useEffect(() => {
    // Disable initial animation by setting flag after component is mounted
    const timer = setTimeout(() => {
      setIsInitialMount(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }

  const themeColorRgb = hexToRgb(themeColor)
  const isDarkMode = document.documentElement.classList.contains('dark-theme')

  useEffect(() => {
    const loadAllSettings = async () => {
      try {
        await Promise.allSettled([
          loadReceiptSettings(),
          loadReceiptTemplates(),
          loadStoreLocationSettings(),
          loadDisplaySettings(),
          loadRewardsSettings(),
          loadPosSettings(),
          loadSmsSettings(),
          loadSmsStores(),
          loadCashSettings(),
          loadDailyCounts()
        ])
      } finally {
        setLoading(false)
      }
    }
    loadAllSettings()
  }, [])

  useEffect(() => {
    if (activeTab === 'sms') {
      loadSmsSettings()
      loadSmsMessages()
      loadSmsTemplates()
    }
    if (activeTab === 'cash') {
      loadRegisterSessions()
      loadRegisterEvents()
    }
  }, [activeTab, selectedSmsStore, cashSettings.register_id])
  
  // Ensure selected register_id exists in registers list
  useEffect(() => {
    if (registers.length > 0 && !registers.find(r => r.id === cashSettings.register_id)) {
      setCashSettings({...cashSettings, register_id: registers[0].id})
    }
  }, [registers])

  const loadReceiptSettings = async () => {
    try {
      const response = await fetch('/api/receipt-settings')
      const data = await response.json()
      if (data.success && data.settings) {
        const s = data.settings
        setReceiptSettings({
          ...DEFAULT_RECEIPT_TEMPLATE,
          receipt_type: s.receipt_type || 'traditional',
          store_name: s.store_name ?? 'Store',
          store_address: s.store_address ?? '',
          store_city: s.store_city ?? '',
          store_state: s.store_state ?? '',
          store_zip: s.store_zip ?? '',
          store_phone: s.store_phone ?? '',
          store_email: s.store_email ?? '',
          store_website: s.store_website ?? '',
          footer_message: s.footer_message ?? 'Thank you for your business!',
          return_policy: s.return_policy ?? '',
          show_tax_breakdown: s.show_tax_breakdown === 1,
          show_payment_method: s.show_payment_method === 1,
          show_signature: s.show_signature === 1
        })
      }
    } catch (error) {
      console.error('Error loading receipt settings:', error)
    }
  }

  const loadReceiptTemplates = async () => {
    try {
      const response = await fetch('/api/receipt-templates')
      const data = await response.json()
      if (data.success && data.templates) {
        setSavedTemplates(data.templates)
      }
    } catch (error) {
      console.error('Error loading receipt templates:', error)
    }
  }

  const createReceiptTemplate = async () => {
    const name = window.prompt('Name your template')
    if (!name || !name.trim()) return
    try {
      const response = await fetch('/api/receipt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), settings: receiptSettings })
      })
      const data = await response.json()
      if (data.success && data.template) {
        await loadReceiptTemplates()
        setReceiptSettings(prev => ({ ...prev, template_preset: `template_${data.template.id}` }))
        setMessage({ type: 'success', text: `Template "${data.template.name}" saved.` })
        setTimeout(() => setMessage(null), 2500)
        setReceiptEditModalOpen(false)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save template' })
      }
    } catch (error) {
      console.error('Error saving template:', error)
      setMessage({ type: 'error', text: 'Failed to save template' })
    }
  }

  const resetReceiptToDefault = () => {
    setReceiptSettings({ ...DEFAULT_RECEIPT_TEMPLATE })
    setMessage({ type: 'success', text: 'Receipt template reset to default.' })
    setTimeout(() => setMessage(null), 2500)
  }

  const printTestReceipt = () => {
    const el = document.getElementById('receipt-preview-print')
    if (!el) return
    const win = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html><html><head><title>Test Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 16px; max-width: 80mm; margin: 0 auto; }
        .line { border-bottom: 1px dashed #000; margin: 6px 0; }
      </style></head><body>${el.innerHTML}</body></html>
    `)
    win.document.close()
    win.print()
    win.close()
  }

  const applyTemplatePreset = (preset) => {
    const presets = {
      modern: {
        ...DEFAULT_RECEIPT_TEMPLATE,
        font_family: 'monospace',
        font_size: 11,
        receipt_width: 80,
        divider_style: 'dashed',
        bold_item_names: true,
        header_alignment: 'center',
        footer_alignment: 'center',
        show_item_descriptions: false,
        show_item_skus: true,
        tax_line_display: 'breakdown'
      },
      classic: {
        ...DEFAULT_RECEIPT_TEMPLATE,
        font_family: 'Courier New',
        font_size: 12,
        receipt_width: 80,
        divider_style: 'solid',
        bold_item_names: false,
        header_alignment: 'left',
        footer_alignment: 'left',
        show_item_descriptions: false,
        show_item_skus: true,
        tax_line_display: 'single_line'
      },
      minimal: {
        ...DEFAULT_RECEIPT_TEMPLATE,
        font_family: 'monospace',
        font_size: 10,
        receipt_width: 58,
        divider_style: 'none',
        bold_item_names: false,
        header_alignment: 'center',
        footer_alignment: 'center',
        show_item_descriptions: false,
        show_item_skus: false,
        tax_line_display: 'single_line'
      }
    }
    const next = presets[preset] || DEFAULT_RECEIPT_TEMPLATE
    setReceiptSettings(prev => ({ ...next, template_preset: preset, store_name: prev.store_name, store_address: prev.store_address, store_phone: prev.store_phone, footer_message: prev.footer_message, return_policy: prev.return_policy, store_email: prev.store_email, store_website: prev.store_website }))
  }

  const loadStoreLocationSettings = async () => {
    try {
      const response = await fetch('/api/store-location-settings')
      if (!response.ok) {
        console.warn('Store location settings not available:', response.status)
        return
      }
      const data = await response.json()
      if (data.success && data.settings) {
        const defaultStoreHours = {
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
          wednesday: { open: '09:00', close: '17:00', closed: false },
          thursday: { open: '09:00', close: '17:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '17:00', closed: false },
          sunday: { open: '09:00', close: '17:00', closed: false }
        }
        setStoreLocationSettings({
          store_name: 'Store',
          store_type: '',
          store_logo: '',
          store_phone: '',
          store_email: '',
          store_website: '',
          address: '',
          city: '',
          state: '',
          country: '',
          zip: '',
          latitude: null,
          longitude: null,
          allowed_radius_meters: 100.0,
          require_location: true,
          store_hours: defaultStoreHours,
          ...data.settings,
          require_location: data.settings.require_location === 1 || data.settings.require_location === true,
          store_hours: data.settings.store_hours ? { ...defaultStoreHours, ...data.settings.store_hours } : defaultStoreHours
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
        setDisplaySettings(prev => ({
          ...prev,
          tip_enabled: data.data.tip_enabled === 1 || data.data.tip_enabled === true,
          tip_after_payment: data.data.tip_after_payment === 1 || data.data.tip_after_payment === true,
          tip_suggestions: data.data.tip_suggestions || [15, 18, 20, 25]
        }))
        if (data.data.checkout_ui && typeof data.data.checkout_ui === 'object') {
          const ui = data.data.checkout_ui
          setCheckoutUiSettings(prev => ({
            review_order: { ...checkoutUiScreenDefaults(), ...(prev.review_order || {}), ...(ui.review_order || {}) },
            cash_confirmation: { ...checkoutUiScreenDefaults(), ...(prev.cash_confirmation || {}), ...(ui.cash_confirmation || {}) },
            receipt: { ...checkoutUiScreenDefaults(), ...(prev.receipt || {}), ...(ui.receipt || {}) }
          }))
        }
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
        const s = data.settings
        setRewardsSettings({
          enabled: s.enabled === 1 || s.enabled === true,
          require_email: s.require_email === 1 || s.require_email === true,
          require_phone: s.require_phone === 1 || s.require_phone === true,
          require_both: s.require_both === 1 || s.require_both === true,
          reward_type: s.reward_type || 'points',
          points_enabled: s.points_enabled === 1 || s.points_enabled === true,
          percentage_enabled: s.percentage_enabled === 1 || s.percentage_enabled === true,
          fixed_enabled: s.fixed_enabled === 1 || s.fixed_enabled === true,
          points_per_dollar: s.points_per_dollar ?? 1.0,
          points_redemption_value: s.points_redemption_value ?? 0.01,
          percentage_discount: s.percentage_discount ?? 0.0,
          fixed_discount: s.fixed_discount ?? 0.0,
          minimum_spend: s.minimum_spend ?? 0.0
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
      if (!response.ok) {
        console.warn('SMS settings not available:', response.status)
        // Set default values if API fails
        setSmsSettings({
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
        return
      }
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
      // Set default values on error
      setSmsSettings({
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
    }
  }

  const loadSmsStores = async () => {
    try {
      const response = await fetch('/api/sms/stores')
      if (!response.ok) {
        console.warn('SMS stores not available:', response.status)
        // Set default store if API fails
        setSmsStores([{ store_id: 1, store_name: 'Default Store' }])
        setSelectedSmsStore(1)
        return
      }
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        setSmsStores(data)
        setSelectedSmsStore(data[0].store_id)
      } else {
        // Set default store if no stores returned
        setSmsStores([{ store_id: 1, store_name: 'Default Store' }])
        setSelectedSmsStore(1)
      }
    } catch (error) {
      console.error('Error loading SMS stores:', error)
      // Set default store on error
      setSmsStores([{ store_id: 1, store_name: 'Default Store' }])
      setSelectedSmsStore(1)
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
      // Normalize phone: digits only; US 1+10 -> 10 digits
      let digits = (sendSmsForm.phone_number || '').replace(/\D/g, '')
      if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1)
      if (digits.length !== 10) {
        setMessage({ type: 'error', text: 'Use a 10-digit US number (e.g. 5551234567). Got ' + (digits.length || 0) + ' digits.' })
        setSaving(false)
        return
      }
      const sessionToken = localStorage.getItem('sessionToken')
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          phone_number: digits,
          message_text: sendSmsForm.message_text || '',
          store_id: selectedSmsStore,
          session_token: sessionToken,
          carrier_preference: sendSmsForm.carrier_preference || undefined
        })
      })

      const data = await response.json()
      if (data.success) {
        const carrierNote = data.carrier_tried ? ` (tried ${data.carrier_tried} first).` : ''
        const hint = data.gateway_used ? ` If you didn't receive it, your carrier may differ${carrierNote}` : ''
        setMessage({ type: 'success', text: `SMS sent to ${data.phone_cleaned || digits}${hint}` })
        setShowSendSmsModal(false)
        setSendSmsForm({ phone_number: '', message_text: '', carrier_preference: '' })
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

  const handleCountDrop = async () => {
    setSaving(true)
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      
      // Calculate drop amount from denominations if in denominations mode
      let dropAmount = parseFloat(dailyCount.total_amount) || 0
      if (dailyCount.denominations) {
        const calculated = Object.entries(dailyCount.denominations).reduce((sum, [denom, count]) => {
          return sum + (parseFloat(denom) * parseInt(count || 0))
        }, 0)
        if (calculated > 0) {
          dropAmount = calculated
        }
      }
      
      // Calculate adjustment amount
      let adjustmentAmount = 0
      if (dailyCount.adjustment_type === 'add') {
        adjustmentAmount = dailyCount.adjustment_mode === 'total'
          ? parseFloat(dailyCount.adjustment_amount) || 0
          : calculateTotalFromDenominations(dailyCount.adjustment_denominations)
      } else if (dailyCount.adjustment_type === 'take_out') {
        adjustmentAmount = -(dailyCount.adjustment_mode === 'total'
          ? parseFloat(dailyCount.adjustment_amount) || 0
          : calculateTotalFromDenominations(dailyCount.adjustment_denominations))
      }
      
      // Final drop amount = drop amount + adjustment
      const finalDropAmount = dropAmount + adjustmentAmount

      const payload = {
        session_token: sessionToken,
        register_id: dailyCount.register_id,
        count_date: dailyCount.count_date,
        count_type: 'drop',
        total_amount: finalDropAmount,
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
        setToast({ message: 'Cash drop saved successfully!', type: 'success' })
        setShowCountDropModal(false)
        // Reset form
        setDailyCount({
          register_id: cashSettings.register_id,
          count_date: new Date().toISOString().split('T')[0],
          count_type: 'drop',
          total_amount: 0,
          denominations: {
            '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
            '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
          },
          adjustment_type: 'none',
          adjustment_mode: 'total',
          adjustment_amount: 0,
          adjustment_denominations: {
            '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
            '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
          },
          notes: ''
        })
        // Reload events to update the table
        await loadRegisterEvents()
      } else {
        setToast({ message: data.message || 'Failed to save cash drop', type: 'error' })
      }
    } catch (error) {
      console.error('Error saving cash drop:', error)
      setToast({ message: 'Failed to save cash drop', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const calculateTotalFromDenominations = (denoms) => {
    return Object.entries(denoms).reduce((sum, [denom, count]) => {
      return sum + (parseFloat(denom) * parseInt(count || 0))
    }, 0)
  }

  const loadRegisterSessions = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const response = await fetch(`/api/register/session?register_id=${cashSettings.register_id}&status=open&session_token=${sessionToken}`)
      const data = await response.json()
      if (data.success && data.data) {
        const sessions = Array.isArray(data.data) ? data.data : [data.data]
        setRegisterSessions(sessions)
        if (sessions.length > 0) {
          setCurrentSession(sessions[0])
        } else {
          setCurrentSession(null)
        }
      }
      
      // Load last closed session to show expected amount when opening
      const closedResponse = await fetch(`/api/register/session?register_id=${cashSettings.register_id}&status=closed&session_token=${sessionToken}`)
      const closedData = await closedResponse.json()
      if (closedData.success && closedData.data) {
        const closedSessions = Array.isArray(closedData.data) ? closedData.data : [closedData.data]
        if (closedSessions.length > 0) {
          // Get the most recent closed session
          const lastClosed = closedSessions.sort((a, b) => 
            new Date(b.closed_at || 0) - new Date(a.closed_at || 0)
          )[0]
          setLastClosedSession(lastClosed)
        } else {
          setLastClosedSession(null)
        }
      }
      
      // Always load events regardless of session status
      await loadRegisterEvents()
    } catch (error) {
      console.error('Error loading register sessions:', error)
    }
  }

  const loadRegisterEvents = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const response = await fetch(`/api/register/events?register_id=${cashSettings.register_id}&limit=100&session_token=${sessionToken}`)
      const data = await response.json()
      if (data.success && data.data) {
        // Map events to transaction format for the table
        const events = data.data.map(event => ({
          transaction_id: event.event_id,
          transaction_type: event.event_type,
          amount: parseFloat(event.amount) || 0,
          timestamp: event.timestamp,
          employee_id: event.employee_id,
          employee_name: event.employee_name,
          notes: event.notes || ''
        }))
        
        setRegisterTransactions(events.sort((a, b) => 
          new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        ))
      }
    } catch (error) {
      console.error('Error loading register events:', error)
    }
  }

  const handleOpenRegister = async () => {
    setSaving(true)
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      
      // Calculate expected amount from last closed session
      const expectedAmount = parseFloat(lastClosedSession?.ending_cash) || 0
      
      // Calculate adjustment amount
      let adjustmentAmount = 0
      if (openRegisterForm.adjustment_type === 'add') {
        adjustmentAmount = openRegisterForm.adjustment_mode === 'total'
          ? parseFloat(openRegisterForm.adjustment_amount) || 0
          : calculateTotalFromDenominations(openRegisterForm.adjustment_denominations)
      } else if (openRegisterForm.adjustment_type === 'take_out') {
        adjustmentAmount = -(openRegisterForm.adjustment_mode === 'total'
          ? parseFloat(openRegisterForm.adjustment_amount) || 0
          : calculateTotalFromDenominations(openRegisterForm.adjustment_denominations))
      }
      
      // Starting cash = expected + adjustment
      const startingCash = expectedAmount + adjustmentAmount
      
      const payload = {
        session_token: sessionToken,
        register_id: openRegisterForm.register_id,
        starting_cash: startingCash,
        notes: openRegisterForm.notes
      }
      
      const response = await fetch('/api/register/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      if (data.success) {
        setToast({ message: data.message || 'Register opened successfully!', type: 'success' })
        setShowOpenModal(false)
        setOpenRegisterForm({
          register_id: cashSettings.register_id,
          cash_mode: 'total',
          total_amount: 0,
          denominations: {
            '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
            '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
          },
          adjustment_type: 'none',
          adjustment_mode: 'total',
          adjustment_amount: 0,
          adjustment_denominations: {
            '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
            '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
          },
          expected_amount: 0,
          notes: ''
        })
        // Reload sessions and events to update the table
        await loadRegisterSessions()
      } else {
        setToast({ message: data.message || 'Failed to open register', type: 'error' })
      }
    } catch (error) {
      console.error('Error opening register:', error)
      setToast({ message: 'Failed to open register', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleCloseRegister = async () => {
    if (!currentSession) return
    
    setSaving(true)
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      
      // Calculate expected cash
      const expectedCash = calculateExpectedCash()
      
      // Calculate actual counted cash
      const actualCash = closeRegisterForm.cash_mode === 'total'
        ? parseFloat(closeRegisterForm.total_amount) || 0
        : calculateTotalFromDenominations(closeRegisterForm.denominations)
      
      // Calculate adjustment amount
      let adjustmentAmount = 0
      if (closeRegisterForm.adjustment_type === 'add') {
        adjustmentAmount = closeRegisterForm.adjustment_mode === 'total'
          ? parseFloat(closeRegisterForm.adjustment_amount) || 0
          : calculateTotalFromDenominations(closeRegisterForm.adjustment_denominations)
      } else if (closeRegisterForm.adjustment_type === 'take_out') {
        adjustmentAmount = -(closeRegisterForm.adjustment_mode === 'total'
          ? parseFloat(closeRegisterForm.adjustment_amount) || 0
          : calculateTotalFromDenominations(closeRegisterForm.adjustment_denominations))
      }
      
      // Ending cash = actual counted + adjustment
      const endingCash = actualCash + adjustmentAmount
      
      const payload = {
        session_token: sessionToken,
        session_id: currentSession.register_session_id || currentSession.session_id,
        ending_cash: endingCash,
        notes: closeRegisterForm.notes
      }
      
      const response = await fetch('/api/register/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      if (data.success) {
        setToast({ message: data.message || 'Register closed successfully!', type: 'success' })
        setShowCloseModal(false)
        setCloseRegisterForm({
          cash_mode: 'total',
          total_amount: 0,
          denominations: {
            '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
            '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
          },
          adjustment_type: 'none',
          adjustment_mode: 'total',
          adjustment_amount: 0,
          adjustment_denominations: {
            '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
            '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
          },
          notes: ''
        })
        // Reload sessions and events to update the table with close row
        await loadRegisterSessions()
      } else {
        setToast({ message: data.message || 'Failed to close register', type: 'error' })
      }
    } catch (error) {
      console.error('Error closing register:', error)
      setToast({ message: 'Failed to close register', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleTakeOutMoney = async () => {
    setSaving(true)
    try {
      const sessionToken = localStorage.getItem('sessionToken')
      const payload = {
        session_token: sessionToken,
        session_id: currentSession ? (currentSession.register_session_id || currentSession.session_id) : null,
        transaction_type: 'cash_out',
        amount: parseFloat(takeOutForm.amount) || 0,
        reason: takeOutForm.reason,
        notes: takeOutForm.notes
      }
      
      const response = await fetch('/api/register/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      if (data.success) {
        setToast({ message: 'Money taken out successfully!', type: 'success' })
        setShowTakeOutModal(false)
        setTakeOutForm({
          amount: 0,
          reason: '',
          notes: ''
        })
        // Reload events to update the table
        await loadRegisterEvents()
      } else {
        setToast({ message: data.message || 'Failed to take out money', type: 'error' })
      }
    } catch (error) {
      console.error('Error taking out money:', error)
      setToast({ message: 'Failed to take out money', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const calculateExpectedCash = () => {
    if (!currentSession) return 0
    
    let expected = parseFloat(currentSession?.starting_cash) || 0
    
    // Add cash received from orders (we'd need to fetch this from orders API)
    // For now, we'll just show starting cash + any cash_in transactions
    registerTransactions.forEach(t => {
      if (t.transaction_type === 'cash_in') {
        expected += parseFloat(t.amount || 0)
      } else if (t.transaction_type === 'cash_out') {
        expected -= parseFloat(t.amount || 0)
      }
    })
    
    return expected
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
          reward_type: rewardsSettings.reward_type || 'points',
          points_per_dollar: parseFloat(rewardsSettings.points_per_dollar) || 1.0,
          points_redemption_value: parseFloat(rewardsSettings.points_redemption_value) ?? 0.01,
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
      // Save POS settings
      const posResponse = await fetch('/api/pos-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          num_registers: parseInt(posSettings.num_registers) || 1,
          register_type: posSettings.register_type || 'one_screen'
        })
      })

      const posData = await posResponse.json()
      
      // Save display settings
      const sessionToken = localStorage.getItem('sessionToken')
      const displayResponse = await fetch('/api/customer-display/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          tip_enabled: displaySettings.tip_enabled ? 1 : 0,
          tip_after_payment: displaySettings.tip_after_payment ? 1 : 0,
          tip_suggestions: displaySettings.tip_suggestions,
          checkout_ui: checkoutUiSettings
        })
      })

      const displayData = await displayResponse.json()

      // Save receipt settings
      const receiptResponse = await fetch('/api/receipt-settings', {
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

      const receiptData = await receiptResponse.json()

      if (posData.success && displayData.success && receiptData.success) {
        setMessage({ type: 'success', text: 'POS settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: posData.message || displayData.message || receiptData.message || 'Failed to save POS settings' })
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


  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#333' }}>
        <div>Loading settings...</div>
      </div>
    )
  }

  const settingsSections = [
    { id: 'location', label: 'Store Information', icon: MapPin },
    { id: 'pos', label: 'POS Settings', icon: ShoppingCart },
    { id: 'cash', label: 'Cash Register', icon: DollarSign },
    { id: 'sms', label: 'SMS & Notifications', icon: MessageSquare },
    { id: 'rewards', label: 'Customer Rewards', icon: Gift }
  ]

  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      width: '100%'
    }}>
      {/* Sidebar Navigation - 1/4 of page */}
      <div 
        ref={sidebarRef}
        style={{
          position: 'fixed',
          left: 0,
          top: '56px',
          zIndex: 100,
          width: isInitialMount ? '25%' : (sidebarMinimized ? '60px' : '25%'),
          height: 'calc(100vh - 56px)',
          backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'white',
          padding: isInitialMount ? '32px 10px 48px 10px' : (sidebarMinimized ? '32px 10px 48px 10px' : '32px 10px 48px 10px'),
          borderRight: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#e0e0e0'}`,
          transition: isInitialMount ? 'none' : 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          transition: isInitialMount ? 'none' : 'gap 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingTop: '0',
          paddingBottom: '0',
          alignItems: 'stretch'
        }}>
          {/* Settings Header */}
          <div
            ref={settingsHeaderRef}
            style={{ position: 'relative' }}
            onMouseEnter={(e) => {
              setHoveringSettings(true)
              setShowTooltip(true)
              if (settingsHeaderRef.current) {
                const rect = settingsHeaderRef.current.getBoundingClientRect()
                if (sidebarMinimized) {
                  setTooltipPosition({
                    top: rect.top + rect.height / 2,
                    left: rect.right + 8
                  })
                } else {
                  setTooltipPosition({
                    top: rect.bottom + 4,
                    left: rect.left
                  })
                }
              }
            }}
            onMouseLeave={() => {
              setHoveringSettings(false)
              setShowTooltip(false)
            }}
          >
            <button
              onClick={() => setSidebarMinimized(!sidebarMinimized)}
              style={{
                width: isInitialMount ? '100%' : (sidebarMinimized ? '40px' : '100%'),
                height: '40px',
                padding: '0',
                margin: '0',
                border: 'none',
                backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isInitialMount ? 'flex-start' : (sidebarMinimized ? 'center' : 'flex-start'),
                transition: isInitialMount ? 'none' : 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), justifyContent 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                left: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                transition: 'none'
              }}>
                {sidebarMinimized ? (
                  <PanelLeft size={20} style={{ width: '20px', height: '20px' }} />
                ) : (
                  hoveringSettings ? (
                    <PanelLeft size={20} style={{ width: '20px', height: '20px' }} />
                  ) : (
                    <SettingsIcon size={20} style={{ width: '20px', height: '20px' }} />
                  )
                )}
              </div>
              {!sidebarMinimized && (
                <span style={{
                  marginLeft: '48px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                  whiteSpace: 'nowrap',
                  opacity: sidebarMinimized ? 0 : 1,
                  transition: isInitialMount ? 'none' : 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: 'none'
                }}>
                  Settings
                </span>
              )}
            </button>
          </div>
          {showTooltip && (
            <div
              style={{
                position: 'fixed',
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: sidebarMinimized ? 'translateY(-50%)' : 'none',
                padding: '4px 8px',
                backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.85)',
                color: 'white',
                fontSize: '12px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                zIndex: 10000,
                pointerEvents: 'none'
              }}
            >
              {sidebarMinimized ? 'Open sidebar' : 'Close sidebar'}
            </div>
          )}
          {settingsSections.map((section) => {
            const Icon = section.icon
            const isActive = activeTab === section.id
            return (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                style={{
                  width: isInitialMount ? '100%' : (sidebarMinimized ? '40px' : '100%'),
                  height: '40px',
                  padding: '0',
                  margin: '0',
                  border: 'none',
                  backgroundColor: isActive 
                    ? (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
                  borderRadius: isActive ? '6px' : '0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isInitialMount ? 'flex-start' : (sidebarMinimized ? 'center' : 'flex-start'),
                  transition: isInitialMount ? 'backgroundColor 0.2s ease, borderRadius 0.2s ease' : 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), justifyContent 0.4s cubic-bezier(0.4, 0, 0.2, 1), backgroundColor 0.2s ease, borderRadius 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  color: isActive 
                    ? (isDarkMode ? 'var(--text-primary, #fff)' : '#333')
                    : (isDarkMode ? 'var(--text-secondary, #ccc)' : '#666')
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  transition: 'none'
                }}>
                  <Icon size={20} style={{ width: '20px', height: '20px' }} />
                </div>
                {!sidebarMinimized && (
                  <span style={{
                    marginLeft: '48px',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 'normal',
                    whiteSpace: 'nowrap',
                    opacity: sidebarMinimized ? 0 : 1,
                    transition: isInitialMount ? 'none' : 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: 'none'
                  }}>
                    {section.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>


      {/* Main Content Area - 3/4 of page */}
      <div 
        ref={contentRef}
        style={{
          marginLeft: isInitialMount ? '25%' : (sidebarMinimized ? '60px' : '25%'),
          width: isInitialMount ? '75%' : (sidebarMinimized ? 'calc(100% - 60px)' : '75%'),
          flex: 1,
          padding: '48px 64px 64px 64px',
          backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'white',
          maxWidth: isInitialMount ? '1200px' : (sidebarMinimized ? 'none' : '1200px'),
          transition: isInitialMount ? 'none' : 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {message && (
          <div style={{
            padding: '16px 20px',
            marginBottom: '12px',
            borderRadius: '10px',
            backgroundColor: message.type === 'success' 
              ? (isDarkMode ? 'rgba(76, 175, 80, 0.2)' : '#e8f5e9')
              : (isDarkMode ? 'rgba(244, 67, 54, 0.2)' : '#ffebee'),
            color: message.type === 'success' ? '#4caf50' : '#f44336',
            border: `1px solid ${message.type === 'success' ? '#4caf50' : '#f44336'}`,
            boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {message.text}
          </div>
        )}

        {/* Content */}
        <div>
          {/* Save Button - Hidden for location, cash, and pos tabs (pos has its own at bottom) */}
          {activeTab !== 'location' && activeTab !== 'cash' && activeTab !== 'pos' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="button-26 button-26--header"
                role="button"
                onClick={
                  activeTab === 'rewards' ? saveRewardsSettings :
                  activeTab === 'sms' ? saveSmsSettings :
                  null
                }
                disabled={saving}
                style={{
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                <div className="button-26__content">
                  <span className="button-26__text text">
                    {saving 
                      ? (activeTab === 'rewards' ? 'Saving Rewards Settings...' : activeTab === 'sms' ? 'Saving...' : 'Saving...')
                      : (activeTab === 'rewards' ? 'Save Rewards Settings' : activeTab === 'sms' ? 'Save SMS Settings' : 'Save')
                    }
                  </span>
                </div>
              </button>
            </div>
          )}

      {/* Store Information Settings Tab */}
      {activeTab === 'location' && (
        <div>
          <FormTitle isDarkMode={isDarkMode} style={{ marginBottom: '12px' }}>
            Store Information
          </FormTitle>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Store Name, Type, and Logo */}
            <FormField style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Enter store name"
                  value={storeLocationSettings.store_name}
                  onChange={(e) => setStoreLocationSettings({ ...storeLocationSettings, store_name: e.target.value })}
                  style={inputBaseStyle(isDarkMode, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                />
                <CustomDropdown
                  value={storeLocationSettings.store_type}
                  onChange={(e) => setStoreLocationSettings({ ...storeLocationSettings, store_type: e.target.value })}
                  options={[
                    { value: 'retail', label: 'Retail Store' },
                    { value: 'restaurant', label: 'Restaurant' },
                    { value: 'cafe', label: 'Cafe' },
                    { value: 'grocery', label: 'Grocery Store' },
                    { value: 'pharmacy', label: 'Pharmacy' },
                    { value: 'convenience', label: 'Convenience Store' },
                    { value: 'other', label: 'Other' }
                  ]}
                  placeholder="Select store type"
                  isDarkMode={isDarkMode}
                  themeColorRgb={themeColorRgb}
                />
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Logo URL or file path"
                    value={storeLocationSettings.store_logo}
                    onChange={(e) => setStoreLocationSettings({ ...storeLocationSettings, store_logo: e.target.value })}
                    style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), flex: 1 }}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setStoreLocationSettings({ ...storeLocationSettings, store_logo: reader.result })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    style={{ display: 'none' }}
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: `rgba(${themeColorRgb}, 0.1)`,
                      color: `rgb(${themeColorRgb})`,
                      border: `1px solid rgba(${themeColorRgb}, 0.3)`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Upload
                  </label>
                </div>
                {storeLocationSettings.store_logo && (
                  <div style={{ marginTop: '8px' }}>
                    <img
                      src={storeLocationSettings.store_logo}
                      alt="Store logo preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '100px',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </FormField>

            {/* Store Address */}
            <FormField style={{ marginBottom: '8px' }}>
              <FormTitle isDarkMode={isDarkMode} style={{ marginBottom: '8px', fontSize: '15px', fontWeight: 600 }}>
                Store Address
              </FormTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Street Address"
                  value={storeLocationSettings.address}
                  onChange={(e) => setStoreLocationSettings({ ...storeLocationSettings, address: e.target.value })}
                  style={inputBaseStyle(isDarkMode, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="City"
                    value={storeLocationSettings.city}
                    onChange={(e) => setStoreLocationSettings({ ...storeLocationSettings, city: e.target.value })}
                    style={inputBaseStyle(isDarkMode, themeColorRgb)}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={storeLocationSettings.state}
                    onChange={(e) => setStoreLocationSettings({ ...storeLocationSettings, state: e.target.value })}
                    style={inputBaseStyle(isDarkMode, themeColorRgb)}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={storeLocationSettings.zip}
                    onChange={(e) => setStoreLocationSettings({ ...storeLocationSettings, zip: e.target.value })}
                    style={inputBaseStyle(isDarkMode, themeColorRgb)}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Country"
                  value={storeLocationSettings.country}
                  onChange={(e) => setStoreLocationSettings({ ...storeLocationSettings, country: e.target.value })}
                  style={inputBaseStyle(isDarkMode, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                />
              </div>
            </FormField>

            {/* Contact Information */}
            <FormField style={{ marginBottom: '8px' }}>
              <FormTitle isDarkMode={isDarkMode} style={{ marginBottom: '8px', fontSize: '15px', fontWeight: 600 }}>
                Contact Information
              </FormTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={storeLocationSettings.store_phone}
                  onChange={(e) => setStoreLocationSettings({ ...storeLocationSettings, store_phone: e.target.value })}
                  style={inputBaseStyle(isDarkMode, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={storeLocationSettings.store_email}
                  onChange={(e) => setStoreLocationSettings({ ...storeLocationSettings, store_email: e.target.value })}
                  style={inputBaseStyle(isDarkMode, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                />
                <input
                  type="url"
                  placeholder="Website URL"
                  value={storeLocationSettings.store_website}
                  onChange={(e) => setStoreLocationSettings({ ...storeLocationSettings, store_website: e.target.value })}
                  style={inputBaseStyle(isDarkMode, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                />
              </div>
            </FormField>

            {/* Store Hours */}
            <FormField style={{ marginBottom: '8px' }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <FormTitle isDarkMode={isDarkMode} style={{ marginBottom: 0, fontSize: '15px', fontWeight: 600 }}>
                  Store Hours
                </FormTitle>
                <button
                  onClick={() => setEditingStoreHours(!editingStoreHours)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: editingStoreHours 
                      ? `rgba(${themeColorRgb}, 0.2)`
                      : `rgba(${themeColorRgb}, 0.7)`,
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {editingStoreHours ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {(() => {
                // Generate current week days
                const today = new Date()
                const startOfWeek = new Date(today)
                startOfWeek.setDate(today.getDate() - today.getDay())
                startOfWeek.setHours(0, 0, 0, 0)
                
                // Map day names to store hours keys
                const dayNameToHoursKey = {
                  'sunday': 'sunday',
                  'monday': 'monday',
                  'tuesday': 'tuesday',
                  'wednesday': 'wednesday',
                  'thursday': 'thursday',
                  'friday': 'friday',
                  'saturday': 'saturday'
                }
                
                // Generate dates for each day of the week
                const weekDays = []
                for (let i = 0; i < 7; i++) {
                  const dayDate = new Date(startOfWeek)
                  dayDate.setDate(startOfWeek.getDate() + i)
                  const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
                  weekDays.push({
                    date: dayDate,
                    hoursKey: dayNameToHoursKey[dayName] || dayName,
                    dayName: dayName
                  })
                }
                
                const formatTime = (timeStr) => {
                  if (!timeStr) return ''
                  const [hours, minutes] = timeStr.split(':')
                  const hour = parseInt(hours)
                  const ampm = hour >= 12 ? 'PM' : 'AM'
                  const displayHour = hour % 12 || 12
                  return `${displayHour}:${minutes} ${ampm}`
                }
                
                return (
                  <div style={{
                    border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fafafa'
                  }}>
                    {/* Header */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      borderBottom: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #e0e0e0',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      backgroundColor: isDarkMode ? 'var(--bg-tertiary, #3a3a3a)' : '#f5f5f5'
                    }}>
                      {weekDays.map((dayInfo, index) => {
                        const isToday = dayInfo.date.toDateString() === new Date().toDateString()
                        const dayName = dayInfo.date.toLocaleDateString('en-US', { weekday: 'short' })
                        
                        return (
                          <div 
                            key={dayInfo.hoursKey}
                            style={{
                              padding: '12px 8px',
                              borderRight: index < 6 ? (isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #e0e0e0') : 'none',
                              textAlign: 'center',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: isDarkMode ? 'var(--text-primary, #fff)' : '#555',
                              backgroundColor: isToday ? (isDarkMode ? `rgba(${themeColorRgb}, 0.2)` : `rgba(${themeColorRgb}, 0.1)`) : 'transparent'
                            }}
                          >
                            {dayName}
                            <div style={{ fontSize: '11px', fontWeight: 400, marginTop: '4px', opacity: 0.7 }}>
                              {dayInfo.date.getDate()}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Store Hours Content */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                    }}>
                      {weekDays.map((dayInfo, index) => {
                        const dayHours = storeLocationSettings.store_hours[dayInfo.hoursKey]
                        const isOpen = !dayHours?.closed
                        
                        return (
                          <div 
                            key={dayInfo.hoursKey}
                            style={{
                              padding: editingStoreHours ? '12px 8px' : '20px 8px',
                              borderRight: index < 6 ? (isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #e0e0e0') : 'none',
                              textAlign: 'center',
                              minHeight: editingStoreHours ? 'auto' : '80px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: editingStoreHours ? '8px' : '0',
                              backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fafafa'
                            }}
                          >
                            {editingStoreHours ? (
                              <>
                                <label style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '6px', 
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  fontSize: '12px',
                                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={isOpen || false}
                                    onChange={(e) => {
                                      const newHours = { ...storeLocationSettings.store_hours }
                                      newHours[dayInfo.hoursKey] = { 
                                        ...newHours[dayInfo.hoursKey], 
                                        closed: !e.target.checked 
                                      }
                                      setStoreLocationSettings({ ...storeLocationSettings, store_hours: newHours })
                                    }}
                                    style={{ 
                                      cursor: 'pointer', 
                                      width: '16px', 
                                      height: '16px',
                                      accentColor: isDarkMode ? `rgb(${themeColorRgb})` : '#1a1a1a'
                                    }}
                                  />
                                  <span>Open</span>
                                </label>
                                {isOpen && (
                                  <>
                                    <input
                                      type="time"
                                      value={dayHours?.open || '09:00'}
                                      onChange={(e) => {
                                        const newHours = { ...storeLocationSettings.store_hours }
                                        newHours[dayInfo.hoursKey] = { ...newHours[dayInfo.hoursKey], open: e.target.value }
                                        setStoreLocationSettings({ ...storeLocationSettings, store_hours: newHours })
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '6px 8px',
                                        border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                        backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'white',
                                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                                        transition: 'border-color 0.2s'
                                      }}
                                      onFocus={(e) => e.target.style.borderColor = isDarkMode ? `rgb(${themeColorRgb})` : '#1a1a1a'}
                                      onBlur={(e) => e.target.style.borderColor = isDarkMode ? 'var(--border-color, #404040)' : '#ccc'}
                                    />
                                    <div style={{ fontSize: '11px', color: isDarkMode ? 'var(--text-secondary, #999)' : '#666' }}>to</div>
                                    <input
                                      type="time"
                                      value={dayHours?.close || '17:00'}
                                      onChange={(e) => {
                                        const newHours = { ...storeLocationSettings.store_hours }
                                        newHours[dayInfo.hoursKey] = { ...newHours[dayInfo.hoursKey], close: e.target.value }
                                        setStoreLocationSettings({ ...storeLocationSettings, store_hours: newHours })
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '6px 8px',
                                        border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                        backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'white',
                                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                                        transition: 'border-color 0.2s'
                                      }}
                                      onFocus={(e) => e.target.style.borderColor = isDarkMode ? `rgb(${themeColorRgb})` : '#1a1a1a'}
                                      onBlur={(e) => e.target.style.borderColor = isDarkMode ? 'var(--border-color, #404040)' : '#ccc'}
                                    />
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                {isOpen ? (
                                  <>
                                    <div style={{ 
                                      fontSize: '14px', 
                                      fontWeight: 600, 
                                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#1a1a1a',
                                      marginBottom: '4px'
                                    }}>
                                      {formatTime(dayHours?.open || '09:00')}
                                    </div>
                                    <div style={{ 
                                      fontSize: '12px', 
                                      color: isDarkMode ? 'var(--text-secondary, #999)' : '#666',
                                      marginBottom: '4px'
                                    }}>
                                      to
                                    </div>
                                    <div style={{ 
                                      fontSize: '14px', 
                                      fontWeight: 600, 
                                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#1a1a1a'
                                    }}>
                                      {formatTime(dayHours?.close || '17:00')}
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ 
                                    fontSize: '13px', 
                                    color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999',
                                    fontStyle: 'italic'
                                  }}>
                                    Closed
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </FormField>

            {/* Save Button */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`
            }}>
              <button
                type="button"
                className="button-26 button-26--header"
                role="button"
                onClick={saveStoreLocationSettings}
                disabled={saving}
                style={{
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                <div className="button-26__content">
                  <span className="button-26__text text">
                    {saving ? 'Saving Store Information...' : 'Save Store Information'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Rewards Settings Tab */}
      {activeTab === 'rewards' && (
        <div>
          <style>{`
            .checkbox-wrapper-2 .ikxBAC {
              appearance: none;
              background-color: #dfe1e4;
              border-radius: 72px;
              border-style: none;
              flex-shrink: 0;
              height: 20px;
              margin: 0;
              position: relative;
              width: 30px;
            }

            .checkbox-wrapper-2 .ikxBAC::before {
              bottom: -6px;
              content: "";
              left: -6px;
              position: absolute;
              right: -6px;
              top: -6px;
            }

            .checkbox-wrapper-2 .ikxBAC,
            .checkbox-wrapper-2 .ikxBAC::after {
              transition: all 100ms ease-out;
            }

            .checkbox-wrapper-2 .ikxBAC::after {
              background-color: #fff;
              border-radius: 50%;
              content: "";
              height: 14px;
              left: 3px;
              position: absolute;
              top: 3px;
              width: 14px;
            }

            .checkbox-wrapper-2 input[type=checkbox] {
              cursor: default;
            }

            .checkbox-wrapper-2 .ikxBAC:hover {
              background-color: #c9cbcd;
              transition-duration: 0s;
            }

            .checkbox-wrapper-2 .ikxBAC:checked {
              background-color: #6e79d6;
            }

            .checkbox-wrapper-2 .ikxBAC:checked::after {
              background-color: #fff;
              left: 13px;
            }

            .checkbox-wrapper-2 :focus:not(.focus-visible) {
              outline: 0;
            }

            .checkbox-wrapper-2 .ikxBAC:checked:hover {
              background-color: #535db3;
            }
          `}</style>
          <h2 style={{
            marginBottom: '20px',
            fontSize: '16px',
            fontWeight: 700,
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
          }}>
            Customer Rewards Program
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Customer Info Requirements - same switch style as Enable */}
                <div>
                  <h3 style={{
                    marginBottom: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    Customer Information Requirements
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}>
                      <div className="checkbox-wrapper-2">
                        <input
                          type="checkbox"
                          className="sc-gJwTLC ikxBAC"
                          checked={rewardsSettings.require_email}
                          onChange={(e) => setRewardsSettings({
                            ...rewardsSettings,
                            require_email: e.target.checked,
                            require_both: e.target.checked && rewardsSettings.require_phone
                          })}
                        />
                      </div>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 600,
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
                      <div className="checkbox-wrapper-2">
                        <input
                          type="checkbox"
                          className="sc-gJwTLC ikxBAC"
                          checked={rewardsSettings.require_phone}
                          onChange={(e) => setRewardsSettings({
                            ...rewardsSettings,
                            require_phone: e.target.checked,
                            require_both: rewardsSettings.require_email && e.target.checked
                          })}
                        />
                      </div>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}>
                        Require phone number
                      </span>
                    </label>
                  </div>
                </div>

                {/* Global: Minimum Spend - one field for all reward types */}
                <FormField style={{ marginBottom: '16px' }}>
                  <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '6px' }}>
                    Minimum Spend to Earn Rewards ($)
                  </FormLabel>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rewardsSettings.minimum_spend}
                    onChange={(e) => setRewardsSettings({
                      ...rewardsSettings,
                      minimum_spend: parseFloat(e.target.value) || 0.0
                    })}
                    style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '200px' }}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>

                {/* Points - own form with switch, always visible, disabled when off */}
                <FormField style={{
                  marginBottom: '16px',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #1f1f1f)' : '#f9f9f9',
                  opacity: rewardsSettings.points_enabled ? 1 : 0.7
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '12px' }}>
                    <div className="checkbox-wrapper-2">
                      <input
                        type="checkbox"
                        className="sc-gJwTLC ikxBAC"
                        checked={rewardsSettings.points_enabled}
                        onChange={(e) => setRewardsSettings({ ...rewardsSettings, points_enabled: e.target.checked, reward_type: e.target.checked ? 'points' : rewardsSettings.reward_type })}
                      />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                      Points (earn points per dollar spent)
                    </span>
                  </label>
                  <div style={{ marginLeft: '42px', pointerEvents: rewardsSettings.points_enabled ? 'auto' : 'none' }}>
                    <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '6px' }}>Points per Dollar Spent</FormLabel>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={rewardsSettings.points_per_dollar}
                      onChange={(e) => setRewardsSettings({ ...rewardsSettings, points_per_dollar: parseFloat(e.target.value) || 1.0 })}
                      style={inputBaseStyle(isDarkMode, themeColorRgb)}
                      {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                      disabled={!rewardsSettings.points_enabled}
                    />
                  </div>
                </FormField>

                {/* Percentage discount - own form with switch */}
                <FormField style={{
                  marginBottom: '16px',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #1f1f1f)' : '#f9f9f9',
                  opacity: rewardsSettings.percentage_enabled ? 1 : 0.7
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '12px' }}>
                    <div className="checkbox-wrapper-2">
                      <input
                        type="checkbox"
                        className="sc-gJwTLC ikxBAC"
                        checked={rewardsSettings.percentage_enabled}
                        onChange={(e) => setRewardsSettings({ ...rewardsSettings, percentage_enabled: e.target.checked, reward_type: e.target.checked ? 'percentage' : rewardsSettings.reward_type })}
                      />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                      Percentage discount
                    </span>
                  </label>
                  <div style={{ marginLeft: '42px', pointerEvents: rewardsSettings.percentage_enabled ? 'auto' : 'none' }}>
                    <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '6px' }}>Percentage Discount (%)</FormLabel>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={rewardsSettings.percentage_discount}
                      onChange={(e) => setRewardsSettings({ ...rewardsSettings, percentage_discount: parseFloat(e.target.value) || 0.0 })}
                      style={inputBaseStyle(isDarkMode, themeColorRgb)}
                      {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                      disabled={!rewardsSettings.percentage_enabled}
                    />
                  </div>
                </FormField>

                {/* Fixed discount - own form with switch */}
                <FormField style={{
                  marginBottom: '16px',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #1f1f1f)' : '#f9f9f9',
                  opacity: rewardsSettings.fixed_enabled ? 1 : 0.7
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '12px' }}>
                    <div className="checkbox-wrapper-2">
                      <input
                        type="checkbox"
                        className="sc-gJwTLC ikxBAC"
                        checked={rewardsSettings.fixed_enabled}
                        onChange={(e) => setRewardsSettings({ ...rewardsSettings, fixed_enabled: e.target.checked, reward_type: e.target.checked ? 'fixed' : rewardsSettings.reward_type })}
                      />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                      Fixed discount amount
                    </span>
                  </label>
                  <div style={{ marginLeft: '42px', pointerEvents: rewardsSettings.fixed_enabled ? 'auto' : 'none' }}>
                    <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '6px' }}>Fixed Discount Amount ($)</FormLabel>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rewardsSettings.fixed_discount}
                      onChange={(e) => setRewardsSettings({ ...rewardsSettings, fixed_discount: parseFloat(e.target.value) || 0.0 })}
                      style={inputBaseStyle(isDarkMode, themeColorRgb)}
                      {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                      disabled={!rewardsSettings.fixed_enabled}
                    />
                  </div>
                </FormField>

                {/* Rewards campaigns / Promotions */}
                <div style={{
                  marginTop: '24px',
                  paddingTop: '16px',
                  borderTop: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`
                }}>
                  <h3 style={{
                    marginBottom: '12px',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                  }}>
                    Rewards campaigns & promotions
                  </h3>
                  <p style={{
                    marginBottom: '12px',
                    fontSize: '14px',
                    color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666'
                  }}>
                    Create promo discounts, product discounts, or buy-one-get-one offers.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCampaign({ name: '', type: 'promo_discount', discount_value: '', product_id: null, buy_qty: 1, get_qty: 1 })
                      setShowCreateCampaignModal(true)
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      backgroundColor: `rgba(${themeColorRgb}, 0.15)`,
                      color: `rgb(${themeColorRgb})`,
                      border: `1px solid rgba(${themeColorRgb}, 0.4)`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={18} />
                    Create campaign
                  </button>
                  {rewardsCampaigns.length > 0 && (
                    <ul style={{ marginTop: '16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {rewardsCampaigns.map((c, i) => (
                        <li
                          key={c.id ?? i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : '#f0f0f0',
                            borderRadius: '8px',
                            border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>{c.name || 'Unnamed campaign'}</span>
                            <span style={{ marginLeft: '10px', fontSize: '13px', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666' }}>
                              {c.type === 'promo_discount' && 'Promo discount'}
                              {c.type === 'product_discount' && 'Product discount'}
                              {c.type === 'bogo' && 'Buy one get one'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setRewardsCampaigns(prev => {
                                const next = prev.filter((_, idx) => idx !== i)
                                localStorage.setItem('rewards_campaigns', JSON.stringify(next))
                                return next
                              })
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: isDarkMode ? '#999' : '#666' }}
                            aria-label="Delete campaign"
                          >
                            <Trash2 size={18} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Enable Rewards */}
                <div style={{
                  marginTop: '24px',
                  paddingTop: '12px',
                  borderTop: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer'
                  }}>
                    <div className="checkbox-wrapper-2">
                      <input
                        type="checkbox"
                        className="sc-gJwTLC ikxBAC"
                        checked={rewardsSettings.enabled}
                        onChange={(e) => setRewardsSettings({ ...rewardsSettings, enabled: e.target.checked })}
                      />
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                    }}>
                      Enable Customer Rewards Program
                    </span>
                  </label>
                </div>

                {/* Save Button */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '24px',
                  paddingTop: '12px',
                  borderTop: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`
                }}>
                  <button
                    type="button"
                    className="button-26 button-26--header"
                    role="button"
                    onClick={saveRewardsSettings}
                    disabled={saving}
                    style={{
                      opacity: saving ? 0.6 : 1,
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <div className="button-26__content">
                      <span className="button-26__text text">
                        {saving ? 'Saving...' : 'Save Rewards Settings'}
                      </span>
                    </div>
                  </button>
                </div>

                {/* Create campaign modal */}
                {showCreateCampaignModal && (
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10000
                    }}
                    onClick={() => setShowCreateCampaignModal(false)}
                  >
                    <div
                      style={{
                        backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '420px',
                        width: '90%',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                          Create rewards campaign
                        </h3>
                        <button type="button" onClick={() => setShowCreateCampaignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                          <X size={20} style={{ color: isDarkMode ? '#999' : '#666' }} />
                        </button>
                      </div>
                      <FormField style={{ marginBottom: '14px' }}>
                        <FormLabel isDarkMode={isDarkMode}>Campaign name</FormLabel>
                        <input
                          type="text"
                          placeholder="e.g. Summer Sale"
                          value={newCampaign.name}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                          style={inputBaseStyle(isDarkMode, themeColorRgb)}
                          {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                        />
                      </FormField>
                      <FormField style={{ marginBottom: '14px' }}>
                        <FormLabel isDarkMode={isDarkMode}>Promotion type</FormLabel>
                        <select
                          value={newCampaign.type}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, type: e.target.value }))}
                          style={inputBaseStyle(isDarkMode, themeColorRgb)}
                        >
                          <option value="promo_discount">Promo discount (% or $ off order)</option>
                          <option value="product_discount">Product discount (discount on specific product)</option>
                          <option value="bogo">Buy one get one (BOGO)</option>
                        </select>
                      </FormField>
                      {newCampaign.type === 'promo_discount' && (
                        <FormField style={{ marginBottom: '14px' }}>
                          <FormLabel isDarkMode={isDarkMode}>Discount value (% or $)</FormLabel>
                          <input
                            type="text"
                            placeholder="e.g. 10 or 10% or 5.00"
                            value={newCampaign.discount_value}
                            onChange={(e) => setNewCampaign(prev => ({ ...prev, discount_value: e.target.value }))}
                            style={inputBaseStyle(isDarkMode, themeColorRgb)}
                            {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                          />
                        </FormField>
                      )}
                      {newCampaign.type === 'product_discount' && (
                        <FormField style={{ marginBottom: '14px' }}>
                          <FormLabel isDarkMode={isDarkMode}>Product ID or name (optional)</FormLabel>
                          <input
                            type="text"
                            placeholder="Search or enter product ID"
                            value={newCampaign.product_id ?? ''}
                            onChange={(e) => setNewCampaign(prev => ({ ...prev, product_id: e.target.value || null }))}
                            style={inputBaseStyle(isDarkMode, themeColorRgb)}
                            {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                          />
                          <FormLabel isDarkMode={isDarkMode} style={{ marginTop: '8px' }}>Discount value (% or $)</FormLabel>
                          <input
                            type="text"
                            placeholder="e.g. 15% or 2.00"
                            value={newCampaign.discount_value}
                            onChange={(e) => setNewCampaign(prev => ({ ...prev, discount_value: e.target.value }))}
                            style={inputBaseStyle(isDarkMode, themeColorRgb)}
                            {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                          />
                        </FormField>
                      )}
                      {newCampaign.type === 'bogo' && (
                        <>
                          <FormField style={{ marginBottom: '14px' }}>
                            <FormLabel isDarkMode={isDarkMode}>Buy quantity</FormLabel>
                            <input
                              type="number"
                              min={1}
                              value={newCampaign.buy_qty}
                              onChange={(e) => setNewCampaign(prev => ({ ...prev, buy_qty: parseInt(e.target.value, 10) || 1 }))}
                              style={inputBaseStyle(isDarkMode, themeColorRgb)}
                              {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                            />
                          </FormField>
                          <FormField style={{ marginBottom: '14px' }}>
                            <FormLabel isDarkMode={isDarkMode}>Get quantity (free or discounted)</FormLabel>
                            <input
                              type="number"
                              min={1}
                              value={newCampaign.get_qty}
                              onChange={(e) => setNewCampaign(prev => ({ ...prev, get_qty: parseInt(e.target.value, 10) || 1 }))}
                              style={inputBaseStyle(isDarkMode, themeColorRgb)}
                              {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                            />
                          </FormField>
                        </>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button
                          type="button"
                          onClick={() => setShowCreateCampaignModal(false)}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '8px',
                            border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                            background: 'transparent',
                            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const campaign = {
                              id: Date.now(),
                              name: newCampaign.name || 'Unnamed campaign',
                              type: newCampaign.type,
                              discount_value: newCampaign.discount_value,
                              product_id: newCampaign.product_id,
                              buy_qty: newCampaign.buy_qty,
                              get_qty: newCampaign.get_qty
                            }
                            setRewardsCampaigns(prev => {
                              const next = [...prev, campaign]
                              localStorage.setItem('rewards_campaigns', JSON.stringify(next))
                              return next
                            })
                            setShowCreateCampaignModal(false)
                            setNewCampaign({ name: '', type: 'promo_discount', discount_value: '', product_id: null, buy_qty: 1, get_qty: 1 })
                          }}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: `rgba(${themeColorRgb}, 0.9)`,
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600
                          }}
                        >
                          Create campaign
                        </button>
                      </div>
                    </div>
                  </div>
                )}
          </div>
        </div>
      )}

      {/* POS Settings Tab */}
      {activeTab === 'pos' && (
        <div>
          <FormTitle isDarkMode={isDarkMode} style={{ marginBottom: '12px' }}>
            POS Configuration
          </FormTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Register Type */}
            <FormField>
              <FormTitle isDarkMode={isDarkMode} style={{ marginBottom: '8px', fontSize: '15px', fontWeight: 600 }}>
                Register Type
              </FormTitle>
              <CustomDropdown
                value={posSettings.register_type}
                onChange={(e) => setPosSettings({ ...posSettings, register_type: e.target.value })}
                options={[
                  { value: 'one_screen', label: 'One Screen Register' },
                  { value: 'two_screen', label: 'Two Screen Register' }
                ]}
                placeholder="Select register type"
                isDarkMode={isDarkMode}
                themeColorRgb={themeColorRgb}
                style={{ maxWidth: '320px' }}
              />
              <p style={{
                marginTop: '8px',
                fontSize: '14px',
                color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                lineHeight: 1.4
              }}>
                {posSettings.register_type === 'one_screen'
                  ? 'Single display screen for both cashier and customer view.'
                  : posSettings.register_type === 'two_screen'
                    ? 'Separate displays for cashier and customer.'
                    : 'Choose a register type above.'}
              </p>
            </FormField>

            {/* Customer Display Settings */}
            <div style={{
              marginTop: '16px'
            }}>
              <FormTitle isDarkMode={isDarkMode} style={{ marginBottom: '8px', fontSize: '15px', fontWeight: 600 }}>
                Customer Display Settings
              </FormTitle>
              
              <FormField>
                <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>
                  Enable tip prompts before payment
                </FormLabel>
                <CustomDropdown
                  value={displaySettings.tip_enabled ? 'enabled' : 'disabled'}
                  onChange={(e) => setDisplaySettings({ ...displaySettings, tip_enabled: e.target.value === 'enabled' })}
                  options={[
                    { value: 'enabled', label: 'Enabled' },
                    { value: 'disabled', label: 'Disabled' }
                  ]}
                  placeholder="Select"
                  isDarkMode={isDarkMode}
                  themeColorRgb={themeColorRgb}
                  style={{ maxWidth: '200px' }}
                />
              </FormField>

              <FormField>
                <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>
                  Require signature
                </FormLabel>
                <CustomDropdown
                  value={displaySettings.require_signature}
                  onChange={(e) => setDisplaySettings({ ...displaySettings, require_signature: e.target.value })}
                  options={[
                    { value: 'not_required', label: 'Not required' },
                    { value: 'required', label: 'Required' }
                  ]}
                  placeholder="Select"
                  isDarkMode={isDarkMode}
                  themeColorRgb={themeColorRgb}
                  style={{ maxWidth: '200px' }}
                />
                <p style={{
                  marginTop: '6px',
                  fontSize: '13px',
                  color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                  lineHeight: 1.4
                }}>
                  {displaySettings.require_signature === 'required'
                    ? 'Print, no receipt, and email cannot be used without signing first.'
                    : 'Print, no receipt, and email can be used without signing.'}
                </p>
              </FormField>
            </div>

            {/* Receipt Template – preset, preview, Edit, Print test */}
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#e0e0e0'}`
            }}>
              <FormTitle isDarkMode={isDarkMode} style={{ marginBottom: '12px', fontSize: '15px', fontWeight: 600 }}>
                Receipt Template
              </FormTitle>
              {!receiptEditModalOpen && (
                <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <ReceiptPreview
                    settings={receiptSettings}
                    id="receipt-preview-print"
                    isDarkMode={isDarkMode}
                    themeColorRgb={themeColorRgb}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <CustomDropdown
                      value={receiptSettings.template_preset || 'custom'}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v.startsWith('template_')) {
                          const id = parseInt(v.replace('template_', ''), 10)
                          const t = savedTemplates.find(x => x.id === id)
                          if (t && t.settings) {
                            setReceiptSettings({ ...DEFAULT_RECEIPT_TEMPLATE, ...t.settings, template_preset: v })
                          } else {
                            setReceiptSettings(prev => ({ ...prev, template_preset: v }))
                          }
                        } else if (v !== 'custom') {
                          applyTemplatePreset(v)
                        } else {
                          setReceiptSettings(prev => ({ ...prev, template_preset: v }))
                        }
                      }}
                      options={[
                        { value: 'custom', label: 'Custom' },
                        { value: 'modern', label: 'Modern' },
                        { value: 'classic', label: 'Classic' },
                        { value: 'minimal', label: 'Minimal' },
                        ...savedTemplates.map(t => ({ value: `template_${t.id}`, label: t.name }))
                      ]}
                      placeholder="Preset"
                      isDarkMode={isDarkMode}
                      themeColorRgb={themeColorRgb}
                      style={{ maxWidth: '140px', padding: '6px 10px' }}
                    />
                    <button
                      type="button"
                      className="button-26 button-26--header"
                      role="button"
                      onClick={() => setReceiptEditModalOpen(true)}
                    >
                      <div className="button-26__content">
                        <span className="button-26__text text">Edit</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="button-26 button-26--header"
                      role="button"
                      onClick={printTestReceipt}
                    >
                      <div className="button-26__content">
                        <Printer size={14} style={{ marginRight: '6px', color: '#888' }} />
                        <span className="button-26__text text">Print test</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Checkout UI – Edit opens modal with controls left, preview right (exact checkout styles) */}
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#e0e0e0'}`
            }}>
              <FormTitle isDarkMode={isDarkMode} style={{ marginBottom: '12px', fontSize: '15px', fontWeight: 600 }}>
                Checkout UI
              </FormTitle>
              {!checkoutUiEditModalOpen && (
                <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '500px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'review_order', label: 'Review Your Order' },
                        { id: 'cash_confirmation', label: 'Cash to Cashier' },
                        { id: 'receipt', label: 'Sign Below' }
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setCheckoutUiTab(id)}
                          style={{
                            padding: '8px 14px',
                            fontSize: '13px',
                            border: `1px solid ${checkoutUiTab === id ? `rgba(${themeColorRgb}, 0.7)` : (isDarkMode ? 'var(--border-color, #404040)' : '#ddd')}`,
                            borderRadius: '8px',
                            background: checkoutUiTab === id ? `rgba(${themeColorRgb}, 0.15)` : (isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff'),
                            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                            cursor: 'pointer',
                            fontWeight: checkoutUiTab === id ? 600 : 400
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="button-26 button-26--header"
                      role="button"
                      onClick={() => setCheckoutUiEditModalOpen(true)}
                    >
                      <div className="button-26__content">
                        <span className="button-26__text text">Edit</span>
                      </div>
                    </button>
                  </div>
                  <div style={{
                    width: '100%',
                    maxWidth: '500px',
                    minHeight: '280px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}>
                    {checkoutUiTab === 'review_order' && (() => {
                      const s = checkoutUiSettings.review_order || {}
                      const bg = s.backgroundColor || '#e8f0fe'
                      const btn = s.buttonColor || '#4a90e2'
                      const tc = s.textColor || '#1a1a1a'
                      const titleStyle = getCheckoutTextStyle(s, 'title')
                      const bodyStyle = getCheckoutTextStyle(s, 'body')
                      const btnTextStyle = getCheckoutTextStyle(s, 'button')
                      const styleId = s.button_style || 'default'
                      return (
                        <div style={{ padding: '20px', minHeight: '280px', backgroundColor: bg, color: tc, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ textAlign: titleStyle.textAlign, marginBottom: '20px', ...titleStyle }}>Review Your Order</div>
                          <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '15px', padding: '20px', marginBottom: '20px', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.1)', ...bodyStyle }}><span>Sample Item</span><span>$9.99</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', ...bodyStyle }}><span>Another Item × 2</span><span>$24.00</span></div>
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '15px', padding: '20px', marginBottom: '20px', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '28px', ...bodyStyle }}><span>Subtotal</span><span>$33.99</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '28px', ...bodyStyle }}><span>Tax</span><span>$2.72</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid currentColor', marginTop: '8px', paddingTop: '8px', fontSize: '42px', fontWeight: 'bold', ...bodyStyle }}><span>Total</span><span>$36.71</span></div>
                          </div>
                          <div style={{ display: 'flex', gap: '20px', width: '100%', marginTop: '20px' }}>
                            {renderCheckoutPreviewButton('Cash', styleId, btn, btnTextStyle)}
                            {renderCheckoutPreviewButton('Card', styleId, btn, btnTextStyle)}
                          </div>
                        </div>
                      )
                    })()}
                    {checkoutUiTab === 'cash_confirmation' && (() => {
                      const s = checkoutUiSettings.cash_confirmation || {}
                      const bg = s.backgroundColor || '#e8f0fe'
                      const tc = s.textColor || '#1a1a1a'
                      const titleStyle = getCheckoutTextStyle(s, 'title')
                      const bodyStyle = getCheckoutTextStyle(s, 'body')
                      return (
                        <div style={{ padding: '20px', minHeight: '280px', backgroundColor: bg, color: tc, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                          <div style={{ textAlign: titleStyle.textAlign, marginBottom: '24px', ...titleStyle }}>Please give the cash amount to the cashier</div>
                          <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '15px', padding: '20px', width: '100%', maxWidth: '320px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '28px', ...bodyStyle }}><span>Subtotal</span><span>$33.99</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '28px', ...bodyStyle }}><span>Tax</span><span>$2.72</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid currentColor', marginTop: '8px', paddingTop: '8px', fontSize: '42px', fontWeight: 'bold', ...bodyStyle }}><span>Total</span><span>$36.71</span></div>
                          </div>
                        </div>
                      )
                    })()}
                    {checkoutUiTab === 'receipt' && (() => {
                      const s = checkoutUiSettings.receipt || {}
                      const bg = s.backgroundColor || '#e8f0fe'
                      const btn = s.buttonColor || '#4a90e2'
                      const tc = s.textColor || '#1a1a1a'
                      const titleStyle = getCheckoutTextStyle(s, 'title')
                      const bodyStyle = getCheckoutTextStyle(s, 'body')
                      const btnTextStyle = getCheckoutTextStyle(s, 'button')
                      const styleId = s.button_style || 'default'
                      const sigBg = s.signature_background || '#ffffff'
                      const sigBorderW = s.signature_border_width ?? 2
                      const sigBorderColor = s.signature_border_color || 'rgba(0,0,0,0.2)'
                      const sigInk = s.signature_ink_color || '#000000'
                      return (
                        <div style={{ padding: '20px', minHeight: '280px', backgroundColor: bg, color: tc, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ textAlign: titleStyle.textAlign, marginBottom: '20px', ...titleStyle }}>Sign Below</div>
                          <div style={{ width: '100%', height: '250px', border: `${sigBorderW}px solid ${sigBorderColor}`, borderRadius: '8px', marginBottom: '20px', background: sigBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sigInk, ...bodyStyle }}>Signature area</div>
                          <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
                            {renderCheckoutPreviewButton('Print', styleId, btn, btnTextStyle)}
                            {renderCheckoutPreviewButton('No Receipt', styleId, btn, btnTextStyle)}
                          </div>
                          {renderCheckoutPreviewButton('Email', styleId, btn, btnTextStyle, true)}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Checkout UI Edit modal – left: controls, right: exact checkout preview */}
            {checkoutUiEditModalOpen && (
              <div
                style={{
                  position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.5)', padding: '24px'
                }}
                onClick={() => setCheckoutUiEditModalOpen(false)}
              >
                <div
                  style={{
                    background: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff',
                    borderRadius: '12px', maxWidth: '95vw', width: '1200px', maxHeight: '90vh',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#e0e0e0'}`, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {[
                        { id: 'review_order', label: 'Review Your Order' },
                        { id: 'cash_confirmation', label: 'Cash to Cashier' },
                        { id: 'receipt', label: 'Sign Below' }
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setCheckoutUiTab(id)}
                          style={{
                            padding: '8px 14px', fontSize: '13px',
                            border: `1px solid ${checkoutUiTab === id ? `rgba(${themeColorRgb}, 0.7)` : (isDarkMode ? 'var(--border-color, #404040)' : '#ddd')}`,
                            borderRadius: '6px',
                            background: checkoutUiTab === id ? `rgba(${themeColorRgb}, 0.15)` : (isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff'),
                            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                            cursor: 'pointer',
                            fontWeight: checkoutUiTab === id ? 600 : 400
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={handleCheckoutUiUndo}
                        disabled={checkoutUiUndoStack.length === 0}
                        title="Undo"
                        style={{
                          padding: '6px 12px', fontSize: '12px',
                          border: `1px solid ${checkoutUiUndoStack.length === 0 ? (isDarkMode ? 'var(--border-color, #404040)' : '#ddd') : (isDarkMode ? 'var(--border-color, #404040)' : '#ccc')}`,
                          borderRadius: '6px',
                          background: checkoutUiUndoStack.length === 0 ? (isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f5f5f5') : (isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff'),
                          color: checkoutUiUndoStack.length === 0 ? (isDarkMode ? 'var(--text-tertiary, #666)' : '#999') : (isDarkMode ? 'var(--text-primary, #fff)' : '#333'),
                          cursor: checkoutUiUndoStack.length === 0 ? 'default' : 'pointer',
                          opacity: checkoutUiUndoStack.length === 0 ? 0.7 : 1
                        }}
                      >
                        Undo
                      </button>
                      <button
                        type="button"
                        onClick={handleCheckoutUiRedo}
                        disabled={checkoutUiRedoStack.length === 0}
                        title="Redo"
                        style={{
                          padding: '6px 12px', fontSize: '12px',
                          border: `1px solid ${checkoutUiRedoStack.length === 0 ? (isDarkMode ? 'var(--border-color, #404040)' : '#ddd') : (isDarkMode ? 'var(--border-color, #404040)' : '#ccc')}`,
                          borderRadius: '6px',
                          background: checkoutUiRedoStack.length === 0 ? (isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f5f5f5') : (isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff'),
                          color: checkoutUiRedoStack.length === 0 ? (isDarkMode ? 'var(--text-tertiary, #666)' : '#999') : (isDarkMode ? 'var(--text-primary, #fff)' : '#333'),
                          cursor: checkoutUiRedoStack.length === 0 ? 'default' : 'pointer',
                          opacity: checkoutUiRedoStack.length === 0 ? 0.7 : 1
                        }}
                      >
                        Redo
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                    <div style={{ flex: '0 0 320px', overflowY: 'auto', padding: '16px', borderRight: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#e0e0e0'}` }}>
                      <FormField>
                        <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Background color</FormLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="color" value={checkoutUiSettings[checkoutUiTab]?.backgroundColor || '#e8f0fe'} onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), backgroundColor: e.target.value } }))} style={{ width: '40px', height: '36px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                          <input type="text" value={checkoutUiSettings[checkoutUiTab]?.backgroundColor || '#e8f0fe'} onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), backgroundColor: e.target.value } }))} style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), flex: 1, fontSize: '13px' }} />
                        </div>
                      </FormField>
                      <FormField>
                        <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Button color</FormLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="color" value={checkoutUiSettings[checkoutUiTab]?.buttonColor || '#4a90e2'} onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), buttonColor: e.target.value } }))} style={{ width: '40px', height: '36px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                          <input type="text" value={checkoutUiSettings[checkoutUiTab]?.buttonColor || '#4a90e2'} onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), buttonColor: e.target.value } }))} style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), flex: 1, fontSize: '13px' }} />
                        </div>
                      </FormField>
                      <FormField>
                        <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Text color (body)</FormLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="color" value={checkoutUiSettings[checkoutUiTab]?.textColor || '#1a1a1a'} onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), textColor: e.target.value } }))} style={{ width: '40px', height: '36px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                          <input type="text" value={checkoutUiSettings[checkoutUiTab]?.textColor || '#1a1a1a'} onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), textColor: e.target.value } }))} style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), flex: 1, fontSize: '13px' }} />
                        </div>
                      </FormField>
                      <FormField>
                        <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Title text</FormLabel>
                        <TextFormattingToolbar
                          font={checkoutUiSettings[checkoutUiTab]?.title_font || 'system-ui'}
                          onFontChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), title_font: e.target.value } }))}
                          fontSize={checkoutUiSettings[checkoutUiTab]?.title_font_size ?? 36}
                          onFontSizeChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), title_font_size: Math.min(72, Math.max(12, Number(e.target.value) || 36)) } }))}
                          bold={checkoutUiSettings[checkoutUiTab]?.title_bold}
                          onBoldToggle={() => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), title_bold: !(prev[checkoutUiTab]?.title_bold) } }))}
                          italic={checkoutUiSettings[checkoutUiTab]?.title_italic}
                          onItalicToggle={() => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), title_italic: !(prev[checkoutUiTab]?.title_italic) } }))}
                          align={checkoutUiSettings[checkoutUiTab]?.title_align || 'center'}
                          onAlignChange={(align) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), title_align: align } }))}
                          isDarkMode={isDarkMode}
                          themeColorRgb={themeColorRgb}
                        />
                      </FormField>
                      <FormField>
                        <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Body / section text</FormLabel>
                        <TextFormattingToolbar
                          font={checkoutUiSettings[checkoutUiTab]?.body_font || 'system-ui'}
                          onFontChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), body_font: e.target.value } }))}
                          fontSize={checkoutUiSettings[checkoutUiTab]?.body_font_size ?? 24}
                          onFontSizeChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), body_font_size: Math.min(48, Math.max(10, Number(e.target.value) || 24)) } }))}
                          bold={checkoutUiSettings[checkoutUiTab]?.body_bold}
                          onBoldToggle={() => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), body_bold: !(prev[checkoutUiTab]?.body_bold) } }))}
                          italic={checkoutUiSettings[checkoutUiTab]?.body_italic}
                          onItalicToggle={() => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), body_italic: !(prev[checkoutUiTab]?.body_italic) } }))}
                          align={checkoutUiSettings[checkoutUiTab]?.body_align || 'left'}
                          onAlignChange={(align) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), body_align: align } }))}
                          isDarkMode={isDarkMode}
                          themeColorRgb={themeColorRgb}
                        />
                      </FormField>
                      {(checkoutUiTab === 'review_order' || checkoutUiTab === 'receipt') && (
                        <>
                          <FormField>
                            <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Button style</FormLabel>
                            <CustomDropdown
                              value={checkoutUiSettings[checkoutUiTab]?.button_style || 'default'}
                              onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), button_style: e.target.value } }))}
                              options={CHECKOUT_BUTTON_STYLES}
                              placeholder="Style"
                              isDarkMode={isDarkMode}
                              themeColorRgb={themeColorRgb}
                              style={{ width: '100%' }}
                            />
                          </FormField>
                          <FormField>
                            <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Button text</FormLabel>
                            <TextFormattingToolbar
                              font={checkoutUiSettings[checkoutUiTab]?.button_font || 'system-ui'}
                              onFontChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), button_font: e.target.value } }))}
                              fontSize={checkoutUiSettings[checkoutUiTab]?.button_font_size ?? 36}
                              onFontSizeChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), button_font_size: Math.min(48, Math.max(12, Number(e.target.value) || 36)) } }))}
                              bold={checkoutUiSettings[checkoutUiTab]?.button_bold !== false}
                              onBoldToggle={() => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), button_bold: !(prev[checkoutUiTab]?.button_bold !== false) } }))}
                              italic={checkoutUiSettings[checkoutUiTab]?.button_italic}
                              onItalicToggle={() => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, [checkoutUiTab]: { ...(prev[checkoutUiTab] || {}), button_italic: !(prev[checkoutUiTab]?.button_italic) } }))}
                              align="center"
                              onAlignChange={() => {}}
                              isDarkMode={isDarkMode}
                              themeColorRgb={themeColorRgb}
                            />
                          </FormField>
                        </>
                      )}
                      {checkoutUiTab === 'receipt' && (
                        <>
                          <FormField>
                            <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Signature area background</FormLabel>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input type="color" value={checkoutUiSettings.receipt?.signature_background || '#ffffff'} onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, receipt: { ...(prev.receipt || {}), signature_background: e.target.value } }))} style={{ width: '40px', height: '36px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                              <input type="text" value={checkoutUiSettings.receipt?.signature_background || '#ffffff'} onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, receipt: { ...(prev.receipt || {}), signature_background: e.target.value } }))} style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), flex: 1, fontSize: '13px' }} />
                            </div>
                          </FormField>
                          <FormField>
                            <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Signature border (outline)</FormLabel>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <label style={{ fontSize: '12px', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666' }}>Width</label>
                                <input type="number" min={0} max={8} value={checkoutUiSettings.receipt?.signature_border_width ?? 2} onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, receipt: { ...(prev.receipt || {}), signature_border_width: Math.min(8, Math.max(0, Number(e.target.value) || 0)) } }))} style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), width: '56px', fontSize: '13px' }} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                <input type="color" value={typeof checkoutUiSettings.receipt?.signature_border_color === 'string' && checkoutUiSettings.receipt.signature_border_color.startsWith('#') ? checkoutUiSettings.receipt.signature_border_color : '#000000'} onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, receipt: { ...(prev.receipt || {}), signature_border_color: e.target.value } }))} style={{ width: '40px', height: '36px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                                <input type="text" value={checkoutUiSettings.receipt?.signature_border_color || 'rgba(0,0,0,0.2)'} onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, receipt: { ...(prev.receipt || {}), signature_border_color: e.target.value } }))} style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), flex: 1, fontSize: '13px' }} />
                              </div>
                            </div>
                          </FormField>
                          <FormField>
                            <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Signature ink color</FormLabel>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input type="color" value={checkoutUiSettings.receipt?.signature_ink_color || '#000000'} onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, receipt: { ...(prev.receipt || {}), signature_ink_color: e.target.value } }))} style={{ width: '40px', height: '36px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                              <input type="text" value={checkoutUiSettings.receipt?.signature_ink_color || '#000000'} onChange={(e) => setCheckoutUiSettingsWithUndo(prev => ({ ...prev, receipt: { ...(prev.receipt || {}), signature_ink_color: e.target.value } }))} style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), flex: 1, fontSize: '13px' }} />
                            </div>
                          </FormField>
                        </>
                      )}
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f5f5f5' }}>
                      <div style={{ width: '100%', maxWidth: '800px', minHeight: '500px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                        {checkoutUiTab === 'review_order' && (() => {
                          const s = checkoutUiSettings.review_order || {}
                          const bg = s.backgroundColor || '#e8f0fe'
                          const btn = s.buttonColor || '#4a90e2'
                          const tc = s.textColor || '#1a1a1a'
                          const titleStyle = getCheckoutTextStyle(s, 'title')
                          const bodyStyle = getCheckoutTextStyle(s, 'body')
                          const btnTextStyle = getCheckoutTextStyle(s, 'button')
                          const styleId = s.button_style || 'default'
                          return (
                            <div style={{ padding: '20px', minHeight: '500px', backgroundColor: bg, color: tc, display: 'flex', flexDirection: 'column' }}>
                              <div style={{ textAlign: titleStyle.textAlign, marginBottom: '30px', ...titleStyle }}>Review Your Order</div>
                              <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '15px', padding: '20px', marginBottom: '20px', width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.1)', ...bodyStyle }}><span>Sample Item</span><span>$9.99</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', ...bodyStyle }}><span>Another Item × 2</span><span>$24.00</span></div>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '15px', padding: '20px', marginBottom: '20px', width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '28px', ...bodyStyle }}><span>Subtotal</span><span>$33.99</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '28px', ...bodyStyle }}><span>Tax</span><span>$2.72</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid currentColor', marginTop: '8px', paddingTop: '8px', fontSize: '42px', fontWeight: 'bold', ...bodyStyle }}><span>Total</span><span>$36.71</span></div>
                              </div>
                              <div style={{ display: 'flex', gap: '20px', width: '100%', marginTop: '20px' }}>
                                {renderCheckoutPreviewButton('Cash', styleId, btn, btnTextStyle)}
                                {renderCheckoutPreviewButton('Card', styleId, btn, btnTextStyle)}
                              </div>
                            </div>
                          )
                        })()}
                        {checkoutUiTab === 'cash_confirmation' && (() => {
                          const s = checkoutUiSettings.cash_confirmation || {}
                          const bg = s.backgroundColor || '#e8f0fe'
                          const tc = s.textColor || '#1a1a1a'
                          const titleStyle = getCheckoutTextStyle(s, 'title')
                          const bodyStyle = getCheckoutTextStyle(s, 'body')
                          return (
                            <div style={{ padding: '20px', minHeight: '500px', backgroundColor: bg, color: tc, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                              <div style={{ textAlign: titleStyle.textAlign, marginBottom: '24px', ...titleStyle }}>Please give the cash amount to the cashier</div>
                              <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '15px', padding: '20px', width: '100%', maxWidth: '320px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '28px', ...bodyStyle }}><span>Subtotal</span><span>$33.99</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '28px', ...bodyStyle }}><span>Tax</span><span>$2.72</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid currentColor', marginTop: '8px', paddingTop: '8px', fontSize: '42px', fontWeight: 'bold', ...bodyStyle }}><span>Total</span><span>$36.71</span></div>
                              </div>
                            </div>
                          )
                        })()}
                        {checkoutUiTab === 'receipt' && (() => {
                          const s = checkoutUiSettings.receipt || {}
                          const bg = s.backgroundColor || '#e8f0fe'
                          const btn = s.buttonColor || '#4a90e2'
                          const tc = s.textColor || '#1a1a1a'
                          const titleStyle = getCheckoutTextStyle(s, 'title')
                          const bodyStyle = getCheckoutTextStyle(s, 'body')
                          const btnTextStyle = getCheckoutTextStyle(s, 'button')
                          const styleId = s.button_style || 'default'
                          const sigBg = s.signature_background || '#ffffff'
                          const sigBorderW = s.signature_border_width ?? 2
                          const sigBorderColor = s.signature_border_color || 'rgba(0,0,0,0.2)'
                          const sigInk = s.signature_ink_color || '#000000'
                          return (
                            <div style={{ padding: '20px', minHeight: '500px', backgroundColor: bg, color: tc, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ textAlign: titleStyle.textAlign, marginBottom: '20px', ...titleStyle }}>Sign Below</div>
                              <div style={{ width: '100%', height: '250px', border: `${sigBorderW}px solid ${sigBorderColor}`, borderRadius: '8px', marginBottom: '20px', background: sigBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sigInk, ...bodyStyle }}>Signature area</div>
                              <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
                                {renderCheckoutPreviewButton('Print', styleId, btn, btnTextStyle)}
                                {renderCheckoutPreviewButton('No Receipt', styleId, btn, btnTextStyle)}
                              </div>
                              {renderCheckoutPreviewButton('Email', styleId, btn, btnTextStyle, true)}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px', borderTop: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#e0e0e0'}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setCheckoutUiEditModalOpen(false)}
                      style={{
                        padding: '8px 16px', fontSize: '14px', border: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`,
                        borderRadius: '8px', background: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333', cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="button-26 button-26--header"
                      role="button"
                      onClick={async () => {
                        setSaving(true)
                        setMessage(null)
                        try {
                          const sessionToken = localStorage.getItem('sessionToken')
                          const res = await fetch('/api/customer-display/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
                            body: JSON.stringify({ checkout_ui: checkoutUiSettings })
                          })
                          const data = await res.json()
                          if (data.success) {
                            setCheckoutUiEditModalOpen(false)
                            setMessage({ type: 'success', text: 'Saved' })
                            setTimeout(() => setMessage(null), 3000)
                          } else {
                            setMessage({ type: 'error', text: data.message || 'Failed to save' })
                          }
                        } catch (err) {
                          console.error(err)
                          setMessage({ type: 'error', text: 'Failed to save' })
                        } finally {
                          setSaving(false)
                        }
                      }}
                      disabled={saving}
                    >
                      <div className="button-26__content"><span className="button-26__text text">{saving ? 'Saving…' : 'Save'}</span></div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit modal – left: settings, right: preview; bottom: Save, Print test */}
            {receiptEditModalOpen && (
              <div
                style={{
                  position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.5)', padding: '24px'
                }}
                onClick={() => setReceiptEditModalOpen(false)}
              >
                <div
                  style={{
                    background: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff',
                    borderRadius: '12px', maxWidth: '95vw', width: '1200px', maxHeight: '90vh',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                    <div style={{ flex: '1 1 50%', overflowY: 'auto', padding: '16px', borderRight: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#e0e0e0'}` }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        {['header', 'body_items', 'body_totals', 'body_barcode', 'footer', 'styling'].map(s => {
                          const labels = { header: 'Header', body_items: 'Line items', body_totals: 'Totals', body_barcode: 'Date & barcode', footer: 'Footer', styling: 'Styling' }
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setActiveReceiptSection(activeReceiptSection === s ? null : s)}
                              style={{
                                padding: '6px 10px', fontSize: '12px',
                                border: `1px solid ${activeReceiptSection === s ? `rgba(${themeColorRgb}, 0.7)` : (isDarkMode ? 'var(--border-color, #404040)' : '#ddd')}`,
                                borderRadius: '6px',
                                background: activeReceiptSection === s ? `rgba(${themeColorRgb}, 0.15)` : (isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff'),
                                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                                cursor: 'pointer'
                              }}
                            >
                              {labels[s]}
                            </button>
                          )
                        })}
                      </div>
                      {activeReceiptSection && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Header Settings */}
                    {activeReceiptSection === 'header' && (
                      <>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Store name</FormLabel>
                          <input type="text" placeholder="Store" value={receiptSettings.store_name} onChange={(e) => setReceiptSettings({ ...receiptSettings, store_name: e.target.value })} style={inputBaseStyle(isDarkMode, themeColorRgb)} {...getInputFocusHandlers(themeColorRgb, isDarkMode)} />
                          
                          {/* Toolbar - Google Docs style */}
                          <TextFormattingToolbar
                            font={receiptSettings.store_name_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, store_name_font: e.target.value })}
                            fontSize={receiptSettings.store_name_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, store_name_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 14)) })}
                            bold={receiptSettings.store_name_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, store_name_bold: !receiptSettings.store_name_bold })}
                            italic={receiptSettings.store_name_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, store_name_italic: !receiptSettings.store_name_italic })}
                            align={receiptSettings.store_name_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, store_name_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Store address (multiple lines)</FormLabel>
                          <textarea placeholder="Street, City, State ZIP" value={receiptSettings.store_address} onChange={(e) => setReceiptSettings({ ...receiptSettings, store_address: e.target.value })} rows={2} style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), resize: 'vertical', fontFamily: 'inherit', minHeight: '56px' }} {...getInputFocusHandlers(themeColorRgb, isDarkMode)} />
                          <TextFormattingToolbar
                            font={receiptSettings.store_address_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, store_address_font: e.target.value })}
                            fontSize={receiptSettings.store_address_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, store_address_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 12)) })}
                            bold={receiptSettings.store_address_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, store_address_bold: !receiptSettings.store_address_bold })}
                            italic={receiptSettings.store_address_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, store_address_italic: !receiptSettings.store_address_italic })}
                            align={receiptSettings.store_address_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, store_address_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Phone</FormLabel>
                          <input type="text" placeholder="Phone" value={receiptSettings.store_phone} onChange={(e) => setReceiptSettings({ ...receiptSettings, store_phone: e.target.value })} style={inputBaseStyle(isDarkMode, themeColorRgb)} {...getInputFocusHandlers(themeColorRgb, isDarkMode)} />
                          <TextFormattingToolbar
                            font={receiptSettings.store_phone_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, store_phone_font: e.target.value })}
                            fontSize={receiptSettings.store_phone_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, store_phone_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 12)) })}
                            bold={receiptSettings.store_phone_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, store_phone_bold: !receiptSettings.store_phone_bold })}
                            italic={receiptSettings.store_phone_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, store_phone_italic: !receiptSettings.store_phone_italic })}
                            align={receiptSettings.store_phone_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, store_phone_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Logo upload</FormLabel>
                          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setReceiptSettings({ ...receiptSettings, store_logo: r.result }); r.readAsDataURL(f); } }} style={{ fontSize: '13px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666' }} />
                        </FormField>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Header alignment</FormLabel>
                          <CustomDropdown value={receiptSettings.header_alignment || 'center'} onChange={(e) => setReceiptSettings({ ...receiptSettings, header_alignment: e.target.value })} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} placeholder="Alignment" isDarkMode={isDarkMode} themeColorRgb={themeColorRgb} style={{ maxWidth: '160px' }} />
                        </FormField>
                      </>
                    )}

                    {/* Body: 1. Line items (products & prices) */}
                    {activeReceiptSection === 'body_items' && (
                      <>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Item name</FormLabel>
                          <TextFormattingToolbar
                            font={receiptSettings.item_name_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, item_name_font: e.target.value })}
                            fontSize={receiptSettings.item_name_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, item_name_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 12)) })}
                            bold={receiptSettings.item_name_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, item_name_bold: !receiptSettings.item_name_bold })}
                            italic={receiptSettings.item_name_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, item_name_italic: !receiptSettings.item_name_italic })}
                            align={receiptSettings.item_name_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, item_name_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                        <FormField>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <input type="checkbox" checked={!!receiptSettings.show_item_descriptions} onChange={(e) => setReceiptSettings({ ...receiptSettings, show_item_descriptions: e.target.checked })} />
                            <FormLabel isDarkMode={isDarkMode} style={{ margin: 0 }}>Item description</FormLabel>
                          </div>
                          <TextFormattingToolbar
                            font={receiptSettings.item_desc_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, item_desc_font: e.target.value })}
                            fontSize={receiptSettings.item_desc_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, item_desc_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 10)) })}
                            bold={receiptSettings.item_desc_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, item_desc_bold: !receiptSettings.item_desc_bold })}
                            italic={receiptSettings.item_desc_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, item_desc_italic: !receiptSettings.item_desc_italic })}
                            align={receiptSettings.item_desc_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, item_desc_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                        <FormField>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <input type="checkbox" checked={!!receiptSettings.show_item_skus} onChange={(e) => setReceiptSettings({ ...receiptSettings, show_item_skus: e.target.checked })} />
                            <FormLabel isDarkMode={isDarkMode} style={{ margin: 0 }}>Item SKU</FormLabel>
                          </div>
                          <TextFormattingToolbar
                            font={receiptSettings.item_sku_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, item_sku_font: e.target.value })}
                            fontSize={receiptSettings.item_sku_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, item_sku_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 10)) })}
                            bold={receiptSettings.item_sku_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, item_sku_bold: !receiptSettings.item_sku_bold })}
                            italic={receiptSettings.item_sku_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, item_sku_italic: !receiptSettings.item_sku_italic })}
                            align={receiptSettings.item_sku_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, item_sku_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Item price</FormLabel>
                          <TextFormattingToolbar
                            font={receiptSettings.item_price_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, item_price_font: e.target.value })}
                            fontSize={receiptSettings.item_price_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, item_price_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 12)) })}
                            bold={receiptSettings.item_price_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, item_price_bold: !receiptSettings.item_price_bold })}
                            italic={receiptSettings.item_price_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, item_price_italic: !receiptSettings.item_price_italic })}
                            align={receiptSettings.item_price_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, item_price_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                      </>
                    )}

                    {/* Body: 2. Totals & payment */}
                    {activeReceiptSection === 'body_totals' && (
                      <>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!receiptSettings.show_tax_breakdown} onChange={(e) => setReceiptSettings({ ...receiptSettings, show_tax_breakdown: e.target.checked })} />
                          <span style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Show tax breakdown</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!receiptSettings.show_payment_method} onChange={(e) => setReceiptSettings({ ...receiptSettings, show_payment_method: e.target.checked })} />
                          <span style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Show payment method</span>
                        </label>
                        <div style={{ borderTop: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`, margin: '8px 0' }} />
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Subtotal</FormLabel>
                          <TextFormattingToolbar
                            font={receiptSettings.subtotal_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, subtotal_font: e.target.value })}
                            fontSize={receiptSettings.subtotal_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, subtotal_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 12)) })}
                            bold={receiptSettings.subtotal_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, subtotal_bold: !receiptSettings.subtotal_bold })}
                            italic={receiptSettings.subtotal_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, subtotal_italic: !receiptSettings.subtotal_italic })}
                            align={receiptSettings.subtotal_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, subtotal_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                        <FormField>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <FormLabel isDarkMode={isDarkMode} style={{ margin: 0 }}>Tax</FormLabel>
                            <CustomDropdown value={receiptSettings.tax_line_display || 'breakdown'} onChange={(e) => setReceiptSettings({ ...receiptSettings, tax_line_display: e.target.value })} options={[{ value: 'single_line', label: 'Single' }, { value: 'breakdown', label: 'Breakdown' }, { value: 'none', label: 'Hide' }]} placeholder="Display" isDarkMode={isDarkMode} themeColorRgb={themeColorRgb} style={{ maxWidth: '100px' }} />
                          </div>
                          <TextFormattingToolbar
                            font={receiptSettings.tax_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, tax_font: e.target.value })}
                            fontSize={receiptSettings.tax_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, tax_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 12)) })}
                            bold={receiptSettings.tax_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, tax_bold: !receiptSettings.tax_bold })}
                            italic={receiptSettings.tax_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, tax_italic: !receiptSettings.tax_italic })}
                            align={receiptSettings.tax_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, tax_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Total</FormLabel>
                          <TextFormattingToolbar
                            font={receiptSettings.total_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, total_font: e.target.value })}
                            fontSize={receiptSettings.total_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, total_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 14)) })}
                            bold={receiptSettings.total_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, total_bold: !receiptSettings.total_bold })}
                            italic={receiptSettings.total_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, total_italic: !receiptSettings.total_italic })}
                            align={receiptSettings.total_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, total_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                        <div style={{ borderTop: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`, margin: '8px 0' }} />
                        <FormField>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <FormLabel isDarkMode={isDarkMode} style={{ margin: 0 }}>Payment method</FormLabel>
                            <CustomDropdown value={receiptSettings.preview_payment_type || 'card'} onChange={(e) => setReceiptSettings({ ...receiptSettings, preview_payment_type: e.target.value })} options={[{ value: 'card', label: 'Card' }, { value: 'cash', label: 'Cash' }]} placeholder="Preview" isDarkMode={isDarkMode} themeColorRgb={themeColorRgb} style={{ maxWidth: '90px', marginLeft: 'auto' }} />
                          </div>
                          <TextFormattingToolbar
                            font={receiptSettings.payment_method_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, payment_method_font: e.target.value })}
                            fontSize={receiptSettings.payment_method_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, payment_method_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 11)) })}
                            bold={receiptSettings.payment_method_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, payment_method_bold: !receiptSettings.payment_method_bold })}
                            italic={receiptSettings.payment_method_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, payment_method_italic: !receiptSettings.payment_method_italic })}
                            align={receiptSettings.payment_method_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, payment_method_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                          {receiptSettings.preview_payment_type === 'cash' && (
                            <>
                              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', marginBottom: '4px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                                  <input type="checkbox" checked={!!receiptSettings.show_cash_amount_given} onChange={(e) => setReceiptSettings({ ...receiptSettings, show_cash_amount_given: e.target.checked })} />
                                  Amount given
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                                  <input type="checkbox" checked={!!receiptSettings.show_cash_change} onChange={(e) => setReceiptSettings({ ...receiptSettings, show_cash_change: e.target.checked })} />
                                  Change
                                </label>
                              </div>
                              <FormField style={{ marginTop: '6px' }}>
                                <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block', fontSize: '12px' }}>Amount given line</FormLabel>
                                <TextFormattingToolbar
                                  font={receiptSettings.cash_amount_given_font}
                                  onFontChange={(e) => setReceiptSettings({ ...receiptSettings, cash_amount_given_font: e.target.value })}
                                  fontSize={receiptSettings.cash_amount_given_font_size}
                                  onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, cash_amount_given_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 11)) })}
                                  bold={receiptSettings.cash_amount_given_bold}
                                  onBoldToggle={() => setReceiptSettings({ ...receiptSettings, cash_amount_given_bold: !receiptSettings.cash_amount_given_bold })}
                                  italic={receiptSettings.cash_amount_given_italic}
                                  onItalicToggle={() => setReceiptSettings({ ...receiptSettings, cash_amount_given_italic: !receiptSettings.cash_amount_given_italic })}
                                  align={receiptSettings.cash_amount_given_align}
                                  onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, cash_amount_given_align: align })}
                                  isDarkMode={isDarkMode}
                                  themeColorRgb={themeColorRgb}
                                />
                              </FormField>
                              <FormField style={{ marginTop: '6px' }}>
                                <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block', fontSize: '12px' }}>Change line</FormLabel>
                                <TextFormattingToolbar
                                  font={receiptSettings.cash_change_font}
                                  onFontChange={(e) => setReceiptSettings({ ...receiptSettings, cash_change_font: e.target.value })}
                                  fontSize={receiptSettings.cash_change_font_size}
                                  onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, cash_change_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 11)) })}
                                  bold={receiptSettings.cash_change_bold}
                                  onBoldToggle={() => setReceiptSettings({ ...receiptSettings, cash_change_bold: !receiptSettings.cash_change_bold })}
                                  italic={receiptSettings.cash_change_italic}
                                  onItalicToggle={() => setReceiptSettings({ ...receiptSettings, cash_change_italic: !receiptSettings.cash_change_italic })}
                                  align={receiptSettings.cash_change_align}
                                  onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, cash_change_align: align })}
                                  isDarkMode={isDarkMode}
                                  themeColorRgb={themeColorRgb}
                                />
                              </FormField>
                            </>
                          )}
                        </FormField>
                      </>
                    )}

                    {/* Body: 3. Date & barcode */}
                    {activeReceiptSection === 'body_barcode' && (
                      <>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Date & Barcode</FormLabel>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', cursor: 'pointer', fontSize: '13px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                            <input type="checkbox" checked={receiptSettings.show_barcode !== false} onChange={(e) => setReceiptSettings({ ...receiptSettings, show_barcode: e.target.checked })} />
                            Barcode (includes order #)
                          </label>
                          <TextFormattingToolbar
                            font={receiptSettings.date_line_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, date_line_font: e.target.value })}
                            fontSize={receiptSettings.date_line_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, date_line_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 10)) })}
                            bold={receiptSettings.date_line_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, date_line_bold: !receiptSettings.date_line_bold })}
                            italic={receiptSettings.date_line_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, date_line_italic: !receiptSettings.date_line_italic })}
                            align={receiptSettings.date_line_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, date_line_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                      </>
                    )}

                    {/* Footer Settings */}
                    {activeReceiptSection === 'footer' && (
                      <>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Custom message</FormLabel>
                          <textarea placeholder="Thank you for your business!" value={receiptSettings.footer_message} onChange={(e) => setReceiptSettings({ ...receiptSettings, footer_message: e.target.value })} rows={2} style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), resize: 'vertical', fontFamily: 'inherit', minHeight: '56px' }} {...getInputFocusHandlers(themeColorRgb, isDarkMode)} />
                          <TextFormattingToolbar
                            font={receiptSettings.footer_message_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, footer_message_font: e.target.value })}
                            fontSize={receiptSettings.footer_message_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, footer_message_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 12)) })}
                            bold={receiptSettings.footer_message_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, footer_message_bold: !receiptSettings.footer_message_bold })}
                            italic={receiptSettings.footer_message_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, footer_message_italic: !receiptSettings.footer_message_italic })}
                            align={receiptSettings.footer_message_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, footer_message_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Return policy</FormLabel>
                          <textarea placeholder="e.g. Returns within 30 days with receipt" value={receiptSettings.return_policy} onChange={(e) => setReceiptSettings({ ...receiptSettings, return_policy: e.target.value })} rows={2} style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), resize: 'vertical', fontFamily: 'inherit', minHeight: '56px' }} {...getInputFocusHandlers(themeColorRgb, isDarkMode)} />
                          <TextFormattingToolbar
                            font={receiptSettings.return_policy_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, return_policy_font: e.target.value })}
                            fontSize={receiptSettings.return_policy_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, return_policy_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 12)) })}
                            bold={receiptSettings.return_policy_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, return_policy_bold: !receiptSettings.return_policy_bold })}
                            italic={receiptSettings.return_policy_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, return_policy_italic: !receiptSettings.return_policy_italic })}
                            align={receiptSettings.return_policy_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, return_policy_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Website</FormLabel>
                          <input type="text" placeholder="https://..." value={receiptSettings.store_website} onChange={(e) => setReceiptSettings({ ...receiptSettings, store_website: e.target.value })} style={inputBaseStyle(isDarkMode, themeColorRgb)} {...getInputFocusHandlers(themeColorRgb, isDarkMode)} />
                          <TextFormattingToolbar
                            font={receiptSettings.store_website_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, store_website_font: e.target.value })}
                            fontSize={receiptSettings.store_website_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, store_website_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 12)) })}
                            bold={receiptSettings.store_website_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, store_website_bold: !receiptSettings.store_website_bold })}
                            italic={receiptSettings.store_website_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, store_website_italic: !receiptSettings.store_website_italic })}
                            align={receiptSettings.store_website_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, store_website_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Email</FormLabel>
                          <input type="email" placeholder="store@example.com" value={receiptSettings.store_email} onChange={(e) => setReceiptSettings({ ...receiptSettings, store_email: e.target.value })} style={inputBaseStyle(isDarkMode, themeColorRgb)} {...getInputFocusHandlers(themeColorRgb, isDarkMode)} />
                          <TextFormattingToolbar
                            font={receiptSettings.store_email_font}
                            onFontChange={(e) => setReceiptSettings({ ...receiptSettings, store_email_font: e.target.value })}
                            fontSize={receiptSettings.store_email_font_size}
                            onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, store_email_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 12)) })}
                            bold={receiptSettings.store_email_bold}
                            onBoldToggle={() => setReceiptSettings({ ...receiptSettings, store_email_bold: !receiptSettings.store_email_bold })}
                            italic={receiptSettings.store_email_italic}
                            onItalicToggle={() => setReceiptSettings({ ...receiptSettings, store_email_italic: !receiptSettings.store_email_italic })}
                            align={receiptSettings.store_email_align}
                            onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, store_email_align: align })}
                            isDarkMode={isDarkMode}
                            themeColorRgb={themeColorRgb}
                          />
                        </FormField>
                        <div style={{ borderTop: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`, margin: '12px 0' }} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!receiptSettings.show_signature} onChange={(e) => setReceiptSettings({ ...receiptSettings, show_signature: e.target.checked })} />
                          <span style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Show signature line</span>
                        </label>
                        {receiptSettings.show_signature && (
                          <>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginLeft: '24px' }}>
                              <input type="checkbox" checked={receiptSettings.show_signature_title !== false} onChange={(e) => setReceiptSettings({ ...receiptSettings, show_signature_title: e.target.checked })} />
                              <span style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Show signature title</span>
                            </label>
                            {receiptSettings.show_signature_title !== false && (
                              <FormField style={{ marginLeft: '24px' }}>
                                <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block', fontSize: '12px' }}>Signature title</FormLabel>
                                <TextFormattingToolbar
                                  font={receiptSettings.signature_title_font}
                                  onFontChange={(e) => setReceiptSettings({ ...receiptSettings, signature_title_font: e.target.value })}
                                  fontSize={receiptSettings.signature_title_font_size}
                                  onFontSizeChange={(e) => setReceiptSettings({ ...receiptSettings, signature_title_font_size: Math.min(24, Math.max(8, Number(e.target.value) || 10)) })}
                                  bold={receiptSettings.signature_title_bold}
                                  onBoldToggle={() => setReceiptSettings({ ...receiptSettings, signature_title_bold: !receiptSettings.signature_title_bold })}
                                  italic={receiptSettings.signature_title_italic}
                                  onItalicToggle={() => setReceiptSettings({ ...receiptSettings, signature_title_italic: !receiptSettings.signature_title_italic })}
                                  align={receiptSettings.signature_title_align}
                                  onAlignChange={(align) => setReceiptSettings({ ...receiptSettings, signature_title_align: align })}
                                  isDarkMode={isDarkMode}
                                  themeColorRgb={themeColorRgb}
                                />
                              </FormField>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {/* Styling Options */}
                    {activeReceiptSection === 'styling' && (
                      <>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Receipt width</FormLabel>
                          <CustomDropdown value={receiptSettings.receipt_width === 58 ? 58 : 80} onChange={(e) => setReceiptSettings({ ...receiptSettings, receipt_width: Number(e.target.value) })} options={[{ value: 58, label: '58mm' }, { value: 80, label: '80mm' }]} placeholder="Width" isDarkMode={isDarkMode} themeColorRgb={themeColorRgb} style={{ maxWidth: '120px' }} />
                        </FormField>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Line spacing</FormLabel>
                          <input type="number" min={1} max={2} step={0.1} value={receiptSettings.line_spacing ?? 1.2} onChange={(e) => setReceiptSettings({ ...receiptSettings, line_spacing: Math.min(2, Math.max(1, Number(e.target.value) || 1.2)) })} style={inputBaseStyle(isDarkMode, themeColorRgb)} {...getInputFocusHandlers(themeColorRgb, isDarkMode)} />
                        </FormField>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!receiptSettings.bold_item_names} onChange={(e) => setReceiptSettings({ ...receiptSettings, bold_item_names: e.target.checked })} />
                          <span style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Bold item names</span>
                        </label>
                        <FormField>
                          <FormLabel isDarkMode={isDarkMode} style={{ marginBottom: '4px', display: 'block' }}>Divider style</FormLabel>
                          <CustomDropdown value={receiptSettings.divider_style || 'dashed'} onChange={(e) => setReceiptSettings({ ...receiptSettings, divider_style: e.target.value })} options={[{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'none', label: 'None' }]} placeholder="Divider" isDarkMode={isDarkMode} themeColorRgb={themeColorRgb} style={{ maxWidth: '140px' }} />
                        </FormField>
                      </>
                    )}

                  </div>
                      )}
                    </div>
                    <div style={{ flex: '1 1 50%', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <ReceiptPreview
                        settings={receiptSettings}
                        id="receipt-preview-print"
                        onSectionClick={(section) => setActiveReceiptSection(activeReceiptSection === section ? null : section)}
                        activeSection={activeReceiptSection}
                        isDarkMode={isDarkMode}
                        themeColorRgb={themeColorRgb}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', padding: '16px', borderTop: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#e0e0e0'}`, flexShrink: 0, justifyContent: 'flex-end' }}>
                    <button type="button" className="button-26 button-26--header" role="button" onClick={createReceiptTemplate}>
                      <div className="button-26__content"><span className="button-26__text text">Save as new template</span></div>
                    </button>
                    <button type="button" className="button-26 button-26--header" role="button" onClick={() => setReceiptEditModalOpen(false)}>
                      <div className="button-26__content"><span className="button-26__text text">Cancel</span></div>
                    </button>
                    <button type="button" className="button-26 button-26--header" role="button" onClick={printTestReceipt}>
                      <div className="button-26__content">
                        <Printer size={14} style={{ marginRight: '6px', color: '#888' }} />
                        <span className="button-26__text text">Print test</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMS Settings Tab */}
      {activeTab === 'sms' && (
        <div>
          <FormTitle isDarkMode={isDarkMode} style={{ marginBottom: '12px' }}>
            SMS & Notifications
          </FormTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Store selector */}
            <FormField>
              <FormLabel isDarkMode={isDarkMode}>
                Store
              </FormLabel>
              <select
                value={selectedSmsStore}
                onChange={(e) => setSelectedSmsStore(Number(e.target.value))}
                style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '300px' }}
                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
              >
                {smsStores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>{s.store_name}</option>
                ))}
              </select>
            </FormField>

            {/* SMS Provider Selection */}
            <FormField>
              <FormLabel isDarkMode={isDarkMode}>
                SMS Provider
              </FormLabel>
              <select
                value={smsSettings.sms_provider || 'email'}
                onChange={(e) => setSmsSettings({...smsSettings, sms_provider: e.target.value})}
                style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '300px' }}
                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
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
                  ? 'Free but most US carriers have discontinued it; delivery often fails.'
                  : 'Low cost, high reliability. Recommended for production.'}
              </p>
              {smsSettings.sms_provider === 'email' && (
                <div style={{
                  marginTop: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  backgroundColor: isDarkMode ? 'rgba(255,180,0,0.15)' : 'rgba(255,180,0,0.2)',
                  color: isDarkMode ? '#f0c040' : '#8a6d00',
                  borderRadius: '6px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,180,0,0.4)' : 'rgba(200,150,0,0.5)'}`
                }}>
                  <strong>Note:</strong> ATT, Verizon, and T-Mobile have discontinued free email-to-SMS gateways (2024–2025). Delivery may fail. For reliable SMS, switch to <strong>AWS SNS</strong> above (~$0.006/SMS).
                </div>
              )}
            </FormField>

            {/* Email Settings */}
            {smsSettings.sms_provider === 'email' && (
              <>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    SMTP Server
                  </FormLabel>
                  <input
                    type="text"
                    value={smsSettings.smtp_server || 'smtp.gmail.com'}
                    onChange={(e) => setSmsSettings({...smsSettings, smtp_server: e.target.value})}
                    style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '400px' }}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>

                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    SMTP Port
                  </FormLabel>
                  <input
                    type="number"
                    value={smsSettings.smtp_port || 587}
                    onChange={(e) => setSmsSettings({...smsSettings, smtp_port: parseInt(e.target.value)})}
                    style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '200px' }}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>

                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    Email Address (Gmail)
                  </FormLabel>
                  <input
                    type="email"
                    value={smsSettings.smtp_user || ''}
                    onChange={(e) => setSmsSettings({...smsSettings, smtp_user: e.target.value})}
                    placeholder="yourstore@gmail.com"
                    style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '400px' }}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                  <p style={{
                    marginTop: '4px',
                    fontSize: '13px',
                    color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666'
                  }}>
                    For Gmail: Enable 2FA and create an App Password
                  </p>
                </FormField>

                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    App Password
                  </FormLabel>
                  <input
                    type="password"
                    value={smsSettings.smtp_password || ''}
                    onChange={(e) => setSmsSettings({...smsSettings, smtp_password: e.target.value})}
                    placeholder="Enter app password"
                    style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '400px' }}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
              </>
            )}

            {/* AWS Settings */}
            {smsSettings.sms_provider === 'aws_sns' && (
              <>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    AWS Access Key ID
                  </FormLabel>
                  <input
                    type="text"
                    value={smsSettings.aws_access_key_id || ''}
                    onChange={(e) => setSmsSettings({...smsSettings, aws_access_key_id: e.target.value})}
                    placeholder="AKIA..."
                    style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '400px' }}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>

                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    AWS Secret Access Key
                  </FormLabel>
                  <input
                    type="password"
                    value={smsSettings.aws_secret_access_key || ''}
                    onChange={(e) => setSmsSettings({...smsSettings, aws_secret_access_key: e.target.value})}
                    placeholder="Enter secret key"
                    style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '400px' }}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>

                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    AWS Region
                  </FormLabel>
                  <input
                    type="text"
                    value={smsSettings.aws_region || 'us-east-1'}
                    onChange={(e) => setSmsSettings({...smsSettings, aws_region: e.target.value})}
                    placeholder="us-east-1"
                    style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '200px' }}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
              </>
            )}

            {/* Business Name */}
            <FormField>
              <FormLabel isDarkMode={isDarkMode}>
                Business Name
              </FormLabel>
              <input
                type="text"
                value={smsSettings.business_name || ''}
                onChange={(e) => setSmsSettings({...smsSettings, business_name: e.target.value})}
                placeholder="Your Store Name"
                style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '400px' }}
                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
              />
            </FormField>

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

            {/* Actions */}
            <p style={{
              marginTop: '16px',
              fontSize: '13px',
              color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666'
            }}>
              To test: save your Gmail + App Password above, then click <strong>Send Test SMS</strong> and enter a 10-digit US mobile number.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '12px'
            }}>
              <button
                type="button"
                className="button-26 button-26--header"
                role="button"
                onClick={() => setShowSendSmsModal(true)}
              >
                <div className="button-26__content">
                  <span className="button-26__text text">Send Test SMS</span>
                </div>
              </button>
              <button
                type="button"
                className="button-26 button-26--header"
                role="button"
                onClick={saveSmsSettings}
                disabled={saving}
                style={{
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                <div className="button-26__content">
                  <span className="button-26__text text">
                    {saving ? 'Saving...' : 'Save SMS Settings'}
                  </span>
                </div>
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
              <FormField>
                <FormLabel isDarkMode={isDarkMode}>
                  Phone Number (10 digits, US)
                </FormLabel>
                <input
                  type="tel"
                  value={sendSmsForm.phone_number}
                  onChange={(e) => setSendSmsForm({...sendSmsForm, phone_number: e.target.value})}
                  placeholder="5551234567"
                  required
                  style={inputBaseStyle(isDarkMode, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                />
                <p style={{ fontSize: '12px', color: isDarkMode ? '#999' : '#666', marginTop: '4px' }}>
                  Digits only, e.g. 5551234567. With country code use 15551234567.
                </p>
              </FormField>
              <FormField>
                <FormLabel isDarkMode={isDarkMode}>
                  Carrier (pick for best delivery)
                </FormLabel>
                <select
                  value={sendSmsForm.carrier_preference || ''}
                  onChange={(e) => setSendSmsForm({...sendSmsForm, carrier_preference: e.target.value})}
                  style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '100%' }}
                  {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                >
                  <option value="">Try ATT first, then others</option>
                  <option value="att">ATT</option>
                  <option value="verizon">Verizon</option>
                  <option value="tmobile">T-Mobile</option>
                  <option value="sprint">Sprint</option>
                </select>
                <p style={{ fontSize: '12px', color: isDarkMode ? '#999' : '#666', marginTop: '4px' }}>
                  If you don&apos;t receive the SMS, pick your carrier and try again.
                </p>
              </FormField>
              <FormField>
                <FormLabel isDarkMode={isDarkMode}>
                  Message
                </FormLabel>
                <textarea
                  value={sendSmsForm.message_text}
                  onChange={(e) => setSendSmsForm({...sendSmsForm, message_text: e.target.value})}
                  rows={5}
                  required
                  style={{
                    ...inputBaseStyle(isDarkMode, themeColorRgb),
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    minHeight: '100px'
                  }}
                  {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                />
                <p style={{
                  fontSize: '13px',
                  color: isDarkMode ? 'var(--text-tertiary, #999)' : '#666',
                  marginTop: '8px'
                }}>
                  {sendSmsForm.message_text.length}/160 characters
                </p>
              </FormField>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  className="button-26 button-26--header"
                  role="button"
                  disabled={saving}
                  style={{
                    opacity: saving ? 0.6 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  <div className="button-26__content">
                    <span className="button-26__text text">
                      {saving ? 'Sending...' : 'Send'}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="button-26 button-26--header"
                  role="button"
                  onClick={() => setShowSendSmsModal(false)}
                >
                  <div className="button-26__content">
                    <span className="button-26__text text">Cancel</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
          )}

      {activeTab === 'cash' && (
        <div>
          <FormTitle isDarkMode={isDarkMode} style={{ marginBottom: '12px' }}>
            Cash Register Management
          </FormTitle>
          
          {/* Register Management */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
            <FormLabel isDarkMode={isDarkMode} style={{ margin: 0 }}>
              Registers:
            </FormLabel>
            {registers.map((register) => (
              <div key={register.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={register.name}
                  onChange={(e) => {
                    const updated = registers.map(r => 
                      r.id === register.id ? { ...r, name: e.target.value } : r
                    )
                    setRegisters(updated)
                    localStorage.setItem('cash_registers', JSON.stringify(updated))
                  }}
                  style={{
                    ...inputBaseStyle(isDarkMode, themeColorRgb),
                    width: '150px',
                    fontSize: '14px',
                    padding: '6px 10px'
                  }}
                  placeholder="Register name"
                  {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                />
                {registers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = registers.filter(r => r.id !== register.id)
                      setRegisters(updated)
                      localStorage.setItem('cash_registers', JSON.stringify(updated))
                      if (cashSettings.register_id === register.id && updated.length > 0) {
                        setCashSettings({...cashSettings, register_id: updated[0].id})
                      }
                    }}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#d32f2f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newId = Math.max(...registers.map(r => r.id), 0) + 1
                const updated = [...registers, { id: newId, name: `Register ${newId}` }]
                setRegisters(updated)
                localStorage.setItem('cash_registers', JSON.stringify(updated))
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: `rgb(${themeColorRgb})`,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              + Add
            </button>
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <CustomDropdown
              value={cashSettings.register_id}
              onChange={(e) => {
                setCashSettings({...cashSettings, register_id: parseInt(e.target.value) || 1})
              }}
              options={registers.map(r => ({
                value: r.id,
                label: r.name
              }))}
              placeholder="Select register..."
              isDarkMode={isDarkMode}
              themeColorRgb={themeColorRgb}
              style={{ width: '150px' }}
            />
            <button
              type="button"
              className="button-26 button-26--header"
              role="button"
              onClick={() => {
                const expectedAmount = parseFloat(lastClosedSession?.ending_cash) || 0
                setOpenRegisterForm({
                  ...openRegisterForm,
                  register_id: cashSettings.register_id,
                  expected_amount: expectedAmount,
                  total_amount: expectedAmount,
                  adjustment_type: 'none',
                  adjustment_amount: 0,
                  adjustment_denominations: {
                    '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
                    '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
                  }
                })
                setShowOpenModal(true)
              }}
              disabled={!!currentSession}
              style={{
                opacity: currentSession ? 0.5 : 1,
                cursor: currentSession ? 'not-allowed' : 'pointer'
              }}
            >
              <div className="button-26__content">
                <span className="button-26__text text">Open Register</span>
              </div>
            </button>
            <button
              type="button"
              className="button-26 button-26--header"
              role="button"
              onClick={() => {
                setDailyCount({
                  ...dailyCount,
                  register_id: cashSettings.register_id,
                  count_type: 'drop',
                  count_date: new Date().toISOString().split('T')[0],
                  total_amount: 0,
                  denominations: {
                    '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
                    '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
                  },
                  adjustment_type: 'none',
                  adjustment_mode: 'total',
                  adjustment_amount: 0,
                  adjustment_denominations: {
                    '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
                    '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
                  },
                  notes: ''
                })
                setShowCountDropModal(true)
              }}
            >
              <div className="button-26__content">
                <span className="button-26__text text">Count Drop</span>
              </div>
            </button>
            <button
              type="button"
              className="button-26 button-26--header"
              role="button"
              onClick={() => {
                if (currentSession) {
                  const expected = calculateExpectedCash()
                  setCloseRegisterForm({
                    ...closeRegisterForm,
                    total_amount: expected,
                    adjustment_type: 'none',
                    adjustment_mode: 'total',
                    adjustment_amount: 0,
                    adjustment_denominations: {
                      '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
                      '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
                    }
                  })
                  setShowCloseModal(true)
                }
              }}
              disabled={!currentSession}
              style={{
                opacity: !currentSession ? 0.5 : 1,
                cursor: !currentSession ? 'not-allowed' : 'pointer'
              }}
            >
              <div className="button-26__content">
                <span className="button-26__text text">Close Register</span>
              </div>
            </button>
            <button
              type="button"
              className="button-26 button-26--header"
              role="button"
              onClick={() => setShowTakeOutModal(true)}
            >
              <div className="button-26__content">
                <span className="button-26__text text">Take Out Money</span>
              </div>
            </button>
          </div>
          
          {/* Register Status */}
          {(currentSession || lastClosedSession) && (
            <div style={{
              padding: '16px',
              backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : '#f5f5f5',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <strong style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                    Register Status: <span style={{ color: currentSession ? `rgb(${themeColorRgb})` : '#999' }}>
                      {currentSession ? 'OPEN' : 'CLOSED'}
                    </span>
                  </strong>
                  {currentSession && (
                    <div style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666', marginTop: '4px' }}>
                      Opened: {currentSession.opened_at ? new Date(currentSession.opened_at).toLocaleString() : 'N/A'}
                    </div>
                  )}
                  {!currentSession && lastClosedSession && (
                    <div style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666', marginTop: '4px' }}>
                      Closed: {lastClosedSession.closed_at ? new Date(lastClosedSession.closed_at).toLocaleString() : 'N/A'}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {currentSession && (
                    <>
                      <div style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666' }}>
                        Starting Cash: ${(parseFloat(currentSession?.starting_cash) || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666', marginTop: '4px' }}>
                        Expected Cash: ${calculateExpectedCash().toFixed(2)}
                      </div>
                    </>
                  )}
                  {!currentSession && lastClosedSession && (
                    <>
                      <div style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666' }}>
                        Ending Cash: ${(parseFloat(lastClosedSession?.ending_cash) || 0).toFixed(2)}
                      </div>
                      {lastClosedSession.opened_at && (
                        <div style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666', marginTop: '4px' }}>
                          Started: ${(parseFloat(lastClosedSession?.starting_cash) || 0).toFixed(2)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Register Events Table */}
          <div style={{ marginBottom: '12px' }}>
            <FormTitle isDarkMode={isDarkMode} style={{ marginBottom: '8px', fontSize: '15px', fontWeight: 600 }}>
              Register Events
            </FormTitle>
            {registerTransactions.length > 0 ? (
              <Table
                columns={['event_type', 'amount', 'timestamp', 'employee_name', 'notes']}
                data={registerTransactions.map(t => ({
                  event_type: t.transaction_type === 'open' ? 'Open' : 
                             t.transaction_type === 'close' ? 'Close' :
                             t.transaction_type === 'drop' ? 'Drop' :
                             t.transaction_type === 'take_out' ? 'Take Out' : 'Cash In',
                  amount: parseFloat(t.amount || 0),
                  timestamp: t.timestamp ? new Date(t.timestamp).toLocaleString() : 'N/A',
                  employee_name: t.employee_name || 'N/A',
                  notes: t.notes || t.reason || ''
                }))}
              />
            ) : (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666',
                backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : '#f5f5f5',
                borderRadius: '8px'
              }}>
                No register events. Click "Open Register" to start.
              </div>
            )}
          </div>
          
          {/* Open Register Modal */}
          {showOpenModal && (
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
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <h2 style={{
                  marginTop: 0,
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Open Register
                </h2>
                
                {/* Expected Amount Display */}
                {lastClosedSession && (
                  <FormField>
                    <div style={{
                      padding: '12px',
                      backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : '#f5f5f5',
                      borderRadius: '6px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666', marginBottom: '4px' }}>
                        Expected Amount (from last close):
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                        ${(parseFloat(lastClosedSession.ending_cash) || 0).toFixed(2)}
                      </div>
                    </div>
                  </FormField>
                )}
                
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    Adjustment
                  </FormLabel>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="open_adjustment_type"
                        value="none"
                        checked={openRegisterForm.adjustment_type === 'none'}
                        onChange={(e) => setOpenRegisterForm({...openRegisterForm, adjustment_type: e.target.value})}
                      />
                      <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>No Adjustment</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="open_adjustment_type"
                        value="add"
                        checked={openRegisterForm.adjustment_type === 'add'}
                        onChange={(e) => setOpenRegisterForm({...openRegisterForm, adjustment_type: e.target.value})}
                      />
                      <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Add Cash</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="open_adjustment_type"
                        value="take_out"
                        checked={openRegisterForm.adjustment_type === 'take_out'}
                        onChange={(e) => setOpenRegisterForm({...openRegisterForm, adjustment_type: e.target.value})}
                      />
                      <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Take Out Cash</span>
                    </label>
                  </div>
                </FormField>
                
                {openRegisterForm.adjustment_type !== 'none' && (
                  <>
                    <FormField>
                      <FormLabel isDarkMode={isDarkMode}>
                        Adjustment Mode
                      </FormLabel>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="open_adjustment_mode"
                            value="total"
                            checked={openRegisterForm.adjustment_mode === 'total'}
                            onChange={(e) => setOpenRegisterForm({...openRegisterForm, adjustment_mode: e.target.value})}
                          />
                          <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Total Amount</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="open_adjustment_mode"
                            value="denominations"
                            checked={openRegisterForm.adjustment_mode === 'denominations'}
                            onChange={(e) => setOpenRegisterForm({...openRegisterForm, adjustment_mode: e.target.value})}
                          />
                          <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Denominations</span>
                        </label>
                      </div>
                    </FormField>
                    {openRegisterForm.adjustment_mode === 'total' ? (
                      <FormField>
                        <FormLabel isDarkMode={isDarkMode}>
                          {openRegisterForm.adjustment_type === 'add' ? 'Amount to Add ($)' : 'Amount to Take Out ($)'}
                        </FormLabel>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={openRegisterForm.adjustment_amount}
                          onChange={(e) => setOpenRegisterForm({...openRegisterForm, adjustment_amount: parseFloat(e.target.value) || 0})}
                          style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '200px' }}
                          {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                        />
                      </FormField>
                    ) : (
                      <FormField>
                        <FormLabel isDarkMode={isDarkMode}>
                          {openRegisterForm.adjustment_type === 'add' ? 'Bills/Coins to Add' : 'Bills/Coins to Take Out'}
                        </FormLabel>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '12px'
                        }}>
                          {Object.entries(openRegisterForm.adjustment_denominations).map(([denom, count]) => (
                            <div key={denom}>
                              <label style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '14px',
                                color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666'
                              }}>
                                ${denom}
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={count}
                                onChange={(e) => setOpenRegisterForm({
                                  ...openRegisterForm,
                                  adjustment_denominations: {
                                    ...openRegisterForm.adjustment_denominations,
                                    [denom]: parseInt(e.target.value) || 0
                                  },
                                  adjustment_amount: calculateTotalFromDenominations({
                                    ...openRegisterForm.adjustment_denominations,
                                    [denom]: parseInt(e.target.value) || 0
                                  })
                                })}
                                style={inputBaseStyle(isDarkMode, themeColorRgb)}
                                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
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
                            Adjustment Total: ${calculateTotalFromDenominations(openRegisterForm.adjustment_denominations).toFixed(2)}
                          </strong>
                        </div>
                      </FormField>
                    )}
                  </>
                )}
                
                {/* Final Starting Cash Display */}
                <FormField>
                  <div style={{
                    padding: '12px',
                    backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : '#f5f5f5',
                    borderRadius: '6px',
                    marginTop: '16px'
                  }}>
                    <div style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666', marginBottom: '4px' }}>
                      Final Starting Cash:
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: `rgb(${themeColorRgb})` }}>
                      ${(() => {
                        const expected = parseFloat(lastClosedSession?.ending_cash) || 0
                        let adjustment = 0
                        if (openRegisterForm.adjustment_type === 'add') {
                          adjustment = openRegisterForm.adjustment_mode === 'total'
                            ? parseFloat(openRegisterForm.adjustment_amount) || 0
                            : calculateTotalFromDenominations(openRegisterForm.adjustment_denominations)
                        } else if (openRegisterForm.adjustment_type === 'take_out') {
                          adjustment = -(openRegisterForm.adjustment_mode === 'total'
                            ? parseFloat(openRegisterForm.adjustment_amount) || 0
                            : calculateTotalFromDenominations(openRegisterForm.adjustment_denominations))
                        }
                        return (expected + adjustment).toFixed(2)
                      })()}
                    </div>
                  </div>
                </FormField>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    Notes (optional)
                  </FormLabel>
                  <textarea
                    value={openRegisterForm.notes}
                    onChange={(e) => setOpenRegisterForm({...openRegisterForm, notes: e.target.value})}
                    style={{
                      ...inputBaseStyle(isDarkMode, themeColorRgb),
                      minHeight: '80px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Additional notes..."
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="button-26 button-26--header"
                    role="button"
                    onClick={() => setShowOpenModal(false)}
                  >
                    <div className="button-26__content">
                      <span className="button-26__text text">Cancel</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="button-26 button-26--header"
                    role="button"
                    onClick={handleOpenRegister}
                    disabled={saving}
                    style={{
                      opacity: saving ? 0.6 : 1,
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <div className="button-26__content">
                      <span className="button-26__text text">
                        {saving ? 'Opening...' : 'Open Register'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Close Register Modal */}
          {showCloseModal && currentSession && (
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
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <h2 style={{
                  marginTop: 0,
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Close Register
                </h2>
                <div style={{
                  padding: '16px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : '#f5f5f5',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666', marginBottom: '8px' }}>
                    Expected Cash: <strong style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>${calculateExpectedCash().toFixed(2)}</strong>
                  </div>
                  <div style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666' }}>
                    Starting Cash: ${(parseFloat(currentSession?.starting_cash) || 0).toFixed(2)}
                  </div>
                </div>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    Cash Mode
                  </FormLabel>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="close_cash_mode"
                        value="total"
                        checked={closeRegisterForm.cash_mode === 'total'}
                        onChange={(e) => setCloseRegisterForm({...closeRegisterForm, cash_mode: e.target.value})}
                      />
                      <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Total Amount</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="close_cash_mode"
                        value="denominations"
                        checked={closeRegisterForm.cash_mode === 'denominations'}
                        onChange={(e) => setCloseRegisterForm({...closeRegisterForm, cash_mode: e.target.value})}
                      />
                      <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Denominations</span>
                    </label>
                  </div>
                </FormField>
                {closeRegisterForm.cash_mode === 'total' ? (
                  <FormField>
                    <FormLabel isDarkMode={isDarkMode}>
                      Actual Amount ($)
                    </FormLabel>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={closeRegisterForm.total_amount}
                      onChange={(e) => setCloseRegisterForm({...closeRegisterForm, total_amount: parseFloat(e.target.value) || 0})}
                      style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '200px' }}
                      {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                    />
                  </FormField>
                ) : (
                  <FormField>
                    <FormLabel isDarkMode={isDarkMode}>
                      Bill and Coin Counts
                    </FormLabel>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '12px'
                    }}>
                      {Object.entries(closeRegisterForm.denominations).map(([denom, count]) => (
                        <div key={denom}>
                          <label style={{
                            display: 'block',
                            marginBottom: '4px',
                            fontSize: '14px',
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
                                ...closeRegisterForm.denominations,
                                [denom]: parseInt(e.target.value) || 0
                              }
                              setCloseRegisterForm({
                                ...closeRegisterForm,
                                denominations: newDenoms,
                                total_amount: calculateTotalFromDenominations(newDenoms)
                              })
                            }}
                            style={inputBaseStyle(isDarkMode, themeColorRgb)}
                            {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
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
                        Calculated Total: ${calculateTotalFromDenominations(closeRegisterForm.denominations).toFixed(2)}
                      </strong>
                    </div>
                  </FormField>
                )}
                
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    Adjustment
                  </FormLabel>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="close_adjustment_type"
                        value="none"
                        checked={closeRegisterForm.adjustment_type === 'none'}
                        onChange={(e) => setCloseRegisterForm({...closeRegisterForm, adjustment_type: e.target.value})}
                      />
                      <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>No Adjustment</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="close_adjustment_type"
                        value="add"
                        checked={closeRegisterForm.adjustment_type === 'add'}
                        onChange={(e) => setCloseRegisterForm({...closeRegisterForm, adjustment_type: e.target.value})}
                      />
                      <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Add Cash</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="close_adjustment_type"
                        value="take_out"
                        checked={closeRegisterForm.adjustment_type === 'take_out'}
                        onChange={(e) => setCloseRegisterForm({...closeRegisterForm, adjustment_type: e.target.value})}
                      />
                      <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Take Out Cash</span>
                    </label>
                  </div>
                </FormField>
                
                {closeRegisterForm.adjustment_type !== 'none' && (
                  <>
                    <FormField>
                      <FormLabel isDarkMode={isDarkMode}>
                        Adjustment Mode
                      </FormLabel>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="close_adjustment_mode"
                            value="total"
                            checked={closeRegisterForm.adjustment_mode === 'total'}
                            onChange={(e) => setCloseRegisterForm({...closeRegisterForm, adjustment_mode: e.target.value})}
                          />
                          <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Total Amount</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="close_adjustment_mode"
                            value="denominations"
                            checked={closeRegisterForm.adjustment_mode === 'denominations'}
                            onChange={(e) => setCloseRegisterForm({...closeRegisterForm, adjustment_mode: e.target.value})}
                          />
                          <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Denominations</span>
                        </label>
                      </div>
                    </FormField>
                    {closeRegisterForm.adjustment_mode === 'total' ? (
                      <FormField>
                        <FormLabel isDarkMode={isDarkMode}>
                          {closeRegisterForm.adjustment_type === 'add' ? 'Amount to Add ($)' : 'Amount to Take Out ($)'}
                        </FormLabel>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={closeRegisterForm.adjustment_amount}
                          onChange={(e) => setCloseRegisterForm({...closeRegisterForm, adjustment_amount: parseFloat(e.target.value) || 0})}
                          style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '200px' }}
                          {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                        />
                      </FormField>
                    ) : (
                      <FormField>
                        <FormLabel isDarkMode={isDarkMode}>
                          {closeRegisterForm.adjustment_type === 'add' ? 'Bills/Coins to Add' : 'Bills/Coins to Take Out'}
                        </FormLabel>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '12px'
                        }}>
                          {Object.entries(closeRegisterForm.adjustment_denominations).map(([denom, count]) => (
                            <div key={denom}>
                              <label style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '14px',
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
                                    ...closeRegisterForm.adjustment_denominations,
                                    [denom]: parseInt(e.target.value) || 0
                                  }
                                  setCloseRegisterForm({
                                    ...closeRegisterForm,
                                    adjustment_denominations: newDenoms,
                                    adjustment_amount: calculateTotalFromDenominations(newDenoms)
                                  })
                                }}
                                style={inputBaseStyle(isDarkMode, themeColorRgb)}
                                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
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
                            Adjustment Total: ${calculateTotalFromDenominations(closeRegisterForm.adjustment_denominations).toFixed(2)}
                          </strong>
                        </div>
                      </FormField>
                    )}
                  </>
                )}
                
                {/* Final Ending Cash Display */}
                <FormField>
                  <div style={{
                    padding: '12px',
                    backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : '#f5f5f5',
                    borderRadius: '6px',
                    marginTop: '16px'
                  }}>
                    <div style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666', marginBottom: '4px' }}>
                      Final Ending Cash:
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: `rgb(${themeColorRgb})` }}>
                      ${(() => {
                        const actual = closeRegisterForm.cash_mode === 'total'
                          ? parseFloat(closeRegisterForm.total_amount) || 0
                          : calculateTotalFromDenominations(closeRegisterForm.denominations)
                        let adjustment = 0
                        if (closeRegisterForm.adjustment_type === 'add') {
                          adjustment = closeRegisterForm.adjustment_mode === 'total'
                            ? parseFloat(closeRegisterForm.adjustment_amount) || 0
                            : calculateTotalFromDenominations(closeRegisterForm.adjustment_denominations)
                        } else if (closeRegisterForm.adjustment_type === 'take_out') {
                          adjustment = -(closeRegisterForm.adjustment_mode === 'total'
                            ? parseFloat(closeRegisterForm.adjustment_amount) || 0
                            : calculateTotalFromDenominations(closeRegisterForm.adjustment_denominations))
                        }
                        return (actual + adjustment).toFixed(2)
                      })()}
                    </div>
                    <div style={{ fontSize: '12px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666', marginTop: '4px' }}>
                      Discrepancy: ${(() => {
                        const expected = calculateExpectedCash()
                        const actual = closeRegisterForm.cash_mode === 'total'
                          ? parseFloat(closeRegisterForm.total_amount) || 0
                          : calculateTotalFromDenominations(closeRegisterForm.denominations)
                        let adjustment = 0
                        if (closeRegisterForm.adjustment_type === 'add') {
                          adjustment = closeRegisterForm.adjustment_mode === 'total'
                            ? parseFloat(closeRegisterForm.adjustment_amount) || 0
                            : calculateTotalFromDenominations(closeRegisterForm.adjustment_denominations)
                        } else if (closeRegisterForm.adjustment_type === 'take_out') {
                          adjustment = -(closeRegisterForm.adjustment_mode === 'total'
                            ? parseFloat(closeRegisterForm.adjustment_amount) || 0
                            : calculateTotalFromDenominations(closeRegisterForm.adjustment_denominations))
                        }
                        const final = actual + adjustment
                        const discrepancy = final - expected
                        return discrepancy.toFixed(2)
                      })()}
                    </div>
                  </div>
                </FormField>
                
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    Notes (optional)
                  </FormLabel>
                  <textarea
                    value={closeRegisterForm.notes}
                    onChange={(e) => setCloseRegisterForm({...closeRegisterForm, notes: e.target.value})}
                    style={{
                      ...inputBaseStyle(isDarkMode, themeColorRgb),
                      minHeight: '80px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Additional notes..."
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="button-26 button-26--header"
                    role="button"
                    onClick={() => setShowCloseModal(false)}
                  >
                    <div className="button-26__content">
                      <span className="button-26__text text">Cancel</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="button-26 button-26--header"
                    role="button"
                    onClick={handleCloseRegister}
                    disabled={saving}
                    style={{
                      opacity: saving ? 0.6 : 1,
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <div className="button-26__content">
                      <span className="button-26__text text">
                        {saving ? 'Closing...' : 'Close Register'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Take Out Money Modal */}
          {showTakeOutModal && (
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
                  Take Out Money
                </h2>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    Amount ($)
                  </FormLabel>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={takeOutForm.amount}
                    onChange={(e) => setTakeOutForm({...takeOutForm, amount: parseFloat(e.target.value) || 0})}
                    style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '200px' }}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    Reason (optional)
                  </FormLabel>
                  <CustomDropdown
                    value={takeOutForm.reason}
                    onChange={(e) => setTakeOutForm({...takeOutForm, reason: e.target.value})}
                    options={[
                      { value: '', label: 'Select a reason...' },
                      { value: 'Bank deposit', label: 'Bank deposit' },
                      { value: 'Petty cash', label: 'Petty cash' },
                      { value: 'Change order', label: 'Change order' },
                      { value: 'Vendor payment', label: 'Vendor payment' },
                      { value: 'Employee reimbursement', label: 'Employee reimbursement' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    placeholder="Select a reason..."
                    isDarkMode={isDarkMode}
                    themeColorRgb={themeColorRgb}
                    style={{ width: '100%' }}
                  />
                </FormField>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    Notes (optional)
                  </FormLabel>
                  <textarea
                    value={takeOutForm.notes}
                    onChange={(e) => setTakeOutForm({...takeOutForm, notes: e.target.value})}
                    style={{
                      ...inputBaseStyle(isDarkMode, themeColorRgb),
                      minHeight: '80px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Additional notes..."
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="button-26 button-26--header"
                    role="button"
                    onClick={() => setShowTakeOutModal(false)}
                  >
                    <div className="button-26__content">
                      <span className="button-26__text text">Cancel</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="button-26 button-26--header"
                    role="button"
                    onClick={handleTakeOutMoney}
                    disabled={saving || !takeOutForm.amount || takeOutForm.amount <= 0}
                    style={{
                      opacity: (saving || !takeOutForm.amount || takeOutForm.amount <= 0) ? 0.6 : 1,
                      cursor: (saving || !takeOutForm.amount || takeOutForm.amount <= 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <div className="button-26__content">
                      <span className="button-26__text text">
                        {saving ? 'Processing...' : 'Take Out'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Count Drop Modal */}
          {showCountDropModal && (
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
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <h2 style={{
                  marginTop: 0,
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  Count Drop
                </h2>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    Date
                  </FormLabel>
                  <input
                    type="date"
                    value={dailyCount.count_date}
                    onChange={(e) => setDailyCount({...dailyCount, count_date: e.target.value})}
                    style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '200px' }}
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    Cash Mode
                  </FormLabel>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="drop_cash_mode"
                        value="total"
                        checked={dailyCount.total_amount > 0 && Object.values(dailyCount.denominations).every(v => v === 0)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDailyCount({
                              ...dailyCount,
                              denominations: {
                                '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
                                '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
                              }
                            })
                          }
                        }}
                      />
                      <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Total Amount</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="drop_cash_mode"
                        value="denominations"
                        checked={Object.values(dailyCount.denominations).some(v => v > 0)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDailyCount({...dailyCount, total_amount: 0})
                          }
                        }}
                      />
                      <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Denominations</span>
                    </label>
                  </div>
                </FormField>
                {Object.values(dailyCount.denominations).every(v => v === 0) ? (
                  <FormField>
                    <FormLabel isDarkMode={isDarkMode}>
                      Drop Amount ($)
                    </FormLabel>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={dailyCount.total_amount}
                      onChange={(e) => setDailyCount({...dailyCount, total_amount: parseFloat(e.target.value) || 0})}
                      style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '200px' }}
                      {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                    />
                  </FormField>
                ) : (
                  <FormField>
                    <FormLabel isDarkMode={isDarkMode}>
                      Bill and Coin Counts
                    </FormLabel>
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
                            fontSize: '14px',
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
                            style={inputBaseStyle(isDarkMode, themeColorRgb)}
                            {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
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
                  </FormField>
                )}
                
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    Adjustment
                  </FormLabel>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="drop_adjustment_type"
                        value="none"
                        checked={dailyCount.adjustment_type === 'none'}
                        onChange={(e) => setDailyCount({...dailyCount, adjustment_type: e.target.value})}
                      />
                      <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>No Adjustment</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="drop_adjustment_type"
                        value="add"
                        checked={dailyCount.adjustment_type === 'add'}
                        onChange={(e) => setDailyCount({...dailyCount, adjustment_type: e.target.value})}
                      />
                      <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Add Cash</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="drop_adjustment_type"
                        value="take_out"
                        checked={dailyCount.adjustment_type === 'take_out'}
                        onChange={(e) => setDailyCount({...dailyCount, adjustment_type: e.target.value})}
                      />
                      <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Take Out Cash</span>
                    </label>
                  </div>
                </FormField>
                
                {dailyCount.adjustment_type !== 'none' && (
                  <>
                    <FormField>
                      <FormLabel isDarkMode={isDarkMode}>
                        Adjustment Mode
                      </FormLabel>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="drop_adjustment_mode"
                            value="total"
                            checked={dailyCount.adjustment_mode === 'total'}
                            onChange={(e) => setDailyCount({...dailyCount, adjustment_mode: e.target.value})}
                          />
                          <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Total Amount</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="drop_adjustment_mode"
                            value="denominations"
                            checked={dailyCount.adjustment_mode === 'denominations'}
                            onChange={(e) => setDailyCount({...dailyCount, adjustment_mode: e.target.value})}
                          />
                          <span style={{ color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Denominations</span>
                        </label>
                      </div>
                    </FormField>
                    {dailyCount.adjustment_mode === 'total' ? (
                      <FormField>
                        <FormLabel isDarkMode={isDarkMode}>
                          {dailyCount.adjustment_type === 'add' ? 'Amount to Add ($)' : 'Amount to Take Out ($)'}
                        </FormLabel>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={dailyCount.adjustment_amount}
                          onChange={(e) => setDailyCount({...dailyCount, adjustment_amount: parseFloat(e.target.value) || 0})}
                          style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), maxWidth: '200px' }}
                          {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                        />
                      </FormField>
                    ) : (
                      <FormField>
                        <FormLabel isDarkMode={isDarkMode}>
                          {dailyCount.adjustment_type === 'add' ? 'Bills/Coins to Add' : 'Bills/Coins to Take Out'}
                        </FormLabel>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '12px'
                        }}>
                          {Object.entries(dailyCount.adjustment_denominations).map(([denom, count]) => (
                            <div key={denom}>
                              <label style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '14px',
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
                                    ...dailyCount.adjustment_denominations,
                                    [denom]: parseInt(e.target.value) || 0
                                  }
                                  setDailyCount({
                                    ...dailyCount,
                                    adjustment_denominations: newDenoms,
                                    adjustment_amount: calculateTotalFromDenominations(newDenoms)
                                  })
                                }}
                                style={inputBaseStyle(isDarkMode, themeColorRgb)}
                                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
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
                            Adjustment Total: ${calculateTotalFromDenominations(dailyCount.adjustment_denominations).toFixed(2)}
                          </strong>
                        </div>
                      </FormField>
                    )}
                  </>
                )}
                
                {/* Final Drop Amount Display */}
                <FormField>
                  <div style={{
                    padding: '12px',
                    backgroundColor: isDarkMode ? 'var(--bg-secondary, #2a2a2a)' : '#f5f5f5',
                    borderRadius: '6px',
                    marginTop: '16px'
                  }}>
                    <div style={{ fontSize: '14px', color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666', marginBottom: '4px' }}>
                      Final Drop Amount:
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: `rgb(${themeColorRgb})` }}>
                      ${(() => {
                        const dropAmount = Object.values(dailyCount.denominations).every(v => v === 0)
                          ? parseFloat(dailyCount.total_amount) || 0
                          : calculateTotalFromDenominations(dailyCount.denominations)
                        let adjustment = 0
                        if (dailyCount.adjustment_type === 'add') {
                          adjustment = dailyCount.adjustment_mode === 'total'
                            ? parseFloat(dailyCount.adjustment_amount) || 0
                            : calculateTotalFromDenominations(dailyCount.adjustment_denominations)
                        } else if (dailyCount.adjustment_type === 'take_out') {
                          adjustment = -(dailyCount.adjustment_mode === 'total'
                            ? parseFloat(dailyCount.adjustment_amount) || 0
                            : calculateTotalFromDenominations(dailyCount.adjustment_denominations))
                        }
                        return (dropAmount + adjustment).toFixed(2)
                      })()}
                    </div>
                  </div>
                </FormField>
                
                <FormField>
                  <FormLabel isDarkMode={isDarkMode}>
                    Notes (optional)
                  </FormLabel>
                  <textarea
                    value={dailyCount.notes}
                    onChange={(e) => setDailyCount({...dailyCount, notes: e.target.value})}
                    style={{
                      ...inputBaseStyle(isDarkMode, themeColorRgb),
                      minHeight: '80px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Additional notes..."
                    {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
                  />
                </FormField>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="button-26 button-26--header"
                    role="button"
                    onClick={() => setShowCountDropModal(false)}
                  >
                    <div className="button-26__content">
                      <span className="button-26__text text">Cancel</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="button-26 button-26--header"
                    role="button"
                    onClick={handleCountDrop}
                    disabled={saving || (!dailyCount.total_amount && Object.values(dailyCount.denominations).every(v => v === 0))}
                    style={{
                      opacity: (saving || (!dailyCount.total_amount && Object.values(dailyCount.denominations).every(v => v === 0))) ? 0.6 : 1,
                      cursor: (saving || (!dailyCount.total_amount && Object.values(dailyCount.denominations).every(v => v === 0))) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <div className="button-26__content">
                      <span className="button-26__text text">
                        {saving ? 'Saving...' : 'Save Drop'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
          )}
        </div>
      </div>
      
      {/* Toast notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
            color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
            border: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`,
            borderRadius: '12px',
            boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 10001,
            fontSize: '14px',
            fontWeight: 500,
            maxWidth: '90vw'
          }}
        >
          {toast.type === 'error' ? (
            <XCircle size={20} style={{ flexShrink: 0, color: '#d32f2f' }} />
          ) : (
            <CheckCircle size={20} style={{ flexShrink: 0, color: `rgb(${themeColorRgb})` }} />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}

export default Settings

