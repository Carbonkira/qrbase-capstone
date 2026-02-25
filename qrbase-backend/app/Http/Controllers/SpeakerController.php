<?php

namespace App\Http\Controllers;

use App\Models\Speaker;
use App\Models\Event;
use Illuminate\Http\Request;
use Cloudinary\Cloudinary; // <-- IMPORT NATIVE SDK

class SpeakerController extends Controller
{
    public function index(Request $request) {
        return Speaker::where('organizer_id', $request->user()->id)->latest()->get();
    }

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

        // --- THE ULTIMATE BYPASS ---
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $cloudinary = new Cloudinary('cloudinary://785553928652788:CBMFldO9HDKUF3H3ZiMeG9i5sDY@dyxszia6d');
            $upload = $cloudinary->uploadApi()->upload($request->file('photo')->getRealPath(), ['folder' => 'speakers']);
            $photoPath = $upload['secure_url'];
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

    public function update(Request $request, $id) {
        $speaker = Speaker::where('organizer_id', $request->user()->id)->findOrFail($id);
        $fields = $request->validate([
            'name' => 'required|string',
            'specialization' => 'required|string',
            'description' => 'nullable|string',
            'contact_email' => 'nullable|email',
            'photo' => 'nullable|image|max:2048',
            'event_id' => 'nullable|exists:events,id',
            'topic' => 'nullable|string'
        ]);

        // --- THE ULTIMATE BYPASS ---
        if ($request->hasFile('photo')) {
            $cloudinary = new Cloudinary('cloudinary://785553928652788:CBMFldO9HDKUF3H3ZiMeG9i5sDY@dyxszia6d');
            $upload = $cloudinary->uploadApi()->upload($request->file('photo')->getRealPath(), ['folder' => 'speakers']);
            $speaker->photo_path = $upload['secure_url'];
        }

        $speaker->update([
            'name' => $fields['name'],
            'specialization' => $fields['specialization'],
            'description' => $fields['description'] ?? null,
            'contact_email' => $fields['contact_email'] ?? null,
            'photo_path' => $speaker->photo_path
        ]);

        if ($request->filled('event_id')) {
            $event = Event::where('organizer_id', $request->user()->id)->find($request->event_id);
            if ($event) {
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

    public function destroy(Request $request, $id) {
        $speaker = Speaker::where('organizer_id', $request->user()->id)->findOrFail($id);
        $speaker->delete();

        return response()->json(['message' => 'Speaker removed']);
    }
}