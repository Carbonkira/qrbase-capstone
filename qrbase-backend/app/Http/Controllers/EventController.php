<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Speaker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class EventController extends Controller
{
    public function index(Request $request) {
        return Event::with('speakers')
            // Count total registrations (Booked)
            ->withCount('registrations') 
            // Count only those marked 'Present'
            ->withCount(['registrations as present_count' => function ($query) {
                $query->where('status', 'Present');
            }])
            ->where('organizer_id', $request->user()->id)
            ->latest()
            ->get();
    }

    // Create a new event
    public function store(Request $request) {
        $fields = $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'location' => 'required|string',
            'schedule_date' => 'required|date',
            'max_participants' => 'required|integer',
            'image' => 'nullable|image|max:2048',
            'speaker_ids' => 'nullable|array', 
            'speaker_ids.*' => 'exists:speakers,id'
        ]);

        $imagePath = $request->hasFile('image') 
            ? $request->file('image')->store('events', 'public') 
            : null;

        $inviteCode = strtoupper(\Illuminate\Support\Str::random(6));

        $event = Event::create([
            'organizer_id' => $request->user()->id,
            'title' => $fields['title'],
            'description' => $fields['description'],
            'location' => $fields['location'],
            'schedule_date' => $fields['schedule_date'],
            'max_participants' => $fields['max_participants'],
            'invite_code' => $inviteCode,
            'image' => $imagePath,
            'status' => 'Upcoming'
        ]);

        if ($request->has('speaker_ids')) {
            $event->speakers()->attach($request->speaker_ids);
        }

        return response()->json(['message' => 'Event created!', 'event' => $event], 201);
    }

    // --- 2. UPDATE ---
    public function update(Request $request, $id) {
        // Only find event if it belongs to this user
        $event = Event::where('organizer_id', $request->user()->id)->findOrFail($id);

        $fields = $request->validate([
            'title' => 'sometimes|string',
            'location' => 'sometimes|string',
            'schedule_date' => 'sometimes|date',
            'max_participants' => 'sometimes|integer',
            'description' => 'nullable|string',
            'speaker_ids' => 'nullable|array'
        ]);

        if ($request->hasFile('image')) {
            if ($event->image) Storage::disk('public')->delete($event->image);
            $event->image = $request->file('image')->store('events', 'public');
            $event->save();
        }

        $event->update($request->except(['speaker_ids', 'image']));

        if ($request->has('speaker_ids')) {
            $event->speakers()->sync($request->speaker_ids);
        }

        return response()->json(['message' => 'Event updated!', 'event' => $event]);
    }

    // --- 3. DELETE ---
    public function destroy(Request $request, $id) {
        // Only find event if it belongs to this user
        $event = Event::where('organizer_id', $request->user()->id)->findOrFail($id);
        
        if ($event->image) Storage::disk('public')->delete($event->image);
        $event->delete();
        return response()->json(['message' => 'Event deleted']);
    }

    // --- 4. MODULE DATA (FIXED to return available_speakers) ---
    public function getEventModuleData(Request $request, $id) {
        // Only allow viewing if you are the organizer
        $event = Event::with(['registrations.user', 'speakers'])
            ->withCount(['registrations as present_count' => function($q){
                $q->where('status', 'Present');
            }])
            ->where('organizer_id', $request->user()->id)
            ->findOrFail($id);

        $form = DB::table('event_feedback_forms')->where('event_id', $id)->first();

        $feedbackResponses = DB::table('feedback_responses')
            ->where('event_id', $id)
            ->get()
            ->keyBy('user_id'); 

        $event->registrations->each(function($reg) use ($feedbackResponses) {
            $response = $feedbackResponses->get($reg->user_id);
            $reg->feedback = $response ? json_decode($response->responses, true) : null;
        });

        $feedbackCount = $feedbackResponses->count();

        // FETCH GLOBAL ROSTER for "Add Existing" dropdown
        $allSpeakers = Speaker::where('organizer_id', $request->user()->id)->get();
        
        return response()->json([
            'event' => $event,
            'stats' => [
                'total_registered' => $event->registrations->count(),
                'total_present' => $event->present_count,
                'feedback_received' => $feedbackCount,
                'capacity' => $event->max_participants
            ],
            'attendees' => $event->registrations, 
            'speakers' => $event->speakers, // Speakers specifically attached to this event
            'available_speakers' => $allSpeakers, // All speakers owned by user (for selection)
            'feedback_form' => $form
        ]);
    }

    // Dashboard Statistics
    public function dashboardStats(Request $request) {
        $organizerId = $request->user()->id;
        $eventIds = Event::where('organizer_id', $organizerId)->pluck('id');

        return response()->json([
            'registrations' => DB::table('registrations')->whereIn('event_id', $eventIds)->count(),
            'checked_in' => DB::table('registrations')->whereIn('event_id', $eventIds)->where('status', 'Present')->count(),
            'total_events' => $eventIds->count(),
            'speakers' => Speaker::where('organizer_id', $organizerId)->count() 
        ]);
    }

    // ORGANIZER: Save Feedback Form
    public function saveFeedbackForm(Request $request, $id) {
        $event = Event::where('organizer_id', $request->user()->id)->findOrFail($id);

        $request->validate(['questions' => 'required']); 
        
        DB::table('event_feedback_forms')->updateOrInsert(
            ['event_id' => $id],
            [
                'questions' => json_encode($request->questions), 
                'is_active' => true,
                'updated_at' => now()
            ]
        );

        return response()->json(['message' => 'Form saved']);
    }

    // Allow Participants to get the form structure
    public function getParticipantForm($id) {
        $event = Event::with('speakers')->findOrFail($id);
        
        $form = DB::table('event_feedback_forms')
            ->where('event_id', $id)
            ->where('is_active', true)
            ->first();

        if (!$form) {
            return response()->json(['message' => 'Form not ready'], 404);
        }

        return response()->json([
            'event' => $event,
            'speakers' => $event->speakers,
            'feedback_form' => $form
        ]);
    }

    // PARTICIPANT: Submit Feedback
    public function submitFeedback(Request $request, $id) {
        $existing = DB::table('feedback_responses')
            ->where('event_id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Feedback already submitted.'], 400);
        }

        $request->validate(['responses' => 'required']);

        DB::table('feedback_responses')->insert([
            'event_id' => $id,
            'user_id' => $request->user()->id,
            'responses' => json_encode($request->responses), 
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Feedback submitted successfully!']);
    }
}