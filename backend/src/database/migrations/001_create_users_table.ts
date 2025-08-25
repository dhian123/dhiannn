import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Basic information
    table.string('email').unique().index();
    table.string('password').notNullable();
    table.string('name', 100).notNullable();
    table.string('phone', 20).unique().index();
    table.enum('role', ['santri', 'wali_santri', 'admin', 'finance', 'super_admin']).notNullable();
    table.string('avatar');
    
    // Verification flags
    table.boolean('email_verified').defaultTo(false);
    table.boolean('phone_verified').defaultTo(false);
    table.string('email_verification_token');
    table.string('password_reset_token');
    table.timestamp('password_reset_expires');
    
    // Status and activity
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login');
    table.integer('login_count').defaultTo(0);
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['role', 'is_active']);
    table.index(['email_verified', 'is_active']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('users');
}