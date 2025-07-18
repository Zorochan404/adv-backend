CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"age" integer,
	"number" integer,
	"email" varchar,
	"password" varchar DEFAULT '123456',
	"aadhar_number" varchar,
	"dl_number" varchar,
	"passport_number" varchar,
	"locality" varchar,
	"city" varchar,
	"state" varchar,
	"country" varchar,
	"pincode" integer,
	"role" varchar DEFAULT 'user',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
