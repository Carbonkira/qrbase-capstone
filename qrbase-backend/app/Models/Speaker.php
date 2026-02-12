<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Speaker extends Model
{
    use HasFactory;

    protected $fillable = [
        'organizer_id',
        'name',
        'specialization',
        'contact_email',
        'description',
        'photo_path'
    ];

    public function events()
    {
        return $this->belongsToMany(Event::class, 'event_speaker')
                    ->withPivot('topic')
                    ->withTimestamps();
    }
}