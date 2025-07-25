<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'role',
        'full_name',
        'email',
        'phone',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<string>
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
            // Password hashing handled manually in seeders
        ];
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    /**
     * Get the salon owned by the user (for owners).
     */
    public function salon()
    {
        return $this->hasOne(Salon::class, 'owner_id');
    }

    /**
     * Get the employee records associated with the user (owner).
     */
    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * Get the reservations for the user (as client).
     */
    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'client_id');
    }

    /**
     * Get the salons this user is associated with (as client)
     */
    public function salons()
    {
        return $this->belongsToMany(Salon::class, 'user_salons')
                    ->withPivot(['registered_at', 'last_visit', 'status'])
                    ->withTimestamps();
    }

    /**
     * Get active salon associations
     */
    public function activeSalons()
    {
        return $this->salons()->wherePivot('status', 'ACTIVE');
    }

    /**
     * Get the user-salon associations
     */
    public function userSalons()
    {
        return $this->hasMany(UserSalon::class);
    }

    /**
     * Associate user with a salon
     */
    public function associateWithSalon(int $salonId): UserSalon
    {
        return UserSalon::firstOrCreate(
            [
                'user_id' => $this->id,
                'salon_id' => $salonId,
            ],
            [
                'registered_at' => now(),
                'status' => 'ACTIVE',
            ]
        );
    }

    /**
     * Check if user is associated with a salon
     */
    public function isAssociatedWithSalon(int $salonId): bool
    {
        return $this->userSalons()
                    ->where('salon_id', $salonId)
                    ->where('status', 'ACTIVE')
                    ->exists();
    }
}
