import axios from 'axios'
import { getNetworkScenario } from '../mocks/scenarios/network-scenario.ts'

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10_000,
})

apiClient.interceptors.request.use((config) => {
  config.headers.set('x-pirate-network-scenario', getNetworkScenario())
  return config
})
