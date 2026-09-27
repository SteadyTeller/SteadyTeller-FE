import { useCallback, useEffect, useState } from 'react'
import { learningApi } from '../api/learningApi.js'
import { flattenScheduledTasks } from '../utils/learningData.js'

export function useLearningData() {
  const [data, setData] = useState({ goals: [], tasksByGoal: {}, items: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const goals = await learningApi.getGoals()
      const results = await Promise.allSettled(goals.map(goal => learningApi.getConfirmedTasks(goal.id)))
      const tasksByGoal = Object.fromEntries(goals.map((goal, index) => [goal.id, results[index].status === 'fulfilled' ? results[index].value : []]))
      setData({ goals, tasksByGoal, items: flattenScheduledTasks(goals, tasksByGoal) })
      const failedCount = results.filter(result => result.status === 'rejected').length
      if (failedCount) setError(`${failedCount}개 목표의 학습 일정을 불러오지 못했습니다.`)
    } catch (requestError) {
      setError(requestError.message || '학습 정보를 불러오지 못했습니다.')
      setData({ goals: [], tasksByGoal: {}, items: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { ...data, loading, error, refresh }
}
