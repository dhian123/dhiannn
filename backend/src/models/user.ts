import { Model, QueryBuilder } from 'objection';
import { UserRole } from '@/middleware/auth';

export interface User {
  id: string;
  email?: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  email_verified: boolean;
  phone_verified: boolean;
  email_verification_token?: string;
  password_reset_token?: string;
  password_reset_expires?: Date;
  is_active: boolean;
  last_login?: Date;
  login_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  id: string;
  email?: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  email_verification_token?: string;
  is_active?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  phone?: string;
  role?: UserRole;
  avatar?: string;
  is_active?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  last_login?: Date;
  login_count?: number;
}

export class UserModel extends Model implements User {
  id!: string;
  email?: string;
  password!: string;
  name!: string;
  phone?: string;
  role!: UserRole;
  avatar?: string;
  email_verified!: boolean;
  phone_verified!: boolean;
  email_verification_token?: string;
  password_reset_token?: string;
  password_reset_expires?: Date;
  is_active!: boolean;
  last_login?: Date;
  login_count!: number;
  created_at!: Date;
  updated_at!: Date;

  // Table name
  static tableName = 'users';

  // JSON schema for validation
  static jsonSchema = {
    type: 'object',
    required: ['id', 'password', 'name', 'role', 'is_active'],

    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      name: { type: 'string', minLength: 2, maxLength: 100 },
      phone: { type: 'string', pattern: '^\\+62[0-9]{9,12}$' },
      role: { 
        type: 'string', 
        enum: Object.values(UserRole),
      },
      avatar: { type: 'string', format: 'uri' },
      email_verified: { type: 'boolean' },
      phone_verified: { type: 'boolean' },
      email_verification_token: { type: 'string' },
      password_reset_token: { type: 'string' },
      password_reset_expires: { type: 'string', format: 'date-time' },
      is_active: { type: 'boolean' },
      last_login: { type: 'string', format: 'date-time' },
      login_count: { type: 'integer', minimum: 0 },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  };

  // Relations
  static relationMappings = {
    santri: {
      relation: Model.HasOneRelation,
      modelClass: 'SantriModel',
      join: {
        from: 'users.id',
        to: 'santri.user_id',
      },
    },
    waliSantri: {
      relation: Model.HasOneRelation,
      modelClass: 'WaliSantriModel',
      join: {
        from: 'users.id',
        to: 'wali_santri.user_id',
      },
    },
    pocketMoney: {
      relation: Model.HasManyRelation,
      modelClass: 'PocketMoneyModel',
      join: {
        from: 'users.id',
        to: 'pocket_money.user_id',
      },
    },
    bills: {
      relation: Model.HasManyRelation,
      modelClass: 'BillModel',
      join: {
        from: 'users.id',
        to: 'bills.user_id',
      },
    },
    attendance: {
      relation: Model.HasManyRelation,
      modelClass: 'AttendanceModel',
      join: {
        from: 'users.id',
        to: 'attendance.user_id',
      },
    },
    reportCards: {
      relation: Model.HasManyRelation,
      modelClass: 'ReportCardModel',
      join: {
        from: 'users.id',
        to: 'report_cards.user_id',
      },
    },
    savings: {
      relation: Model.HasManyRelation,
      modelClass: 'SavingsModel',
      join: {
        from: 'users.id',
        to: 'savings.user_id',
      },
    },
    libraryTransactions: {
      relation: Model.HasManyRelation,
      modelClass: 'LibraryTransactionModel',
      join: {
        from: 'users.id',
        to: 'library_transactions.user_id',
      },
    },
    announcements: {
      relation: Model.HasManyRelation,
      modelClass: 'AnnouncementModel',
      join: {
        from: 'users.id',
        to: 'announcements.created_by',
      },
    },
    feedback: {
      relation: Model.HasManyRelation,
      modelClass: 'FeedbackModel',
      join: {
        from: 'users.id',
        to: 'feedback.user_id',
      },
    },
    cps: {
      relation: Model.HasManyRelation,
      modelClass: 'CPSModel',
      join: {
        from: 'users.id',
        to: 'cps.user_id',
      },
    },
    warid: {
      relation: Model.HasOneRelation,
      modelClass: 'WaridModel',
      join: {
        from: 'users.id',
        to: 'warid.user_id',
      },
    },
    payments: {
      relation: Model.HasManyRelation,
      modelClass: 'PaymentModel',
      join: {
        from: 'users.id',
        to: 'payments.user_id',
      },
    },
    notifications: {
      relation: Model.HasManyRelation,
      modelClass: 'NotificationModel',
      join: {
        from: 'users.id',
        to: 'notifications.user_id',
      },
    },
    auditLogs: {
      relation: Model.HasManyRelation,
      modelClass: 'AuditLogModel',
      join: {
        from: 'users.id',
        to: 'audit_logs.user_id',
      },
    },
  };

