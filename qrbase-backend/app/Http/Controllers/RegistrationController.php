<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Registration;
use App\Models\Event;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Hash;

class RegistrationController extends Controller
{
    public function join(Request $request) {
        $request->validate(['invite_code' => 'required']);
        $event = Event::where('invite_code', $request->invite_code)->first();
        if (!$event) return response()->json(['message' => 'Invalid Invite Code'], 404);

        $existing = Registration::where('event_id', $event->id)->where('user_id', $request->user()->id)->first();
        if ($existing) return response()->json(['message' => 'You have already joined this event.'], 400);

        if ($event->registrations()->count() >= $event->max_participants) {
            return response()->json(['message' => 'Event is full.'], 400);
        }

        $rawString = $request->user()->id . '-' . $event->id . '-' . now() . '-' . Str::random(32);
        $secureToken = hash('sha256', $rawString);

        $reg = Registration::create([
            'event_id' => $event->id,
            'user_id' => $request->user()->id,
            'status' => 'Confirmed',
            'qr_token' => $secureToken,
            'payment_status' => 'Unpaid'
        ]);

        return response()->json(['message' => 'Joined successfully!', 'ticket' => $reg]);
    }

    public function registerWalkIn(Request $request, $eventId) {
        if ($request->user()->role !== 'organizer') return response()->json(['message' => 'Unauthorized'], 403);
        
        $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email',
        ]);

        $tempPassword = 'walkin' . rand(1000, 9999);

        $user = User::firstOrCreate(
            ['email' => $request->email],
            [
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'password' => Hash::make($tempPassword),
                'role' => 'participant'
            ]
        );

        $existing = Registration::where('event_id', $eventId)->where('user_id', $user->id)->first();
        if ($existing) {
            $existing->update(['status' => 'Present', 'payment_status' => 'Paid']);
            return response()->json(['message' => 'User found. Status updated.', 'user' => $user, 'note' => 'Account existed.']);
        }

        Registration::create([
            'event_id' => $eventId,
            'user_id' => $user->id,
            'status' => 'Present',       
            'payment_status' => 'Paid',  
            'qr_token' => hash('sha256', Str::random(40))
        ]);

        return response()->json(['message' => 'Walk-in registered', 'user' => $user, 'temp_password' => $tempPassword]);
    }

    public function myTickets(Request $request) {
        $userId = $request->user()->id;
        return Registration::with(['event.speakers', 'event.organizer'])
            ->where('user_id', $userId)->latest()->get()
            ->each(function($reg) use ($userId) {
                $reg->has_feedback = DB::table('feedback_responses')->where('event_id', $reg->event_id)->where('user_id', $userId)->exists();
            });
    }

    public function updateStatus(Request $request, $id) {
        $reg = Registration::with('user')->findOrFail($id);
        
        $updateData = [];
        
        if($request->has('status')) $updateData['status'] = $request->status;
        if($request->has('payment_status')) $updateData['payment_status'] = $request->payment_status;
        if($request->has('proof_of_payment')) $updateData['proof_of_payment'] = $request->proof_of_payment;
        
        // Update POSITION directly on the Registration table now
        if($request->has('position')) $updateData['position'] = $request->position;
        
        if (!empty($updateData)) {
            $reg->update($updateData);
        }
        
        return response()->json(['message' => 'Participant details updated', 'registration' => $reg->fresh('user')]);
    }

    public function scan(Request $request, $id) {
        $request->validate(['code' => 'required']);
        
        $reg = Registration::where('qr_token', $request->code)->where('event_id', $id)->with('user')->first();
        if (!$reg && is_numeric($request->code)) {
             $reg = Registration::where('id', $request->code)->where('event_id', $id)->with('user')->first();
        }

        if (!$reg) return response()->json(['message' => 'Invalid Ticket'], 404);
        
        if ($reg->payment_status !== 'Paid' && $reg->payment_status !== 'Free') {
            return response()->json(['message' => 'Payment Not Confirmed!', 'user' => $reg->user], 402);
        }

        if ($reg->status === 'Present') return response()->json(['message' => 'Already Checked In', 'user' => $reg->user], 200);

        $reg->update(['status' => 'Present']);
        return response()->json(['message' => 'Check-in Successful!', 'user' => $reg->user]);
    }

    public function exportAttendance($eventId) {
        $registrations = Registration::with('user')->where('event_id', $eventId)->get();
        $feedbacks = DB::table('feedback_responses')->where('event_id', $eventId)->get()->keyBy('user_id');
        $form = DB::table('event_feedback_forms')->where('event_id', $eventId)->first();
        
        $questionsMap = [];
        if ($form) {
            $config = json_decode($form->questions, true);
            if (isset($config['global'])) { foreach ($config['global'] as $idx => $q) $questionsMap["global_{$idx}"] = "Event: " . $q['text']; }
            if (isset($config['speakers'])) { foreach ($config['speakers'] as $sid => $qs) { foreach ($qs as $idx => $q) $questionsMap["speaker_{$sid}_{$idx}"] = "Speaker {$sid}: " . $q['text']; } }
            $questionsMap['final_comments'] = "Final Comments";
        }

        $response = new StreamedResponse(function() use ($registrations, $feedbacks, $questionsMap) {
            $handle = fopen('php://output', 'w');
            
            $headers = ['Ticket ID', 'Name', 'Email', 'Position', 'Status', 'Payment', 'Proof of Trans.', 'Check-in Time'];
            foreach ($questionsMap as $qText) $headers[] = $qText;
            fputcsv($handle, $headers);

            foreach ($registrations as $reg) {
                $statusDisplay = $reg->status === 'Present' ? 'CHECKED IN' : $reg->status;
                
                $row = [
                    $reg->id,
                    $reg->user->first_name . ' ' . $reg->user->last_name,
                    $reg->user->email,
                    $reg->position ?? '-', // Look at registration position
                    $statusDisplay,
                    $reg->payment_status ?? 'Unpaid',
                    $reg->proof_of_payment ?? 'N/A',
                    $reg->updated_at->toDateTimeString()
                ];

                $userFeedback = isset($feedbacks[$reg->user_id]) ? json_decode($feedbacks[$reg->user_id]->responses, true) : [];
                foreach ($questionsMap as $key => $label) {
                    $row[] = $userFeedback[$key] ?? '-';
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