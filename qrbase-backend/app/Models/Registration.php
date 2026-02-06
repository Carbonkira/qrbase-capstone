<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Registration extends Model
{
    use HasFactory;

    protected $guarded = [];

    // RELATIONSHIPS

    // A Registration belongs to one Event
    public function event() {
        return $this->belongsTo(Event::class);
    }

    // A Registration belongs to one User (the participant)
    public function user() {
        return $this->belongsTo(User::class);
    }

    // Optional: A Registration has one Attendance record (if checked in)
    public function attendance() {
        return $this->hasOne(Attendance::class);
    }
}