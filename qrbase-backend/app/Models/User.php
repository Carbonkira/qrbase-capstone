<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // <--- Import Sanctum

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable; // <--- Add HasApiTokens here

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'role', // 'organizer' or 'participant'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // RELATIONSHIPS

    // A User (Organizer) can create many Events
    public function events() {
        return $this->hasMany(Event::class, 'organizer_id');
    }

    // A User (Participant) can have many Registrations
    public function registrations() {
        return $this->hasMany(Registration::class);
    }
}