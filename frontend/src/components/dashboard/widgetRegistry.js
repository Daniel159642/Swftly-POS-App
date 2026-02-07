/**
 * Widget registry for POS statistics dashboard.
 * Each widget maps to data from GET /api/dashboard/statistics.
 */

export const CHART_TYPES = [
  { id: 'number', label: 'Number', icon: '#' },
  { id: 'line', label: 'Line chart' },
  { id: 'bar', label: 'Bar chart' },
  { id: 'area', label: 'Area chart' },
  { id: 'pie', label: 'Pie chart' },
  { id: 'donut', label: 'Donut chart' },
  { id: 'table', label: 'Table' }
]

export const WIDGET_SIZES = {
  small: { w: 1, h: 1 },
  medium: { w: 2, h: 2 },
  large: { w: 3, h: 2 }
}

export const CATEGORIES = {
  sales: { id: 'sales', label: 'Sales metrics', icon: 'DollarSign' },
  product: { id: 'product', label: 'Product performance', icon: 'Package' },
  customer: { id: 'customer', label: 'Customer analytics', icon: 'Users' },
  time: { id: 'time', label: 'Time-based data', icon: 'TrendingUp' },
  inventory: { id: 'inventory', label: 'Inventory', icon: 'Box' }
}

/** Widget definitions: id, label, category, dataKey (path in stats), supported chart types, default size */
export const WIDGET_DEFINITIONS = [
  // Sales
  { id: 'revenue_today', label: "Today's revenue", category: 'sales', dataKey: 'revenue.today', format: 'currency', supportedCharts: ['number', 'table'], defaultChart: 'number', defaultSize: 'small' },
  { id: 'revenue_week', label: 'Revenue (this week)', category: 'sales', dataKey: 'revenue.week', format: 'currency', supportedCharts: ['number', 'table'], defaultChart: 'number', defaultSize: 'small' },
  { id: 'revenue_month', label: 'Revenue (this month)', category: 'sales', dataKey: 'revenue.month', format: 'currency', supportedCharts: ['number', 'table'], defaultChart: 'number', defaultSize: 'small' },
  { id: 'revenue_all_time', label: 'All-time revenue', category: 'sales', dataKey: 'revenue.all_time', format: 'currency', supportedCharts: ['number', 'table'], defaultChart: 'number', defaultSize: 'small' },
  { id: 'weekly_revenue', label: 'Weekly revenue (7 days)', category: 'sales', dataKey: 'weekly_revenue', format: 'currency', supportedCharts: ['line', 'bar', 'area', 'table', 'number'], defaultChart: 'bar', defaultSize: 'medium' },
  { id: 'monthly_revenue', label: 'Monthly revenue (12 months)', category: 'sales', dataKey: 'monthly_revenue', format: 'currency', supportedCharts: ['line', 'bar', 'area', 'table', 'number'], defaultChart: 'line', defaultSize: 'large' },
  { id: 'total_orders', label: 'Total orders', category: 'sales', dataKey: 'total_orders', format: 'number', supportedCharts: ['number', 'table'], defaultChart: 'number', defaultSize: 'small' },
  { id: 'avg_order_value', label: 'Average order value', category: 'sales', dataKey: 'avg_order_value', format: 'currency', supportedCharts: ['number', 'table'], defaultChart: 'number', defaultSize: 'small' },
  { id: 'total_returns', label: 'Total returns', category: 'sales', dataKey: 'total_returns', format: 'number', supportedCharts: ['number', 'table'], defaultChart: 'number', defaultSize: 'small' },
  // Order status
  { id: 'order_status', label: 'Order status breakdown', category: 'sales', dataKey: 'order_status_breakdown', format: 'object', supportedCharts: ['pie', 'donut', 'bar', 'table'], defaultChart: 'donut', defaultSize: 'medium' },
  // Product
  { id: 'top_products', label: 'Top products (30 days)', category: 'product', dataKey: 'top_products', format: 'array', supportedCharts: ['bar', 'table', 'number'], defaultChart: 'bar', defaultSize: 'medium' },
  { id: 'top_products_weekly', label: 'Top products (7 days)', category: 'product', dataKey: 'top_products_weekly', format: 'array', supportedCharts: ['bar', 'table', 'number'], defaultChart: 'bar', defaultSize: 'medium' },
  { id: 'top_products_yearly', label: 'Top products (12 months)', category: 'product', dataKey: 'top_products_yearly', format: 'array', supportedCharts: ['bar', 'table', 'number'], defaultChart: 'bar', defaultSize: 'medium' },
  // Inventory
  { id: 'inventory_total_products', label: 'Total products', category: 'inventory', dataKey: 'inventory.total_products', format: 'number', supportedCharts: ['number', 'table'], defaultChart: 'number', defaultSize: 'small' },
  { id: 'inventory_low_stock', label: 'Low stock count', category: 'inventory', dataKey: 'inventory.low_stock', format: 'number', supportedCharts: ['number', 'table'], defaultChart: 'number', defaultSize: 'small' },
  { id: 'inventory_value', label: 'Inventory value', category: 'inventory', dataKey: 'inventory.total_value', format: 'currency', supportedCharts: ['number', 'table'], defaultChart: 'number', defaultSize: 'small' }
]

export function getWidgetById(id) {
  return WIDGET_DEFINITIONS.find(w => w.id === id)
}

export function getWidgetsByCategory(category) {
  return WIDGET_DEFINITIONS.filter(w => w.category === category)
}

/** Get value from stats object by dot path */
export function getDataByKey(stats, dataKey) {
  if (!stats || !dataKey) return undefined
  const keys = dataKey.split('.')
  let v = stats
  for (const k of keys) {
    v = v?.[k]
  }
  return v
}

export const STORAGE_KEY_LAYOUT = 'pos-dashboard-layout'
export const STORAGE_KEY_WIDGETS = 'pos-dashboard-widgets'
