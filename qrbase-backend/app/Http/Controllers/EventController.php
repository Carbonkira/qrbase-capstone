<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\Registration;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class EventController extends Controller
{
    public function index() {
        return Event::withCount(['registrations', 'registrations as attendances_count' => function ($query) {
            $query->where('status', 'Present');
        }])->latest()->get();
    }

    public function store(Request $request) {
        $fields = $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'location' => 'required|string',
            'schedule_date' => 'required|date',
            'max_participants' => 'required|integer|min:1',
            'image' => 'nullable|image|max:2048'
        ]);

        $imagePath = $request->hasFile('image') ? $request->file('image')->store('events', 'public') : null;

        // Generate a unique 6-char Invite Code
        $inviteCode = strtoupper(Str::random(6));
        while(Event::where('invite_code', $inviteCode)->exists()) {
            $inviteCode = strtoupper(Str::random(6));
        }

        $event = Event::create([
            'organizer_id' => $request->user()->id,
            'title' => $fields['title'],
            'description' => $fields['description'],
            'location' => $fields['location'],
            'schedule_date' => $fields['schedule_date'],
            'max_participants' => $fields['max_participants'],
            'invite_code' => $inviteCode, // Save the code
            'image' => $imagePath,
            'status' => 'Upcoming'
        ]);

        return response()->json(['message' => 'Event created!', 'event' => $event], 201);
    }

    // NEW: Participant Joins via Code
    public function joinByCode(Request $request) {
        $request->validate(['invite_code' => 'required|string']);

        $event = Event::where('invite_code', $request->invite_code)->first();

        if (!$event) {
            return response()->json(['message' => 'Invalid Invite Code'], 404);
        }

        // Check if already registered
        $exists = Registration::where('event_id', $event->id)
                              ->where('user_id', $request->user()->id)
                              ->exists();
        if ($exists) {
            return response()->json(['message' => 'You have already joined this event!'], 409);
        }

        // Check Capacity
        if ($event->registrations()->count() >= $event->max_participants) {
            return response()->json(['message' => 'Event is Full'], 400);
        }

        // Generate Ticket
        $qrString = "EVT" . $event->id . "-USR" . $request->user()->id . "-" . Str::random(6);
        
        Registration::create([
            'event_id' => $event->id,
            'user_id' => $request->user()->id,
            'qr_code_string' => $qrString,
            'status' => 'Confirmed'
        ]);

        return response()->json(['message' => 'Successfully joined event!', 'event' => $event]);
    }

    // ... Keep update() and destroy() from previous steps ...
    public function update(Request $request, $id) { /* ... keep existing code ... */ }
    public function destroy($id) { /* ... keep existing code ... */ }
}