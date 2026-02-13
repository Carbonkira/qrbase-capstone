<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Get Authenticated User Details
     */
    public function index(Request $request) {
        return response()->json($request->user());
    }

    /**
     * Update User Profile
     */
    public function updateProfile(Request $request) {
        $user = $request->user();
        
        $validated = $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'contact_number' => 'nullable|string',
        ]);

        $user->update($validated);

        return response()->json(['message' => 'Profile updated successfully!', 'user' => $user]);
    }

    /**
     * Change User Password
     */
    public function changePassword(Request $request) {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed', // Must match 'new_password_confirmation'
        ]);

        $user = $request->user();

        // 1. Verify Current Password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 400);
        }

        // 2. Update Password
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json(['message' => 'Password changed successfully!']);
    }
}