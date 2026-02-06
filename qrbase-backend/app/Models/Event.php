<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    // Allows all columns to be mass-assigned (e.g. Event::create([...]))
    protected $guarded = [];

    // RELATIONSHIPS

    // An Event belongs to one Organizer (User)
    public function organizer() {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    // An Event has many Registrations (many people attending)
    public function registrations() {
        return $this->hasMany(Registration::class);
    }
}