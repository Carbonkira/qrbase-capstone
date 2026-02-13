<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\SpeakerController;
use App\Http\Controllers\UserController; 

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- PUBLIC ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// --- PROTECTED ---
Route::middleware('auth:sanctum')->group(function () {

    // AUTH (Logout remains here)
    Route::post('/logout', [AuthController::class, 'logout']);

    // USER (Profile Management - Moved to UserController)
    Route::get('/user', [UserController::class, 'index']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::put('/user/password', [UserController::class, 'changePassword']);
    
    // DASHBOARD & EVENTS
    Route::get('/dashboard-stats', [EventController::class, 'dashboardStats']);
    Route::get('/events', [EventController::class, 'index']); 
    Route::post('/events', [EventController::class, 'store']); 
    Route::put('/events/{id}', [EventController::class, 'update']); 
    Route::delete('/events/{id}', [EventController::class, 'destroy']); 
    Route::get('/events/{id}/module', [EventController::class, 'getEventModuleData']); 
    Route::get('/events/{id}/export', [RegistrationController::class, 'exportAttendance']); 

    // SPEAKERS
    Route::get('/all-speakers', [SpeakerController::class, 'index']); 
    Route::post('/speakers', [SpeakerController::class, 'store']); 
    Route::put('/speakers/{id}', [SpeakerController::class, 'update']); 
    Route::delete('/speakers/{id}', [SpeakerController::class, 'destroy']); 

    // PARTICIPANT & SCANNING
    Route::post('/join', [RegistrationController::class, 'join']); 
    Route::get('/my-tickets', [RegistrationController::class, 'myTickets']); 
    Route::post('/events/{id}/scan', [RegistrationController::class, 'scan']); 
    Route::put('/attendance-requests/{id}', [RegistrationController::class, 'updateStatus']); 

    // WALKINS (Make sure this route exists for the modal to work!)
    Route::post('/events/{id}/walk-in', [RegistrationController::class, 'registerWalkIn']);

    // FEEDBACK
    Route::post('/events/{id}/feedback-form', [EventController::class, 'saveFeedbackForm']); 
    Route::get('/events/{id}/form', [EventController::class, 'getParticipantForm']); 
    Route::post('/events/{id}/feedback', [EventController::class, 'submitFeedback']); 
});