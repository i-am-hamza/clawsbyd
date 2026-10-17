CREATE TYPE "public"."booking_status" AS ENUM('requested', 'awaiting_deposit', 'confirmed', 'completed', 'declined', 'cancelled', 'no_show', 'expired');--> statement-breakpoint
CREATE TYPE "public"."coupon_kind" AS ENUM('sizing_kit_credit', 'referral', 'manual');--> statement-breakpoint
CREATE TYPE "public"."coupon_target" AS ENUM('booking', 'press_on', 'any');--> statement-breakpoint
CREATE TYPE "public"."deposit_kind" AS ENUM('none', 'standard', 'bridal');--> statement-breakpoint
CREATE TYPE "public"."discount_source" AS ENUM('launch_offer', 'coupon', 'none');--> statement-breakpoint
CREATE TYPE "public"."distance_band" AS ENUM('within_4km', 'km_4_to_8', 'on_request');--> statement-breakpoint
CREATE TYPE "public"."entity_kind" AS ENUM('booking', 'order', 'payment');--> statement-breakpoint
CREATE TYPE "public"."fulfilment" AS ENUM('ship', 'pickup');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('studio', 'home');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('portfolio', 'product', 'inspiration', 'review', 'brand');--> statement-breakpoint
CREATE TYPE "public"."nail_length" AS ENUM('short', 'medium', 'long', 'xl');--> statement-breakpoint
CREATE TYPE "public"."nail_shape" AS ENUM('square', 'squoval', 'round', 'oval', 'almond', 'coffin', 'stiletto');--> statement-breakpoint
CREATE TYPE "public"."occasion" AS ENUM('everyday', 'party', 'bridal', 'festive', 'college');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('new', 'paid', 'making', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('upi', 'cash', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_purpose" AS ENUM('booking_deposit', 'order');--> statement-breakpoint
CREATE TYPE "public"."press_on_tier" AS ENUM('classic', 'signature', 'glam', 'custom', 'bridal', 'sizing_kit');--> statement-breakpoint
CREATE TYPE "public"."review_kind" AS ENUM('in_person', 'press_on');--> statement-breakpoint
CREATE TYPE "public"."review_source" AS ENUM('admin', 'customer');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."size_mode" AS ENUM('per_finger', 'preset', 'later');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "availability_rules_weekday_check" CHECK ("availability_rules"."weekday" BETWEEN 0 AND 6)
);
--> statement-breakpoint
CREATE TABLE "blocked_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"service_id" uuid,
	"name_snapshot" text NOT NULL,
	"unit_price_paise" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"line_total_paise" integer NOT NULL,
	"price_is_from" boolean DEFAULT false NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref" text NOT NULL,
	"status" "booking_status" DEFAULT 'requested' NOT NULL,
	"customer_name" text NOT NULL,
	"phone_e164" text NOT NULL,
	"location_type" "location_type" NOT NULL,
	"area_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"duration_min" integer NOT NULL,
	"flexible_by_hour" boolean DEFAULT false NOT NULL,
	"subtotal_paise" integer NOT NULL,
	"travel_fee_paise" integer,
	"discount_paise" integer DEFAULT 0 NOT NULL,
	"discount_source" "discount_source" DEFAULT 'none' NOT NULL,
	"coupon_id" uuid,
	"offer_applied" boolean DEFAULT false NOT NULL,
	"estimate_paise" integer NOT NULL,
	"has_from_prices" boolean DEFAULT false NOT NULL,
	"final_total_paise" integer,
	"deposit_paise" integer DEFAULT 0 NOT NULL,
	"deposit_due_by" timestamp with time zone,
	"inspiration_media_id" uuid,
	"lookbook_item_id" uuid,
	"design_id" uuid,
	"referred_by" text,
	"customer_note" text,
	"admin_note" text,
	"reschedule_count" smallint DEFAULT 0 NOT NULL,
	"approved_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"deposit_forfeited" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"booking_id" uuid,
	"order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"kind" "coupon_kind" NOT NULL,
	"amount_paise" integer NOT NULL,
	"phone_e164" text,
	"applies_to" "coupon_target" DEFAULT 'any' NOT NULL,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"source_order_id" uuid,
	"source_booking_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "design_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shape" "nail_shape",
	"length" "nail_length",
	"glam_level" smallint,
	"colours" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"occasion" "occasion",
	"inspiration_media_id" uuid,
	"notes" text,
	"source_lookbook_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"question" text NOT NULL,
	"answer_md" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_visit_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"band" "distance_band" NOT NULL,
	"travel_fee_paise" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lookbook_item_media" (
	"item_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	CONSTRAINT "lookbook_item_media_item_id_media_id_pk" PRIMARY KEY("item_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "lookbook_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text,
	"caption" text,
	"glam_level" smallint NOT NULL,
	"shape" "nail_shape" NOT NULL,
	"length" "nail_length" NOT NULL,
	"occasions" "occasion"[] DEFAULT ARRAY[]::occasion[] NOT NULL,
	"colours" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_placeholder" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"suggested_service_id" uuid,
	"press_on_tier" "press_on_tier",
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lookbook_items_slug_unique" UNIQUE("slug"),
	CONSTRAINT "lookbook_items_glam_level_check" CHECK ("lookbook_items"."glam_level" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"pathname" text NOT NULL,
	"width" integer,
	"height" integer,
	"blur_data_url" text,
	"alt" text DEFAULT '' NOT NULL,
	"kind" "media_kind" NOT NULL,
	"is_placeholder" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"name_snapshot" text NOT NULL,
	"tier" "press_on_tier" NOT NULL,
	"unit_price_paise" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"shape" "nail_shape",
	"length" "nail_length",
	"size_mode" "size_mode" DEFAULT 'later' NOT NULL,
	"sizes" jsonb,
	"design_id" uuid,
	"lookbook_item_id" uuid,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref" text NOT NULL,
	"status" "order_status" DEFAULT 'new' NOT NULL,
	"customer_name" text NOT NULL,
	"phone_e164" text NOT NULL,
	"fulfilment" "fulfilment" NOT NULL,
	"address_line1" text,
	"address_line2" text,
	"landmark" text,
	"city" text,
	"state" text,
	"pincode" text,
	"subtotal_paise" integer NOT NULL,
	"discount_paise" integer DEFAULT 0 NOT NULL,
	"coupon_id" uuid,
	"shipping_paise" integer DEFAULT 0 NOT NULL,
	"total_paise" integer NOT NULL,
	"lead_min_days" integer NOT NULL,
	"lead_max_days" integer NOT NULL,
	"sizes_pending" boolean DEFAULT false NOT NULL,
	"courier" text,
	"tracking_number" text,
	"tracking_url" text,
	"admin_note" text,
	"paid_at" timestamp with time zone,
	"making_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "owner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"welcome_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "owner_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body_md" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purpose" "payment_purpose" NOT NULL,
	"booking_id" uuid,
	"order_id" uuid,
	"amount_paise" integer NOT NULL,
	"method" "payment_method" NOT NULL,
	"reference" text,
	"note" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"refunded_at" timestamp with time zone,
	"refund_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_exactly_one_ref" CHECK (("payments"."booking_id" IS NULL) != ("payments"."order_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"product_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	CONSTRAINT "product_media_product_id_media_id_pk" PRIMARY KEY("product_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tier" "press_on_tier" NOT NULL,
	"description" text,
	"price_paise" integer NOT NULL,
	"price_is_from" boolean DEFAULT false NOT NULL,
	"shapes_allowed" "nail_shape"[] DEFAULT ARRAY[]::nail_shape[] NOT NULL,
	"lengths_allowed" "nail_length"[] DEFAULT ARRAY[]::nail_length[] NOT NULL,
	"needs_sizing" boolean DEFAULT true NOT NULL,
	"lead_min_days" integer,
	"lead_max_days" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_placeholder" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "rate_limits_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" text NOT NULL,
	"body" text NOT NULL,
	"rating" smallint,
	"kind" "review_kind" NOT NULL,
	"media_id" uuid,
	"booking_id" uuid,
	"order_id" uuid,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_placeholder" boolean DEFAULT false NOT NULL,
	"source" "review_source" DEFAULT 'customer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "service_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_paise" integer NOT NULL,
	"price_is_from" boolean DEFAULT false NOT NULL,
	"per_nail" boolean DEFAULT false NOT NULL,
	"duration_min" integer NOT NULL,
	"per_nail_duration_min" integer,
	"is_addon" boolean DEFAULT false NOT NULL,
	"is_new_set" boolean DEFAULT false NOT NULL,
	"free_with_new_set" boolean DEFAULT false NOT NULL,
	"is_extension_set" boolean DEFAULT false NOT NULL,
	"deposit_kind" "deposit_kind" DEFAULT 'none' NOT NULL,
	"min_lead_days" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity" "entity_kind" NOT NULL,
	"entity_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bookings_status_starts_at_idx" ON "bookings" USING btree ("status","starts_at");--> statement-breakpoint
CREATE INDEX "bookings_phone_e164_idx" ON "bookings" USING btree ("phone_e164");--> statement-breakpoint
CREATE INDEX "orders_status_created_at_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "orders_phone_e164_idx" ON "orders" USING btree ("phone_e164");--> statement-breakpoint
CREATE INDEX "payments_reference_notnull_idx" ON "payments" USING btree ("reference") WHERE "payments"."reference" IS NOT NULL;