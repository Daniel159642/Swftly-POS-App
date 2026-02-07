import StatisticsDashboard from '../components/dashboard/StatisticsDashboard'

function StatisticsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <StatisticsDashboard />
    </div>
  )
}

export default StatisticsPage
