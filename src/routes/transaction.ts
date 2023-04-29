import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionRoutes(app: FastifyInstance) {
  // Criação de middlewares global que ficará disponivel globoalmente neste contexto
  app.addHook('preHandler', async (req, reply) => {
    console.log('Transaction')
  })

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, reply) => {
      const sessionId = req.cookies.sessionId

      const transaction = await knex('transactions')
        .where('session_id', sessionId)
        .select()

      return { transaction }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req) => {
      const sessionId = req.cookies.sessionId

      const getTrasactionParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTrasactionParamsSchema.parse(req.params)

      const transaction = await knex('transactions')
        .where({
          id,
          session_id: sessionId,
        })
        .first()

      return { transaction }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req) => {
      const sessionId = req.cookies.sessionId

      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return { summary }
    },
  )

  app.post('/', async (req, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { amount, title, type } = createTransactionBodySchema.parse(req.body)

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
