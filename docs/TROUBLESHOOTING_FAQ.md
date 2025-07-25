# Troubleshooting & FAQ - Dashboard Donasi PABU

## Common Issues & Solutions

### 1. Backend Issues (Laravel)

#### Issue: "Class not found" Error

**Symptoms:**
```
Fatal error: Class 'App\Models\Team' not found
```

**Solutions:**
```bash
# Regenerate autoload files
composer dump-autoload

# Clear and regenerate caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Regenerate optimized files
php artisan config:cache
php artisan route:cache
```

#### Issue: Database Connection Failed

**Symptoms:**
```
Illuminate\Database\QueryException: SQLSTATE[HY000] [2002] Connection refused
```

**Solutions:**
```bash
# Check database service status
sudo systemctl status mysql
# or for XAMPP/Laragon
net start mysql

# Verify database credentials in .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dashboard_donasi_pabu
DB_USERNAME=root
DB_PASSWORD=

# Test connection
php artisan tinker
# In tinker:
DB::connection()->getPdo();

# Clear config cache
php artisan config:clear
```

#### Issue: Migration Failed

**Symptoms:**
```
SQLSTATE[42S01]: Base table or view already exists
```

**Solutions:**
```bash
# Check migration status
php artisan migrate:status

# Rollback and re-run
php artisan migrate:rollback
php artisan migrate

# Fresh migration (WARNING: This will delete all data)
php artisan migrate:fresh --seed

# Reset specific migration
php artisan migrate:rollback --step=1
```

#### Issue: Storage Link Not Working

**Symptoms:**
- Images not displaying
- 404 errors for storage files

**Solutions:**
```bash
# Create storage link
php artisan storage:link

# Verify link exists
ls -la public/storage

# Manual link creation (if above fails)
ln -s ../storage/app/public public/storage

# Check file permissions
chmod -R 775 storage
chown -R www-data:www-data storage
```

#### Issue: CORS Errors

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:8000/api/teams' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solutions:**

1. **Install Laravel Sanctum (if not already):**
```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

2. **Configure CORS in config/cors.php:**
```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

3. **Add to .env:**
```env
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:3000
```

#### Issue: 500 Internal Server Error

**Symptoms:**
- White screen or generic error page
- No detailed error message

**Solutions:**
```bash
# Enable debug mode in .env
APP_DEBUG=true
APP_ENV=local

# Check Laravel logs
tail -f storage/logs/laravel.log

# Check web server logs
# For Apache:
tail -f /var/log/apache2/error.log
# For Nginx:
tail -f /var/log/nginx/error.log

# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Check file permissions
chmod -R 775 storage bootstrap/cache
```

### 2. Frontend Issues (React)

#### Issue: "Module not found" Error

**Symptoms:**
```
Module not found: Error: Can't resolve './components/TeamManagement'
```

**Solutions:**
```bash
# Check file path and case sensitivity
# Ensure import path matches actual file location

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart development server
npm run dev
```

#### Issue: API Calls Failing

**Symptoms:**
```
AxiosError: Network Error
AxiosError: Request failed with status code 404
```

**Solutions:**

1. **Check API base URL in services/api.ts:**
```typescript
const API_BASE_URL = 'http://localhost:8000/api'; // Ensure this matches your backend
```

2. **Verify backend is running:**
```bash
# For Laravel development server
php artisan serve

# For Apache/Nginx
sudo systemctl status apache2
sudo systemctl status nginx
```

3. **Check network tab in browser DevTools:**
- Look for failed requests
- Check request/response headers
- Verify request payload

4. **Test API directly:**
```bash
# Test with curl
curl -X GET http://localhost:8000/api/teams

# Test with Postman or similar tool
```

#### Issue: Build Fails

**Symptoms:**
```
TypeScript error: Property 'branch' does not exist on type 'Team'
```

**Solutions:**
```bash
# Update TypeScript interfaces in types/index.ts
# Ensure all properties are properly typed

# Clear TypeScript cache
rm -rf node_modules/.cache

# Reinstall dependencies
npm ci

# Run type check
npx tsc --noEmit
```

#### Issue: Styling Not Applied

**Symptoms:**
- Components appear unstyled
- Tailwind classes not working

**Solutions:**
```bash
# Ensure Tailwind is properly configured
# Check tailwind.config.js

# Verify CSS imports in main.tsx or App.tsx
import './index.css'

# Rebuild CSS
npm run build:css

# Clear browser cache
# Hard refresh (Ctrl+Shift+R)
```

### 3. Database Issues

#### Issue: Foreign Key Constraint Fails

**Symptoms:**
```
SQLSTATE[23000]: Integrity constraint violation: 1452 Cannot add or update a child row
```

