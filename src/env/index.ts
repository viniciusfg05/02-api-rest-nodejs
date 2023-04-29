import { config } from 'dotenv'
import { z } from 'zod'

if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' })
} else {
  config()
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  DATABASE_URL: z.string(),
  DATABASE_CLIENT: z.enum(['sqlite', 'pg']), // suportar os dois banco de dados
  PORT: z.coerce.number().default(3332),
})

const _env = envSchema.safeParse(process.env)

if (_env.success === false) {
  console.error('Invalid environment variable.', _env.error.format())

  throw Error('Invalid environment variable.')
}

export const env = _env.data

// Zod vai validar dentro de process.env procurar DATABASE_URL e ver se as validações vão passar
