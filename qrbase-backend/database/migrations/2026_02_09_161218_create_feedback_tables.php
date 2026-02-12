<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Table for the Form Structure (Questions created by Organizer)
        Schema::create('event_feedback_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->json('questions'); // Stores the config { global: [], speakers: {} }
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Table for Participant Answers
        Schema::create('feedback_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->json('responses'); // Stores answers { global_0: "Good", speaker_1_0: 5 }
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_responses');
        Schema::dropIfExists('event_feedback_forms');
    }
};