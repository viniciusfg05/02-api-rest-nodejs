import { Knex } from 'knex'

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

// - up: O que a migration irá fazer
// - down: Se deu erro, írá executar o inverso
// - defaultTo(knex.fn.now()) - para que nossas tabelas funcione em diferente banco de dados,
//    vamos usar essa propriedade do knox para passar o default date