  // Default values
  $beforeInsert() {
    this.created_at = new Date();
    this.updated_at = new Date();
    this.login_count = 0;
    this.email_verified = false;
    this.phone_verified = false;
    this.is_active = true;
  }

  $beforeUpdate() {
    this.updated_at = new Date();
  }

  // Query modifiers
  static modifiers = {
    active(builder: QueryBuilder<UserModel>) {
      builder.where('is_active', true);
    },
    
    verified(builder: QueryBuilder<UserModel>) {
      builder.where('email_verified', true);
    },
    
    byRole(builder: QueryBuilder<UserModel>, role: UserRole) {
      builder.where('role', role);
    },
    
    byEmail(builder: QueryBuilder<UserModel>, email: string) {
      builder.where('email', email);
    },
    
    byPhone(builder: QueryBuilder<UserModel>, phone: string) {
      builder.where('phone', phone);
    },
    
    excludePassword(builder: QueryBuilder<UserModel>) {
      builder.select(
        'id',
        'email',
        'name',
        'phone',
        'role',
        'avatar',
        'email_verified',
        'phone_verified',
        'is_active',
        'last_login',
        'login_count',
        'created_at',
        'updated_at'
      );
    },
  };

  // Instance methods
  async incrementLoginCount(): Promise<void> {
    await this.$query().patch({
      login_count: this.login_count + 1,
      last_login: new Date(),
    });
  }

  async markEmailVerified(): Promise<void> {
    await this.$query().patch({
      email_verified: true,
      email_verification_token: null,
    });
  }

  async markPhoneVerified(): Promise<void> {
    await this.$query().patch({
      phone_verified: true,
    });
  }

  async deactivate(): Promise<void> {
    await this.$query().patch({
      is_active: false,
    });
  }

  async activate(): Promise<void> {
    await this.$query().patch({
      is_active: true,
    });
  }

  // Static methods
  static async findByEmail(email: string): Promise<UserModel | undefined> {
    return await this.query()
      .modify('active')
      .where('email', email)
      .first();
  }

  static async findByPhone(phone: string): Promise<UserModel | undefined> {
    return await this.query()
      .modify('active')
      .where('phone', phone)
      .first();
  }

  static async findByRole(role: UserRole): Promise<UserModel[]> {
    return await this.query()
      .modify('active')
      .modify('byRole', role)
      .modify('excludePassword');
  }

  static async getActiveUsers(): Promise<UserModel[]> {
    return await this.query()
      .modify('active')
      .modify('excludePassword')
      .orderBy('created_at', 'desc');
  }

  static async getUsersByRole(role: UserRole): Promise<UserModel[]> {
    return await this.query()
      .modify('active')
      .modify('byRole', role)
      .modify('excludePassword')
      .orderBy('name', 'asc');
  }

  static async searchUsers(query: string): Promise<UserModel[]> {
    return await this.query()
      .modify('active')
      .modify('excludePassword')
      .where(function() {
        this.where('name', 'ilike', `%${query}%`)
          .orWhere('email', 'ilike', `%${query}%`)
          .orWhere('phone', 'ilike', `%${query}%`);
      })
      .orderBy('name', 'asc');
  }

  static async getUsersWithPagination(page: number = 1, limit: number = 10, role?: UserRole): Promise<{
    users: UserModel[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = this.query().modify('active').modify('excludePassword');
    
    if (role) {
      query.modify('byRole', role);
    }

    const total = await query.resultSize();
    const users = await query
      .orderBy('created_at', 'desc')
      .page(page - 1, limit);

    return {
      users: users.results,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getUsersStats(): Promise<{
    total: number;
    active: number;
    byRole: Record<UserRole, number>;
  }> {
    const total = await this.query().resultSize();
    const active = await this.query().modify('active').resultSize();
    
    const byRole: Record<UserRole, number> = {} as Record<UserRole, number>;
    
    for (const role of Object.values(UserRole)) {
      byRole[role] = await this.query()
        .modify('active')
        .modify('byRole', role)
        .resultSize();
    }

    return { total, active, byRole };
  }
}