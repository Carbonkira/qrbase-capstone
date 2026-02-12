<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\SpeakerController;

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

    // USER
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // DASHBOARD & EVENTS
    Route::get('/dashboard-stats', [EventController::class, 'dashboardStats']);
    Route::get('/events', [EventController::class, 'index']); 
    Route::post('/events', [EventController::class, 'store']); 
    Route::put('/events/{id}', [EventController::class, 'update']); 
    Route::delete('/events/{id}', [EventController::class, 'destroy']); 
    Route::get('/events/{id}/module', [EventController::class, 'getEventModuleData']); 
    Route::get('/events/{id}/export', [RegistrationController::class, 'exportAttendance']); 

    // SPEAKERS (Global & Event Specific)
    Route::get('/all-speakers', [SpeakerController::class, 'index']); 
    Route::post('/speakers', [SpeakerController::class, 'store']); 
    // *** THIS IS THE MISSING LINE FIXING YOUR ERROR ***
    Route::put('/speakers/{id}', [SpeakerController::class, 'update']); 
    Route::delete('/speakers/{id}', [SpeakerController::class, 'destroy']); 

    // PARTICIPANT & SCANNING
    Route::post('/join', [RegistrationController::class, 'join']); 
    Route::get('/my-tickets', [RegistrationController::class, 'myTickets']); 
    Route::post('/events/{id}/scan', [RegistrationController::class, 'scan']); 
    Route::put('/attendance-requests/{id}', [RegistrationController::class, 'updateStatus']); 

    // FEEDBACK
    Route::post('/events/{id}/feedback-form', [EventController::class, 'saveFeedbackForm']); 
    Route::get('/events/{id}/form', [EventController::class, 'getParticipantForm']); 
    Route::post('/events/{id}/feedback', [EventController::class, 'submitFeedback']); 
});