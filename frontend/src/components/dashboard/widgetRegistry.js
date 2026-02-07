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

/** Time range options for widgets that support it. Maps range id to label. */
export const TIME_RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: '1 month' },
  { id: '3months', label: '3 months' },
  { id: 'year', label: '1 year' },
  { id: 'all', label: 'All time' }
]

/** Map time range id to stats dataKey for revenue-style widgets (backend has today, week, month, all_time). */
export const REVENUE_TIME_KEY_MAP = {
  today: 'revenue.today',
  week: 'revenue.week',
  month: 'revenue.month',
  '3months': 'revenue.month',
  year: 'revenue.all_time',
  all: 'revenue.all_time'
}

/** Revenue chart: week -> weekly_revenue (7 days), month+ -> monthly_revenue (12 months). */
export const REVENUE_CHART_TIME_KEY_MAP = {
  today: 'weekly_revenue',
  week: 'weekly_revenue',
  month: 'monthly_revenue',
  '3months': 'monthly_revenue',
  year: 'monthly_revenue',
  all: 'monthly_revenue'
}

/** Build a time key map where every range uses the same dataKey (for widgets without per-range data yet). */
export function staticTimeKeyMap(dataKey) {
  return { today: dataKey, week: dataKey, month: dataKey, '3months': dataKey, year: dataKey, all: dataKey }
}

/** Discount given: same shape as revenue (today, week, month, all_time). */
export const DISCOUNT_TIME_KEY_MAP = {
  today: 'discount.today',
  week: 'discount.week',
  month: 'discount.month',
  '3months': 'discount.month',
  year: 'discount.all_time',
  all: 'discount.all_time'
}

/** Widget definitions: id, label, category, dataKey (path in stats), supported chart types, default size. All have timeKeyMap so clock shows; chart/style and time frame persist. */
export const WIDGET_DEFINITIONS = [
  // Sales
  { id: 'revenue', label: 'Revenue', category: 'sales', dataKey: 'revenue.today', format: 'currency', supportedCharts: ['number', 'bar', 'line', 'area', 'table'], defaultChart: 'number', defaultSize: 'small', timeKeyMap: REVENUE_TIME_KEY_MAP, defaultTimeRange: 'today' },
  { id: 'revenue_chart', label: 'Revenue chart', category: 'sales', dataKey: 'weekly_revenue', format: 'currency', supportedCharts: ['line', 'bar', 'area', 'table', 'number'], defaultChart: 'bar', defaultSize: 'medium', timeKeyMap: REVENUE_CHART_TIME_KEY_MAP, defaultTimeRange: 'week' },
  { id: 'total_orders', label: 'Total orders', category: 'sales', dataKey: 'total_orders', format: 'number', supportedCharts: ['number', 'bar', 'line', 'table'], defaultChart: 'number', defaultSize: 'small', timeKeyMap: staticTimeKeyMap('total_orders'), defaultTimeRange: 'all' },
  { id: 'avg_order_value', label: 'Average order value', category: 'sales', dataKey: 'avg_order_value', format: 'currency', supportedCharts: ['number', 'bar', 'line', 'table'], defaultChart: 'number', defaultSize: 'small', timeKeyMap: staticTimeKeyMap('avg_order_value'), defaultTimeRange: 'all' },
  { id: 'total_returns', label: 'Total returns', category: 'sales', dataKey: 'total_returns', format: 'number', supportedCharts: ['number', 'bar', 'line', 'table'], defaultChart: 'number', defaultSize: 'small', timeKeyMap: staticTimeKeyMap('total_returns'), defaultTimeRange: 'all' },
  { id: 'returns_amount', label: 'Returns amount', category: 'sales', dataKey: 'returns.today_amount', format: 'currency', supportedCharts: ['number', 'bar', 'line', 'table'], defaultChart: 'number', defaultSize: 'small', timeKeyMap: staticTimeKeyMap('returns.today_amount'), defaultTimeRange: 'all' },
  { id: 'returns_rate', label: 'Returns rate %', category: 'sales', dataKey: 'returns_rate', format: 'number', supportedCharts: ['number', 'bar', 'line', 'table'], defaultChart: 'number', defaultSize: 'small', timeKeyMap: staticTimeKeyMap('returns_rate'), defaultTimeRange: 'all' },
  { id: 'discount_given', label: 'Discount given', category: 'sales', dataKey: 'discount.today', format: 'currency', supportedCharts: ['number', 'bar', 'line', 'area', 'table'], defaultChart: 'number', defaultSize: 'small', timeKeyMap: DISCOUNT_TIME_KEY_MAP, defaultTimeRange: 'today' },
  { id: 'order_status', label: 'Order status breakdown', category: 'sales', dataKey: 'order_status_breakdown', format: 'object', supportedCharts: ['pie', 'donut', 'bar', 'line', 'area', 'table'], defaultChart: 'donut', defaultSize: 'medium', timeKeyMap: staticTimeKeyMap('order_status_breakdown'), defaultTimeRange: 'all' },
  // Product
  { id: 'top_products', label: 'Top products', category: 'product', dataKey: 'top_products', format: 'array', supportedCharts: ['bar', 'line', 'area', 'table', 'number'], defaultChart: 'bar', defaultSize: 'medium', timeKeyMap: staticTimeKeyMap('top_products'), defaultTimeRange: 'month' },
  // Customer / rewards
  { id: 'customers_total', label: 'Total customers', category: 'customer', dataKey: 'customers_total', format: 'number', supportedCharts: ['number', 'bar', 'line', 'table'], defaultChart: 'number', defaultSize: 'small', timeKeyMap: staticTimeKeyMap('customers_total'), defaultTimeRange: 'all' },
  { id: 'customers_in_rewards', label: 'Customers in rewards program', category: 'customer', dataKey: 'customers_in_rewards', format: 'number', supportedCharts: ['number', 'bar', 'line', 'table'], defaultChart: 'number', defaultSize: 'small', timeKeyMap: staticTimeKeyMap('customers_in_rewards'), defaultTimeRange: 'all' },
  // Inventory
  { id: 'inventory_total_products', label: 'Total products', category: 'inventory', dataKey: 'inventory.total_products', format: 'number', supportedCharts: ['number', 'bar', 'line', 'table'], defaultChart: 'number', defaultSize: 'small', timeKeyMap: staticTimeKeyMap('inventory.total_products'), defaultTimeRange: 'all' },
  { id: 'inventory_low_stock', label: 'Low stock count', category: 'inventory', dataKey: 'inventory.low_stock', format: 'number', supportedCharts: ['number', 'bar', 'line', 'table'], defaultChart: 'number', defaultSize: 'small', timeKeyMap: staticTimeKeyMap('inventory.low_stock'), defaultTimeRange: 'all' },
  { id: 'inventory_value', label: 'Inventory value', category: 'inventory', dataKey: 'inventory.total_value', format: 'currency', supportedCharts: ['number', 'bar', 'line', 'table'], defaultChart: 'number', defaultSize: 'small', timeKeyMap: staticTimeKeyMap('inventory.total_value'), defaultTimeRange: 'all' }
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
