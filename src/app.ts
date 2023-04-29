import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { transactionRoutes } from './routes/transaction'

export const app = fastify()

app.register(cookie)

app.register(transactionRoutes, {
  prefix: 'transactions',
})
