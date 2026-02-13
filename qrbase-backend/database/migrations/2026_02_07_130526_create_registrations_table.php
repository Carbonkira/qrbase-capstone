<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::create('registrations', function (Blueprint $table) {
        $table->id();
        $table->foreignId('event_id')->constrained()->onDelete('cascade');
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        
        $table->enum('status', ['Pending', 'Confirmed', 'Present', 'Absent', 'Completed', 'Waitlisted'])->default('Pending');
        $table->enum('payment_status', ['Unpaid', 'Pending', 'Paid', 'Free'])->default('Unpaid');
        $table->string('proof_of_payment')->nullable();
        
        $table->string('position')->nullable(); // <--- ADD IT HERE
        $table->string('qr_token')->unique()->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};