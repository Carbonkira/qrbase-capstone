<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Registration;
use App\Models\Event;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RegistrationController extends Controller
{
    /**
     * Participant: Join an event (Generates Secure QR)
     */
    public function join(Request $request) {
        $request->validate(['invite_code' => 'required']);

        $event = Event::where('invite_code', $request->invite_code)->first();

        if (!$event) {
            return response()->json(['message' => 'Invalid Invite Code'], 404);
        }

        $existing = Registration::where('event_id', $event->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already joined this event.'], 400);
        }

        if ($event->registrations()->count() >= $event->max_participants) {
            return response()->json(['message' => 'Event is full.'], 400);
        }

        // GENERATE COMPLEX UNIQUE TOKEN
        // Combines UserID, EventID, Timestamp, and Random String, then Hashes it
        $rawString = $request->user()->id . '-' . $event->id . '-' . now() . '-' . Str::random(32);
        $secureToken = hash('sha256', $rawString);

        $reg = Registration::create([
            'event_id' => $event->id,
            'user_id' => $request->user()->id,
            'status' => 'Confirmed',
            'qr_token' => $secureToken // Save the secure token
        ]);

        return response()->json(['message' => 'Joined successfully!', 'ticket' => $reg]);
    }

    /**
     * Participant: Get My Tickets
     */
    public function myTickets(Request $request) {
        $userId = $request->user()->id;

        return Registration::with(['event.speakers', 'event.organizer'])
            ->where('user_id', $userId)
            ->latest()
            ->get()
            ->each(function($reg) use ($userId) {
                $reg->has_feedback = \Illuminate\Support\Facades\DB::table('feedback_responses')
                    ->where('event_id', $reg->event_id)
                    ->where('user_id', $userId)
                    ->exists();
            });
    }

    /**
     * Admin: Update Status
     */
    public function updateStatus(Request $request, $id) {
        $request->validate(['status' => 'required|in:Present,Absent,Confirmed,Pending']);
        $reg = Registration::findOrFail($id);
        $reg->update(['status' => $request->status]);
        return response()->json(['message' => 'Status updated', 'registration' => $reg]);
    }

    /**
     * Admin: Scan Ticket (Updated for Secure Token)
     */
    public function scan(Request $request, $id) {
        $request->validate(['code' => 'required']);

        // 1. Try finding by Secure Token first (Priority)
        $reg = Registration::where('qr_token', $request->code)
            ->where('event_id', $id)
            ->with('user')
            ->first();

        // 2. Fallback: If not found, try Manual ID Entry (for backup manual check-in)
        if (!$reg && is_numeric($request->code)) {
             $reg = Registration::where('id', $request->code)
                ->where('event_id', $id)
                ->with('user')
                ->first();
        }

        if (!$reg) {
            return response()->json(['message' => 'Invalid Ticket or Wrong Event'], 404);
        }

        if ($reg->status === 'Present') {
            return response()->json(['message' => 'Already Checked In', 'user' => $reg->user], 200);
        }

        $reg->update(['status' => 'Present']);
        
        return response()->json(['message' => 'Check-in Successful!', 'user' => $reg->user]);
    }

    /**
     * Admin: Export Attendance & Feedback to CSV
     */
    public function exportAttendance($eventId) {
        // Fetch all registrations with user data
        $registrations = Registration::with('user')
            ->where('event_id', $eventId)
            ->get();

        // Fetch Feedback Data
        $feedbacks = DB::table('feedback_responses')
            ->where('event_id', $eventId)
            ->get()
            ->keyBy('user_id');

        // Fetch Form Structure to Map Answers (e.g. "global_0" -> "How was the food?")
        $form = DB::table('event_feedback_forms')->where('event_id', $eventId)->first();
        $questionsMap = [];
        if ($form) {
            $config = json_decode($form->questions, true);
            // Map Global Questions
            if (isset($config['global'])) {
                foreach ($config['global'] as $idx => $q) {
                    $questionsMap["global_{$idx}"] = "Event: " . $q['text'];
                }
            }
            // Map Speaker Questions
            if (isset($config['speakers'])) {
                foreach ($config['speakers'] as $speakerId => $questions) {
                    foreach ($questions as $idx => $q) {
                        $questionsMap["speaker_{$speakerId}_{$idx}"] = "Speaker {$speakerId}: " . $q['text'];
                    }
                }
            }
            $questionsMap['final_comments'] = "Final Comments";
        }

        // CSV Response
        $response = new StreamedResponse(function() use ($registrations, $feedbacks, $questionsMap) {
            $handle = fopen('php://output', 'w');

            // 1. CSV Headers
            $headers = ['Ticket ID', 'Name', 'Email', 'Status', 'Check-in Time'];
            foreach ($questionsMap as $qText) {
                $headers[] = $qText; // Add question text as header
            }
            fputcsv($handle, $headers);

            // 2. CSV Rows
            foreach ($registrations as $reg) {
                // --- UPDATE: Format Status Logic ---
                $statusDisplay = $reg->status;
                if ($statusDisplay === 'Present') {
                    $statusDisplay = 'CHECKED IN';
                } elseif ($statusDisplay === 'Confirmed') {
                    $statusDisplay = 'Registered (Not Present)';
                }

                $row = [
                    $reg->id,
                    $reg->user->first_name . ' ' . $reg->user->last_name,
                    $reg->user->email,
                    $statusDisplay, // Use the formatted status
                    $reg->updated_at->toDateTimeString()
                ];

                // Add Feedback Answers
                $userFeedback = isset($feedbacks[$reg->user_id]) 
                    ? json_decode($feedbacks[$reg->user_id]->responses, true) 
                    : [];

                foreach ($questionsMap as $key => $label) {
                    $row[] = $userFeedback[$key] ?? '-'; // Add answer or dash
                }

                fputcsv($handle, $row);
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="attendance_report.csv"');

        return $response;
    }
}