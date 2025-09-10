# Schema Management for Tests - Production Approaches

## The Problem
When you change your database schema, you need to update your tests. The current manual approach in `tests/setup.ts` creates a maintenance burden.

## Production Solutions

### Option 1: Use Drizzle Migrations (Recommended)
**Pros:**
- Single source of truth (your Drizzle models)
- Automatic schema updates when you change models
- Same migrations used in production and tests
- No manual maintenance

**Cons:**
- Requires clean migration files
- May be slower than direct schema creation

**Implementation:**
```typescript
// In tests/setup.ts
const runDrizzleMigrations = async (databaseUrl: string) => {
  const sql = postgres(databaseUrl, { max: 1 });
  const db = drizzle(sql);
  
  await migrate(db, { 
    migrationsFolder: path.join(__dirname, '../src/drizzle/migrations') 
  });
  
  await sql.end();
};
```

### Option 2: Schema Introspection (Advanced)
**Pros:**
- Automatically generates schema from existing database
- No manual maintenance
- Always in sync with production

**Cons:**
- More complex setup
- Requires connection to production/staging DB

**Implementation:**
```typescript
// Generate schema from production DB
const introspectSchema = async () => {
  const prodDb = drizzle(prodConnection);
  const schema = await introspect(prodDb);
  return schema;
};
```

### Option 3: Schema Generation from Models (Hybrid)
**Pros:**
- Generates SQL from Drizzle models
- No manual SQL maintenance
- Fast test setup

**Cons:**
- Requires custom script
- May not handle all Drizzle features

**Implementation:**
```typescript
// Generate SQL from Drizzle models
const generateSchemaFromModels = () => {
  const schema = {
    users: UserTable,
    parkings: parkingTable,
    bookings: bookingsTable,
    // ... all your models
  };
  
  return generateSQL(schema);
};
```

### Option 4: Database Seeding with Migrations
**Pros:**
- Uses production migrations
- Includes seed data
- Most realistic test environment

**Cons:**
- Slower test startup
- More complex setup

## Recommended Workflow

### 1. Clean Up Your Migrations
First, fix your migration files to avoid conflicts:

```bash
# Remove conflicting 0000_ migrations
rm src/drizzle/migrations/0000_*.sql

# Generate fresh migrations
pnpm db:generate

# This creates properly ordered migrations like:
# 0001_initial_schema.sql
# 0002_add_booking_fields.sql
# 0003_add_coupon_system.sql
```

### 2. Use the Updated Setup
The updated `tests/setup.ts` now:
- Tries to use Drizzle migrations first
- Falls back to manual schema if migrations fail
- Provides clear error messages

### 3. Schema Change Workflow
When you change your schema:

1. **Update your Drizzle models** (e.g., add a new column)
2. **Generate migration**: `pnpm db:generate`
3. **Run tests**: `pnpm test` (automatically uses new schema)
4. **No manual updates needed!**

### 4. CI/CD Integration
Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    pnpm db:generate  # Ensure migrations are up to date
    pnpm test
```

## Migration Best Practices

### 1. Naming Convention
```
0001_initial_schema.sql
0002_add_user_verification.sql
0003_add_booking_extensions.sql
```

### 2. Atomic Changes
Each migration should be atomic and reversible:

```sql
-- 0002_add_user_verification.sql
ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
CREATE INDEX idx_users_verified ON users(is_verified);
```

### 3. Test Migration Order
Ensure migrations run in correct order by testing:

```bash
# Test migration order
pnpm db:migrate
pnpm test
```

## Advanced: Schema Validation

Add schema validation to catch mismatches:

```typescript
// tests/schema-validation.ts
export const validateTestSchema = async () => {
  const testDb = getTestDatabase();
  
  // Check if all expected tables exist
  const tables = await testDb.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  
  const expectedTables = ['users', 'parkings', 'bookings', 'cars'];
  const missingTables = expectedTables.filter(
    table => !tables.rows.some(row => row.table_name === table)
  );
  
  if (missingTables.length > 0) {
    throw new Error(`Missing tables: ${missingTables.join(', ')}`);
  }
};
```

## Monitoring Schema Drift

Add a test to detect schema drift:

```typescript
// tests/schema-drift.test.ts
describe('Schema Validation', () => {
  it('should have all required tables', async () => {
    await validateTestSchema();
  });
  
  it('should match production schema', async () => {
    // Compare test schema with production schema
    const testSchema = await getTestSchema();
    const prodSchema = await getProductionSchema();
    
    expect(testSchema).toMatchObject(prodSchema);
  });
});
```

## Summary

**For immediate use:** The updated `tests/setup.ts` with Drizzle migrations
**For long-term:** Clean up your migration files and use the migration-based approach
**For enterprise:** Add schema validation and drift detection

This approach ensures your tests always stay in sync with your schema changes without manual maintenance.

