import api from './api'

class ReportService {
  constructor() {
    this.basePath = '/reports'
  }

  async getProfitLoss(startDate, endDate) {
    const params = new URLSearchParams()
    params.append('start_date', startDate)
    params.append('end_date', endDate)

    const response = await api.get(`${this.basePath}/profit-loss?${params.toString()}`)
    return response.data.data
  }

  async getComparativeProfitLoss(currentStart, currentEnd, priorStart, priorEnd) {
    const params = new URLSearchParams()
    params.append('current_start', currentStart)
    params.append('current_end', currentEnd)
    params.append('prior_start', priorStart)
    params.append('prior_end', priorEnd)

    const response = await api.get(`${this.basePath}/profit-loss/comparative?${params.toString()}`)
    return response.data.data
  }

  calculatePriorPeriod(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    const priorEnd = new Date(start)
    priorEnd.setDate(priorEnd.getDate() - 1)
    
    const priorStart = new Date(priorEnd)
    priorStart.setDate(priorStart.getDate() - daysDiff)

    return {
      start: priorStart.toISOString().split('T')[0],
      end: priorEnd.toISOString().split('T')[0]
    }
  }

  calculatePriorYear(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const priorStart = new Date(start)
    priorStart.setFullYear(priorStart.getFullYear() - 1)

    const priorEnd = new Date(end)
    priorEnd.setFullYear(priorEnd.getFullYear() - 1)

    return {
      start: priorStart.toISOString().split('T')[0],
      end: priorEnd.toISOString().split('T')[0]
    }
  }
}

export default new ReportService()
