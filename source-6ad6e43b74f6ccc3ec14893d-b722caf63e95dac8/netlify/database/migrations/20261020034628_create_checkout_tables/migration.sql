CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY,
	"actor_user_id" integer,
	"actor_label" text NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charges" (
	"id" text PRIMARY KEY,
	"collaborator_id" integer NOT NULL,
	"created_by_user_id" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"customer_name" text NOT NULL,
	"customer_document" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"collaborator_recipient_id" text NOT NULL,
	"collaborator_split_percent" integer NOT NULL,
	"principal_recipient_id" text NOT NULL,
	"principal_split_percent" integer NOT NULL,
	"idempotency_key" text NOT NULL UNIQUE,
	"pagarme_order_id" text UNIQUE,
	"pagarme_charge_id" text,
	"qr_code" text,
	"qr_code_url" text,
	"expires_at" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "charges_amount_positive" CHECK ("amount_cents" > 0),
	CONSTRAINT "charges_split_total" CHECK ("collaborator_split_percent" + "principal_split_percent" = 100)
);
--> statement-breakpoint
CREATE TABLE "checkout_settings" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"display_name" text NOT NULL,
	"principal_recipient_id" text NOT NULL,
	"principal_split_percent" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_settings_singleton" CHECK ("id" = 1),
	CONSTRAINT "checkout_settings_principal_percent" CHECK ("principal_split_percent" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "collaborators" (
	"id" serial PRIMARY KEY,
	"slug" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"recipient_id" text NOT NULL,
	"split_percent" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collaborators_split_percent" CHECK ("split_percent" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY,
	"login" text NOT NULL,
	"ip" text NOT NULL,
	"success" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipients" (
	"id" text PRIMARY KEY,
	"label" text NOT NULL,
	"kind" text NOT NULL,
	"validated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY,
	"token_hash" text NOT NULL UNIQUE,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"login" text NOT NULL UNIQUE,
	"password_hash" text,
	"role" text NOT NULL,
	"collaborator_id" integer,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"password_changed_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_role_collaborator" CHECK (("role" = 'admin' and "collaborator_id" is null) or ("role" = 'collaborator' and "collaborator_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX "charges_collaborator_idx" ON "charges" ("collaborator_id","created_at");--> statement-breakpoint
CREATE INDEX "charges_status_idx" ON "charges" ("status");--> statement-breakpoint
CREATE INDEX "login_attempts_login_idx" ON "login_attempts" ("login","created_at");--> statement-breakpoint
CREATE INDEX "login_attempts_ip_idx" ON "login_attempts" ("ip","created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_collaborator_unique" ON "users" ("collaborator_id");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_collaborator_id_collaborators_id_fkey" FOREIGN KEY ("collaborator_id") REFERENCES "collaborators"("id");--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "checkout_settings" ADD CONSTRAINT "checkout_settings_principal_recipient_id_recipients_id_fkey" FOREIGN KEY ("principal_recipient_id") REFERENCES "recipients"("id");--> statement-breakpoint
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_recipient_id_recipients_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "recipients"("id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_collaborator_id_collaborators_id_fkey" FOREIGN KEY ("collaborator_id") REFERENCES "collaborators"("id");