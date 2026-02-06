<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\AttendanceController;

// Public Routes (No login required)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes (User must be logged in)
Route::middleware('auth:sanctum')->group(function () {
    // Event Management
    Route::get('/dashboard-stats', [EventController::class, 'stats']);
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
    
    // Registration & QR
    Route::post('/events/{id}/register', [EventController::class, 'registerUser']);
    Route::get('/my-tickets', [EventController::class, 'myTickets']);
    
    // Scanning
    Route::post('/attendance/scan', [AttendanceController::class, 'scan']);
    
    // Get Current User
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});