<?php

namespace App\Http\Controllers;

use App\Models\Speaker;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SpeakerController extends Controller
{
    /**
     * Get speakers ONLY for the logged-in organizer
     */
    public function index(Request $request) {
        return Speaker::where('organizer_id', $request->user()->id)->latest()->get();
    }

    /**
     * Create a new speaker
     */
    public function store(Request $request) {
        $fields = $request->validate([
            'name' => 'required|string',
            'specialization' => 'required|string',
            'description' => 'nullable|string',
            'contact_email' => 'nullable|email',
            'photo' => 'nullable|image|max:2048',
            'event_id' => 'nullable|exists:events,id',
            'topic' => 'nullable|string' 
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('speakers', 'public');
        }

        $speaker = Speaker::create([
            'organizer_id' => $request->user()->id, 
            'name' => $fields['name'],
            'specialization' => $fields['specialization'],
            'description' => $fields['description'] ?? null,
            'contact_email' => $fields['contact_email'] ?? null,
            'photo_path' => $photoPath
        ]);

        if ($request->filled('event_id')) {
            $event = Event::where('organizer_id', $request->user()->id)->find($request->event_id);
            if ($event) {
                $event->speakers()->attach($speaker->id, ['topic' => $request->topic ?? 'TBA']);
            }
        }

        return response()->json(['message' => 'Speaker created!', 'speaker' => $speaker], 201);
    }

    /**
     * Update an existing speaker (Global + Event Topic)
     */
    public function update(Request $request, $id) {
        $speaker = Speaker::where('organizer_id', $request->user()->id)->findOrFail($id);
        $fields = $request->validate([
            'name' => 'required|string',
            'specialization' => 'required|string',
            'description' => 'nullable|string',
            'contact_email' => 'nullable|email',
            'photo' => 'nullable|image|max:2048',
            
            // Optional: Update topic for a specific event
            'event_id' => 'nullable|exists:events,id',
            'topic' => 'nullable|string'
        ]);

        if ($request->hasFile('photo')) {
            if ($speaker->photo_path) Storage::disk('public')->delete($speaker->photo_path);
            $speaker->photo_path = $request->file('photo')->store('speakers', 'public');
        }

        // 1. Update Global Profile
        $speaker->update([
            'name' => $fields['name'],
            'specialization' => $fields['specialization'],
            'description' => $fields['description'] ?? null,
            'contact_email' => $fields['contact_email'] ?? null,
            'photo_path' => $speaker->photo_path
        ]);

        // 2. Update Event-Specific Topic (if event_id provided)
        if ($request->filled('event_id')) {
            $event = Event::where('organizer_id', $request->user()->id)->find($request->event_id);
            if ($event) {
                // Check if attached, if not attach, if yes update pivot
                if (!$event->speakers()->where('speaker_id', $speaker->id)->exists()) {
                    $event->speakers()->attach($speaker->id, ['topic' => $request->topic ?? 'TBA']);
                } else {
                    $event->speakers()->updateExistingPivot($speaker->id, [
                        'topic' => $request->topic ?? 'TBA'
                    ]);
                }
            }
        }

        return response()->json(['message' => 'Speaker updated!', 'speaker' => $speaker]);
    }

    /**
     * Delete a speaker
     */
    public function destroy(Request $request, $id) {
        $speaker = Speaker::where('organizer_id', $request->user()->id)->findOrFail($id);

        if ($speaker->photo_path) Storage::disk('public')->delete($speaker->photo_path);
        // Deleting the speaker automatically removes them from the pivot table (event_speaker)
        $speaker->delete();

        return response()->json(['message' => 'Speaker removed']);
    }
}