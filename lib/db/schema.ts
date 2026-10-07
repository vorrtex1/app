import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const workerProfile = pgTable('workerProfile', { id: text('id').primaryKey(), userId: text('userId').notNull(), status: text('status').notNull().default('pending'), trade: text('trade').notNull(), phone: text('phone'), bio: text('bio'), idDocument: text('idDocument'), certificates: text('certificates'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow() })

export const jobs = pgTable('jobs', { id: text('id').primaryKey(), customerId: text('customerId').notNull(), workerId: text('workerId'), description: text('description').notNull(), category: text('category').notNull().default('medium'), status: text('status').notNull().default('requested'), createdAt: timestamp('createdAt').notNull().defaultNow() })

export const feedback = pgTable('feedback', { id: text('id').primaryKey(), jobId: text('jobId').notNull(), fromUserId: text('fromUserId').notNull(), toUserId: text('toUserId').notNull(), rating: integer('rating').notNull(), comment: text('comment'), createdAt: timestamp('createdAt').notNull().defaultNow() })

export const accountConsent = pgTable('accountConsent', { id: text('id').primaryKey(), userId: text('userId').notNull(), policyVersion: text('policyVersion').notNull(), acceptedAt: timestamp('acceptedAt').notNull().defaultNow() })