**Solutions:**
```bash
# Check if referenced record exists
# For example, when creating team with branch_id=1:
SELECT * FROM branches WHERE id = 1;

# Ensure proper migration order
# Branches should be created before teams

# Check foreign key constraints
SHOW CREATE TABLE teams;

# Temporarily disable foreign key checks (for development only)
SET FOREIGN_KEY_CHECKS=0;
# Run your operations
SET FOREIGN_KEY_CHECKS=1;
```

#### Issue: Duplicate Entry Error

**Symptoms:**
```
SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry
```

**Solutions:**
```bash
# Check unique constraints
SHOW CREATE TABLE teams;

# Find duplicate records
SELECT branch_id, code, COUNT(*) 
FROM teams 
GROUP BY branch_id, code 
HAVING COUNT(*) > 1;

# Remove duplicates (be careful!)
DELETE t1 FROM teams t1
INNER JOIN teams t2 
WHERE t1.id > t2.id 
AND t1.branch_id = t2.branch_id 
AND t1.code = t2.code;
```

#### Issue: Database Connection Pool Exhausted

**Symptoms:**
```
SQLSTATE[HY000] [1040] Too many connections
```

**Solutions:**
```sql
-- Check current connections
SHOW PROCESSLIST;

-- Check max connections
SHOW VARIABLES LIKE 'max_connections';

-- Increase max connections (in my.cnf)
[mysqld]
max_connections = 200

-- Kill long-running queries
KILL <process_id>;
```

### 4. Performance Issues

#### Issue: Slow API Responses

**Symptoms:**
- API calls taking > 2 seconds
- Frontend feels sluggish

**Solutions:**

1. **Enable Query Logging:**
```php
// In AppServiceProvider.php boot() method
DB::listen(function ($query) {
    Log::info('Query: ' . $query->sql . ' [' . implode(', ', $query->bindings) . '] Time: ' . $query->time . 'ms');
});
```

2. **Optimize Database Queries:**
```php
// Use eager loading
$teams = Team::with(['branch', 'users'])->get();

// Instead of:
$teams = Team::all();
foreach ($teams as $team) {
    echo $team->branch->name; // N+1 query problem
}
```

3. **Add Database Indexes:**
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_teams_branch_id ON teams(branch_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

4. **Enable Caching:**
```php
// Cache frequently accessed data
$branches = Cache::remember('branches', 3600, function () {
    return Branch::all();
});
```

#### Issue: High Memory Usage

**Symptoms:**
- Server running out of memory
- 500 errors under load

**Solutions:**
```bash
# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Increase PHP memory limit in php.ini
memory_limit = 512M

# Use pagination for large datasets
$teams = Team::paginate(20);

# Use chunk for processing large datasets
Team::chunk(100, function ($teams) {
    foreach ($teams as $team) {
        // Process team
    }
});
```

### 5. Deployment Issues

#### Issue: 404 Error After Deployment

**Symptoms:**
- Routes work locally but not on server
- API endpoints return 404

**Solutions:**
```bash
# Check web server configuration
# For Apache, ensure .htaccess is present and mod_rewrite is enabled
sudo a2enmod rewrite
sudo systemctl restart apache2

# For Nginx, ensure try_files directive is correct
location / {
    try_files $uri $uri/ /index.php?$query_string;
}

# Clear route cache
php artisan route:clear
php artisan route:cache

# Check file permissions
chmod -R 755 /var/www/your-app
chown -R www-data:www-data /var/www/your-app
```

#### Issue: Environment Variables Not Loading

**Symptoms:**
- App shows default values instead of .env values
- Database connection fails on server

**Solutions:**
```bash
# Ensure .env file exists and has correct permissions
chmod 644 .env
chown www-data:www-data .env

# Clear config cache
php artisan config:clear

# Verify environment
php artisan tinker
# In tinker:
config('database.connections.mysql.host');
env('DB_HOST');

# Check for syntax errors in .env
# Ensure no spaces around = sign
# Wrap values with spaces in quotes
APP_NAME="Dashboard Donasi PABU"
```

## Frequently Asked Questions (FAQ)

### Q1: How do I add a new field to an existing table?

**Answer:**
```bash
# Create migration
php artisan make:migration add_description_to_teams_table --table=teams

# Edit migration file
public function up()
{
    Schema::table('teams', function (Blueprint $table) {
        $table->text('description')->nullable()->after('code');
    });
}

public function down()
{
    Schema::table('teams', function (Blueprint $table) {
        $table->dropColumn('description');
    });
}

# Run migration
php artisan migrate

# Update model fillable array
protected $fillable = [
    'name',
    'branch_id',
    'code',
    'description', // Add this
];

# Update TypeScript interface
export interface Team {
    id: string;
    name: string;
    branchId: string;
    code: string;
    description?: string; // Add this
    branch?: Branch;
}
```

### Q2: How do I handle file uploads?

**Answer:**

1. **Backend (Laravel):**
```php
// In controller
public function store(Request $request)
{
    $request->validate([
        'proof_image' => 'required|image|mimes:jpeg,png,jpg|max:2048',
    ]);

    $imagePath = null;
    if ($request->hasFile('proof_image')) {
        $imagePath = $request->file('proof_image')->store('transactions', 'public');
    }

    Transaction::create([
        // other fields
        'proof_image' => $imagePath,
    ]);
}
```

2. **Frontend (React):**
```typescript
const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('proof_image', file);
    formData.append('donor_name', donorName);
    // append other fields

    try {
        const response = await api.post('/transactions', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
```

### Q3: How do I implement authentication?

**Answer:**

1. **Install Laravel Sanctum:**
```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

2. **Create Auth Controller:**
```php
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token,
            ]);
        }

        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }
}
```

3. **Frontend Auth Context:**
```typescript
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    const login = async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, token } = response.data;
        
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        
        // Set default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
