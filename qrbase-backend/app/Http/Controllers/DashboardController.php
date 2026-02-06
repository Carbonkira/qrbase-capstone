<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Event;
use App\Models\Registration;
use App\Models\Attendance;

class DashboardController extends Controller
{
    // For OrganizerDash.jsx
    public function stats() {
        return response()->json([
            'registrations' => Registration::count(),
            'checked_in' => Attendance::count(),
            'events_count' => Event::count(),
            'team_count' => User::whereIn('role', ['organizer', 'volunteer', 'admin'])->count()
        ]);
    }

    // For Role.jsx (Team Page)
    public function getTeam() {
        // Fetch users who are NOT simple participants
        return User::where('role', '!=', 'participant')->get();
    }

    // Add a Team Member
    public function addTeamMember(Request $request) {
        $fields = $request->validate([
            'first_name' => 'required',
            'last_name' => 'required',
            'email' => 'required|email|unique:users',
            'role' => 'required',
            'password' => 'required' // You might want to auto-generate this
        ]);

        $user = User::create([
            'first_name' => $fields['first_name'],
            'last_name' => $fields['last_name'],
            'email' => $fields['email'],
            'role' => $fields['role'],
            'password' => bcrypt($fields['password'])
        ]);

        return response()->json($user, 201);
    }
    
    public function storeAttendanceRequest(Request $request) {
        // 1. Validate
        $request->validate(['email' => 'required|email']);

        // 2. Find User by Email (Exact Match)
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found! Check the email address.'], 404);
        }

        // 3. Find Latest Event
        $event = Event::latest()->first(); 
        if (!$event) return response()->json(['message' => 'Please create an Event first!'], 404);

        // 4. Check if already registered
        $exists = Registration::where('event_id', $event->id)->where('user_id', $user->id)->exists();
        if ($exists) return response()->json(['message' => 'User already added to this event!'], 409);

        // 5. Create Request
        $reg = Registration::create([
            'event_id' => $event->id,
            'user_id' => $user->id,
            'qr_code_string' => 'MANUAL-' . uniqid(),
            'status' => 'Pending'
        ]);

        return response()->json($reg->load('user', 'event'), 201);
    }
    // For Attendance.jsx (List Requests)
    public function getAttendanceRequests() {
        // Fetch registrations with user details
        return Registration::with('user', 'event')->get();
    }

    // Update Request Status (Approve/Reject)
    public function updateRequestStatus(Request $request, $id) {
        $reg = Registration::findOrFail($id);
        $reg->update(['status' => $request->status]);
        return response()->json($reg);
    }


}