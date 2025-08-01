<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\AppSettingsController;
use App\Http\Controllers\ReportsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Public payment methods (for transaction form)
Route::get('/payment-methods', [PaymentMethodController::class, 'index']);

// Public app settings (for frontend theming)
Route::get('/app-settings', [AppSettingsController::class, 'show']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    
    // User routes
    Route::apiResource('users', UserController::class);
    Route::get('/users/branch/{branchId}', [UserController::class, 'getByBranch']);
    Route::get('/users/team/{teamId}', [UserController::class, 'getByTeam']);
    
    // Branch routes
    Route::apiResource('branches', BranchController::class);
    
    // Team routes
    Route::apiResource('teams', TeamController::class);
    
    // Program routes
    Route::apiResource('programs', ProgramController::class);
    Route::post('/programs/update-transaction-rates', [ProgramController::class, 'updateAllTransactionRates']);
    
    // Payment Method routes (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('payment-methods', PaymentMethodController::class)->except(['index']);
    });
    
    // Dashboard routes
    Route::get('/dashboard', [DashboardController::class, 'index']);
    
    // App Settings routes (update requires auth)
    Route::put('/app-settings', [AppSettingsController::class, 'update']);
    Route::post('/app-settings/upload-logo', [AppSettingsController::class, 'uploadLogo']);
    Route::post('/app-settings/upload-favicon', [AppSettingsController::class, 'uploadFavicon']);
    
    // Transaction routes
    Route::apiResource('transactions', TransactionController::class);
    Route::post('/transactions/{transaction}/validate', [TransactionController::class, 'validate']);
    Route::post('/transactions/bulk-update-status', [TransactionController::class, 'bulkUpdateStatus']);
    Route::post('/transactions/import', [TransactionController::class, 'import']);
    Route::get('/my-transactions', [TransactionController::class, 'myTransactions']);
    Route::get('/my-transactions-stats', [TransactionController::class, 'myTransactionsStats']);
    Route::get('/pending-transactions', [TransactionController::class, 'pending']);
    
});

// Reports routes
Route::middleware('auth:api')->group(function () {
    Route::get('/reports/branches', [ReportsController::class, 'getBranchReports']);
    Route::get('/reports/volunteers', [ReportsController::class, 'getVolunteerReports']);
    Route::get('/reports/branches/{branchId}/detail', [ReportsController::class, 'getBranchDetailReport']);
    Route::get('/reports/summary', [ReportsController::class, 'getSummaryStats']);
});