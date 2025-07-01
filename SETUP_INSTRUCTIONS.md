# Setup Instructions for Gaming & Billiard Center Management System

## Initial User Setup

The application requires users to be created in Supabase Auth before they can log in. The migration has set up user profiles, but you need to create the corresponding auth users.

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user" and create the following users:

**Admin User:**
- Email: `admin@example.com`
- Password: `password123`
- User ID: `00000000-0000-0000-0000-000000000001`

**Manager User:**
- Email: `manager1@example.com`
- Password: `password123`
- User ID: `00000000-0000-0000-0000-000000000002`

**Cashier Users:**
- Email: `kasir1@example.com`
- Password: `password123`
- User ID: `00000000-0000-0000-0000-000000000003`

- Email: `kasir2@example.com`
- Password: `password123`
- User ID: `00000000-0000-0000-0000-000000000004`

**Staff User:**
- Email: `staff1@example.com`
- Password: `password123`
- User ID: `00000000-0000-0000-0000-000000000005`

### Method 2: Using Supabase CLI

If you have the Supabase CLI installed, you can run these commands:

```bash
# Create admin user
supabase auth users create admin@example.com --password password123 --user-id 00000000-0000-0000-0000-000000000001

# Create manager user
supabase auth users create manager1@example.com --password password123 --user-id 00000000-0000-0000-0000-000000000002

# Create cashier users
supabase auth users create kasir1@example.com --password password123 --user-id 00000000-0000-0000-0000-000000000003
supabase auth users create kasir2@example.com --password password123 --user-id 00000000-0000-0000-0000-000000000004

# Create staff user
supabase auth users create staff1@example.com --password password123 --user-id 00000000-0000-0000-0000-000000000005
```

### Method 3: Programmatic Creation

You can also create users programmatically using the Supabase Admin API. Here's an example using JavaScript:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_SERVICE_ROLE_KEY' // Use service role key, not anon key
)

const users = [
  { email: 'admin@example.com', password: 'password123', id: '00000000-0000-0000-0000-000000000001' },
  { email: 'manager1@example.com', password: 'password123', id: '00000000-0000-0000-0000-000000000002' },
  { email: 'kasir1@example.com', password: 'password123', id: '00000000-0000-0000-0000-000000000003' },
  { email: 'kasir2@example.com', password: 'password123', id: '00000000-0000-0000-0000-000000000004' },
  { email: 'staff1@example.com', password: 'password123', id: '00000000-0000-0000-0000-000000000005' }
]

for (const user of users) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    user_metadata: { user_id: user.id },
    email_confirm: true
  })
  
  if (error) {
    console.error(`Error creating user ${user.email}:`, error)
  } else {
    console.log(`Created user ${user.email}`)
  }
}
```

## After Creating Users

Once you've created the auth users, you should be able to log in with any of the demo credentials:

- **Admin:** admin@example.com / password123
- **Manager:** manager1@example.com / password123  
- **Cashier 1:** kasir1@example.com / password123
- **Cashier 2:** kasir2@example.com / password123
- **Staff:** staff1@example.com / password123

## Sample Data

The migration also creates:
- Equipment types (PS4, PS5, Xbox, Billiard tables)
- Rate profiles for different equipment
- Sample consoles and equipment
- Sample suppliers and products
- Sample customers
- Proper roles and permissions

## Troubleshooting

If you still get "Invalid login credentials" after creating the users:

1. Verify the users exist in Supabase Auth dashboard
2. Check that the user IDs match exactly (including the specific UUIDs)
3. Ensure email confirmation is not required (set `email_confirm: true` when creating)
4. Check your Supabase URL and anon key in the `.env` file
5. Try logging in with a different user to isolate the issue

## Security Notes

- Change the default passwords in production
- The demo users have specific UUIDs to match the user profiles in the database
- RLS policies are enabled to ensure proper data access control
- Each role has specific permissions defined in the roles table