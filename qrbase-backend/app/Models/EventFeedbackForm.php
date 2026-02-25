<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventFeedbackForm extends Model
{
    use HasFactory;

    protected $fillable = ['event_id', 'questions'];

    // CRITICAL: This tells Laravel to convert the JSON to an Array automatically
    protected $casts = [
        'questions' => 'array',
    ];

    public function event() {
        return $this->belongsTo(Event::class);
    }
}