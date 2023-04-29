**DEPLOY**
  Nenhuma plataforma de deploy, vai entender typescript,  por isso 
  vamos precisar converter para JS

  *Podemos usar o compilador do tsx para converte*
    dentro de `tsconfig.json`:
      - "rootDir": "./src", | diretorio da nossa aplicação 
      - "outDir": "./build", | duiretorio que salvará a build

  *TSUP - Usaremos por ser mais performatico*
    sript: `"build": "tsup src --out-dir build",`

    - Subir para githubf

    - render.com
    - fly.io
    - Railway.app

  *SUPORTE AO DB POSTGRES*
    Criar uma nova variavel ambiente para que use sqlite em desenvolvimento e pg e produção
    `DATABASE_CLIENT=sqlite`

    ~~~ts srv/database.ts
      export const config: Knex.Config = {
        client: env.DATABASE_CLIENT,
        connection:
          env.DATABASE_CLIENT === 'sqlite'
            ? { filename: env.DATABASE_URL }
            : env.DATABASE_CLIENT,
        ...
      }
    ~~~

    - Add ao package.json a versão do node a ser ultilizada em produção

      ~~~json srv/database.ts
        "engines": {
         "node": ">=18"
        }
      ~~~
    
    - PORT
      O render passa a porta em formato de string e nossa aplicação precisa recever como numero,
      Vamos fazer uma anterção no schema usando o `z.cuerce`, desta forma indenpendente do que tipo de dados passado o 
      zod irá tranforma em number

      ~~~ts
        const envSchema = z.object({
          ...
          PORT: z.coerce.number().default(3332),
        })
      ~~~

  

**TEST AUTOMATIZADOS**
  - Formas de manter a confiança de dar manutenção

  * Tipos de tests
    - Unitarios: Testa unidade da aplicação, totalmente isoladas 
    - Integração: Testa a comunicação entre duas ou mais unidades
    - e2e - ponta a ponta - Simula um usuario operando na nossa aplicação

  Biblioteca: `npm i supertest -D` `npm install -D vitest`
  - supertest - Consegeguimos executar os test sem rodar o servidor da aplicação
  - Desaclopar a inicialização do servidor no arquivo `server.ts`
    `app.listen(3333)`
    - Deixaremos o os pluguins de inicialização do fastify separado da iniciaalização para que
      possamos export o `app` de sem inicializar o sevidor
      ~~~ts app.ts
        import fastify from 'fastify'
        import cookie from '@fastify/cookie'
        import { transactionRoutes } from './routes/transaction'

        export const app = fastify()

        app.register(cookie)

        app.register(transactionRoutes, {
          prefix: 'transactions',
        })
      ~~~
    **Criando um test**
      - Usaremos o `supertest` para fazer as requisições nos test
      - `beforeAll`: Executa um codigo antes dos tests
      - `afterEach`: Executa um codigo a cada tests
      - `afterAll`: Executa um codigo depois dos tests
      - `it.only("nome do test)`: only vai executar somente o teste com agumento `only`
      - `it.todo("nome do test)`: ao rodar os test o vistest avisa que tem um test pendente
      - `it.skip("nome do test)`: o test é pulado

      ~~~ts .test/examples.spec.ts
        import { app } from '../src/app'
        import request from 'supertest'
        import { test, beforeAll, afterAll } from 'vitest'

        beforeAll(async () => {
          // Inicializa o servidor atens de executar os tests
          await app.ready()
        })

        afterAll(async () => {
          await app.close()
        })

        test('O usuário consegue criar um nova transação', async () => {
          await request(app.server).post('/transactions').send({
            title: 'New transaction',
            amount: 5000,
            type: 'credit',
          }).expect(201)
        })
      ~~~

    **Evitar que os test crie dados no banco de dos principal**
      - Criar um `env.test`
        passando as informações do banco de dados de testes
        ~~~env 
          NODE_ENV="test"
          DATABASE_URL="./db/test.db"
        ~~~
      - src/env/index.ts
        Quando executamos o test a variavel NODE_ENV é preenchida com "test",
        diferente se executarmos em desenvolvimento.

        Desta forma podemos fazer com que execute .envs diferentes dependentedo do contexto
        vamos configurar `dotenv`, para executar as `.env.test`, se tiver no contexto de "test" 
    **Erro 500 ao executar os test com banco de dados `test.db`**
      Isso acontece por não criamos a tabela ( Migration )
      Devido ao principio de que o test deve ser executado de forma isolada,
      vamos criar uma migrate a cada teste. 
      Para isso, vamos utilizar a função de dentro de `import {execSync} from 'node:child_process' ` para executar comando do
      terminal, dentro da nossa aplicação node.
      ~~~ts transaction.spec.ts
        ...
        beforeEach(async () => {
          execSync('npm run knex migrate:rollback --all')
          execSync('npm run knex migrate:latest')
        })
        ...
      ~~~



**COOKIES**
  * Formas da gente manter contexto entre as requisições
  - Biblioteca: `npm i @fastify/cookie`

**ESLINT**
  * Script: `npm i eslint @rocketseat/eslint-config -D`

**Banco de dados** 
  - Driver Nativos - linquagem crua do sql
  - Quarie Builder - Contrutor de queries ( knex.js.org )

  *Configurando knex*
    - Precisamos criar um arquivo de configuração de conexão
    - Cria a pasta `./db/app.db`: Onde ficara armazenado nossa tabela
      ~~~ts - src/database.ts
        import { knex as setupKnex, Knex } from 'knex'

        export const config: Knex.Config = {
          client: 'sqlite3',
          connection: {
            filename: './db/app.db',
          },
          useNullAsDefault: true, // sqlite não suporta valores padroes e precisamos passar que os valores por padrao, será nulo
        }

        export const knex = setupKnex(config)
      ~~~
    - Criado arquivos de direcinamento para nossas configurações do knex
      Nele vamos import as config e export default
      ~~~ts knexfile.ts
      import { config } from './src/database'

      export default config
      ~~~
    - Como o knex não tem suporte diretamente para o tsx/typescript.
      Precisamos criar um script para carrega de outra forma usando o "--loader"
      para executar a cli do knex.
      script create migrations: `knex": "node --no-warnings --loader tsx ./node_modules/knex/bin/cli.js",` 
    
    - Mudando o directory das migrations 
      ~~~ts knexfile.ts
        import { knex as setupKnex, Knex } from 'knex'

        export const config: Knex.Config = {
          ...
          migrations: {
            extension: 'ts',
            directory: './db/migrations',
          },
        }

        export const knex = setupKnex(config)
      ~~~

  *Criando tabela de transation*
    ~~~ts migration/nome-da-migration.ts
      export async function up(knex: Knex): Promise<void> {
        await knex.schema.createTable('transactions', (table) => {
          table.uuid('id').primary()
          table.text('title').notNullable() // notNullable; não pode ficar vazio
          table.decimal('amount', 10, 2).notNullable()
          table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
        })
      }

      export async function down(knex: Knex): Promise<void> {
        await knex.schema.dropTable('transactions')
      }
    ~~~

    script executar a migration: `npm run knex -- migrate:latest`
    script para desfazer a migration: `npm run knex -- migrate:rollback`
  
  *Variáveis ambiente*
    - Biblioteca: `npm i dotenv`
      - Irá ler o .env, e disponibilizar para process.env.nome-da-variavel
    - Biblioteca: `npm i zod`
      - Criação de schema para validação das variaveis ambiente 
    - Configurações para validar as variaveis com zod: `src/env/index.ts`



