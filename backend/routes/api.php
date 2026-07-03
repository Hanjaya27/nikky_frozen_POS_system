<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\LoginActivityController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\SettingController;

/*
|--------------------------------------------------------------------------
| AUTH API
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);

/*
|--------------------------------------------------------------------------
| PRODUCTS API
|--------------------------------------------------------------------------
*/

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::post('/products', [ProductController::class, 'store']);
Route::put('/products/{id}', [ProductController::class, 'update']);
Route::delete('/products/{id}', [ProductController::class, 'destroy']);
Route::post('/products/{id}/mutate', [ProductController::class, 'mutateStock']);

/*
|--------------------------------------------------------------------------
| TRANSACTIONS API
|--------------------------------------------------------------------------
*/

Route::get('/transactions', [TransactionController::class, 'index']);
Route::post('/checkout', [TransactionController::class, 'checkout']);

/*
|--------------------------------------------------------------------------
| EXPENSES API
|--------------------------------------------------------------------------
*/

Route::get('/expenses', [ExpenseController::class, 'index']);
Route::get('/expenses/{id}', [ExpenseController::class, 'show']);
Route::post('/expenses', [ExpenseController::class, 'store']);
Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);

/*
|--------------------------------------------------------------------------
| SHIFTS API
|--------------------------------------------------------------------------
*/

Route::get('/shifts', [ShiftController::class, 'index']);
Route::get('/shifts/current', [ShiftController::class, 'current']);
Route::get('/shifts/{id}', [ShiftController::class, 'show']);
Route::post('/shifts/open', [ShiftController::class, 'open']);
Route::put('/shifts/{id}', [ShiftController::class, 'update']);
Route::put('/shifts/{id}/close', [ShiftController::class, 'close']);
Route::delete('/shifts/{id}', [ShiftController::class, 'destroy']);

Route::get('/login-activities', [LoginActivityController::class, 'index']);
Route::put('/login-activities/{id}/force-logout', [LoginActivityController::class, 'forceLogout']);
Route::delete('/login-activities/{id}', [LoginActivityController::class, 'destroy']);

Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::post('/users', [UserController::class, 'store']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);

/*
|--------------------------------------------------------------------------
| ROLE PERMISSIONS API
|--------------------------------------------------------------------------
*/

Route::get('/permissions', [RolePermissionController::class, 'index']);
Route::put('/permissions', [RolePermissionController::class, 'updateAll']);
Route::put('/permissions/{permissionId}', [RolePermissionController::class, 'updateSingle']);
Route::post('/permissions/reset', [RolePermissionController::class, 'reset']);

Route::get('/settings', [SettingController::class, 'index']);
Route::put('/settings', [SettingController::class, 'update']);
Route::post('/settings/reset', [SettingController::class, 'reset']);
