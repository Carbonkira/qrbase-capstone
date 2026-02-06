<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DashboardController;
// Public Routes (Login & Register do not require a token)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes (Requires you to be logged in)
Route::middleware('auth:sanctum')->group(function () {
    
    // Dashboard
    Route::get('/dashboard-stats', [DashboardController::class, 'stats']);

    // Team / Role
    Route::get('/team', [DashboardController::class, 'getTeam']);
    Route::post('/team', [DashboardController::class, 'addTeamMember']);
    Route::delete('/team/{id}', function($id) { \App\Models\User::destroy($id); return response()->ok(); });
    // Event Management
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
    
    // NEW: Update and Delete Routes
    Route::post('/events/{id}', [EventController::class, 'update']); // Use POST for file uploads
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
    // Attendance List
    Route::post('/attendance/checkin/{id}', [AttendanceController::class, 'manualCheckIn']);
    Route::get('/attendance-requests', [DashboardController::class, 'getAttendanceRequests']);
    Route::put('/attendance-requests/{id}', [DashboardController::class, 'updateRequestStatus']);
    // Attendance List (GET) - You probably already have this
    Route::get('/attendance-requests', [DashboardController::class, 'getAttendanceRequests']);

    // Attendance Create (POST) - ADD THIS LINE
    Route::post('/attendance-requests', [DashboardController::class, 'storeAttendanceRequest']);
    
    // Attendance Check-In (POST) - Make sure this is here too
    Route::post('/attendance/checkin/{id}', [AttendanceController::class, 'manualCheckIn']);
    // Event Management
    Route::get('/dashboard-stats', [EventController::class, 'stats']);
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
    
    // Registration & QR Codes
    Route::post('/events/{id}/register', [EventController::class, 'registerUser']);
    Route::get('/my-tickets', [EventController::class, 'myTickets']);
    
    // Attendance Scanning
    Route::post('/attendance/scan', [AttendanceController::class, 'scan']);
    
    // Get Current User Info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });


    
});