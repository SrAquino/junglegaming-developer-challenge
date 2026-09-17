import axios from 'axios'
import { getNetworkScenario } from '../mocks/scenarios/network-scenario.ts'
import { apiRequestTimeoutMs } from './network-timing.ts'

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: apiRequestTimeoutMs,
})

apiClient.interceptors.request.use((config) => {
  config.headers.set('x-pirate-network-scenario', getNetworkScenario())
  return config
})
