<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    // Manual Check-In by ID (for the Attendance Page button)
    public function manualCheckIn($registrationId) {
        // Check if already checked in
        $exists = DB::table('attendances')->where('registration_id', $registrationId)->exists();
        
        if ($exists) {
            return response()->json(['message' => 'Already checked in']);
        }

        // Create Attendance Record
        DB::table('attendances')->insert([
            'registration_id' => $registrationId,
            'check_in_time' => now(),
            'status' => 'Present'
        ]);

        // Update Registration Status to "Present" for UI
        DB::table('registrations')->where('id', $registrationId)->update(['status' => 'Present']);

        return response()->json(['message' => 'User Checked In Successfully']);
    }


    public function scan(Request $request) {
        $qrString = $request->input('qr_code');

        // Find the registration matching the QR code
        $registration = DB::table('registrations')
            ->join('users', 'registrations.user_id', '=', 'users.id')
            ->where('registrations.qr_code_string', $qrString)
            ->select('registrations.id as reg_id', 'users.first_name', 'users.last_name')
            ->first();

        if (!$registration) {
            return response()->json(['status' => 'error', 'message' => 'Invalid QR Code'], 404);
        }

        // Check if already checked in
        $exists = DB::table('attendances')->where('registration_id', $registration->reg_id)->exists();
        
        if ($exists) {
            return response()->json(['status' => 'warning', 'message' => 'User already checked in!']);
        }

        // Log attendance
        DB::table('attendances')->insert([
            'registration_id' => $registration->reg_id,
            'check_in_time' => now(),
            'status' => 'Present'
        ]);
        
        
        return response()->json([
            'status' => 'success', 
            'message' => 'Checked in: ' . $registration->first_name . ' ' . $registration->last_name
        ]);
    }
}