```

### Q4: How do I implement role-based access control?

**Answer:**

1. **Backend Middleware:**
```php
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!$request->user() || !in_array($request->user()->role, $roles)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $next($request);
    }
}

// In routes/api.php
Route::middleware(['auth:sanctum', 'role:admin,validator'])->group(function () {
    Route::get('/admin/users', [UserController::class, 'index']);
});
```

2. **Frontend Route Protection:**
```typescript
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles: string[] }> = ({ children, roles }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (!roles.includes(user.role)) {
        return <div>Access Denied</div>;
    }

    return <>{children}</>;
};

// Usage
<Route path="/admin" element={
    <ProtectedRoute roles={['admin']}>
        <AdminDashboard />
    </ProtectedRoute>
} />
```

### Q5: How do I optimize for production?

**Answer:**

1. **Laravel Optimization:**
```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer install --optimize-autoloader --no-dev

# Enable OPcache in php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=2
opcache.fast_shutdown=1
```

2. **React Optimization:**
```bash
# Build for production
npm run build

# Analyze bundle size
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js

# Enable gzip compression in web server
# Nginx example:
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

3. **Database Optimization:**
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_teams_branch_id ON teams(branch_id);

-- Optimize MySQL configuration
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
query_cache_size = 64M
```

### Q6: How do I handle errors gracefully?

**Answer:**

1. **Backend Error Handling:**
```php
// In app/Exceptions/Handler.php
public function render($request, Throwable $exception)
{
    if ($request->expectsJson()) {
        if ($exception instanceof ValidationException) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $exception->errors(),
            ], 422);
        }

        if ($exception instanceof ModelNotFoundException) {
            return response()->json([
                'message' => 'Resource not found',
            ], 404);
        }

        return response()->json([
            'message' => 'Server error',
            'error' => config('app.debug') ? $exception->getMessage() : 'Internal server error',
        ], 500);
    }

    return parent::render($request, $exception);
}
```

2. **Frontend Error Handling:**
```typescript
// Error boundary component
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-fallback">
                    <h2>Something went wrong.</h2>
                    <button onClick={() => this.setState({ hasError: false })}>
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// API error handling
const handleApiError = (error: any) => {
    if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message || 'Server error';
        toast.error(message);
    } else if (error.request) {
        // Request made but no response
        toast.error('Network error. Please check your connection.');
    } else {
        // Something else happened
        toast.error('An unexpected error occurred.');
    }
};
```

## Performance Monitoring

### Laravel Telescope (Development)

```bash
# Install Telescope
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate

# Access at: http://your-app.test/telescope
```

### Production Monitoring

1. **Laravel Horizon (for queues):**
```bash
composer require laravel/horizon
php artisan horizon:install
php artisan horizon
```

2. **Application Performance Monitoring:**
- New Relic
- Datadog
- Sentry (for error tracking)

3. **Server Monitoring:**
- Uptime Robot
- Pingdom
- StatusCake

## Getting Help

### Documentation Resources
- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Community Support
- [Laravel Community](https://laracasts.com/discuss)
- [React Community](https://reactjs.org/community/support.html)
- [Stack Overflow](https://stackoverflow.com)

### Debug Tools
- Laravel Telescope
- React Developer Tools
- Browser DevTools
- Postman/Insomnia for API testing

---

**Remember:** Always backup your database before making significant changes, and test thoroughly in a development environment before deploying to production.